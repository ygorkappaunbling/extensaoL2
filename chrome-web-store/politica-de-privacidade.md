# Política de privacidade — onde ela está

A política de privacidade da extensão é a página **[`docs/index.html`](../docs/index.html)**,
publicada pelo GitHub Pages em:

```
https://ygorkappaunbling.github.io/extensaoL2/
```

É essa URL que vai no painel da Chrome Web Store.

## Por que uma página HTML, e não este arquivo

A loja valida a URL da política e exige uma **página pública, servida sem
login**. A URL de um arquivo dentro do GitHub
(`github.com/.../blob/main/....md`) não serve: aquilo é a interface do GitHub
exibindo um arquivo, não uma página publicada — o validador recusa com "o link
não é válido".

O GitHub Pages resolve isso servindo o `docs/index.html` como página de verdade,
em `ygorkappaunbling.github.io`.

## Como ligar o Pages

Uma vez só, nas configurações do repositório:

1. **Settings → Pages**
2. Em *Source*, escolha **Deploy from a branch**
3. Branch **`main`**, pasta **`/docs`**
4. **Save**

Em cerca de um minuto a página fica no ar. O endereço aparece na própria tela do
Pages.

## Como editar a política

Edite o `docs/index.html` e faça push para a `main` — o Pages republica sozinho.
O texto vive **somente** ali, de propósito: manter uma segunda cópia em Markdown
garantiria que uma das duas ficasse desatualizada, e a que a loja lê é a página.

Ao mudar a política, atualize também a data de "Última atualização" no topo da
página.
