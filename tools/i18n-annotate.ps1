# Insere chaves data-i18n no index.html sem reescrever o conteudo existente.
# Todo texto visivel e apenas capturado e reemitido; as traducoes vivem em assets/i18n/*.json.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$path = Join-Path $root 'index.html'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$html = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# Rodar de novo sobre um HTML ja anotado duplicaria as chaves.
if ($html.Contains('data-i18n=')) {
  Write-Host 'index.html ja esta anotado; nada a fazer.'
  Write-Host 'Para reanotar do zero, reverta o arquivo antes (git checkout -- index.html).'
  exit 0
}

$report = [ordered]@{}

function Note($name, $n) { $script:report[$name] = $n }

# ------------------------------------------------------------------- topbar
$n = 0
$html = [regex]::Replace($html, '(id="menuToggle") (aria-label=")', { param($m) $script:n++; $m.Groups[1].Value + ' data-i18n-attr="aria-label:ui.menu.aria" ' + $m.Groups[2].Value })
Note 'menuToggle' $n

$n = 0
$html = [regex]::Replace($html, '(<span class="brand__sub")(>)', { param($m) $script:n++; $m.Groups[1].Value + ' data-i18n="ui.brand.sub"' + $m.Groups[2].Value })
Note 'brand__sub' $n

$n = 0
$html = [regex]::Replace($html, '(placeholder=")([^"]*)(" aria-label=")([^"]*)(")', { param($m) $script:n++; 'data-i18n-attr="placeholder:ui.search.placeholder|aria-label:ui.search.aria" ' + $m.Groups[1].Value + $m.Groups[2].Value + $m.Groups[3].Value + $m.Groups[4].Value + $m.Groups[5].Value })
Note 'search input' $n

$n = 0
$html = [regex]::Replace($html, '(<div class="search__results" id="searchResults" role="listbox" aria-label=")([^"]*)(")', { param($m) $script:n++; '<div class="search__results" id="searchResults" role="listbox" data-i18n-attr="aria-label:ui.search.resultsAria" aria-label="' + $m.Groups[2].Value + '"' })
Note 'search results aria' $n

$n = 0
$html = [regex]::Replace($html, '(<nav class="topbar__links" aria-label=")([^"]*)(")', { param($m) $script:n++; '<nav class="topbar__links" data-i18n-attr="aria-label:ui.extLinks.aria" aria-label="' + $m.Groups[2].Value + '"' })
Note 'topbar links aria' $n

# seletor de idioma, inserido antes do botao de tema
$langHtml = @'
  <div class="lang" id="langSwitch">
    <button class="icon-btn lang__btn" id="langToggle" type="button" aria-haspopup="listbox" aria-expanded="false"
            data-i18n-attr="aria-label:ui.lang.aria" aria-label="Escolher idioma">
      <i class="fa-solid fa-language"></i><span class="lang__code" id="langCode">PT</span>
    </button>
    <ul class="lang__menu" id="langMenu" role="listbox" data-i18n-attr="aria-label:ui.lang.listAria" aria-label="Idiomas disponiveis">
      <li><button type="button" role="option" data-lang="pt-BR"><span class="lang__flag">BR</span> Portugu&#234;s (Brasil)</button></li>
      <li><button type="button" role="option" data-lang="en-US"><span class="lang__flag">US</span> English (United States)</button></li>
      <li><button type="button" role="option" data-lang="es-MX"><span class="lang__flag">MX</span> Espa&#241;ol (M&#233;xico)</button></li>
    </ul>
  </div>

'@
$anchor = '  <button class="icon-btn" id="themeToggle"'
if ($html.Contains('id="langSwitch"')) { Note 'lang switcher' 0 }
else {
  $i = $html.IndexOf($anchor)
  if ($i -lt 0) { throw 'ancora do themeToggle nao encontrada' }
  $html = $html.Substring(0, $i) + $langHtml + $html.Substring($i)
  Note 'lang switcher' 1
}

$n = 0
$html = [regex]::Replace($html, '(<button class="icon-btn" id="themeToggle" aria-label=")([^"]*)(")', { param($m) $script:n++; '<button class="icon-btn" id="themeToggle" data-i18n-attr="aria-label:ui.theme.aria" aria-label="' + $m.Groups[2].Value + '"' })
Note 'themeToggle aria' $n

# ------------------------------------------------------------------ sidebar
$n = 0
$html = [regex]::Replace($html, '(<span)(>Progresso da leitura</span>)', { param($m) $script:n++; '<span data-i18n="ui.progress.label"' + $m.Groups[2].Value })
Note 'progress label' $n

$n = 0
$html = [regex]::Replace($html, '(<nav aria-label=")([^"]*)(">\s*<p class="nav__group">)', { param($m) $script:n++; '<nav data-i18n-attr="aria-label:ui.nav.aria" aria-label="' + $m.Groups[2].Value + '"' + $m.Groups[3].Value.Substring($m.Groups[3].Value.IndexOf('>')) })
Note 'nav aria' $n

$groupKeys = @('nav.group.start', 'nav.group.daily', 'nav.group.reference')
$gi = 0
$html = [regex]::Replace($html, '(<p class="nav__group")(>)', { param($m) $k = $groupKeys[$script:gi]; $script:gi++; $m.Groups[1].Value + ' data-i18n="' + $k + '"' + $m.Groups[2].Value })
Note 'nav groups' $gi

$n = 0
$html = [regex]::Replace($html, '(<a class="nav__link" href="#([a-z\-]+)">(?:<span class="nav__num">\d+</span>|<i class="[^"]*"></i>)\s)([^<]+)(</a>)', { param($m) $script:n++; $m.Groups[1].Value + '<span data-i18n="nav.' + $m.Groups[2].Value + '">' + $m.Groups[3].Value + '</span>' + $m.Groups[4].Value })
Note 'nav links' $n

# --------------------------------------------------------------------- hero
$heroStart = $html.IndexOf('<section class="hero" id="inicio">')
$heroEnd = $html.IndexOf('</section>', $heroStart)
$hero = $html.Substring($heroStart, $heroEnd - $heroStart)

$n = 0
$hero = [regex]::Replace($hero, '(<span class="eyebrow"><i class="[^"]*"></i>\s)([^<]+)(</span>)', { param($m) $script:n++; $m.Groups[1].Value + '<span data-i18n="hero.eyebrow">' + $m.Groups[2].Value + '</span>' + $m.Groups[3].Value })
$hero = [regex]::Replace($hero, '(<h1)(>)', { param($m) $script:n++; '<h1 data-i18n="hero.title">' })
$hero = [regex]::Replace($hero, '(<p class="lead")(>)', { param($m) $script:n++; '<p class="lead" data-i18n-html="hero.lead">' })
$chipKeys = @('hero.chip.time', 'hero.chip.chapters')
$ci = 0
$hero = [regex]::Replace($hero, '(<span class="chip"><i class="[^"]*"></i>\s)([^<]+)(</span>)', { param($m) $k = $chipKeys[$script:ci]; $script:ci++; $m.Groups[1].Value + '<span data-i18n="' + $k + '">' + $m.Groups[2].Value + '</span>' + $m.Groups[3].Value })
$btnKeys = @('hero.btn.start', 'hero.btn.commands', 'hero.btn.checklist')
$bi = 0
$hero = [regex]::Replace($hero, '(<a class="btn btn--[a-z]+" href="#[a-z\-]+"><i class="[^"]*"></i>\s)([^<]+)(</a>)', { param($m) $k = $btnKeys[$script:bi]; $script:bi++; $m.Groups[1].Value + '<span data-i18n="' + $k + '">' + $m.Groups[2].Value + '</span>' + $m.Groups[3].Value })
$hero = [regex]::Replace($hero, '(<figcaption><i class="[^"]*"></i>)', { param($m) $script:n++; '<figcaption data-i18n-html="hero.caption"><i class="fa-solid fa-diagram-project"></i>' })
$html = $html.Substring(0, $heroStart) + $hero + $html.Substring($heroEnd)
Note 'hero (eyebrow/h1/lead/caption)' $n
Note 'hero chips' $ci
Note 'hero botoes' $bi

# ----------------------------------------------------------------- secoes
$starts = [regex]::Matches($html, '<section class="section reveal" id="([a-z\-]+)"')
$ids = @(); foreach ($m in $starts) { $ids += $m.Groups[1].Value }
$pos = @(); foreach ($m in $starts) { $pos += $m.Index }
$mainEnd = $html.IndexOf('</main>')
$out = $html.Substring(0, $pos[0])
$done = 0
for ($k = 0; $k -lt $pos.Count; $k++) {
  $from = $pos[$k]
  $to = if ($k + 1 -lt $pos.Count) { $pos[$k+1] } else { $mainEnd }
  $block = $html.Substring($from, $to - $from)
  $id = $ids[$k]

  $block = [regex]::Replace($block, '(\s)(data-label=")', { param($m) $m.Groups[1].Value + 'data-i18n-attr="data-label:sec.' + $id + '.label" ' + $m.Groups[2].Value }, 1)
  $block = [regex]::Replace($block, '(<span class="eyebrow"><i class="[^"]*"></i>\s)([^<]+)(</span>)', { param($m) $m.Groups[1].Value + '<span data-i18n="sec.' + $id + '.eyebrow">' + $m.Groups[2].Value + '</span>' + $m.Groups[3].Value }, 1)
  $block = [regex]::Replace($block, '(<h2 id="h-[a-z\-]+")(>)', { param($m) $m.Groups[1].Value + ' data-i18n="sec.' + $id + '.title"' + $m.Groups[2].Value }, 1)
  $block = [regex]::Replace($block, '(<p class="lead")(>)', { param($m) $m.Groups[1].Value + ' data-i18n-html="sec.' + $id + '.lead"' + $m.Groups[2].Value }, 1)

  $out += $block
  $done++
}
$out += $html.Substring($mainEnd)
$html = $out
Note 'secoes anotadas' $done

# -------------------------------------------------------------- checklist
$n = 0
$html = [regex]::Replace($html, '(<button class="btn btn--ghost" id="checkReset" type="button">\s*<i class="[^"]*"></i>\s)([^<\r\n]+)', { param($m) $script:n++; $m.Groups[1].Value + '<span data-i18n="checklist.reset">' + $m.Groups[2].Value.TrimEnd() + '</span>' })
Note 'checklist reset' $n

$n = 0
$html = [regex]::Replace($html, '(<input type="checkbox" id="ck(\d+)">\s*<span class="check__box"><i class="[^"]*"></i></span>\s*<span class="check__text">)([^<]+)(<span class="check__hint")', { param($m) $script:n++; $m.Groups[1].Value + '<span data-i18n="checklist.ck' + $m.Groups[2].Value + '.title">' + $m.Groups[3].Value.Trim() + '</span>' + "`r`n              " + '<span data-i18n-html="checklist.ck' + $m.Groups[2].Value + '.hint" class="check__hint"' })
Note 'checklist itens' $n

# ----------------------------------------------------------------- footer
$n = 0
$html = [regex]::Replace($html, '(<footer class="footer">\s*)(<span>)', { param($m) $script:n++; $m.Groups[1].Value + '<span data-i18n-html="footer.text">' })
Note 'footer texto' $n

$footKeys = @('footer.back', 'footer.commands', 'footer.checklist')
$fi = 0
$html = [regex]::Replace($html, '(<a href="#(?:inicio|comandos|checklist)")(>)([^<]+)(</a>)', { param($m) if ($script:fi -ge 3) { return $m.Value } $k = $footKeys[$script:fi]; $script:fi++; $m.Groups[1].Value + ' data-i18n="' + $k + '"' + $m.Groups[2].Value + $m.Groups[3].Value + $m.Groups[4].Value })
Note 'footer links' $fi

[System.IO.File]::WriteAllBytes($path, $utf8.GetBytes($html))

"=== anotacoes aplicadas ==="
foreach ($k in $report.Keys) { "{0,-34} {1}" -f $k, $report[$k] }
"total data-i18n       : " + ([regex]::Matches($html, 'data-i18n="')).Count
"total data-i18n-html  : " + ([regex]::Matches($html, 'data-i18n-html="')).Count
"total data-i18n-attr  : " + ([regex]::Matches($html, 'data-i18n-attr="')).Count
