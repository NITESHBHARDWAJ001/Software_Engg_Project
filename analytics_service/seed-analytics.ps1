# Quick seed script for analytics service
# Usage: .\seed-analytics.ps1
#        .\seed-analytics.ps1 -Reset
#        .\seed-analytics.ps1 -OrgIds "org1" "org2"

param(
    [switch]$Reset = $false,
    [string[]]$OrgIds = @()
)

$analyticsDir = Join-Path (Split-Path $PSScriptRoot) "analytics_service"
$envDir = Join-Path (Split-Path (Split-Path $PSScriptRoot)) "env"
$pythonExe = Join-Path $envDir "Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "❌ Python executable not found at $pythonExe" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Seeding analytics service..." -ForegroundColor Cyan

$cmd = @($pythonExe, "seed_all_analytics.py")

if ($Reset) {
    $cmd += "--reset"
    Write-Host "  [--reset] Existing data will be cleared" -ForegroundColor Yellow
}

if ($OrgIds.Count -gt 0) {
    $cmd += "--org-ids"
    $cmd += $OrgIds
    Write-Host "  [--org-ids] $($OrgIds -join ', ')" -ForegroundColor Yellow
}

Push-Location $analyticsDir

try {
    & $pythonExe seed_all_analytics.py $($cmd[2..($cmd.Count-1)])
    Write-Host "✅ Done!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
