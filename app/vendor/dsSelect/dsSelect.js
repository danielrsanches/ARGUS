/**
 * dsSelect - Componente de <select> personalizado (sem herança automática de CSS).
 *
 * Estilos são totalmente controlados via dsSelect.css.
 * O programador personaliza o visual alterando as variáveis no topo do dsSelect.css.
 *
 * Uso:
 *   dsSelect({
 *     selector: 'select.dsSelect',
 *     placeholder: 'Selecione...',
 *     searchable: true
 *   });
 */

(function () {
    'use strict';

    /**
     * Inicializa o componente em todos os selects encontrados pelo seletor.
     * @param {Object} config
     * @param {string} config.selector  - seletor CSS para os <select> nativos
     * @param {string} [config.placeholder] - texto padrão quando nenhum valor está selecionado
     * @param {boolean} [config.searchable=true] - habilita campo de busca
     */
    window.dsSelect = function dsSelect(config) {
        if (!config || !config.selector) {
            console.error('dsSelect: "selector" é obrigatório na configuração.');
            return;
        }

        const selects = document.querySelectorAll(config.selector);
        if (!selects.length) {
            console.warn(`dsSelect: Nenhum elemento encontrado para o seletor "${config.selector}".`);
            return;
        }

        selects.forEach(nativeSelect => {
            if (nativeSelect.dataset.dsSelectInitialized === '1') {
                return;
            }
            try {
                createCustomSelect(nativeSelect, config || {});
                nativeSelect.dataset.dsSelectInitialized = '1';
            } catch (err) {
                console.error('dsSelect: falha ao inicializar select:', nativeSelect, err);
                nativeSelect.classList.remove('dsSelect-nativeHidden');
            }
        });
    };

    /**
     * Cria o select customizado a partir de um <select> nativo.
     * @param {HTMLSelectElement} nativeSelect
     * @param {Object} config
     */
    function createCustomSelect(nativeSelect, config) {
        const optionsData = getOptionsFromNative(nativeSelect);

        const initialPlaceholder =
            config.placeholder ||
            nativeSelect.getAttribute('data-ds-placeholder') ||
            'Selecione...';

        // Wrapper que vai conter a UI customizada
        const customWrapper = document.createElement('div');
        customWrapper.className = 'dsSelectWrapper';
        customWrapper.tabIndex = 0;

        // Área visível (semelhante ao select fechado)
        const displayElement = document.createElement('div');
        displayElement.className = 'dsSelectDisplay';
        displayElement.innerHTML = `
            <span class="dsSelectPlaceholder">${initialPlaceholder}</span>
            <span class="dsSelectArrow"></span>
        `;

        // Lista de opções
        const optionsList = document.createElement('div');
        optionsList.className = 'dsSelectOptionsList';
        optionsList.style.display = 'none';

        customWrapper.appendChild(displayElement);
        customWrapper.appendChild(optionsList);

        // Insere o wrapper depois do select nativo
        nativeSelect.parentNode.insertBefore(customWrapper, nativeSelect.nextSibling);

        // Esconde o select nativo (mas continua no DOM para submissão do form)
        nativeSelect.classList.add('dsSelect-nativeHidden');

        // Campo de busca (se habilitado)
        const searchable = config.searchable !== false;
        if (searchable) {
            const searchWrapper = document.createElement('div');
            searchWrapper.className = 'dsSelectSearchWrapper';

            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Buscar...';
            searchInput.className = 'dsSelectSearchInput';

            searchWrapper.appendChild(searchInput);
            optionsList.appendChild(searchWrapper);

            searchInput.addEventListener('input', () => {
                filterOptions(optionsList, searchInput.value);
            });
        }

        // Renderização das opções
        renderOptions(optionsList, optionsData, nativeSelect);

        // Eventos de clique, foco, teclado
        attachEventListeners(customWrapper, displayElement, optionsList, nativeSelect);

        // Se houver uma opção selecionada, mostrar no display
        const selectedOption = optionsData.find(opt => opt.selected);
        if (selectedOption) {
            const placeholderSpan = displayElement.querySelector('.dsSelectPlaceholder');
            placeholderSpan.textContent = selectedOption.label;
            placeholderSpan.classList.add('dsSelectPlaceholderFilled');
        }
    }

    /**
     * Lê as opções do <select> nativo.
     */
    function getOptionsFromNative(nativeSelect) {
        const options = Array.from(nativeSelect.options);
        return options.map(option => ({
            value: option.value,
            label: option.textContent,
            selected: option.selected,
            disabled: option.disabled
        }));
    }

    /**
     * Renderiza as opções no dropdown customizado.
     */
    function renderOptions(optionsList, optionsData, nativeSelect) {
        // Remove opções previamente inseridas (caso de re-render)
        const oldOptions = optionsList.querySelectorAll('.dsSelectOption');
        oldOptions.forEach(el => el.remove());

        optionsData.forEach(optionData => {
            const optionEl = document.createElement('div');
            optionEl.className = 'dsSelectOption';
            optionEl.textContent = optionData.label;
            optionEl.dataset.value = optionData.value;

            if (optionData.disabled) {
                optionEl.classList.add('dsSelectDisabled');
            }
            if (optionData.selected) {
                optionEl.classList.add('dsSelectSelected');
            }

            optionEl.addEventListener('click', () => {
                if (optionData.disabled) return;
                selectOption(optionEl, nativeSelect, optionsList);
                closeDropdown(optionsList.parentElement, optionsList);
            });

            optionsList.appendChild(optionEl);
        });
    }

    /**
     * Aplica o filtro de busca.
     * - Case-insensitive
     * - Ignora ordem das palavras
     *   Ex: "nordeste regiao" encontra "Região Nordeste"
     */
    function filterOptions(optionsList, term) {
        const raw = term.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const words = raw.split(/\s+/).filter(Boolean);

        const optionEls = optionsList.querySelectorAll('.dsSelectOption');

        optionEls.forEach(option => {
            const labelRaw = option.textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const matches = words.every(w => labelRaw.includes(w));
            option.style.display = matches ? 'block' : 'none';
        });

        // ao filtrar, remove active e põe no primeiro visível (se existir)
        optionEls.forEach(o => o.classList.remove('dsSelectActive'));
        const firstVisible = Array.from(optionEls).find(o => o.style.display !== 'none');
        if (firstVisible) {
            firstVisible.classList.add('dsSelectActive');
            firstVisible.scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Seleciona uma opção: atualiza nativo, display e estados visuais.
     * Mantém o foco no componente (wrapper) para continuidade via teclado.
     */
    function selectOption(optionEl, nativeSelect, optionsList) {
        const value = optionEl.dataset.value;

        // Atualiza select nativo
        nativeSelect.value = value;
        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Atualiza visual (display)
        const wrapper = optionsList.parentElement;
        const display = wrapper.querySelector('.dsSelectDisplay');
        const placeholderSpan = display.querySelector('.dsSelectPlaceholder');

        placeholderSpan.textContent = optionEl.textContent;
        placeholderSpan.classList.add('dsSelectPlaceholderFilled');

        // Marca a opção selecionada
        const allOptions = optionsList.querySelectorAll('.dsSelectOption');
        allOptions.forEach(o => o.classList.remove('dsSelectSelected'));
        optionEl.classList.add('dsSelectSelected');

        // Mantém o foco no componente para navegação via Tab/teclas
        if (wrapper && typeof wrapper.focus === 'function') {
            wrapper.focus();
        }
    }

    /**
     * Liga os eventos de clique, foco, blur e teclado.
     */
    function attachEventListeners(wrapper, displayElement, optionsList, nativeSelect) {
        // Abre/fecha no clique no display
        displayElement.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(wrapper, optionsList);
            // Garante foco no wrapper ao abrir com clique
            wrapper.focus();
        });

        // Clique fora fecha
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                closeDropdown(wrapper, optionsList);
            }
        });

        // Teclado no wrapper
        wrapper.addEventListener('keydown', (e) => {
            const isOpen = wrapper.classList.contains('dsSelectOpen');

            // Se o foco estiver no input de busca, não vamos interferir,
            // exceto para a tecla Escape (que fecha a lista).
            const activeEl = document.activeElement;
            const isSearchFocused =
                activeEl &&
                activeEl.classList &&
                activeEl.classList.contains('dsSelectSearchInput');

            console.log('Tecla pressionada:', e.key, 'Foco no input de busca:', isSearchFocused);

            if (isSearchFocused) {
                // Permite que o input de busca lide com setas e espaço
                if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                    moveActiveOption(optionsList, e.key === 'ArrowDown' ? 1 : -1);
                    return;
                }
            }

            switch (e.key) {
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    if (!isOpen) {
                        openDropdown(wrapper, optionsList);
                    } else {
                        const active = optionsList.querySelector('.dsSelectOption.dsSelectActive');
                        if (active) {
                            active.click();
                        } else {
                            closeDropdown(wrapper, optionsList);
                        }
                    }
                    break;

                case 'Escape':
                    if (isOpen) {
                        e.preventDefault();
                        closeDropdown(wrapper, optionsList);
                        // devolve foco para o wrapper
                        wrapper.focus();
                    }
                    break;

                case 'ArrowDown':
                case 'ArrowUp':
                    e.preventDefault();
                    if (!isOpen) {
                        openDropdown(wrapper, optionsList);
                    }
                    moveActiveOption(optionsList, e.key === 'ArrowDown' ? 1 : -1);
                    break;

                default:
                    break;
            }
        });
    }

    function toggleDropdown(wrapper, optionsList) {
        if (wrapper.classList.contains('dsSelectOpen')) {
            closeDropdown(wrapper, optionsList);
        } else {
            openDropdown(wrapper, optionsList);
        }
    }

    function openDropdown(wrapper, optionsList) {
        wrapper.classList.add('dsSelectOpen');
        optionsList.style.display = 'block';

        console.log('Abrindo dropdown:', wrapper, optionsList);

        const searchInput = optionsList.querySelector('.dsSelectSearchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select(); // Seleciona todo o texto existente
        }

        const selected = optionsList.querySelector('.dsSelectOption.dsSelectSelected');
        const active = selected || optionsList.querySelector('.dsSelectOption');
        if (active) {
            setActiveOption(optionsList, active);
            active.scrollIntoView({ block: 'nearest' });
        }

        // Remove qualquer estilo inline que possa sobrescrever o CSS
        // Aplica o estilo correto baseado no CSS
        const computedStyle = getComputedStyle(wrapper);
        // wrapper.style.borderRadius = computedStyle.borderRadius;
        // wrapper.style.boxShadow = computedStyle.boxShadow;
    }

    function closeDropdown(wrapper, optionsList) {
        wrapper.classList.remove('dsSelectOpen');
        optionsList.style.display = 'none';
    }

    /**
     * Move o destaque (active) entre as opções com teclas de seta.
     */
    function moveActiveOption(optionsList, direction) {
        const allOptions = Array.from(optionsList.querySelectorAll('.dsSelectOption'))
            .filter(o => o.style.display !== 'none');

        if (!allOptions.length) return;

        let currentIndex = allOptions.findIndex(o => o.classList.contains('dsSelectActive'));
        if (currentIndex === -1) {
            currentIndex = 0;
        } else {
            currentIndex = currentIndex + direction;
            if (currentIndex < 0) currentIndex = allOptions.length - 1;
            if (currentIndex >= allOptions.length) currentIndex = 0;
        }

        const newActive = allOptions[currentIndex];
        setActiveOption(optionsList, newActive);
        newActive.scrollIntoView({ block: 'nearest' });
    }

    function setActiveOption(optionsList, optionEl) {
        const allOptions = optionsList.querySelectorAll('.dsSelectOption');
        allOptions.forEach(o => o.classList.remove('dsSelectActive'));
        if (optionEl) {
            optionEl.classList.add('dsSelectActive');
        }
    }

})();
