// Build the Concept A handoff package (docs/branding/headcoach/) from the generated concept-01 assets.
// Usage: node package-a.cjs <conceptsDir> <packageDir> <runLinePackageDir>
const fs = require('fs');
const path = require('path');
const [cdir, out, runLine] = process.argv.slice(2);
const read = (p) => fs.readFileSync(p, 'utf8');
const write = (rel, s) => { const p = path.join(out, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const copy = (src, rel) => { const p = path.join(out, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.copyFileSync(src, p); };
const NAME = '아이엠 헤드코치';
const CHALK = '#e8ede8', NIGHT = '#141a16';

// SVG: dark-background originals + light-background variants (chalk -> night, lime token unchanged; Run Line spec §7)
const a = path.join(cdir, 'concept-01/assets');
for (const f of ['logo-header.svg', 'logo-horizontal.svg', 'wordmark.svg']) {
  const s = read(path.join(a, f)).replace(/Concept 01 /g, '');
  write(`assets/svg/${f}`, s);
  write(`assets/svg/${f.replace('.svg', '-on-light.svg')}`, s.split(CHALK).join(NIGHT).replace('<!-- ', '<!-- Light background variant. '));
}
// Unchanged Run Line assets, copied for completeness of the package
for (const f of ['run-line-symbol.svg', 'run-line-symbol-small.svg', 'favicon.svg', 'icon-store-512.svg']) copy(path.join(runLine, 'assets/svg', f), `assets/svg/unchanged/${f}`);
copy(path.join(runLine, 'assets/preview/icon-store-512.png'), 'assets/png/unchanged/icon-store-512.png');

// Web snippets
const parts = JSON.parse(read(path.join(a, 'parts.json')));
const units = +(parts.width - 110).toFixed(1);
const headerSvg = read(path.join(a, 'logo-header.svg'));
const inner = headerSvg.replace(/^[\s\S]*?<!--[\s\S]*?-->\s*/, '').replace(/<\/svg>\s*$/, '').trim();
const vb = headerSvg.match(/viewBox="([^"]+)"/)[1];
write('assets/web/header-logo.snippet.html', `<!-- ═══ 좌상단 헤더 로고 (아이엠 헤드코치, A안) ════════════════════════
  Run Line 적용 후 index.html의 h1.wordmark 블록(여는 h1 태그부터 닫는 h1 태그까지) 전체를 아래로 교체한다.
  - h1.wordmark 요소·클래스, svg.wordmark-logo 클래스는 유지한다(tests/e2e/guest-free-regression.spec.js, brand-intro.spec.js).
  - 표시 높이: 모바일 28px, 1024px 이상 32px. 기존 .wordmark-logo CSS 2줄을 그대로 쓴다(바꿀 CSS 없음).
  - 글자는 IBM Plex Sans KR Bold 아웃라인 경로라 글꼴 파일이 필요 없다.
  ═════════════════════════════════════════════════════════════════════ -->
<h1 class="wordmark">
  <svg class="wordmark-logo" viewBox="${vb}" role="img" aria-label="${NAME}">
    ${inner}
  </svg>
</h1>
<!-- ═══ /좌상단 헤더 로고 ═════════════════════════════════════════════ -->
`);

let intro = read(path.join(runLine, 'assets/web/brand-intro.snippet.html'));
intro = intro
  .replace('BRAND INTRO (Run Line)', 'BRAND INTRO (아이엠 헤드코치, A안: Run Line 모션 + 한글 워드마크)')
  .replace('워드마크는 Oswald SemiBold 아웃라인 경로라', '워드마크는 IBM Plex Sans KR Bold 아웃라인 경로라')
  .replace('aria-label="스쿼드 메이커"', `aria-label="${NAME}"`)
  .replace(/<div class="bi-word">[\s\S]*?<\/div>\n  <\/div>/, `<svg class="bi-word" viewBox="110 0 ${units} 100" aria-hidden="true"><path d="${parts.word}" fill="${CHALK}"/></svg>\n  </div>`)
  .replace('--F: calc(var(--m) * 0.42); --gap: calc(var(--m) * 0.2); --ww: calc(var(--F) * 6.4);', `--gap: calc(var(--m) * 0.1); --ww: calc(var(--m) * ${units / 100});`)
  .replace(/  \.bi-word \{[^\n]*\n/, '  .bi-word { width: var(--ww); height: var(--m); display: block; overflow: visible; animation: bi-word-in 340ms 1060ms var(--ease-out) both; }\n')
  .replace(/  \.bi-en \{[^\n]*\n/, '')
  .replace(/  \.bi-ko \{[^\n]*\n[^\n]*\n/, '')
  .replace('transform: translateX(calc(var(--F) * -0.5));', 'transform: translateX(calc(var(--m) * -0.08));');
if (/bi-en|bi-ko|var\(--F\)|스쿼드 메이커/.test(intro)) throw new Error('intro snippet still references Run Line wordmark');
write('assets/web/brand-intro.snippet.html', intro);

write('assets/web/meta.snippet.html', `<!-- index.html <head>: 이름만 바꾸고 설명 부분은 그대로 둔다(분석 Q3 기본안). -->
<title>${NAME}, 축구 포메이션 & 전술 공유</title>
<meta property="og:title"       content="${NAME}, 축구 포메이션 & 전술 공유">
<meta name="twitter:title"       content="${NAME}, 축구 포메이션 & 전술 공유">
`);
console.log(JSON.stringify({ units, vb }));
