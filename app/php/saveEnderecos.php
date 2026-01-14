<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/sessionVerify.php';
require_once __DIR__ . '/db.php';

// Função para enviar uma resposta JSON padronizada e encerrar o script
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
    $enderecosJson = $_POST['enderecosJson'] ?? null;

    if (!is_numeric($recordId)) {
        throw new InvalidArgumentException('ID do Fotocrim inválido.');
    }
    if ($enderecosJson === null) {
        throw new InvalidArgumentException('Dados de endereços não fornecidos.');
    }

    $enderecos = json_decode($enderecosJson, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new InvalidArgumentException('JSON de endereços inválido: ' . json_last_error_msg());
    }

    $pdo = db();
    
    $enderecosTableName = 'fotocrimEnderecos';
    $enderecosForeignKey = 'idFotocrim';

    // Inicia a transação
    $pdo->beginTransaction();

    // Deleta os endereços antigos
    $deleteSql = "DELETE FROM `{$enderecosTableName}` WHERE `{$enderecosForeignKey}` = :fotocrimId";
    $deleteStmt = $pdo->prepare($deleteSql);
    $deleteStmt->execute(['fotocrimId' => $recordId]);

    if (!empty($enderecos)) {
        $insertEndSql = "INSERT INTO `{$enderecosTableName}` (`{$enderecosForeignKey}`, `idEnderecoRua`, `numero`, `complemento`, `observacao`) VALUES (:idFotocrim, :idEnderecoRua, :numero, :complemento, :observacao)";
        $insertEndStmt = $pdo->prepare($insertEndSql);

        foreach ($enderecos as $end) {
            $idEnderecoRua = $end['idRua'] ?? null;

            if (!is_numeric($idEnderecoRua) || (int)$idEnderecoRua <= 0) {
                $cidade = $end['cidade'] ?? null;
                $uf = $end['uf'] ?? null;
                $bairro = $end['bairro'] ?? null;
                $logradouro = $end['logradouro'] ?? null;

                if (!$cidade || !$uf || !$bairro || !$logradouro) continue;

                // Encontra ou cria Cidade
                $stmt = $pdo->prepare("SELECT id FROM `enderecoCidades` WHERE nomeCidade = :cidade AND uf = :uf");
                $stmt->execute(['cidade' => $cidade, 'uf' => $uf]);
                $idCidade = $stmt->fetchColumn();
                if (!$idCidade) {
                    $stmt = $pdo->prepare("INSERT INTO `enderecoCidades` (nomeCidade, uf) VALUES (:cidade, :uf)");
                    $stmt->execute(['cidade' => $cidade, 'uf' => $uf]);
                    $idCidade = $pdo->lastInsertId();
                }

                // Encontra ou cria Bairro
                $stmt = $pdo->prepare("SELECT id FROM `enderecoBairros` WHERE nomeBairro = :bairro");
                $stmt->execute(['bairro' => $bairro]);
                $idBairro = $stmt->fetchColumn();
                if (!$idBairro) {
                    $stmt = $pdo->prepare("INSERT INTO `enderecoBairros` (nomeBairro) VALUES (:bairro)");
                    $stmt->execute(['bairro' => $bairro]);
                    $idBairro = $pdo->lastInsertId();
                }

                // Encontra ou cria Rua
                $stmt = $pdo->prepare("SELECT id FROM `enderecoRuas` WHERE idCidade = :idCidade AND idBairro = :idBairro AND logradouro = :logradouro");
                $stmt->execute(['idCidade' => $idCidade, 'idBairro' => $idBairro, 'logradouro' => $logradouro]);
                $idEnderecoRua = $stmt->fetchColumn();
                if (!$idEnderecoRua) {
                    $stmt = $pdo->prepare("INSERT INTO `enderecoRuas` (idCidade, idBairro, logradouro) VALUES (:idCidade, :idBairro, :logradouro)");
                    $stmt->execute(['idCidade' => $idCidade, 'idBairro' => $idBairro, 'logradouro' => $logradouro]);
                    $idEnderecoRua = $pdo->lastInsertId();
                }
            }

            if (!is_numeric($idEnderecoRua) || (int)$idEnderecoRua <= 0) continue;
            
            $endToSave = [
                'idFotocrim'    => $recordId,
                'idEnderecoRua' => (int)$idEnderecoRua,
                'numero'        => $end['numero'] ?? null,
                'complemento'   => $end['complemento'] ?? null,
                'observacao'    => $end['observacao'] ?? null,
            ];

            $insertEndStmt->execute($endToSave);
        }
    }
    
    // Atualiza o campo `updatedAt` do registro principal
    $updateTimestampSql = "UPDATE `fotocrim` SET `updatedAt` = CURRENT_TIMESTAMP WHERE `id` = :idFotocrim";
    $updateTimestampStmt = $pdo->prepare($updateTimestampSql);
    $updateTimestampStmt->execute(['idFotocrim' => $recordId]);

    // Commita a transação
    $pdo->commit();

    sendResponse(true, 'Endereços salvos com sucesso!');

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse(false, 'Erro no banco de dados: ' . $e->getMessage());
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    sendResponse(false, 'Erro na requisição: ' . $e->getMessage());
}
