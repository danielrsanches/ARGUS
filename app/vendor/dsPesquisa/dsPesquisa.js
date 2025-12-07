(function (window, document) {
    "use strict";

    // ---------------------------------------------------------
    // BASEPATH dinâmico (mesma pasta do dsPesquisa.js)
    // ---------------------------------------------------------
    function getBasePath() {
        var script = document.currentScript;
        if (!script) {
            var s = document.getElementsByTagName("script");
            script = s[s.length - 1];
        }
        var src = script.getAttribute("src") || "";
        return src.replace(/[^\/]+$/, "");
    }

    var basePath = getBasePath();
    var cssHref = basePath + "dsPesquisa.css";
    var htmlPath = basePath + "dsPesquisa.html";
    var phpPath = basePath + "dsPesquisa.php";
    var lsPrefix = "dsPesquisa:";

    // ---------------------------------------------------------
    // Garante jQuery LOCAL (sem CDN)
    // ---------------------------------------------------------
    function ensureJQ() {
        if (!window.jQuery) {
            console.error("dsPesquisa: jQuery não encontrado. Carregue-o antes deste script.");
            return null;
        }
        return window.jQuery;
    }

    // ---------------------------------------------------------
    // Carrega CSS
    // ---------------------------------------------------------
    function loadCSS() {
        if (document.querySelector("link[data-dspesquisa-css]")) return;
        var l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = cssHref;
        l.type = "text/css";
        l.setAttribute("data-dspesquisa-css", "1");
        document.head.appendChild(l);
    }

    // ---------------------------------------------------------
    // Carrega template HTML
    // ---------------------------------------------------------
    function loadTemplate($, cb) {
        var $m = $("#dsPesquisa");
        if ($m.length) return cb($m);

        $.get(htmlPath).done(function (html) {
            $("body").append(html);
            $m = $("#dsPesquisa");
            initEvents($, $m);
            cb($m);
        });
    }

    // ---------------------------------------------------------
    // LocalStorage
    // ---------------------------------------------------------
    function loadSaved(key) {
        try {
            var v = JSON.parse(localStorage.getItem(key) || "{}");
            return {
                pesquisaGlobal: v.pesquisaGlobal || "",
                pesquisaPorCampo: v.pesquisaPorCampo || {},
            };
        } catch (e) {
            return { pesquisaGlobal: "", pesquisaPorCampo: {} };
        }
    }

    function saveLS(key, obj) {
        try {
            localStorage.setItem(key, JSON.stringify(obj));
        } catch (e) {}
    }

    function clearLS(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {}
    }

    // ---------------------------------------------------------
    // Renderização
    // ---------------------------------------------------------
    function renderFieldButtons($, $m, ctx) {
        var $list = $m.find("div.dsCamposLista");
        if (!$list.data("done")) {
            $list.empty();
            (ctx.viewConfig.fields || []).forEach(function (f) {
                var lbl = f.label || f.name;
                var $b = $('<button type="button" class="campoBtn" id="campoBtn-' + f.name + '" data-field="' + f.name + '"></button>');
                $b.text(lbl);
                $b.attr("data-field", f.name);
                $b.attr("data-label", lbl.toLowerCase());
                $list.append($b);
            });
            $list.data("done", 1);
        }

        // Ajuste na função de busca para permitir correspondência em qualquer ordem de caracteres
        var termo = ($m.find("#dsCampoBuscaInput").val() || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[^\w\s]/g, ""); // Remove caracteres especiais

        var termos = termo.split(" ").filter(Boolean); // Divide o termo em palavras

        $list.find("button.campoBtn").each(function () {
            var txt = ($(this).attr("data-label") || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[^\w\s]/g, ""); // Remove caracteres especiais

            var show = termos.every(function (t) {
                return txt.includes(t); // Verifica se todas as palavras estão presentes
            });

            $(this).toggleClass("oculto", !show);
        });

        $list.find("button.campoBtn").each(function () {
            var fn = $(this).attr("data-field");
            $(this).toggleClass("selecionado", ctx.currentField === fn);
        });
    }

    function renderValorCampo($, $m, ctx) {
        var $box = $m.find("div.dsCampoValor");
        var $label = $m.find("div.dsCampoValorLabel");
        var $input = $m.find("#dsCampoValorInput");

        if (!ctx.currentField) {
            $box.removeClass("visivel");
            return;
        }

        var field = (ctx.viewConfig.fields || []).find(function (f) {
            return f.name === ctx.currentField;
        });
        var text = field ? field.label || field.name : ctx.currentField;

        $label.text('Digite o valor para "' + text + '":');
        $input.val(ctx.pesquisaPorCampo[ctx.currentField] || "");
        $box.addClass("visivel");
        $input.focus();
    }

    function renderAtivos($, $m, ctx) {
        var $list = $m.find("div.dsFiltrosAtivosLista");
        $list.empty();

        // Chip de pesquisa global
        if (ctx.pesquisaGlobal) {
            var $c = $('<div class="filtroCard" data-role="global"></div>');
            $c.append('<div class="cardHeader">' + '<div class="cardLabel">Pesquisa global</div>' + '<button type="button" class="remover">×</button>' + "</div>" + '<div class="cardValue"></div>');
            $c.find("div.cardValue").text(ctx.pesquisaGlobal);
            $list.append($c);
            // OBS: não amarramos click aqui; delegamos em initEvents
        }

        // Chips de filtros por campo
        Object.keys(ctx.pesquisaPorCampo || {}).forEach(function (fn) {
            var val = ctx.pesquisaPorCampo[fn];
            if (!val) return;

            var f = (ctx.viewConfig.fields || []).find(function (x) {
                return x.name === fn;
            });
            var lbl = f ? f.label || f.name : fn;

            var $c = $('<div class="filtroCard" data-role="campo"></div>');
            $c.attr("data-field", fn);
            $c.append('<div class="cardHeader">' + '<div class="cardLabel"></div>' + '<button type="button" class="remover">×</button>' + "</div>" + '<div class="cardValue"></div>');
            $c.find("div.cardLabel").text(lbl);
            $c.find("div.cardValue").text(val);
            $list.append($c);
            // OBS: não amarramos click aqui; delegamos em initEvents
        });
    }

    function renderOrdenacao($, $m, ctx) {
        var $select = $m.find("#dsPesquisaOrdenacao");
        // Evita repopular desnecessariamente
        if ($select.data("populated")) return;

        var fields = ctx.viewConfig.fields || [];
        var defaultOrder = ctx.viewConfig.orderByDefault || "";

        // Guarda o primeiro option ("Selecione...") e limpa o select
        var $firstOption = $select.find("option:first");
        $select.empty().append($firstOption);

        // Ordena os campos em ordem alfabética pelo label
        fields.sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name));

        // Popula o select com os campos da configuração (ASC e DESC)
        fields.forEach(function (field) {
            // ASC
            var $optionAsc = $("<option></option>");
            $optionAsc.val(`${field.name} ASC`);
            $optionAsc.text(`${field.label || field.name} ↑`); // Substituído por seta ASCII para cima
            $select.append($optionAsc);

            // DESC
            var $optionDesc = $("<option></option>");
            $optionDesc.val(`${field.name} DESC`);
            $optionDesc.text(`${field.label || field.name} ↓`); // Substituído por seta ASCII para baixo
            $select.append($optionDesc);
        });

        // Pré-seleciona a ordenação padrão (defaultOrder)
        if (defaultOrder) {
            $select.val(defaultOrder);
        }

        // Marca o select como populado para evitar retrabalho
        $select.data("populated", true);

        // Inicializa o TomSelect após o select estar pronto
        if ($select.length) {
            new TomSelect("#dsPesquisaOrdenacao");
        }
    }

    function renderFilters($, $m, ctx) {
        $m.find("#dsPesquisaGlobalInput").val(ctx.pesquisaGlobal || "");
        renderFieldButtons($, $m, ctx);
        renderValorCampo($, $m, ctx);
        renderAtivos($, $m, ctx);
    }

    function render($, $m, ctx) {
        renderOrdenacao($, $m, ctx);
        renderFilters($, $m, ctx);
    }

    // ---------------------------------------------------------
    // Eventos
    // ---------------------------------------------------------
    function initEvents($, $m) {
        if ($m.data("init")) return;
        $m.data("init", 1);

        var $overlay = $m.parent("div#dsPesquisaOverlay");

        // Fechar modal
        $m.on("click", "button.fechar", function () {
            $m.removeClass("aberta");
            $overlay.removeClass("aberta"); // Esconde overlay junto com o modal
        });

        $(document).on("keydown.dsPesquisa", function (e) {
            if (e.key === "Escape") {
                $m.removeClass("aberta");
                $overlay.removeClass("aberta"); // Esconde overlay junto com o modal
            }
        });

        $(document).on("keydown.dsPesquisa", function (e) {
            if (e.key === "Enter" && e.ctrlKey) {
                $m.find("button.pesquisar").trigger("click");
            }
        });

        // Pesquisa global (Enter)
        $m.on("keydown", "#dsPesquisaGlobalInput", function (e) {
            if (e.key !== "Enter") return;
            var ctx = $m.data("ctx") || {};
            ctx.pesquisaGlobal = (this.value || "").trim();
            $m.data("ctx", ctx);
            render($, $m, ctx);
        });

        // Filtro de campos (busca)
        $m.on("input", "#dsCampoBuscaInput", function () {
            var ctx = $m.data("ctx") || {};
            renderFieldButtons($, $m, ctx);
        });

        // Selecionar campo
        $m.on("click", "button.campoBtn", function () {
            var fn = $(this).attr("data-field");
            var ctx = $m.data("ctx") || {};
            ctx.currentField = ctx.currentField === fn ? null : fn;
            $m.data("ctx", ctx);
            render($, $m, ctx);
            $("#dsCampoValorInput").select();
        });

        // Enter no valor do campo
        $m.on("keydown", "#dsCampoValorInput", function (e) {
            if (e.key !== "Enter") return;
            var ctx = $m.data("ctx") || {};
            if (!ctx.currentField) return;

            var v = (this.value || "").trim();
            if (!ctx.pesquisaPorCampo) ctx.pesquisaPorCampo = {};

            if (v) ctx.pesquisaPorCampo[ctx.currentField] = v;
            else delete ctx.pesquisaPorCampo[ctx.currentField];

            ctx.currentField = null;
            $m.data("ctx", ctx);
            render($, $m, ctx);
        });

        // Remover chips (X)
        $m.on("click", "button.remover", function (e) {
            // IMPORTANTÍSSIMO: não deixar esse clique subir pro card
            e.stopPropagation();

            var $c = $(this).closest("div.filtroCard");
            var ctx = $m.data("ctx") || {};

            if ($c.attr("data-role") === "global") {
                ctx.pesquisaGlobal = "";
            } else {
                var fn = $c.attr("data-field");
                if (fn && ctx.pesquisaPorCampo) {
                    delete ctx.pesquisaPorCampo[fn];
                }
            }

            $m.data("ctx", ctx);
            render($, $m, ctx);
        });

        // Clique no chip GLOBAL (fora do X)
        $m.on("click", "div.filtroCard[data-role='global']", function (e) {
            // se o clique veio do botão remover, ignora
            if ($(e.target).closest("button.remover").length) return;
            $("#dsPesquisaGlobalInput").select();
        });

        // Clique no chip de CAMPO (fora do X)
        $m.on("click", "div.filtroCard[data-role='campo']", function (e) {
            // se o clique veio do botão remover, ignora
            if ($(e.target).closest("button.remover").length) return;

            var fn = $(this).attr("data-field");
            if (fn) {
                $("#campoBtn-" + fn).click();
            }
        });

        // Limpar filtros
        $m.on("click", "button.limpar", function () {
            var ctx = $m.data("ctx") || {};
            ctx.pesquisaGlobal = "";
            ctx.pesquisaPorCampo = {};
            ctx.currentField = null;
            if (ctx.storageKey) clearLS(ctx.storageKey);
            $m.data("ctx", ctx);
            render($, $m, ctx);
            $("#dsPesquisaGlobalInput").select();
        });

        // BOTÃO "Pesquisar"
        $m.on("click", "button.pesquisar", function () {
            $m.removeClass("aberta"); // fecha o modal ao iniciar a pesquisa
            $overlay.removeClass("aberta"); // esconde overlay
            showSpinner(); // Mostra o spinner

            var ctx = $m.data("ctx") || {};
            var filtros = {
                pesquisaGlobal: ctx.pesquisaGlobal || "",
                pesquisaPorCampo: ctx.pesquisaPorCampo || {},
                orderBy: $m.find("#dsPesquisaOrdenacao").val() || ctx.viewConfig.orderByDefault, // Ordenação
            };

            if (ctx.storageKey) saveLS(ctx.storageKey, filtros);

            $.ajax({
                url: phpPath,
                method: "POST",
                dataType: "json",
                data: {
                    action: "pesquisar", // FUTURO — implementar no PHP
                    viewName: ctx.viewConfig.viewName || ctx.viewName,
                    endpointConfig: ctx.endpointConfig,
                    pesquisaGlobal: filtros.pesquisaGlobal,
                    pesquisaPorCampo: JSON.stringify(filtros.pesquisaPorCampo || {}),
                    orderBy: filtros.orderBy,
                },
            })
                .done(function (resp) {
                    hideSpinner(); // Esconde o spinner

                    if (typeof ctx.callback === "function") {
                        ctx.callback(resp); // resultado da pesquisa
                    }
                    $m.removeClass("aberta");
                    $overlay.removeClass("aberta"); // esconde overlay
                })
                .fail(function () {
                    hideSpinner(); // Esconde o spinner

                    if (typeof ctx.callback === "function") {
                        ctx.callback({
                            success: false,
                            message: "Erro ao comunicar com dsPesquisa.php na pesquisa.",
                            data: [],
                        });
                    }
                });
        });
    }

    // ---------------------------------------------------------
    // Função pública PRINCIPAL
    // ---------------------------------------------------------
    function dsPesquisa(viewName, endpointConfig, callback, spinnerFunc = null) {
        var $ = ensureJQ();
        if (!$) return;

        // Verifica se o spinnerFunc é um array válido
        const isSpinnerValid = Array.isArray(spinnerFunc) && typeof spinnerFunc[0] === "function" && typeof spinnerFunc[1] === "function";

        // Funções do spinner (se válidas)
        const showSpinner = isSpinnerValid ? spinnerFunc[0] : () => {};
        const hideSpinner = isSpinnerValid ? spinnerFunc[1] : () => {};

        showSpinner(); // Mostra o spinner

        loadCSS();

        loadTemplate($, function ($m) {
            $.ajax({
                url: phpPath,
                method: "POST",
                dataType: "json",
                data: {
                    action: "getConfig",
                    viewName: viewName,
                    endpointConfig: endpointConfig,
                },
            })
                .done(function (resp) {
                    hideSpinner(); // Esconde o spinner

                    if (!resp || resp.success === false) {
                        console.error("dsPesquisa: erro ao obter config:", resp && resp.message);
                        if (typeof callback === "function") {
                            callback(
                                resp || {
                                    success: false,
                                    message: "Falha ao carregar configuração da view.",
                                }
                            );
                        }
                        return;
                    }

                    var viewConfig = resp.data || resp.viewConfig || null;

                    if (!viewConfig) {
                        console.error("dsPesquisa: config da view ausente:", resp);
                        if (typeof callback === "function") {
                            callback({
                                success: false,
                                message: "Configuração da view não encontrada.",
                            });
                        }
                        return;
                    }

                    var storageKey = lsPrefix + (viewName || "default");
                    var saved = loadSaved(storageKey);

                    var ctx = {
                        viewName: viewName,
                        endpointConfig: endpointConfig,
                        viewConfig: viewConfig,
                        pesquisaGlobal: saved.pesquisaGlobal || "",
                        pesquisaPorCampo: saved.pesquisaPorCampo || {},
                        currentField: null,
                        storageKey: storageKey,
                        callback: callback, // callback final (somente após PESQUISAR)
                    };

                    $m.data("ctx", ctx);
                    render($, $m, ctx);
                    $m.addClass("aberta");
                    $m.parent("div#dsPesquisaOverlay").addClass("aberta"); // mostra overlay

                    centerModal(); // Centraliza o modal na abertura inicial

                    enableDrag();

                    $m.find("#dsPesquisaGlobalInput").select();
                })
                .fail(function () {
                    hideSpinner(); // Esconde o spinner

                    console.error("Erro ao carregar configurações da view.");
                    if (typeof callback === "function") {
                        callback({
                            success: false,
                            message: "Erro ao comunicar com dsPesquisa.php",
                        });
                    }
                });
        });
    }

    // ---------------------------------------------------------
    // Centraliza o modal na abertura inicial
    // ---------------------------------------------------------
    function centerModal() {
        var $modal = $("#dsPesquisa");
        if (!$modal.length) return;

        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        var modalWidth = $modal.outerWidth();
        var modalHeight = $modal.outerHeight();

        var newLeft = (windowWidth - modalWidth) / 2;
        var newTop = (windowHeight - modalHeight) / 2;

        $modal.css({
            top: newTop + "px",
            left: newLeft + "px",
        });
    }

    // ---------------------------------------------------------
    // Drag do modal
    // ---------------------------------------------------------
    function enableDrag() {
        var isDragging = false;
        var offset = { x: 0, y: 0 };

        $(document).on("mousedown", ".topBar", function (e) {
            var $modal = $("#dsPesquisa");
            if (!$modal.length || !$modal.hasClass("aberta")) return;

            var modalOffset = $modal.offset();
            isDragging = true;
            offset.x = e.pageX - modalOffset.left;
            offset.y = e.pageY - modalOffset.top;
            $modal.addClass("dragging");

            console.log("Drag iniciado", { offset, modalOffset }); // Log para depuração

            // Previne seleção de texto durante o arraste
            e.preventDefault();
        });

        $(document).on("mousemove", function (e) {
            if (!isDragging) return;

            var $modal = $("#dsPesquisa");
            var modalWidth = $modal.outerWidth();
            var modalHeight = $modal.outerHeight();
            var windowWidth = $(window).width();
            var windowHeight = $(window).height();

            var newLeft = Math.min(Math.max(0, e.pageX - offset.x), windowWidth - modalWidth);
            var newTop = Math.min(Math.max(0, e.pageY - offset.y), windowHeight - modalHeight);

            $modal.css({
                top: newTop + "px",
                left: newLeft + "px",
            });

            console.log("Drag em andamento", { newLeft, newTop }); // Log para depuração
        });

        $(document).on("mouseup", function () {
            if (isDragging) {
                console.log("Drag finalizado"); // Log para depuração
            }
            isDragging = false;
            $("#dsPesquisa").removeClass("dragging");
        });
    }

    //executa a pesquisa imediatamente, sem abrir o modal
    function dsPesquisaExec(viewName, endpointConfig, callback, spinnerFunc = null) {
        var $ = ensureJQ();
        if (!$) return;
        const ok = Array.isArray(spinnerFunc) && typeof spinnerFunc[0] === "function" && typeof spinnerFunc[1] === "function";
        const showSpinner = ok ? spinnerFunc[0] : () => {};
        const hideSpinner = ok ? spinnerFunc[1] : () => {};
        var storageKey = lsPrefix + (viewName || "default"),
            saved = loadSaved(storageKey),
            filtros = {
                pesquisaGlobal: saved.pesquisaGlobal || "",
                pesquisaPorCampo: saved.pesquisaPorCampo || {},
            };
        showSpinner();
        $.ajax({
            url: phpPath,
            method: "POST",
            dataType: "json",
            data: {
                action: "pesquisar",
                viewName,
                endpointConfig,
                pesquisaGlobal: filtros.pesquisaGlobal,
                pesquisaPorCampo: JSON.stringify(filtros.pesquisaPorCampo || {}),
            },
        })
            .done(function (resp) {
                hideSpinner();
                if (typeof callback === "function") callback(resp);
            })
            .fail(function () {
                hideSpinner();
                if (typeof callback === "function")
                    callback({
                        success: false,
                        message: "Erro ao comunicar com dsPesquisa.php na pesquisa.",
                        data: [],
                    });
            });
    }

    window.dsPesquisa = dsPesquisa;
    window.dsPesquisa.exec = dsPesquisaExec;
})(window, document);
