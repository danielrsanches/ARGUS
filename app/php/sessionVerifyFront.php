<?php

//-> Este arquivo é exclusivo para verificação de sessão do front-end, retornando o usuário logado ou false em caso negativo...

require_once __DIR__ . '/sessionVerify.php';
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

//verifica se está logado e retorna um JSON para o front-end
$user = current_user();
if (!$user) {
    http_response_code(401);
    echo json_encode(['ok' => false]);
} else {
    echo json_encode([
        'ok' => true,
        'id' => $user["id"],
        'nome' => $user["nome"]
    ]);
}
