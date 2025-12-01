<?php
declare(strict_types=1); // ativa verificação estrita de tipos

//verifica autenticação do usuário...
require_once __DIR__ . '/sessionVerify.php';
$user = current_user();
if (!$user) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Erro: usuário não autenticado.',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

//carrega a conexão com o banco de dados...
require_once __DIR__ . '/db.php';
$__pdo = db();

/**
 * Mapa de views usadas pelo dsPesquisa para os endpoints de configuração.
 *
 * A chave é SEMPRE o viewName que o front manda no POST.
 * O valor é um array com os dados necessários para buscar a config.
 */
return [
    'viewFotocrim' => 'php/fotocrimConfig.php?tipo=viewConfig',
    'tableFotocrim' => 'php/fotocrimConfig.php?tipo=tableConfig',
    'tableFotocrimEnderecos' => 'php/fotocrimConfig.php?tipo=tableConfigEnderecos'
];
