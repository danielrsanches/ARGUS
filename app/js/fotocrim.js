//limpa CSS e JS não fixos...
clearCss();
clearJs();

//carrega o template do módulo...
loadTemplate(
    {
        alvo: "main#modulo", //alvo onde o template será inserido...
        template: "html/fotocrim.html section#fotocrim", //template a ser carregado...
        css: ["css/fotocrim.css", "css/modal.css"], //CSS específico do módulo + outros CSS necessários...
        js: ["vendor/dsPesquisa/dsPesquisa.js"], //arquivos JS necessários (exceto do próprio módulo, pq é este arquivo aqui)...
    },
    function (err) {
        if (err) {
            let msg = "❌ Erro ao carregar o módulo fotocrim -> " + err;
            console.error(msg);
            return alert(msg);
        }

        /*
        ================== aqui o template já foi totalmente carregado ==================
        */

        //prettier-ignore
        //executa a pesquisa sem abertura do formulário, com o filtro salvo ou padrão...
        dsPesquisa.exec("viewFotocrim","php/dsPesquisaConfig.php",function (resp) {
            /* resp contém os dados retornados pela pesquisa...
            resp.success -> indica se a pesquisa foi bem sucedida (true/false)
            resp.data -> array com os registros retornados
            resp.__totalPesquisa -> total de registros na pesquisa (sem paginação)
            resp.__totalRegistros -> total de registros na tabela (no banco de dados)
            */

            if (!resp.success) {
                alert(resp.message || "Erro ao pesquisar.");
                return;
            }

            //renderiza os cards na tela com renderTotal para substituir todos os cards pelos novos...
            renderizaCards({templatePath: "html/fotocrim.html", templateSelector: "section.card", templateTarget: "section#fotocrim div.content", dados: resp.data, renderTotal: true});

        //showSpinner e hideSpinner são funções para mostrar/esconder o spinner de carregamento (são parâmetros opcionais)...
        },[showSpinner, hideSpinner]);

        //prettier-ignore
        // abre o formulário de pesquisa ao clicar no botão...
        $("button.pesquisa").on("click", function () {
            dsPesquisa("viewFotocrim","php/dsPesquisaConfig.php",function (resp) {
                /* resp contém os dados retornados pela pesquisa...
                resp.success -> indica se a pesquisa foi bem sucedida (true/false)
                resp.data -> array com os registros retornados
                resp.__totalPesquisa -> total de registros na pesquisa (sem paginação)
                resp.__totalRegistros -> total de registros na tabela (no banco de dados)
                */
                if (!resp.success) {
                    alert(resp.message || "Erro ao pesquisar.");
                    return;
                }

                //renderiza os cards na tela com renderTotal para substituir todos os cards pelos novos...
                renderizaCards({templatePath: "html/fotocrim.html", templateSelector: "section.card", templateTarget: "section#fotocrim div.content", dados: resp.data, renderTotal: true});

            //showSpinner e hideSpinner são funções para mostrar/esconder o spinner de carregamento (são parâmetros opcionais)...
            },[showSpinner,hideSpinner,]);

        }); //fim do on click pesquisa

        /* =================================================
        //define os eventos do módulo...
        ================================================= */
        {
            //ativa o drag dos modais...
            elementDrag("div.modalBackdrop div.modal div.modalTitulo", "div.modalBackdrop div.modal");

            //botão fechar do modal...
            $("div.modalBackdrop div.modal div.modalTitulo button.fechar, div.modalBackdrop div.modal div.modalRodape button.cancelar").on("click", function () {
                $(this).closest("section.fotocrimForm").css("display", "flex").fadeOut(200);
            });

            //botão novo...
            $("section.fotocrim div.topBarModulo div.menuModulo button.novo").on("click", function () {
                $("section.fotocrimForm").css("display", "none").fadeIn(200);
            });
        }
        /* ================================================= */
    } //fim do loadTemplate
);

// Função para gerar o HTML de um card com base no template e nos dados
// esta função deve ter esse nome, pois, é utilizada pela função genérica geral.js -> renderizaCards()
function gerarCardHTML(template, element) {
    // obtém o HTML do template como string... vem da função geral.js -> renderizaCards() como objeto DOM
    // e deve ser retornada como string com os dados preenchidos...
    let cardTemplate = template.outerHTML;

    cardTemplate = cardTemplate.replaceAll("${id}", element.id);
    cardTemplate = cardTemplate.replaceAll("${createdAt}", dateInvert(element.createdAt, true));
    cardTemplate = cardTemplate.replaceAll("${updatedAt}", dateInvert(element.updatedAt, true));
    cardTemplate = cardTemplate.replaceAll("${periculosidadeClass}", element.periculosidade === "Alta" ? "periculosidadeAlta" : element.periculosidade === "Média" ? "periculosidadeMedia" : "");
    cardTemplate = cardTemplate.replaceAll("${periculosidade}", element.periculosidade);
    cardTemplate = cardTemplate.replaceAll("${nomeCompleto}", element.nomeCompleto);
    cardTemplate = cardTemplate.replaceAll("${documentosResumo}", formataDocumentosResumo(element.documentosResumo));
    cardTemplate = cardTemplate.replaceAll("${vulgosResumo}", element.vulgosResumo ? ` (${element.vulgosResumo})` : "");
    cardTemplate = cardTemplate.replaceAll("${red}", element.faccaoResumo ? "red" : "");
    cardTemplate = cardTemplate.replaceAll("${faccao}", element.faccaoResumo || "");
    cardTemplate = cardTemplate.replaceAll("${cpf}", element.cpf);
    cardTemplate = cardTemplate.replaceAll("${rg}", element.rg);
    cardTemplate = cardTemplate.replaceAll("${rgc}", element.rgc);
    cardTemplate = cardTemplate.replaceAll("${matricula}", element.matricula);
    cardTemplate = cardTemplate.replaceAll("${dataNascimento}", dateInvert(element.dataNascimento, false));
    cardTemplate = cardTemplate.replaceAll("${sexo}", element.sexo === "M" ? "Masculino" : element.sexo === "F" ? "Feminino" : "Outro");
    cardTemplate = cardTemplate.replaceAll("${naturalidade}", element.naturalidadeEstado);
    cardTemplate = cardTemplate.replaceAll("${nomeMae}", element.nomeMae);
    cardTemplate = cardTemplate.replaceAll("${nomePai}", element.nomePai);
    cardTemplate = cardTemplate.replaceAll("${antecedentesQuantidade}", element.antecedentesQuantidade ? "green" : "");
    cardTemplate = cardTemplate.replaceAll("${enderecosQuantidade}", element.enderecosQuantidade ? "green" : "");
    cardTemplate = cardTemplate.replaceAll("${tatuagensQuantidade}", element.tatuagensQuantidade ? "green" : "");
    cardTemplate = cardTemplate.replaceAll("${comparsasJson}", element.comparsasJson ? "green" : "");
    cardTemplate = cardTemplate.replaceAll("${fotosQuantidade}", element.fotosQuantidade ? "green" : "");
    cardTemplate = cardTemplate.replaceAll("${arquivosQuantidade}", element.arquivosQuantidade ? "green" : "");

    return cardTemplate; // retorna o HTML do card com os dados preenchidos
}

// Função para aplicar eventos aos cards
// esta função deve ter esse nome, pois, é utilizada pela função genérica geral.js -> renderizaCards()
function aplicaEventos(id) {
    //adiciona o evento de seleção do card...
    $("section.card[data-id='" + id + "'] div.topBar").on("click", function () {
        const isSelected = $(this).find("span.campo[data-field='id']").attr("data-selected") || false;
        $(this)
            .find("span.campo[data-field='id']")
            .attr("data-selected", isSelected === "true" ? false : true);
    });
}

// Função para formatar o campo documentosResumo...
function formataDocumentosResumo(texto) {
    if (!texto) return "";

    const mapaTipos = {
        cpf: "CPF",
        rgSp: "RG/SP",
        rgCriminal: "RGC",
        rgOutroEstado: "RG (outro estado)",
        matricula: "Matrícula",
        outro: "Outro",
    };

    const ordemTipos = {
        cpf: 1,
        rgSp: 2,
        rgCriminal: 3,
        matricula: 4,
        rgOutroEstado: 5,
        outro: 99,
    };

    return texto
        .split("\n")
        .map((linha) => {
            const [tipo, ...resto] = linha.split(":");
            return {
                tipo: tipo,
                valor: resto.join(":").trim(),
            };
        })
        .sort((a, b) => (ordemTipos[a.tipo] ?? 50) - (ordemTipos[b.tipo] ?? 50))
        .map((item) => {
            const titulo = mapaTipos[item.tipo] ?? item.tipo;
            return `<strong>${titulo}</strong>: ${item.valor}`;
        })
        .join("; ");
}
