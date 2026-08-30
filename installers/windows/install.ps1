$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Set-InstallerPhase([string]$Phase) {
  $StatusFile = [Environment]::GetEnvironmentVariable('DSH_INSTALL_STATUS_FILE')
  if ($StatusFile) {
    Set-Content -LiteralPath $StatusFile -Value $Phase -Encoding Ascii
  }
}

Set-InstallerPhase 'started'

$NodeVersion = '24.20.0'
$PnpmVersion = '11.19.0'
$DshPackage = '@deepseek-ai/dsh@0.1.0-rc.7'
$Profile = 'web'
$OfficialNodeBase = "https://nodejs.org/dist/v$NodeVersion"
$MirrorNodeBase = "https://registry.npmmirror.com/-/binary/node/v$NodeVersion"
$OfficialNpmRegistry = 'https://registry.npmjs.org'
$MirrorNpmRegistry = 'https://registry.npmmirror.com'

$ScriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$PluginDirectory = (Resolve-Path (Join-Path $ScriptDirectory '..\..')).Path
$RuntimeRoot = if ($env:DSH_CREATOR_RUNTIME_ROOT) {
  $env:DSH_CREATOR_RUNTIME_ROOT
}
else {
  Join-Path $env:LOCALAPPDATA 'dsh-douyin-creator'
}
$CacheRoot = Join-Path $RuntimeRoot 'cache'
$NodeRoot = Join-Path $RuntimeRoot "node-v$NodeVersion"
$PnpmRoot = Join-Path $RuntimeRoot "pnpm-v$PnpmVersion"
$LogFile = Join-Path $RuntimeRoot 'install.log'

New-Item -ItemType Directory -Force -Path $CacheRoot | Out-Null
Set-InstallerPhase 'runtime-ready'
Start-Transcript -Path $LogFile -Append | Out-Null
Set-InstallerPhase 'transcript-ready'

function Test-CompatibleNode([string]$NodePath) {
  try {
    & $NodePath -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit((a===22&&b>=19)||a>=24?0:1)" 2>$null
    return $LASTEXITCODE -eq 0
  }
  catch {
    return $false
  }
}

function Get-FileWithFallback([string]$Output, [string[]]$Urls) {
  foreach ($Url in $Urls) {
    for ($Attempt = 1; $Attempt -le 3; $Attempt++) {
      try {
        Write-Host "正在下载：$Url（第 $Attempt 次）"
        Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile "$Output.part" -TimeoutSec 600
        Move-Item -Force "$Output.part" $Output
        return
      }
      catch {
        Write-Warning $_.Exception.Message
      }
    }
  }
  throw "所有下载地址都不可用：$($Urls -join ', ')"
}

function Install-PortableNode {
  $Architecture = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
  switch ($Architecture) {
    'X64' { $NodeArch = 'x64' }
    'Arm64' { $NodeArch = 'arm64' }
    default { throw "暂不支持此 Windows 架构：$Architecture" }
  }

  $Archive = "node-v$NodeVersion-win-$NodeArch.zip"
  $ArchivePath = Join-Path $CacheRoot $Archive
  $SumsPath = Join-Path $CacheRoot "SHASUMS256-v$NodeVersion.txt"

  if (-not (Test-Path $ArchivePath)) {
    Get-FileWithFallback $ArchivePath @(
      "$OfficialNodeBase/$Archive",
      "$MirrorNodeBase/$Archive"
    )
  }
  else {
    Write-Host '复用已下载的 Node.js 安装包。'
  }

  Get-FileWithFallback $SumsPath @(
    "$OfficialNodeBase/SHASUMS256.txt",
    "$MirrorNodeBase/SHASUMS256.txt"
  )

  $ExpectedLine = Get-Content $SumsPath | Where-Object { $_ -match "\s$([regex]::Escape($Archive))$" } | Select-Object -First 1
  if (-not $ExpectedLine) { throw '校验文件中没有找到对应的 Node.js 安装包。' }
  $Expected = ($ExpectedLine -split '\s+')[0].ToLowerInvariant()
  $Actual = (Get-FileHash -Algorithm SHA256 $ArchivePath).Hash.ToLowerInvariant()
  if ($Expected -ne $Actual) { throw "Node.js 安装包校验失败，请删除后重试：$ArchivePath" }

  $ExtractRoot = Join-Path $RuntimeRoot "node-extract-v$NodeVersion"
  if (Test-Path $ExtractRoot) { Remove-Item -Recurse -Force $ExtractRoot }
  New-Item -ItemType Directory -Force -Path $ExtractRoot | Out-Null
  Expand-Archive -Path $ArchivePath -DestinationPath $ExtractRoot -Force
  $Extracted = Join-Path $ExtractRoot "node-v$NodeVersion-win-$NodeArch"
  if (-not (Test-Path (Join-Path $Extracted 'node.exe'))) { throw 'Node.js 解压后缺少 node.exe。' }
  if (Test-Path $NodeRoot) { Remove-Item -Recurse -Force $NodeRoot }
  Move-Item $Extracted $NodeRoot
  Write-Host "便携 Node.js 已安装到：$NodeRoot"
}

try {
  Write-Host '本安装器不会修改系统 Node.js，也不会读取或写入你的 API Key。'
  Write-Host ''

  $NodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
  if ($NodeCommand -and (Test-CompatibleNode $NodeCommand.Source)) {
    $NodeBin = $NodeCommand.Source
    Write-Host "使用现有 Node.js：$(& $NodeBin -v)"
  }
  elseif ((Test-Path (Join-Path $NodeRoot 'node.exe')) -and (Test-CompatibleNode (Join-Path $NodeRoot 'node.exe'))) {
    $NodeBin = Join-Path $NodeRoot 'node.exe'
    Write-Host "使用已缓存的便携 Node.js：$(& $NodeBin -v)"
  }
  else {
    Write-Host '没有发现兼容的 Node.js，将安装免管理员权限的便携版本。'
    Install-PortableNode
    $NodeBin = Join-Path $NodeRoot 'node.exe'
  }
  Set-InstallerPhase 'node-ready'

  $NodeBinDirectory = Split-Path -Parent $NodeBin
  $env:Path = "$NodeBinDirectory;$env:Path"
  $env:npm_config_cache = Join-Path $CacheRoot 'npm'
  $NpmBin = Join-Path $NodeBinDirectory 'npm.cmd'
  $NpxBin = Join-Path $NodeBinDirectory 'npx.cmd'
  if (-not (Test-Path $NpmBin)) { $NpmBin = (Get-Command npm.cmd).Source }
  if (-not (Test-Path $NpxBin)) { $NpxBin = (Get-Command npx.cmd).Source }

  $Registries = @()
  if ($env:DSH_NPM_REGISTRY) { $Registries += $env:DSH_NPM_REGISTRY }
  $Registries += $OfficialNpmRegistry
  $Registries += $MirrorNpmRegistry
  $NpmRegistry = $null
  foreach ($Registry in $Registries | Select-Object -Unique) {
    Write-Host "正在测试软件源：$Registry"
    & $NpmBin view $DshPackage version "--registry=$Registry" --fetch-retries=2 --fetch-timeout=30000 *> $null
    if ($LASTEXITCODE -eq 0) {
      $NpmRegistry = $Registry
      break
    }
  }
  if (-not $NpmRegistry) { throw '官方源和备用镜像都无法访问，请连接网络后重试。' }
  Write-Host "使用软件源：$NpmRegistry"
  Set-InstallerPhase 'registry-ready'

  $PnpmBin = Join-Path $PnpmRoot 'node_modules\.bin\pnpm.cmd'
  if (Test-Path $PnpmBin) {
    Write-Host "复用已缓存的快速安装工具：pnpm $(& $PnpmBin --version)"
  }
  else {
    Write-Host '正在准备快速安装工具，避免 npm 长时间解析 DSH 依赖…'
    & $NpmBin install `
      --prefix $PnpmRoot `
      --no-audit `
      --no-fund `
      --ignore-scripts `
      "--registry=$NpmRegistry" `
      "pnpm@$PnpmVersion"
    if ($LASTEXITCODE -ne 0) { throw '快速安装工具准备失败，请重新双击，缓存会继续使用。' }
  }
  if (-not (Test-Path $PnpmBin)) { throw '快速安装工具准备后缺少可执行文件。' }
  $env:PNPM_HOME = Join-Path $RuntimeRoot 'pnpm-bin'
  $env:PNPM_CONFIG_REGISTRY = $NpmRegistry
  $env:PNPM_CONFIG_CACHE_DIR = Join-Path $CacheRoot 'pnpm-cache'
  $env:PNPM_CONFIG_STORE_DIR = Join-Path $CacheRoot 'pnpm-store'
  New-Item -ItemType Directory -Force -Path $env:PNPM_HOME, $env:PNPM_CONFIG_CACHE_DIR, $env:PNPM_CONFIG_STORE_DIR | Out-Null
  $env:Path = "$(Split-Path -Parent $PnpmBin);$env:Path"
  Set-InstallerPhase 'pnpm-ready'

  Write-Host ''
  Write-Host '正在制作本地插件安装包，避免再次访问 GitHub…'
  Push-Location $PluginDirectory
  try {
    $PackOutput = & $NpmBin pack --silent --pack-destination $CacheRoot
    if ($LASTEXITCODE -ne 0) { throw '本地插件打包失败。' }
  }
  finally {
    Pop-Location
  }
  $PackageFile = @($PackOutput)[-1].Trim()
  $PackagePath = Join-Path $CacheRoot $PackageFile
  if (-not (Test-Path $PackagePath)) { throw '没有找到本地插件安装包。' }
  Set-InstallerPhase 'package-ready'

  Write-Host ''
  Write-Host '正在安装 DeepSeek Harness 与插件。首次安装依赖较多，弱网下可能需要 5 到 15 分钟。'
  Write-Host '即使一段时间没有新文字，也请保持窗口打开；失败后重试会继续复用缓存。'
  & $PnpmBin "--package=$DshPackage" dlx dsh plugin --profile $Profile add $PackagePath
  if ($LASTEXITCODE -ne 0) { throw 'DeepSeek Harness 或插件安装失败；请重新双击，缓存会继续使用。' }
  Set-InstallerPhase 'plugin-ready'

  Write-Host ''
  Write-Host '正在执行环境自检…'
  & $NodeBin (Join-Path $PluginDirectory 'bin\install.mjs') --doctor --profile $Profile
  if ($LASTEXITCODE -ne 0) { throw '环境自检未通过。' }
  Set-InstallerPhase 'doctor-ready'

  if ($env:DSH_SKIP_LAUNCH -eq '1') {
    Write-Host ''
    Write-Host '安装与自检已完成；按测试设置跳过网页启动。'
    Set-InstallerPhase 'complete'
    exit 0
  }

  Write-Host ''
  Write-Host '安装完成，正在启动网页。关闭本窗口会停止服务。'
  Set-InstallerPhase 'web-starting'
  $BrowserJob = Start-Job -ScriptBlock {
    for ($Attempt = 1; $Attempt -le 60; $Attempt++) {
      try {
        Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3080/' -TimeoutSec 2 | Out-Null
        Start-Process 'http://127.0.0.1:3080/'
        return
      }
      catch {
        Start-Sleep -Seconds 1
      }
    }
  }
  try {
    & $PnpmBin "--package=$DshPackage" dlx dsh web
    $ExitCode = $LASTEXITCODE
  }
  finally {
    if ($BrowserJob.State -eq 'Running') { Stop-Job $BrowserJob }
    Receive-Job $BrowserJob | Out-Null
    Remove-Job $BrowserJob -Force
  }
  Write-Host "服务已停止，退出码：$ExitCode"
  exit $ExitCode
}
catch {
  Write-Host ''
  Write-Error $_.Exception.Message
  Write-Host "日志位置：$LogFile"
  exit 1
}
finally {
  try { Stop-Transcript | Out-Null } catch {}
}
