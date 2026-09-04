# Publicação na Chrome Web Store — Controle de tickets

Esta pasta reúne tudo que a Chrome Web Store pediu para liberar a publicação.
Nada aqui vai dentro do pacote `.zip` da extensão: são os textos e as imagens
que você cola/envia no painel do desenvolvedor.

> **Atalho:** a pasta [`txt/`](txt) tem os mesmos textos em arquivos `.txt`
> separados, um por campo do painel, numerados na ordem de preenchimento. Nos
> arquivos de colar o conteúdo é só o texto do campo — abra, Ctrl+A, Ctrl+C.
> Comece pelo [`txt/00-LEIA-ME.txt`](txt/00-LEIA-ME.txt).

> **Subir o `.zip` não preenche nenhum desses campos.** O pacote é só o código
> da extensão; os erros que a loja aponta são todos campos de formulário do
> painel, preenchidos à mão.

## O que fazer, na ordem

1. **Ligue o GitHub Pages para publicar a política de privacidade.** A política
   é a página [`docs/index.html`](../docs/index.html). Em **Settings → Pages**
   do repositório, escolha *Deploy from a branch*, branch `main`, pasta
   `/docs`, e salve. Em cerca de um minuto ela fica no ar em
   `https://ygorkappaunbling.github.io/extensaoL2/` — é essa URL que vai na aba
   **Práticas de privacidade**.

   Não informe a URL do arquivo no GitHub (`github.com/.../blob/....md`): é a
   interface do GitHub exibindo um arquivo, não uma página publicada, e o
   validador da loja recusa com "o link não é válido".
2. **Aba "Listagem da loja":** cole os textos de
   [`listagem.md`](listagem.md), envie as imagens de [`assets/`](assets) e
   marque idioma e categoria.
3. **Aba "Práticas de privacidade":** cole os textos de
   [`praticas-de-privacidade.md`](praticas-de-privacidade.md), responda o item
   de código remoto e marque as três declarações de uso de dados.
4. **Envie o pacote** gerado a partir da pasta `controle-tickets/` (instruções
   em [Gerar o pacote](#gerar-o-pacote)).
5. **Salve o rascunho** e clique em *Enviar para análise*.

## De cada erro apontado para onde ele se resolve

| Erro da Web Store | Onde resolver |
| --- | --- |
| A descrição detalhada é curta demais ou está ausente | `listagem.md` → **Descrição detalhada** |
| É necessário fornecer uma descrição do único propósito | `praticas-de-privacidade.md` → **Único propósito** |
| Justificativa para `identity` | `praticas-de-privacidade.md` → **identity** |
| Justificativa para `identity.email` | `praticas-de-privacidade.md` → **identity.email** |
| Justificativa para o uso da permissão do host | `praticas-de-privacidade.md` → **Permissão de host** |
| Justificativa para o uso de código remoto | `praticas-de-privacidade.md` → **Código remoto** (a resposta é *não*) |
| Justificativa para `scripting` | `praticas-de-privacidade.md` → **scripting** |
| Justificativa para `storage` | `praticas-de-privacidade.md` → **storage** |
| Justificativa para `tabs` | `praticas-de-privacidade.md` → **tabs** |
| É necessário pelo menos uma captura de tela ou vídeo | `assets/captura-1-registro-l2.png`, `assets/captura-2-retorno-l3.png`, `assets/captura-3-configuracoes.png` (1280x800) |
| Imagem do ícone ausente | `assets/icone-loja-128.png` (128x128) |
| Nenhum idioma foi selecionado | `listagem.md` → **Idioma** |
| O uso de dados precisa obedecer às Políticas do programa | `praticas-de-privacidade.md` → **Declarações de uso de dados** |
| Selecione uma categoria para seu item | `listagem.md` → **Categoria** |

## Mudanças feitas no código

- `controle-tickets/manifest.json`: a descrição curta passou a dizer o que a
  extensão faz ("Registra tickets do suporte do Bling na sua própria planilha
  do Google Sheets, sem sair do atendimento"), em vez de "Extensão para
  registro detalhado de tickets". Essa é a descrição que aparece embaixo do
  nome na loja e é a primeira coisa que a análise lê.
- `controle-tickets/manifest.json`: removido o bloco
  `web_accessible_resources`, que expunha `data/*.json` para **qualquer** site
  (`*://*/*`). Esses arquivos só são lidos pela própria página da extensão, via
  `chrome.runtime.getURL`, o que não exige `web_accessible_resources` — a
  extensão continua funcionando igual e a análise deixa de ver um recurso
  aberto para a web inteira sem necessidade.

## Gerar o pacote

Na raiz do repositório:

```sh
cd controle-tickets && zip -r ../controle-tickets-1.1.zip . -x '.*' -x '__MACOSX/*'
```

O `.zip` tem que ter o `manifest.json` na **raiz** do arquivo — por isso o
`cd` antes do `zip`. Se você compactar a pasta pelo Finder/Explorer, o
manifest cai dentro de `controle-tickets/` e a loja recusa o pacote.

## Observações para as próximas versões

- A permissão `tabs` hoje é usada só para descobrir se a aba ativa é a tela de
  suporte do Bling. Isso daria para fazer sem ela, apoiado apenas na permissão
  de host — mas o código precisaria tratar o caso em que `tabs[0].url` vem
  vazio (é o que acontece nas abas fora do padrão de host). Fica como possível
  simplificação futura, não como pendência da publicação.
- Cada envio novo precisa de um `version` maior no `manifest.json`. Se esta
  publicação for recusada e você mexer no pacote, suba para `1.2`.
