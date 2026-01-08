<?php
require_once 'db.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => '', 'data' => []];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $idCidade = filter_input(INPUT_POST, 'idCidade', FILTER_VALIDATE_INT);

    if (empty($idCidade)) {
        $response['message'] = 'ID da Cidade não fornecido ou inválido.';
        echo json_encode($response);
        exit();
    }

    try {
        $pdo = db(); // Get the PDO instance
        // Seleciona bairros que estão associados a ruas naquela cidade
        $stmt = $pdo->prepare("
            SELECT DISTINCT eb.id, eb.nomeBairro 
            FROM enderecoBairros eb
            JOIN enderecoRuas er ON eb.id = er.idBairro
            WHERE er.idCidade = :idCidade
            ORDER BY eb.nomeBairro ASC
        ");
        $stmt->execute([':idCidade' => $idCidade]);
        $bairros = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response['success'] = true;
        $response['data'] = $bairros;
    } catch (PDOException $e) {
        $response['message'] = 'Erro ao buscar bairros: ' . $e->getMessage();
    }
} else {
    $response['message'] = 'Método de requisição inválido.';
}

echo json_encode($response);
?>