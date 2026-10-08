const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join, basename } = require('node:path');
const { createHash } = require('node:crypto');

const repository = 'jaywapp/squad-maker';
const sourceSha = 'a'.repeat(40);
const certificate = 'd5f7ede86e1020419ccb6a7a97fa3b8072ee6522ac878787641f19d5c33771b6';
const files = ['squad-maker-latest.apk', 'SHA256SUMS.txt', 'build-info.json', 'release-notes.md'];
const modulePromise = import('../../scripts/publish-apk-release.mjs');
const tagFor = info => `apk-${info.versionCode}-${info.sourceSha.slice(0, 12)}`;
const marker = sha => `<!-- squad-maker-apk-release:v1 source=${sha} -->`;
const ok = value => ({ exitCode: 0, stdout: JSON.stringify(value), stderr: '' });

async function fixture(t, options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'apk-publisher-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const artifactDir = join(root, 'artifacts');
  await mkdir(artifactDir);
  const apk = Buffer.from('signed APK test bytes');
  const sha256 = createHash('sha256').update(apk).digest('hex');
  const info = {
    schemaVersion: 1, repository, sourceSha, commitCount: 71,
    baseVersionCode: 1000, baseVersionName: '1.0', versionCode: 1073,
    versionName: '1.0.main.71.aaaaaaaa', applicationId: 'com.jaywapp.squadmaker.preview',
    minSdk: 24, targetSdk: 36, certificateSha256: certificate, signatureSchemes: ['v2', 'v3'],
    apk: { fileName: files[0], sha256, size: apk.length }, unsignedApkSha256: 'b'.repeat(64),
    generatedAt: '2026-10-09T00:00:00.000Z'
  };
  await writeFile(join(artifactDir, files[0]), apk);
  await writeFile(join(artifactDir, files[1]), `${sha256}  ${files[0]}\n`);
  await writeFile(join(artifactDir, files[2]), JSON.stringify(info));
  await writeFile(join(artifactDir, files[3]), 'Preview APK. Physical device verification pending.\n');
  const calls = [];
  let mainQueries = 0;
  let release = options.existing ? {
    id: 123, tag_name: tagFor(info), target_commitish: sourceSha,
    body: marker(sourceSha), draft: options.existing === 'draft', prerelease: false,
    html_url: 'https://github.com/jaywapp/squad-maker/releases/tag/test',
    assets: files.map(name => ({ name })), ...options.releaseOverrides
  } : null;
  let uploaded = false;
  const runGh = async args => {
    calls.push(args);
    if (args[0] === 'api') {
      const path = args[1].replace(`repos/${repository}/`, '');
      if (path === 'git/ref/heads/main') {
        mainQueries += 1;
        return ok({ object: { sha: options.stale || (options.staleAfterUpload && mainQueries > 1) ? 'c'.repeat(40) : sourceSha } });
      }
      if (path.startsWith('git/ref/tags/')) return options.wrongTag ? ok({ object: { type: 'commit', sha: 'f'.repeat(40) } })
        : { exitCode: 1, stdout: 'HTTP/2.0 404 Not Found\r\n\r\n{}', stderr: '' };
      if (path.startsWith('releases/tags/')) return release ? ok(release) : {
        exitCode: 1, stdout: 'HTTP/2.0 404 Not Found\r\n\r\n{"message":"Not Found"}', stderr: 'not echoed'
      };
      if (path === 'releases?per_page=100') return ok([options.previous ? [options.previous.release] : []]);
      if (args.includes('POST')) {
        const payload = JSON.parse(await readFile(args[args.indexOf('--input') + 1], 'utf8'));
        assert.equal(payload.draft, true);
        assert.equal(payload.target_commitish, sourceSha);
        release = { id: 123, ...payload, html_url: 'https://github.com/jaywapp/squad-maker/releases/tag/test', assets: [] };
        return ok(release);
      }
      if (args.includes('PATCH')) {
        assert.equal(uploaded, true);
        const payload = JSON.parse(await readFile(args[args.indexOf('--input') + 1], 'utf8'));
        assert.deepEqual(payload, { draft: false, prerelease: false, make_latest: 'true' });
        release = { ...release, ...payload };
        return ok(release);
      }
      if (path === 'releases/123') return ok(release);
    }
    if (args[0] === 'release' && args[1] === 'upload') {
      assert.equal(release.draft, true);
      assert.deepEqual(args.slice(3, 7).map(name => basename(name)), files);
      assert.equal(args.includes('--clobber'), true);
      uploaded = true;
      release.assets = files.map(name => ({ name }));
      if (options.extraAsset) release.assets.push({ name: 'unexpected.txt' });
      return ok({});
    }
    if (args[0] === 'release' && args[1] === 'download') {
      if (options.downloadFails) return { exitCode: 1, stdout: '', stderr: 'SECRET_TOKEN' };
      const destination = args[args.indexOf('--dir') + 1];
      await mkdir(destination, { recursive: true });
      const requested = args.flatMap((arg, index) => arg === '--pattern' ? [args[index + 1]] : []);
      if (options.previous && args[2] === options.previous.release.tag_name) {
        await writeFile(join(destination, files[2]), JSON.stringify(options.previous.info));
      } else {
        for (const name of requested) await copyFile(join(artifactDir, name), join(destination, name));
        if (options.downloadMutation) await options.downloadMutation(destination, info);
      }
      return ok({});
    }
    throw new Error(`Unexpected mock operation: ${args[0]}`);
  };
  const invoke = async overrides => (await modulePromise).publishApkRelease({
    artifactDir, repository, sourceSha, eventName: 'push', ref: 'refs/heads/main', runGh, ...overrides
  });
  return { info, artifactDir, calls, invoke, uploaded: () => uploaded };
}

const hasWrite = calls => calls.some(args => args.includes('POST') || args.includes('PATCH') || args[1] === 'upload');
const hasPublish = calls => calls.some(args => args.includes('PATCH'));

test('publishes verified draft with explicit assets and two main SHA checks', async t => {
  const f = await fixture(t);
  const result = await f.invoke();
  assert.equal(result.status, 'published');
  assert.equal(result.tag, 'apk-1073-aaaaaaaaaaaa');
  assert.equal(f.calls.filter(args => args[1].endsWith('/git/ref/heads/main')).length, 2);
  assert.equal(f.calls.filter(args => args.includes('PATCH')).length, 1);
});

test('non-main and pull request contexts never invoke GitHub', async t => {
  const f = await fixture(t);
  assert.equal((await f.invoke({ eventName: 'pull_request' })).status, 'skipped');
  assert.equal((await f.invoke({ ref: 'refs/heads/topic' })).status, 'skipped');
  assert.equal(f.calls.length, 0);
});

test('stale main skips before release mutation', async t => {
  const f = await fixture(t, { stale: true });
  assert.equal((await f.invoke()).status, 'superseded');
  assert.equal(hasWrite(f.calls), false);
});

test('main advancing after asset verification retains draft without publishing', async t => {
  const f = await fixture(t, { staleAfterUpload: true });
  assert.equal((await f.invoke()).status, 'superseded');
  assert.equal(f.uploaded(), true);
  assert.equal(hasPublish(f.calls), false);
});

test('matching owned draft can resume safely', async t => {
  const f = await fixture(t, { existing: 'draft' });
  assert.equal((await f.invoke()).status, 'published');
  assert.equal(f.calls.some(args => args.includes('POST')), false);
});

test('matching published release is idempotent with no writes', async t => {
  const f = await fixture(t, { existing: 'published', downloadMutation: async (directory, info) => {
    await writeFile(join(directory, files[2]), JSON.stringify({ ...info, generatedAt: '2026-10-09T01:00:00.000Z' }));
  } });
  assert.equal((await f.invoke()).status, 'already-published');
  assert.equal(hasWrite(f.calls), false);
});

for (const [label, change] of [
  ['source', info => { info.sourceSha = 'd'.repeat(40); }],
  ['certificate', info => { info.certificateSha256 = 'd'.repeat(64); }],
  ['package', info => { info.applicationId = 'another.package'; }],
  ['schema', info => { info.schemaVersion = 2; }],
  ['hash', info => { info.apk.sha256 = 'd'.repeat(64); }],
  ['size', info => { info.apk.size += 1; }],
  ['version overflow', info => { info.versionCode = 2100000001; }],
  ['signature schemes', info => { info.signatureSchemes = ['v1', 'v2']; }]
]) {
  test(`rejects local ${label} mismatch before GitHub reads or writes`, async t => {
    const f = await fixture(t);
    change(f.info);
    await writeFile(join(f.artifactDir, files[2]), JSON.stringify(f.info));
    await assert.rejects(f.invoke());
    assert.equal(f.calls.length, 0);
  });
}

test('rejects unexpected local artifact file', async t => {
  const f = await fixture(t);
  await writeFile(join(f.artifactDir, 'extra.txt'), 'extra');
  await assert.rejects(f.invoke(), /Unexpected release artifact/);
  assert.equal(f.calls.length, 0);
});

test('rejects non-canonical checksum before external calls', async t => {
  const f = await fixture(t);
  await writeFile(join(f.artifactDir, files[1]), `${f.info.apk.sha256} *${files[0]}\n`);
  await assert.rejects(f.invoke(), /checksum file/);
  assert.equal(f.calls.length, 0);
});

for (const releaseOverrides of [
  { target_commitish: 'e'.repeat(40) }, { body: 'Unowned release' }, { prerelease: true }, { tag_name: 'wrong-tag' }
]) {
  test(`rejects wrong existing release ${Object.keys(releaseOverrides)[0]} without writes`, async t => {
    const f = await fixture(t, { existing: 'draft', releaseOverrides });
    await assert.rejects(f.invoke(), /does not belong/);
    assert.equal(hasWrite(f.calls), false);
  });
}

test('download corruption prevents public mutation and retains uploaded draft', async t => {
  const f = await fixture(t, { downloadMutation: async directory => writeFile(join(directory, files[0]), 'corrupt') });
  await assert.rejects(f.invoke(), /checksum or size/);
  assert.equal(f.uploaded(), true);
  assert.equal(hasPublish(f.calls), false);
});

test('changed metadata after upload prevents publishing even with identical APK', async t => {
  const f = await fixture(t, { downloadMutation: async (directory, info) => {
    await writeFile(join(directory, files[2]), JSON.stringify({ ...info, generatedAt: '2026-10-09T01:00:00.000Z' }));
  } });
  await assert.rejects(f.invoke(), /asset differs/);
  assert.equal(hasPublish(f.calls), false);
});

test('download failure is redacted and never publishes', async t => {
  const f = await fixture(t, { downloadFails: true });
  await assert.rejects(f.invoke(), error => !error.message.includes('SECRET_TOKEN') && /download failed/.test(error.message));
  assert.equal(hasPublish(f.calls), false);
});

test('unexpected draft remote asset prevents publishing', async t => {
  const f = await fixture(t, { extraAsset: true });
  await assert.rejects(f.invoke(), /asset set/);
  assert.equal(hasPublish(f.calls), false);
});

test('previous managed release with greater code blocks downgrade before writes', async t => {
  const f = await fixture(t);
  const previousInfo = { ...f.info, commitCount: 72, versionCode: 1074, versionName: '1.0.main.72.aaaaaaaa' };
  const previous = { info: previousInfo, release: { id: 124, tag_name: tagFor(previousInfo), body: marker(sourceSha), draft: false } };
  const g = await fixture(t, { previous });
  await assert.rejects(g.invoke(), /would decrease/);
  assert.equal(hasWrite(g.calls), false);
});

test('GitHub authentication failure is not interpreted as a missing release', async t => {
  const f = await fixture(t);
  const execute = async args => args[1].endsWith('/git/ref/heads/main')
    ? ok({ object: { sha: sourceSha } })
    : { exitCode: 1, stdout: 'HTTP/2.0 401 Unauthorized\r\n\r\n{}', stderr: 'SECRET_TOKEN' };
  await assert.rejects(f.invoke({ runGh: execute }), error => /API request failed/.test(error.message) && !error.message.includes('SECRET_TOKEN'));
});


test('existing tag for another source is rejected before any release write', async t => {
  const f = await fixture(t, { wrongTag: true });
  await assert.rejects(f.invoke(), /tag points to a different source/);
  assert.equal(hasWrite(f.calls), false);
});

test('published release with a different certificate cannot be treated as idempotent', async t => {
  const f = await fixture(t, { existing: 'published', downloadMutation: async (directory, info) => {
    await writeFile(join(directory, files[2]), JSON.stringify({ ...info, certificateSha256: 'd'.repeat(64) }));
  } });
  await assert.rejects(f.invoke(), /Invalid APK build metadata/);
  assert.equal(hasWrite(f.calls), false);
});


test('previous managed release with equal code and different source blocks before writes', async t => {
  const f = await fixture(t);
  const previousSha = 'd'.repeat(40);
  const previousInfo = { ...f.info, sourceSha: previousSha, versionName: '1.0.main.71.dddddddd' };
  const previous = { info: previousInfo, release: {
    id: 124, tag_name: tagFor(previousInfo), body: marker(previousSha), draft: false
  } };
  const g = await fixture(t, { previous });
  await assert.rejects(g.invoke(), /must increase for a different source/);
  assert.equal(hasWrite(g.calls), false);
});
