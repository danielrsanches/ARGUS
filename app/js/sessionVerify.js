// Esta função será chamada assim que a página for carregada
// Faz a verificação no backend se o usuário está logado...
$(document).ready(function () {

    // Faz uma requisição AJAX para verificar a sessão no servidor
    $.ajax({
        url: 'php/sessionVerifyFront.php', // caminho do PHP que verifica o login
        method: 'GET',                // método HTTP (GET é o padrão)
        dataType: 'json',             // o PHP retorna um JSON
        cache: false,                 // impede cache (reforço ao no-store do PHP)

        success: function (resposta) {
            // Se o PHP respondeu "ok: true", o usuário está logado
            if (resposta.ok) {
                console.log('✅ Usuário autenticado: ' + resposta.nome);

                // Salva as infos em memória...
                window.usuario = resposta;

                //atualiza o usuário no rodapé
                $("footer#rodape div.user").html("Logado | " + resposta.nome);
            } 
            // Se o PHP respondeu "ok: false", significa que não há login ativo
            else {
                console.warn('⚠️ Sessão inválida. Exibindo tela de login...');
                alert("Abre tela de login aqui...");
            }
        },

        // Caso ocorra erro na conexão ou PHP retorne 401/500
        error: function (xhr, status, erro) {
            console.error('❌ Erro na verificação da sessão:', erro);
            alert("Abre tela de login aqui...");
        }
    });

});
