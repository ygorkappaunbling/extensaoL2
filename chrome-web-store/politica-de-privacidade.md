# Política de Privacidade — Controle de tickets

**Extensão:** Controle de tickets (Chrome Web Store)
**Última atualização:** 4 de setembro de 2026

## Resumo

A extensão **Controle de tickets** não tem servidor e não coleta dados para o
desenvolvedor. As informações que você preenche vão apenas para a planilha do
Google Sheets que você mesmo configurou, gravadas pela API oficial do Google
com a autorização da sua própria conta Google.

## Quem é o responsável

A extensão é mantida pelo time de suporte do Bling
(<ygor.kappaun@bling.com.br>) e distribuída como ferramenta interna de
trabalho.

## Que dados a extensão trata

| Dado | De onde vem | Para onde vai | Por quê |
| --- | --- | --- | --- |
| Dados do ticket: número, data de abertura, classificação, categorização (grupo, subgrupo, módulo, funcionalidade), nomes dos responsáveis L1 e L2 | lidos da tela de suporte do Bling (`https://*.bling.com.br/suporte.php*`) quando você abre a extensão | para a planilha do Google Sheets que você configurou | preencher o formulário automaticamente, em vez de exigir cópia manual |
| O que você digita: causa, mensagem de erro, observações, ação tomada, retorno do L3 e as checagens sobre o atendimento | digitado por você no formulário | para a planilha do Google Sheets que você configurou | é o registro do ticket em si |
| Seu endereço de e-mail | conta Google conectada ao Chrome (`chrome.identity.getProfileUserInfo`) | gravado na coluna B da linha, na planilha que você configurou | identificar quem fez cada registro |
| Data e hora do registro | gerada no seu navegador no momento do envio | gravada na coluna A da linha | ordenar e localizar os registros |
| Link da planilha e nome da aba, e a preferência de enviar para a Base de Conhecimento | informados por você nas configurações | `chrome.storage.sync` / `chrome.storage.local`, no seu navegador | não pedir a configuração de novo a cada uso |
| Rascunho do formulário | o que você já digitou | `chrome.storage.sync`, no seu navegador | não perder o preenchimento se a janela fechar antes do envio |
| Token de acesso OAuth 2.0 | Google, via `chrome.identity.getAuthToken` | usado no cabeçalho `Authorization` das chamadas ao Google Sheets | autorizar a leitura e a gravação na sua planilha |

## Para onde os dados são enviados

A extensão faz requisições de rede para dois endereços, e apenas para eles:

- **`https://sheets.googleapis.com`** — API oficial do Google Sheets, para ler
  e gravar na planilha que você configurou.
- **`https://accounts.google.com/o/oauth2/revoke`** — para revogar o token de
  acesso quando você desconecta a extensão.

Não existe servidor do desenvolvedor. Nenhum dado é enviado para o
desenvolvedor, para o Bling ou para qualquer terceiro por meio da extensão. Os
dados que você grava ficam sob as regras de compartilhamento da própria
planilha: quem tem acesso a ela vê os registros, e isso é definido por você e
pelo seu time no Google Drive, não pela extensão.

## O que a extensão não faz

- Não vende nem transfere seus dados a terceiros.
- Não usa seus dados para nenhuma finalidade fora do registro de tickets na
  planilha que você configurou.
- Não usa seus dados para avaliação de crédito ou concessão de empréstimo.
- Não coleta histórico de navegação. Ela consulta o endereço da aba ativa
  apenas para verificar se é a tela de suporte do Bling, compara e descarta.
- Não exibe anúncios, não faz rastreamento, não usa ferramentas de analytics.
- Não modifica as páginas que você visita.
- Não executa código baixado da internet: todo o JavaScript está no pacote da
  extensão.

## Onde os dados ficam guardados

- **Na sua planilha do Google Sheets:** os registros de tickets. Ficam lá pelo
  tempo que você e seu time decidirem — apagar uma linha ou a planilha remove o
  registro, e a extensão não guarda cópia.
- **No seu navegador:** a configuração e o rascunho do formulário, em
  `chrome.storage`. A configuração fica na área `sync`, que acompanha a sua
  conta do Chrome. O rascunho é apagado quando o ticket é cadastrado ou quando
  você clica em "Limpar".

## Como remover os dados

- **Configuração e rascunho:** desinstale a extensão, ou use o botão "Limpar"
  para o rascunho. Desinstalar apaga tudo que a extensão guardou no navegador.
- **Autorização de acesso ao Google Sheets:** revogue em
  <https://myaccount.google.com/permissions>. A extensão também revoga o token
  ao ser desconectada.
- **Registros já gravados:** apague as linhas ou a planilha no Google Sheets.
  Só você e quem tem acesso à planilha podem fazer isso; o desenvolvedor não
  tem acesso a ela.

## Permissões e por que cada uma é necessária

| Permissão | Para que serve |
| --- | --- |
| `identity` | obter o token OAuth da sua conta Google, exigido pela API do Google Sheets |
| `identity.email` | ler o e-mail da sua conta, gravado na planilha para identificar quem registrou |
| `storage` | guardar a configuração da planilha e o rascunho do formulário no seu navegador |
| `scripting` | injetar o script que lê os campos do ticket, apenas na tela de suporte do Bling |
| `tabs` | verificar se a aba ativa é a tela de suporte antes de ler qualquer coisa, e abrir a interface em uma aba própria |
| `host_permissions: https://*.bling.com.br/suporte.php*` | ler os dados do ticket na tela de atendimento — nenhum outro endereço |
| Escopo OAuth `https://www.googleapis.com/auth/spreadsheets` | ler e gravar na planilha que você configurou |

## Uso limitado dos dados do Google

O uso e a transferência das informações obtidas pelas APIs do Google seguem a
[Política de dados do usuário dos serviços de API do Google](https://developers.google.com/terms/api-services-user-data-policy),
inclusive os requisitos de **uso limitado** (*Limited Use*). Em resumo: os
dados obtidos pelas APIs do Google são usados exclusivamente para gravar e ler
os registros de tickets na planilha que você configurou, não são transferidos a
terceiros, não são usados para publicidade e não são lidos por pessoas — apenas
pelo código da extensão, no seu navegador.

## Crianças

A extensão é uma ferramenta de trabalho, não é direcionada a menores de 13 anos
e não coleta dados de crianças de forma consciente.

## Mudanças nesta política

Alterações nesta política são publicadas nesta mesma página, com a data de
atualização revisada no topo. Mudanças que ampliem o tratamento de dados serão
acompanhadas de uma nova versão da extensão e da autorização correspondente.

## Contato

Dúvidas sobre esta política ou sobre o tratamento de dados:
<ygor.kappaun@bling.com.br>.
