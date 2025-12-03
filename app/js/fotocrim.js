//limpa CSS e JS não fixos...
clearCss();
clearJs();

//carrega o template do módulo...
loadTemplate(
    {
        alvo: "main#modulo",
        template: "html/fotocrim.html section#fotocrim",
        css: "css/fotocrim.css",
        js: ["vendor/dsPesquisa/dsPesquisa.js","js/modulo.js"],
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
            cardTemplate = cardTemplate.replaceAll("${createdAt}", dateInvert(element.createdAt, true));
            cardTemplate = cardTemplate.replaceAll("${updatedAt}", dateInvert(element.updatedAt, true));
            if(element.periculosidade == "Alta") {cardTemplate = cardTemplate.replaceAll("${periculosidadeClass}", "periculosidadeAlta")}
            if(element.periculosidade == "Média") {cardTemplate = cardTemplate.replaceAll("${periculosidadeClass}", "periculosidadeMedia")}
            cardTemplate = cardTemplate.replaceAll("${periculosidade}", element.periculosidade);
            cardTemplate = cardTemplate.replaceAll("${nomeCompleto}", element.nomeCompleto);
            cardTemplate = cardTemplate.replaceAll("${vulgosResumo}", (element.vulgosResumo) ? " (" + element.vulgosResumo + ")" : "");
            if(element.faccaoResumo) {cardTemplate = cardTemplate.replaceAll("${red}", "red")} else {cardTemplate = cardTemplate.replaceAll("${red}", "")}   
            cardTemplate = cardTemplate.replaceAll("${faccao}", element.faccaoResumo || "");
            cardTemplate = cardTemplate.replaceAll("${cpf}", element.cpf);
            cardTemplate = cardTemplate.replaceAll("${rg}", element.rg);
            cardTemplate = cardTemplate.replaceAll("${rgc}", element.rgc);
            cardTemplate = cardTemplate.replaceAll("${matricula}", element.matricula);
            cardTemplate = cardTemplate.replaceAll("${dataNascimento}", dateInvert(element.dataNascimento, false));
            cardTemplate = cardTemplate.replaceAll("${sexo}", (element.sexo == "M") ? "Masculino" : (element.sexo == "F") ? "Feminino" : "Outro");
            cardTemplate = cardTemplate.replaceAll("${naturalidade}", element.naturalidadeEstado);
            cardTemplate = cardTemplate.replaceAll("${nomeMae}", element.nomeMae);
            cardTemplate = cardTemplate.replaceAll("${nomePai}", element.nomePai);
            cardTemplate = cardTemplate.replaceAll("${antecedentesQuantidade}", (element.antecedentesQuantidade) ? "green" : "");
            cardTemplate = cardTemplate.replaceAll("${enderecosQuantidade}", (element.enderecosQuantidade) ? "green" : "");
            cardTemplate = cardTemplate.replaceAll("${tatuagensQuantidade}", (element.tatuagensQuantidade) ? "green" : "");
            cardTemplate = cardTemplate.replaceAll("${comparsasJson}", (element.comparsasJson) ? "green" : "");
            cardTemplate = cardTemplate.replaceAll("${fotosQuantidade}", (element.fotosQuantidade) ? "green" : "");
            cardTemplate = cardTemplate.replaceAll("${arquivosQuantidade}", (element.arquivosQuantidade) ? "green" : "");

            $("section#fotocrim div.content").append(cardTemplate);

            //adiciona o evento de seleção do card...
            $("section.card[data-id='"+element.id+"'] div.topBar").on("click", function() {
                const isSelected = $(this).find("span.campo[data-field='id']").attr("data-selected") || false;
                $(this).find("span.campo[data-field='id']").attr("data-selected", (isSelected === "true") ? false : true);
            });
        });

        $("section#fotocrim div.content").fadeIn();
    });
}
