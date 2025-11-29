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
    var cssHref  = basePath + "dsPesquisa.css";
    var htmlPath = basePath + "dsPesquisa.html";
    var phpPath  = basePath + "dsPesquisa.php";
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
                pesquisaPorCampo: v.pesquisaPorCampo || {}
            };
        } catch (e) {
            return { pesquisaGlobal: "", pesquisaPorCampo: {} };
        }
    }
    function saveLS(key, obj) {
        try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {}
    }
    function clearLS(key) {
        try { localStorage.removeItem(key); } catch (e) {}
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
                var $b = $('<button type="button" class="campoBtn"></button>');
                $b.text(lbl);
                $b.attr("data-field", f.name);
                $b.attr("data-label", lbl.toLowerCase());
                $list.append($b);
            });
            $list.data("done", 1);
        }

        var termo = ($m.find("#dsCampoBuscaInput").val() || "").toLowerCase();
        $list.find("button.campoBtn").each(function () {
            var txt = $(this).attr("data-label") || "";
            var show = !termo || txt.indexOf(termo) !== -1;
            $(this).toggleClass("oculto", !show);
        });

        $list.find("button.campoBtn").each(function () {
            var fn = $(this).attr("data-field");
            $(this).toggleClass("selecionado", ctx.currentField === fn);
        });
    }

    function renderValorCampo($, $m, ctx) {
        var $box   = $m.find("div.dsCampoValor");
        var $label = $m.find("div.dsCampoValorLabel");
        var $input = $m.find("#dsCampoValorInput");

        if (!ctx.currentField) {
            $box.removeClass("visivel");
            return;
        }

        var field = (ctx.viewConfig.fields || []).find(function (f) {
            return f.name === ctx.currentField;
        });
        var text = field ? (field.label || field.name) : ctx.currentField;

        $label.text('Digite o valor para "' + text + '":');
        $input.val(ctx.pesquisaPorCampo[ctx.currentField] || "");
        $box.addClass("visivel");
        $input.focus();
    }

    function renderAtivos($, $m, ctx) {
        var $list = $m.find("div.dsFiltrosAtivosLista");
        $list.empty();

        if (ctx.pesquisaGlobal) {
            var $c = $('<div class="filtroCard" data-role="global"></div>');
            $c.append(
                '<div class="cardHeader">' +
                    '<div class="cardLabel">Pesquisa global</div>' +
                    '<button type="button" class="remover">×</button>' +
                '</div>' +
                '<div class="cardValue"></div>'
            );
            $c.find("div.cardValue").text(ctx.pesquisaGlobal);
            $list.append($c);
        }

        Object.keys(ctx.pesquisaPorCampo || {}).forEach(function (fn) {
            var val = ctx.pesquisaPorCampo[fn];
            if (!val) return;

            var f = (ctx.viewConfig.fields || []).find(function (x) {
                return x.name === fn;
            });
            var lbl = f ? (f.label || f.name) : fn;

            var $c = $('<div class="filtroCard" data-role="campo"></div>');
            $c.attr("data-field", fn);
            $c.append(
                '<div class="cardHeader">' +
                    '<div class="cardLabel"></div>' +
                    '<button type="button" class="remover">×</button>' +
                '</div>' +
                '<div class="cardValue"></div>'
            );
            $c.find("div.cardLabel").text(lbl);
            $c.find("div.cardValue").text(val);
            $list.append($c);
        });
    }

    function render($, $m, ctx) {
        $m.find("#dsPesquisaGlobalInput").val(ctx.pesquisaGlobal || "");
        renderFieldButtons($, $m, ctx);
        renderValorCampo($, $m, ctx);
        renderAtivos($, $m, ctx);
    }

    // ---------------------------------------------------------
    // Eventos
    // ---------------------------------------------------------
    function initEvents($, $m) {
        if ($m.data("init")) return;
        $m.data("init", 1);

        // Fechar
        $m.on("click", "button.fechar", function () {
            $m.removeClass("aberta");
        });

        $(document).on("keydown.dsPesquisa", function (e) {
            if (e.key === "Escape") $m.removeClass("aberta");
        });

        // Pesquisa global (Enter)
        $m.on("keydown", "#dsPesquisaGlobalInput", function (e) {
            if (e.key !== "Enter") return;
            var ctx = $m.data("ctx") || {};
            ctx.pesquisaGlobal = (this.value || "").trim();
            $m.data("ctx", ctx);
            render($, $m, ctx);
        });

        // Filtro de campos
        $m.on("input", "#dsCampoBuscaInput", function () {
            var ctx = $m.data("ctx") || {};
            renderFieldButtons($, $m, ctx);
        });

        // Selecionar campo
        $m.on("click", "button.campoBtn", function () {
            var fn = $(this).attr("data-field");
            var ctx = $m.data("ctx") || {};
            ctx.currentField = (ctx.currentField === fn ? null : fn);
            $m.data("ctx", ctx);
            render($, $m, ctx);
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

        // Remover chips
        $m.on("click", "button.remover", function () {
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

        // Limpar
        $m.on("click", "button.limpar", function () {
            var ctx = $m.data("ctx") || {};
            ctx.pesquisaGlobal = "";
            ctx.pesquisaPorCampo = {};
            ctx.currentField = null;
            if (ctx.storageKey) clearLS(ctx.storageKey);
            $m.data("ctx", ctx);
            render($, $m, ctx);
        });

        // Pesquisar (POST -> dsPesquisa.php)
        $m.on("click", "button.pesquisar", function () {
            var ctx = $m.data("ctx") || {};
            var filtros = {
                pesquisaGlobal: ctx.pesquisaGlobal || "",
                pesquisaPorCampo: ctx.pesquisaPorCampo || {}
            };

            if (ctx.storageKey) saveLS(ctx.storageKey, filtros);

            $.ajax({
                url: phpPath,
                method: "POST",
                dataType: "json",
                data: {
                    viewName: ctx.viewConfig.viewName,
                    pesquisaGlobal: filtros.pesquisaGlobal,
                    pesquisaPorCampo: JSON.stringify(filtros.pesquisaPorCampo || {})
                }
            })
                .done(function (resp) {
                    if (typeof ctx.callback === "function") {
                        ctx.callback(resp); // {success, message, data}
                    }
                    $m.removeClass("aberta");
                })
                .fail(function () {
                    if (typeof ctx.callback === "function") {
                        ctx.callback({
                            success: false,
                            message: "Erro ao comunicar com dsPesquisa.php",
                            data: []
                        });
                    }
                });
        });
    }

    // ---------------------------------------------------------
    // Função pública
    // ---------------------------------------------------------
    function dsPesquisa(configUrl, callback) {
        var $ = ensureJQ();
        if (!$) return;

        loadCSS();

        loadTemplate($, function ($m) {
            $.getJSON(configUrl)
                .done(function (resp) {
                    var cfg = resp.data || resp;
                    if (!cfg || !cfg.viewName) {
                        console.error("dsPesquisa: viewConfig inválido.");
                        return;
                    }

                    var storageKey = lsPrefix + cfg.viewName;
                    var saved = loadSaved(storageKey);

                    var ctx = {
                        viewConfig: cfg,
                        callback: callback,
                        storageKey: storageKey,
                        pesquisaGlobal: saved.pesquisaGlobal,
                        pesquisaPorCampo: saved.pesquisaPorCampo || {},
                        currentField: null
                    };

                    $m.data("ctx", ctx);
                    render($, $m, ctx);
                    $m.addClass("aberta");
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    console.error("Erro ao carregar configUrl:", textStatus, errorThrown);
                });
        });
    }

    window.dsPesquisa = dsPesquisa;

})(window, document);

