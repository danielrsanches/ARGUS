<?php
require_once 'db.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => '', 'data' => []];

// Function to log messages to a file
function log_to_file($message) {
    file_put_contents('debug_search.log', date('Y-m-d H:i:s') . ' - ' . $message . PHP_EOL, FILE_APPEND);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $searchTerm = filter_input(INPUT_GET, 'search_term', FILTER_SANITIZE_SPECIAL_CHARS);

    if (empty($searchTerm)) {
        $response['message'] = 'Termo de busca não fornecido.';
        log_to_file('Search term empty.'); // Log this event
        echo json_encode($response);
        exit();
    }

    try {
        $pdo = db(); // Get the PDO instance

        $searchTerms = explode(' ', $searchTerm);
        $whereClauses = [];
        $params = [];
        
        foreach ($searchTerms as $key => $term) {
            $term = trim($term);
            if (!empty($term)) {
                $whereClauses[] = "(er.logradouro LIKE ? OR eb.nomeBairro LIKE ? OR ec.nomeCidade LIKE ? OR ec.uf LIKE ?)";
                // Add 4 parameters for each search term, one for each '?' placeholder
                $params[] = '%' . $term . '%'; // For er.logradouro
                $params[] = '%' . $term . '%'; // For eb.nomeBairro
                $params[] = '%' . $term . '%'; // For ec.nomeCidade
                $params[] = '%' . $term . '%'; // For ec.uf
            }
        }

        if (empty($whereClauses)) {
            $response['message'] = 'Termo de busca válido não fornecido após processamento.';
            log_to_file('Processed search term empty after splitting.');
            echo json_encode($response);
            exit();
        }

        $sql = "
            SELECT 
                er.id as idRua,
                er.logradouro,
                -- NOTE: er.numero, er.complemento, and er.cep were removed from this SELECT statement
                -- because they do not exist in the 'enderecoRuas' table and were causing SQL errors.
                -- These fields are typically associated with a specific address instance, not the street definition.
                eb.id as idBairro,
                eb.nomeBairro as bairro,
                ec.id as idCidade,
                ec.nomeCidade as cidade,
                ec.uf
            FROM 
                enderecoRuas er
            JOIN 
                enderecoBairros eb ON er.idBairro = eb.id
            JOIN 
                enderecoCidades ec ON er.idCidade = ec.id
            WHERE
                " . implode(' AND ', $whereClauses) . "
            LIMIT 20
        ";
        
        log_to_file("SQL Query: " . preg_replace('/\s+/', ' ', $sql)); // Log the SQL query without interpolation
        log_to_file("Bound Params: " . json_encode($params));

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params); // Pass parameters directly to execute()
        $enderecos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response['success'] = true;
        $response['data'] = $enderecos;
        $response['message'] = count($enderecos) . ' endereços encontrados.';
        log_to_file('Query successful. Found ' . count($enderecos) . ' addresses for term "' . $searchTerm . '".');
        log_to_file('Response Data: ' . json_encode($enderecos)); // Log the actual data being returned



    } catch (PDOException $e) {
        $response['message'] = 'Erro ao buscar endereços: ' . $e->getMessage();
        log_to_file('PDOException: ' . $e->getMessage()); // Log PDO exceptions
    }
} else {
    $response['message'] = 'Método de requisição inválido.';
    log_to_file('Invalid request method.'); // Log invalid method
}

echo json_encode($response);
?>