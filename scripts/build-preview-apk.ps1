param([string]$AndroidSdk = $env:ANDROID_HOME)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$required = @('SQUAD_PREVIEW_KEYSTORE', 'SQUAD_PREVIEW_STORE_PASSWORD', 'SQUAD_PREVIEW_KEY_ALIAS', 'SQUAD_PREVIEW_KEY_PASSWORD')
foreach ($name in $required) {
    if (-not [Environment]::GetEnvironmentVariable($name)) { throw "Required approved signing input missing: $name" }
}
$signingInputs=@{}
foreach ($name in $required) {
    $signingInputs[$name]=[Environment]::GetEnvironmentVariable($name)
    [Environment]::SetEnvironmentVariable($name, $null, 'Process')
}
if (-not (Test-Path -LiteralPath $signingInputs['SQUAD_PREVIEW_KEYSTORE'] -PathType Leaf)) { throw 'The approved preview keystore does not exist.' }
if (-not $AndroidSdk) { throw 'ANDROID_HOME or -AndroidSdk is required.' }
$tools = Join-Path $AndroidSdk 'build-tools\36.0.0'
$unsigned = Join-Path $repo 'android\app\build\outputs\apk\release\app-release-unsigned.apk'
$artifacts = Join-Path $repo '.work\artifacts'
New-Item -ItemType Directory -Path $artifacts -Force | Out-Null
$aligned = Join-Path $artifacts 'squad-maker-aligned-unsigned.apk'
$appGradle = Get-Content -LiteralPath (Join-Path $repo 'android\app\build.gradle') -Raw
$versionMatch = [regex]::Match($appGradle, '(?m)^\s*versionName\s+"([A-Za-z0-9][A-Za-z0-9.-]*)"\s*$')
if (-not $versionMatch.Success) { throw 'A safe versionName is required in the Android app Gradle file.' }
$apk = Join-Path $artifacts ('squad-maker-' + $versionMatch.Groups[1].Value + '.apk')
Push-Location $repo
try {
    & node (Join-Path $repo 'scripts\build-android-web.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'Android web bundle failed.' }
    & node (Join-Path $repo 'node_modules\@capacitor\cli\bin\capacitor') sync android
    if ($LASTEXITCODE -ne 0) { throw 'Android sync failed.' }
    Push-Location (Join-Path $repo 'android')
    try {
        & '.\gradlew.bat' :app:assembleRelease :app:lintRelease --console=plain --no-daemon
        if ($LASTEXITCODE -ne 0) { throw 'Unsigned release build or lint failed.' }
    } finally { Pop-Location }
    & (Join-Path $tools 'zipalign.exe') -p -f 4 $unsigned $aligned
    if ($LASTEXITCODE -ne 0) { throw 'APK alignment failed.' }
    foreach ($name in $required) { [Environment]::SetEnvironmentVariable($name, $signingInputs[$name], 'Process') }
    try {
        & (Join-Path $tools 'apksigner.bat') sign --ks $signingInputs['SQUAD_PREVIEW_KEYSTORE'] --ks-key-alias $signingInputs['SQUAD_PREVIEW_KEY_ALIAS'] --ks-pass env:SQUAD_PREVIEW_STORE_PASSWORD --key-pass env:SQUAD_PREVIEW_KEY_PASSWORD --out $apk $aligned
        if ($LASTEXITCODE -ne 0) { throw 'Preview signing failed.' }
    } finally {
        foreach ($name in $required) { [Environment]::SetEnvironmentVariable($name, $null, 'Process') }
    }
    & (Join-Path $tools 'apksigner.bat') verify --verbose --print-certs $apk
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
    $hash = (Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash.ToLowerInvariant()
    $line = $hash + '  ' + (Split-Path -Leaf $apk)
    [IO.File]::WriteAllText((Join-Path $artifacts 'SHA256SUMS.txt'), $line + [Environment]::NewLine, [Text.Encoding]::ASCII)
    Write-Output 'Signed preview APK is prepared. Install and test this exact file before publishing.'
    Write-Output $line
} finally { Pop-Location }
