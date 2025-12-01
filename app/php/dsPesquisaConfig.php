<?php
declare(strict_types=1);

/**
 * Mapa de views usadas pelo dsPesquisa para os endpoints de configuração.
 *
 * A chave é SEMPRE o viewName que o front manda no POST.
 * O valor é um array com os dados necessários para buscar a config.
 */
return [
    'viewFotocrim' => 'php/fotocrimConfig.php?tipo=viewConfig',
    'tableFotocrim' => 'php/fotocrimConfig.php?tipo=tableConfig',
    'tableFotocrimEnderecos' => 'php/fotocrimConfig.php?tipo=tableConfigEnderecos'
];
