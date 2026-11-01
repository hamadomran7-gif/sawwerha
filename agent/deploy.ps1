# Sawwerha - Deploy: Cloudflare Worker (bot) + D1 + R2 + secrets + Pages (sites)
# Reads C:\Sawwerha\secrets\deploy.env (KEY=VALUE). Log: C:\Sawwerha\deploy.log. Result: C:\Sawwerha\deploy.done
param([string] $Root = "C:\Sawwerha", [string] $Repo = "hamadomran7-gif/sawwerha")
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Remove-Item (Join-Path $Root "deploy.done") -ErrorAction SilentlyContinue
Start-Transcript -Path (Join-Path $Root "deploy.log") -Append | Out-Null
try {
  $envFile = Join-Path $Root "secrets\deploy.env"
  if (-not (Test-Path $envFile)) { throw "missing $envFile" }
  $S = @{}
  foreach ($line in Get-Content $envFile) {
    $t = $line.Trim()
    if ($t -eq "" -or $t.StartsWith("#")) { continue }
    $i = $t.IndexOf("=")
    if ($i -gt 0) { $S[$t.Substring(0, $i).Trim()] = $t.Substring($i + 1).Trim() }
  }
  if (-not $S["CLOUDFLARE_API_TOKEN"]) { throw "CLOUDFLARE_API_TOKEN missing in deploy.env" }
  $env:CLOUDFLARE_API_TOKEN = $S["CLOUDFLARE_API_TOKEN"]
  $env:WRANGLER_SEND_METRICS = "false"
  $env:CI = "true"
  $hdr = @{ Authorization = "Bearer " + $S["CLOUDFLARE_API_TOKEN"]; "Content-Type" = "application/json" }
  $api = "https://api.cloudflare.com/client/v4"

  # [1/8] account
  $acct = $S["CLOUDFLARE_ACCOUNT_ID"]
  if (-not $acct) { $acct = (Invoke-RestMethod -Uri "$api/accounts" -Headers $hdr -UseBasicParsing).result[0].id }
  $env:CLOUDFLARE_ACCOUNT_ID = $acct
  Write-Host "[1/8] account $acct"

  # [2/8] portable node
  $nodeDir = Join-Path $Root "node"
  $node = Join-Path $nodeDir "node.exe"
  if (-not (Test-Path $node)) {
    $sums = (Invoke-WebRequest -Uri "https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt" -UseBasicParsing).Content
    $m = [regex]::Match($sums, "node-v22\.\d+\.\d+-win-x64\.zip")
    if (-not $m.Success) { throw "node zip name not found" }
    $zipName = $m.Value
    $zip = Join-Path $Root "dl\$zipName"
    Invoke-WebRequest -Uri "https://nodejs.org/dist/latest-v22.x/$zipName" -OutFile $zip -UseBasicParsing
    tar -xf $zip -C $Root
    Rename-Item (Join-Path $Root ($zipName -replace "\.zip$", "")) "node"
  }
  $env:Path = "$nodeDir;" + $env:Path
  Write-Host ("[2/8] node " + (& $node -v))

  # [3/8] repo snapshot
  $repoZip = Join-Path $Root "dl\repo.zip"
  Invoke-WebRequest -Uri "https://github.com/$Repo/archive/refs/heads/main.zip" -OutFile $repoZip -UseBasicParsing
  $repoDir = Join-Path $Root "repo"
  if (Test-Path $repoDir) { Remove-Item $repoDir -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $repoDir | Out-Null
  tar -xf $repoZip -C $repoDir --strip-components=1
  Write-Host "[3/8] repo fetched"

  # [4/8] wrangler
  $tools = Join-Path $Root "tools"
  New-Item -ItemType Directory -Force -Path $tools | Out-Null
  Set-Location $tools
  $ErrorActionPreference = "Continue"
  if (-not (Test-Path "node_modules\wrangler")) {
    & "$nodeDir\npm.cmd" init -y | Out-Null
    & "$nodeDir\npm.cmd" install wrangler@4 --no-audit --no-fund
  }
  $wr = Join-Path $tools "node_modules\.bin\wrangler.cmd"
  Write-Host ("[4/8] wrangler " + (& $wr --version 2>&1 | Select-Object -Last 1))

  # [5/8] workers.dev subdomain
  $subdomain = $null
  try { $subdomain = (Invoke-RestMethod -Uri "$api/accounts/$acct/workers/subdomain" -Headers $hdr -UseBasicParsing).result.subdomain } catch {}
  if (-not $subdomain) {
    foreach ($cand in @("sawwerha", "sawwerha-ae", ("sawwerha-" + (Get-Random -Maximum 9999)))) {
      try {
        $r = Invoke-RestMethod -Method Put -Uri "$api/accounts/$acct/workers/subdomain" -Headers $hdr -Body (@{ subdomain = $cand } | ConvertTo-Json) -UseBasicParsing
        if ($r.success) { $subdomain = $cand; break }
      } catch { Write-Host "subdomain $cand not available" }
    }
  }
  Write-Host "[5/8] workers.dev subdomain: $subdomain"

  # [6/8] D1 + R2 + schema
  Set-Location (Join-Path $repoDir "bot")
  function Get-D1 {
    $raw = (& $wr d1 list --json 2>$null | Out-String)
    $k = $raw.IndexOf("[")
    if ($k -lt 0) { return $null }
    return ($raw.Substring($k) | ConvertFrom-Json) | Where-Object { $_.name -eq "sawwerha" } | Select-Object -First 1
  }
  $db = Get-D1
  if (-not $db) {
    & $wr d1 create sawwerha
    $db = Get-D1
  }
  if (-not $db) { throw "D1 database not created" }
  $dbId = $db.uuid
  $tomlPath = Join-Path (Get-Location) "wrangler.toml"
  $toml = [IO.File]::ReadAllText($tomlPath, [Text.Encoding]::UTF8)
  [IO.File]::WriteAllText($tomlPath, $toml.Replace("REPLACE_WITH_D1_ID", $dbId), (New-Object Text.UTF8Encoding $false))
  & $wr r2 bucket create sawwerha-media
  & $wr d1 execute sawwerha --remote --file schema.sql -y
  Write-Host "[6/8] D1 $dbId + R2 + schema"

  # [7/8] deploy worker + secrets
  foreach ($n in "AGENT_TOKEN", "WA_VERIFY_TOKEN") {
    if (-not $S[$n]) { $S[$n] = -join ((48..57) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ }); Add-Content $envFile "$n=$($S[$n])" }
  }
  & $wr deploy
  if ($LASTEXITCODE -ne 0) { throw "wrangler deploy failed" }
  $workerUrl = "https://sawwerha-bot.$subdomain.workers.dev"
  $sec = @{}
  foreach ($n in "WA_TOKEN", "WA_PHONE_ID", "WA_VERIFY_TOKEN", "WA_APP_SECRET", "AGENT_TOKEN", "OWNER_PHONE", "ZIINA_API_KEY", "ANTHROPIC_API_KEY") { if ($S[$n]) { $sec[$n] = $S[$n] } }
  $secFile = Join-Path $Root "secrets\bulk.json"
  $sec | ConvertTo-Json | Set-Content $secFile -Encoding ASCII
  & $wr secret bulk $secFile
  Remove-Item $secFile -ErrorAction SilentlyContinue
  Write-Host "[7/8] worker deployed: $workerUrl"

  # [8/8] sites on Pages + agent config
  Set-Location (Join-Path $repoDir "mustahaqati")
  & $node build.js
  & $wr pages project create mustahaqati --production-branch main
  & $wr pages deploy dist --project-name mustahaqati --commit-dirty=true
  Set-Location (Join-Path $repoDir "web")
  if ($S["WA_NUMBER"]) {
    $ix = Join-Path (Get-Location) "index.html"
    $h = [IO.File]::ReadAllText($ix, [Text.Encoding]::UTF8)
    [IO.File]::WriteAllText($ix, $h.Replace("971XXXXXXXXX", $S["WA_NUMBER"]), (New-Object Text.UTF8Encoding $false))
  }
  & $wr pages project create sawwerha --production-branch main
  & $wr pages deploy . --project-name sawwerha --commit-dirty=true
  $ErrorActionPreference = "Stop"
  $cfgPath = Join-Path $Root "agent\config.json"
  if (Test-Path $cfgPath) {
    $cfg = Get-Content $cfgPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $cfg.worker_url = $workerUrl
    $cfg.agent_token = $S["AGENT_TOKEN"]
    $cfg | ConvertTo-Json | Set-Content $cfgPath -Encoding UTF8
  }
  $health = "n/a"
  try { $health = (Invoke-WebRequest -Uri "$workerUrl/health" -UseBasicParsing).StatusCode } catch { $health = "ERR " + $_.Exception.Message }
  $summary = "WORKER_URL=$workerUrl`r`nWEBHOOK_URL=$workerUrl/webhook`r`nHEALTH=$health`r`nWA_VERIFY_TOKEN=$($S['WA_VERIFY_TOKEN'])`r`nMUSTAHAQATI=https://mustahaqati.pages.dev`r`nSAWWERHA=https://sawwerha.pages.dev`r`nDONE " + (Get-Date -Format "yyyy-MM-dd HH:mm")
  Set-Content (Join-Path $Root "deploy.done") $summary -Encoding ASCII
  Write-Host "[8/8] done"
  Write-Host $summary
}
catch {
  Write-Host "DEPLOY FAILED: $($_.Exception.Message)"
  Write-Host $_.ScriptStackTrace
  exit 1
}
finally {
  Stop-Transcript | Out-Null
}
