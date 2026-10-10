// Generate "아이엠 헤드코치" lockup SVGs (outlined text) for two brand concepts.
// Usage: node gen.cjs <fontsDir> <outDir>
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const [fontsDir, outDir] = process.argv.slice(2);
const F = {
  plexBold: opentype.loadSync(path.join(fontsDir, 'IBMPlexSansKR-Bold.ttf')),
  ptSemi: opentype.loadSync(path.join(fontsDir, 'pretendard/public/static/Pretendard-SemiBold.otf')),
  ptXBold: opentype.loadSync(path.join(fontsDir, 'pretendard/public/static/Pretendard-ExtraBold.otf')),
};
const C = { night: '#141a16', pitch: '#2b5e3f', chalk: '#e8ede8', lime: '#b8e986', muted: '#8fa096' };
const DASH = 'M48 62C49.47 61.8 50.78 61.56 51.93 61.28M60.14 52.92C60.11 51.67 59.88 50.34 59.6 48.96M59.16 36.24C59.61 35.09 60.28 33.95 61.24 32.85M72.19 26.23C73.37 25.81 74.63 25.4 76 25';
const markStd = `<circle cx="33" cy="70" r="11" fill="${C.lime}"/><path d="${DASH}" fill="none" stroke="${C.chalk}" stroke-width="6" stroke-linecap="round"/><path d="M65.8 20.9L76 25L69.6 33.9" fill="none" stroke="${C.chalk}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
const markSmall = `<circle cx="31" cy="72" r="12" fill="${C.lime}"/><path d="M48 62C78 58 38 36 76 25" fill="none" stroke="${C.chalk}" stroke-width="9" stroke-linecap="round"/><path d="M63.9 20.2L76 25L68.4 35.5" fill="none" stroke="${C.chalk}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
const markBox = (small, x = 0, y = 0, s = 100) => small
  ? `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="14 14 72 72">${markSmall}</svg>`
  : `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="17 17 67 67">${markStd}</svg>`;

// Lay out text with manual tracking (em units). Returns {d, x1, y1, x2, y2} at the requested glyph height.
function text(font, str, { height, tracking = 0 }) {
  const size = 100;
  const layout = (sz) => {
    const p = new opentype.Path();
    let x = 0;
    for (const g of font.stringToGlyphs(str)) {
      p.extend(g.getPath(x, 0, sz));
      x += (g.advanceWidth / font.unitsPerEm) * sz + tracking * sz;
    }
    return p;
  };
  const b0 = layout(size).getBoundingBox();
  const sz = size * (height / (b0.y2 - b0.y1));
  const p = layout(sz);
  return { path: p, box: p.getBoundingBox(), size: sz };
}
function place(t, left, top) {
  // translate path so its bbox top-left lands on (left, top)
  const dx = left - t.box.x1, dy = top - t.box.y1;
  const p = new opentype.Path();
  for (const c of t.path.commands) {
    const n = { ...c };
    for (const k of ['x', 'y', 'x1', 'y1', 'x2', 'y2']) if (k in n) n[k] = +(n[k] + (k[0] === 'x' ? dx : dy)).toFixed(2);
    p.commands.push(n);
  }
  return { d: p.toPathData(2), right: left + (t.box.x2 - t.box.x1), bottom: top + (t.box.y2 - t.box.y1) };
}
const svg = (w, h, body, label, note) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${+w.toFixed(1)} ${h}" width="${Math.round(w)}" height="${h}" role="img" aria-label="${label}">\n  <!-- ${note} -->\n  ${body}\n</svg>\n`;
const write = (rel, s) => { const p = path.join(outDir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const LABEL = '아이엠 헤드코치';
const meta = {};

// ── Concept 01: minimal change. Run Line structure 1:1, Oswald -> IBM Plex Sans KR Bold (already loaded by the app).
{
  const t = text(F.plexBold, LABEL, { height: 44, tracking: -0.01 });
  const w = place(t, 110, 49.5 - 22);
  const W = w.right + 6;
  const body = (small) => `${markBox(small)}\n  <path d="${w.d}" fill="${C.chalk}"/>`;
  write('concept-01/assets/logo-header.svg', svg(W, 100, body(true), LABEL, 'Concept 01 header lockup (16-39px mark: solid small Run Line). Text: IBM Plex Sans KR Bold, outlined.'));
  write('concept-01/assets/logo-horizontal.svg', svg(W, 100, body(false), LABEL, 'Concept 01 horizontal lockup (40px+). Text: IBM Plex Sans KR Bold, outlined.'));
  write('concept-01/assets/wordmark.svg', svg(w.right - 110 + 2, 100, `<path transform="translate(-109 0)" d="${w.d}" fill="${C.chalk}"/>`, LABEL, 'Concept 01 wordmark only'));
  meta.c1 = { width: +W.toFixed(1), textHeight: 44, font: 'IBM Plex Sans KR Bold', tracking: '-0.01em' };
}

// ── Concept 02: Korean-first layout. Weight + tone contrast so "헤드코치" reads at header size.
{
  // one-line (header, share image)
  const pre = text(F.ptSemi, '아이엠', { height: 40, tracking: 0 });
  const main = text(F.ptXBold, '헤드코치', { height: 56, tracking: -0.02 });
  const bottom = 49.5 + 28;
  const p = place(pre, 106, bottom - 40);
  const m = place(main, p.right + 14, bottom - 56);
  const W = m.right + 6;
  const body = (small) => `${markBox(small)}\n  <path d="${p.d}" fill="${C.muted}"/>\n  <path d="${m.d}" fill="${C.chalk}"/>`;
  write('concept-02/assets/logo-header.svg', svg(W, 100, body(true), LABEL, 'Concept 02 one-line lockup, header (small solid mark). 아이엠: Pretendard SemiBold muted, 헤드코치: Pretendard ExtraBold chalk, bottoms aligned.'));
  write('concept-02/assets/logo-horizontal.svg', svg(W, 100, body(false), LABEL, 'Concept 02 one-line lockup (40px+).'));

  // stacked (splash, intro, store listing). Mark spans both lines.
  const pre2 = text(F.ptSemi, '아이엠', { height: 24, tracking: 0.06 });
  const main2 = text(F.ptXBold, '헤드코치', { height: 52, tracking: -0.02 });
  const top = 50 - (24 + 10 + 52) / 2;
  const p2 = place(pre2, 112, top);
  const m2 = place(main2, 110, top + 24 + 10);
  const W2 = Math.max(p2.right, m2.right) + 6;
  write('concept-02/assets/logo-stacked.svg', svg(W2, 100, `${markBox(false)}\n  <path d="${p2.d}" fill="${C.muted}"/>\n  <path d="${m2.d}" fill="${C.chalk}"/>`, LABEL, 'Concept 02 stacked lockup (logo height 48px+): splash, intro, store.'));
  meta.c2 = { width: +W.toFixed(1), stackedWidth: +W2.toFixed(1), fonts: 'Pretendard SemiBold (아이엠) + ExtraBold (헤드코치)' };
  // pieces for the intro animation
  write('concept-02/assets/parts.json', JSON.stringify({ stacked: { pre: p2.d, main: m2.d, width: W2 } }, null, 1));
}
{
  const t = text(F.plexBold, LABEL, { height: 44, tracking: -0.01 });
  const w = place(t, 110, 27.5);
  write('concept-01/assets/parts.json', JSON.stringify({ word: w.d, width: w.right + 6 }, null, 1));
}

// ── Shared, unchanged Run Line assets (copied verbatim from PR #47 for side-by-side previews)
write('shared/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">\n  <!-- Unchanged Run Line favicon (PR #47). -->\n  <rect width="32" height="32" rx="7" fill="${C.pitch}"/>\n  ${markBox(true, 3, 3, 26)}\n</svg>\n`);
write('shared/icon-store-512.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">\n  <!-- Unchanged Run Line store icon (PR #47). No name in the icon. -->\n  <rect width="512" height="512" fill="${C.pitch}"/>\n  <g transform="scale(4.7407)"><g transform="translate(54 54) scale(0.78) translate(-50.5 -49.5)">${markStd}</g></g>\n</svg>\n`);
console.log(JSON.stringify(meta));
