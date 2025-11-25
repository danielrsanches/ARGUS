//limpa CSS e JS não fixos...
clearCss();
clearJs();

//definição dos nomes amigáveis dos campos...
var camposLabels = {
    id: "ID",
    nome: "Nome",
    cpf: "CPF",
    rg: "RG",
    rgCriminal: "RG Criminal",
    matricula: "Matrícula",
}

//carrega o template do módulo...
loadTemplate({alvo: "main#modulo", template: "html/fotocrim.html section#fotocrim", css: "css/fotocrim.css", js: "", clearOld: true}, function(err){
    if(err){
        let msg = "❌ Erro ao carregar o módulo fotocrim -> " + err;
        console.error(msg);
        return alert(msg);
    }

    //aqui o template já foi totalmente carregado...
    $("button.pesquisa").on("click", function(){
        montaPesquisa("Pesquisa", camposLabels, "fotocrim", function(resultado){
            console.log(resultado);
        });
    })
})
