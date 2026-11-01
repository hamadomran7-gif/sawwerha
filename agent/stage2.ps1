# صوّرها — المرحلة 2: ملفات الوكيل + بيئة Python + التشغيل التلقائي
# يُشغَّل بعد انتهاء المرحلة 1 (ComfyUI + النماذج). يسحب الملفات من GitHub مباشرة.
# السجل: C:\Sawwerha\stage2.log — وعلامة النجاح: C:\Sawwerha\stage2.done
param(
  [string] $Repo = "hamadomran7-gif/sawwerha",
  [string] $Branch = "main",
  [string] $Root = "C:\Sawwerha",
  [string] $Token = ""   # رمز GitHub إن كان المستودع خاصاً (اختياري)
)
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
New-Item -ItemType Directory -Force -Path $Root | Out-Null
Remove-Item (Join-Path $Root "stage2.done") -ErrorAction SilentlyContinue
Start-Transcript -Path (Join-Path $Root "stage2.log") -Append | Out-Null

function Find-Python {
  $ErrorActionPreference = "SilentlyContinue"
  $cands = @(
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python311\python.exe"),
    "C:\Program Files\Python311\python.exe",
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python312\python.exe"),
    "C:\Program Files\Python312\python.exe",
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python310\python.exe"),
    "C:\Program Files\Python310\python.exe"
  )
  foreach ($c in $cands) { if (Test-Path $c) { return $c } }
  foreach ($v in "-3.11", "-3.12", "-3.10", "-3") {
    $p = cmd /c "py $v -c ""import sys;print(sys.executable)"" 2>nul"
    if ($p -and (Test-Path $p.Trim())) { return $p.Trim() }
  }
  return $null
}

try {
  foreach ($d in "agent", "workflows", "work", "dl") { New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null }

  # [1/4] ملفات الوكيل من GitHub
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

  # [2/4] Python + البيئة الافتراضية
  $python = Find-Python
  if (-not $python) {
    Write-Host "Python not found - installing Python 3.11.9 (per-user, no admin)"
    $inst = Join-Path $Root "dl\python-3.11.9-amd64.exe"
    Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe" -OutFile $inst -UseBasicParsing
    Start-Process -FilePath $inst -ArgumentList "/quiet", "InstallAllUsers=0", "PrependPath=1", "Include_launcher=1", "Include_test=0" -Wait
    $python = Find-Python
    if (-not $python) { throw "Python installation failed" }
  }
  Write-Host "python: $python"
  Set-Location (Join-Path $Root "agent")
  if (-not (Test-Path ".venv\Scripts\python.exe")) { & $python -m venv .venv }
  $ErrorActionPreference = "Continue"
  & .\.venv\Scripts\python.exe -m pip install --upgrade pip
  & .\.venv\Scripts\python.exe -m pip install -r requirements.txt
  if ($LASTEXITCODE -ne 0) { throw "pip install failed (exit $LASTEXITCODE)" }
  & .\.venv\Scripts\python.exe -c "import requests, PIL, rembg, onnxruntime; print('deps ok, onnxruntime', onnxruntime.__version__, onnxruntime.get_available_providers())"
  if ($LASTEXITCODE -ne 0) { throw "dependency check failed" }
  $ErrorActionPreference = "Stop"
  Write-Host "[2/4] python env ready"

  # [3/4] الإعدادات + ملفات التشغيل + مهام بدء التشغيل
  if (-not (Test-Path "config.json")) {
    $cfg = [ordered]@{ worker_url = "REPLACE_WORKER_URL"; agent_token = "REPLACE_AGENT_TOKEN"; comfy_url = "http://127.0.0.1:8188"; poll_seconds = 20; dry_run = $false; work_dir = (Join-Path $Root "work"); output_size = 2000; lifestyle_size = 1328; edit_mode = "edit"; watermark_samples = $true; watermark_text = "Sawwerha"; max_job_minutes = 60 }
    $cfg | ConvertTo-Json | Set-Content "config.json" -Encoding UTF8
  }
  $comfyBat = "@echo off`r`ncd /d $Root\ComfyUI`r`n:loop`r`n.\python_embeded\python.exe -s ComfyUI\main.py --listen 127.0.0.1 --port 8188 --disable-auto-launch`r`ntimeout /t 30 /nobreak >nul`r`ngoto loop`r`n"
  $agentBat = "@echo off`r`ncd /d $Root\agent`r`ntimeout /t 60 /nobreak >nul`r`n:loop`r`n.\.venv\Scripts\python.exe agent.py`r`ntimeout /t 30 /nobreak >nul`r`ngoto loop`r`n"
  Set-Content (Join-Path $Root "run_comfy.bat") $comfyBat -Encoding ASCII
  Set-Content (Join-Path $Root "run_agent.bat") $agentBat -Encoding ASCII
  $ErrorActionPreference = "Continue"
  schtasks /Create /F /TN "Sawwerha-ComfyUI" /SC ONLOGON /TR "`"$Root\run_comfy.bat`""
  schtasks /Create /F /TN "Sawwerha-Agent" /SC ONLOGON /TR "`"$Root\run_agent.bat`""
  schtasks /Query /TN "Sawwerha-ComfyUI"
  schtasks /Query /TN "Sawwerha-Agent"
  $ErrorActionPreference = "Stop"
  Write-Host "[3/4] launchers + startup tasks created"

  # [4/4] علامة النجاح
  Set-Content (Join-Path $Root "stage2.done") ("DONE " + (Get-Date -Format "yyyy-MM-dd HH:mm") + " python=" + $python)
  Write-Host "[4/4] Stage 2 finished."
}
catch {
  Write-Host "STAGE2 FAILED: $($_.Exception.Message)"
  Write-Host $_.ScriptStackTrace
  exit 1
}
finally {
  Stop-Transcript | Out-Null
}
