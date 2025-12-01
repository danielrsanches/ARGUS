//limpa CSS e JS não fixos...
clearCss();
clearJs();

//carrega o template do módulo...
loadTemplate(
    {
        alvo: "main#modulo",
        template: "html/fotocrim.html section#fotocrim",
        css: "css/fotocrim.css",
        js: "vendor/dsPesquisa/dsPesquisa.js",
        clearOld: true,
    },
    function (err) {
        if (err) {
            let msg = "❌ Erro ao carregar o módulo fotocrim -> " + err;
            console.error(msg);
            return alert(msg);
        }

        //aqui o template já foi totalmente carregado...
        $("button.pesquisa").on("click", function () {
            dsPesquisa("viewFotocrim", "php/dsPesquisaConfig.php", function (resp) {
                if (!resp.success) {
                    alert(resp.message || "Erro ao pesquisar.");
                    return;
                }

                // aqui você processa o resultado da pesquisa
                console.log("Resultado da pesquisa Fotocrim:", resp);

                // aqui você atualiza a grid/lista do módulo
                // exemplo:
                // atualizarGridFotocrim(resp.data);
            });
        });
    }
);
