//funções dos botões do topbar...
$("button#novaJanela").on("click", function () {
    window.open(window.location.href, "_blank");
});
$("button#logout").on("click", function () {
    if (confirm("Deseja realmente sair?")) {
        alert("Função de logout aqui");
    }
});

//captura a hash da barra de endereços para carregar o módulo correspondente...
//destaca o item do menu correspondente ao módulo aberto...
var modulo = "#/home"; //módulo padrão...
$(document).ready(function () {
    //captura no carregamento da página...
    if (location.hash) modulo = location.hash;
    carregaModulo(modulo);
});
$(window).on("hashchange", function () {
    //captura após cada alteração....
    modulo = location.hash || "#/home";
    carregaModulo(modulo);
});
function carregaModulo(modulo) {
    const nomeModulo = modulo.replace("#/", "");

    //seleciona o item do menu correspondente ao módulo a ser carregado...
    $("aside#menuPrincipal a").removeClass("active"); //remove a classe active de todos os itens do menu...
    $('aside#menuPrincipal a[data-modulo="' + nomeModulo + '"]').addClass("active"); //adiciona a classe active no item do módulo...

    //chama o módulo correspondente...
    if(nomeModulo == "home") loadJs("js/home.js");
    if(nomeModulo == "fotocrim") loadJs("js/fotocrim.js");
}