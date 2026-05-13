chrome.runtime.sendMessage({
	'action': 'getTicketInfo',
	'fields': {
		'numero': $('.num-ticket-sidebar span').text().replaceAll('#', ''),
		'dataAbertura': getTicketDate(),
		'classificacao': $('#tipoTicket option:selected').val(),
		'nomeAtendenteL1': $('#nivelResponsavelL1 .nome').text(),
		'nomeAtendenteL2': $('#nivelResponsavelL2 .nome').text(),
		'categorizacao': {
			'grupo': {
				'text': $('#categorizacao #grupo option:selected').text(),
				'value': parseInt($('#categorizacao #grupo option:selected').val() || 0)
			},
			'subGrupo': {
				'text': $('#categorizacao #subgrupo option:selected').text(),
				'value': parseInt($('#categorizacao #subgrupo option:selected').val() || 0)
			},
			'modulo': {
				'text': $('#categorizacao #problemaTicket option:selected').text(),
				'value': parseInt($('#categorizacao #problemaTicket option:selected').val() || 0)
			},
			'funcionalidade': {
				'text': $('#categorizacao #funcionalidade option:selected').text(),
				'value': parseInt($('#categorizacao #funcionalidade option:selected').val() || 0)
			}
		}
	}
});

function getTicketDate() {
	var date = $('#numeroTicket').text().match(/([0-9]{2})\/([0-9]{2})\/([0-9]{4})/);

	if (Array.isArray(date)) {
		return date[0];
	}

	return '';
}