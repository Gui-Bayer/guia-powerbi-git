# Guia Power BI + Git + GitHub + VS Code

Site de documentação estático que ensina analistas de dados e desenvolvedores Power BI a versionar
projetos **PBIP** com Git, GitHub e VS Code — da instalação inicial até a colaboração entre times.

## Conteúdo

| # | Capítulo |
|---|---|
| 1 | Introdução: Git, GitHub, VS Code, PBIP e a diferença entre PBIX e PBIP |
| 2 | Instalação e configuração inicial |
| 3 | Transformando um PBIP em projeto versionado |
| 4 | Criando repositório no GitHub |
| 5 | Clone e sincronização |
| 6 | Workflow completo de desenvolvimento |
| 7 | Branches (main, develop, feature, hotfix, release) |
| 8 | Pull Request |
| 9 | Merge (fast-forward, merge commit, conflito) |
| 10 | Resolução de conflitos |
| 11 | Colaboração entre desenvolvedores |
| 12 | Boas práticas para equipes Power BI |
| 13 | Publicação e entrega final |
| 14 | Comandos Git mais utilizados |
| 15 | Checklist final interativo |
| + | Recursos úteis |

## Recursos do site

- Tema claro e escuro, com detecção da preferência do sistema e persistência em `localStorage`
- Menu lateral fixo com destaque automático do capítulo em leitura e barra de progresso
- Busca instantânea em todo o conteúdo (`Ctrl+K` ou `/`), com navegação por teclado
- Botão **Copiar** em cada bloco de comando, que copia só os comandos e descarta a saída do terminal
- Fluxogramas interativos, linha do tempo do workflow e diagramas de branches
- Checklist final com progresso salvo no navegador
- Três idiomas com troca em tempo real: português (Brasil), inglês (EUA) e espanhol (México)
- 22 ilustrações SVG próprias: telas do VS Code, GitHub, GitHub Desktop, Power BI Desktop e terminais
- Responsivo, acessível e com estilos de impressão

## Estrutura

```
guia-powerbi-git/
├── index.html              # todo o conteúdo do guia
├── assets/
│   ├── css/style.css       # design system, temas e componentes
│   ├── js/main.js          # JavaScript puro, sem dependências
│   ├── i18n/*.json         # traduções: pt-BR, en-US, es-MX
│   └── img/*.svg           # 22 ilustrações e mockups de tela
├── tools/
│   ├── serve.ps1           # servidor HTTP local para testar o site
│   ├── i18n-annotate.ps1   # insere as chaves data-i18n no HTML
│   ├── i18n-extract.ps1    # gera o pt-BR.json a partir do HTML
│   └── i18n-check.ps1      # valida codificação e paridade de chaves
├── .nojekyll               # necessário para o GitHub Pages servir os assets
└── README.md
```

## Idiomas

O site está disponível em **português (Brasil)**, **inglês (EUA)** e **espanhol (México)**. A troca
acontece sem recarregar a página, pelo seletor no canto superior direito.

O idioma é escolhido nesta ordem de prioridade:

1. Parâmetro na URL — `?lang=en-US` (útil para compartilhar um link já traduzido)
2. Preferência salva no navegador (`localStorage`)
3. Idioma do navegador (`navigator.languages`), com correspondência por prefixo: `es-AR` cai em `es-MX`
4. Português, como padrão

### API

O módulo fica exposto em `window.I18n`:

```js
I18n.setLang('es-MX');        // troca o idioma, salva a preferência e reaplica a página
I18n.t('sec.merge.title');    // lê uma string traduzida
I18n.lang;                    // idioma atual, por exemplo "en-US"
I18n.supported;               // ['pt-BR', 'en-US', 'es-MX']

document.addEventListener('i18n:change', e => console.log(e.detail.lang));
```

### Como o conteúdo é marcado

Cada elemento traduzível carrega uma chave no HTML:

| Atributo | Efeito |
|---|---|
| `data-i18n="chave"` | substitui o texto do elemento |
| `data-i18n-html="chave"` | substitui o HTML interno (permite `<code>`, `<strong>`) |
| `data-i18n-attr="alt:chave\|aria-label:outra"` | substitui atributos, separados por `\|` |

As traduções ficam em `assets/i18n/<idioma>.json`, com chaves planas. Quando uma chave não existe no
idioma escolhido, o texto cai no português; se o JSON não carregar (por exemplo ao abrir o arquivo
direto com `file://`), o conteúdo original do HTML permanece intacto.

### Adicionando um idioma

1. Copie `assets/i18n/pt-BR.json` para `assets/i18n/<código>.json` e traduza os valores.
2. Acrescente o código em `SUPPORTED` e `SHORT` no `assets/js/main.js`.
3. Adicione a opção no `<ul id="langMenu">` do `index.html`.
4. Rode `tools/i18n-check.ps1` para conferir a paridade de chaves.

> Observação: o texto dentro das ilustrações SVG e o corpo dos capítulos seguem em português nesta
> etapa. A infraestrutura já suporta traduzi-los: basta acrescentar as chaves correspondentes.

## Como abrir localmente

Basta abrir o `index.html` no navegador. Para servir por HTTP (recomendado, para o botão de copiar
funcionar sem restrições):

```bash
# Python
python -m http.server 8000

# ou Node
npx serve .
```

Depois acesse <http://localhost:8000>.

## Publicando no GitHub Pages

1. Crie um repositório no GitHub e envie os arquivos:

   ```bash
   git remote add origin https://github.com/SEU-USUARIO/guia-powerbi-git.git
   git push -u origin main
   ```

2. No repositório, vá em **Settings → Pages**.
3. Em *Source*, selecione **Deploy from a branch**, branch `main` e pasta `/ (root)`.
4. Salve. Em cerca de um minuto o site fica disponível em
   `https://SEU-USUARIO.github.io/guia-powerbi-git/`.

## Tecnologias

HTML5, CSS moderno (custom properties, grid, `color-mix`) e JavaScript puro.
Única dependência externa: [Font Awesome 6](https://fontawesome.com) via CDN, usado para os ícones.

## Links oficiais de referência

- Git — <https://git-scm.com/doc>
- GitHub Docs — <https://docs.github.com>
- GitHub Flow — <https://docs.github.com/en/get-started/quickstart/github-flow>
- VS Code — <https://code.visualstudio.com/docs>
- Power BI — <https://learn.microsoft.com/power-bi>
- Git Ignore Generator — <https://www.toptal.com/developers/gitignore>
