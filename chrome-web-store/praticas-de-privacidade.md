# Aba "Práticas de privacidade"

Textos prontos para colar no painel do desenvolvedor. Cada bloco corresponde a
um campo da aba. O limite de cada campo de justificativa é 1.000 caracteres —
todos os textos abaixo estão dentro do limite.

---

## URL da política de privacidade

Campo **Política de privacidade** (obrigatório porque a extensão usa
`identity.email`, que a loja classifica como informação de identificação
pessoal).

```
https://github.com/ygorkappaunbling/extensaoL2/blob/main/chrome-web-store/politica-de-privacidade.md
```

Essa URL só funciona depois do push desta branch para o `main`. Se preferir uma
página em vez de um arquivo do GitHub, publique o conteúdo de
[`politica-de-privacidade.md`](politica-de-privacidade.md) onde quiser e use a
URL de lá — o que a loja exige é uma página pública, sem login.

---

## Único propósito

> Resolve: *"É necessário fornecer uma descrição do único propósito."*

```
A extensão tem um único propósito: registrar os tickets atendidos pelo suporte nível 2 do Bling em uma planilha do Google Sheets escolhida por quem a usa.

Todo o restante existe para servir a esse registro. A leitura da página do ticket preenche o formulário automaticamente; a autorização com a conta Google permite gravar na planilha; o armazenamento guarda o link da planilha e o rascunho do formulário. Não há nenhuma função fora desse propósito: a extensão não altera páginas, não exibe anúncios, não coleta histórico de navegação e não envia dados para servidores do desenvolvedor — ela não tem servidor.
```

---

## Justificativas de permissão

### `identity`

> Resolve: *"É necessário fornecer uma justificativa para identity."*

```
A extensão grava os registros na planilha do Google Sheets da própria pessoa, usando a API oficial do Google Sheets. Essa API exige um token OAuth 2.0 da conta Google de quem está usando, e a permissão identity é o que permite obtê-lo pelo chrome.identity.getAuthToken, com o escopo https://www.googleapis.com/auth/spreadsheets declarado no manifest.

O token é usado somente no cabeçalho Authorization das chamadas a sheets.googleapis.com, para ler e escrever na planilha configurada. Ele não é gravado em disco, não é enviado a nenhum outro destino e é revogado quando a pessoa desconecta a extensão. Sem essa permissão não haveria como gravar na planilha, que é a única função da extensão.
```

### `identity.email`

> Resolve: *"É necessário fornecer uma justificativa para identity.email."*

```
Cada linha gravada na planilha precisa identificar quem fez o registro — é assim que o time sabe quem atendeu cada ticket e a quem recorrer para entender um registro. A extensão obtém o endereço de e-mail da conta Google conectada ao Chrome, via chrome.identity.getProfileUserInfo, e o escreve na coluna B da linha, ao lado da data e hora do registro.

O e-mail é usado apenas para isso. Ele vai somente para a planilha do Google Sheets que a própria pessoa configurou, junto com o registro do ticket, e não é enviado ao desenvolvedor nem a terceiros. A extensão não mantém banco de dados nem servidor: não existe nenhuma outra cópia desse e-mail.
```

### Permissão de host (`https://*.bling.com.br/suporte.php*`)

> Resolve: *"É necessário fornecer uma justificativa para o uso da permissão do
> host."*

```
A extensão preenche o formulário a partir do ticket que está aberto na tela, em vez de exigir que a pessoa copie os dados campo por campo. Para isso ela precisa ler o conteúdo da página de suporte do Bling, que é onde o ticket é atendido.

O acesso é restrito ao endereço https://*.bling.com.br/suporte.php* — apenas a tela de atendimento de tickets, nenhum outro endereço do Bling e nenhum outro site. A leitura é pontual: quando a extensão é aberta, ela lê do ticket o número, a data de abertura, a classificação, os nomes dos responsáveis L1 e L2 e a categorização, e nada mais. A extensão não modifica a página, não acompanha a navegação e não envia o conteúdo da página para nenhum lugar além da planilha do Google Sheets configurada.
```

### `scripting`

> Resolve: *"É necessário fornecer uma justificativa para scripting."*

```
É a permissão que permite ler o ticket aberto na tela. Quando a extensão é aberta, ela injeta o script scripts/getPagesSource.js na aba da tela de suporte do Bling (chrome.scripting.executeScript) para ler os campos do ticket e devolvê-los ao formulário pelo chrome.runtime.sendMessage.

A injeção só acontece na aba ativa e somente quando o endereço dela é a tela de suporte do Bling; em qualquer outra página nada é injetado. O script é um arquivo local do pacote, não vem da internet, apenas lê valores já visíveis na tela e não altera a página. Sem essa permissão a pessoa teria que copiar manualmente número, data, classificação e categorização de cada ticket.
```

### `storage`

> Resolve: *"É necessário fornecer uma justificativa para storage."*

```
A extensão guarda duas coisas com chrome.storage: a configuração — o ID da planilha do Google Sheets e o nome da aba, informados pela própria pessoa, mais a preferência de enviar também para a planilha da Base de Conhecimento — e o rascunho do formulário, para que o que já foi digitado não se perca se a janela da extensão fechar antes do envio.

A configuração é gravada em chrome.storage.sync, para acompanhar a conta do Chrome e não se perder na troca de máquina ou na limpeza do cache. Nada disso sai do navegador de quem usa: não há servidor do desenvolvedor recebendo esses dados. O rascunho é apagado quando o ticket é cadastrado ou quando a pessoa clica em "Limpar".
```

### `tabs`

> Resolve: *"É necessário fornecer uma justificativa para tabs."*

```
A extensão só deve ler o ticket quando ele está realmente na tela. Antes de injetar qualquer script, ela consulta a aba ativa da janela atual (chrome.tabs.query com active: true e currentWindow: true) e verifica se o endereço é a tela de suporte do Bling; se não for, nada é injetado e o formulário fica em branco, para ser preenchido à mão.

Também é o que permite abrir a interface da extensão em uma aba própria (chrome.tabs.create), já que o formulário é grande e trabalhar nele em uma aba é mais confortável que na janela do popup. A extensão não lista abas, não acompanha a navegação e não registra histórico: o endereço da aba ativa é lido no momento da abertura, comparado e descartado.
```

---

## Código remoto

> Resolve: *"É necessário fornecer uma justificativa para o uso de código
> remoto."*

**Marque a opção: "Não, não estou usando código remoto"** (*No, I am not using
remote code*).

Isso é verdade e é verificável no pacote:

- Todo o JavaScript está dentro do `.zip`: `scripts/script.js`,
  `scripts/background.js`, `scripts/getPagesSource.js`,
  `scripts/jquery.min.js` e `scripts/jquery.mask.js`. O jQuery é servido do
  próprio pacote, não de CDN.
- O `index.html` não carrega nenhum `<script src>` externo.
- O `manifest.json` declara
  `"content_security_policy": {"extension_pages": "script-src 'self'; object-src 'self'"}`,
  o que impede o carregamento de script externo mesmo por engano.
- Não há `eval`, `new Function` nem execução de string como código.
- As únicas requisições de rede são chamadas de dados (JSON) para
  `https://sheets.googleapis.com`, a API oficial do Google Sheets, e a
  revogação do token em `https://accounts.google.com/o/oauth2/revoke`. Elas
  trazem dados, nunca código a ser executado.

Se o painel insistir em um texto, use:

```
A extensão não usa código remoto. Todo o JavaScript executado está incluído no pacote, inclusive a biblioteca jQuery, que é servida do próprio pacote e não de CDN. A política de segurança de conteúdo declarada no manifest é "script-src 'self'; object-src 'self'", que bloqueia o carregamento de qualquer script externo, e o código não usa eval nem new Function. As únicas chamadas de rede são para a API oficial do Google Sheets (sheets.googleapis.com), para ler e gravar na planilha configurada pela pessoa, e para a revogação do token OAuth em accounts.google.com. Ambas retornam dados, nunca código executável.
```

---

## Declarações de uso de dados

> Resolve: *"Para publicar seu item, o uso de dados precisa obedecer às nossas
> Políticas do programa para desenvolvedores."*

Na seção **Uso de dados**, declare o que é coletado e marque as três
certificações.

### O que declarar como coletado

| Categoria | Marcar? | Por quê |
| --- | --- | --- |
| Informações de identificação pessoal | **Sim** | o e-mail da conta Google, gravado na planilha para identificar quem fez o registro |
| Informações de saúde | Não | — |
| Informações financeiras e de pagamento | Não | — |
| Informações de autenticação | Não | o token OAuth é do próprio Google, usado na hora e não armazenado pela extensão |
| Comunicações pessoais | Não | — |
| Localização | Não | — |
| Histórico da Web | Não | a extensão lê apenas o endereço da aba ativa, para comparar, e não guarda nada |
| Atividade do usuário | Não | não há cliques, movimentos de mouse nem métricas de uso coletados |
| Conteúdo do site | **Sim** | os campos do ticket lidos da tela de suporte do Bling |

### As três certificações (marque todas)

1. ✅ **Não estou vendendo nem transferindo dados do usuário a terceiros**,
   exceto nos casos de uso aprovados.
   *Verdade: os dados vão somente para a planilha do Google Sheets da própria
   pessoa, pela API oficial do Google. Não há servidor do desenvolvedor.*
2. ✅ **Não estou usando nem transferindo dados do usuário para finalidades
   alheias ao único propósito do item.**
   *Verdade: os dados são usados apenas para gravar o registro do ticket na
   planilha configurada.*
3. ✅ **Não estou usando nem transferindo dados do usuário para determinar a
   capacidade de pagamento nem para fins de empréstimo.**
   *Verdade: não há nada disso na extensão.*
