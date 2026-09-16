# Normaliza os JSON de traducao para UTF-8 sem BOM e confere a paridade de chaves.
# O editor grava em Windows-1252; esta etapa reconverte para UTF-8 antes de validar.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$dir  = Join-Path $root 'assets\i18n'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$strict = New-Object System.Text.UTF8Encoding($false, $true)
$cp1252 = [System.Text.Encoding]::GetEncoding(1252)

foreach ($file in Get-ChildItem (Join-Path $dir '*.json')) {
  $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
  try {
    [void]$strict.GetString($bytes)
    "{0,-12} ja estava em UTF-8" -f $file.Name
  } catch {
    $text = $cp1252.GetString($bytes)
    [System.IO.File]::WriteAllBytes($file.FullName, $utf8.GetBytes($text))
    "{0,-12} convertido de Windows-1252 para UTF-8" -f $file.Name
  }
}

""
$base = $null
$dicts = [ordered]@{}
foreach ($file in Get-ChildItem (Join-Path $dir '*.json')) {
  $text = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
  try { $json = $text | ConvertFrom-Json } catch { "ERRO de JSON em $($file.Name): $($_.Exception.Message)"; continue }
  $map = @{}
  foreach ($prop in $json.PSObject.Properties) { $map[$prop.Name] = $prop.Value }
  $dicts[$file.BaseName] = $map
  if ($file.BaseName -eq 'pt-BR') { $base = $map }
}

if (-not $base) { throw 'pt-BR.json nao encontrado' }

"idioma       chaves  faltando  sobrando  U+FFFD  iguais ao pt-BR"
foreach ($lang in $dicts.Keys) {
  $map = $dicts[$lang]
  $missing = @($base.Keys | Where-Object { -not $map.ContainsKey($_) })
  $extra   = @($map.Keys  | Where-Object { -not $base.ContainsKey($_) })
  $bad     = @($map.Keys  | Where-Object { $map[$_] -match [char]0xFFFD })
  $same    = @($base.Keys | Where-Object { $map.ContainsKey($_) -and $map[$_] -ceq $base[$_] })
  "{0,-12} {1,6}  {2,8}  {3,8}  {4,6}  {5}" -f $lang, $map.Count, $missing.Count, $extra.Count, $bad.Count, $same.Count
  foreach ($k in $missing) { "    faltando: $k" }
  foreach ($k in $extra)   { "    sobrando: $k" }
  foreach ($k in $bad)     { "    corrompido: $k" }
}

""
"--- placeholders obrigatorios ---"
$required = @{ 'ui.search.empty' = '{query}'; 'checklist.count' = '{done}' }
foreach ($lang in $dicts.Keys) {
  foreach ($k in $required.Keys) {
    $v = $dicts[$lang][$k]
    if ($v -and -not $v.Contains($required[$k])) { "  FALTA $($required[$k]) em $lang / $k" }
  }
}
"  verificado"

""
"--- entidades HTML em valores usados como atributo ---"
$attrKeys = @('ui.menu.aria','ui.search.placeholder','ui.search.aria','ui.search.resultsAria','ui.extLinks.aria','ui.lang.aria','ui.lang.listAria','ui.theme.aria','ui.nav.aria','ui.copy.aria','ui.anchor.aria')
$attrKeys += @($base.Keys | Where-Object { $_ -like 'sec.*.label' })
$found = 0
foreach ($lang in $dicts.Keys) {
  foreach ($k in $attrKeys) {
    $v = $dicts[$lang][$k]
    if ($v -and $v -match '&[a-zA-Z]+;|&#\d+;') { "  ENTIDADE em $lang / $k : $v"; $found++ }
  }
}
if ($found -eq 0) { "  nenhuma (correto: atributos nao interpretam entidades)" }
