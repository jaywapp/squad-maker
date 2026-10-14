const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, existsSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { homedir } = require('node:os');
const { join, resolve } = require('node:path');

const root = resolve(__dirname, '../..');
const read = file => readFileSync(join(root, file), 'utf8');

function groovyJar() {
  if (process.env.SQUAD_GROOVY_JAR && existsSync(process.env.SQUAD_GROOVY_JAR)) return process.env.SQUAD_GROOVY_JAR;
  const distribution = join(process.env.GRADLE_USER_HOME || join(homedir(), '.gradle'), 'wrapper/dists/gradle-8.14.3-all');
  if (!existsSync(distribution)) return null;
  for (const entry of readdirSync(distribution, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const jar = join(distribution, entry.name, 'gradle-8.14.3/lib/groovy-3.0.24.jar');
    if (existsSync(jar)) return jar;
  }
  return null;
}

test('actual Gradle policy rejects unsafe variant, consent and version combinations', t => {
  const jar = groovyJar();
  if (!jar) return t.skip('Cache Gradle 8.14.3 or set SQUAD_GROOVY_JAR to run the actual Groovy policy');
  const java = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
  const output = execFileSync(java, ['-cp', jar, 'groovy.ui.GroovyMain',
    join(root, 'tests/unit/production-build-config.groovy'), join(root, 'scripts/production-build-config.gradle')],
  { encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] });
  assert.match(output, /Android build policy matrix passed/);
});

test('Android wiring preserves Preview identity and defaults every variant to test ads', () => {
  const gradle = read('android/app/build.gradle');
  assert.match(gradle, /namespace = "com\.jaywapp\.squadmaker\.preview"/);
  assert.match(gradle, /applicationId 'com\.jaywapp\.squadmaker\.preview'/);
  assert.match(gradle, /buildConfig true/);
  for (const field of ['ADS_TEST_ONLY', 'ADS_MODE', 'BANNER_AD_UNIT_ID', 'INTERSTITIAL_AD_UNIT_ID', 'UMP_UNDER_AGE_OF_CONSENT']) {
    assert.match(gradle, new RegExp(`buildConfigField '[^']+', '${field}'`));
  }
  assert.match(gradle, /manifestPlaceholders = \[admobAppId: buildPolicy\.testAds\.app\]/);
  assert.match(gradle, /withFlavor\('channel', 'production'\)\.withBuildType\('release'\)/);
  assert.match(gradle, /gradle\.taskGraph\.whenReady/);
  assert.match(gradle, /buildPolicy\.validateVariant\(flavor, buildType, adsMode, approvedProductionIdentity\)/);
  assert.doesNotMatch(gradle, /signingConfig|storeFile|keyAlias|storePassword|keyPassword/);
  assert.match(read('android/app/src/main/AndroidManifest.xml'), /android:value="\$\{admobAppId\}"/);
  assert.match(read('android/app/src/preview/res/values/strings.xml'), /아이엠 헤드코치 Preview/);
  assert.doesNotMatch(read('android/app/src/production/res/values/strings.xml'), /Preview/);
});

test('Preview metadata and the signed build helper use the Preview lineage', async () => {
  const { createPlan } = await import('../../scripts/apk-release-metadata.mjs');
  const plan = createPlan({ gradleSource: read('android/app/build.gradle'), sourceSha: 'a'.repeat(40),
    commitCount: 97, repository: 'jaywapp/squad-maker' });
  assert.equal(plan.versionCode, 1099);
  assert.equal(plan.versionName, '0.1.0-preview.1.main.97.aaaaaaaa');
  assert.equal(plan.applicationId, 'com.jaywapp.squadmaker.preview');
  const helper = read('scripts/build-preview-apk.ps1');
  assert.match(helper, /:app:assemblePreviewRelease :app:lintPreviewRelease/);
  assert.match(helper, /apk\\preview\\release\\app-preview-release-unsigned\.apk/);
  assert.match(read('scripts/ci-apk-version.gradle'), /productFlavors\.findByName\('preview'\)/);
});
