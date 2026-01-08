//limpa CSS e JS não fixos...
clearCss();
clearJs();

// Lógica de máscara para CPF
const applyCpfMask = (value) => {
    value = value.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (value.length > 11) {
        value = value.substring(0, 11);
    }
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return value;
};

const toggleCpfMask = () => {
    const docTipo = $("#doc_tipo").val();
    const $docValor = $("#doc_valor");

    // Remove qualquer evento input anterior para evitar duplicação
    $docValor.off('input.cpfMask');

    if (docTipo === "cpf") {
        // Aplica a máscara no valor atual e adiciona o evento input
        $docValor.val(applyCpfMask($docValor.val()));
        $docValor.on('input.cpfMask', function() {
            $(this).val(applyCpfMask($(this).val()));
        });
    } else {
        // Remove a máscara (mantém apenas dígitos)
        $docValor.val($docValor.val().replace(/\D/g, ''));
    }
};

//carrega o template do módulo...
loadTemplate(
    {
        alvo: "main#modulo", //alvo onde o template será inserido...
        template: "html/fotocrim.html section#fotocrim", //template a ser carregado...
                css: ["css/fotocrim.css", "css/modal.css", "css/fotocrim-documentos-modal.css", "css/fotocrim-enderecos-modal.css"], // CSS específico do módulo + outros CSS necessários...
        js: ["vendor/dsPesquisa/dsPesquisa.js"], //arquivos JS necessários (exceto do próprio módulo, pq é este arquivo aqui)...
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
        
                let enderecos = [];  // Array para armazenar os endereços em memória
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
                                    ${end.cep ? `<small>CEP: ${end.cep}</small>` : ''}
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
        
                                        const resetEnderecos = () => {
                                            enderecos = [];
                                            renderEnderecosDisplay(); // Se houver display no card
                                            renderEnderecosGerenciamento();
                                            $("#end_id").val("");
                                            $("#end_logradouro").val("");
                                            $("#end_numero").val("");
                                            $("#end_complemento").val("");
                                            $("#end_bairro").empty().append('<option value="">— selecione —</option>');
                                            $("#end_cidade").empty().append('<option value="">— selecione —</option>');
                                            $("#end_uf").val("");
                                            $("#end_cep").val("");
                                            $("#end_observacao").val("");
                                        };
                                
                                        // Função para popular o select de cidades baseado na UF
                                        const populateCidades = (uf, selectedCidadeId = null) => {
                                            const $endCidade = $("#end_cidade");
                                            $endCidade.empty().append('<option value="">— selecione —</option>');
                                            $("#end_bairro").empty().append('<option value="">— selecione —</option>'); // Limpa bairros ao mudar cidade
                                            if (!uf) {
                                                return;
                                            }
                                            fetch('php/getCidadesByUf.php', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                                body: `uf=${uf}`
                                            })
                                            .then(response => response.json())
                                            .then(result => {
                                                if (result.success && result.data.length > 0) {
                                                    result.data.forEach(cidade => {
                                                        $endCidade.append(new Option(cidade.nomeCidade, cidade.id));
                                                    });
                                                    if (selectedCidadeId) {
                                                        $endCidade.val(selectedCidadeId).trigger('change');
                                                    }
                                                }
                                            })
                                            .catch(error => console.error("Erro ao carregar cidades:", error));
                                        };
                        
                                        // Função para popular o select de bairros baseado na Cidade
                                        const populateBairros = (idCidade, selectedBairroId = null) => {
                                            const $endBairro = $("#end_bairro");
                                            $endBairro.empty().append('<option value="">— selecione —</option>');
                                            if (!idCidade) {
                                                return;
                                            }
                                            fetch('php/getBairrosByCidade.php', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                                body: `idCidade=${idCidade}`
                                            })
                                            .then(response => response.json())
                                            .then(result => {
                                                if (result.success && result.data.length > 0) {
                                                    result.data.forEach(bairro => {
                                                        $endBairro.append(new Option(bairro.nomeBairro, bairro.id));
                                                    });
                                                    if (selectedBairroId) {
                                                        $endBairro.val(selectedBairroId);
                                                    }
                                                }
                                            })
                                            .catch(error => console.error("Erro ao carregar bairros:", error));
                                        };
                        
                                                                        
                                        // Função para carregar e exibir os endereços para gerenciamento
                                        function carregaEnderecosParaGerenciamento(idFotocrim) {
                                            const loadAndShow = () => {
                                                showSpinner();
                                                resetEnderecos(); // Limpa antes de carregar
                                                $("#enderecos_idFotocrim").val(idFotocrim); // Define o ID do fotocrim pai
                                    
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
                                                                                    enderecos = data.data; // Atualiza o array de endereços global
                                                                                    renderEnderecosGerenciamento();
                                                                                    $("#enderecosModal").addClass('visible'); // Exibe o modal
                                                                                    
                                                                                    // Reset fields, ensuring a clean state for new input or editing
                                                                                    $("#end_id").val("");
                                                                                    $("#end_logradouro").val("");
                                                                                    $("#end_numero").val("");
                                                                                    $("#end_complemento").val("");
                                                                                    $("#end_observacao").val("");
                                                                                    $("#end_uf").val("").trigger('change'); // Clear UF and trigger change to clear cities/bairros
                                                                                } else {                                                        alert(data.message || "Erro ao carregar endereços.");
                                                        $("#enderecosModal").removeClass('visible');
                                                    }
                                                })
                                                .catch(error => {
                                                    hideSpinner();
                                                    console.error("Erro ao carregar endereços:", error);
                                                    alert("Erro ao carregar os endereços. Verifique o console.");
                                                    $("#enderecosModal").addClass('hidden');
                                                });
                                            };
                        
                                            if (!enderecosModalLoaded) {
                                                loadHtml("html/modalEnderecos.html", "#modal-enderecos-container", "div#enderecosModal", function(err) {
                                                    if (err) {
                                                        console.error("❌ Erro ao carregar o modal de endereços: ", err);
                                                        return;
                                                    }
                                                    enderecosModalLoaded = true;
                                                    // Anexa o handler de arrastar APÓS o modal ser carregado
                                                    elementDrag("#enderecosModal div.modal div.modalTitulo", "#enderecosModal div.modal");
                                                    // Esconde o modal inicialmente, ele será exibido por loadAndShow
                                                    // $("#enderecosModal").addClass('hidden'); // Removido: CSS agora gerencia o estado inicial
                                                    loadAndShow();
                                                });
                                            } else {
                                                loadAndShow();
                                            }
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
                    
                            // Event listeners para UF e Cidade
                            $modulo.on('change', '#end_uf', function() {
                                populateCidades($(this).val());
                            });
                            $modulo.on('change', '#end_cidade', function() {
                                populateBairros($(this).val());
                            });
                    
                            // Fechar/Concluir modal de gerenciamento de documentos        // Drag handlers - eles precisam ser re-anexados se o modal for recriado.
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
            const modalFormSection = $("section.forms.fotocrimForm");

            // Apply fade-out animation
            modalBackdrop.addClass('fade-out');
            
            // Wait for the transition to complete before setting display: none
            modalBackdrop.one('transitionend', () => { // Use transitionend
                modalBackdrop.addClass('hidden').removeClass('fade-out');
                modalFormSection.removeClass("visible");
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
            resetEnderecos();
            // If the main fotocrim modal is visible, focus an input there
            if ($("#fotocrimModal").hasClass("visible")) {
                $("#nomeMae").focus();
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

            // Adicionar novo endereço
            $modulo.on("click", "#enderecosModal button.adicionar-endereco", function() {
                const id = $("#end_id").val(); // idEndereco, se for edição
                const logradouro = $("#end_logradouro").val().trim();
                const numero = $("#end_numero").val().trim();
                const complemento = $("#end_complemento").val().trim();
                const idBairro = $("#end_bairro").val();
                const nomeBairro = $("#end_bairro option:selected").text();
                const idCidade = $("#end_cidade").val();
                const nomeCidade = $("#end_cidade option:selected").text();
                const uf = $("#end_uf").val();
                const observacao = $("#end_observacao").val().trim();

                if (!logradouro || !numero || !idBairro || !idCidade || !uf) {
                    alert("Os campos Logradouro, Número, Bairro, Cidade e UF são obrigatórios para o endereço.");
                    return;
                }

                const novoEndereco = {
                    id: id || null, // Se id for preenchido, é edição
                    logradouro,
                    numero,
                    complemento,
                    idBairro: idBairro,
                    bairro: nomeBairro,
                    idCidade: idCidade,
                    cidade: nomeCidade,
                    uf,
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
                    // Verificação de duplicidade (considerando logradouro, numero, cidade, uf)
                    const isDuplicate = enderecos.some(end => 
                        end.logradouro === novoEndereco.logradouro &&
                        end.numero === novoEndereco.numero &&
                        end.cidade === novoEndereco.cidade &&
                        end.uf === novoEndereco.uf
                    );
                    if (isDuplicate) {
                        alert("Este endereço já foi adicionado.");
                        return;
                    }
                    enderecos.push(novoEndereco);
                }
                
                renderEnderecosGerenciamento();
                resetEnderecosFormFields(); // Limpa o formulário de adição/edição
            });

            // Função auxiliar para limpar os campos do formulário de adição/edição de endereço
            function resetEnderecosFormFields() {
                $("#end_id").val("");
                $("#end_logradouro").val("");
                $("#end_numero").val("");
                $("#end_complemento").val("");
                $("#end_bairro").empty().append('<option value="">— selecione —</option>');
                $("#end_cidade").empty().append('<option value="">— selecione —</option>');
                $("#end_uf").val("");
                $("#end_observacao").val("");
                $("#end_logradouro").focus();
            }
        
        // Adicionar novo documento com Enter
        $modulo.on("keyup", "#doc_valor, #doc_observacao", function(e) {
            if (e.keyCode === 13) { // 13 é o código para Enter
                e.preventDefault();
                $("#documentosModal button.adicionar-documento").trigger("click");
            }
        });

        // Adicionar novo endereço com Enter nos campos relevantes
        $modulo.on("keyup", "#end_logradouro, #end_numero, #end_complemento, #end_bairro, #end_cidade, #end_uf, #end_observacao", function(e) {
            if (e.keyCode === 13) { // 13 é o código para Enter
                e.preventDefault();
                $("#enderecosModal button.adicionar-endereco").trigger("click");
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

            $("#end_id").val(endereco.id || ""); // Pode ser um ID temporário ou real
            $("#end_logradouro").val(endereco.logradouro);
            $("#end_numero").val(endereco.numero);
            $("#end_complemento").val(endereco.complemento);
            $("#end_observacao").val(endereco.observacao);

            // Populate UF, then trigger change to populate Cidades
            $("#end_uf").val(endereco.uf).trigger('change'); 
            
            // Wait for cities to load before trying to select city and then bairros
            setTimeout(() => {
                $("#end_cidade").val(endereco.idCidade).trigger('change'); // Trigger change to populate bairros
                setTimeout(() => {
                    $("#end_bairro").val(endereco.idBairro); // Select the bairro
                }, 100); // Small delay for bairros to load
            }, 100); // Small delay for cities to load

            $("#end_logradouro").focus(); // Foca no primeiro campo para edição
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
