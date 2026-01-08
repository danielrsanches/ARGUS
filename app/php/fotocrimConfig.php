<?php

declare(strict_types=1);

/**
 * Endpoint de configuração do módulo Fotocrim.
 *
 * Uso típico no front:
 *
 *   GET fotocrimConfig.php?tipo=viewConfig
 *   GET fotocrimConfig.php?tipo=tableConfig
 *   GET fotocrimConfig.php?tipo=tableConfigEnderecos
 *
 * Resposta:
 * {
 *   "success": true,
 *   "message": "",
 *   "data": { ... }
 * }
 */

// Esta função será usada por `getFotocrimById.php` e outras partes que precisam da config da view
function getFotocrimViewConfig(): array
{
    return [
        'viewName'       => 'viewFotocrim',
        'query'          => 'SELECT t.* FROM viewFotocrim t', // Assumindo que 'viewFotocrim' é uma VIEW no banco de dados
        'primaryKey'     => 'id',
        'orderByDefault' => 'nomeCompleto ASC',
        'limitDefault'   => 50,
        'fixedFilters'   => '', //filtros fixos aplicados em toda consulta. ex: status = "ativo"
        'defaultFilters' => '(id = (SELECT MAX(id) from viewFotocrim))', //filtros padrão aplicados na primeira carga. ex: dataCriacao >= "2023-01-01"
        'fields' => [
            ['name' => 'id',                    'type' => 'bigint',   'label' => 'ID'],
            ['name' => 'nomeCompleto',          'type' => 'string',   'label' => 'Nome Completo'],
            ['name' => 'documentosResumo',      'type' => 'text',     'label' => 'Documentos'],
            ['name' => 'dataNascimento',        'type' => 'date',     'label' => 'Data de Nascimento'],
            ['name' => 'sexo',                  'type' => 'enum',     'label' => 'Sexo'],
            ['name' => 'nomeMae',               'type' => 'string',   'label' => 'Nome da Mãe'],
            ['name' => 'nomePai',               'type' => 'string',   'label' => 'Nome do Pai'],
            ['name' => 'naturalidadeEstado',    'type' => 'enum',     'label' => 'Naturalidade (UF)'],
            ['name' => 'periculosidade',        'type' => 'enum',     'label' => 'Periculosidade'],
            ['name' => 'observacoes',           'type' => 'text',     'label' => 'Observações'],
            ['name' => 'observacoesReservadas', 'type' => 'text',     'label' => 'Observações Reservadas'],
            ['name' => 'createdAt',             'type' => 'datetime', 'label' => 'Criado em'],
            ['name' => 'updatedAt',             'type' => 'datetime', 'label' => 'Atualizado em'],
            ['name' => 'faccaoResumo',          'type' => 'string',   'label' => 'Facção'],
            ['name' => 'enderecosResumo',       'type' => 'text',     'label' => 'Endereços'],
            ['name' => 'enderecosQuantidade',   'type' => 'bigint',   'label' => 'Endereços (quantidade)'],
            ['name' => 'vulgosResumo',          'type' => 'text',     'label' => 'Vulgos'],
            ['name' => 'tatuagensResumo',       'type' => 'text',     'label' => 'Tatuagens'],
            ['name' => 'tatuagensQuantidade',   'type' => 'bigint',   'label' => 'Tatuagens (quantidade)'],
            ['name' => 'antecedentesResumo',    'type' => 'text',     'label' => 'Antecedentes Criminais'],
            ['name' => 'antecedentesQuantidade', 'type' => 'bigint',   'label' => 'Antecedentes (quantidade)'],
            ['name' => 'alertasQuantidade',     'type' => 'bigint',   'label' => 'Alertas (quantidade)'],
            ['name' => 'arquivosQuantidade',    'type' => 'bigint',   'label' => 'Arquivos (quantidade)'],
            ['name' => 'fotosQuantidade',       'type' => 'bigint',   'label' => 'Fotos (quantidade)'],
            ['name' => 'comparsasJson',         'type' => 'json',     'label' => 'Comparsas'],
        ],
    ];
}

// -----------------------------------------------------------------------------
// viewConfig: usado pelo dsPesquisa para montar o formulário de pesquisa
// -----------------------------------------------------------------------------
// A viewConfig agora é obtida da função getFotocrimViewConfig para reutilização
$viewConfig = getFotocrimViewConfig();


// -----------------------------------------------------------------------------
// tableConfig: usado para inclusão/edição/exclusão do registro principal
// (preencher depois conforme seu padrão de forms de edição)
// -----------------------------------------------------------------------------
$tableConfig = [
    'tableName'  => 'fotocrim',
    'primaryKey' => 'id',
    'fields'     => [
        ['name' => 'id',                    'type' => 'bigint', 'label' => 'ID',                    'editable' => false],
        ['name' => 'nomeCompleto',          'type' => 'string', 'label' => 'Nome Completo',         'editable' => true],
        ['name' => 'dataNascimento',        'type' => 'date',   'label' => 'Data de Nascimento',    'editable' => true],
        ['name' => 'sexo',                  'type' => 'enum',   'label' => 'Sexo',                  'editable' => true],
        ['name' => 'nomeMae',               'type' => 'string', 'label' => 'Nome da Mãe',           'editable' => true],
        ['name' => 'nomePai',               'type' => 'string', 'label' => 'Nome do Pai',           'editable' => true],
        ['name' => 'naturalidadeEstado',    'type' => 'enum',   'label' => 'Naturalidade (UF)',     'editable' => true],
        ['name' => 'idFaccao',              'type' => 'bigint', 'label' => 'Facção',                'editable' => true],
        ['name' => 'faccaoFuncao',          'type' => 'string', 'label' => 'Função na Facção',      'editable' => true],
        ['name' => 'fotoPerfil',            'type' => 'string', 'label' => 'Foto do Perfil',        'editable' => true],
        ['name' => 'periculosidade',        'type' => 'enum',   'label' => 'Periculosidade',        'editable' => true],
        ['name' => 'observacoes',           'type' => 'text',   'label' => 'Observações',           'editable' => true],
        ['name' => 'observacoesReservadas', 'type' => 'text',   'label' => 'Observações Reservadas','editable' => true],
        ['name' => 'createdAt',             'type' => 'datetime', 'label' => 'Criado em',           'editable' => false],
        ['name' => 'updatedAt',             'type' => 'datetime', 'label' => 'Atualizado em',         'editable' => false],
    ],
];

// -----------------------------------------------------------------------------
// tableConfigDocumentos: usado para inclusão/edição/exclusão dos documentos de um registro
// -----------------------------------------------------------------------------
$tableConfigDocumentos = [
    'tableName'  => 'fotocrimDocumentos',
    'primaryKey' => 'id',
    'foreignKey' => 'idFotocrim',       // Chave estrangeira que liga ao registro principal de fotocrim
    'fields'     => [
        ['name' => 'id',         'type' => 'bigint', 'label' => 'ID',         'editable' => false],
        ['name' => 'idFotocrim', 'type' => 'bigint', 'label' => 'ID Fotocrim','editable' => true], // Referência ao fotocrim principal
        ['name' => 'tipo',       'type' => 'string', 'label' => 'Tipo',       'editable' => true],
        ['name' => 'valor',      'type' => 'string', 'label' => 'Valor',      'editable' => true],
        ['name' => 'observacao', 'type' => 'string', 'label' => 'Observação', 'editable' => true],
    ],
];


// -----------------------------------------------------------------------------
// tableConfigEnderecos: usado para tabela filha de endereços (exemplo)
// -----------------------------------------------------------------------------
$tableConfigEnderecos = [
    'tableName'  => 'fotocrimEnderecos',
    'primaryKey' => 'idEndereco',
    'foreignKey' => 'idFotocrim',       // chave que liga ao registro principal
    'fields'     => [
        [ 'name' => 'idEndereco',    'type' => 'bigint', 'label' => 'ID Endereço',  'editable' => false ],
        [ 'name' => 'idFotocrim',    'type' => 'bigint', 'label' => 'ID Fotocrim',  'editable' => true  ], // Referência ao fotocrim principal
        [ 'name' => 'idEnderecoRua', 'type' => 'bigint', 'label' => 'ID Endereco Rua', 'editable' => true ], // To link to enderecoRuas table
        [ 'name' => 'logradouro',    'type' => 'string', 'label' => 'Logradouro',   'editable' => true  ],
        [ 'name' => 'numero',        'type' => 'string', 'label' => 'Número',       'editable' => true  ],
        [ 'name' => 'complemento',   'type' => 'string', 'label' => 'Complemento',  'editable' => true  ],
        [ 'name' => 'bairro',        'type' => 'string', 'label' => 'Bairro',       'editable' => true  ],
        [ 'name' => 'cidade',        'type' => 'string', 'label' => 'Cidade',       'editable' => true  ],
        [ 'name' => 'uf',            'type' => 'string', 'label' => 'UF',           'editable' => true  ],
        [ 'name' => 'observacao',    'type' => 'text',   'label' => 'Observação',   'editable' => true  ],
    ],
];


// Só executa o roteamento e saída JSON se o script for chamado diretamente
if (basename(__FILE__) === basename($_SERVER['PHP_SELF'])) {
    header('Content-Type: application/json; charset=utf-8');

    $tipo = $_GET['tipo'] ?? $_POST['tipo'] ?? 'viewConfig';
    $tipo = (string) $tipo;

    $configMap = [
        'viewConfig'           => $viewConfig,
        'tableConfig'          => $tableConfig,
        'tableConfigDocumentos'=> $tableConfigDocumentos,
        'tableConfigEnderecos' => $tableConfigEnderecos,
    ];

    if (!array_key_exists($tipo, $configMap)) {
        echo json_encode([
            'success' => false,
            'message' => 'Tipo de configuração não localizado -> ' . $tipo . '.',
            'data'    => null,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => '',
        'data'    => $configMap[$tipo],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

