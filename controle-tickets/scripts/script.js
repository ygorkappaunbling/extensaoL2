const NIVEL_RESPONSAVEL = {
	'L1': 'L1',
	'L2': 'L2'
}

$(function() {
	var controleTickets = new ControleTickets(NIVEL_RESPONSAVEL.L1);
});

var ControleTickets = function(nivelResponsavel) {
	this.SHEET_ID = 'Link da planilha aqui';
	this.SHEET_KNOWLEDGE_ID = 'Link da planilha aqui'; //ID da planilha compartilhada
	this.SHEET_NAME = 'Tickets'; //nome da aba na planilha própria
	this.SHEET_KNOWLEDGE_NAME = 'Fiscal'; //nome da aba na planilha compartilhada

	this.requiredInputs = ['nro_ticket', 'grupo', 'subgrupo', 'modulo', 'funcionalidade', 'classificacao', 'causa', 'conclusao', 'data_abertura'];
	this.nivelResponsavel = nivelResponsavel

	this.loadFiles().done(function() {
		this.initSelects();
		this.setStoredFields();
		this.getTicketData();
		this.registerEvents();
		this.render();
	}.bind(this));

	chrome.identity.getAuthToken({'interactive': true});
}

ControleTickets.prototype = {
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
		$('label[for="nome_atendente"]').html(this.nivelResponsavel + ' <span> * </span>');
	},

	'registerEvents': function() {
		var that = this;

		$('#controle_tickets').on('click', '#enviar_controle_tickets', function() {
			that.displayWait('loading');

			that.validate().done(function(isValid) {
				if (isValid) {
					var data = {
						'nroTicket': '#'+$('#nro_ticket').val(), 
						'classificacao': $('#classificacao option:selected').text(),
						'grupo': $('#grupo option:selected').text(),
						'subgrupo': $('#subgrupo option:selected').text() || 'Nenhum',
						'modulo': $('#modulo option:selected').text(),
						'funcionalidade': $('#funcionalidade option:selected').text(),
						'motivo': $('#motivo option:selected').text(),
						'acao': $('#acao option:selected').text(),
						'testes': $('#testes option:selected').text(),
						'finfo': $('#finfo option:selected').text(),
						'data_abertura': $('#data_abertura').val(),
						'causa': $('#causa').val(),
						'obs': $('#obs').val(),
						'atendente': $('#nome_atendente').val(),
						'classificacao_certa': ($('#classificacao_certa').is(':checked') ? 'Sim' : 'Não')
					};

					that.writeData(that.SHEET_ID, that.SHEET_NAME, data).done(function() {
						if ($('#base_conhecimento').is(':checked')) {
							that.writeData(that.SHEET_KNOWLEDGE_ID, that.SHEET_KNOWLEDGE_NAME, data).done(function() {
								that.closeWaitSuccess();
							});
						} else {
							that.closeWaitSuccess();
						}
					});
				} else {
					that.closeWait();
				}
			});
		})
		.on('click', '#limpar', function() {
			that.clear();
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

		chrome.runtime.onMessage.addListener(function(request) {
			if (request.action == 'getTicketInfo') {
				that.setFormFields(request.fields);
			}
		});
	},

	'getStorageData': function() {
		var data = {};

		$.each($('#controle_tickets input:not([type="button"]), #controle_tickets textarea, #controle_tickets select'), function() {
			if ($.inArray($(this).attr('id'), ['classificacao_certa', 'base_conhecimento', 'sem_base']) != -1) {
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
			}, function(res) {
				deferredObj.resolve(res);
			});
		});

		return deferredObj.promise();
	},

	'writeData': function(sheetId, sheetName, data) {
		var deferredObj = $.Deferred();

		chrome.identity.getAuthToken({interactive: true}, function(token) {
			chrome.identity.getProfileUserInfo(function(userInfo) {
				var params = {
					'majorDimension': 'ROWS',
					'values': [
						$.merge([new Date().toLocaleString('pt-BR'), userInfo['email']], Object.values(data))
					]
				};

				$.post({
					'url': 'https://sheets.googleapis.com/v4/spreadsheets/' + sheetId + '/values/' + sheetName + '!A1:O1:append?valueInputOption=RAW',
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
		var data = this.readData('C2:C');
		var isValid = true;

		$.each(this.requiredInputs, function() {
			if (!$.trim($('#' + this).val()) && $('#' + this).is(':visible')) {
				$('#' + this).parents('.group-item-form').addClass('group-item-form-error');
				isValid = false;
			}
		});

		data.done(function(res) {
			res.values = res.values || [];

			if ($.inArray($('#nro_ticket').val(), res.values.flat()) != -1) {
				alert('O ticket #' + $('#nro_ticket').val() + ' já foi registrado.');
				$('#nro_ticket').parents('.group-item-form').addClass('group-item-form-error');
				isValid = false;
			}

			deferredObj.resolve(isValid);
		});

		return deferredObj.promise();
	},

	'clear': function() {
		$.each(['nro_ticket', 'funcionalidade', 'data_abertura', 'causa', 'conclusao', 'nome_atendente'], function() {
			$('#' + this).val('').parents('.group-item-form').removeClass('group-item-form-error');
		});

		$.each(['grupo', 'subgrupo', 'modulo', 'funcionalidade'], function() {
			$('#' + this + ' .opt-bling').empty().hide();
			$('#' + this).val($('#' + this + ' .opt-ext option:first').val());
		});

		$('#classificacao').val($('#classificacao option:first').val());

		$('#sem_base').prop('checked', false);

		chrome.storage.sync.clear();

		$('#classificacao_certa').prop('checked', true);
		$('#base_conhecimento').prop('checked', false);
	},

	'setStoredFields': function() {
		chrome.storage.sync.get(function(data) {
			var sequence = ['grupo', 'subgrupo', 'modulo', 'funcionalidade'];

			$.each(sequence, function() {
				if (data.hasOwnProperty(this)) {
					$('#' + this).val(data[this]);
					delete data[this];
				}
			});

			$.each(data, function(element, value) {
				if ($.inArray(element, ['classificacao_certa', 'base_conhecimento', 'sem_base']) != -1 && value) {
					$('#' + element).prop('checked', true);
				} else {
					$('#' + element).val(value);
				}
			});
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
