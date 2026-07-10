# 将根目录 asset/works 联接至 portWebsite/asset/works（同一份项目 md）
# 若 git pull 后联接消失，在仓库根目录重新运行：powershell -File scripts/link-asset-works.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$target = Join-Path $root "portWebsite\asset\works"
$link = Join-Path $root "asset\works"

if (-not (Test-Path $target)) {
  throw "Target not found: $target"
}

$item = Get-Item $link -ErrorAction SilentlyContinue
if ($item -and $item.LinkType -eq "Junction" -and $item.Target -contains $target) {
  Write-Host "Already linked: $link -> $target"
  exit 0
}

if (Test-Path $link) {
  Write-Host "Removing existing: $link"
  Remove-Item -Recurse -Force $link
}

$assetDir = Join-Path $root "asset"
if (-not (Test-Path $assetDir)) {
  New-Item -ItemType Directory -Path $assetDir | Out-Null
}

cmd /c mklink /J "$link" "$target"
Write-Host "Linked: $link -> $target"
