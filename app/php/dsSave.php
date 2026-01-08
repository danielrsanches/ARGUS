<?php

declare(strict_types=1);

// Força o header para JSON com charset UTF-8
header('Content-Type: application/json; charset=utf-8');

// Inclui o arquivo de conexão com o banco de dados
require_once 'db.php';

// Função para enviar uma resposta JSON padronizada e encerrar o script
function sendResponse(bool $success, string $message, ?array $data = null, ?int $id = null): void
{
    $response = ['success' => $success, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    if ($id !== null) {
        $response['id'] = $id;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// -----------------------------------------------------------------------------
// Início da Lógica Principal
// -----------------------------------------------------------------------------

try {
    // Pega o nome da configuração da tabela (ex: 'fotocrim')
    $configName = $_POST['configName'] ?? null;
    if (!$configName) {
        throw new InvalidArgumentException('O nome da configuração da tabela é obrigatório.');
    }

    // Carrega o arquivo de configuração específico do módulo
    $configPath = __DIR__ . '/' . $configName . 'Config.php';
    if (!file_exists($configPath)) {
        throw new RuntimeException("Arquivo de configuração não encontrado: {$configPath}");
    }
    require_once $configPath;

    // A variável $tableConfig deve estar definida no arquivo de configuração
    if (!isset($tableConfig) || !is_array($tableConfig)) {
        throw new RuntimeException("A variável \$tableConfig não está definida ou é inválida no arquivo de configuração.");
    }

    // Extrai informações da configuração
    $tableName  = $tableConfig['tableName'];
    $primaryKey = $tableConfig['primaryKey'];
    $fields     = $tableConfig['fields'];

    // Pega o ID do registro. Se for vazio/nulo, é uma operação de INSERT.
    $recordId = $_POST[$primaryKey] ?? null;
    $isUpdate = !empty($recordId);

    // Monta o array de dados a serem salvos
    $dataToSave = [];
    $allowedTypes = ['string', 'text', 'date', 'datetime', 'int', 'bigint', 'float', 'enum'];

    foreach ($fields as $field) {
        // Processa apenas campos editáveis que foram enviados via POST
        if ($field['editable'] && isset($_POST[$field['name']])) {
            $fieldName = $field['name'];
            $fieldType = $field['type'];
            $value = $_POST[$fieldName];

            // Validação e formatação simples (pode ser expandida)
            if (!in_array($fieldType, $allowedTypes)) {
                continue; // Pula tipos não permitidos/desconhecidos
            }

            // Converte valores vazios para NULL, exceto se o campo não permitir
            if ($value === '') {
                $dataToSave[$fieldName] = null;
            } else {
                $dataToSave[$fieldName] = $value;
            }
        }
    }

    if (empty($dataToSave)) {
        throw new InvalidArgumentException('Nenhum dado editável foi enviado para salvar.');
    }

    // Prepara a query (INSERT ou UPDATE)
    $pdo = db();

    // --- DUPLICATION CHECK (for INSERT only) ---
    // This check is performed only for new records (INSERT) to prevent duplicates.
    // For updates, we assume the user intends to modify an existing record.
    if (!$isUpdate && $configName === 'fotocrim') {
        $requiredDupFields = ['nomeCompleto', 'nomePai', 'nomeMae', 'dataNascimento'];
        $dupCheckValues = [];
        $dupCheckClauses = [];

        foreach ($requiredDupFields as $field) {
            if (!isset($dataToSave[$field])) {
                // If a required field for duplication check is missing, we cannot perform the check meaningfully.
                // This might indicate an issue with client-side validation or form submission.
                // For now, we'll let it pass, but ideally, client-side validation should catch this.
                continue;
            }
            $dupCheckClauses[] = "`{$field}` = :{$field}";
            $dupCheckValues[$field] = $dataToSave[$field];
        }

        if (count($dupCheckClauses) === count($requiredDupFields)) { // Ensure all required fields for check are present
            $dupSql = "SELECT COUNT(*) FROM `{$tableName}` WHERE " . implode(' AND ', $dupCheckClauses);
            $dupStmt = $pdo->prepare($dupSql);
            $dupStmt->execute($dupCheckValues);
            if ((int)$dupStmt->fetchColumn() > 0) {
                sendResponse(false, 'Registro duplicado. Já existe uma pessoa com este Nome Completo, Nome do Pai, Nome da Mãe e Data de Nascimento.');
            }
        }
    }
    // --- END DUPLICATION CHECK ---


    if ($isUpdate) {
        // Operação de UPDATE
        $setClauses = [];
        foreach (array_keys($dataToSave) as $col) {
            $setClauses[] = "`{$col}` = :{$col}";
        }
        $sql = "UPDATE `{$tableName}` SET " . implode(', ', $setClauses) . " WHERE `{$primaryKey}` = :{$primaryKey}";
        $dataToSave[$primaryKey] = $recordId; // Adiciona o ID para o bind
    } else {
        // Operação de INSERT
        $columns = array_keys($dataToSave);
        $placeholders = array_map(fn($c) => ':' . $c, $columns);
        $sql = "INSERT INTO `{$tableName}` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $placeholders) . ")";
    }

    // Executa a query com prepared statements
    $stmt = $pdo->prepare($sql);
    $stmt->execute($dataToSave);

    // Se for um INSERT, obtém o ID do novo registro
    if (!$isUpdate) {
        $recordId = (int)$pdo->lastInsertId();
    }

    // --- HANDLE DOCUMENTS (if configName is fotocrim and documentsJson is provided) ---
    if ($configName === 'fotocrim' && isset($_POST['documentosJson'])) {
        // Carrega a configuração da tabela de documentos
        $documentosConfigPath = __DIR__ . '/fotocrimConfig.php'; // Usa o mesmo config, mas para 'tableConfigDocumentos'
        require_once $documentosConfigPath; // Recarregar para garantir que tableConfigDocumentos está disponível

        if (!isset($tableConfigDocumentos) || !is_array($tableConfigDocumentos)) {
            throw new RuntimeException("A variável \$tableConfigDocumentos não está definida ou é inválida.");
        }

        $documentosTableName = $tableConfigDocumentos['tableName'];
        $documentosPrimaryKey = $tableConfigDocumentos['primaryKey'];
        $documentosForeignKey = $tableConfigDocumentos['foreignKey'];
        $documentosFields = $tableConfigDocumentos['fields'];

        $documentos = json_decode($_POST['documentosJson'], true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new InvalidArgumentException('documentosJson inválido: ' . json_last_error_msg());
        }
        
        // Sempre deleta os documentos existentes para este fotocrim_id e insere os novos
        // Isso simplifica o gerenciamento e evita problemas de sincronização.
        $deleteSql = "DELETE FROM `{$documentosTableName}` WHERE `{$documentosForeignKey}` = :fotocrimId";
        $deleteStmt = $pdo->prepare($deleteSql);
        $deleteStmt->execute([':fotocrimId' => $recordId]);

        if (!empty($documentos)) {
            // Prepara a query de INSERT para os documentos
            $docColumns = [];
            $docPlaceholders = [];
            $firstDoc = $documentos[0]; // Pega o primeiro para extrair as chaves

            // Inclui a chave estrangeira
            $docColumns[] = "`{$documentosForeignKey}`";
            $docPlaceholders[] = ":{$documentosForeignKey}";

            foreach ($documentosFields as $field) {
                if ($field['editable'] && $field['name'] !== $documentosPrimaryKey && $field['name'] !== $documentosForeignKey) {
                    $docColumns[] = "`{$field['name']}`";
                    $docPlaceholders[] = ":{$field['name']}";
                }
            }
            
            $insertDocSql = "INSERT INTO `{$documentosTableName}` (" . implode(', ', $docColumns) . ") VALUES (" . implode(', ', $docPlaceholders) . ")";
            $insertDocStmt = $pdo->prepare($insertDocSql);

            foreach ($documentos as $doc) {
                $docToSave = [":{$documentosForeignKey}" => $recordId];
                foreach ($documentosFields as $field) {
                    if ($field['editable'] && $field['name'] !== $documentosPrimaryKey && $field['name'] !== $documentosForeignKey) {
                        $fieldName = $field['name'];
                        $value = $doc[$fieldName] ?? null; // Usa null se o campo não estiver presente no JSON
                        $docToSave[":{$fieldName}"] = $value !== '' ? $value : null; // Converte string vazia para null
                    }
                }
                $insertDocStmt->execute($docToSave);
            }
        }
    }
    // --- END HANDLE DOCUMENTS ---

    sendResponse(true, 'Registro salvo com sucesso!', null, (int)$recordId);

    // --- HANDLE ADDRESSES (if configName is fotocrim and enderecosJson is provided) ---
    if ($configName === 'fotocrim' && isset($_POST['enderecosJson'])) {
        global $tableConfigEnderecos; // Ensure tableConfigEnderecos is available

        if (!isset($tableConfigEnderecos) || !is_array($tableConfigEnderecos)) {
            throw new RuntimeException("A variável \$tableConfigEnderecos não está definida ou é inválida.");
        }

        $enderecosTableName = $tableConfigEnderecos['tableName'];
        $enderecosPrimaryKey = $tableConfigEnderecos['primaryKey'];
        $enderecosForeignKey = $tableConfigEnderecos['foreignKey'];
        $enderecosFields = $tableConfigEnderecos['fields'];

        $enderecos = json_decode($_POST['enderecosJson'], true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new InvalidArgumentException('enderecosJson inválido: ' . json_last_error_msg());
        }
        
        // Sempre deleta os endereços existentes para este fotocrim_id e insere os novos
        // Isso simplifica o gerenciamento e evita problemas de sincronização.
        $deleteSql = "DELETE FROM `{$enderecosTableName}` WHERE `{$enderecosForeignKey}` = :fotocrimId";
        $deleteStmt = $pdo->prepare($deleteSql);
        $deleteStmt->execute([':fotocrimId' => $recordId]);

        if (!empty($enderecos)) {
            // Prepara a query de INSERT para os endereços
            $endColumns = [];
            $endPlaceholders = [];

            // Inclui a chave estrangeira
            $endColumns[] = "`{$enderecosForeignKey}`";
            $endPlaceholders[] = ":{$enderecosForeignKey}";

            foreach ($enderecosFields as $field) {
                if ($field['editable'] && $field['name'] !== $enderecosPrimaryKey && $field['name'] !== $enderecosForeignKey) {
                    $endColumns[] = "`{$field['name']}`";
                    $endPlaceholders[] = ":{$field['name']}";
                }
            }
            
            $insertEndSql = "INSERT INTO `{$enderecosTableName}` (" . implode(', ', $endColumns) . ") VALUES (" . implode(', ', $endPlaceholders) . ")";
            $insertEndStmt = $pdo->prepare($insertEndSql);

            foreach ($enderecos as $end) {
                // Determine idEnderecoRua
                $idEnderecoRua = $end['idEnderecoRua'] ?? null;

                // If idEnderecoRua is not provided or is invalid, attempt to find/create it
                if (!is_numeric($idEnderecoRua) || (int)$idEnderecoRua <= 0) {
                    $cidade = $end['cidade'] ?? null;
                    $uf = $end['uf'] ?? null;
                    $bairro = $end['bairro'] ?? null;
                    $logradouro = $end['logradouro'] ?? null;
                    $cep = $end['cep'] ?? null; // Added cep

                    if (!$cidade || !$uf || !$bairro || !$logradouro) {
                        // Skip this address or throw error if essential components are missing
                        // For now, we'll skip to allow saving other valid addresses
                        continue;
                    }

                    // Find or Create Cidade
                    $stmt = $pdo->prepare("SELECT id FROM `enderecoCidades` WHERE nomeCidade = :cidade AND uf = :uf");
                    $stmt->execute([':cidade' => $cidade, ':uf' => $uf]);
                    $idCidade = $stmt->fetchColumn();
                    if (!$idCidade) {
                        $stmt = $pdo->prepare("INSERT INTO `enderecoCidades` (nomeCidade, uf) VALUES (:cidade, :uf)");
                        $stmt->execute([':cidade' => $cidade, ':uf' => $uf]);
                        $idCidade = $pdo->lastInsertId();
                    }

                    // Find or Create Bairro
                    $stmt = $pdo->prepare("SELECT id FROM `enderecoBairros` WHERE nomeBairro = :bairro");
                    $stmt->execute([':bairro' => $bairro]);
                    $idBairro = $stmt->fetchColumn();
                    if (!$idBairro) {
                        $stmt = $pdo->prepare("INSERT INTO `enderecoBairros` (nomeBairro) VALUES (:bairro)");
                        $stmt->execute([':bairro' => $bairro]);
                        $idBairro = $pdo->lastInsertId();
                    }

                    // Find or Create Rua
                    $stmt = $pdo->prepare("SELECT id FROM `enderecoRuas` WHERE idCidade = :idCidade AND idBairro = :idBairro AND logradouro = :logradouro");
                    $stmt->execute([':idCidade' => $idCidade, ':idBairro' => $idBairro, ':logradouro' => $logradouro]);
                    $idEnderecoRua = $stmt->fetchColumn();
                    if (!$idEnderecoRua) {
                        $stmt = $pdo->prepare("INSERT INTO `enderecoRuas` (idCidade, idBairro, logradouro) VALUES (:idCidade, :idBairro, :logradouro)"); // Removed cep here
                        $stmt->execute([':idCidade' => $idCidade, ':idBairro' => $idBairro, ':logradouro' => $logradouro]);
                        $idEnderecoRua = $pdo->lastInsertId();
                    }
                }

                if (!is_numeric($idEnderecoRua) || (int)$idEnderecoRua <= 0) {
                    // If idEnderecoRua still not resolved, skip this address
                    continue;
                }

                $endToSave = [
                    ":{$enderecosForeignKey}" => $recordId,
                    ":idEnderecoRua"          => (int)$idEnderecoRua,
                    ":numero"                 => $end['numero'] ?? null,
                    ":complemento"            => $end['complemento'] ?? null,
                    ":observacao"             => $end['observacao'] ?? null,
                ];

                $insertEndSql = "INSERT INTO `{$enderecosTableName}` (`{$enderecosForeignKey}`, `idEnderecoRua`, `numero`, `complemento`, `observacao`) VALUES (:idFotocrim, :idEnderecoRua, :numero, :complemento, :observacao)";
                $insertEndStmt = $pdo->prepare($insertEndSql);
                $insertEndStmt->execute($endToSave);
            }
        }
    }
    // --- END HANDLE ADDRESSES ---

} catch (PDOException $e) {
    // Trata erros de banco de dados
    // Em produção, logar o erro em vez de expô-lo
    sendResponse(false, 'Erro no banco de dados: ' . $e->getMessage());
} catch (Exception $e) {
    // Trata outros erros (configuração, validação, etc.)
    http_response_code(400); // Bad Request
    sendResponse(false, 'Erro na requisição: ' . $e->getMessage());
}
