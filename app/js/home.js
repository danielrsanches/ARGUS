//limpa CSS e JS não fixos...
clearCss();
clearJs();

//carrega o template do módulo...
loadTemplate({alvo: "main#modulo", template: "html/home.html section#home", css: "css/home.css", js: ""}, function(err){
    if(err){
        console.error("Erro ao carregar o módulo home -> " + err);
        return alert("Erro ao carregar o módulo home -> " + err);
    }
})
