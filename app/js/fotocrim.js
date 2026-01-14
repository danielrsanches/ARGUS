// Aplica uma máscara de CPF (###.###.###-##) a um campo de input.
function maskCpf(event) {
    let value = event.target.value;
    value = value.replace(/\D/g, ""); // Remove tudo que não é dígito
    value = value.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca um ponto entre o terceiro e o quarto dígitos
    value = value.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca um ponto entre o sexto e o sétimo dígitos
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); // Coloca um hífen antes dos dois últimos dígitos
    event.target.value = value;
    return event;
}

// Adiciona ou remove a máscara de CPF do campo #doc_valor com base no tipo de documento selecionado.
function toggleCpfMask() {
    const docTipo = $("#doc_tipo").val();
    const docValorInput = $("#doc_valor");

    // Remove qualquer evento 'input' anterior para evitar duplicação
    docValorInput.off("input.cpfMask");

    if (docTipo === 'cpf') {
        docValorInput.attr("maxlength", 14);
        // Adiciona o evento de máscara com um namespace para fácil remoção
        docValorInput.on("input.cpfMask", maskCpf);
        // Aplica a máscara ao valor atual, caso já exista
        docValorInput.trigger("input");
    } else {
        docValorInput.removeAttr("maxlength");
        // Opcional: Limpar o valor ao mudar de tipo se a máscara não for compatível
        // docValorInput.val("");
    }
}

//carrega o template do módulo...
loadTemplate(
    {
        alvo: "main#modulo", //alvo onde o template será inserido...
        template: "html/fotocrim.html section#fotocrim", //template a ser carregado...
        css: ["css/fotocrim.css", "css/modal.css", "css/fotocrim-documentos-modal.css", "vendor/tomSelect/tom-select.css", "css/fotocrim-enderecos-modal.css"], // CSS específico do módulo + outros CSS necessários...
        js: ["vendor/dsPesquisa/dsPesquisa.js", "vendor/tomSelect/tom-select.complete.js"], //arquivos JS necessários (exceto do próprio módulo, pq é este arquivo aqui)...
    },
    function (err) {
        if (err) {
            let msg = "❌ Erro ao carregar o módulo fotocrim -> " + err;
            console.error(msg);
            return alert(msg);
        }

        // Carrega o modal de documentos dinamicamente
        loadHtml("html/modalDocumentos.html", "#modal-documentos-container", "div#documentosModal", function(err) {
            if (err) {
                console.error("❌ Erro ao carregar o modal de documentos: ", err);
                return;
            }
            // Anexa o handler de arrastar APÓS o modal ser carregado
            elementDrag("#documentosModal div.modal div.modalTitulo", "#documentosModal div.modal");
        });
        
        // Popula o select de facções
        function popularFaccoes() {
            fetch('php/getFaccoes.php')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro na resposta do servidor: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(result => {
                    if (!result.success) {
                        alert('Erro ao buscar facções: ' + (result.message || 'Erro desconhecido.'));
                        console.error('Erro ao buscar facções:', result.message);
                        return;
                    }

                    const select = $('#idFaccao');
                    select.empty();
                    select.append('<option value="">— selecione —</option>');

                    result.data.forEach(faccao => {
                        select.append(new Option(faccao.nome, faccao.id));
                    });
                })
                .catch(error => {
                    alert('Falha ao carregar a lista de facções. Verifique o console para mais detalhes.');
                    console.error('Erro na requisição para buscar facções:', error);
                });
        }
        popularFaccoes();

        let endSearchTomSelect; // Declare the Tom Select instance variable
        let selectedAddressData = null; // Variable to hold the currently selected address from Tom Select

        // Tom Select para pesquisa de endereços
        function initEnderecosTomSelect() {
            // Check if TomSelect is already initialized on the element
            // If it is, destroy the existing instance to prevent re-initialization issues
            const el = document.getElementById('end_search_logradouro');
            if (el && el.tomselect) {
                el.tomselect.destroy();
            }

            endSearchTomSelect = new TomSelect("#end_search_logradouro", {
                valueField: 'idRua',
                labelField: 'display', // Custom field for display
                searchField: ['logradouro', 'bairro', 'cidade', 'uf'], // Search across these fields (removed cep)
                create: true, // Allow user to type freely
                createFilter: function(input) {
                    // Always return false to prevent actual new option creation
                    return false;
                },
                persist: false,
                highlight: true,      // Highlight matched terms
                diacritics: true,     // Handle accented characters
                openOnFocus: false,    // Open dropdown on focus
                closeAfterSelect: true, // Keep dropdown open after selection for continued editing
                maxItems: 1,

                render: {
                    option: function(item, escape) {
                        return `<div class="py-2 d-flex"><span class="fw-bold">${escape(item.logradouro)}</span>&nbsp;<span class="text-muted">, ${escape(item.bairro)}, ${escape(item.cidade)}/${escape(item.uf)}</span></div>`; // Removed CEP
                    },
                    item: function(item, escape) {
                        return `<div class="py-2 d-flex"><span class="fw-bold">${escape(item.logradouro)}</span>&nbsp;<span class="text-muted">, ${escape(item.bairro)}, ${escape(item.cidade)}/${escape(item.uf)}</span></div>`; // Removed CEP
                    },
                    no_results: function(data, escape) {
                        return `<div class="no-results">Nenhum resultado encontrado para "${escape(data.input)}".</div>`;
                    }
                },
                load: function(query, callback) {
                    console.log('Tom Select: Loading data for query:', query); // Log query
                    if (!query.length || query.length < 3) {
                        console.log('Tom Select: Query too short or empty.');
                        return callback(); // Only search if more than 2 characters
                    }
                    fetch(`php/searchEnderecos.php?search_term=${encodeURIComponent(query)}`)
                        .then(response => {
                            console.log('Tom Select: Raw response status:', response.status); // Log response status
                            return response.json();
                        })
                        .then(data => {
                            console.log('Tom Select: Data received from server:', data); // Log raw data from server
                            if (data.success && data.data && data.data.length > 0) {
                                // Add a 'display' field for Tom Select
                                const formattedData = data.data.map(item => ({
                                    ...item,
                                    display: `${item.logradouro}, ${item.bairro}, ${item.cidade}/${item.uf}` // Removed CEP
                                }));
                                console.log('Tom Select: Formatted data for display:', formattedData); // Log formatted data
                                callback(formattedData);
                            } else {
                                console.log('Tom Select: No data or data not successful.');
                                callback();
                            }
                        })
                        .catch(error => {
                            console.error("Erro na busca de endereços (Tom Select):", error);
                            callback();
                        });
                },
                onItemAdd: function(value, item) {
                    selectedAddressData = this.options[value];
                },
                onItemRemove: function() {
                    selectedAddressData = null;
                }
            });
        }


        let enderecos = [];  // Array para armazenar os endereços em memória
        let currentFotocrimIdForEnderecos = null; //para rastrear a que fotocrim os endereços pertencem
        let enderecosModalLoaded = false; // Flag para controlar se o modal de endereços já foi carregado

        const mapaTiposDocumento = {
            cpf: "CPF",
            rgSp: "RG/SP",
            rgCriminal: "RG Criminal",
            rgOutroEstado: "RG (outro Estado)",
            matricula: "Matrícula",
            outro: "Outro",
        };

        // ===== Funções de Renderização =====
        
        const renderDocumentosDisplay = () => {
            const container = $(".documentos-display-container");
            container.empty();
            if (documentos.length === 0) {
                container.html('<span class="nenhum-documento">Nenhum documento adicionado.</span>');
                return;
            }
            documentos.forEach(doc => {
                const tipoDisplay = mapaTiposDocumento[doc.tipo] || doc.tipo;
                container.append(`<span class="documento-pill">${tipoDisplay}: ${doc.valor}</span>`);
            });
        };

        const renderDocumentosGerenciamento = () => {
            const container = $(".documentos-container-gerenciamento");
            container.empty();

            documentos.forEach((doc, index) => {
                const tipoDisplay = mapaTiposDocumento[doc.tipo] || doc.tipo;
                const cardHtml = `
                    <div class="documento-gerencia-card" data-index="${index}">
                        <div class="info">
                            <span>${tipoDisplay}: ${doc.valor}</span>
                            ${doc.observacao ? `<small>Obs: ${doc.observacao}</small>` : ''}
                        </div>
                        <div class="actions">
                            <button type="button" class="remover-documento">Remover</button>
                        </div>
                    </div>
                `;
                container.append(cardHtml);
            });
        };

        const renderEnderecosDisplay = () => {
            // Implementação futura, se necessário exibir endereços diretamente no card principal
        };

        const renderEnderecosGerenciamento = () => {
            const container = $(".enderecos-container-gerenciamento");
            container.empty();
            if (enderecos.length === 0) {
                container.html('<span class="nenhum-endereco">Nenhum endereço adicionado.</span>');
                return;
            }
            enderecos.forEach((end, index) => {
                const cardHtml = `
                    <div class="endereco-gerencia-card" data-index="${index}">
                        <div class="info">
                            <span>${end.logradouro}, ${end.numero} - ${end.bairro} (${end.cidade}/${end.uf})</span>
                            ${end.complemento ? `<small>Comp: ${end.complemento}</small>` : ''}
                            ${end.observacao ? `<small>Obs: ${end.observacao}</small>` : ''}
                        </div>
                        <div class="actions">
                            <button type="button" class="editar-endereco">Editar</button>
                            <button type="button" class="remover-endereco">Remover</button>
                        </div>
                    </div>
                `;
                container.append(cardHtml);
            });
        };
        
        const resetDocumentos = () => {
            documentos = [];
            renderDocumentosDisplay();
            renderDocumentosGerenciamento();
            $("#doc_valor").val("");
            $("#doc_observacao").val("");
            $("#doc_tipo").val("cpf").trigger("change"); // Trigger change to apply mask
        };

        // Função auxiliar para limpar os campos do formulário de adição/edição de endereço
        function resetEnderecosFormFields() {
            $("#end_id").val("");
            $("#end_search_logradouro").val("");
            $("#end_numero").val("");
            $("#end_complemento").val("");
            $("#end_observacao").val("");
            
            if (endSearchTomSelect) {
                endSearchTomSelect.clear();
                selectedAddressData = null;
            }
        }
                                
        const resetEnderecos = () => {
            enderecos = [];
            currentFotocrimIdForEnderecos = null;
            renderEnderecosDisplay(); // Se houver display no card
            renderEnderecosGerenciamento();
            resetEnderecosFormFields(); // Call the new reset function
        };

        // Função para carregar e exibir os endereços para gerenciamento
        function carregaEnderecosParaGerenciamento(idFotocrim) {
            const showModal = () => {
                $("#enderecos_idFotocrim").val(idFotocrim); 
                renderEnderecosGerenciamento(); 
                resetEnderecosFormFields(); 
                $("#enderecosModal").addClass('visible'); 
                // Adiciona foco ao campo de busca TomSelect após o modal ser exibido
                setTimeout(() => {
                    if (endSearchTomSelect) {
                        endSearchTomSelect.focus();
                    }
                }, 100); // 100ms de delay para garantir que a transição/renderização esteja completa
            };
        
            const loadAndShow = () => {
                if (!enderecosModalLoaded) {
                    loadHtml("html/modalEnderecos.html", "#modal-enderecos-container", "div#enderecosModal", function(err) {
                        if (err) {
                            console.error("❌ Erro ao carregar o modal de endereços: ", err);
                            return;
                        }
                        enderecosModalLoaded = true;
                        elementDrag("#enderecosModal div.modal div.modalTitulo", "#enderecosModal div.modal");
                        initEnderecosTomSelect();
                        showModal();
                    });
                } else {
                    showModal();
                }
            };
        
            // Sempre busca os endereços do servidor para garantir dados atualizados
            showSpinner();
            const formData = new FormData();
            formData.append('idFotocrim', idFotocrim);

            fetch("php/getFotocrimEnderecos.php", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                hideSpinner();
                if (data.success && data.data) {
                    enderecos = data.data; // Update the global array
                    currentFotocrimIdForEnderecos = idFotocrim; // Set the current ID
                    loadAndShow(); // Now show the modal
                } else {
                    // Limpa os dados antigos em caso de erro
                    enderecos = []; 
                    currentFotocrimIdForEnderecos = null;
                    alert(data.message || "Erro ao carregar endereços.");
                }
            })
            .catch(error => {
                hideSpinner();
                console.error("Erro ao carregar endereços:", error);
                alert("Erro ao buscar os endereços. Verifique o console.");
                enderecos = [];
                currentFotocrimIdForEnderecos = null;
            });
        }
                                                
        const renderConfig = {
            templatePath: "html/fotocrim.html",
            templateSelector: "section.card",
            templateTarget: "section#fotocrim div.content",
            populateCardFn: populateFotocrimCard, // Passa a função de população
            eventHandlerFn: aplicaEventos,       // Passa a função de tratamento de eventos
        };        // Carrega os dados iniciais na tela
        dsPesquisa.exec("viewFotocrim", "php/dsPesquisaConfig.php", function (resp) {
            if (!resp.success) return alert(resp.message || "Erro ao pesquisar.");
            renderizaCards({ ...renderConfig, dados: resp.data, renderTotal: true });
        }, [showSpinner, hideSpinner]);
        
        const $modulo = $("main#modulo");


        
        // Aplica/remove a máscara quando o tipo de documento muda
        $modulo.on("change", "#doc_tipo", toggleCpfMask);
        
        // Abrir modal de gerenciamento de documentos
        $modulo.on("click", "button.gerenciar-documentos", function() {
            renderDocumentosGerenciamento();
            $("#documentosModal").addClass('visible');
                        $("#doc_tipo").trigger("change").focus(); // Garante que a máscara seja aplicada ao abrir
                    });
            
        // Drag handlers - eles precisam ser re-anexados se o modal for recriado.
        // A delegação de evento não funciona bem para eventos de arrastar (mousedown, mousemove, mouseup).
        // A abordagem atual de anexar diretamente após o loadTemplate é mantida.
        elementDrag("#fotocrimModal div.modal div.modalTitulo", "#fotocrimModal div.modal");
        
        // ===== Event Handlers via Delegação de Evento =====

        // Botão de Pesquisa principal
        $modulo.on("click", "button.pesquisa", function () {
            dsPesquisa("viewFotocrim", "php/dsPesquisaConfig.php", function (resp) {
                if (!resp.success) return alert(resp.message || "Erro ao pesquisar.");
                renderizaCards({ ...renderConfig, dados: resp.data, renderTotal: true });
            },[showSpinner, hideSpinner]);
        });

        // Botão Novo Registro
        $modulo.on("click", "section.fotocrim button.novo", function () {
            $("form#fotocrim")[0].reset();
            resetDocumentos();
            resetEnderecos();
            $(".idadeInfo").text("XX anos"); // Reseta a idade
            // Força o redimensionamento dos textareas para o tamanho inicial
            $("textarea#observacoes, textarea#observacoesReservadas").trigger("input");
            
            $("section.forms.fotocrimForm").addClass("visible");
            // Prepare for smooth open: remove hidden/fade-out
            $("#fotocrimModal").removeClass('hidden fade-out');
            setTimeout(function() {
                $("#nomeCompleto").focus().select();
            }, 100);
        });

        // Fechar/Cancelar Modal Principal
        $modulo.on("click", "#fotocrimModal .fechar, #fotocrimModal .cancelar", function () {
            const modalBackdrop = $("#fotocrimModal");
            modalBackdrop.addClass('fade-out');
            
            // Wait for the transition to complete before setting display: none
            modalBackdrop.one('transitionend', () => { // Use transitionend
                modalBackdrop.addClass('hidden').removeClass('fade-out');
                $("section.forms.fotocrimForm").removeClass("visible");
                resetDocumentos();
            });
        });

        // ----- CÁLCULO DE IDADE -----
        function calculaIdade(dataNascimento) {
            if (!dataNascimento) return null;
            const hoje = new Date();
            // Adiciona T00:00:00 para evitar problemas com fuso horário
            const nascimento = new Date(dataNascimento + 'T00:00:00'); 
            let idade = hoje.getFullYear() - nascimento.getFullYear();
            const m = hoje.getMonth() - nascimento.getMonth();
            if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
                idade--;
            }
            return idade;
        }

        $modulo.on("change", "#dataNascimento", function() {
            const idade = calculaIdade($(this).val());
            if (idade !== null && idade >= 0) {
                $(".idadeInfo").text(idade + " anos");
            } else {
                $(".idadeInfo").text("XX anos");
            }
        });

        // ----- AUTO-GROW TEXTAREA -----
        function autoGrowTextarea(element) {
            element.style.height = "auto"; // Reseta a altura para recalcular
            element.style.height = (element.scrollHeight) + "px";
        }

        $modulo.on('input', 'textarea#observacoes, textarea#observacoesReservadas', function() {
            autoGrowTextarea(this);
        });

        // Salvar formulário principal
        $modulo.on("click", "#fotocrimModal button.salvar", function (e) {
            e.preventDefault();

            const form = document.querySelector("form#fotocrim");
            const formData = new FormData(form);

            // --- CLIENT-SIDE VALIDATION ---
            const nomeCompleto = formData.get("nomeCompleto").trim();
            const nomeMae = formData.get("nomeMae").trim();
            const dataNascimento = formData.get("dataNascimento").trim();

            if (!nomeCompleto) {
                alert("O campo 'Nome completo' é obrigatório.");
                $("#nomeCompleto").focus();
                return;
            }
            if (!nomeMae) {
                alert("O campo 'Nome da mãe' é obrigatório.");
                $("#nomeMae").focus();
                return;
            }
            if (!dataNascimento) {
                alert("O campo 'Data de nascimento' é obrigatório.");
                $("#dataNascimento").focus();
                return;
            }
            // --- END CLIENT-SIDE VALIDATION ---

            showSpinner();

            formData.append("configName", "fotocrim");
            formData.append("documentosJson", JSON.stringify(documentos));
            formData.append("enderecosJson", JSON.stringify(enderecos));

            fetch("php/dsSave.php", { method: "POST", body: formData })
                .then(response => response.json())
                .then(data => {
                    hideSpinner();
                    console.log("Server response after save:", data); // Debug log
                    // alert(data.message || (data.success ? 'Operação concluída.' : 'Ocorreu um erro desconhecido.')); // Removido a pedido do usuário
                    if (data.success) {
                        $("#fotocrimModal .fechar").trigger("click");
                        // Carrega e renderiza apenas o card recém-adicionado/editado
                        loadAndRenderSingleFotocrimCard(data.id);
                    }
                })
                .catch(error => {
                    hideSpinner();
                    console.error("Erro ao salvar:", error);
                    alert("Erro ao enviar os dados. Verifique o console.");
                });
        });
        
        // Função para carregar e renderizar um único card por ID
        function loadAndRenderSingleFotocrimCard(id) {
            showSpinner();
            dsPesquisa.exec(
                "viewFotocrim",
                "php/dsPesquisaConfig.php",
                function (resp) {
                    hideSpinner();
                    if (resp.success && resp.data && resp.data.length > 0) {
                        // Limpa os cards existentes e renderiza apenas o novo
                        $(renderConfig.templateTarget).empty(); 
                        renderizaCards({ ...renderConfig, dados: resp.data, renderTotal: false, eventHandlerFn: aplicaEventos });
                    } else {
                        alert(resp.message || "Não foi possível carregar o registro salvo.");
                        // Se não encontrar, talvez re-pesquisar tudo ou mostrar uma mensagem
                        $("button.pesquisa").trigger("click"); 
                    }
                },
                [showSpinner, hideSpinner],
                { id: id } // Passa o ID como filtro para dsPesquisa
            );
        }
        
        // Fechar/Concluir modal de gerenciamento de documentos
        $modulo.on("click", "#documentosModal .fechar-secundario, #documentosModal .concluir-documentos", function() {
            $("#documentosModal").removeClass('visible');
            renderDocumentosDisplay(); 
            $("#nomeMae").focus();
        });

        // Fechar/Concluir modal de gerenciamento de endereços
        $modulo.on("click", "#enderecosModal .fechar-secundario, #enderecosModal .concluir-enderecos", function() {
            const modalBackdrop = $("#enderecosModal");
            modalBackdrop.removeClass('visible');
            // If the main fotocrim modal is visible, focus an input there
            if ($("#fotocrimModal").hasClass("visible")) {
                $("#nomeMae").focus();
            }
        });

        // Salvar alterações de endereços
        $modulo.on("click", "#enderecosModal button.salvar-alteracoes-enderecos", function() {
            const idFotocrim = $("#enderecos_idFotocrim").val();
            if (!idFotocrim) {
                alert("Erro: ID do Fotocrim não encontrado.");
                return;
            }

            // Close modal immediately and show spinner
            $("#enderecosModal").removeClass('visible');
            showSpinner();

            const formData = new FormData();
            formData.append("idFotocrim", idFotocrim);
            formData.append("enderecosJson", JSON.stringify(enderecos));

            fetch("php/saveEnderecos.php", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                hideSpinner();
                // No success alert, as requested
                if (data.success) {
                    loadAndRenderSingleFotocrimCard(idFotocrim);
                } else {
                    // Show alert only on failure
                    alert(data.message || 'Ocorreu um erro desconhecido.');
                }
            })
            .catch(error => {
                hideSpinner();
                console.error("Erro ao salvar endereços:", error);
                alert("Erro ao enviar os dados de endereço. Verifique o console.");
            });
        });


        // Adicionar novo endereço (apenas na lista local)
        $modulo.on("click", "#enderecosModal button.inserir-endereco-lista", function() {
            const id = $("#end_id").val(); // idEndereco, se for edição
            const numero = $("#end_numero").val().trim();
            const complemento = $("#end_complemento").val().trim();
            const observacao = $("#end_observacao").val().trim();

            if (!selectedAddressData) {
                alert("Por favor, selecione um logradouro válido.");
                return;
            }
            if (!numero) {
                alert("O campo 'Número' é obrigatório.");
                return;
            }

            const novoEndereco = {
                id: id || null, // Se id for preenchido, é edição
                idRua: selectedAddressData.idRua,
                logradouro: selectedAddressData.logradouro,
                numero,
                complemento,
                bairro: selectedAddressData.bairro,
                idBairro: selectedAddressData.idBairro,
                cidade: selectedAddressData.cidade,
                idCidade: selectedAddressData.idCidade,
                uf: selectedAddressData.uf,
                observacao,
            };

            if (id) {
                // Edição de um endereço existente
                const index = enderecos.findIndex(end => end.id == id);
                if (index !== -1) {
                    enderecos[index] = { ...enderecos[index], ...novoEndereco };
                }
            } else {
                // Adição de um novo endereço
                const isDuplicate = enderecos.some(end => 
                    end.idRua === novoEndereco.idRua &&
                    end.numero === novoEndereco.numero
                );
                if (isDuplicate) {
                    alert("Este endereço (rua e número) já foi adicionado.");
                    return;
                }
                enderecos.push(novoEndereco);
            }
            
            renderEnderecosGerenciamento();
            resetEnderecosFormFields(); 
            if (endSearchTomSelect) {
                endSearchTomSelect.focus();
            }
        });

        // Adicionar novo documento
        $modulo.on("click", "#documentosModal button.adicionar-documento", function() {
            const tipo = $("#doc_tipo").val();
            const valor = $("#doc_valor").val().trim();
            const observacao = $("#doc_observacao").val();

            if (!valor) {
                alert("O número do documento é obrigatório.");
                return;
            }

            // Verifica se o documento já existe
            const isDuplicate = documentos.some(doc => doc.tipo === tipo && doc.valor === valor);
            if (isDuplicate) {
                alert("Este documento já foi adicionado.");
                return;
            }

            documentos.push({ tipo, valor, observacao });
            renderDocumentosGerenciamento();

            $("#doc_valor").val("");
            $("#doc_observacao").val("");
            $("#doc_tipo").focus();
        });

        // Adicionar novo documento com Enter
        $modulo.on("keyup", "#doc_valor, #doc_observacao", function(e) {
            if (e.keyCode === 13) { // 13 é o código para Enter
                e.preventDefault();
                $("#documentosModal button.adicionar-documento").trigger("click");
            }
        });

        // Inserir novo endereço com Enter
        $modulo.on("keyup", "#end_search_logradouro, #end_numero, #end_complemento", function(e) {
            if (e.keyCode === 13) { // 13 é o código para Enter
                e.preventDefault();
                $("#enderecosModal button.inserir-endereco-lista").trigger("click");
            }
        });
        
        // Remover um documento
        $modulo.on("click", ".documentos-container-gerenciamento .remover-documento", function() {
            const index = $(this).closest(".documento-gerencia-card").data("index");
            documentos.splice(index, 1);
            renderDocumentosGerenciamento();
        });
        
        // Remover um endereço
        $modulo.on("click", ".enderecos-container-gerenciamento .remover-endereco", function() {
            const index = $(this).closest(".endereco-gerencia-card").data("index");
            if (confirm("Tem certeza que deseja remover este endereço?")) {
                enderecos.splice(index, 1);
                renderEnderecosGerenciamento();
            }
        });

        // Editar um endereço
        $modulo.on("click", ".enderecos-container-gerenciamento .editar-endereco", function() {
            const index = $(this).closest(".endereco-gerencia-card").data("index");
            const endereco = enderecos[index];

            resetEnderecosFormFields(); // Clear the form first, including Tom Select

            $("#end_id").val(endereco.id || ""); // Pode ser um ID temporário ou real
            $("#end_numero").val(endereco.numero);
            $("#end_complemento").val(endereco.complemento);
            $("#end_observacao").val(endereco.observacao);

            // Populate Tom Select with the existing address
            if (endSearchTomSelect) {
                // Tom Select expects an item with at least valueField and labelField
                const itemToSelect = {
                    idRua: endereco.idRua,
                    logradouro: endereco.logradouro,
                    bairro: endereco.bairro,
                    idBairro: endereco.idBairro,
                    cidade: endereco.cidade,
                    idCidade: endereco.idCidade,
                    uf: endereco.uf,
                    display: `${endereco.logradouro}, ${endereco.bairro}, ${endereco.cidade}/${endereco.uf}`
                };
                // Add the item to Tom Select options if not already there and select it
                if (!endSearchTomSelect.options[itemToSelect.idRua]) {
                    endSearchTomSelect.addOption(itemToSelect);
                }
                endSearchTomSelect.setValue(itemToSelect.idRua);
                // Manually set selectedAddressData as onItemAdd might not fire for setValue
                selectedAddressData = itemToSelect;
            }

            $("#end_numero").focus(); // Focus on numero field for editing
        });

        // Clicar na foto para abrir seleção de arquivo
        $modulo.on("click", "div.colFotoPerfil div.fotoPerfil", function() {
            $("#fotoPerfil").click();
        });

        // Handler da mudança de foto (atualmente desabilitado)
        $modulo.on("change", "#fotoPerfil", function(e) {
            // A pré-visualização da imagem foi desativada temporariamente para cumprir
            // a Política de Segurança de Conteúdo (CSP) que proíbe 'inline styles'.
            // A imagem ainda é selecionada e enviada, mas não é exibida.
        });

        function populateFotocrimCard(cardClone, element) {
            cardClone.dataset.id = element.id;
            if (element.faccaoResumo) {
                cardClone.classList.add("red");
            }

            cardClone.querySelector('[data-field="id"]').textContent = `#${element.id}`;
            cardClone.querySelector('[data-field="createdAt"]').textContent = `Criado em: ${dateInvert(element.createdAt, true)}`;
            cardClone.querySelector('[data-field="updatedAt"]').textContent = `Atualizado em: ${dateInvert(element.updatedAt, true)}`;
            
            const periculosidadeSpan = cardClone.querySelector('[data-field="periculosidade"] span');
            periculosidadeSpan.textContent = element.periculosidade;
            if (element.periculosidade === 'Alta') periculosidadeSpan.classList.add('periculosidadeAlta');
            if (element.periculosidade === 'Média') periculosidadeSpan.classList.add('periculosidadeMedia');

            cardClone.querySelector('[data-field="nomeCompleto"]').textContent = `${element.nomeCompleto} ${element.vulgosResumo ? `(${element.vulgosResumo})` : ''}`;
            cardClone.querySelector('[data-field="documentosResumo"]').innerHTML = formataDocumentosResumo(element.documentosResumo);

            const fotoImg = cardClone.querySelector('.colFoto img');
            if (element.fotoPerfil) {
                // Implementar lógica segura para carregar imagem, se necessário
            }

            cardClone.querySelector('[data-field="dataNascimento"]').innerHTML = `<strong>Nascimento:</strong> ${dateInvert(element.dataNascimento, false)}`;
            cardClone.querySelector('[data-field="sexo"]').innerHTML = `<strong>Sexo:</strong> ${element.sexo === 'M' ? 'Masculino' : 'Feminino'}`;
            cardClone.querySelector('[data-field="faccao"] span').textContent = element.faccaoResumo || "";
            cardClone.querySelector('[data-field="naturalidade"]').innerHTML = `<strong>Naturalidade:</strong> ${element.naturalidadeEstado}`;
            cardClone.querySelector('[data-field="nomeMae"]').innerHTML = `<strong>Mãe:</strong> ${element.nomeMae}`;
            cardClone.querySelector('[data-field="nomePai"]').innerHTML = `<strong>Pai:</strong> ${element.nomePai}`;

            // Lógica para botões do menu (antecedentes, etc.)
            const setButtonClass = (selector, count) => {
                if (count) cardClone.querySelector(selector).classList.add('green');
            };
            setButtonClass('.antecedentes', element.antecedentesQuantidade);
            setButtonClass('.enderecos', element.enderecosQuantidade);
            setButtonClass('.tatuagens', element.tatuagensQuantidade);
            setButtonClass('.comparsas', element.comparsasJson);
            setButtonClass('.fotos', element.fotosQuantidade);
            setButtonClass('.arquivos', element.arquivosQuantidade);
        }
        
        // Função para carregar um registro para edição
        function carregaFotocrimParaEdicao(id) {
            showSpinner();
            // Limpa o formulário e reseta documentos antes de carregar novos dados
            $("form#fotocrim")[0].reset();
            resetDocumentos();
            resetEnderecos(); // Limpa os endereços antigos
            $(".idadeInfo").text("XX anos");
            $("#fotocrimModal").removeClass('hidden');
            $("section.forms.fotocrimForm").addClass("visible");

            const formData = new FormData();
            formData.append('id', id);

            fetch("php/getFotocrimById.php", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                hideSpinner();
                if (data.success && data.data) {
                    const record = data.data;

                    // Preenche campos do formulário principal
                    $("#id").val(record.id);
                    $("#nomeCompleto").val(record.nomeCompleto);
                    $("#dataNascimento").val(record.dataNascimento);
                    if (record.dataNascimento) {
                        const idade = calculaIdade(record.dataNascimento);
                        if (idade !== null && idade >= 0) {
                            $(".idadeInfo").text(idade + " anos");
                        }
                    }
                    $("#sexo").val(record.sexo);
                    $("#naturalidadeEstado").val(record.naturalidadeEstado);
                    $("#periculosidade").val(record.periculosidade);
                    $("#nomeMae").val(record.nomeMae);
                    $("#nomePai").val(record.nomePai);
                    $("#idFaccao").val(record.idFaccao);
                    $("#faccaoFuncao").val(record.faccaoFuncao);
                    $("#observacoes").val(record.observacoes);
                    $("#observacoesReservadas").val(record.observacoesReservadas);

                    // Força o redimensionamento dos textareas
                    $("textarea#observacoes, textarea#observacoesReservadas").trigger("input");

                    // Lidar com a foto de perfil (se houver)
                    // if (record.fotoPerfil) {
                    //     // Implementar lógica para exibir a foto de perfil, se necessário
                    //     // Ex: $(".colFotoPerfil .fotoPerfil").css("background-image", `url(${record.fotoPerfil})`);
                    // }

                    // Lidar com documentos
                    if (record.documentos && Array.isArray(record.documentos)) {
                        documentos = record.documentos; // Atualiza o array de documentos global
                        renderDocumentosDisplay();
                        renderDocumentosGerenciamento();
                    }

                    // Lidar com endereços
                    currentFotocrimIdForEnderecos = record.id; // Always set the ID for the current record
                    if (record.enderecos && Array.isArray(record.enderecos)) {
                        enderecos = record.enderecos; // Update the global addresses array
                    } else {
                        enderecos = []; // Clear the array if no addresses are returned
                    }

                    setTimeout(() => {
                        $("#nomeCompleto").focus().select();
                    }, 100);

                } else {
                    alert(data.message || "Erro ao carregar registro para edição.");
                    $("#fotocrimModal").addClass('hidden');
                    $("section.forms.fotocrimForm").removeClass("visible");
                }
            })
            .catch(error => {
                hideSpinner();
                console.error("Erro ao carregar registro para edição:", error);
                alert("Erro ao carregar os dados para edição. Verifique o console.");
                $("#fotocrimModal").addClass('hidden');
                $("section.forms.fotocrimForm").removeClass("visible");
            });
        }
        
        // Função para aplicar eventos aos cards
        // esta função deve ter esse nome, pois, é utilizada pela função genérica geral.js -> renderizaCards()
        function aplicaEventos(id) {
            //adiciona o evento de seleção do card...
            $(`section.card[data-id='${id}'] div.topBar`).on("click", function () {
                const isSelected = $(this).find("span.campo[data-field='id']").attr("data-selected") || false;
                $(this)
                    .find("span.campo[data-field='id']")
                    .attr("data-selected", isSelected === "true" ? false : true);
            });

            // Evento para o botão de editar no card
            $(`section.card[data-id='${id}'] button.editar`).on("click", function () {
                const recordId = $(this).closest('section.card').data('id');
                carregaFotocrimParaEdicao(recordId);
            });

            // Evento para o botão de endereços no card
            $(`section.card[data-id='${id}'] button.enderecos`).on("click", function () {
                const idFotocrim = $(this).closest('section.card').data('id');
                carregaEnderecosParaGerenciamento(idFotocrim);
            });
        }
    } //fim do loadTemplate
);

// Função para formatar o campo documentosResumo...
function formataDocumentosResumo(texto) {
    if (!texto) return "";

    const mapaTipos = {
        cpf: "CPF",
        rgSp: "RG/SP",
        rgCriminal: "RGC",
        rgOutroEstado: "RG (outro estado)",
        matricula: "Matrícula",
        outro: "Outro",
    };

    const ordemTipos = {
        cpf: 1,
        rgSp: 2,
        rgCriminal: 3,
        matricula: 4,
        rgOutroEstado: 5,
        outro: 99,
    };

    return texto
        .split("\n")
        .map((linha) => {
            const [tipo, ...resto] = linha.split(":");
            return {
                tipo: tipo,
                valor: resto.join(":").trim(),
            };
        })
        .sort((a, b) => (ordemTipos[a.tipo] ?? 50) - (ordemTipos[b.tipo] ?? 50))
        .map((item) => {
            const titulo = mapaTipos[item.tipo] ?? item.tipo;
            return `<strong>${titulo}</strong>: ${item.valor}`;
        })
        .join("; ");
}