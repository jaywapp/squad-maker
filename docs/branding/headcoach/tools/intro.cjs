// Build concept intro pages from parts.json. Usage: node intro.cjs <conceptsDir>
// Motion follows the Run Line spec (docs: docs/branding/run-line/01-design-spec.md §6.1), only the wordmark step changes.
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];

const mark = `<svg class="mark" viewBox="17 17 67 67" aria-hidden="true">
      <defs>
        <mask id="run-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <path class="reveal" d="M44 62.5 L48 62 C78 58 38 36 76 25 L79.8 23.9" pathLength="100" fill="none" stroke="#fff" stroke-width="14" stroke-dasharray="100 100"/>
        </mask>
      </defs>
      <circle class="dot" cx="33" cy="70" r="11" fill="#b8e986"/>
      <g mask="url(#run-reveal)">
        <path d="M48 62 C78 58 38 36 76 25" pathLength="100" fill="none" stroke="#e8ede8" stroke-width="6" stroke-linecap="round" stroke-dasharray="7.3 23.6"/>
      </g>
      <path class="head" d="M65.8 20.9 L76 25 L69.6 33.9" fill="none" stroke="#e8ede8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

const base = (title, wordUnits, extraCss, word) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  /* Run Line intro (PR #47 splash-intro-reference.html) with an outlined Korean wordmark.
     No web fonts: the wordmark is SVG paths, so the Android bundle (which strips Google Fonts) renders it identically.
     CSS animations only. Default styles are the final state; prefers-reduced-motion drops the animations. */
  :root {
    --bg: #141a16;
    --m: clamp(56px, 18vmin, 220px);
    --gap: calc(var(--m) * 0.1);
    --ww: calc(var(--m) * ${wordUnits / 100});
    --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  }
  html, body { margin: 0; height: 100%; }
  body { background: var(--bg); min-height: 100dvh; display: grid; place-items: center; overflow: hidden; }
  .lockup { display: flex; align-items: center; gap: var(--gap); }
  .mark { width: var(--m); height: var(--m); display: block; overflow: visible; animation: shift 500ms 900ms var(--ease-out) both; }
  .dot { transform-box: fill-box; transform-origin: center; animation: pop 260ms 0ms cubic-bezier(0.16, 1, 0.3, 1) both; }
  .reveal { stroke-dashoffset: 0; animation: draw 600ms 180ms cubic-bezier(0.45, 0, 0.2, 1) both; }
  .head { transform-box: view-box; transform-origin: 76px 25px; animation: snap 180ms 740ms cubic-bezier(0.16, 1, 0.3, 1) both; }
  .word { width: var(--ww); height: var(--m); display: block; overflow: visible; }
${extraCss}
  @keyframes pop { 0% { transform: scale(0.2); opacity: 0; } 45% { opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
  @keyframes draw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
  @keyframes snap { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes shift { from { transform: translateX(calc((var(--ww) + var(--gap)) / 2)); } to { transform: translateX(0); } }
  @keyframes word-in { from { opacity: 0; transform: translateX(calc(var(--m) * -0.08)); clip-path: inset(0 100% 0 0); } to { opacity: 1; transform: translateX(0); clip-path: inset(0 0 0 0); } }
  @keyframes rise { from { opacity: 0; transform: translateY(calc(var(--m) * 0.08)); } to { opacity: 1; transform: translateY(0); } }
  @media (prefers-reduced-motion: reduce) { .mark, .dot, .reveal, .head, .word, .word * { animation: none; } }
</style>
</head>
<body>
  <div class="lockup" role="img" aria-label="아이엠 헤드코치">
    ${mark}
    ${word}
  </div>
<script>
  // Tap to skip: jump every animation to its end state.
  document.addEventListener('pointerdown', function () { document.getAnimations().forEach(function (a) { a.finish(); }); });
</script>
</body>
</html>
`;

{
  const p = JSON.parse(fs.readFileSync(path.join(dir, 'concept-01/assets/parts.json'), 'utf8'));
  const units = p.width - 110;
  fs.writeFileSync(path.join(dir, 'concept-01/intro.html'), base('아이엠 헤드코치 인트로 (시안 A)', units,
    '  .word { animation: word-in 340ms 1060ms var(--ease-out) both; }',
    `<svg class="word" viewBox="110 0 ${units.toFixed(1)} 100" aria-hidden="true"><path d="${p.word}" fill="#e8ede8"/></svg>`));
}
{
  const p = JSON.parse(fs.readFileSync(path.join(dir, 'concept-02/assets/parts.json'), 'utf8')).stacked;
  const units = p.width - 110;
  fs.writeFileSync(path.join(dir, 'concept-02/intro.html'), base('아이엠 헤드코치 인트로 (시안 B)', units,
    '  .pre { animation: rise 300ms 1040ms var(--ease-out) both; }\n  .main { animation: word-in 320ms 1080ms var(--ease-out) both; }',
    `<svg class="word" viewBox="110 0 ${units.toFixed(1)} 100" aria-hidden="true"><path class="pre" d="${p.pre}" fill="#8fa096"/><path class="main" d="${p.main}" fill="#e8ede8"/></svg>`));
}
console.log('ok');
