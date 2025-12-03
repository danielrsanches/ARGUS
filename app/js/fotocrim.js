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
    },
    function (err) {
        if (err) {
            let msg = "❌ Erro ao carregar o módulo fotocrim -> " + err;
            console.error(msg);
            return alert(msg);
        }

        //aqui o template já foi totalmente carregado...

        //prettier-ignore
        dsPesquisa.exec("viewFotocrim","php/dsPesquisaConfig.php",function (resp) {
                if (!resp.success) {
                    alert(resp.message || "Erro ao pesquisar.");
                    return;
                }

                renderizaCards(resp);

            },[showSpinner, hideSpinner] /* funções para mostrar/esconder o spinner */
        );

        //prettier-ignore
        $("button.pesquisa").on("click", function () {
            dsPesquisa("viewFotocrim","php/dsPesquisaConfig.php",function (resp) {
                    if (!resp.success) {
                        alert(resp.message || "Erro ao pesquisar.");
                        return;
                    }

                    renderizaCards(resp);

                },[showSpinner,hideSpinner,] /* funções para mostrar/esconder o spinner */
            );
        });
    }
);

function renderizaCards(dados) {

    // carregua o template do card em 'template'...
    loadCard("html/fotocrim.html", "section.card").then((template) => {

        //esconde e limpa o conteúdo atual...
        $("section#fotocrim div.content").hide();
        $("section#fotocrim div.content").empty();

        var cardTemplate = null;
        dados.data.forEach((element) => {
            cardTemplate = template.outerHTML;
            cardTemplate = cardTemplate.replaceAll("${id}", element.id);
            cardTemplate = cardTemplate.replaceAll("${createdAt}", element.createdAt);
            cardTemplate = cardTemplate.replaceAll("${updatedAt}", element.updatedAt);
            cardTemplate = cardTemplate.replaceAll("${nomeCompleto}", element.nomeCompleto);
            cardTemplate = cardTemplate.replaceAll("${faccao}", element.faccao);
            cardTemplate = cardTemplate.replaceAll("${cpf}", element.cpf);
            cardTemplate = cardTemplate.replaceAll("${rg}", element.rg);
            cardTemplate = cardTemplate.replaceAll("${rgc}", element.rgc);
            cardTemplate = cardTemplate.replaceAll("${matricula}", element.matricula);
            cardTemplate = cardTemplate.replaceAll("${dataNascimento}", element.dataNascimento);

            $("section#fotocrim div.content").append(cardTemplate);
        });

        $("section#fotocrim div.content").fadeIn();
    });
}
