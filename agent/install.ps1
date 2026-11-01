<#
  صوّرها — تثبيت وكيل الإنتاج على ويندوز (RTX 4090)
  يُشغَّل من PowerShell كمسؤول:
    Set-ExecutionPolicy -Scope Process Bypass -Force
    .\install.ps1 -WorkerUrl "https://sawwerha-bot.XXX.workers.dev" -AgentToken "SECRET"

  ماذا يفعل:
   1) يثبّت Python 3.11 و7-Zip إن لزم (winget)
   2) ينزّل ComfyUI (النسخة المحمولة) إلى C:\Sawwerha\ComfyUI
   3) ينزّل نماذج Qwen-Image-Edit (ترخيص Apache-2.0) إلى مجلدات ComfyUI
   4) يجهّز بيئة Python للوكيل ويثبّت rembg (BiRefNet-general)
   5) ينشئ ملفات التشغيل ويسجّلها لتعمل تلقائياً عند تسجيل الدخول
#>
param(
  [Parameter(Mandatory = $true)] [string] $WorkerUrl,
  [Parameter(Mandatory = $true)] [string] $AgentToken,
  [string] $Root = "C:\Sawwerha"
)
$ErrorActionPreference = "Stop"
$agentSrc = $PSScriptRoot
$comfy = Join-Path $Root "ComfyUI"
$agentDir = Join-Path $Root "agent"

function Need($cmd) { -not (Get-Command $cmd -ErrorAction SilentlyContinue) }
function Download($url, $dest) {
  if (Test-Path $dest) { Write-Host "موجود: $dest"; return }
  New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
  Write-Host "تنزيل: $url"
  & curl.exe -L --retry 5 --retry-delay 5 -o $dest $url
  if (-not (Test-Path $dest)) { throw "فشل التنزيل: $url" }
}

Write-Host "== 1) الأدوات الأساسية =="
if (Need "nvidia-smi") { throw "لم يُعثر على تعريف NVIDIA. ثبّت أحدث تعريف من nvidia.com ثم أعد المحاولة." }
if (Need "python") { winget install -e --id Python.Python.3.11 --accept-package-agreements --accept-source-agreements }
if (-not (Test-Path "C:\Program Files\7-Zip\7z.exe")) { winget install -e --id 7zip.7zip --accept-package-agreements --accept-source-agreements }
$7z = "C:\Program Files\7-Zip\7z.exe"
New-Item -ItemType Directory -Force -Path $Root | Out-Null

Write-Host "== 2) ComfyUI =="
if (-not (Test-Path (Join-Path $comfy "ComfyUI\main.py"))) {
  $archive = Join-Path $Root "ComfyUI_windows_portable_nvidia.7z"
  Download "https://github.com/comfyanonymous/ComfyUI/releases/latest/download/ComfyUI_windows_portable_nvidia.7z" $archive
  & $7z x $archive "-o$Root" -y | Out-Null
  Rename-Item (Join-Path $Root "ComfyUI_windows_portable") $comfy
}
$models = Join-Path $comfy "ComfyUI\models"

Write-Host "== 3) النماذج (تحقق من الروابط إذا تغيّرت على Hugging Face) =="
Download "https://huggingface.co/Comfy-Org/Qwen-Image-Edit_ComfyUI/resolve/main/split_files/diffusion_models/qwen_image_edit_fp8_e4m3fn.safetensors" (Join-Path $models "diffusion_models\qwen_image_edit_fp8_e4m3fn.safetensors")
Download "https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors" (Join-Path $models "text_encoders\qwen_2.5_vl_7b_fp8_scaled.safetensors")
Download "https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/vae/qwen_image_vae.safetensors" (Join-Path $models "vae\qwen_image_vae.safetensors")

Write-Host "== 4) الوكيل =="
New-Item -ItemType Directory -Force -Path $agentDir | Out-Null
Copy-Item (Join-Path $agentSrc "*.py") $agentDir -Force
Copy-Item (Join-Path $agentSrc "prompts.json") $agentDir -Force
Copy-Item (Join-Path $agentSrc "requirements.txt") $agentDir -Force
New-Item -ItemType Directory -Force -Path (Join-Path $Root "workflows") | Out-Null
Copy-Item (Join-Path $agentSrc "..\workflows\*.json") (Join-Path $Root "workflows") -Force
Push-Location $agentDir
if (-not (Test-Path ".venv")) { python -m venv .venv }
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
$cfg = Get-Content (Join-Path $agentSrc "config.example.json") -Raw | ConvertFrom-Json
$cfg.worker_url = $WorkerUrl
$cfg.agent_token = $AgentToken
$cfg.work_dir = (Join-Path $Root "work")
$cfg | ConvertTo-Json -Depth 5 | Set-Content "config.json" -Encoding UTF8
Pop-Location

Write-Host "== 5) ملفات التشغيل والتشغيل التلقائي =="
$runComfy = Join-Path $Root "run_comfy.bat"
@"
@echo off
cd /d "$comfy"
.\python_embeded\python.exe -s ComfyUI\main.py --listen 127.0.0.1 --port 8188 --disable-auto-launch
"@ | Set-Content $runComfy -Encoding ASCII
$runAgent = Join-Path $Root "run_agent.bat"
@"
@echo off
cd /d "$agentDir"
timeout /t 60 /nobreak >nul
.\.venv\Scripts\python.exe agent.py
"@ | Set-Content $runAgent -Encoding ASCII
schtasks /Create /F /TN "Sawwerha-ComfyUI" /SC ONLOGON /RL HIGHEST /TR "`"$runComfy`"" | Out-Null
schtasks /Create /F /TN "Sawwerha-Agent" /SC ONLOGON /RL HIGHEST /TR "`"$runAgent`"" | Out-Null

Write-Host ""
Write-Host "تم التثبيت. للتشغيل الآن:"
Write-Host "  1) $runComfy"
Write-Host "  2) $runAgent"
Write-Host "السجل: $agentDir\agent.log — وفي واتساب أرسل «status» للتأكد أن الجهاز متصل."
