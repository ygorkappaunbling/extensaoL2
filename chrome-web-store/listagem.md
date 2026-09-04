# Aba "Listagem da loja"

Textos prontos para colar no painel do desenvolvedor da Chrome Web Store.

---

## Nome

```
Controle de tickets
```

---

## Descrição breve

Já está no `manifest.json` (campo `description`) e a loja preenche sozinha:

```
Registra tickets do suporte do Bling na sua própria planilha do Google Sheets, sem sair do atendimento.
```

103 caracteres — o limite é 132.

---

## Descrição detalhada

> Resolve: *"A descrição detalhada é curta demais ou está ausente. O tamanho
> mínimo é 25 caracteres."*

Cole o texto abaixo inteiro no campo **Descrição** da listagem.

```
O Controle de tickets é a ferramenta de registro do time de suporte nível 2 (L2) do Bling. Ela substitui o preenchimento manual da planilha de acompanhamento: em vez de alternar entre o ticket e o Google Sheets, copiando número, data e categorização campo por campo, você preenche um formulário único e a extensão grava a linha na planilha.

COMO FUNCIONA

1. Configure, uma única vez, o link da sua planilha do Google Sheets e o nome da aba onde as linhas devem ser gravadas. É você quem escolhe a planilha: a extensão não tem planilha própria nem servidor.
2. Abra a extensão com um ticket do suporte do Bling na tela. Número do ticket, data de abertura, classificação, responsáveis e categorização já vêm preenchidos a partir da página do ticket.
3. Complete o que é análise sua — causa, erro exibido ao cliente, observações, ação tomada e as checagens sobre o atendimento do nível 1.
4. Clique em "Cadastrar ticket" (ou use Ctrl + Enter). A extensão grava a linha na planilha, com data/hora e o seu e-mail na frente do registro, e limpa o formulário para o próximo ticket.

O QUE ELA FAZ

• Preenche o formulário a partir do ticket aberto, sem copiar e colar.
• Categorização em cascata — grupo, subgrupo, módulo e funcionalidade — com as opções já padronizadas pelo time, para que a planilha não acumule variações do mesmo nome.
• Modo "Retorno do L3": informe o número do ticket e o retorno recebido, e a extensão localiza a linha correspondente na planilha e completa só a coluna do retorno.
• Envio opcional do mesmo registro para uma segunda planilha, a da Base de Conhecimento.
• Indicador de campos obrigatórios, para você ver o que falta antes de enviar.
• Rascunho preservado: o que você digitou continua lá se a janela fechar antes do envio.
• Configuração guardada na sua conta do Chrome, então ela acompanha você em outra máquina e sobrevive à limpeza de cache.

PRIVACIDADE

A extensão não tem servidor. Os dados que você preenche vão apenas para a planilha do Google Sheets que você mesmo configurou, usando a API oficial do Google — nada é enviado para o desenvolvedor ou para terceiros. O acesso ao Google Sheets é feito pela sua própria conta Google, com a autorização que o Chrome pede na primeira vez, e o seu e-mail é gravado na planilha só para identificar quem fez cada registro. A política completa está em https://github.com/ygorkappaunbling/extensaoL2/blob/main/chrome-web-store/politica-de-privacidade.md

PARA QUEM É

Ferramenta interna de trabalho: ela só é útil para quem atende tickets no suporte do Bling e mantém uma planilha de acompanhamento desses tickets.
```

⚠️ Antes de colar, confirme que a URL da política de privacidade no fim do
texto é a mesma que você informou na aba **Práticas de privacidade**.

---

## Categoria

> Resolve: *"Selecione uma categoria para seu item."*

- **Categoria:** `Fluxo de trabalho e planejamento`
  (em inglês: *Workflow & Planning*)

É a categoria de ferramentas que organizam trabalho e registro de tarefas — o
que a extensão faz. Não escolha "Ferramentas para desenvolvedores": a análise
compara a categoria com a descrição, e uma categoria que não combina com o
texto costuma voltar como recusa.

---

## Idioma

> Resolve: *"Nenhum idioma foi selecionado."*

- **Idioma:** `Português (Brasil)`

A interface, a descrição e os dados de categorização são todos em português do
Brasil. Marque somente esse idioma — marcar idiomas em que a extensão não está
traduzida é motivo de recusa.

---

## Ícone do item

> Resolve: *"Imagem do ícone ausente."*

- Arquivo: [`assets/icone-loja-128.png`](assets/icone-loja-128.png)
- 128x128 PNG (é o mesmo ícone declarado no `manifest.json`)

---

## Capturas de tela

> Resolve: *"É necessário pelo menos uma captura de tela ou vídeo."*

Todas em 1280x800 PNG, que é um dos dois tamanhos aceitos (o outro é 640x400).
Envie na ordem abaixo — a primeira é a que aparece em destaque na loja.

| Ordem | Arquivo | Mostra |
| --- | --- | --- |
| 1 | [`assets/captura-1-registro-l2.png`](assets/captura-1-registro-l2.png) | O formulário completo de registro do ticket, preenchido |
| 2 | [`assets/captura-2-retorno-l3.png`](assets/captura-2-retorno-l3.png) | O modo de registro do retorno do L3 |
| 3 | [`assets/captura-3-configuracoes.png`](assets/captura-3-configuracoes.png) | A tela onde a pessoa informa a própria planilha |

As imagens foram geradas a partir da interface real da extensão, com dados de
exemplo fictícios (ticket 5566756, "Ana Souza", links de planilha inventados).
Não há nenhum dado de cliente real nem e-mail de pessoa real nelas.

---

## Outros campos da listagem

| Campo | O que informar |
| --- | --- |
| URL do site oficial (*Homepage*) | `https://github.com/ygorkappaunbling/extensaoL2` |
| URL de suporte | `https://github.com/ygorkappaunbling/extensaoL2/issues` |
| Visibilidade | `Não listado` ou `Privado` — é ferramenta interna do time; ninguém de fora tem uso para ela e a análise trata melhor uma ferramenta interna declarada como tal |
| Distribuição | Somente Chrome Web Store |
| Tile promocional / vídeo | Opcional, deixe em branco |
