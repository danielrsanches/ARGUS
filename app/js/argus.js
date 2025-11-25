/**
 * Carrega arquivos CSS dinamicamente.
 * @param {(string|string[]|null)} files Caminho único ou lista de caminhos CSS.
 * @param {Function} [callback] Função chamada ao finalizar (callback(err)).
 */
function loadCss(files, callback) {
    callback = callback || function () {};

    // Normaliza lista: string | array | null
    var list = Array.isArray(files) ? files : (files ? [files] : []);

    // Se não há arquivos → finaliza
    if (!list.length) return callback(null);

    var pend = list.length;
    var falhou = false;

    function done(err) {
        if (falhou) return;
        if (err) {
            falhou = true;
            return callback(err);
        }
        pend--;
        if (pend === 0) callback(null);
    }

    list.forEach(function (href) {
        // Evita duplicar
        if (document.querySelector('link[rel="stylesheet"][href="' + href + '"]')) {
            return done(null);
        }

        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;

        link.onload = function () { done(null); };
        link.onerror = function () { done(new Error("Falha ao carregar CSS: " + href)); };

        document.head.appendChild(link);
    });
}





/**
 * Remove todos os <link rel="stylesheet"> que NÃO tenham data-type="fixed".
 */
function clearCss() {
    $('link[rel="stylesheet"]').each(function () {
        if ($(this).data("type") !== "fixed") {
            $(this).remove();
        }
    });
}




/**
 * Remove todos os <script src="..."> que NÃO tenham data-type="fixed".
 */
function clearJs() {
    $('script[src]').each(function () {
        if ($(this).data("type") !== "fixed") {
            $(this).remove();
        }
    });
}




// Carrega scripts JS dinamicamente, sem remover os antigos.
// A limpeza de scripts não-fixed agora é feita por clearJs().
function loadJs(files, callback) {
    callback = callback || function () { };

    // Normaliza lista: string | array | null
    var list = Array.isArray(files) ? files : (files ? [files] : []);

    // Se não há JS novo, finaliza
    if (!list.length) return callback(null);

    var pend = list.length;
    var falhou = false;

    function done(err) {
        if (falhou) return;
        if (err) {
            falhou = true;
            return callback(err);
        }
        pend--;
        if (pend === 0) callback(null);
    }

    list.forEach(function (src) {
        // evita duplicar
        if (document.querySelector('script[src="' + src + '"]')) {
            return done(null);
        }

        var s = document.createElement("script");
        s.src = src;
        s.defer = true; // não bloqueia o parser

        s.onload = function () { done(null); };
        s.onerror = function () { done(new Error("Falha ao carregar JS: " + src)); };

        document.head.appendChild(s);
    });
}



/* -> Carrega um template em um alvo especificado, já carregando dinamicamente os arquivos CSS e JS correspondentes...
   data = {
     alvo: "main#modulo", //seletor onde será carregado o template
     template: "../html/home.html section#home", // "URL seletor"
     css: "css/home.css" | ["css/home.css", ...],
     js: "js/home.js"   | ["js/home.js",   ...]
     clearOld: boolean // limpa o CSS antigo que não contenha data-type: fixed...
   }
   Ordem: CSS -> Template -> JS
*/
function loadTemplate(data, callback) {
    callback = callback || function () { };

    // garante objeto
    if (typeof data !== "object" || data === null) data = {};

    var alvo = data.alvo || "main#modulo";
    var template = data.template || ""; // suporta "url seletor"
    var css = data.css || null; // string ou array
    var js = data.js || null; // string ou array
    var clearOld = (typeof data.clearOld === "boolean") ? data.clearOld : true;

    if (!template) {
        return callback(new Error("loadTemplate -> template não fornecido."));
    }

    // limpa o alvo
    $(alvo).empty();

    // 1) CSS primeiro
    loadCss(css, function (errCss) {
        if (errCss) return callback(errCss);

        // 2) template no alvo (jQuery aceita "url seletor")
        $(alvo).load(template, function (response, status, xhr) {
            if (status !== "success") {
                return callback(new Error("loadTemplate -> falha ao carregar template (" + (xhr && xhr.status) + ")"));
            }

            // 3) JS por último
            loadJs(js, function (errJs) {
                if (errJs) return callback(errJs);

                // sucesso
                callback(null);
            });
        });
    });
}




/**
 * Monta e exibe o modal de pesquisa.
 * @param {string} titulo Título exibido no modal.
 * @param {Object<string,string>} campos Mapa {campoInterno: "Label"}. Se vazio, usa camposLabels.
 * @param {string} [storageKey] Chave no localStorage para salvar/restaurar filtros.
 * @param {Function} callback Função chamada ao aplicar, recebendo {pesquisaGlobal, filtros:{campo:[valores]}}.
 */
function montaPesquisa(titulo, campos, storageKey, callback) {
    var mapaCampos = (campos && Object.keys(campos).length) ? campos : (camposLabels || {});
    var campoAtual = null;
    var labelPesquisaGlobal = "Pesquisa global";

    // garante container #pesquisa
    var $container = $("div#pesquisa");
    if (!$container.length) {
        $container = $("<div>", { id: "pesquisa" });
        $("body").append($container);
    }

    loadTemplate({
        alvo: "div#pesquisa",
        template: "html/pesquisa.html",
        css: ["css/pesquisa.css","css/modal.css"],
        clearOld: false //não limpa o CSS antigo...
    }, function (err) {
        if (err) {
            console.error("montaPesquisa -> erro ao carregar template:", err);
            $("div#pesquisa").remove();
            return;
        }

        var $modal = $("div#pesquisaModal");
        if (!$modal.length) {
            console.error("montaPesquisa -> #pesquisaModal não encontrado em html/pesquisa.html");
            $("div#pesquisa").empty().remove();
            return;
        }

        // -----------------------------
        // helpers internos
        // -----------------------------

        function fecharModal() {
            $(document).off("keydown.pesquisa");
            $(document).off("mousemove.pesquisaDrag mouseup.pesquisaDrag");
            $modal.find("header.pesquisaModalHeader").off(".pesquisaDrag");

            if ($modal.length) {
                $modal.removeClass("aberto").attr("aria-hidden", "true");
            }

            var $cont = $("div#pesquisa");
            if ($cont.length) {
                $cont.empty().remove();
            }
        }

        function montarListaCampos() {
            var $lista = $("ul#pesquisaCamposLista");
            $lista.empty();

            var ordenados = Object.entries(mapaCampos).sort(function (a, b) {
                var labelA = String(a[1] || "").toLowerCase();
                var labelB = String(b[1] || "").toLowerCase();
                return labelA.localeCompare(labelB);
            });

            ordenados.forEach(function (par) {
                var campo = par[0];
                var label = par[1];

                var $li = $("<li></li>")
                    .addClass("campoItem")
                    .attr("data-campo", campo)
                    .append(
                        $("<span></span>")
                            .addClass("campoLabel")
                            .text(label)
                    );

                $lista.append($li);
            });
        }

        function atualizarEditorCampo(campo) {
            var $editor = $("div#pesquisaEditorCampo");
            var $labelEditor = $("span#pesquisaEditorCampoLabel");
            var $inputEditor = $("input#pesquisaEditorCampoInput");

            if (!campo || !mapaCampos[campo]) {
                campoAtual = null;
                $labelEditor.text("");
                $inputEditor.val("");
                $editor.css("display", "none");
                return;
            }

            campoAtual = campo;
            var label = mapaCampos[campo] || campo;

            $labelEditor.text(label + ":");
            $inputEditor
                .val("")
                .attr(
                    "placeholder",
                    'Digite: "frase exata", 10..20 para intervalos, -palavra para excluir'
                );
            $editor.css("display", "flex");


            setTimeout(function () {
                $inputEditor.trigger("focus");
            }, 0);
        }

        // cria cartão de filtro
        function criarChip(campo, valor) {
            if (!campo || !valor) return;

            var $chipsContainer = $("div#pesquisaChipsContainer");
            if (!$chipsContainer.length) return;

            var labelCampo = (campo === "pesquisaGlobal")
                ? labelPesquisaGlobal
                : (mapaCampos[campo] || campo);

            var $chip = $("<div></div>")
                .addClass("chipFiltro")
                .attr("data-campo", campo)
                .attr("data-valor", valor);

            var $header = $("<div></div>").addClass("chipHeader");
            var $campoSpan = $("<span></span>")
                .addClass("chipCampo")
                .text(labelCampo);

            var $btnRemover = $("<button></button>")
                .attr("type", "button")
                .addClass("chipRemover")
                .html("&times;");

            $header.append($campoSpan, $btnRemover);

            var $valorSpan = $("<span></span>")
                .addClass("chipValor")
                .text(valor);

            $chip.append($header, $valorSpan);
            $chipsContainer.append($chip);
        }

        function salvarEstadoAtual() {
            if (!storageKey) return;

            var globalValor = "";
            var filtros = [];

            $("div#pesquisaChipsContainer div.chipFiltro").each(function () {
                var campo = $(this).attr("data-campo");
                var valor = $(this).attr("data-valor");
                if (!campo || !valor) return;

                if (campo === "pesquisaGlobal") {
                    globalValor = valor;
                } else {
                    filtros.push({ campo: campo, valor: valor });
                }
            });

            var estado = {
                global: globalValor,
                filtros: filtros
            };

            try {
                localStorage.setItem(storageKey, JSON.stringify(estado));
            } catch (e) {
                console.warn("montaPesquisa -> não foi possível salvar no localStorage:", e);
            }
        }

        function carregarEstadoSalvo() {
            if (!storageKey) return;

            var bruto;
            try {
                bruto = localStorage.getItem(storageKey);
            } catch (e) {
                console.warn("montaPesquisa -> erro ao ler localStorage:", e);
                return;
            }
            if (!bruto) return;

            var estado;
            try {
                estado = JSON.parse(bruto);
            } catch (e) {
                console.warn("montaPesquisa -> JSON inválido no localStorage:", e);
                return;
            }

            if (estado && typeof estado.global === "string" && estado.global.trim() !== "") {
                $("input#pesquisaGlobalInput").val(estado.global);
                criarChip("pesquisaGlobal", estado.global);
            }

            if (estado && Array.isArray(estado.filtros)) {
                estado.filtros.forEach(function (f) {
                    if (!f || !f.campo || !f.valor) return;
                    if (!mapaCampos[f.campo]) return;
                    criarChip(f.campo, f.valor);
                });
            }
        }

        function montarJsonPesquisa() {
            var json = {
                pesquisaGlobal: "",
                filtros: []
            };

            $("div#pesquisaChipsContainer div.chipFiltro").each(function () {
                var campo = $(this).attr("data-campo");
                var valor = $(this).attr("data-valor");
                if (!campo || !valor) return;

                if (campo === "pesquisaGlobal") {
                    json.pesquisaGlobal = valor;
                } else {
                    json.filtros.push({ campo: campo, valor: valor });
                }
            });

            return json;
        }


        function prepararModal() {
            $("h2#pesquisaTitulo").text(titulo || "Pesquisa");

            $("input#pesquisaGlobalInput").val("");
            $("input#pesquisaMetaCampoInput").val("");
            $("div#pesquisaChipsContainer").empty();

            montarListaCampos();
            atualizarEditorCampo(null);
            carregarEstadoSalvo();

            var $global = $("input#pesquisaGlobalInput");
            if ($global.length) {
                setTimeout(function () {
                    $global.trigger("focus");
                }, 0);
            }
        }

        function habilitarArraste() {
            var $caixa = $modal.find("div.pesquisaModalCaixa");
            var $header = $modal.find("header.pesquisaModalHeader");

            if (!$caixa.length || !$header.length) return;

            var arrastando = false;
            var offsetX = 0;
            var offsetY = 0;

            $header.on("mousedown.pesquisaDrag", function (ev) {
                if (ev.button !== 0) return;

                arrastando = true;
                var caixaOffset = $caixa.offset();
                offsetX = ev.pageX - caixaOffset.left;
                offsetY = ev.pageY - caixaOffset.top;

                ev.preventDefault();
            });

            $(document).on("mousemove.pesquisaDrag", function (ev) {
                if (!arrastando) return;

                var viewportW = $(window).width();
                var viewportH = $(window).height();
                var modalW = $caixa.outerWidth();
                var modalH = $caixa.outerHeight();

                var novoLeft = ev.pageX - offsetX;
                var novoTop = ev.pageY - offsetY;

                if (novoLeft < 0) novoLeft = 0;
                if (novoTop < 0) novoTop = 0;
                if (novoLeft + modalW > viewportW) novoLeft = viewportW - modalW;
                if (novoTop + modalH > viewportH) novoTop = viewportH - modalH;

                $caixa.css({
                    left: novoLeft + "px",
                    top: novoTop + "px"
                });
            });

            $(document).on("mouseup.pesquisaDrag", function () {
                if (!arrastando) return;
                arrastando = false;
            });
        }

        function centralizarModal() {
            var $caixa = $modal.find("div.pesquisaModalCaixa");
            if (!$caixa.length) return;

            var viewportW = $(window).width();
            var viewportH = $(window).height();
            var modalW = $caixa.outerWidth();
            var modalH = $caixa.outerHeight();

            var left = Math.max(0, (viewportW - modalW) / 2);
            var top = Math.max(0, (viewportH - modalH) / 2);

            $caixa.css({
                left: left + "px",
                top: top + "px"
            });
        }

        function registrarEventos() {
            $modal.off();
            $("button#pesquisaLimparBtn").off();
            $("button#pesquisaAplicarBtn").off();
            $("input#pesquisaMetaCampoInput").off();
            $("input#pesquisaEditorCampoInput").off();
            $("div#pesquisaChipsContainer").off();
            $("input#pesquisaGlobalInput").off();

            // fechar (X)
            $modal.on("click", "button.pesquisaFecharBtn", function () {
                fecharModal();
            });

            // clique no backdrop
            $modal.on("click", "div.pesquisaModalBackdrop", function () {
                fecharModal();
            });

            // impede fechamento ao clicar na caixa
            $modal.on("click", "div.pesquisaModalCaixa", function (ev) {
                ev.stopPropagation();
            });

            // ESC fecha
            $(document).on("keydown.pesquisa", function (ev) {
                if (ev.key === "Escape" && $modal.hasClass("aberto")) {
                    fecharModal();
                }
            });

            // ao focar em Pesquisa global ou Pesquisa de campos, seleciona todo o texto
            $("input#pesquisaGlobalInput, input#pesquisaMetaCampoInput").on("focus", function () {
                var input = this;
                // pequeno delay pra garantir que o foco esteja aplicado antes do select()
                setTimeout(function () {
                    input.select();
                }, 0);
            });


            // meta-pesquisa (filtra lista de campos)
            $("input#pesquisaMetaCampoInput").on("input", function () {
                var termo = $(this).val().toString().toLowerCase().trim();

                $("ul#pesquisaCamposLista li.campoItem").each(function () {
                    var texto = $(this).text().toLowerCase();
                    $(this).toggle(texto.includes(termo));
                });
            });

            // clique em campo -> seleciona para edição
            $modal.on("click", "li.campoItem", function () {
                var campo = $(this).attr("data-campo");
                if (!campo) return;

                $("ul#pesquisaCamposLista li.campoItem").removeClass("ativo");
                $(this).addClass("ativo");

                atualizarEditorCampo(campo);
            });

            // Enter no editor de campo -> cria cartão e volta foco para Pesquisa global
            $("input#pesquisaEditorCampoInput").on("keydown", function (ev) {
                if (ev.key === "Enter") {
                    ev.preventDefault();

                    var valor = $(this).val().toString().trim();
                    if (!valor || !campoAtual) return;

                    criarChip(campoAtual, valor);

                    $("ul#pesquisaCamposLista li.campoItem").removeClass("ativo");
                    atualizarEditorCampo(null);

                    // foco volta para a pesquisa de campos (refinamento)
                    var $meta = $("input#pesquisaMetaCampoInput");
                    if ($meta.length) {
                        setTimeout(function () {
                            $meta.trigger("focus");
                        }, 0);
                    }
                }
            });

            // CTRL + ENTER -> Aplicar imediatamente
            $(document).on("keydown.pesquisa", function (ev) {
                if (ev.ctrlKey && ev.key === "Enter") {
                    ev.preventDefault();
                    $("button#pesquisaAplicarBtn").trigger("click");
                }
            });

            // Enter na Pesquisa global -> cria/atualiza cartão "Pesquisa global" e JÁ APLICA
            $("input#pesquisaGlobalInput").on("keydown", function (ev) {
                if (ev.key === "Enter") {
                    ev.preventDefault();

                    var valor = $(this).val().toString().trim();
                    var $existente = $("div#pesquisaChipsContainer div.chipFiltro[data-campo='pesquisaGlobal']");

                    if (!valor) {
                        // se apagar o texto e der Enter, remove o chip da pesquisa global (se existir)
                        if ($existente.length) {
                            $existente.remove();
                        }
                    } else {
                        // cria ou atualiza o chip "Pesquisa global"
                        if ($existente.length) {
                            $existente.attr("data-valor", valor);
                            $existente.find("span.chipValor").text(valor);
                        } else {
                            criarChip("pesquisaGlobal", valor);
                        }
                    }

                    // agora deixa o "Aplicar" cuidar do resto (salvar, callback, fechar)
                    $("button#pesquisaAplicarBtn").trigger("click");
                }
            });


            // remover cartão individual
            $("div#pesquisaChipsContainer").on("click", "button.chipRemover", function () {
                $(this).closest("div.chipFiltro").remove();
            });

            // limpar tudo
            $("button#pesquisaLimparBtn").on("click", function () {
                $("input#pesquisaGlobalInput").val("");
                $("input#pesquisaMetaCampoInput").val("");
                $("div#pesquisaChipsContainer").empty();
                $("ul#pesquisaCamposLista li.campoItem").removeClass("ativo").show();
                atualizarEditorCampo(null);
                $("input#pesquisaGlobalInput").select();
            });

            $("button#pesquisaAplicarBtn").on("click", function () {
                salvarEstadoAtual();
                var resultado = montarJsonPesquisa();
                if (typeof callback === "function") {
                    callback(resultado);
                }
                fecharModal();
            });


            habilitarArraste();
        }

        // -----------------------------
        // prepara, abre e centraliza
        // -----------------------------
        prepararModal();
        registrarEventos();

        $modal.addClass("aberto").attr("aria-hidden", "false");

        setTimeout(function () {
            centralizarModal();
        }, 0);
    });
}