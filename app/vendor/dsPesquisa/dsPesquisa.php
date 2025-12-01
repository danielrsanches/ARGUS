<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$action = $_POST['action'] ?? ''; //captura a ação desejada...

switch ($action) {
    case 'getConfig':
        getConfig();
        break;

    // Aqui no futuro você pode adicionar outras ações:
    // case 'pesquisar':
    //     handlePesquisar();
    //     break;

    default:
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => "Ação inválida ou não informada.",
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
}

/**
 * Raiz da aplicação no filesystem:
 * sobe 2 níveis a partir de vendor/dsPesquisa/dsPesquisa.php
 * => .../ (onde ficam "php", "index.php", etc.)
 */
function getAppBaseDir(): string
{
    // dirname(__DIR__, 2) = pasta dois níveis acima de vendor/dsPesquisa
    $baseDir = dirname(__DIR__, 2);

    if (!is_dir($baseDir)) {
        $baseDir = __DIR__; // fallback bem defensivo
    }

    return $baseDir;
}

/**
 * Monta a URL HTTP da aplicação a partir de um path relativo, ex.:
 * "php/fotocrimConfig.php?tipo=viewConfig"
 * =>
 * "https://host/app/php/fotocrimConfig.php?tipo=viewConfig"
 */
function makeAppUrl(string $relativePath): string
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
 * Trata a ação "getConfig":
 * - Lê viewName e endpointConfig vindos do POST.
 * - Faz require do dsPesquisaConfig.php (endpointConfig).
 * - Acha o endpoint da view dentro desse map.
 * - Chama esse endpoint (HTTP) e devolve o JSON de config para o front.
 */
function getConfig(): void
{
    $viewName       = $_POST['viewName']        ?? '';
    $endpointConfig = $_POST['endpointConfig']  ?? '';

    // Sanitiza
    $viewName       = trim((string) $viewName);
    $endpointConfig = trim((string) $endpointConfig);

    if ($endpointConfig === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Erro: parâmetro endpointConfig (dsPesquisaConfig.php) não informado.',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($viewName === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Erro: parâmetro viewName não informado.',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // 1) Monta o caminho ABSOLUTO do dsPesquisaConfig.php:
    //    endpointConfig vem como "php/dsPesquisaConfig.php" (relativo à raiz da app).
    $baseDir        = getAppBaseDir(); // ex.: /var/www/app
    $configFullPath = $baseDir . DIRECTORY_SEPARATOR . ltrim($endpointConfig, '/\\');

    if (!file_exists($configFullPath)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => "Erro: arquivo de configuração '$endpointConfig' não encontrado em '$configFullPath'.",
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // 2) Carrega o map (viewName => endpoint da view)
    $map = require $configFullPath;

    if (!is_array($map)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erro: dsPesquisaConfig.php deve retornar um array associativo (viewName => endpoint).',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // 3) Localiza o endpoint da view
    if (!isset($map[$viewName])) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => "Erro: a view '$viewName' não está mapeada em dsPesquisaConfig.php.",
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $viewEndpoint = $map[$viewName];

    if (!is_string($viewEndpoint) || $viewEndpoint === '') {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => "Erro: endpoint inválido configurado para a view '$viewName'.",
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // 4) Monta a URL HTTP absoluta do endpoint da view
    //    Ex.: "php/fotocrimConfig.php?tipo=viewConfig" -> "https://host/app/php/fotocrimConfig.php?tipo=viewConfig"
    $viewUrl = makeAppUrl($viewEndpoint);

    // 5) Chama o endpoint da view (que deve retornar o JSON da config)
    $jsonRaw = @file_get_contents($viewUrl);

    if ($jsonRaw === false) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => "Erro ao acessar endpoint de configuração em '$viewUrl'.",
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // Opcional: validar se é JSON válido
    $decoded = json_decode($jsonRaw, true);
    if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => "Erro: resposta inválida (não JSON) do endpoint '$viewUrl'.",
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // 6) Devolve pro front exatamente o JSON retornado pelo endpoint de config
    echo $jsonRaw;
    exit;
}
