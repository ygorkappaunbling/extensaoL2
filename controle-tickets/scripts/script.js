const NIVEL_RESPONSAVEL = {
	'L1': 'L1',
	'L2': 'L2'
}

//valor padrão das configurações de planilha, indica que ainda não foram preenchidas
const CONFIG_PENDENTE = 'Link da planilha aqui';

//chave em que a configuração das planilhas é gravada. fica fora do conjunto de
//chaves do formulário de propósito: assim o "Limpar" e o cadastro de um ticket,
//que só apagam as chaves dos campos, nunca alcançam a configuração
const CHAVE_CONFIG = 'configuracao';

//a configuração é gravada nas duas áreas: a sync acompanha a conta do Google e
//volta sozinha ao reinstalar a extensão ou trocar de máquina; a local fica no
//computador e cobre o caso de o sync estar desligado ou ter estourado a cota
const AREAS_CONFIG = ['sync', 'local'];

//chaves usadas para descobrir a coluna correspondente na planilha
const CAMPO_NRO_TICKET = 'nroTicket';
const CAMPO_RETORNO_L3 = 'retorno_l3';

//data/hora e e-mail ocupam A e B, então a primeira chave dos dados cai em C
const COLUNAS_AUTOMATICAS = 2;

$(function() {
	var controleTickets = new ControleTickets(NIVEL_RESPONSAVEL.L1);
});

var ControleTickets = function(nivelResponsavel) {
	//valores iniciais: são o ponto de partida de quem nunca abriu as
	//configurações. o normal é informar as planilhas pela engrenagem no topo da
	//extensão, e o que for gravado por lá substitui o que está aqui

	//obrigatórios: sem eles não é possível cadastrar
	this.SHEET_ID = 'Link da planilha aqui'; //ID da planilha própria
	this.SHEET_NAME = 'Tickets'; //nome da aba na planilha própria

	//opcionais: usados somente pela Base de Conhecimento
	this.SHEET_KNOWLEDGE_ID = 'Link da planilha aqui'; //ID da planilha compartilhada
	this.SHEET_KNOWLEDGE_NAME = 'Fiscal'; //nome da aba na planilha compartilhada

	//só são exigidos os que estiverem visíveis
	this.requiredInputs = ['nro_ticket', 'grupo', 'subgrupo', 'modulo', 'funcionalidade', 'classificacao', 'causa', 'conclusao', 'data_abertura'];

	//no retorno do L3 só o ticket, que localiza a linha, e o próprio retorno
	this.requiredInputsRetornoL3 = ['nro_ticket', 'retorno_l3'];

	//campos de ativar/desativar e o estado padrão de cada um
	this.checkboxDefaults = {
		'classificacao_certa': true,
		'tipo_correto': true,
		'testes': true,
		'finfo': true,
		'base_conhecimento': false,
		'sem_base': false,
		'modo_retorno_l3': false
	};

	//preferência de quem usa, não dado do ticket: uma vez ligada, continua ligada.
	//nenhum caminho do código desmarca esses campos — nem o "Limpar", nem o
	//cadastro de um ticket, nem a falta de configuração da planilha. só quem usa
	//desliga, clicando no botão
	this.preferencias = ['base_conhecimento'];

	this.nivelResponsavel = nivelResponsavel

	//a configuração precisa estar carregada antes de qualquer coisa consultar as
	//planilhas, por isso ela entra junto com os arquivos de categorização
	$.when(this.loadFiles(), this.carregaConfiguracao()).done(function() {
		this.initSelects();
		this.setStoredFields();
		this.getTicketData();
		this.registerEvents();
		this.render();
		this.atualizaContador();
		this.aplicaEstadoConfiguracao();
	}.bind(this));

	chrome.identity.getAuthToken({'interactive': true});
}

ControleTickets.prototype = {
	//uma configuração só vale como preenchida se não está vazia nem com o valor padrão
	'isConfigurada': function(valor) {
		valor = $.trim(valor || '');

		return valor !== '' && valor != CONFIG_PENDENTE;
	},

	'hasPlanilhaPropria': function() {
		return this.isConfigurada(this.SHEET_ID) && this.isConfigurada(this.SHEET_NAME);
	},

	'hasPlanilhaBase': function() {
		return this.isConfigurada(this.SHEET_KNOWLEDGE_ID) && this.isConfigurada(this.SHEET_KNOWLEDGE_NAME);
	},

	'isModoRetornoL3': function() {
		return $('#modo_retorno_l3').is(':checked');
	},

	//o que a API usa é o ID, mas cada pessoa cola o que tem à mão: o link da barra
	//de endereço, um link de compartilhamento do Drive, um link antigo, ou só o
	//ID. devolve {'id': ...} quando reconhece, ou {'erro': ...} com o que dizer a
	//quem está preenchendo — nunca grava um palpite que só falharia no cadastro
	'interpretaPlanilha': function(valor) {
		valor = $.trim(valor || '');

		if (!valor) {
			return {'id': ''};
		}

		//links copiados de e-mail ou chat às vezes vêm quebrados em várias linhas.
		//a versão sem espaços serve para procurar o link; o valor original continua
		//valendo para reconhecer o ID solto e para as mensagens de erro
		var compacto = valor.replace(/\s+/g, '');

		//o link de "Publicar na web" carrega um token que não é o ID da planilha e
		//não funciona na API. sem esta checagem o padrão seguinte casaria com o
		//trecho "/d/e/" e devolveria a letra "e" como ID
		if (/\/spreadsheets\/d\/e\//.test(compacto)) {
			return {'erro': 'Esse é o link de "Publicar na web", que não dá acesso à planilha. Abra a planilha e copie o link da barra de endereço.'};
		}

		var outroProduto = compacto.match(/docs\.google\.com\/(document|presentation|forms)\//);

		if (outroProduto) {
			return {'erro': 'Esse link é de ' + {'document': 'um Documento', 'presentation': 'uma Apresentação', 'forms': 'um Formulário'}[outroProduto[1]] + ', não de uma planilha.'};
		}

		//procura o ID em qualquer ponto do texto: quem copia da barra de endereço
		//às vezes traz o título da página junto
		var padroes = [
			/\/spreadsheets(?:\/u\/\d+)?\/d\/([a-zA-Z0-9-_]+)/, //link atual, com ou sem /u/0 de multiconta
			/\/d\/([a-zA-Z0-9-_]+)/,                            //link de compartilhamento do Drive
			/[?&](?:key|id)=([a-zA-Z0-9-_]+)/                   //formatos antigos e ?id= do Drive
		];

		var id = '';

		for (var i = 0; i < padroes.length && !id; i++) {
			var achou = compacto.match(padroes[i]);

			id = achou ? achou[1] : '';
		}

		//não casou com nenhum link, então só pode ser o ID colado sozinho. aqui a
		//comparação é com o valor original: uma frase com espaços não é um ID, e
		//seria aceita se olhasse a versão compactada
		if (!id && /^[a-zA-Z0-9-_]+$/.test(valor)) {
			id = valor;
		}

		if (!id) {
			return {'erro': 'Não reconheci esse link. Abra a planilha, copie o link da barra de endereço e cole aqui.'};
		}

		//o tamanho mínimo separa um ID de verdade de um texto colado no campo
		//errado, como o nome da aba, que seria aceito e só falharia no cadastro
		if (id.length < 20) {
			return {'erro': '"' + id + '" é curto demais para ser o ID de uma planilha. Cole o link da planilha ou o ID completo.'};
		}

		return {'id': id};
	},

	//nome da aba em notação A1. as aspas simples são o que permite aba com espaço
	//ou acento, e uma aspa dentro do nome é escrita dobrada
	'referenciaAba': function(nome, intervalo) {
		return encodeURIComponent("'" + String(nome).replace(/'/g, "''") + "'!" + intervalo);
	},

	//lê a configuração das duas áreas e, se uma delas estiver sem os dados, repõe
	//a partir da outra. é isso que faz a configuração se recuperar sozinha depois
	//de uma reinstalação ou de o sync ficar indisponível
	'carregaConfiguracao': function() {
		var deferredObj = $.Deferred();
		var that = this;

		chrome.storage.sync.get(CHAVE_CONFIG, function(doSync) {
			chrome.storage.local.get(CHAVE_CONFIG, function(doLocal) {
				var config = doSync[CHAVE_CONFIG] || doLocal[CHAVE_CONFIG];

				if (config) {
					that.aplicaConfiguracao(config);

					//repõe na área que estiver sem os dados
					$.each(AREAS_CONFIG, function(indice, area) {
						var lido = (area == 'sync' ? doSync : doLocal)[CHAVE_CONFIG];

						if (!lido) {
							chrome.storage[area].set(that.dadosConfiguracao(config));
						}
					});
				}

				deferredObj.resolve();
			});
		});

		return deferredObj.promise();
	},

	'dadosConfiguracao': function(config) {
		var dados = {};

		dados[CHAVE_CONFIG] = config;

		return dados;
	},

	'configuracaoAtual': function() {
		return {
			'sheetId': this.SHEET_ID,
			'sheetName': this.SHEET_NAME,
			'knowledgeId': this.SHEET_KNOWLEDGE_ID,
			'knowledgeName': this.SHEET_KNOWLEDGE_NAME
		};
	},

	//só sobrescreve o que veio preenchido: uma gravação incompleta nunca apaga o
	//que já estava valendo
	'aplicaConfiguracao': function(config) {
		config = config || {};

		if (this.isConfigurada(config.sheetId)) {
			this.SHEET_ID = config.sheetId;
		}

		if (this.isConfigurada(config.sheetName)) {
			this.SHEET_NAME = config.sheetName;
		}

		if (this.isConfigurada(config.knowledgeId)) {
			this.SHEET_KNOWLEDGE_ID = config.knowledgeId;
		}

		if (this.isConfigurada(config.knowledgeName)) {
			this.SHEET_KNOWLEDGE_NAME = config.knowledgeName;
		}
	},

	//substitui a configuração inteira: só é chamado com o que a tela de
	//configurações já validou
	'gravaConfiguracao': function(config) {
		var that = this;

		this.SHEET_ID = config.sheetId;
		this.SHEET_NAME = config.sheetName;
		this.SHEET_KNOWLEDGE_ID = config.knowledgeId;
		this.SHEET_KNOWLEDGE_NAME = config.knowledgeName;

		$.each(AREAS_CONFIG, function(indice, area) {
			chrome.storage[area].set(that.dadosConfiguracao(that.configuracaoAtual()));
		});
	},

	//enquanto a planilha de tickets não for informada, a engrenagem fica em
	//destaque para quem abrir a extensão saber por onde começar
	'aplicaEstadoConfiguracao': function() {
		$('#abrir_config').toggleClass('is-pendente', !this.hasPlanilhaPropria());
	},

	'abreConfiguracao': function(recado) {
		$('#config_planilha_link').val(this.hasPlanilhaPropria() ? this.SHEET_ID : '');
		$('#config_planilha_aba').val(this.hasPlanilhaPropria() ? this.SHEET_NAME : '');
		$('#config_base_link').val(this.hasPlanilhaBase() ? this.SHEET_KNOWLEDGE_ID : '');
		$('#config_base_aba').val(this.hasPlanilhaBase() ? this.SHEET_KNOWLEDGE_NAME : '');

		this.mostraRecadoConfiguracao(recado || '', recado ? 'is-erro' : '');

		$('#config').prop('hidden', false);
		$('#config_planilha_link').focus();
	},

	'fechaConfiguracao': function() {
		$('#config').prop('hidden', true);
	},

	'mostraRecadoConfiguracao': function(texto, classe) {
		$('#config_recado').text(texto).removeClass('is-erro is-ok').addClass(classe || '');
	},

	//a planilha de tickets é obrigatória e não pode ser esvaziada depois de
	//informada; a da Base de Conhecimento é opcional, mas se vier tem que vir
	//completa, senão o envio não teria destino
	'salvaConfiguracao': function() {
		var planilha = this.interpretaPlanilha($('#config_planilha_link').val());
		var planilhaAba = $.trim($('#config_planilha_aba').val());
		var base = this.interpretaPlanilha($('#config_base_link').val());
		var baseAba = $.trim($('#config_base_aba').val());

		//o link não foi reconhecido: a mensagem já diz o que fazer
		if (planilha.erro || base.erro) {
			this.mostraRecadoConfiguracao(planilha.erro || base.erro, 'is-erro');

			return;
		}

		var planilhaId = planilha.id;
		var baseId = base.id;

		if (!this.isConfigurada(planilhaId) || !this.isConfigurada(planilhaAba)) {
			this.mostraRecadoConfiguracao('Informe o link e o nome da aba da planilha de tickets.', 'is-erro');

			return;
		}

		if (this.isConfigurada(baseId) != this.isConfigurada(baseAba)) {
			this.mostraRecadoConfiguracao('Na Base de Conhecimento, preencha o link e o nome da aba, ou deixe os dois em branco.', 'is-erro');

			return;
		}

		this.gravaConfiguracao({
			'sheetId': planilhaId,
			'sheetName': planilhaAba,
			//deixar a Base de Conhecimento em branco é uma escolha válida de quem
			//usa, diferente da planilha de tickets, que não pode ser esvaziada
			'knowledgeId': baseId || CONFIG_PENDENTE,
			'knowledgeName': baseAba || CONFIG_PENDENTE
		});

		this.aplicaEstadoConfiguracao();
		this.mostraRecadoConfiguracao('Configuração salva.', 'is-ok');

		setTimeout(this.fechaConfiguracao.bind(this), 700);
	},

	//o retorno do L3 grava só a coluna do retorno na linha que já existe, então a
	//tela fica com o número do ticket, que localiza a linha, o campo do retorno e
	//o botão de voltar
	'aplicaModoRetornoL3': function() {
		var ativo = this.isModoRetornoL3();

		$('#controle_tickets').toggleClass('modo-retorno-l3', ativo);
		$('.campo-l2').toggle(!ativo);
		$('.campo-retorno-l3').toggle(ativo);

		$('#informar_retorno_l3').toggleClass('is-ativo', ativo);
		$('#informar_registro_l2').toggleClass('is-ativo', !ativo);

		$('#rotulo_nro_ticket').text(ativo ? 'Número do ticket' : 'Nº do ticket');
		$('#enviar_controle_tickets').text(ativo ? 'Registrar retorno' : 'Cadastrar ticket');

		//o subgrupo aparece ou não conforme o grupo escolhido, e essa regra tem
		//que voltar a valer ao sair do modo
		if (!ativo) {
			this.updateSubgroups();
		}

		this.atualizaTrilha();
		this.atualizaProgresso();
		this.atualizaContador();
	},

	'loadFiles': function() {
		var deferredObj = $.Deferred();

		$.when(this.getData('data/grupos.json'), this.getData('data/subgrupos.json'), this.getData('data/modulos.json'), this.getData('data/funcionalidades.json')).done(function(groups, subgroups, modules, functionalities) {
			this.groups = groups;
			this.subgroups = subgroups;
			this.modules = modules;
			this.functionalities = functionalities;

			deferredObj.resolve();
		}.bind(this));

		return deferredObj.promise();
	},

	'render': function() {
		$('#rotulo_nome_atendente').text('Atendente ' + this.nivelResponsavel);
	},

	//quantos dos campos obrigatórios do modo atual já estão preenchidos
	'atualizaProgresso': function() {
		var total = 0;
		var preenchidos = 0;

		$.each(this.isModoRetornoL3() ? this.requiredInputsRetornoL3 : this.requiredInputs, function() {
			var campo = $('#' + this);

			if (!campo.length || !campo.is(':visible')) {
				return true;
			}

			total++;

			if ($.trim(campo.val())) {
				preenchidos++;
			}
		});

		$('#progresso_texto').text(preenchidos + '/' + total + ' obrigatórios');
		$('#progresso_barra').css('width', (total ? Math.round(preenchidos / total * 100) : 0) + '%');
	},

	//caminho da categorização escolhida, exibido abaixo dos selects
	'atualizaTrilha': function() {
		var partes = [];

		$.each(['grupo', 'subgrupo', 'modulo', 'funcionalidade'], function() {
			var campo = $('#' + this);
			var texto = $.trim(campo.find('option:selected').text());

			if (texto && campo.is(':visible')) {
				partes.push(texto);
			}
		});

		$('#trilha').text(partes.join(' › '));
	},

	'atualizaContador': function() {
		$('#contador_retorno').text($('#retorno_l3').val().length + ' caracteres');
	},

	//uma dica só, reposicionada junto do ícone sob o mouse
	'registraDicas': function() {
		var dica = $('<div>', {'id': 'dica'}).hide().appendTo('body');

		$('#controle_tickets').on('mouseenter', '.info-campo', function() {
			var icone = this.getBoundingClientRect();

			dica.text($(this).data('info')).show();

			//mantém a dica dentro dos limites do popup
			var esquerda = Math.max(8, Math.min(icone.left - 8, $(window).width() - dica.outerWidth() - 8));
			var acima = icone.bottom + 8 + dica.outerHeight() > $(window).height();

			dica.css({
				'left': esquerda + 'px',
				'top': (acima ? icone.top - dica.outerHeight() - 8 : icone.bottom + 8) + 'px'
			});
		}).on('mouseleave', '.info-campo', function() {
			dica.hide();
		});
	},

	'registerEvents': function() {
		var that = this;

		$('#modo_retorno_l3').on('change', function() {
			that.aplicaModoRetornoL3();
		});

		//grava a preferência assim que ela muda, sem depender da gravação em lote
		//dos demais campos: ligou, fica ligada
		$('#base_conhecimento').on('change', function() {
			chrome.storage.sync.set({'base_conhecimento': $(this).is(':checked')});
		});

		$('#abrir_config').on('click', function() {
			that.abreConfiguracao();
		});

		$('#fechar_config, #cancelar_config').on('click', function() {
			that.fechaConfiguracao();
		});

		$('#salvar_config').on('click', function() {
			that.salvaConfiguracao();
		});

		//clicar fora do painel fecha, mas clicar dentro não
		$('#config').on('click', function(e) {
			if (e.target === this) {
				that.fechaConfiguracao();
			}
		});

		$('#config').on('keydown', 'input', function(e) {
			if (e.key == 'Enter') {
				that.salvaConfiguracao();
			}
		});

		$('#controle_tickets').on('click', '#enviar_controle_tickets', function() {
			//sem a planilha de tickets não há onde gravar: abre a configuração já
			//explicando o que falta, em vez de só avisar e deixar a pessoa sem saída
			if (!that.hasPlanilhaPropria()) {
				that.abreConfiguracao('Antes de cadastrar, informe a planilha em que os tickets serão gravados.');

				return;
			}

			that.displayWait('loading');

			that.validate().done(function(isValid) {
				if (isValid) {
					//a ordem das chaves define a coluna na planilha
					//A (data/hora) e B (e-mail) são preenchidas automaticamente em writeData
					var data = {
						'nroTicket': '#'+$('#nro_ticket').val(), //C - Número do Ticket
						'classificacao': $('#classificacao option:selected').text(), //D - Classificação
						'grupo': $('#grupo option:selected').text(), //E - Grupo
						'subgrupo': $('#subgrupo option:selected').text() || 'Nenhum', //F - Subgrupo
						'modulo': $('#modulo option:selected').text(), //G - Módulo
						'funcionalidade': $('#funcionalidade option:selected').text(), //H - Funcionalidade
						'causa_situacao': $('#causa').val(), //I - Causa | Situação
						'mensagem_erro': $('#erro').val(), //J - Mensagem de erro
						'acao': $('#acao option:selected').text(), //K - Ação
						'ticket_raiz': $('#ticket_raiz').val(), //L - Ticket raiz
						'obs_ticket': $('#obs').val(), //M - Observações ticket
						'retorno_l3': '', //N - Retorno L3 (só preenchido no modo de retorno)
						'data_abertura': $('#data_abertura').val(), //O - Data de abertura
						'l1': $('#nome_atendente').val(), //P - L1
						'classificacao_correta': ($('#classificacao_certa').is(':checked') ? 'Sim' : 'Não'), //Q - Classificação correta?
						'tipo_correto': ($('#tipo_correto').is(':checked') ? 'Sim' : 'Não'), //R - Tipo correto?
						'l1_testou': ($('#testes').is(':checked') ? 'Sim' : 'Não'), //S - L1 testou?
						'informacoes_completas': ($('#finfo').is(':checked') ? 'Sim' : 'Não'), //T - Informações completas?
						'obs_l1': $('#obs_l1').val() //U - Observações L1
					};

					//o ticket já está cadastrado: atualiza a linha dele em vez de criar outra
					if (that.isModoRetornoL3()) {
						that.writeRetornoL3(data, $('#retorno_l3').val()).done(function() {
							that.closeWaitSuccess();
						}).fail(function() {
							that.closeWait();
						});

						return;
					}

					that.writeData(that.SHEET_ID, that.SHEET_NAME, data).done(function() {
						if (!$('#base_conhecimento').is(':checked')) {
							that.closeWaitSuccess();

							return;
						}

						//o botão continua ligado mesmo sem a planilha compartilhada
						//configurada, então avisa que só esse envio não aconteceu em
						//vez de deixar o registro sumir em silêncio
						if (!that.hasPlanilhaBase()) {
							alert('O ticket foi cadastrado, mas não foi enviado para a Base de Conhecimento: a planilha da Base ainda não foi informada nas configurações (engrenagem no topo da extensão).');

							that.closeWaitSuccess();

							return;
						}

						that.writeData(that.SHEET_KNOWLEDGE_ID, that.SHEET_KNOWLEDGE_NAME, data).done(function() {
							that.closeWaitSuccess();
						}).fail(function() {
							that.closeWait();
						});
					}).fail(function() {
						that.closeWait();
					});
				} else {
					that.closeWait();
				}
			});
		})
		.on('click', '#limpar', function() {
			that.clear();
		})
		.on('click', '#informar_retorno_l3', function() {
			$('#modo_retorno_l3').prop('checked', true).change();
		})
		.on('click', '#informar_registro_l2', function() {
			$('#modo_retorno_l3').prop('checked', false).change();
		})
		.on('change', '#modulo', function() {
			that.updateFunctionalities();
		})
		.on('change', '#grupo', function() {
			that.updateSubgroups();
			that.updateSelectModules();
		});

		$('#nro_ticket').on('blur keyup', function() {
			$(this).val($(this).val().replace(/\D/g, ''));
		});

		$('#data_abertura').mask('00/00/0000');

		$.each(that.requiredInputs, function() {
			$('#' + this).on('keypress', function() {
				$(this).parents('.group-item-form').removeClass('group-item-form-error');
			});
		});

		$.each($('#controle_tickets input:not([type="button"]), #controle_tickets textarea, #controle_tickets select'), function() {
			$(this).on('change', function() {
				chrome.storage.sync.set(that.getStorageData());
			});
		});

		//o cabeçalho e a trilha acompanham o preenchimento enquanto se digita
		$('#controle_tickets').on('input change', 'input, textarea, select', function() {
			that.atualizaProgresso();
			that.atualizaTrilha();
			that.atualizaContador();
		});

		this.registraDicas();

		$(document).on('keydown', function(e) {
			var configAberta = !$('#config').prop('hidden');

			if (e.key == 'Escape' && configAberta) {
				that.fechaConfiguracao();

				return;
			}

			//com a configuração aberta o atalho não pode disparar o cadastro atrás
			//do painel
			if ((e.ctrlKey || e.metaKey) && e.key == 'Enter' && !configAberta) {
				$('#enviar_controle_tickets').click();
			}
		});

		chrome.runtime.onMessage.addListener(function(request) {
			if (request.action == 'getTicketInfo') {
				that.setFormFields(request.fields);
			}
		});
	},

	'getStorageData': function() {
		var data = {};
		var that = this;

		$.each($('#controle_tickets input:not([type="button"]), #controle_tickets textarea, #controle_tickets select'), function() {
			if (that.checkboxDefaults.hasOwnProperty($(this).attr('id'))) {
				var value = $(this).is(':checked');
			} else {
				var value = $(this).val();
			}

			data[$(this).attr('id')] = value;
		});

		return data;
	},

	'getTicketData': function() {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			if (tabs && tabs.length > 0 && tabs[0].url.includes('https://www.bling.com.br/suporte.php')) {
				chrome.scripting.executeScript({
					'target': {'tabId': tabs[0].id},
					'files': ['scripts/jquery.min.js', 'scripts/getPagesSource.js']
				});
			}
		});
	},

	'setFormFields': function(data) {
		$('#nro_ticket').val(data.numero).change();
		$('#classificacao').val(data.classificacao).change();
		$('#data_abertura').val(data.dataAbertura);

		$('#classificacao').on('change', function() {
			$('#classificacao_certa').prop('checked', false);
		});

		if (this.nivelResponsavel == NIVEL_RESPONSAVEL.L1) {
			$('#nome_atendente').val(data.nomeAtendenteL1);
		} else if (this.nivelResponsavel == NIVEL_RESPONSAVEL.L2) {
			$('#nome_atendente').val(data.nomeAtendenteL2);
		}

		this.setCategorization(data.categorizacao);

		this.atualizaTrilha();
		this.atualizaProgresso();
	},

	'setCategorization': function(data) {
		if (data.grupo.value) {
			$('#grupo .opt-bling').append(
				$('<option>', {'text': data.grupo.text, 'value': data.grupo.value, 'selected': true})
			);
		}

		if (data.subGrupo.value) {
			$('#subgrupo .opt-bling').append(
				$('<option>', {'text': data.subGrupo.text, 'value': data.subGrupo.value, 'selected': true})
			);

			$('#subgrupo').parents('.form-group').show();
		}

		if (data.modulo.value) {
			$('#modulo .opt-bling').append(
				$('<option>', {'text': data.modulo.text, 'value': data.modulo.value, 'selected': true})
			);
		}

		if (data.funcionalidade.value) {
			$('#funcionalidade .opt-bling').append(
				$('<option>', {'text': data.funcionalidade.text, 'value': data.funcionalidade.value, 'selected': true})
			);
		}
	},

	'readData': function(range) {
		var deferredObj = $.Deferred();
		var that = this;

		chrome.identity.getAuthToken({interactive: true}, function(token) {
			$.get({
				'url': 'https://sheets.googleapis.com/v4/spreadsheets/' + that.SHEET_ID + '/values/' + that.referenciaAba(that.SHEET_NAME, range),
				'headers': {
					'Authorization': 'Bearer ' + token,
					'Content-Type': 'application/json'
				},
				'contentType': 'json'
			}).done(function(res) {
				deferredObj.resolve(res);
			}).fail(function() {
				deferredObj.reject();
			});
		});

		return deferredObj.promise();
	},

	//letra da coluna de uma posição (1 = A, 27 = AA)
	'colunaPorPosicao': function(posicao) {
		var letras = '';

		while (posicao > 0) {
			var resto = (posicao - 1) % 26;

			letras = String.fromCharCode(65 + resto) + letras;
			posicao = (posicao - 1 - resto) / 26;
		}

		return letras;
	},

	//letra da coluna em que uma chave dos dados é gravada
	'colunaDoCampo': function(data, campo) {
		return this.colunaPorPosicao($.inArray(campo, Object.keys(data)) + COLUNAS_AUTOMATICAS + 1);
	},

	//no retorno do L3 o ticket já está cadastrado: localiza a linha dele e grava
	//o retorno na coluna correspondente, sem criar uma linha nova
	'writeRetornoL3': function(data, retorno) {
		var deferredObj = $.Deferred();
		var that = this;
		var colunaTicket = this.colunaDoCampo(data, CAMPO_NRO_TICKET);
		var colunaRetorno = this.colunaDoCampo(data, CAMPO_RETORNO_L3);

		var falhaLeitura = function() {
			alert('Não foi possível consultar a planilha. Verifique a conexão e tente novamente.');
			deferredObj.reject();
		};

		this.readData(colunaTicket + '2:' + colunaTicket).done(function(res) {
			var tickets = $.map(res.values || [], function(linha) {
				return $.trim((linha || [])[0] || '');
			});

			//a última ocorrência, caso o ticket tenha sido cadastrado mais de uma vez
			var linha = tickets.lastIndexOf($.trim(data[CAMPO_NRO_TICKET])) + 2;

			if (linha < 2) {
				alert('O ticket ' + data[CAMPO_NRO_TICKET] + ' não foi encontrado na planilha.\n\nCadastre o ticket antes de informar o retorno do L3.');
				deferredObj.reject();

				return;
			}

			that.readData(colunaRetorno + linha).done(function(res) {
				var atual = $.trim((((res.values || [])[0] || [])[0]) || '');

				if (atual && !confirm('O ticket ' + data[CAMPO_NRO_TICKET] + ' já tem um retorno do L3 gravado:\n\n' + atual + '\n\nSubstituir pelo novo retorno?')) {
					deferredObj.reject();

					return;
				}

				that.updateData(colunaRetorno + linha, retorno).done(function() {
					deferredObj.resolve();
				}).fail(function() {
					alert('Não foi possível gravar o retorno na planilha. Tente novamente.');
					deferredObj.reject();
				});
			}).fail(falhaLeitura);
		}).fail(falhaLeitura);

		return deferredObj.promise();
	},

	//grava um valor numa célula já existente, diferente do append que cria linha
	'updateData': function(range, valor) {
		var deferredObj = $.Deferred();
		var that = this;

		chrome.identity.getAuthToken({interactive: true}, function(token) {
			$.ajax({
				'type': 'PUT',
				'url': 'https://sheets.googleapis.com/v4/spreadsheets/' + that.SHEET_ID + '/values/' + that.referenciaAba(that.SHEET_NAME, range) + '?valueInputOption=RAW',
				'headers': {
					'Authorization': 'Bearer ' + token,
					'Content-Type': 'application/json'
				},
				'data': JSON.stringify({'majorDimension': 'ROWS', 'values': [[valor]]})
			}).done(function() {
				deferredObj.resolve();
			}).fail(function() {
				deferredObj.reject();
			});
		});

		return deferredObj.promise();
	},

	'writeData': function(sheetId, sheetName, data) {
		var deferredObj = $.Deferred();
		var that = this;

		chrome.identity.getAuthToken({interactive: true}, function(token) {
			chrome.identity.getProfileUserInfo(function(userInfo) {
				var valores = $.merge([new Date().toLocaleString('pt-BR'), userInfo['email']], Object.values(data));

				//o intervalo tem que cobrir todas as colunas gravadas: se for mais
				//estreito que a linha, o append passa a escrever a partir da última
				//coluna do intervalo em vez da coluna A
				var range = that.referenciaAba(sheetName, 'A1:' + that.colunaPorPosicao(valores.length) + '1');

				var params = {
					'majorDimension': 'ROWS',
					'values': [valores]
				};

				$.post({
					'url': 'https://sheets.googleapis.com/v4/spreadsheets/' + sheetId + '/values/' + range + ':append?valueInputOption=RAW',
					'headers': {
						'Authorization': 'Bearer ' + token,
						'Content-Type': 'application/json'
					},
					'data': JSON.stringify(params)
				}).done(function() {
					deferredObj.resolve();
				}).fail(function() {
					deferredObj.reject();
				})
			})
		});

		return deferredObj.promise();
	},

	'validate': function() {
		var deferredObj = $.Deferred();
		var isValid = true;
		var retornoL3 = this.isModoRetornoL3();

		//no retorno do L3 os demais campos são só contexto: eles identificam o
		//ticket na tela, mas nada além do retorno é gravado
		$.each(retornoL3 ? this.requiredInputsRetornoL3 : this.requiredInputs, function() {
			if (!$.trim($('#' + this).val()) && $('#' + this).is(':visible')) {
				$('#' + this).parents('.group-item-form').addClass('group-item-form-error');
				isValid = false;
			}
		});

		//a checagem de duplicidade não se aplica ao retorno do L3, que justamente
		//depende de o ticket já estar cadastrado
		if (retornoL3) {
			return deferredObj.resolve(isValid).promise();
		}

		this.readData('C2:C').done(function(res) {
			res.values = res.values || [];

			if ($.inArray($('#nro_ticket').val(), res.values.flat()) != -1) {
				alert('O ticket #' + $('#nro_ticket').val() + ' já foi registrado.');
				$('#nro_ticket').parents('.group-item-form').addClass('group-item-form-error');
				isValid = false;
			}

			deferredObj.resolve(isValid);
		}).fail(function() {
			alert('Não foi possível consultar a planilha para verificar se o ticket já existe. Verifique a conexão e tente novamente.');
			deferredObj.resolve(false);
		});

		return deferredObj.promise();
	},

	'clear': function() {
		var that = this;

		$.each(['nro_ticket', 'funcionalidade', 'data_abertura', 'causa', 'conclusao', 'nome_atendente', 'ticket_raiz', 'erro', 'obs_l1', 'retorno_l3'], function() {
			$('#' + this).val('').parents('.group-item-form').removeClass('group-item-form-error');
		});

		$.each(['grupo', 'subgrupo', 'modulo', 'funcionalidade'], function() {
			$('#' + this + ' .opt-bling').empty().hide();
			$('#' + this).val($('#' + this + ' .opt-ext option:first').val());
		});

		$('#classificacao').val($('#classificacao option:first').val());

		//apaga da gravação só o que é do ticket: as preferências continuam valendo
		//para o próximo registro
		chrome.storage.sync.remove($.grep(Object.keys(this.getStorageData()), function(chave) {
			return $.inArray(chave, that.preferencias) == -1;
		}));

		$.each(this.checkboxDefaults, function(element, isChecked) {
			if ($.inArray(element, that.preferencias) == -1) {
				$('#' + element).prop('checked', isChecked);
			}
		});

		this.aplicaModoRetornoL3();
	},

	'setStoredFields': function() {
		var that = this;

		chrome.storage.sync.get(function(data) {
			var sequence = ['grupo', 'subgrupo', 'modulo', 'funcionalidade'];

			$.each(sequence, function() {
				if (data.hasOwnProperty(this)) {
					$('#' + this).val(data[this]);
					delete data[this];
				}
			});

			$.each(data, function(element, value) {
				var field = $('#' + element);

				//a configuração das planilhas não é campo do formulário: quem cuida
				//dela é carregaConfiguracao
				if (element == CHAVE_CONFIG) {
					return true;
				}

				if (that.checkboxDefaults.hasOwnProperty(element)) {
					field.prop('checked', !!value);
				} else if (field.is('select') && !field.find('option[value="' + value + '"]').length) {
					return true; //opção removida do select, mantém a seleção padrão
				} else {
					field.val(value);
				}
			});

			that.aplicaModoRetornoL3();
		});
	},

	'displayWait': function(selector) {
		$('.wait > div').hide();
		$('div[class$="wait"], .wait .' + selector).show();
	},

	'closeWait': function() {
		$('div[class$="wait"], .wait > div').hide();
	},

	'closeWaitSuccess': function() {
		var that = this;

		that.displayWait('checkmark');

		setTimeout(function() {
			that.closeWait();
			that.clear();
			window.close();
		}, 500);
	},

	'logout': function() {
		chrome.identity.getAuthToken({'interactive': false}, function(token) {
			if ($.type(token) == 'string') {
				$.get('https://accounts.google.com/o/oauth2/revoke?token=' + token);
				chrome.identity.removeCachedAuthToken({'token': token});
			}
		});
	},

	'getData': function(path) {
		var deferredObj = $.Deferred();

		$.get({
			'url': chrome.runtime.getURL(path),
			'dataType': 'json',
			'success': function(data) {
				deferredObj.resolve(data);
			}
		});

		return deferredObj.promise();
	},

	'initSelects': function() {
		this.initSelectGroups();
		this.updateSubgroups();
		this.updateSelectModules();
		this.updateFunctionalities();
	},

	'initSelectGroups': function() {
		var that = this;

		$.each(that.groups, function(alias, attrs) {
			$('#grupo .opt-ext').append(
				$('<option>', {'value': alias, 'text': attrs.descricao})
			);
		});
	},

	'updateSubgroups': function() {
		if ($('#grupo option:selected').parent().hasClass('opt-ext')) {
			$('#subgrupo .opt-ext').empty();

			if (this.subgroups.hasOwnProperty($('#grupo').val())) {
				$.each(this.subgroups[$('#grupo').val()], function(alias, description) {
					$('#subgrupo .opt-ext').append(
						$('<option>', {'value': alias, 'text': description})
					);
				});

				$('#subgrupo').parents('.group-item-form').show();
			} else {
				$('#subgrupo').parents('.group-item-form').hide();
			}

			$('#subgrupo').change();
		}
	},

	'updateSelectModules': function() {
		var that = this;

		if ($('#grupo option:selected').parent().hasClass('opt-ext')) {
			$('#modulo .opt-ext').empty();

			$.each(that.groups[$('#grupo').val()].modulos, function() {
				$('#modulo .opt-ext').append(
					$('<option>', {'value': this, 'text': that.modules[this].descricao})
				);
			});

			$('#modulo').change();
		}
	},

	'updateFunctionalities': function() {
		var that = this;

		if ($('#modulo option:selected').parent().hasClass('opt-ext')) {
			$('#funcionalidade .opt-ext').empty();

			$.each(this.modules[$('#modulo').val()].funcionalidades, function() {
				$('#funcionalidade .opt-ext').append(
					$('<option>', {'value': this, 'text': that.functionalities[this]})
				);
			});

			$('#funcionalidade .opt-ext').append(
				$('<option>', {'value': 'naoDefinida', 'text': 'Não definida'})
			);

			$('#funcionalidade').change();
		}
	}
};
