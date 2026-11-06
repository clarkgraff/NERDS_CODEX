param([Parameter(Mandatory=$true)][string]$Python)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
Push-Location $taskRoot
try {
 $env:PYTHONPATH=(Join-Path $taskRoot 'work/preparation-build/deps')+';'+(Join-Path $taskRoot 'work/topology/python-deps')
 & $Python -m PyInstaller --noconfirm --onedir --name nerds-geography --distpath work/preparation-runtime --workpath work/preparation-build/build --specpath work/preparation-build --paths work/topology/python-deps --copy-metadata shapely --copy-metadata numpy scripts/prepare-water-areas.py
 if($LASTEXITCODE -ne 0){throw 'Geography runtime build failed'}
 Copy-Item -LiteralPath (Join-Path (Split-Path -Parent $Python) 'LICENSE.txt') -Destination work/preparation-runtime/nerds-geography/PYTHON-LICENSE.txt
} finally {Pop-Location}
