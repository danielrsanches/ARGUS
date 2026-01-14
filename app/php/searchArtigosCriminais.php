<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/sessionVerifyFront.php'; // Apenas para garantir que o usuário está logado

function sendJsonResponse(bool $success, string $message, array $data = []): void
{
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $searchTerm = $_GET['search_term'] ?? null;

    if (!$searchTerm || strlen($searchTerm) < 2) {
        sendJsonResponse(true, 'Termo de busca muito curto.', []);
    }

    $pdo = db();

    $query = '%' . $searchTerm . '%';

    $sql = "SELECT 
                id, 
                leiNumero, 
                leiNome, 
                leiArtigo, 
                leiDescricao
            FROM 
                artigosCriminais 
            WHERE 
                leiNumero LIKE :query OR
                leiNome LIKE :query OR
                leiArtigo LIKE :query OR
                leiDescricao LIKE :query
            ORDER BY 
                leiNome, leiArtigo
            LIMIT 50";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['query' => $query]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendJsonResponse(true, 'Busca realizada com sucesso.', $results);

} catch (PDOException $e) {
    // Em um ambiente de produção, logar o erro em vez de exibi-lo.
    sendJsonResponse(false, 'Erro no banco de dados: ' . $e->getMessage(), []);
} catch (Exception $e) {
    sendJsonResponse(false, 'Erro: ' . $e->getMessage(), []);
}
