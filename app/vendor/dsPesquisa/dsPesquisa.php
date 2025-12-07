<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

/**
 * Utilitários gerais do dsPesquisa, encapsulados em uma classe estática.
 */
class dsUtil
{
    /**
     * Raiz da aplicação (sobe 2 níveis a partir de vendor/dsPesquisa/dsPesquisa.php).
     */
    public static function getAppBaseDir(): string
    {
        $baseDir = dirname(__DIR__, 2);
        return is_dir($baseDir) ? $baseDir : __DIR__;
    }

    /**
     * Monta a URL HTTP da aplicação a partir de um path relativo.
     * Ex.: "php/fotocrimConfig.php?tipo=viewConfig"
     */
    public static function makeAppUrl(string $relativePath): string
    {
        $relativePath = ltrim($relativePath, '/');

        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';

        $scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
        $scriptDir = rtrim(str_replace('\\', '/', $scriptDir), '/');

        // Remove o "/vendor/dsPesquisa" do final pra voltar à raiz da app
        $appBase = preg_replace('#/vendor/dsPesquisa$#', '', $scriptDir);
        $appBase = rtrim($appBase, '/');

        $path = $appBase === '' ? '/' . $relativePath : $appBase . '/' . $relativePath;

        return $scheme . '://' . $host . $path;
    }

    /**
     * Valida nomes de campos/tabelas para evitar injection em identificadores.
     */
    public static function sanitizeFieldName(string $name): ?string
    {
        $name = trim($name);
        if ($name === '') {
            return null;
        }
        if (!preg_match('/^[A-Za-z0-9_\.]+$/', $name)) {
            return null;
        }
        return $name;
    }

    /**
     * Carrega a config da view (viewConfig/tableConfig) a partir de:
     *  - dsPesquisaConfig.php (map: viewName => endpoint)
     *  - endpoint HTTP do módulo (ex.: fotocrimConfig.php?tipo=viewConfig)
     *
     * IMPORTANTE: aqui não há conexão; só metadados da view.
     */
    public static function loadConfig(string $viewName, string $endpointConfig): array
    {
        if ($endpointConfig === '') {
            throw new RuntimeException("endpointConfig ausente.");
        }
        if ($viewName === '') {
            throw new RuntimeException("viewName ausente.");
        }

        $baseDir        = self::getAppBaseDir();
        $configFullPath = $baseDir . DIRECTORY_SEPARATOR . ltrim($endpointConfig, '/\\');

        if (!file_exists($configFullPath)) {
            throw new RuntimeException("Arquivo de config '$endpointConfig' não encontrado.");
        }

        // dsPesquisaConfig.php deve retornar o mapa de views (sem $__pdo no return)
        $map = require $configFullPath;
        if (!is_array($map)) {
            throw new RuntimeException("dsPesquisaConfig.php deve retornar um array.");
        }

        if (!isset($map[$viewName])) {
            throw new RuntimeException("View '$viewName' não mapeada em dsPesquisaConfig.php.");
        }

        $endpoint = (string) $map[$viewName];
        if ($endpoint === '') {
            throw new RuntimeException("Endpoint vazio na config da view '$viewName'.");
        }

        $url  = self::makeAppUrl($endpoint);
        $json = @file_get_contents($url);

        if ($json === false) {
            throw new RuntimeException("Falha ao acessar endpoint '$url'.");
        }

        $decoded = json_decode($json, true);
        if (!is_array($decoded)) {
            throw new RuntimeException("Resposta inválida do endpoint '$url'.");
        }

        $cfg = $decoded['data'] ?? $decoded['viewConfig'] ?? null;
        if (!is_array($cfg)) {
            throw new RuntimeException("Config da view não encontrada no endpoint '$url'.");
        }

        return $cfg;
    }

    /**
     * Obtém o PDO a partir do dsPesquisaConfig.php.
     *
     * dsPesquisaConfig.php:
     *   require_once __DIR__ . '/db.php';
     *   $__pdo = db(); // ou minhaConexao();
     *   return [ 'viewFotocrim' => 'php/fotocrimConfig.php?tipo=viewConfig', ... ];
     */
    public static function getPdoFromConfig(string $endpointConfig): PDO
    {
        if ($endpointConfig === '') {
            throw new RuntimeException("endpointConfig ausente.");
        }

        $baseDir        = self::getAppBaseDir();
        $configFullPath = $baseDir . DIRECTORY_SEPARATOR . ltrim($endpointConfig, '/\\');

        if (!file_exists($configFullPath)) {
            throw new RuntimeException("Arquivo de config '$endpointConfig' não encontrado.");
        }

        unset($__pdo); // evita sujeira de execuções anteriores

        require $configFullPath;

        if (!isset($__pdo) || !$__pdo instanceof PDO) {
            throw new RuntimeException("Variável \$__pdo não definida ou inválida em dsPesquisaConfig.php.");
        }

        return $__pdo;
    }

    /**
     * Interpreta um valor de data "simples" e devolve intervalo [fromYmd, toYmd].
     *
     * Regras:
     *  - "1" ou "01"         => dia 01 do mês/ano correntes
     *  - "01/05"             => 01/05 do ANO corrente
     *  - "05/2025"           => mês 05 do ano 2025 (mês inteiro)
     *  - "2025"              => ano inteiro 2025
     *  - "01/05/2025"        => dia exato 01/05/2025
     */
    public static function parseSingleDateToken(string $value): ?array
    {
        $value = trim($value);
        if ($value === '') {
            return null;
        }

        $now = new DateTimeImmutable('now');
        $cy  = (int)$now->format('Y');
        $cm  = (int)$now->format('m');

        // 01/05/2025
        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $value, $m)) {
            $d   = (int)$m[1];
            $mth = (int)$m[2];
            $y   = (int)$m[3];

            $dt = DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%04d-%02d-%02d', $y, $mth, $d));
            if (!$dt) {
                return null;
            }
            $ymd = $dt->format('Y-m-d');
            return [$ymd, $ymd];
        }

        // 05/2025  → mês/ano
        if (preg_match('/^(\d{1,2})\/(\d{4})$/', $value, $m)) {
            $mth = (int)$m[1];
            $y   = (int)$m[2];

            $first = DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%04d-%02d-01', $y, $mth));
            if (!$first) {
                return null;
            }
            $last = $first->modify('last day of this month');
            return [$first->format('Y-m-d'), $last->format('Y-m-d')];
        }

        // 01/05  → dia/mês do ano corrente
        if (preg_match('/^(\d{1,2})\/(\d{1,2})$/', $value, $m)) {
            $d   = (int)$m[1];
            $mth = (int)$m[2];
            $dt  = DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%04d-%02d-%02d', $cy, $mth, $d));
            if (!$dt) {
                return null;
            }
            $ymd = $dt->format('Y-m-d');
            return [$ymd, $ymd];
        }

        // 1 ou 01 → dia do mês/ano correntes
        if (preg_match('/^(\d{1,2})$/', $value, $m)) {
            $d  = (int)$m[1];
            $dt = DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%04d-%02d-%02d', $cy, $cm, $d));
            if (!$dt) {
                return null;
            }
            $ymd = $dt->format('Y-m-d');
            return [$ymd, $ymd];
        }

        // 2025 → ano inteiro
        if (preg_match('/^(\d{4})$/', $value, $m)) {
            $y = (int)$m[1];
            $from = DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%04d-01-01', $y));
            $to   = DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%04d-12-31', $y));
            if (!$from || !$to) {
                return null;
            }
            return [$from->format('Y-m-d'), $to->format('Y-m-d')];
        }

        return null;
    }

    /**
     * Interpreta um intervalo de datas "left..right" e devolve [fromYmd, toYmd].
     *
     * Regras:
     *  - "01..05"         → dia 01 ao 05 do mês/ano correntes
     *  - "05..06/2025"    → dia 05 do mês/ano correntes até último dia de 06/2025
     */
    public static function parseDateIntervalTokens(string $left, string $right): ?array
    {
        $left  = trim($left);
        $right = trim($right);
        if ($left === '' || $right === '') {
            return null;
        }

        $now = new DateTimeImmutable('now');
        $cy  = (int)$now->format('Y');
        $cm  = (int)$now->format('m');

        // 01..05 (dias do mesmo mês/ano correntes)
        if (preg_match('/^(\d{1,2})$/', $left, $m1) && preg_match('/^(\d{1,2})$/', $right, $m2)) {
            $d1 = (int)$m1[1];
            $d2 = (int)$m2[1];
            if ($d1 > $d2) {
                [$d1, $d2] = [$d2, $d1];
            }

            $from = DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%04d-%02d-%02d', $cy, $cm, $d1));
            $to   = DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%04d-%02d-%02d', $cy, $cm, $d2));
            if (!$from || !$to) {
                return null;
            }
            return [$from->format('Y-m-d'), $to->format('Y-m-d')];
        }

        // 05..06/2025 (dia do mês/ano correntes até fim de mês/ano específico)
        if (preg_match('/^(\d{1,2})$/', $left, $mL) && preg_match('/^(\d{1,2})\/(\d{4})$/', $right, $mR)) {
            $d1 = (int)$mL[1];
            $m2 = (int)$mR[1];
            $y2 = (int)$mR[2];

            $from = DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%04d-%02d-%02d', $cy, $cm, $d1));
            if (!$from) {
                return null;
            }

            $firstDayEnd = DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%04d-%02d-01', $y2, $m2));
            if (!$firstDayEnd) {
                return null;
            }
            $lastDayEnd  = $firstDayEnd->modify('last day of this month');

            return [$from->format('Y-m-d'), $lastDayEnd->format('Y-m-d')];
        }

        // Fallback genérico:
        // Tenta interpretar cada lado com parseSingleDateToken(), usando o início do lado
        // esquerdo e o fim do lado direito como limites globais.
        $leftRange  = self::parseSingleDateToken($left);
        $rightRange = self::parseSingleDateToken($right);
        if ($leftRange && $rightRange) {
            [$lfFrom, $lfTo] = $leftRange;
            [$rtFrom, $rtTo] = $rightRange;

            // Em ordem "natural": início = from do esquerdo, fim = to do direito,
            // se isso fizer sentido cronológico.
            if ($lfFrom <= $rtTo) {
                $start = $lfFrom;
                $end   = $rtTo;
            } else {
                // Usuário inverteu a ordem; garante intervalo cobrindo ambos lados.
                $start = $rtFrom;
                $end   = $lfTo;
            }

            if ($start > $end) {
                [$start, $end] = [$end, $start];
            }

            return [$start, $end];
        }

        return null;
    }

    /**
     * Monta condição de UM campo da pesquisaPorCampo, com suporte a listas separadas
     * por vírgula (OR) e delega para buildCampoConditionSingle por item.
     *
     * Ex.: "1,2,5"  → cond(1) OR cond(2) OR cond(5)
     */
    public static function buildCampoCondition(
        string $col,
        string $rawValue,
        string $fieldType,
        int $campoIdx,
        array &$params
    ): ?string {
        $value = trim($rawValue);
        if ($value === '') {
            return null;
        }

        // Listas separadas por vírgula → OR entre subcondições
        if (strpos($value, ',') !== false) {
            $parts = array_filter(array_map('trim', explode(',', $value)), 'strlen');
            if (!$parts) {
                return null;
            }

            $subConds = [];
            $alt      = 0;

            foreach ($parts as $p) {
                $alt++;
                // ajusta índice pra evitar colisão de parâmetros
                $single = self::buildCampoConditionSingle($col, $p, $fieldType, ($campoIdx * 100) + $alt, $params);
                if ($single !== null) {
                    $subConds[] = $single;
                }
            }

            if (!$subConds) {
                return null;
            }

            return '(' . implode(' OR ', $subConds) . ')';
        }

        // Sem vírgulas, trata como um valor único
        return self::buildCampoConditionSingle($col, $value, $fieldType, $campoIdx, $params);
    }

    /**
     * Condição de um campo para UM valor (sem vírgulas).
     * Aplica:
     *  - datas/intervalos (date/datetime/timestamp)
     *  - intervalo genérico "a..b"
     *  - "frase exata"
     *  - -palavra   → NOT LIKE
     *  - palavra    → LIKE
     */
    protected static function buildCampoConditionSingle(
        string $col,
        string $value,
        string $fieldType,
        int $campoIdx,
        array &$params
    ): ?string {
        $value = trim($value);
        if ($value === '') {
            return null;
        }

        $fieldTypeLower = strtolower($fieldType);
        $isDateType     = in_array($fieldTypeLower, ['date', 'datetime', 'timestamp'], true);

        // Datas primeiro
        if ($isDateType) {
            $cond = self::buildDateCondition($col, $value, $fieldTypeLower, $campoIdx, $params);
            if ($cond !== null) {
                return $cond;
            }
        }

        // Intervalo genérico para não-data: "valor1..valor2"
        if (!$isDateType && strpos($value, '..') !== false && substr_count($value, '"') === 0) {
            [$v1, $v2] = explode('..', $value, 2);
            $v1 = trim((string)$v1);
            $v2 = trim((string)$v2);

            if ($v1 !== '' && $v2 !== '') {
                $p1 = ':c' . $campoIdx . '_i1';
                $p2 = ':c' . $campoIdx . '_i2';

                $params[$p1] = $v1;
                $params[$p2] = $v2;

                return sprintf("`%s` BETWEEN %s AND %s", $col, $p1, $p2);
            }
        }

        // Frases / negativas / palavras soltas
        $tokens = [];
        if (preg_match_all('/"([^"]+)"|(\S+)/u', $value, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $m) {
                if ($m[1] !== '') {
                    $tokens[] = ['kind' => 'phrase', 'value' => $m[1]];
                } else {
                    $t = $m[2];
                    if (strlen($t) > 1 && $t[0] === '-') {
                        $tokens[] = ['kind' => 'neg', 'value' => substr($t, 1)];
                    } else {
                        $tokens[] = ['kind' => 'word', 'value' => $t];
                    }
                }
            }
        }

        $parts = [];
        $idx   = 0;

        foreach ($tokens as $tk) {
            $word = trim((string)$tk['value']);
            if ($word === '') {
                continue;
            }
            $idx++;
            $p = ':c' . $campoIdx . '_w' . $idx;

            if ($tk['kind'] === 'neg') {
                $parts[]    = sprintf("`%s` NOT LIKE %s", $col, $p);
                $params[$p] = '%' . $word . '%';
            } else {
                $parts[]    = sprintf("`%s` LIKE %s", $col, $p);
                $params[$p] = '%' . $word . '%';
            }
        }

        if (!$parts) {
            return null;
        }

        return '(' . implode(' AND ', $parts) . ')';
    }

    /**
     * Condição específica para campos de data/datetime.
     */
    protected static function buildDateCondition(
        string $col,
        string $value,
        string $fieldTypeLower,
        int $campoIdx,
        array &$params
    ): ?string {
        $value = trim($value);
        if ($value === '') {
            return null;
        }

        $isDateTime = in_array($fieldTypeLower, ['datetime', 'timestamp'], true);

        // Intervalo "left..right"
        if (strpos($value, '..') !== false && substr_count($value, '"') === 0) {
            [$left, $right] = explode('..', $value, 2);
            $range = self::parseDateIntervalTokens((string)$left, (string)$right);
            if ($range) {
                [$fromYmd, $toYmd] = $range;
                $p1 = ':c' . $campoIdx . '_d1';
                $p2 = ':c' . $campoIdx . '_d2';

                if ($isDateTime) {
                    $params[$p1] = $fromYmd . ' 00:00:00';
                    $params[$p2] = $toYmd   . ' 23:59:59';
                } else {
                    $params[$p1] = $fromYmd;
                    $params[$p2] = $toYmd;
                }

                return sprintf("`%s` BETWEEN %s AND %s", $col, $p1, $p2);
            }
        }

        // Data simples (dia, dia/mês, mês/ano, ano, dia/mês/ano)
        $range = self::parseSingleDateToken($value);
        if ($range) {
            [$fromYmd, $toYmd] = $range;
            $p1 = ':c' . $campoIdx . '_d1';
            $p2 = ':c' . $campoIdx . '_d2';

            if ($isDateTime) {
                $params[$p1] = $fromYmd . ' 00:00:00';
                $params[$p2] = $toYmd   . ' 23:59:59';
            } else {
                $params[$p1] = $fromYmd;
                $params[$p2] = $toYmd;
            }

            return sprintf("`%s` BETWEEN %s AND %s", $col, $p1, $p2);
        }

        return null;
    }
}

/* ============================================================
   Roteamento da ação
   ============================================================ */

$action = $_POST['action'] ?? '';

switch ($action) {
    case 'getConfig':
        getConfig();
        break;

    case 'pesquisar':
        pesquisar();
        break;

    default:
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Ação inválida ou não informada.'
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
}

/* ============================================================
   AÇÃO: getConfig
   ============================================================ */
function getConfig(): void
{
    try {
        $viewName       = trim((string)($_POST['viewName']        ?? ''));
        $endpointConfig = trim((string)($_POST['endpointConfig']  ?? ''));

        $cfg = dsUtil::loadConfig($viewName, $endpointConfig);

        echo json_encode([
            'success'    => true,
            'message'    => '',
            'viewConfig' => $cfg,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage(),
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    exit;
}

/* ============================================================
   AÇÃO: pesquisar
   ============================================================ */
function pesquisar(): void
{
    try {
        $viewName       = trim((string)($_POST['viewName']        ?? ''));
        $endpointConfig = trim((string)($_POST['endpointConfig']  ?? ''));
        $pesqGlobal     = trim((string)($_POST['pesquisaGlobal']  ?? ''));
        $pesqCamposJson = (string)($_POST['pesquisaPorCampo']     ?? '{}');
        $orderByPost    = trim((string)($_POST['orderBy']         ?? ''));

        $pesqCampos = json_decode($pesqCamposJson, true);
        if (!is_array($pesqCampos)) {
            $pesqCampos = [];
        }

        $cfg = dsUtil::loadConfig($viewName, $endpointConfig);
        $pdo = dsUtil::getPdoFromConfig($endpointConfig);

        // Tabela/view base
        $table = (string)($cfg['from'] ?? $cfg['tableName'] ?? $cfg['viewName'] ?? $viewName);
        $table = dsUtil::sanitizeFieldName($table) ?? $viewName;

        // PK
        $pk = (string)($cfg['primaryKey'] ?? 'id');
        $pk = dsUtil::sanitizeFieldName($pk) ?? 'id';

        // LIMIT
        $limit = isset($cfg['limitDefault'])
            ? (int)$cfg['limitDefault']
            : (isset($cfg['limit']) ? (int)$cfg['limit'] : 50);
        if ($limit <= 0) {
            $limit = 50;
        }

        // ORDER BY padrão da view
        $orderBy = '';
        if (!empty($cfg['orderByDefault']) && is_string($cfg['orderByDefault'])) {
            $orderBy = $cfg['orderByDefault'];
        } elseif (!empty($cfg['orderBy']) && is_string($cfg['orderBy'])) {
            $orderBy = $cfg['orderBy'];
        }

        // Campos
        $fieldsCfg = $cfg['fields'] ?? [];
        if (!is_array($fieldsCfg)) {
            $fieldsCfg = [];
        }

        $allFields          = [];
        $globalSearchFields = [];
        $fieldTypes         = [];

        foreach ($fieldsCfg as $f) {
            if (!is_array($f)) {
                continue;
            }

            $name = isset($f['name']) ? (string)$f['name'] : '';
            $col  = dsUtil::sanitizeFieldName($name);
            if ($col === null) {
                continue;
            }

            $allFields[] = $col;

            $fieldType = strtolower((string)($f['type'] ?? 'text'));
            $fieldTypes[$col] = $fieldType;

            $searchGlobal = $f['searchGlobal'] ?? $f['search_global'] ?? null;
            if ($searchGlobal === null || $searchGlobal === true || $searchGlobal === 1 || $searchGlobal === '1') {
                $globalSearchFields[] = $col;
            }
        }

        if (!$globalSearchFields && $allFields) {
            $globalSearchFields = $allFields;
        }

        // ORDER BY do front
        if ($orderByPost !== '') {
            if (preg_match('/^([A-Za-z0-9_\.]+)\s+(ASC|DESC)$/i', $orderByPost, $m)) {
                $campo   = dsUtil::sanitizeFieldName($m[1]);
                $dir     = strtoupper($m[2]);
                $isValid = $campo !== null && (in_array($campo, $allFields, true) || $campo === $pk);

                if ($isValid && ($dir === 'ASC' || $dir === 'DESC')) {
                    $orderBy = sprintf('`%s` %s', $campo, $dir);
                }
            }
        }

        // WHERE dinâmico
        $conditions = [];
        $params     = [];
        $hasGlobal  = $pesqGlobal !== '';
        $hasCampos  = false;

        // GLOBAL: palavras AND, campos OR
        if ($hasGlobal && $globalSearchFields) {
            $words   = preg_split('/\s+/', $pesqGlobal);
            $wordIdx = 0;

            foreach ($words as $w) {
                $w = trim($w);
                if ($w === '') {
                    continue;
                }
                $wordIdx++;

                $orParts  = [];
                $fieldIdx = 0;

                foreach ($globalSearchFields as $col) {
                    $fieldIdx++;
                    $paramName = ':g' . $wordIdx . '_' . $fieldIdx;

                    $orParts[]          = "`$col` LIKE $paramName";
                    $params[$paramName] = '%' . $w . '%';
                }

                if ($orParts) {
                    $conditions[] = '(' . implode(' OR ', $orParts) . ')';
                }
            }
        }

        // POR CAMPO
        if (!empty($pesqCampos)) {
            $validFields = [];
            foreach ($allFields as $col) {
                $validFields[$col] = true;
            }

            $campoIdx = 0;

            foreach ($pesqCampos as $fieldName => $value) {
                $value = trim((string)$value);
                if ($value === '') {
                    continue;
                }

                $col = dsUtil::sanitizeFieldName((string)$fieldName);
                if ($col === null || !isset($validFields[$col])) {
                    continue;
                }

                $hasCampos = true;
                $campoIdx++;

                $fieldType = strtolower((string)($fieldTypes[$col] ?? 'text'));

                $fieldCond = dsUtil::buildCampoCondition($col, $value, $fieldType, $campoIdx, $params);

                if ($fieldCond !== null) {
                    $conditions[] = $fieldCond;
                }
            }
        }

        // fixedFilters
        $fixedFilters = $cfg['fixedFilters'] ?? [];
        if (is_string($fixedFilters)) {
            $fixedFilters = [$fixedFilters];
        }
        if (is_array($fixedFilters)) {
            foreach ($fixedFilters as $frag) {
                $frag = trim((string)$frag);
                if ($frag === '') {
                    continue;
                }
                $conditions[] = '(' . $frag . ')';
            }
        }

        // defaultFilters / fallback MAX(PK)
        if (!$hasGlobal && !$hasCampos) {
            $defaultFilters = $cfg['defaultFilters'] ?? [];
            if (is_string($defaultFilters)) {
                $defaultFilters = [$defaultFilters];
            }

            if (is_array($defaultFilters) && $defaultFilters) {
                foreach ($defaultFilters as $frag) {
                    $frag = trim((string)$frag);
                    if ($frag === '') {
                        continue;
                    }
                    $conditions[] = '(' . $frag . ')';
                }
            } else {
                $conditions[] = sprintf(
                    "`%s` = (SELECT MAX(`%s`) FROM `%s`)",
                    $pk,
                    $pk,
                    $table
                );
            }
        }

        $whereSql = $conditions ? ' WHERE ' . implode(' AND ', $conditions) : '';

        // ORDER BY final
        $orderSql = $orderBy !== ''
            ? ' ORDER BY ' . $orderBy
            : ' ORDER BY `' . $pk . '` DESC';

        // total geral
        $sqlTotal  = "SELECT COUNT(*) AS c FROM `$table`";
        $stmtTotal = $pdo->query($sqlTotal);
        $totalReg  = (int)($stmtTotal ? $stmtTotal->fetchColumn() : 0);

        // total pesquisa
        $sqlCount  = "SELECT COUNT(*) AS c FROM `$table`" . $whereSql;
        $stmtCount = $pdo->prepare($sqlCount);
        $stmtCount->execute($params);
        $totalPesquisa = (int)$stmtCount->fetchColumn();

        // dados
        $sqlData  = "SELECT * FROM `$table`" . $whereSql . $orderSql . " LIMIT :__limit";
        $stmtData = $pdo->prepare($sqlData);

        foreach ($params as $k => $v) {
            $stmtData->bindValue($k, $v, PDO::PARAM_STR);
        }
        $stmtData->bindValue(':__limit', $limit, PDO::PARAM_INT);

        $stmtData->execute();
        $rows = $stmtData->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success'          => true,
            'message'          => '',
            '__totalRegistros' => $totalReg,
            '__totalPesquisa'  => $totalPesquisa,
            'data'             => $rows,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'success'          => false,
            'message'          => $e->getMessage(),
            '__totalRegistros' => 0,
            '__totalPesquisa'  => 0,
            'data'             => [],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    exit;
}
