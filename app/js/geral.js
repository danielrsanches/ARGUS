/**
 * Neste arquivo ficam funções gerais de uso de todo o sistema.
 */

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
        if (document.querySelector('link[rel="stylesheet"][href="' + href + '"]')) {
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
            throw new Error(`Falha ao carregar ${url}: HTTP ${response.status}`);
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

/**
 * Inverte data BR⇄DB e opcionalmente inclui hora.
 * @param {string} data - "dd/mm/aaaa", "aaaa-mm-dd", com ou sem hora.
 * @param {boolean} withTime - true = retorna com hh:mm:ss.
 */
function dateInvert(data, withTime = false) {
    if (!data) return "";

    // separa data e hora
    let [dstr, hstr] = data.split(" ");
    hstr = hstr || "00:00:00";

    // DB → BR
    if (/^\d{4}-\d{2}-\d{2}$/.test(dstr)) {
        const [a, m, d] = dstr.split("-");
        return withTime ? `${d}/${m}/${a} ${hstr}` : `${d}/${m}/${a}`;
    }

    // BR → DB
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dstr)) {
        const [d, m, a] = dstr.split("/");
        return withTime ? `${a}-${m}-${d} ${hstr}` : `${a}-${m}-${d}`;
    }

    return "";
}

/**
 * Renderiza cards em um container HTML com base em um template e dados fornecidos.
 *
 * @param {Object} options - Configurações para renderização dos cards.
 * @param {string} options.templatePath - Caminho para o arquivo HTML contendo o template.
 * @param {string} options.templateSelector - Seletor CSS para o elemento do template dentro do arquivo.
 * @param {string} options.templateTarget - Seletor CSS do container onde os cards serão inseridos.
 * @param {Array<Object>} options.dados - Array de objetos contendo os dados para preencher os cards.
 * @param {boolean} [options.renderTotal=true] - Define se todos os cards devem ser renderizados ou apenas atualizados.
 * @param {Function} [options.showSpinner] - Função opcional para exibir um spinner de carregamento.
 * @param {Function} [options.hideSpinner] - Função opcional para ocultar o spinner de carregamento.
 */
function renderizaCards(config) {
    // validação completa de config (tipo + campos obrigatórios)
    if (!config || typeof config !== "object" || Array.isArray(config) || !config.dados || !config.templatePath || !config.templateSelector || !config.templateTarget) {
        throw new Error("func renderizaCards: parâmetro 'config' não é um objeto ou está incompleto");
    }

    // verifica os parâmetros opcionais e define valores padrão...
    config.renderTotal = config.renderTotal ?? true;

    // Verifica se as funções dependentes existem...
    if (typeof gerarCardHTML !== "function" || typeof aplicaEventos !== "function") {
        throw new Error("As funções 'gerarCardHTML' e/ou 'aplicaEventos' não estão definidas.");
    }

    // Carrega o template do card uma vez
    loadCard(config.templatePath, config.templateSelector).then((template) => {
        // Seleciona o alvo onde os cards serão renderizados
        const $content = $(config.templateTarget);

        // Verifica se é renderização total ou parcial
        if (config.renderTotal) {
            $content.hide().empty(); // Esconde e limpa o conteúdo atual

            //percorre todos os dados e gera os cards...
            config.dados.forEach((element) => {
                const cardHTML = gerarCardHTML(template, element); // Gera o HTML do card
                $content.append(cardHTML); // Adiciona o card ao conteúdo

                aplicaEventos(element.id); // Aplica os eventos ao card recém-criado
            });

            $content.fadeIn(); // Mostra o conteúdo com efeito de fade-in
        } else {
            // Renderização parcial: atualiza ou cria cards individualmente

            //percorre todos os dados e atualiza ou cria os cards...
            config.dados.forEach((element) => {
                const $card = $(`section.card[data-id='${element.id}']`);

                if ($card.length) {
                    //se o card já existe, atualiza...
                    const cardHTML = gerarCardHTML(template, element);
                    $card.replaceWith(cardHTML);
                } else {
                    //se o card não existe, cria...
                    const cardHTML = gerarCardHTML(template, element);
                    $content.append(cardHTML);

                    aplicaEventos(element.id); // Aplica os eventos ao card recém-criado
                }
            });
        }
    });
}

/**
 * Permite arrastar um elemento (target) usando um "handle" (área de arrasto).
 * @param {string} handleSeletor  Seletor do elemento que inicia o drag (ex: ".modalTitulo")
 * @param {string} targetSeletor  Seletor do elemento que será movido (ex: ".modal")
 * @param {boolean} screenLimit   Limita o target dentro da viewport
 */
function elementDrag(handleSeletor, targetSeletor, screenLimit = true) {
    const handle = document.querySelector(handleSeletor);
    const target = document.querySelector(targetSeletor);

    if (!handle || !target) {
        console.warn("elementDrag: handle/target não encontrado:", handleSeletor, targetSeletor);
        return;
    }

    let arrastando = false;
    let offsetX = 0;
    let offsetY = 0;

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function onMouseDown(event) {
        // só botão esquerdo
        if (event.button !== 0) return;

        arrastando = true;

        const rect = target.getBoundingClientRect();
        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;

        target.style.position = "fixed";
        target.style.margin = "0";
        target.style.left = rect.left + "px";
        target.style.top = rect.top + "px";

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);

        event.preventDefault();
    }

    function onMouseMove(event) {
        if (!arrastando) return;

        let left = event.clientX - offsetX;
        let top = event.clientY - offsetY;

        if (screenLimit) {
            const w = target.offsetWidth;
            const h = target.offsetHeight;

            left = clamp(left, 0, window.innerWidth - w);
            top = clamp(top, 0, window.innerHeight - h);
        }

        target.style.left = left + "px";
        target.style.top = top + "px";
    }

    function onMouseUp() {
        arrastando = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }

    // importante: só o "handle" inicia o drag
    handle.style.cursor = "move";
    handle.addEventListener("mousedown", onMouseDown);
}
