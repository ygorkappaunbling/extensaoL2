"""Gera os .txt de copiar e colar a partir dos documentos em chrome-web-store/.

Os textos são extraídos dos blocos de código dos .md, e não redigitados, para
que os dois nunca divirjam.
"""

import os
import re

BASE = '/home/user/extensaoL2/chrome-web-store'
OUT = os.path.join(BASE, 'txt')


def blocos(arquivo):
    conteudo = open(os.path.join(BASE, arquivo), encoding='utf-8').read()
    return re.findall(r'```\n(.*?)\n```', conteudo, re.S)


listagem = blocos('listagem.md')
privacidade = blocos('praticas-de-privacidade.md')

# os blocos saem na ordem em que aparecem no documento
NOME, DESCRICAO_BREVE, DESCRICAO_DETALHADA = listagem[0], listagem[1], listagem[2]
URL_POLITICA = privacidade[0]
UNICO_PROPOSITO = privacidade[1]
IDENTITY, IDENTITY_EMAIL, HOST, SCRIPTING, STORAGE, TABS = privacidade[2:8]
CODIGO_REMOTO = privacidade[8]

# arquivos de colar: só o texto, nada além dele, para dar Ctrl+A / Ctrl+C
COLAR = {
    '01-listagem-descricao-detalhada.txt': DESCRICAO_DETALHADA,
    '03-privacidade-unico-proposito.txt': UNICO_PROPOSITO,
    '04-privacidade-justificativa-identity.txt': IDENTITY,
    '05-privacidade-justificativa-identity-email.txt': IDENTITY_EMAIL,
    '06-privacidade-justificativa-host.txt': HOST,
    '07-privacidade-justificativa-scripting.txt': SCRIPTING,
    '08-privacidade-justificativa-storage.txt': STORAGE,
    '09-privacidade-justificativa-tabs.txt': TABS,
    '10-privacidade-codigo-remoto.txt': CODIGO_REMOTO,
    '11-privacidade-url-politica.txt': URL_POLITICA,
}

# arquivos de instrução: campos que são seleção ou caixa de marcar, não texto
SELECAO = {
    '02-listagem-categoria-idioma-imagens.txt': f"""CAMPOS DE SELEÇÃO E UPLOAD DA ABA "LISTAGEM DA LOJA"
Aqui não há texto para colar: são escolhas e envios de arquivo.

------------------------------------------------------------
CATEGORIA
------------------------------------------------------------
Escolher: Fluxo de trabalho e planejamento
(em inglês: Workflow & Planning)

Não escolher "Ferramentas para desenvolvedores": a análise compara a
categoria com a descrição, e categoria que não combina com o texto
costuma voltar como recusa.

------------------------------------------------------------
IDIOMA
------------------------------------------------------------
Marcar somente: Português (Brasil)

Marcar idioma em que a extensão não está traduzida é motivo de recusa.

------------------------------------------------------------
ÍCONE DO ITEM
------------------------------------------------------------
Enviar o arquivo: icone-loja-128.png
Está em chrome-web-store/assets/ (128x128 PNG)

------------------------------------------------------------
CAPTURAS DE TELA
------------------------------------------------------------
Enviar os 3 arquivos, nesta ordem (todos 1280x800 PNG).
Estão em chrome-web-store/assets/

1) captura-1-registro-l2.png
2) captura-2-retorno-l3.png
3) captura-3-configuracoes.png

A primeira é a que aparece em destaque na loja.

------------------------------------------------------------
OUTROS CAMPOS DA MESMA ABA
------------------------------------------------------------
Nome:
Controle de tickets

Descrição breve:
já vem do manifest.json, o painel preenche sozinho

URL do site oficial:
https://github.com/ygorkappaunbling/extensaoL2

URL de suporte:
https://github.com/ygorkappaunbling/extensaoL2/issues

Visibilidade:
Não listado (ou Privado) - é ferramenta interna do time

Tile promocional / vídeo:
opcional, deixar em branco
""",
    '12-privacidade-uso-de-dados.txt': """DECLARAÇÕES DE USO DE DADOS - ABA "PRÁTICAS DE PRIVACIDADE"
Aqui não há texto para colar: são caixas de marcar.

Resolve o erro: "Para publicar seu item, o uso de dados precisa obedecer
às nossas Políticas do programa para desenvolvedores."

------------------------------------------------------------
PARTE 1 - O QUE A EXTENSÃO COLETA
------------------------------------------------------------
MARCAR (sim):

[x] Informações de identificação pessoal
    motivo: o e-mail da conta Google, gravado na planilha para
    identificar quem fez o registro

[x] Conteúdo do site
    motivo: os campos do ticket lidos da tela de suporte do Bling

NÃO MARCAR (todo o resto):

[ ] Informações de saúde
[ ] Informações financeiras e de pagamento
[ ] Informações de autenticação
    (o token OAuth é do próprio Google, usado na hora e não armazenado)
[ ] Comunicações pessoais
[ ] Localização
[ ] Histórico da Web
    (a extensão lê apenas o endereço da aba ativa, para comparar, e não
    guarda nada)
[ ] Atividade do usuário
    (não há cliques, movimentos de mouse nem métricas coletados)

------------------------------------------------------------
PARTE 2 - AS TRÊS CERTIFICAÇÕES
------------------------------------------------------------
MARCAR TODAS AS TRÊS:

[x] Não estou vendendo nem transferindo dados do usuário a terceiros,
    exceto nos casos de uso aprovados.
    (verdade: os dados vão somente para a planilha do Google Sheets da
    própria pessoa, pela API oficial do Google. Não há servidor do
    desenvolvedor.)

[x] Não estou usando nem transferindo dados do usuário para finalidades
    alheias ao único propósito do item.
    (verdade: os dados são usados apenas para gravar o registro do
    ticket na planilha configurada.)

[x] Não estou usando nem transferindo dados do usuário para determinar a
    capacidade de pagamento nem para fins de empréstimo.
    (verdade: não há nada disso na extensão.)
""",
}

LEIAME = """CONTROLE DE TICKETS - PREENCHIMENTO DA CHROME WEB STORE
=======================================================

Cada arquivo desta pasta corresponde a um campo do painel do
desenvolvedor. Os arquivos numerados de 01 a 12 estão na ordem de
preenchimento.

COMO USAR
---------
Nos arquivos de COLAR, o conteúdo é só o texto do campo - nada de
títulos ou explicações. Abra, Ctrl+A, Ctrl+C, e cole no painel.

Nos arquivos de SELEÇÃO, o conteúdo são instruções: o que escolher ou
marcar. Não há nada para colar.

ATENÇÃO: subir o pacote .zip NÃO preenche nenhum desses campos. O .zip é
só o código da extensão. Os 13 erros da loja são todos campos de
formulário, e cada um tem que ser preenchido à mão.

ABA "LISTAGEM DA LOJA"
----------------------
01-listagem-descricao-detalhada.txt ................ COLAR
     campo "Descrição"
     resolve: "A descrição detalhada é curta demais ou está ausente"

02-listagem-categoria-idioma-imagens.txt ........... SELEÇÃO
     categoria, idioma, ícone e capturas de tela
     resolve: "Selecione uma categoria", "Nenhum idioma foi
     selecionado", "Imagem do ícone ausente", "É necessário pelo menos
     uma captura de tela ou vídeo"

ABA "PRÁTICAS DE PRIVACIDADE"
-----------------------------
03-privacidade-unico-proposito.txt ................. COLAR
     campo "Único propósito"

04-privacidade-justificativa-identity.txt .......... COLAR
05-privacidade-justificativa-identity-email.txt .... COLAR
06-privacidade-justificativa-host.txt .............. COLAR
07-privacidade-justificativa-scripting.txt ......... COLAR
08-privacidade-justificativa-storage.txt ........... COLAR
09-privacidade-justificativa-tabs.txt .............. COLAR
     um campo de justificativa para cada permissão

10-privacidade-codigo-remoto.txt ................... COLAR
     Antes de colar, marcar a opção:
     "Não, não estou usando código remoto"
     O texto só é necessário se o painel pedir uma justificativa.

11-privacidade-url-politica.txt .................... COLAR
     campo da política de privacidade. Em muitas contas esse campo não
     fica no item, e sim na página "Conta" do painel - a URL vale para
     todas as suas extensões. Se a aba do item só mostrar um link
     apontando para "Conta", é lá que a URL entra.

12-privacidade-uso-de-dados.txt .................... SELEÇÃO
     o que a extensão coleta e as três certificações
     resolve: "o uso de dados precisa obedecer às nossas Políticas do
     programa para desenvolvedores"

DEPOIS DE PREENCHER TUDO
------------------------
1. Enviar o pacote .zip (com o manifest.json na RAIZ do zip, sem pasta
   envolvendo os arquivos).
2. Salvar rascunho.
3. Enviar para análise.

Os erros só desaparecem depois de salvar o rascunho com todos os campos
preenchidos.
"""


def escreve(nome, texto):
    caminho = os.path.join(OUT, nome)
    # CRLF: esses arquivos são abertos no Bloco de Notas do Windows, que
    # ignora quebra de linha sozinha e mostraria tudo em uma única linha
    with open(caminho, 'w', encoding='utf-8-sig', newline='\r\n') as f:
        f.write(texto.rstrip() + '\n')
    return caminho


os.makedirs(OUT, exist_ok=True)

escreve('00-LEIA-ME.txt', LEIAME)

for nome, texto in sorted(COLAR.items()):
    escreve(nome, texto)

for nome, texto in sorted(SELECAO.items()):
    escreve(nome, texto)

print('gerados em', OUT)
for nome in sorted(os.listdir(OUT)):
    caminho = os.path.join(OUT, nome)
    conteudo = open(caminho, encoding='utf-8-sig').read()
    print(f'  {nome:52} {len(conteudo):6} caracteres')
