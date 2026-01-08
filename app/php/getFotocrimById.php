<?php
declare(strict_types=1);

file_put_contents('debug.log', "Script started: " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/sessionVerify.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/fotocrimConfig.php';

file_put_contents('debug.log', "Includes loaded.\n", FILE_APPEND);

$user = current_user();
if (!$user) {
    file_put_contents('debug.log', "Authentication failed.\n", FILE_APPEND);
    http_response_code(401);
    sendResponse(false, 'Erro: usuário não autenticado.');
}
file_put_contents('debug.log', "User authenticated.\n", FILE_APPEND);

function sendResponse(bool $success, string $message, ?array $data = null): void
{
    $response = ['success' => $success, 'message' => $message, 'data' => $data];
    $json = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    file_put_contents('debug.log', "Sending JSON response: " . $json . "\n", FILE_APPEND);
    echo $json;
    exit;
}

try {
    $recordId = $_POST['id'] ?? null;
    file_put_contents('debug.log', "Record ID received: " . ($recordId ?? 'null') . "\n", FILE_APPEND);

    if (!is_numeric($recordId)) {
        sendResponse(false, 'ID do registro inválido.');
    }

    $id = (int)$recordId;
    $pdo = db();
    file_put_contents('debug.log', "Database connection established. ID: " . $id . "\n", FILE_APPEND);

    // Fetch main fotocrim record
    $viewConfig = getFotocrimViewConfig();
    $sqlQuery = $viewConfig['query'];
    $primaryKey = $viewConfig['primaryKey'];
    
    $sqlQuery .= " WHERE t.`{$primaryKey}` = :id";
    file_put_contents('debug.log', "Final SQL Query: " . $sqlQuery . "\n", FILE_APPEND);

    $stmt = $pdo->prepare($sqlQuery);
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    $fotocrimRecord = $stmt->fetch(PDO::FETCH_ASSOC); // Use fetch for single record
    file_put_contents('debug.log', "Fotocrim record fetched.\n", FILE_APPEND);

    if ($fotocrimRecord) {
        // Fetch associated documents
        global $tableConfigDocumentos; // Ensure $tableConfigDocumentos is available from fotocrimConfig.php
        $documentosTableName = $tableConfigDocumentos['tableName'];
        $documentosForeignKey = $tableConfigDocumentos['foreignKey'];

        $docSql = "SELECT `tipo`, `valor`, `observacao` FROM `{$documentosTableName}` WHERE `{$documentosForeignKey}` = :fotocrimId";
        $docStmt = $pdo->prepare($docSql);
        $docStmt->bindValue(':fotocrimId', $id, PDO::PARAM_INT);
        $docStmt->execute();
        $documents = $docStmt->fetchAll(PDO::FETCH_ASSOC);
        file_put_contents('debug.log', "Documents fetched. Count: " . count($documents) . "\n", FILE_APPEND);

        $fotocrimRecord['documentos'] = $documents; // Add documents to the main record

        sendResponse(true, 'Registro encontrado com sucesso.', $fotocrimRecord);
    } else {
        sendResponse(false, 'Registro não encontrado.', null); // Changed to null for single record not found
    }

} catch (PDOException $e) {
    file_put_contents('debug.log', "PDOException: " . $e->getMessage() . "\n", FILE_APPEND);
    sendResponse(false, 'Erro no banco de dados: ' . $e->getMessage());
} catch (Exception $e) {
    file_put_contents('debug.log', "General Exception: " . $e->getMessage() . "\n", FILE_APPEND);
    sendResponse(false, 'Erro na requisição: ' . $e->getMessage());
}
