<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/sessionVerify.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/fotocrimConfig.php';

$user = current_user();
if (!$user) {
    http_response_code(401);
    sendResponse(false, 'Erro: usuário não autenticado.');
}

function sendResponse(bool $success, string $message, ?array $data = null): void
{
    $response = ['success' => $success, 'message' => $message, 'data' => $data];
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

try {
    $idFotocrim = $_POST['idFotocrim'] ?? null;

    if (!is_numeric($idFotocrim)) {
        sendResponse(false, 'ID do Fotocrim inválido.');
    }

    $id = (int)$idFotocrim;
    $pdo = db();

    // Use the $tableConfigEnderecos from fotocrimConfig.php
    global $tableConfigEnderecos;

    if (!isset($tableConfigEnderecos) || !is_array($tableConfigEnderecos)) {
        throw new RuntimeException("A variável \$tableConfigEnderecos não está definida ou é inválida no arquivo de configuração.");
    }

    $tableName = $tableConfigEnderecos['tableName'];
    $foreignKey = $tableConfigEnderecos['foreignKey'];

    $sql = "SELECT fe.id, fe.idFotocrim, fe.numero, fe.complemento, fe.observacao, fe.idEnderecoRua as idRua,
                   er.logradouro,
                   eb.id as idBairro, eb.nomeBairro as bairro,
                   ec.id as idCidade, ec.nomeCidade as cidade, ec.uf
            FROM `{$tableName}` fe
            LEFT JOIN `enderecoRuas` er ON fe.idEnderecoRua = er.id
            LEFT JOIN `enderecoBairros` eb ON er.idBairro = eb.id
            LEFT JOIN `enderecoCidades` ec ON er.idCidade = ec.id
            WHERE fe.`{$foreignKey}` = :idFotocrim
            ORDER BY fe.id ASC"; // Order by the correct primary key 'id'

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':idFotocrim', $id, PDO::PARAM_INT);
    $stmt->execute();
    $enderecos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse(true, 'Endereços encontrados com sucesso.', $enderecos);

} catch (PDOException $e) {
    sendResponse(false, 'Erro no banco de dados: ' . $e->getMessage());
} catch (Exception $e) {
    http_response_code(400); // Bad Request
    sendResponse(false, 'Erro na requisição: ' . $e->getMessage());
}
