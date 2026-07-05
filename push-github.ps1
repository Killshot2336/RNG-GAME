# Push Syndicate Block to GitHub
# Run once after: gh auth login

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$git = "C:\Program Files\Git\bin\git.exe"
$gh  = "C:\Program Files\GitHub CLI\gh.exe"

Write-Host "Checking GitHub login..."
& $gh auth status
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Not logged in. Run this first:"
  Write-Host "  gh auth login"
  Write-Host ""
  Write-Host "Then run this script again."
  exit 1
}

Write-Host "Creating GitHub repo and pushing..."
& $git branch -M main
& $gh repo create RNG-GAME --private --source=. --remote=origin --push

Write-Host ""
Write-Host "Done! Repo URL:"
& $gh repo view --web 2>$null
& $gh repo view --json url -q .url
