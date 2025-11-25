//limpa CSS e JS não fixos...
clearCss();
clearJs();

/*==================================================
= CONFIGURAÇÕES DA TABELA
==================================================*/
var tableConfig = {
    tableName: "fotocrim",
    orderByDefault: "nome ASC",
    limitDefault: 50,
    // prettier-ignore
    fields: [
        {name: "id", type: "bigint", label: "ID", searchable: true},
        {name: "nomeCompleto", type: "string", label: "Nome Completo", searchable: true},
        {name: "rg", type: "string", label: "RG", searchable: true},
        {name: "cpf", type: "string", label: "CPF", searchable: true},
        {name: "rgc", type: "string", label: "RGC", searchable: true},
        {name: "matricula", type: "string", label: "Matrícula", searchable: true},
        {name: "dataNascimento", type: "date", label: "Data de Nascimento", searchable: true},
        {name: "sexo", type: "enum", label: "Sexo", searchable: true},
        {name: "nomeMae", type: "string", label: "Nome da Mãe", searchable: true},
        {name: "nomePai", type: "string", label: "Nome do Pai", searchable: true},
        {name: "naturalidadeEstado", type: "enum", label: "Estado de Naturalidade", searchable: true},
        {name: "idFaccao", type: "bigint", label: "ID Facção", searchable: true},
        {name: "faccaoFuncao", type: "string", label: "Função na Facção", searchable: true},
        {name: "periculosidade", type: "enum", label: "Periculosidade", searchable: true},
        {name: "observacoes", type: "text", label: "Observações", searchable: true},
        {name: "observacoesReservadas", type: "text", label: "Observações Reservadas", searchable: true},
        {name: "createdAt", type: "datetime", label: "Criado em", searchable: true},
        {name: "updatedAt", type: "datetime", label: "Atualizado em", searchable: true}
    ],
    relations: [
        {
            table: "faccao",
            on: "pessoa.idFaccao = faccao.id",
            // prettier-ignore
            fields: [
                {name: "id", type: "bigint", label: "ID", searchable: true},
                {name: "nomeCurto", type: "string", label: "Nome Curto", searchable: true},
                {name: "nomeCompleto", type: "string", label: "Nome Completo", searchable: true},
                {name: "ativo", type: "boolean", label: "Ativo", searchable: true},
                {name: "createdAt", type: "datetime", label: "Criado em", searchable: false},
                {name: "updatedAt", type: "datetime", label: "Atualizado em", searchable: true}
            ],
        },
    ],
};

var tableConfigcamposLabels = {
    id: "ID",
    nome: "Nome",
    cpf: "CPF",
    rg: "RG",
    rgCriminal: "RG Criminal",
    matricula: "Matrícula",
};

//carrega o template do módulo...
loadTemplate(
    {
        alvo: "main#modulo",
        template: "html/fotocrim.html section#fotocrim",
        css: "css/fotocrim.css",
        js: "",
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
            montaPesquisa(
                "Pesquisa",
                camposLabels,
                "fotocrim",
                function (resultado) {
                    console.log(resultado);
                }
            );
        });
    }
);
