<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/sessionVerify.php';
require_once __DIR__ . '/db.php';

function sendResponse(bool $success, string $message, ?array $data = null): void
{
    $response = ['success' => $success, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

$user = current_user();
if (!$user) {
    http_response_code(401);
    sendResponse(false, 'Erro: usuário não autenticado.');
}

try {
    $idFotocrim = $_POST['idFotocrim'] ?? null;

    if (!is_numeric($idFotocrim)) {
        throw new InvalidArgumentException('ID do Fotocrim inválido.');
    }

    $pdo = db();

    $sql = "SELECT 
                fa.id,
                fa.idFotocrim,
                fa.idArtigoCriminal,
                fa.fonteAntecedente,
                fa.observacao,
                ac.leiNumero,
                ac.leiNome,
                ac.leiArtigo,
                ac.leiDescricao
            FROM 
                fotocrimAntecedentes AS fa
            JOIN 
                artigosCriminais AS ac ON fa.idArtigoCriminal = ac.id
            WHERE 
                fa.idFotocrim = :idFotocrim
            ORDER BY 
                ac.leiNome, ac.leiArtigo";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['idFotocrim' => $idFotocrim]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse(true, 'Antecedentes carregados com sucesso.', $results);

} catch (PDOException $e) {
    http_response_code(500);
    sendResponse(false, 'Erro no banco de dados: ' . $e->getMessage());
} catch (Exception $e) {
    http_response_code(400);
    sendResponse(false, 'Erro na requisição: ' . $e->getMessage());
}
