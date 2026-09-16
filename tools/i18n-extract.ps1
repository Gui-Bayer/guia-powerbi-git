# Gera assets/i18n/pt-BR.json a partir do texto ja presente no index.html.
# O conteudo e apenas copiado do HTML para o JSON, sem transcricao manual.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$html = [System.IO.File]::ReadAllText((Join-Path $root 'index.html'), [System.Text.Encoding]::UTF8)

$pairs = [ordered]@{}

function Add-Pair($key, $value) {
  if ([string]::IsNullOrWhiteSpace($value)) { Write-Host "AVISO valor vazio: $key"; return }
  $v = [regex]::Replace($value, '\s+', ' ').Trim()
  if ($script:pairs.Contains($key)) { Write-Host "AVISO chave repetida: $key" }
  $script:pairs[$key] = $v
}

# ------------------------------------------------------------------ <head>
$m = [regex]::Match($html, '<title>([\s\S]*?)</title>')
if ($m.Success) { Add-Pair 'meta.title' $m.Groups[1].Value }
$m = [regex]::Match($html, '<meta name="description" content="([^"]*)"')
if ($m.Success) { Add-Pair 'meta.description' $m.Groups[1].Value }
$m = [regex]::Match($html, '<meta property="og:title" content="([^"]*)"')
if ($m.Success) { Add-Pair 'meta.ogTitle' $m.Groups[1].Value }
$m = [regex]::Match($html, '<meta property="og:description" content="([^"]*)"')
if ($m.Success) { Add-Pair 'meta.ogDescription' $m.Groups[1].Value }

# ------------------------------------------------- data-i18n (textContent)
foreach ($mm in [regex]::Matches($html, '<(\w+)([^>]*?)data-i18n="([^"]+)"([^>]*)>([^<]*)</\1>')) {
  Add-Pair $mm.Groups[3].Value $mm.Groups[5].Value
}

# --------------------------------------------------- data-i18n-html (HTML)
foreach ($mm in [regex]::Matches($html, '<(\w+)([^>]*?)data-i18n-html="([^"]+)"([^>]*)>([\s\S]*?)</\1>')) {
  Add-Pair $mm.Groups[3].Value $mm.Groups[5].Value
}

# ------------------------------------------------ data-i18n-attr (atributos)
foreach ($mm in [regex]::Matches($html, '<\w+[^>]*data-i18n-attr="([^"]+)"[^>]*>')) {
  $tag = $mm.Value
  foreach ($spec in $mm.Groups[1].Value -split '\|') {
    $cut = $spec.IndexOf(':')
    if ($cut -lt 0) { continue }
    $attr = $spec.Substring(0, $cut).Trim()
    $key  = $spec.Substring($cut + 1).Trim()
    $am = [regex]::Match($tag, '(?<![\w-])' + [regex]::Escape($attr) + '="([^"]*)"')
    if ($am.Success) { Add-Pair $key $am.Groups[1].Value } else { Write-Host "AVISO atributo ausente: $attr ($key)" }
  }
}

# --------------------------------------- chaves usadas somente pelo main.js
# Os dois valores com acento usam escape \u para o script seguir em ASCII.
Add-Pair 'ui.copy.label' 'Copiar'
Add-Pair 'ui.copy.done'  'Copiado!'
Add-Pair 'ui.copy.aria'  'Copiar comando'
Add-Pair 'ui.theme.toLight' 'Ativar tema claro'
Add-Pair 'ui.theme.toDark'  'Ativar tema escuro'
Add-Pair 'ui.theme.light'   'Tema claro'
Add-Pair 'ui.theme.dark'    'Tema escuro'
Add-Pair 'ui.anchor.aria'   ('Link para esta se' + [char]0xE7 + [char]0xE3 + 'o')
Add-Pair 'ui.search.empty'  'Nenhum resultado para "{query}".'
Add-Pair 'ui.search.hint'   'Tente <code>commit</code>, <code>branch</code>, <code>pbip</code> ou <code>conflito</code>.'
Add-Pair 'checklist.count'  ('{done} de {total} conclu' + [char]0xED + 'dos')

# ------------------------------------------------------------ grava o JSON
function Esc($s) {
  $sb = New-Object System.Text.StringBuilder
  foreach ($ch in $s.ToCharArray()) {
    $c = [int]$ch
    switch ($ch) {
      '"'  { [void]$sb.Append('\"') }
      '\'  { [void]$sb.Append('\\') }
      "`n" { [void]$sb.Append('\n') }
      "`r" { [void]$sb.Append('\r') }
      "`t" { [void]$sb.Append('\t') }
      default {
        if ($c -lt 32) { [void]$sb.Append(('\u{0:x4}' -f $c)) } else { [void]$sb.Append($ch) }
      }
    }
  }
  $sb.ToString()
}

$dir = Join-Path $root 'assets\i18n'
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('{')
$keys = @($pairs.Keys)
for ($i = 0; $i -lt $keys.Count; $i++) {
  $comma = if ($i -lt $keys.Count - 1) { ',' } else { '' }
  $lines.Add('  "' + (Esc $keys[$i]) + '": "' + (Esc $pairs[$keys[$i]]) + '"' + $comma)
}
$lines.Add('}')

$utf8 = New-Object System.Text.UTF8Encoding($false)
$out = Join-Path $dir 'pt-BR.json'
[System.IO.File]::WriteAllBytes($out, $utf8.GetBytes(($lines -join "`r`n") + "`r`n"))

"chaves extraidas: " + $keys.Count
"arquivo: assets/i18n/pt-BR.json (" + [math]::Round((Get-Item $out).Length / 1KB, 1) + " KB)"
"--- grupos ---"
$keys | ForEach-Object { ($_ -split '\.')[0] } | Group-Object | Sort-Object Name | ForEach-Object { "  {0,-12} {1}" -f $_.Name, $_.Count }
