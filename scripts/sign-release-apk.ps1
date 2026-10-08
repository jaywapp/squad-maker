param(
    [Parameter(Mandatory = $true)][string]$UnsignedApk,
    [Parameter(Mandatory = $true)][string]$PlanFile,
    [Parameter(Mandatory = $true)][string]$OutputDirectory,
    [string]$AndroidSdk = $env:ANDROID_HOME
)

$ErrorActionPreference = 'Stop'
$secretNames = @('SQUAD_PREVIEW_KEYSTORE_BASE64', 'SQUAD_PREVIEW_KEYSTORE', 'SQUAD_PREVIEW_STORE_PASSWORD', 'SQUAD_PREVIEW_KEY_ALIAS', 'SQUAD_PREVIEW_KEY_PASSWORD')
$signing = @{}
foreach ($name in $secretNames) {
    $signing[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
    [Environment]::SetEnvironmentVariable($name, $null, 'Process')
}
$privateDirectory = $null
$privateKeyFile = $null
$stage = 'configuration'
try {
    foreach ($name in @('SQUAD_PREVIEW_STORE_PASSWORD', 'SQUAD_PREVIEW_KEY_ALIAS', 'SQUAD_PREVIEW_KEY_PASSWORD')) {
        if ([string]::IsNullOrEmpty($signing[$name])) { throw 'Missing signing configuration' }
    }
    $windowsHost = [Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT
    $binaryExtension = if ($windowsHost) { '.exe' } else { '' }
    $scriptExtension = if ($windowsHost) { '.bat' } else { '' }
    $tools = Join-Path $AndroidSdk 'build-tools/36.0.0'
    $zipalign = Join-Path $tools ('zipalign' + $binaryExtension)
    $apksigner = Join-Path $tools ('apksigner' + $scriptExtension)
    foreach ($file in @($UnsignedApk, $PlanFile, $zipalign, $apksigner)) {
        if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw 'Required input or build tool is unavailable' }
    }
    $output = [IO.Path]::GetFullPath($OutputDirectory)
    [IO.Directory]::CreateDirectory($output) | Out-Null
    $signedApk = Join-Path $output 'squad-maker-latest.apk'
    $alignedApk = Join-Path $output 'aligned-unsigned.apk'
    $signatureLog = Join-Path $output 'signature-verification.txt'
    if (-not [string]::IsNullOrEmpty($signing['SQUAD_PREVIEW_KEYSTORE'])) {
        if (-not [string]::IsNullOrEmpty($signing['SQUAD_PREVIEW_KEYSTORE_BASE64'])) { throw 'Ambiguous signing key configuration' }
        $keyFile = [IO.Path]::GetFullPath($signing['SQUAD_PREVIEW_KEYSTORE'])
        if (-not (Test-Path -LiteralPath $keyFile -PathType Leaf)) { throw 'Existing signing key is unavailable' }
    } else {
        if ([string]::IsNullOrEmpty($signing['SQUAD_PREVIEW_KEYSTORE_BASE64'])) { throw 'Existing signing key is unavailable' }
        $temporaryRoot = if ($env:RUNNER_TEMP) { [IO.Path]::GetFullPath($env:RUNNER_TEMP) } else { [IO.Path]::GetTempPath() }
        $privateDirectory = Join-Path $temporaryRoot ('squad-apk-sign-' + [Guid]::NewGuid().ToString('N'))
        [IO.Directory]::CreateDirectory($privateDirectory) | Out-Null
        if (-not $windowsHost) {
            & chmod 700 $privateDirectory
            if ($LASTEXITCODE -ne 0) { throw 'Cannot restrict temporary key directory' }
        }
        $privateKeyFile = Join-Path $privateDirectory 'preview-key.p12'
        [IO.File]::WriteAllBytes($privateKeyFile, [Convert]::FromBase64String($signing['SQUAD_PREVIEW_KEYSTORE_BASE64']))
        if (-not $windowsHost) {
            & chmod 600 $privateKeyFile
            if ($LASTEXITCODE -ne 0) { throw 'Cannot restrict temporary signing key' }
        }
        $keyFile = $privateKeyFile
    }
    $stage = 'unsigned APK identity'
    & node (Join-Path $PSScriptRoot 'apk-release-metadata.mjs') inspect-unsigned --plan $PlanFile --apk $UnsignedApk --sdk $AndroidSdk
    if ($LASTEXITCODE -ne 0) { throw 'Unsigned APK identity failed' }
    $stage = 'alignment'
    & $zipalign -f -p 4 $UnsignedApk $alignedApk 1>$null 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'Alignment failed' }
    $stage = 'signing'
    [Environment]::SetEnvironmentVariable('SQUAD_PREVIEW_STORE_PASSWORD', $signing['SQUAD_PREVIEW_STORE_PASSWORD'], 'Process')
    [Environment]::SetEnvironmentVariable('SQUAD_PREVIEW_KEY_PASSWORD', $signing['SQUAD_PREVIEW_KEY_PASSWORD'], 'Process')
    & $apksigner sign --ks $keyFile --ks-key-alias $signing['SQUAD_PREVIEW_KEY_ALIAS'] --ks-pass env:SQUAD_PREVIEW_STORE_PASSWORD --key-pass env:SQUAD_PREVIEW_KEY_PASSWORD --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --v4-signing-enabled false --out $signedApk $alignedApk 1>$null 2>$null
    $signExitCode = $LASTEXITCODE
    [Environment]::SetEnvironmentVariable('SQUAD_PREVIEW_STORE_PASSWORD', $null, 'Process')
    [Environment]::SetEnvironmentVariable('SQUAD_PREVIEW_KEY_PASSWORD', $null, 'Process')
    if ($signExitCode -ne 0) { throw 'Signing failed' }
    $stage = 'signature verification'
    $publicSignature = & $apksigner verify --verbose --print-certs $signedApk 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'Signature verification failed' }
    [IO.File]::WriteAllText($signatureLog, ($publicSignature -join "`n"), (New-Object Text.UTF8Encoding($false)))
    & $zipalign -c -p 4 $signedApk 1>$null 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'Signed alignment verification failed' }
    $stage = 'signed APK metadata'
    & node (Join-Path $PSScriptRoot 'apk-release-metadata.mjs') collect-signed --plan $PlanFile --apk $signedApk --unsigned $UnsignedApk --signature $signatureLog --sdk $AndroidSdk --out $output
    if ($LASTEXITCODE -ne 0) { throw 'Signed APK metadata failed' }
    Remove-Item -LiteralPath $alignedApk
    Remove-Item -LiteralPath $signatureLog
    Write-Output 'Signed Preview APK passed identity, certificate, signature and alignment checks.'
} catch {
    throw ('APK preparation failed at ' + $stage + '. Signing values were not logged.')
} finally {
    foreach ($name in $secretNames) { [Environment]::SetEnvironmentVariable($name, $null, 'Process') }
    $signing.Clear()
    if ($privateKeyFile -and $privateDirectory) {
        $resolvedDirectory = [IO.Path]::GetFullPath($privateDirectory)
        $resolvedFile = [IO.Path]::GetFullPath($privateKeyFile)
        if ([IO.Path]::GetDirectoryName($resolvedFile) -ne $resolvedDirectory) { throw 'Unexpected temporary key location' }
        if (Test-Path -LiteralPath $resolvedFile -PathType Leaf) { Remove-Item -LiteralPath $resolvedFile -Force }
        if ((Test-Path -LiteralPath $resolvedDirectory -PathType Container) -and (Get-ChildItem -LiteralPath $resolvedDirectory -Force | Measure-Object).Count -eq 0) {
            Remove-Item -LiteralPath $resolvedDirectory
        }
    }
}
