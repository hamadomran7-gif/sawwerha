# صوّرها — المرحلة 2: ملفات الوكيل + بيئة Python + التشغيل التلقائي
# يُشغَّل بعد انتهاء المرحلة 1 (ComfyUI + النماذج). يسحب الملفات من GitHub مباشرة.
param(
  [string] $Repo = "hamadomran7-gif/sawwerha",
  [string] $Branch = "main",
  [string] $Root = "C:\Sawwerha",
  [string] $Token = ""   # رمز GitHub للمستودع الخاص (يُمرَّر من المرحلة 2 bat)
)
$ErrorActionPreference = "Stop"
foreach ($d in "agent", "workflows", "work", "dl") { New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null }
$files = @("agent/agent.py", "agent/comfy.py", "agent/pipeline.py", "agent/prompts.json", "agent/requirements.txt", "workflows/qwen_image_edit_api.json")
$headers = @{}
if ($Token) { $headers["Authorization"] = "token $Token" }
foreach ($f in $files) {
  $url = "https://raw.githubusercontent.com/$Repo/$Branch/$f"
  $dest = Join-Path $Root ($f -replace "/", "\")
  Write-Host "fetch $f"
  Invoke-WebRequest -Uri $url -Headers $headers -OutFile $dest -UseBasicParsing
}
Write-Host "[1/4] agent files fetched"
Set-Location (Join-Path $Root "agent")
if (-not (Test-Path ".venv")) {
  if (Get-Command py -ErrorAction SilentlyContinue) { py -3.11 -m venv .venv } else { python -m venv .venv }
}
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Write-Host "[2/4] python env ready"
if (-not (Test-Path "config.json")) {
  $cfg = [ordered]@{ worker_url = "REPLACE_WORKER_URL"; agent_token = "REPLACE_AGENT_TOKEN"; comfy_url = "http://127.0.0.1:8188"; poll_seconds = 20; dry_run = $false; work_dir = (Join-Path $Root "work"); output_size = 2000; lifestyle_size = 1328; edit_mode = "edit"; watermark_samples = $true; watermark_text = "Sawwerha"; max_job_minutes = 60 }
  $cfg | ConvertTo-Json | Set-Content "config.json" -Encoding UTF8
}
Set-Content (Join-Path $Root "run_comfy.bat") "@echo off`r`ncd /d $Root\ComfyUI`r`n.\python_embeded\python.exe -s ComfyUI\main.py --listen 127.0.0.1 --port 8188 --disable-auto-launch" -Encoding ASCII
Set-Content (Join-Path $Root "run_agent.bat") "@echo off`r`ncd /d $Root\agent`r`ntimeout /t 60 /nobreak >nul`r`n.\.venv\Scripts\python.exe agent.py" -Encoding ASCII
schtasks /Create /F /TN "Sawwerha-ComfyUI" /SC ONLOGON /RL HIGHEST /TR "`"$Root\run_comfy.bat`"" | Out-Null
schtasks /Create /F /TN "Sawwerha-Agent" /SC ONLOGON /RL HIGHEST /TR "`"$Root\run_agent.bat`"" | Out-Null
Write-Host "[3/4] launchers + startup tasks created"
Set-Content (Join-Path $Root "stage2.done") "DONE"
Write-Host "[4/4] Stage 2 finished."
