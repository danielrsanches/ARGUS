<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

/**
 * Utilitários gerais do dsPesquisa, encapsulados em uma classe estática.
 */
class dsUtil
{
    /**
     * Raiz da aplicação no filesystem:
     * sobe 2 níveis a partir de vendor/dsPesquisa/dsPesquisa.php
     * => .../ (onde ficam "php", "index.php", etc.)
     */
    public static function getAppBaseDir(): string
    {
        $baseDir = dirname(__DIR__, 2);
        return is_dir($baseDir) ? $baseDir : __DIR__;
    }

    /**
     * Monta a URL HTTP da aplicação a partir de um path relativo.
     * Ex.: "php/fotocrimConfig.php?tipo=viewConfig"
     *      → "https://host/app/php/fotocrimConfig.php?tipo=viewConfig"
     */
    public static function makeAppUrl(string $relativePath): string
    {
        $relativePath = ltrim($relativePath, '/');

        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';

        // Diretório do script atual, ex.: "/app/vendor/dsPesquisa"
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
     * Permite: letras, números, underscore, ponto (ex.: alias.campo).
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

        // dsPesquisaConfig.php deve retornar APENAS o mapa (sem __pdo)
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
     * Regras:
     *  - dsPesquisaConfig.php faz:
     *        require_once __DIR__ . '/db.php';
     *        $__pdo = db(); // ou minhaConexao(), tanto faz
     *        return [ 'viewName' => '...' , ... ];
     *
     *  - Aqui usamos require para ter acesso a $__pdo.
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

        // Garante que uma eventual $__pdo antiga não "suje" o resultado
        unset($__pdo);

        // Executa o dsPesquisaConfig.php.
        // Ele define $__pdo e retorna o mapa de views, que aqui é ignorado.
        require $configFullPath;

        if (!isset($__pdo) || !$__pdo instanceof PDO) {
            throw new RuntimeException("Variável \$__pdo não definida ou inválida em dsPesquisaConfig.php.");
        }

        return $__pdo;
    }
}

/* ============================================================
   Roteamento da ação
   ============================================================ */

$action = $_POST['action'] ?? ''; // captura a ação

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
   - Apenas devolve a viewConfig pro front (metadados)
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
   Versão 1 (sem hacks de intervalo/aspas/negativo/datas ainda)
   - pesquisaGlobal: palavras AND entre si, campos OR
   - pesquisaPorCampo: campoX: palavras AND dentro do campo
   - fixedFilters: sempre AND
   - defaultFilters: só quando não há global nem campos;
       se não houver defaultFilters → fallback MAX(PK)
   - __totalRegistros: COUNT(*) geral
   - __totalPesquisa: COUNT(*) com WHERE
   - data: SELECT * com WHERE + ORDER + LIMIT
   ============================================================ */
function pesquisar(): void
{
    try {
        // ---------------------------------------------------------
        // 1) Entrada bruta do POST
        // ---------------------------------------------------------
        $viewName       = trim((string)($_POST['viewName']        ?? ''));
        $endpointConfig = trim((string)($_POST['endpointConfig']  ?? ''));
        $pesqGlobal     = trim((string)($_POST['pesquisaGlobal']  ?? ''));
        $pesqCamposJson = (string)($_POST['pesquisaPorCampo']     ?? '{}');

        // Decodifica pesquisaPorCampo (sempre array)
        $pesqCampos = json_decode($pesqCamposJson, true);
        if (!is_array($pesqCampos)) {
            $pesqCampos = [];
        }

        // ---------------------------------------------------------
        // 2) Carrega viewConfig (metadados) e PDO da aplicação
        // ---------------------------------------------------------
        $cfg = dsUtil::loadConfig($viewName, $endpointConfig);
        $pdo = dsUtil::getPdoFromConfig($endpointConfig);

        // ---------------------------------------------------------
        // 3) Extrai informações básicas da viewConfig
        // ---------------------------------------------------------
        // Nome da tabela/view base
        $table = (string)($cfg['from'] ?? $cfg['tableName'] ?? $cfg['viewName'] ?? $viewName);
        $table = dsUtil::sanitizeFieldName($table) ?? $viewName;

        // PK usada para fallback MAX(pk) e ORDER BY default
        $pk = (string)($cfg['primaryKey'] ?? 'id');
        $pk = dsUtil::sanitizeFieldName($pk) ?? 'id';

        // LIMIT padrão
        $limit = isset($cfg['limitDefault'])
            ? (int)$cfg['limitDefault']
            : (isset($cfg['limit']) ? (int)$cfg['limit'] : 50);

        if ($limit <= 0) {
            $limit = 50;
        }

        // ORDER BY padrão
        $orderBy = '';
        if (!empty($cfg['orderByDefault']) && is_string($cfg['orderByDefault'])) {
            $orderBy = $cfg['orderByDefault'];
        } elseif (!empty($cfg['orderBy']) && is_string($cfg['orderBy'])) {
            $orderBy = $cfg['orderBy'];
        }

        // ---------------------------------------------------------
        // 4) Campos da view e definição de quais participam da global
        // ---------------------------------------------------------
        $fieldsCfg = $cfg['fields'] ?? [];
        if (!is_array($fieldsCfg)) {
            $fieldsCfg = [];
        }

        $allFields          = []; // todos os campos conhecidos
        $globalSearchFields = []; // campos elegíveis para pesquisaGlobal

        foreach ($fieldsCfg as $f) {
            if (!is_array($f)) {
                continue;
            }

            $name = isset($f['name']) ? (string)$f['name'] : '';
            $col  = dsUtil::sanitizeFieldName($name);
            if ($col === null) {
                continue; // ignora nomes suspeitos
            }

            $allFields[] = $col;

            // Se não houver flag, consideramos que participa da global
            $searchGlobal = $f['searchGlobal'] ?? $f['search_global'] ?? null;
            if ($searchGlobal === null || $searchGlobal === true || $searchGlobal === 1 || $searchGlobal === '1') {
                $globalSearchFields[] = $col;
            }
        }

        // Se ninguém foi marcado, usa todos os campos como globais
        if (!$globalSearchFields && $allFields) {
            $globalSearchFields = $allFields;
        }

        // ---------------------------------------------------------
        // 5) Montagem dinâmica do WHERE
        // ---------------------------------------------------------
        $conditions = []; // lista de fragmentos "campo LIKE :param"
        $params     = []; // :param => valor
        $hasGlobal  = $pesqGlobal !== '';
        $hasCampos  = false;

        // 5.1) Pesquisa GLOBAL (estilo Google: palavras AND, campos OR por palavra)
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

                    $orParts[]           = "`$col` LIKE $paramName";
                    $params[$paramName]  = '%' . $w . '%';
                }

                if ($orParts) {
                    // palavras entre si → AND
                    $conditions[] = '(' . implode(' OR ', $orParts) . ')';
                }
            }
        }

        // 5.2) Pesquisa POR CAMPO (campoX: palavras AND dentro do campo, campos AND entre si)
        if (!empty($pesqCampos)) {
            // índice rápido de campos válidos
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
                    // ignora campos que não existem na view
                    continue;
                }

                $hasCampos = true;
                $campoIdx++;

                $words      = preg_split('/\s+/', $value);
                $wordIdx    = 0;
                $fieldParts = [];

                foreach ($words as $w) {
                    $w = trim($w);
                    if ($w === '') {
                        continue;
                    }
                    $wordIdx++;

                    $paramName           = ':c' . $campoIdx . '_' . $wordIdx;
                    $fieldParts[]        = "`$col` LIKE $paramName";
                    $params[$paramName]  = '%' . $w . '%';
                }

                if ($fieldParts) {
                    // cada campo gera um bloco AND extra
                    $conditions[] = '(' . implode(' AND ', $fieldParts) . ')';
                }
            }
        }

        // 5.3) fixedFilters (sempre AND)
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

        // 5.4) defaultFilters / fallback MAX(PK)
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
                // fallback: apenas o último registro cadastrado
                $conditions[] = sprintf(
                    "`%s` = (SELECT MAX(`%s`) FROM `%s`)",
                    $pk,
                    $pk,
                    $table
                );
            }
        }

        // WHERE final
        $whereSql = '';
        if ($conditions) {
            $whereSql = ' WHERE ' . implode(' AND ', $conditions);
        }

        // ---------------------------------------------------------
        // 6) ORDER BY
        // ---------------------------------------------------------
        $orderSql = '';
        if ($orderBy !== '') {
            $orderSql = ' ORDER BY ' . $orderBy;
        } else {
            $orderSql = ' ORDER BY `' . $pk . '` DESC';
        }

        // ---------------------------------------------------------
        // 7) Execução das queries
        // ---------------------------------------------------------

        // 7.1) total geral de registros
        $sqlTotal  = "SELECT COUNT(*) AS c FROM `$table`";
        $stmtTotal = $pdo->query($sqlTotal);
        $totalReg  = (int)($stmtTotal ? $stmtTotal->fetchColumn() : 0);

        // 7.2) total de registros que satisfazem a pesquisa
        $sqlCount  = "SELECT COUNT(*) AS c FROM `$table`" . $whereSql;
        $stmtCount = $pdo->prepare($sqlCount);
        $stmtCount->execute($params);
        $totalPesquisa = (int)$stmtCount->fetchColumn();

        // 7.3) dados com LIMIT
        $sqlData  = "SELECT * FROM `$table`" . $whereSql . $orderSql . " LIMIT :__limit";
        $stmtData = $pdo->prepare($sqlData);

        // vincula parâmetros de texto (LIKE)
        foreach ($params as $k => $v) {
            $stmtData->bindValue($k, $v, PDO::PARAM_STR);
        }
        // vincula LIMIT como inteiro
        $stmtData->bindValue(':__limit', $limit, PDO::PARAM_INT);

        $stmtData->execute();
        $rows = $stmtData->fetchAll(PDO::FETCH_ASSOC);

        // ---------------------------------------------------------
        // 8) Resposta final
        // ---------------------------------------------------------
        echo json_encode([
            'success'          => true,
            'message'          => '',
            '__totalRegistros' => $totalReg,      // total de registros na tabela
            '__totalPesquisa'  => $totalPesquisa, // total que atende à pesquisa
            'data'             => $rows,          // linhas retornadas (limit)
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
