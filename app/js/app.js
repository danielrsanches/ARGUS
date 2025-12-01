/**
 * Carrega arquivos CSS dinamicamente.
 * @param {(string|string[]|null)} files Caminho único ou lista de caminhos CSS.
 * @param {Function} [callback] Função chamada ao finalizar (callback(err)).
 */
function loadCss(files, callback) {
    callback = callback || function () {};

    // Normaliza lista: string | array | null
    var list = Array.isArray(files) ? files : files ? [files] : [];

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
        if (
            document.querySelector(
                'link[rel="stylesheet"][href="' + href + '"]'
            )
        ) {
            return done(null);
        }

        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;

        link.onload = function () {
            done(null);
        };
        link.onerror = function () {
            done(new Error("Falha ao carregar CSS: " + href));
        };

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
    $("script[src]").each(function () {
        if ($(this).data("type") !== "fixed") {
            $(this).remove();
        }
    });
}

// Carrega scripts JS dinamicamente, sem remover os antigos.
// A limpeza de scripts não-fixed agora é feita por clearJs().
function loadJs(files, callback) {
    callback = callback || function () {};

    // Normaliza lista: string | array | null
    var list = Array.isArray(files) ? files : files ? [files] : [];

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

        s.onload = function () {
            done(null);
        };
        s.onerror = function () {
            done(new Error("Falha ao carregar JS: " + src));
        };

        document.head.appendChild(s);
    });
}

/* -> Carrega um template em um alvo especificado, já carregando dinamicamente os arquivos CSS e JS correspondentes...
   data = {
     alvo: "main#modulo", //seletor onde será carregado o template
     template: "../html/home.html section#home", // "URL seletor"
     css: "css/home.css" | ["css/home.css", ...],
     js: "js/home.js"   | ["js/home.js",   ...]
   }
   Ordem: CSS -> Template -> JS
*/
function loadTemplate(data, callback) {
    callback = callback || function () {};

    // garante objeto
    if (typeof data !== "object" || data === null) data = {};

    var alvo = data.alvo || "main#modulo";
    var template = data.template || ""; // suporta "url seletor"
    var css = data.css || null; // string ou array
    var js = data.js || null; // string ou array

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
                return callback(
                    new Error(
                        "loadTemplate -> falha ao carregar template (" +
                            (xhr && xhr.status) +
                            ")"
                    )
                );
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

//****************************** */
// Spinner de carregamento global
//****************************** */
function showSpinner() {
    // Mostra o spinner
    const spinner = $("div#spinner")[0];
    if (spinner) {
        spinner.classList.remove("hidden");
    }
}
function hideSpinner() {
    // Oculta o spinner
    const spinner = $("div#spinner")[0];
    if (spinner) {
        spinner.classList.add("hidden");
    }
}

// Carrega um template de um template HTML externo (sem inserir no DOM).
// Retorna uma Promise que resolve com o elemento selecionado.
async function loadCard(url, selector) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(
                `Falha ao carregar ${url}: HTTP ${response.status}`
            );
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const el = doc.querySelector(selector);

        if (!el) {
            throw new Error(`Selector '${selector}' não encontrado em ${url}`);
        }

        return el;
    } catch (err) {
        console.error("Erro no loadCard:", err);
        throw err; // <-- devolve o erro para o .catch
    }
}
