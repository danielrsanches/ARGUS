function dsSelect(config) {
    //captura a configuração padrão ou define valores padrão...
    if (config && typeof config === "object" && !Array.isArray(config)) {
        config.selector = config.selector || ".dsSelect";
        config.placeholder = config.placeholder || "Selecione...";
        config.searchable = config.searchable !== undefined ? config.searchable : true;
    } else {
        console.error('dsPesquisa: O parâmetro "config" não é um objeto válido.');
    }

    var obj = $(config.selector); //elemento(s) alvo...

    obj.each(function (index, select) {
        //$(select).css("display", "none"); //oculta o select original...
        const $options = $(select).find("option"); // Captura a lista de <option> do select...

        //cria o dsSelect
        var dsSelectContainer = $('<div class="dsSelectContainer"></div>');
        const dsSelectInput = $('<input type="text" class="dsSelectInput" placeholder="'+config.placeholder+'" />');
        const dsSelectPlaceholder = $('<div class="dsSelectPlaceholder dsSelectOption" value="">' + config.placeholder + '</div>');
        const dsSelectOptionTemplate = $('<div class="dsSelectOption" value=""></div>');

        $(dsSelectContainer).append($(dsSelectInput)); //adiciona o input ao container...
        $(dsSelectContainer).append($(dsSelectPlaceholder)); //adiciona o placeholder ao container...

        //adiciona as opções ao dsSelect
        $options.each(function () {
            let dsSelectOptionClone = $(dsSelectOptionTemplate).clone();
            dsSelectOptionClone.attr("value", $(this).val()).html($(this).text());
            $(dsSelectContainer).append($(dsSelectOptionClone));
        });

        $(select)[0].insertAdjacentElement("afterend", dsSelectContainer[0]); //insere o dsSelect após o select original...

        $(select).css("display", "none"); //oculta o select original...
    });
}
