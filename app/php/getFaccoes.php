<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/sessionVerify.php';
$user = current_user();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Erro: usuário não autenticado.']);
    exit;
}

require_once __DIR__ . '/db.php';

try {
    $pdo = db();
    $stmt = $pdo->query("
        SELECT
            id,
            IF(
                nomeCompleto IS NULL OR nomeCompleto = '',
                nomeCurto,
                IF(
                    nomeCurto = nomeCompleto,
                    nomeCompleto,
                    CONCAT(nomeCurto, ' - ', nomeCompleto)
                )
            ) AS nome
        FROM
            faccao
        WHERE
            ativo = 1
        ORDER BY
            nomeCurto ASC
    ");

    // VERIFICA SE A CONSULTA FALHOU
    if ($stmt === false) {
        // Lança uma exceção para ser pega pelo bloco catch
        throw new Exception('A consulta SQL falhou. Verifique a tabela e os nomes das colunas.');
    }

    $faccoes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $faccoes]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro no banco de dados: ' . $e->getMessage()]);
} catch (Exception $e) { // Pega outras exceções
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro no script: ' . $e->getMessage()]);
}
