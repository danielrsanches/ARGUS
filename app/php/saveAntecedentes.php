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
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$user = current_user();
if (!$user) {
    http_response_code(401);
    sendResponse(false, 'Erro: usuário não autenticado.');
}

try {
    $recordId = $_POST['idFotocrim'] ?? null;
    $antecedentesJson = $_POST['antecedentesJson'] ?? null;

    if (!is_numeric($recordId)) {
        throw new InvalidArgumentException('ID do Fotocrim inválido.');
    }
    if ($antecedentesJson === null) {
        throw new InvalidArgumentException('Dados de antecedentes não fornecidos.');
    }

    $antecedentes = json_decode($antecedentesJson, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new InvalidArgumentException('JSON de antecedentes inválido: ' . json_last_error_msg());
    }

    // Validação de duplicados (idArtigoCriminal) no backend
    $artigosUnicos = [];
    foreach ($antecedentes as $ant) {
        $idArtigo = $ant['idArtigoCriminal'] ?? null;
        if ($idArtigo === null) {
            throw new InvalidArgumentException('Antecedente com Artigo Criminal inválido.');
        }
        if (isset($artigosUnicos[$idArtigo])) {
            throw new InvalidArgumentException('Erro: Antecedente duplicado (mesmo artigo criminal) detectado.');
        }
        $artigosUnicos[$idArtigo] = true;
    }

    $pdo = db();
    $tableName = 'fotocrimAntecedentes';
    $foreignKey = 'idFotocrim';

    $pdo->beginTransaction();

    // Deleta os antecedentes antigos
    $deleteSql = "DELETE FROM `{$tableName}` WHERE `{$foreignKey}` = :fotocrimId";
    $deleteStmt = $pdo->prepare($deleteSql);
    $deleteStmt->execute(['fotocrimId' => $recordId]);

    if (!empty($antecedentes)) {
        $insertSql = "INSERT INTO `{$tableName}` (`{$foreignKey}`, `idArtigoCriminal`, `fonteAntecedente`, `observacao`) 
                      VALUES (:idFotocrim, :idArtigoCriminal, :fonteAntecedente, :observacao)";
        $insertStmt = $pdo->prepare($insertSql);

        foreach ($antecedentes as $ant) {
            $insertStmt->execute([
                'idFotocrim' => $recordId,
                'idArtigoCriminal' => $ant['idArtigoCriminal'],
                'fonteAntecedente' => $ant['fonteAntecedente'] ?? 'Oficial',
                'observacao' => $ant['observacao'] ?? null,
            ]);
        }
    }
    
    // Atualiza o campo `updatedAt` do registro principal
    $updateTimestampSql = "UPDATE `fotocrim` SET `updatedAt` = CURRENT_TIMESTAMP WHERE `id` = :idFotocrim";
    $updateTimestampStmt = $pdo->prepare($updateTimestampSql);
    $updateTimestampStmt->execute(['idFotocrim' => $recordId]);

    $pdo->commit();

    sendResponse(true, 'Antecedentes salvos com sucesso!');

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    sendResponse(false, 'Erro no banco de dados: ' . $e->getMessage());
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    sendResponse(false, 'Erro na requisição: ' . $e->getMessage());
}
