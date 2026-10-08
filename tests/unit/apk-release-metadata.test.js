const test = require('node:test');
const assert = require('node:assert/strict');
const modulePromise = import('../../scripts/apk-release-metadata.mjs');
const context = { gradleSource: 'versionCode 1001\nversionName "0.1.0-preview.1"', sourceSha: 'a'.repeat(40), commitCount: 71, repository: 'jaywapp/squad-maker' };

test('release versions are deterministic and increase with main history', async () => {
  const { createPlan, validatePlan } = await modulePromise;
  const plan = createPlan(context);
  assert.equal(plan.versionCode, 1073);
  assert.equal(plan.versionName, '0.1.0-preview.1.main.71.aaaaaaaa');
  assert.deepEqual(createPlan(context), plan);
  assert.equal(createPlan({ ...context, commitCount: 72 }).versionCode, 1074);
  assert.equal(validatePlan(plan), plan);
  assert.throws(() => validatePlan({ ...plan, versionCode: 1001 }), /Invalid release plan/);
});

test('release plan rejects ambiguous versions, unsafe context and overflow', async () => {
  const { createPlan } = await modulePromise;
  for (const changes of [{ sourceSha: 'HEAD' }, { repository: 'other/repo' }, { commitCount: 0 },
    { gradleSource: 'versionCode 1001\nversionCode 1002\nversionName "test"' },
    { gradleSource: 'versionCode 2100000000\nversionName "test"' },
    { gradleSource: 'versionCode 1001\nversionName "test unsafe"' }]) {
    assert.throws(() => createPlan({ ...context, ...changes }));
  }
});

test('APK identity supports current and legacy aapt SDK labels and rejects wrong app', async () => {
  const { createPlan, parseBadging, checkIdentity } = await modulePromise;
  const plan = createPlan(context);
  const line = `package: name='${plan.applicationId}' versionCode='${plan.versionCode}' versionName='${plan.versionName}'\n`;
  for (const label of ['sdkVersion', 'minSdkVersion']) {
    const identity = parseBadging(`${line}${label}:'24'\ntargetSdkVersion:'36'\n`);
    assert.equal(checkIdentity(identity, plan), identity);
    assert.throws(() => checkIdentity({ ...identity, applicationId: 'other.app' }, plan), /applicationId/);
    assert.throws(() => checkIdentity({ ...identity, minSdk: 26 }, plan), /minSdk/);
  }
  assert.throws(() => parseBadging(line), /Incomplete/);
});

test('signed metadata requires pinned certificate, v2/v3 and hashes exact bytes', async () => {
  const { createPlan, CERTIFICATE_SHA256, parseSignature, collectSigned, sha256 } = await modulePromise;
  const plan = createPlan(context);
  const signatureText = `Verified using v2 scheme (APK Signature Scheme v2): true\nVerified using v3 scheme (APK Signature Scheme v3): true\nSigner #1 certificate SHA-256 digest: ${CERTIFICATE_SHA256}\n`;
  const apkBytes = Buffer.from('signed APK');
  const info = collectSigned({ plan, identity: plan, signatureText, apkBytes, unsignedBytes: Buffer.from('unsigned'), generatedAt: '2026-10-09T00:00:00.000Z' });
  assert.equal(info.apk.sha256, sha256(apkBytes));
  assert.equal(info.apk.size, apkBytes.length);
  assert.deepEqual(info.signatureSchemes, ['v2', 'v3']);
  assert.throws(() => parseSignature(signatureText.replace(CERTIFICATE_SHA256, 'b'.repeat(64))), /certificate/);
  assert.throws(() => parseSignature(signatureText.replace('v3): true', 'v3): false')), /v3/);
  assert.throws(() => parseSignature(signatureText + `Signer #2 certificate SHA-256 digest: ${CERTIFICATE_SHA256}\n`), /certificate/);
});
