param(
  [string]$SourceDir = "dist",
  [string]$OutputDir = "artifacts",
  [string]$BaseName = "delayo-chrome-web-store",
  [string]$Version = "",
  [string]$GithubOutput = ""
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SourceDir)) {
  throw "Source directory '$SourceDir' was not found."
}

if ([string]::IsNullOrWhiteSpace($Version)) {
  $packageJson = Get-Content -LiteralPath "package.json" -Raw | ConvertFrom-Json
  $Version = $packageJson.version
}

if ([string]::IsNullOrWhiteSpace($Version)) {
  throw "Could not determine the release version."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$archiveName = "$BaseName-$Version.zip"
$archivePath = Join-Path $OutputDir $archiveName

if (Test-Path -LiteralPath $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}

$sourcePattern = Join-Path $SourceDir "*"
Compress-Archive -Path $sourcePattern -DestinationPath $archivePath -CompressionLevel Optimal

$resolvedArchivePath = [System.IO.Path]::GetFullPath($archivePath)
Write-Host "Created release archive at $resolvedArchivePath"

if (-not [string]::IsNullOrWhiteSpace($GithubOutput)) {
  Add-Content -LiteralPath $GithubOutput -Value "archive_name=$archiveName"
  Add-Content -LiteralPath $GithubOutput -Value "archive_path=$resolvedArchivePath"
}
