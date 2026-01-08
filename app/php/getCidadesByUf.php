<?php
require_once 'db.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => '', 'data' => []];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $uf = filter_input(INPUT_POST, 'uf', FILTER_SANITIZE_SPECIAL_CHARS);

    if (empty($uf)) {
        $response['message'] = 'UF não fornecida.';
        echo json_encode($response);
        exit();
    }

    try {
        $pdo = db(); // Get the PDO instance
        $stmt = $pdo->prepare("SELECT id, nomeCidade FROM enderecoCidades WHERE uf = :uf ORDER BY nomeCidade ASC");
        $stmt->execute([':uf' => $uf]);
        $cidades = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response['success'] = true;
        $response['data'] = $cidades;
    } catch (PDOException $e) {
        $response['message'] = 'Erro ao buscar cidades: ' . $e->getMessage();
    }
} else {
    $response['message'] = 'Método de requisição inválido.';
}

echo json_encode($response);
?>