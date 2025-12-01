<?php
declare(strict_types=1);

/*
   DB CONNECTION
   → Retorna uma instância PDO conectada ao banco de dados
   ============================================================
*/
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = 'drsc.com.br';
    $port = '3306';
    $dbname = 'drscco66_argus';
    $user = 'drscco66_user';
    $pass = 'UpUDf1TPUNtIyK';

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    return $pdo;
}
