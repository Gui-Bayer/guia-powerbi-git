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
- 16 ilustrações SVG próprias: telas do VS Code, GitHub, GitHub Desktop, Power BI Desktop e terminais
- Responsivo, acessível e com estilos de impressão

## Estrutura

```
guia-powerbi-git/
├── index.html              # todo o conteúdo do guia
├── assets/
│   ├── css/style.css       # design system, temas e componentes
│   ├── js/main.js          # JavaScript puro, sem dependências
│   └── img/*.svg           # 22 ilustrações e mockups de tela
├── tools/serve.ps1         # servidor HTTP local para testar o site
├── .nojekyll               # necessário para o GitHub Pages servir os assets
└── README.md
```

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
