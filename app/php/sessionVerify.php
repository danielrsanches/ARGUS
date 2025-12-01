<?php

// -> Este arquivo é exclusivo para verificação de autenticação de usuário, retornando os dados em caso de positivo e null em caso negativo...

// Garante sessão ativa
function __auth_boot()
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

// Retorna array do usuário logado ou null
function current_user()
{
    //retirar essas 2 linhas abaixo quando integrar com sistema de autenticação real...
    $user = ['id' => 1, 'nome' => 'Cb PM 116858-4 Daniel Rodrigo Sanches da Cruz']; //simula a função current_user()...
    return $user;

    __auth_boot();
    if (!empty($_SESSION['idUsuario'])) {
        return [
            'id'   => $_SESSION['idUsuario'],
            'nome' => $_SESSION['nomeUsuario'] ?? null,
        ];
    }
    return null;
}
