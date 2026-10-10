import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, lstat, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY = 'jaywapp/squad-maker';
const CERTIFICATE = 'd5f7ede86e1020419ccb6a7a97fa3b8072ee6522ac878787641f19d5c33771b6';
const FILES = ['squad-maker-latest.apk', 'SHA256SUMS.txt', 'build-info.json', 'release-notes.md'];
const hex = (value, length) => typeof value === 'string' && new RegExp(`^[a-f0-9]{${length}}$`).test(value);
const positive = value => Number.isSafeInteger(value) && value > 0;
const safeName = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._+-]{0,127}$/.test(value);
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const fail = message => { throw new Error(message); };

function validateInfo(info, repository, sourceSha) {
  if (!info || info.schemaVersion !== 1 || info.repository !== repository || !hex(info.sourceSha, 40)
      || (sourceSha && info.sourceSha !== sourceSha) || !positive(info.commitCount)
      || !positive(info.baseVersionCode) || !safeName(info.baseVersionName)
      || !positive(info.versionCode) || info.versionCode > 2100000000
      || info.versionCode !== Math.max(info.baseVersionCode, 1002) + info.commitCount
      || !safeName(info.versionName)
      || info.versionName !== `${info.baseVersionName}.main.${info.commitCount}.${info.sourceSha.slice(0, 8)}`
      || info.applicationId !== 'com.jaywapp.squadmaker.preview' || info.minSdk !== 24 || info.targetSdk !== 36
      || info.certificateSha256 !== CERTIFICATE || !Array.isArray(info.signatureSchemes)
      || info.signatureSchemes.length !== 2 || !info.signatureSchemes.includes('v2') || !info.signatureSchemes.includes('v3')
      || info.apk?.fileName !== FILES[0] || !hex(info.apk.sha256, 64) || !positive(info.apk.size)
      || !hex(info.unsignedApkSha256, 64) || typeof info.generatedAt !== 'string'
      || !Number.isFinite(Date.parse(info.generatedAt))) fail('Invalid APK build metadata.');
  return info;
}

async function readInfo(directory, repository, sourceSha) {
  let info;
  try { info = JSON.parse(await readFile(join(directory, FILES[2]), 'utf8')); }
  catch { fail('Cannot read APK build metadata.'); }
  return validateInfo(info, repository, sourceSha);
}

async function validateArtifact(directory, repository, sourceSha) {
  const entries = await readdir(directory);
  if (entries.length !== FILES.length || !FILES.every(name => entries.includes(name))) fail('Unexpected release artifact files.');
  for (const name of FILES) {
    const stat = await lstat(join(directory, name));
    if (!stat.isFile() || stat.isSymbolicLink()) fail('Release artifacts must be regular files.');
  }
  const info = await readInfo(directory, repository, sourceSha);
  const apk = await readFile(join(directory, FILES[0]));
  if (apk.length !== info.apk.size || hash(apk) !== info.apk.sha256) fail('APK checksum or size does not match metadata.');
  const checksum = await readFile(join(directory, FILES[1]), 'utf8');
  if (checksum !== `${info.apk.sha256}  ${FILES[0]}\n`) fail('Invalid APK checksum file.');
  if (!(await readFile(join(directory, FILES[3]), 'utf8')).trim()) fail('Release notes are empty.');
  return info;
}

export async function runGh(args) {
  return new Promise((resolveResult, reject) => {
    const child = spawn('gh', args, { shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', () => reject(new Error('GitHub CLI could not start.')));
    child.on('close', exitCode => resolveResult({ exitCode, stdout, stderr }));
  });
}

function decodeResponse(result, allowMissing = false) {
  const output = result.stdout || '';
  const status = /^HTTP\/\S+\s+(\d+)/m.exec(output);
  if (allowMissing && status?.[1] === '404') return null;
  if (result.exitCode !== 0) fail('GitHub API request failed.');
  const body = status ? output.slice(output.indexOf('\n\n') >= 0 ? output.indexOf('\n\n') + 2 : output.indexOf('\r\n\r\n') + 4) : output;
  try { return JSON.parse(body); } catch { fail('Invalid GitHub API response.'); }
}

const identity = info => JSON.stringify([info.repository, info.sourceSha, info.versionCode, info.versionName,
  info.applicationId, info.minSdk, info.targetSdk, info.certificateSha256, [...info.signatureSchemes].sort(), info.apk.sha256, info.apk.size]);
const tagFor = info => `apk-${info.versionCode}-${info.sourceSha.slice(0, 12)}`;
const markerFor = info => `<!-- squad-maker-apk-release:v1 source=${info.sourceSha} -->`;
const managed = release => /^apk-\d+-[a-f0-9]{12}$/.test(release.tag_name || '')
  && typeof release.body === 'string' && /<!-- squad-maker-apk-release:v1 source=[a-f0-9]{40} -->/.test(release.body);

export async function publishApkRelease({ artifactDir, repository, sourceSha, eventName, ref, runGh: execute = runGh }) {
  if (repository !== REPOSITORY || !hex(sourceSha, 40)) fail('Invalid release repository or source SHA.');
  if (eventName !== 'push' || ref !== 'refs/heads/main') return { status: 'skipped' };
  const directory = resolve(artifactDir);
  const info = await validateArtifact(directory, repository, sourceSha);
  const tag = tagFor(info);
  const endpoint = `repos/${repository}`;
  const api = async (path, extra = [], missing = false) => decodeResponse(await execute(['api', `${endpoint}/${path}`, ...extra]), missing);
  const mainMatches = async () => {
    const main = await api('git/ref/heads/main');
    if (!hex(main?.object?.sha, 40)) fail('Invalid main branch identity.');
    return main.object.sha === sourceSha;
  };
  const verifyTag = async () => {
    const existing = await api(`git/ref/tags/${tag}`, ['--include'], true);
    if (!existing) return;
    let object = existing.object;
    for (let depth = 0; object?.type === 'tag' && depth < 8; depth += 1) {
      if (!hex(object.sha, 40)) fail('Invalid existing release tag.');
      object = (await api(`git/tags/${object.sha}`)).object;
    }
    if (object?.type !== 'commit' || object.sha !== sourceSha) fail('Existing release tag points to a different source.');
  };
  if (!await mainMatches()) return { status: 'superseded', tag };
  await verifyTag();
  const workspace = await mkdtemp(join(tmpdir(), 'squad-apk-release-'));
  try {
    const download = async (releaseTag, names, destination) => {
      const result = await execute(['release', 'download', releaseTag, '--repo', repository, '--dir', destination,
        ...names.flatMap(name => ['--pattern', name])]);
      if (result.exitCode !== 0) fail('Release asset download failed.');
    };
    let release = await api(`releases/tags/${tag}`, ['--include'], true);
    if (release) {
      if (release.tag_name !== tag || release.target_commitish !== sourceSha || !release.body?.includes(markerFor(info))
          || release.prerelease !== false || typeof release.draft !== 'boolean' || !positive(release.id)) fail('Existing release does not belong to this build.');
      if (!release.draft) {
        if (!Array.isArray(release.assets) || release.assets.length !== FILES.length
            || !FILES.every(name => release.assets.some(asset => asset.name === name))) fail('Existing published release has an unexpected asset set.');
        const existingDir = join(workspace, 'existing');
        await download(tag, FILES, existingDir);
        const existing = await validateArtifact(existingDir, repository, sourceSha);
        if (identity(existing) !== identity(info)) fail('Existing published release differs from this build.');
        return { status: 'already-published', tag, url: release.html_url };
      }
    }
    const pages = await api('releases?per_page=100', ['--paginate', '--slurp']);
    if (!Array.isArray(pages)) fail('Invalid release listing.');
    const releases = pages.flat();
    for (const previous of releases.filter(item => managed(item) && !item.draft)) {
      const previousDir = join(workspace, `previous-${previous.id}`);
      if (!Number.isSafeInteger(previous.id) || previous.id <= 0) fail('Invalid previous release identity.');
      await download(previous.tag_name, [FILES[2]], previousDir);
      const previousInfo = await readInfo(previousDir, repository);
      if (tagFor(previousInfo) !== previous.tag_name || !previous.body.includes(markerFor(previousInfo))) fail('Previous release metadata differs from its identity.');
      if (previousInfo.versionCode > info.versionCode) fail('APK version code would decrease.');
      if (previousInfo.sourceSha !== sourceSha && previousInfo.versionCode === info.versionCode) fail('APK version code must increase for a different source.');
    }
    if (!release) {
      const bodyFile = join(workspace, 'create-release.json');
      const notes = await readFile(join(directory, FILES[3]), 'utf8');
      await writeFile(bodyFile, JSON.stringify({ tag_name: tag, target_commitish: sourceSha,
        name: `아이엠 헤드코치 Preview ${info.versionName}`, body: `${notes}\n\n${markerFor(info)}`,
        draft: true, prerelease: false }));
      release = await api('releases', ['--method', 'POST', '--input', bodyFile]);
      if (!release?.draft || release.tag_name !== tag || release.target_commitish !== sourceSha
          || !release.body?.includes(markerFor(info)) || !Number.isSafeInteger(release.id)) fail('Created release identity could not be verified.');
    }
    // Re-read draft state before clobbering any assets. Public releases are immutable here.
    release = await api(`releases/${release.id}`);
    if (!release?.draft || release.tag_name !== tag || release.target_commitish !== sourceSha
        || !release.body?.includes(markerFor(info)) || release.prerelease) fail('Release is no longer the expected draft.');
    const upload = await execute(['release', 'upload', tag, ...FILES.map(name => join(directory, name)), '--repo', repository, '--clobber']);
    if (upload.exitCode !== 0) fail('Draft release asset upload failed.');
    const downloadedDir = join(workspace, 'downloaded');
    await download(tag, FILES, downloadedDir);
    const downloaded = await validateArtifact(downloadedDir, repository, sourceSha);
    if (identity(downloaded) !== identity(info)) fail('Downloaded release does not match the local APK.');
    for (const name of FILES) {
      if (!(await readFile(join(directory, name))).equals(await readFile(join(downloadedDir, name)))) fail('Downloaded release asset differs from the local artifact.');
    }
    release = await api(`releases/${release.id}`);
    if (!release?.draft || release.tag_name !== tag || release.target_commitish !== sourceSha
        || !release.body?.includes(markerFor(info)) || release.prerelease
        || !Array.isArray(release.assets) || release.assets.length !== FILES.length
        || !FILES.every(name => release.assets.some(asset => asset.name === name))) fail('Draft release asset set or identity changed.');
    await verifyTag();
    if (!await mainMatches()) return { status: 'superseded', tag, url: release.html_url };
    const publishFile = join(workspace, 'publish-release.json');
    await writeFile(publishFile, JSON.stringify({ draft: false, prerelease: false, make_latest: 'true' }));
    const published = await api(`releases/${release.id}`, ['--method', 'PATCH', '--input', publishFile]);
    if (published.draft !== false || published.prerelease !== false || published.tag_name !== tag
        || published.target_commitish !== sourceSha || !published.body?.includes(markerFor(info))) fail('Release publication could not be confirmed.');
    return { status: 'published', tag, url: published.html_url };
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 2 || args[0] !== '--artifact-dir' || !args[1]) fail('Usage: publish-apk-release.mjs --artifact-dir DIRECTORY');
    const result = await publishApkRelease({ artifactDir: args[1], repository: process.env.GITHUB_REPOSITORY,
      sourceSha: process.env.GITHUB_SHA, eventName: process.env.GITHUB_EVENT_NAME, ref: process.env.GITHUB_REF });
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
