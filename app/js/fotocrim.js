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
            dsPesquisa(
                "viewFotocrim",
                "php/dsPesquisaConfig.php",
                function (resp) {
                    if (!resp.success) {
                        alert(resp.message || "Erro ao pesquisar.");
                        return;
                    }

                    // carregua o template do card...
                    loadCard("html/fotocrim.html", "section.card").then(
                        (template) => {
                            
                            $("section#fotocrim div.content").hide();
                            $("section#fotocrim div.content").empty();
                            var cardTemplate = null;
                            resp.data.forEach(element => {
                                cardTemplate = template.outerHTML;
                                cardTemplate = cardTemplate.replaceAll("${teste}", "Aqui é um placeholder");
                                
                                $("section#fotocrim div.content").append(cardTemplate);
                                
                            });
                            $("section#fotocrim div.content").fadeIn();
                        }
                    );
                },
                [
                    showSpinner,
                    hideSpinner,
                ] /* funções de callback para mostrar/esconder o spinner */
            );
        });
    }
);
