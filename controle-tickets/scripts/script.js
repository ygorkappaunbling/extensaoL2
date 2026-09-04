const NIVEL_RESPONSAVEL = {
	'L1': 'L1',
	'L2': 'L2'
}

//valor padrão das configurações de planilha, indica que ainda não foram preenchidas
const CONFIG_PENDENTE = 'Link da planilha aqui';

//chaves usadas para descobrir a coluna correspondente na planilha
const CAMPO_NRO_TICKET = 'nroTicket';
const CAMPO_RETORNO_L3 = 'retorno_l3';

//data/hora e e-mail ocupam A e B, então a primeira chave dos dados cai em C
const COLUNAS_AUTOMATICAS = 2;

$(function() {
	var controleTickets = new ControleTickets(NIVEL_RESPONSAVEL.L1);
});

var ControleTickets = function(nivelResponsavel) {
	//obrigatórios: sem eles não é possível cadastrar
	this.SHEET_ID = 'Link da planilha aqui'; //ID da planilha própria
	this.SHEET_NAME = 'Tickets'; //nome da aba na planilha própria

	//opcionais: usados somente pelo "Incluir na Base"
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

	this.loadFiles().done(function() {
		this.initSelects();
		this.setStoredFields();
		this.getTicketData();
		this.registerEvents();
		this.render();
		this.atualizaContador();
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

		$('#controle_tickets').on('click', '#enviar_controle_tickets', function() {
			if (!that.hasPlanilhaPropria()) {
				alert('Antes de cadastrar, preencha os dados da planilha própria (SHEET_ID e SHEET_NAME) no arquivo scripts/script.js.');

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
							alert('O ticket foi cadastrado, mas não foi enviado para a Base de Conhecimento: falta preencher a planilha compartilhada (SHEET_KNOWLEDGE_ID e SHEET_KNOWLEDGE_NAME) no arquivo scripts/script.js.');

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
			if ((e.ctrlKey || e.metaKey) && e.key == 'Enter') {
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
				'url': 'https://sheets.googleapis.com/v4/spreadsheets/' + that.SHEET_ID + '/values/' + that.SHEET_NAME + '!' + range,
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
				'url': 'https://sheets.googleapis.com/v4/spreadsheets/' + that.SHEET_ID + '/values/' + that.SHEET_NAME + '!' + range + '?valueInputOption=RAW',
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
				var range = sheetName + '!A1:' + that.colunaPorPosicao(valores.length) + '1';

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
