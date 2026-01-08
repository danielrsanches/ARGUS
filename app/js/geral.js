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

async function loadTemplate(data, callback) {
    callback = callback || function () {};
    if (typeof data !== "object" || data === null) data = {};

    const alvoSelector = data.alvo || "main#modulo";
    const template = data.template || "";
    const css = data.css || null;
    const js = data.js || null;

    if (!template) {
        return callback(new Error("loadTemplate -> template não fornecido."));
    }

    const [url, templateSelector] = template.split(" ");
    const alvo = document.querySelector(alvoSelector);

    if (!alvo) {
        return callback(new Error(`loadTemplate -> alvo "${alvoSelector}" não encontrado.`));
    }
    
    alvo.innerHTML = ""; // Limpa o alvo

    try {
        // 1) CSS primeiro
        await new Promise((resolve, reject) => {
            loadCss(css, (err) => err ? reject(err) : resolve());
        });

        // 2) Template no alvo
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Falha ao carregar template de ${url} (${response.status})`);
        }
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const templateContent = doc.querySelector(templateSelector);

        if (!templateContent) {
            throw new Error(`Seletor de template "${templateSelector}" não encontrado em ${url}`);
        }
        alvo.appendChild(templateContent);

        // 3) JS por último
        await new Promise((resolve, reject) => {
            loadJs(js, (err) => err ? reject(err) : resolve());
        });

        callback(null); // Sucesso

    } catch (err) {
        callback(err);
    }
}


/**
 * Carrega um conteúdo HTML em um elemento alvo.
 * @param {string} url - A URL do arquivo HTML a ser carregado.
 * @param {string} targetSelector - O seletor do elemento onde o HTML será inserido.
 * @param {string} [contentSelector] - O seletor do conteúdo a ser extraído do HTML carregado. Se não for fornecido, o body inteiro é carregado.
 * @param {Function} [callback] - Função de callback a ser executada após o carregamento.
 */
async function loadHtml(url, targetSelector, contentSelector, callback) {
    callback = callback || function () {};
    const target = document.querySelector(targetSelector);

    if (!target) {
        return callback(new Error(`loadHtml -> alvo "${targetSelector}" não encontrado.`));
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Falha ao carregar HTML de ${url} (${response.status})`);
        }
        const html = await response.text();
        
        if (contentSelector) {
            const doc = new DOMParser().parseFromString(html, "text/html");
            const content = doc.querySelector(contentSelector);
            if (!content) {
                throw new Error(`Seletor de conteúdo "${contentSelector}" não encontrado em ${url}`);
            }
            target.appendChild(content);
        } else {
            target.innerHTML = html;
        }

        callback(null); // Sucesso
    } catch (err) {
        callback(err);
    }
}


//****************************** */
// Spinner de carregamento global
//****************************** */
function showSpinner() {
    const spinner = document.getElementById("spinner");
    if (spinner) {
        spinner.classList.remove("hidden");
    }
}
function hideSpinner() {
    const spinner = document.getElementById("spinner");
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

async function renderizaCards(config) {
    if (!config || typeof config !== "object" || !config.dados || !config.templatePath || !config.templateSelector || !config.templateTarget || !config.populateCardFn || !config.eventHandlerFn) {
        throw new Error("renderizaCards: 'config' incompleto. Requer: dados, templatePath, templateSelector, templateTarget, populateCardFn, eventHandlerFn.");
    }
    
    config.renderTotal = config.renderTotal ?? true;

    try {
        const template = await loadCard(config.templatePath, config.templateSelector);
        const content = document.querySelector(config.templateTarget);
        
        if (!content) {
            throw new Error(`renderizaCards: Alvo de renderização "${config.templateTarget}" não encontrado.`);
        }

        if (config.renderTotal) {
            content.classList.add('hidden');
            content.innerHTML = '';

            config.dados.forEach(element => {
                const cardClone = template.cloneNode(true);
                config.populateCardFn(cardClone, element); // Usa a função específica do módulo
                content.appendChild(cardClone);
                config.eventHandlerFn(element.id); // Usa a função de tratamento de eventos fornecida
            });

            content.classList.remove('hidden');
            content.classList.add('fade-in');
            content.addEventListener('animationend', () => content.classList.remove('fade-in'), { once: true });
        } else {
             config.dados.forEach(element => {
                const existingCard = content.querySelector(`.card[data-id='${element.id}']`);
                const cardClone = template.cloneNode(true);
                config.populateCardFn(cardClone, element);

                if (existingCard) {
                    existingCard.replaceWith(cardClone);
                } else {
                    content.appendChild(cardClone);
                }
                config.eventHandlerFn(element.id); // Usa a função de tratamento de eventos fornecida
            });
        }

    } catch (err) {
        console.error("Erro em renderizaCards:", err);
    }
}

function elementDrag(handleSeletor, targetSeletor, screenLimit = true) {
    const handle = document.querySelector(handleSeletor);
    const target = document.querySelector(targetSeletor);

    if (!handle || !target) {
        console.warn("elementDrag: handle/target não encontrado:", handleSeletor, targetSeletor);
        return;
    }

    let isDragging = false;
    let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

    function onMouseDown(e) {
        if (e.button !== 0) return;
        
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        
        if (e.target === handle) {
            isDragging = true;
            target.classList.add("is-dragging");
        }
    }

    function onMouseMove(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            xOffset = currentX;
            yOffset = currentY;

            // Limitar ao viewport
            if (screenLimit) {
                const rect = target.getBoundingClientRect();
                const parentRect = target.parentElement.getBoundingClientRect();
                
                if (currentX < -parentRect.left) currentX = -parentRect.left;
                if (currentY < -parentRect.top) currentY = -parentRect.top;
                if (currentX + rect.width > parentRect.right) currentX = parentRect.right - rect.width;
                if (currentY + rect.height > parentRect.bottom) currentY = parentRect.bottom - rect.height;
            }

            // ATENÇÃO: A linha abaixo viola a Política de Segurança de Conteúdo (CSP)
            // se 'unsafe-inline' não for permitido em 'style-src'.
            // Mover um elemento dinamicamente com base na posição do mouse
            // requer a atualização de 'transform', o que é difícil de fazer
            // sem estilos inline. Uma alternativa seria usar CSS variables,
            // mas 'style.setProperty' também é bloqueado por uma CSP estrita.
            target.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }
    }

    function onMouseUp(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        target.classList.remove("is-dragging");
    }
    
    handle.classList.add("draggable-handle");
    target.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
}
