//limpa CSS e JS não fixos...
clearCss();
clearJs();

//carrega o template do módulo...
loadTemplate(
    {
        alvo: "main#modulo", //alvo onde o template será inserido...
        template: "html/home.html section#home", //template a ser carregado...
        css: "css/home.css", //CSS específico do módulo + outros CSS necessários...
        js: "", // arquivos JS necessários (exceto do próprio módulo, pq é este arquivo aqui)...
    },
    function (err) {
        if (err) {
            let msg = "❌ Erro ao carregar o módulo home -> " + err;
            console.error(msg);
            return alert(msg);
        }
    }
);
