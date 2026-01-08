-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Tempo de geração: 07/01/2026 às 19:50
-- Versão do servidor: 5.7.23-23
-- Versão do PHP: 8.1.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `drscco66_argus`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `agentes`
--

CREATE TABLE `agentes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idPlanoChamada` bigint(20) UNSIGNED NOT NULL,
  `chefeAgencia` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('Ativo','Inativo') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Ativo',
  `usuarioAbastecimento` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `previsaoInatividade` date DEFAULT NULL,
  `nomeUsuario` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fotoUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastAccessAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `artigosCriminais`
--

CREATE TABLE `artigosCriminais` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `leiNumero` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `leiNome` varchar(150) COLLATE utf8_unicode_ci NOT NULL,
  `leiArtigo` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `leiDescricao` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `comparsaGrupo`
--

CREATE TABLE `comparsaGrupo` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idResenha` bigint(20) UNSIGNED DEFAULT NULL,
  `descricao` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `comparsaGrupoMembros`
--

CREATE TABLE `comparsaGrupoMembros` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idGrupo` bigint(20) UNSIGNED NOT NULL,
  `idFotocrim` bigint(20) UNSIGNED NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `enderecoBairros`
--

CREATE TABLE `enderecoBairros` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nomeBairro` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `enderecoCidades`
--

CREATE TABLE `enderecoCidades` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nomeCidade` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uf` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `enderecoRuas`
--

CREATE TABLE `enderecoRuas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idCidade` bigint(20) UNSIGNED NOT NULL,
  `idBairro` bigint(20) UNSIGNED NOT NULL,
  `logradouro` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `faccao`
--

CREATE TABLE `faccao` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nomeCurto` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nomeCompleto` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `fotocrim`
--

CREATE TABLE `fotocrim` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nomeCompleto` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataNascimento` date DEFAULT NULL,
  `sexo` enum('M','F') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nomeMae` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nomePai` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `naturalidadeEstado` enum('Acre','Alagoas','Amapá','Amazonas','Bahia','Ceará','Distrito Federal','Espírito Santo','Goiás','Maranhão','Mato Grosso','Mato Grosso do Sul','Minas Gerais','Pará','Paraíba','Paraná','Pernambuco','Piauí','Rio de Janeiro','Rio Grande do Norte','Rio Grande do Sul','Rondônia','Roraima','Santa Catarina','São Paulo','Sergipe','Tocantins') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idFaccao` bigint(20) UNSIGNED DEFAULT NULL,
  `faccaoFuncao` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fotoPerfil` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `periculosidade` enum('Média','Alta') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Média',
  `observacoes` text COLLATE utf8mb4_unicode_ci,
  `observacoesReservadas` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `fotocrimAlertas`
--

CREATE TABLE `fotocrimAlertas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idFotocrim` bigint(20) UNSIGNED NOT NULL,
  `tipoAlerta` enum('permanente','temporario') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'permanente',
  `mensagem` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataExpira` date DEFAULT NULL,
  `isAtivo` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `fotocrimAntecedentes`
--

CREATE TABLE `fotocrimAntecedentes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idFotocrim` bigint(20) UNSIGNED NOT NULL,
  `idArtigoCriminal` bigint(20) UNSIGNED NOT NULL,
  `fonteAntecedente` enum('Oficial','BOPM','Não confirmada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Oficial',
  `observacao` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `fotocrimArquivos`
--

CREATE TABLE `fotocrimArquivos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idFotocrim` bigint(20) UNSIGNED NOT NULL,
  `arquivoUrl` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipoArquivo` enum('IMG','PDF','DOC','VIDEO','AUDIO','OUTRO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OUTRO',
  `detalhes` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tamanhoBytes` bigint(20) UNSIGNED DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `fotocrimDocumentos`
--

CREATE TABLE `fotocrimDocumentos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idFotocrim` bigint(20) UNSIGNED NOT NULL,
  `tipo` enum('cpf','rgSp','rgCriminal','rgOutroEstado','outro','matricula') COLLATE utf8_unicode_ci NOT NULL,
  `valor` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `uf` char(2) COLLATE utf8_unicode_ci DEFAULT NULL,
  `observacao` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `fotocrimEnderecos`
--

CREATE TABLE `fotocrimEnderecos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idFotocrim` bigint(20) UNSIGNED NOT NULL,
  `idEnderecoRua` bigint(20) UNSIGNED NOT NULL,
  `numero` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complemento` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacao` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `fotocrimEnderecosFontes`
--

CREATE TABLE `fotocrimEnderecosFontes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idFotocrimEndereco` bigint(20) UNSIGNED NOT NULL,
  `fonte` enum('BOPM','BOPC','CNH','Mandado de prisão','Receita Federal','Registro civil','Registro criminal','Registro de veículo','SUS','Outra') COLLATE utf8_unicode_ci NOT NULL,
  `descricao` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `data` date DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `fotocrimFotos`
--

CREATE TABLE `fotocrimFotos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idFotocrim` bigint(20) UNSIGNED NOT NULL,
  `fotoUrl` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isPerfil` tinyint(1) NOT NULL DEFAULT '0',
  `ordemExibicao` tinyint(3) UNSIGNED NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `fotocrimTatuagens`
--

CREATE TABLE `fotocrimTatuagens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idFotocrim` bigint(20) UNSIGNED NOT NULL,
  `localCorpo` enum('Membros superiores','Membros inferiores','Tronco frente','Tronco costas','Cabeça','Rosto','Outros') COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `fotocrimVulgos`
--

CREATE TABLE `fotocrimVulgos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idFotocrim` bigint(20) UNSIGNED NOT NULL,
  `vulgo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `planoChamada`
--

CREATE TABLE `planoChamada` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idPostoGraduacao` int(10) UNSIGNED DEFAULT NULL,
  `re` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nomeCompleto` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `postoGraduacao`
--

CREATE TABLE `postoGraduacao` (
  `id` int(10) UNSIGNED NOT NULL,
  `descricao` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `classificacao` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura stand-in para view `viewFotocrim`
-- (Veja abaixo para a visão atual)
--
CREATE TABLE `viewFotocrim` (
`id` bigint(20) unsigned
,`nomeCompleto` varchar(150)
,`dataNascimento` date
,`sexo` enum('M','F')
,`nomeMae` varchar(150)
,`nomePai` varchar(150)
,`naturalidadeEstado` enum('Acre','Alagoas','Amapá','Amazonas','Bahia','Ceará','Distrito Federal','Espírito Santo','Goiás','Maranhão','Mato Grosso','Mato Grosso do Sul','Minas Gerais','Pará','Paraíba','Paraná','Pernambuco','Piauí','Rio de Janeiro','Rio Grande do Norte','Rio Grande do Sul','Rondônia','Roraima','Santa Catarina','São Paulo','Sergipe','Tocantins')
,`idFaccao` bigint(20) unsigned
,`faccaoFuncao` varchar(255)
,`periculosidade` enum('Média','Alta')
,`observacoes` text
,`observacoesReservadas` text
,`createdAt` datetime
,`updatedAt` datetime
,`fotoPerfil` varchar(255)
,`documentosResumo` text
,`faccaoResumo` varchar(461)
,`enderecosResumo` text
,`enderecosQuantidade` bigint(21)
,`vulgosResumo` text
,`tatuagensResumo` text
,`tatuagensQuantidade` bigint(21)
,`antecedentesResumo` text
,`antecedentesQuantidade` bigint(21)
,`alertasQuantidade` bigint(21)
,`arquivosQuantidade` bigint(21)
,`fotosQuantidade` bigint(21)
,`comparsasJson` json
);

-- --------------------------------------------------------

--
-- Estrutura para view `viewFotocrim`
--
DROP TABLE IF EXISTS `viewFotocrim`;

CREATE ALGORITHM=UNDEFINED DEFINER=`drscco66`@`localhost` SQL SECURITY DEFINER VIEW `viewFotocrim`  AS SELECT `f`.`id` AS `id`, `f`.`nomeCompleto` AS `nomeCompleto`, `f`.`dataNascimento` AS `dataNascimento`, `f`.`sexo` AS `sexo`, `f`.`nomeMae` AS `nomeMae`, `f`.`nomePai` AS `nomePai`, `f`.`naturalidadeEstado` AS `naturalidadeEstado`, `f`.`idFaccao` AS `idFaccao`, `f`.`faccaoFuncao` AS `faccaoFuncao`, `f`.`periculosidade` AS `periculosidade`, `f`.`observacoes` AS `observacoes`, `f`.`observacoesReservadas` AS `observacoesReservadas`, `f`.`createdAt` AS `createdAt`, `f`.`updatedAt` AS `updatedAt`, `f`.`fotoPerfil` AS `fotoPerfil`, `docs`.`documentosResumo` AS `documentosResumo`, concat(`fac`.`nomeCurto`,(case when ((`fac`.`nomeCompleto` is not null) and (`fac`.`nomeCompleto` <> '') and (`fac`.`nomeCompleto` <> `fac`.`nomeCurto`)) then concat(' - ',`fac`.`nomeCompleto`) else '' end),(case when ((`f`.`faccaoFuncao` is not null) and (`f`.`faccaoFuncao` <> '')) then concat(' (',`f`.`faccaoFuncao`,')') else '' end)) AS `faccaoResumo`, `ender`.`enderecosResumo` AS `enderecosResumo`, coalesce(`ender`.`enderecosQuantidade`,0) AS `enderecosQuantidade`, `vul`.`vulgosResumo` AS `vulgosResumo`, `tat`.`tatuagensResumo` AS `tatuagensResumo`, coalesce(`tat`.`tatuagensQuantidade`,0) AS `tatuagensQuantidade`, `ant`.`antecedentesResumo` AS `antecedentesResumo`, coalesce(`ant`.`antecedentesQuantidade`,0) AS `antecedentesQuantidade`, coalesce(`al`.`alertasQuantidade`,0) AS `alertasQuantidade`, coalesce(`arq`.`arquivosQuantidade`,0) AS `arquivosQuantidade`, coalesce(`ft`.`fotosQuantidade`,0) AS `fotosQuantidade`, `comp`.`comparsasJson` AS `comparsasJson` FROM ((((((((((`fotocrim` `f` left join (select `d`.`idFotocrim` AS `idFotocrim`,group_concat(distinct concat(`d`.`tipo`,': ',`d`.`valor`,(case when ((`d`.`uf` is not null) and (`d`.`uf` <> '')) then concat('/',`d`.`uf`) else '' end)) order by `d`.`tipo` ASC separator '\n') AS `documentosResumo` from `fotocrimDocumentos` `d` group by `d`.`idFotocrim`) `docs` on((`docs`.`idFotocrim` = `f`.`id`))) left join `faccao` `fac` on((`fac`.`id` = `f`.`idFaccao`))) left join (select `fe`.`idFotocrim` AS `idFotocrim`,count(0) AS `enderecosQuantidade`,group_concat(distinct concat_ws(', ',`er`.`logradouro`,nullif(`fe`.`numero`,''),nullif(`fe`.`complemento`,''),`eb`.`nomeBairro`,concat(`ec`.`nomeCidade`,'/',`ec`.`uf`)) order by `fe`.`createdAt` DESC separator '\n') AS `enderecosResumo` from (((`fotocrimEnderecos` `fe` join `enderecoRuas` `er` on((`er`.`id` = `fe`.`idEnderecoRua`))) join `enderecoBairros` `eb` on((`eb`.`id` = `er`.`idBairro`))) join `enderecoCidades` `ec` on((`ec`.`id` = `er`.`idCidade`))) group by `fe`.`idFotocrim`) `ender` on((`ender`.`idFotocrim` = `f`.`id`))) left join (select `fotocrimVulgos`.`idFotocrim` AS `idFotocrim`,group_concat(distinct `fotocrimVulgos`.`vulgo` order by `fotocrimVulgos`.`vulgo` ASC separator '; ') AS `vulgosResumo` from `fotocrimVulgos` group by `fotocrimVulgos`.`idFotocrim`) `vul` on((`vul`.`idFotocrim` = `f`.`id`))) left join (select `t`.`idFotocrim` AS `idFotocrim`,count(0) AS `tatuagensQuantidade`,group_concat(concat(`t`.`localCorpo`,' (',`t`.`descricoes`,')') separator '\n') AS `tatuagensResumo` from (select `fotocrimTatuagens`.`idFotocrim` AS `idFotocrim`,`fotocrimTatuagens`.`localCorpo` AS `localCorpo`,group_concat(distinct `fotocrimTatuagens`.`descricao` order by `fotocrimTatuagens`.`descricao` ASC separator '; ') AS `descricoes` from `fotocrimTatuagens` group by `fotocrimTatuagens`.`idFotocrim`,`fotocrimTatuagens`.`localCorpo`) `t` group by `t`.`idFotocrim`) `tat` on((`tat`.`idFotocrim` = `f`.`id`))) left join (select `fa`.`idFotocrim` AS `idFotocrim`,count(0) AS `antecedentesQuantidade`,group_concat(concat('Artigo ',convert(`ac`.`leiArtigo` using utf8mb4),' da lei ',convert(`ac`.`leiNumero` using utf8mb4),convert(if((`ac`.`leiNome` <> ''),concat(' - ',`ac`.`leiNome`),'') using utf8mb4),convert(if((`ac`.`leiDescricao` <> ''),concat(' (',`ac`.`leiDescricao`,')'),'') using utf8mb4),' - fonte: ',`fa`.`fonteAntecedente`) separator '\n') AS `antecedentesResumo` from (`fotocrimAntecedentes` `fa` join `artigosCriminais` `ac` on((`ac`.`id` = `fa`.`idArtigoCriminal`))) group by `fa`.`idFotocrim`) `ant` on((`ant`.`idFotocrim` = `f`.`id`))) left join (select `fotocrimAlertas`.`idFotocrim` AS `idFotocrim`,count(0) AS `alertasQuantidade` from `fotocrimAlertas` where ((`fotocrimAlertas`.`isAtivo` = 1) and (isnull(`fotocrimAlertas`.`dataExpira`) or (`fotocrimAlertas`.`dataExpira` >= curdate()))) group by `fotocrimAlertas`.`idFotocrim`) `al` on((`al`.`idFotocrim` = `f`.`id`))) left join (select `fotocrimArquivos`.`idFotocrim` AS `idFotocrim`,count(0) AS `arquivosQuantidade` from `fotocrimArquivos` group by `fotocrimArquivos`.`idFotocrim`) `arq` on((`arq`.`idFotocrim` = `f`.`id`))) left join (select `fotocrimFotos`.`idFotocrim` AS `idFotocrim`,count(0) AS `fotosQuantidade` from `fotocrimFotos` group by `fotocrimFotos`.`idFotocrim`) `ft` on((`ft`.`idFotocrim` = `f`.`id`))) left join (select `cgm1`.`idFotocrim` AS `idFotocrimPrincipal`,json_arrayagg(json_object('id',`fc2`.`id`,'nome',`fc2`.`nomeCompleto`,'dataNascimento',`fc2`.`dataNascimento`,'fotoPerfil',`fc2`.`fotoPerfil`,'documentosResumo',`docs2`.`documentosResumo`)) AS `comparsasJson` from (((`comparsaGrupoMembros` `cgm1` join `comparsaGrupoMembros` `cgm2` on(((`cgm2`.`idGrupo` = `cgm1`.`idGrupo`) and (`cgm2`.`idFotocrim` <> `cgm1`.`idFotocrim`)))) join `fotocrim` `fc2` on((`fc2`.`id` = `cgm2`.`idFotocrim`))) left join (select `d`.`idFotocrim` AS `idFotocrim`,group_concat(concat(`d`.`tipo`,': ',`d`.`valor`) separator '\n') AS `documentosResumo` from `fotocrimDocumentos` `d` group by `d`.`idFotocrim`) `docs2` on((`docs2`.`idFotocrim` = `fc2`.`id`))) group by `cgm1`.`idFotocrim`) `comp` on((`comp`.`idFotocrimPrincipal` = `f`.`id`))) ;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `agentes`
--
ALTER TABLE `agentes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_agentes_nomeUsuario` (`nomeUsuario`),
  ADD KEY `idx_agentes_status` (`status`),
  ADD KEY `idx_agentes_plano` (`idPlanoChamada`);

--
-- Índices de tabela `artigosCriminais`
--
ALTER TABLE `artigosCriminais`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `comparsaGrupo`
--
ALTER TABLE `comparsaGrupo`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `comparsaGrupoMembros`
--
ALTER TABLE `comparsaGrupoMembros`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_comparsaGrupoMembros_idFotocrim` (`idFotocrim`),
  ADD KEY `idx_comparsaGrupoMembros_idGrupo` (`idGrupo`);

--
-- Índices de tabela `enderecoBairros`
--
ALTER TABLE `enderecoBairros`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_enderecoBairros_nome` (`nomeBairro`);

--
-- Índices de tabela `enderecoCidades`
--
ALTER TABLE `enderecoCidades`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_enderecoCidades_nome_uf` (`nomeCidade`,`uf`),
  ADD KEY `idx_enderecoCidades_uf` (`uf`);

--
-- Índices de tabela `enderecoRuas`
--
ALTER TABLE `enderecoRuas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_enderecoRuas_combo` (`idCidade`,`idBairro`,`logradouro`),
  ADD KEY `idx_enderecoRuas_cidade` (`idCidade`),
  ADD KEY `idx_enderecoRuas_bairro` (`idBairro`);

--
-- Índices de tabela `faccao`
--
ALTER TABLE `faccao`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `fotocrim`
--
ALTER TABLE `fotocrim`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_fotocrim_faccao` (`idFaccao`),
  ADD KEY `idx_fotocrim_nome` (`nomeCompleto`);

--
-- Índices de tabela `fotocrimAlertas`
--
ALTER TABLE `fotocrimAlertas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_fotocrimAlertas_idFotocrim` (`idFotocrim`),
  ADD KEY `idx_fotocrimAlertas_ativo` (`idFotocrim`,`isAtivo`);

--
-- Índices de tabela `fotocrimAntecedentes`
--
ALTER TABLE `fotocrimAntecedentes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_antecedentes_fotocrim` (`idFotocrim`),
  ADD KEY `fk_antecedentes_artigo` (`idArtigoCriminal`);

--
-- Índices de tabela `fotocrimArquivos`
--
ALTER TABLE `fotocrimArquivos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_fotocrimArquivos_idFotocrim` (`idFotocrim`),
  ADD KEY `idx_fotocrimArquivos_tipo` (`tipoArquivo`);

--
-- Índices de tabela `fotocrimDocumentos`
--
ALTER TABLE `fotocrimDocumentos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uqFotocrimTipoValor` (`idFotocrim`,`tipo`,`valor`),
  ADD KEY `idxFotocrim` (`idFotocrim`),
  ADD KEY `idxTipoValor` (`tipo`,`valor`);

--
-- Índices de tabela `fotocrimEnderecos`
--
ALTER TABLE `fotocrimEnderecos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_fotocrimEnderecos_fotocrim` (`idFotocrim`),
  ADD KEY `idx_fotocrimEnderecos_enderecoRua` (`idEnderecoRua`);

--
-- Índices de tabela `fotocrimEnderecosFontes`
--
ALTER TABLE `fotocrimEnderecosFontes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_fonte_endereco` (`idFotocrimEndereco`);

--
-- Índices de tabela `fotocrimFotos`
--
ALTER TABLE `fotocrimFotos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_fotocrimFotos_idFotocrim` (`idFotocrim`),
  ADD KEY `idx_fotocrimFotos_isPerfil` (`idFotocrim`,`isPerfil`);

--
-- Índices de tabela `fotocrimTatuagens`
--
ALTER TABLE `fotocrimTatuagens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_fotocrimTatuagens_idFotocrim` (`idFotocrim`),
  ADD KEY `idx_fotocrimTatuagens_local` (`localCorpo`);

--
-- Índices de tabela `fotocrimVulgos`
--
ALTER TABLE `fotocrimVulgos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_fotocrimVulgos_fotocrim_vulgo` (`idFotocrim`,`vulgo`),
  ADD KEY `idx_fotocrimVulgos_idFotocrim` (`idFotocrim`);

--
-- Índices de tabela `planoChamada`
--
ALTER TABLE `planoChamada`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_planoChamada_re` (`re`),
  ADD KEY `idx_planoChamada_postograduacao` (`idPostoGraduacao`);

--
-- Índices de tabela `postoGraduacao`
--
ALTER TABLE `postoGraduacao`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_postoGraduacao_descricao` (`descricao`),
  ADD KEY `idx_postoGraduacao_classificacao` (`classificacao`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `agentes`
--
ALTER TABLE `agentes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `artigosCriminais`
--
ALTER TABLE `artigosCriminais`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `comparsaGrupo`
--
ALTER TABLE `comparsaGrupo`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `comparsaGrupoMembros`
--
ALTER TABLE `comparsaGrupoMembros`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `enderecoBairros`
--
ALTER TABLE `enderecoBairros`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `enderecoCidades`
--
ALTER TABLE `enderecoCidades`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `enderecoRuas`
--
ALTER TABLE `enderecoRuas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `faccao`
--
ALTER TABLE `faccao`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `fotocrim`
--
ALTER TABLE `fotocrim`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `fotocrimAlertas`
--
ALTER TABLE `fotocrimAlertas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `fotocrimAntecedentes`
--
ALTER TABLE `fotocrimAntecedentes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `fotocrimArquivos`
--
ALTER TABLE `fotocrimArquivos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `fotocrimDocumentos`
--
ALTER TABLE `fotocrimDocumentos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `fotocrimEnderecos`
--
ALTER TABLE `fotocrimEnderecos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `fotocrimEnderecosFontes`
--
ALTER TABLE `fotocrimEnderecosFontes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `fotocrimFotos`
--
ALTER TABLE `fotocrimFotos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `fotocrimTatuagens`
--
ALTER TABLE `fotocrimTatuagens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `fotocrimVulgos`
--
ALTER TABLE `fotocrimVulgos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `planoChamada`
--
ALTER TABLE `planoChamada`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `postoGraduacao`
--
ALTER TABLE `postoGraduacao`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `agentes`
--
ALTER TABLE `agentes`
  ADD CONSTRAINT `fk_agentes_planoChamada` FOREIGN KEY (`idPlanoChamada`) REFERENCES `planoChamada` (`id`) ON UPDATE CASCADE;

--
-- Restrições para tabelas `comparsaGrupoMembros`
--
ALTER TABLE `comparsaGrupoMembros`
  ADD CONSTRAINT `fk_comparsaGrupoMembros_fotocrim` FOREIGN KEY (`idFotocrim`) REFERENCES `fotocrim` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_comparsaGrupoMembros_grupo` FOREIGN KEY (`idGrupo`) REFERENCES `comparsaGrupo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `enderecoRuas`
--
ALTER TABLE `enderecoRuas`
  ADD CONSTRAINT `fk_enderecoRuas_bairro` FOREIGN KEY (`idBairro`) REFERENCES `enderecoBairros` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_enderecoRuas_cidade` FOREIGN KEY (`idCidade`) REFERENCES `enderecoCidades` (`id`) ON UPDATE CASCADE;

--
-- Restrições para tabelas `fotocrim`
--
ALTER TABLE `fotocrim`
  ADD CONSTRAINT `fk_fotocrim_faccao` FOREIGN KEY (`idFaccao`) REFERENCES `faccao` (`id`);

--
-- Restrições para tabelas `fotocrimAlertas`
--
ALTER TABLE `fotocrimAlertas`
  ADD CONSTRAINT `fk_fotocrimAlertas_fotocrim` FOREIGN KEY (`idFotocrim`) REFERENCES `fotocrim` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `fotocrimAntecedentes`
--
ALTER TABLE `fotocrimAntecedentes`
  ADD CONSTRAINT `fk_antecedentes_artigo` FOREIGN KEY (`idArtigoCriminal`) REFERENCES `artigosCriminais` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_antecedentes_fotocrim` FOREIGN KEY (`idFotocrim`) REFERENCES `fotocrim` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `fotocrimArquivos`
--
ALTER TABLE `fotocrimArquivos`
  ADD CONSTRAINT `fk_fotocrimArquivos_fotocrim` FOREIGN KEY (`idFotocrim`) REFERENCES `fotocrim` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `fotocrimDocumentos`
--
ALTER TABLE `fotocrimDocumentos`
  ADD CONSTRAINT `fkFotocrimDocumentosFotocrim` FOREIGN KEY (`idFotocrim`) REFERENCES `fotocrim` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `fotocrimEnderecos`
--
ALTER TABLE `fotocrimEnderecos`
  ADD CONSTRAINT `fk_fotocrimEnderecos_enderecoRua` FOREIGN KEY (`idEnderecoRua`) REFERENCES `enderecoRuas` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_fotocrimEnderecos_fotocrim` FOREIGN KEY (`idFotocrim`) REFERENCES `fotocrim` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `fotocrimEnderecosFontes`
--
ALTER TABLE `fotocrimEnderecosFontes`
  ADD CONSTRAINT `fk_fonte_endereco` FOREIGN KEY (`idFotocrimEndereco`) REFERENCES `fotocrimEnderecos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `fotocrimFotos`
--
ALTER TABLE `fotocrimFotos`
  ADD CONSTRAINT `fk_fotocrimFotos_fotocrim` FOREIGN KEY (`idFotocrim`) REFERENCES `fotocrim` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `fotocrimTatuagens`
--
ALTER TABLE `fotocrimTatuagens`
  ADD CONSTRAINT `fk_fotocrimTatuagens_fotocrim` FOREIGN KEY (`idFotocrim`) REFERENCES `fotocrim` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `fotocrimVulgos`
--
ALTER TABLE `fotocrimVulgos`
  ADD CONSTRAINT `fk_fotocrimVulgos_fotocrim` FOREIGN KEY (`idFotocrim`) REFERENCES `fotocrim` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `planoChamada`
--
ALTER TABLE `planoChamada`
  ADD CONSTRAINT `fk_planoChamada_postoGraduacao` FOREIGN KEY (`idPostoGraduacao`) REFERENCES `postoGraduacao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
