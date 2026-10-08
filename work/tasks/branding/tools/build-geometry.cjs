// Run Line 마크 기하 계산: 점선 패턴을 실제 3차 베지어 조각으로 분해하고, 워드마크를 Oswald 600 아웃라인으로 변환한다.
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const P = [[48, 62], [78, 58], [38, 36], [76, 25]]; // M48 62 C78 58 38 36 76 25
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const point = t => {
  const mt = 1 - t;
  return [0, 1].map(i => mt * mt * mt * P[0][i] + 3 * mt * mt * t * P[1][i] + 3 * mt * t * t * P[2][i] + t * t * t * P[3][i]);
};
// 호 길이 표
const N = 4000; const ts = [0]; const ls = [0];
let prev = point(0), acc = 0;
for (let i = 1; i <= N; i++) { const t = i / N; const p = point(t); acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]); ts.push(t); ls.push(acc); prev = p; }
const L = acc;
const tAt = len => { // 길이 → t (선형 보간)
  if (len <= 0) return 0; if (len >= L) return 1;
  let lo = 0, hi = N; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ls[mid] < len) lo = mid; else hi = mid; }
  const f = (len - ls[lo]) / (ls[hi] - ls[lo]); return ts[lo] + (ts[hi] - ts[lo]) * f;
};
// de Casteljau 구간 분할
const split = (pts, t) => { const [a, b, c, d] = pts; const ab = lerp(a, b, t), bc = lerp(b, c, t), cd = lerp(c, d, t); const abc = lerp(ab, bc, t), bcd = lerp(bc, cd, t); const m = lerp(abc, bcd, t); return [[a, ab, abc, m], [m, bcd, cd, d]]; };
const segment = (t0, t1) => { let right = split(P, t0)[1]; const local = (t1 - t0) / (1 - t0); return split(right, local)[0]; };
const f = n => +n.toFixed(2);
// 원본: pathLength=100, dasharray 7.3 23.6 → 대시 시작 0, 30.9, 61.8, 92.7, 각 7.3
const unit = L / 100; const dashes = [];
for (let s = 0; s < 100; s += 30.9) { const e = Math.min(100, s + 7.3); dashes.push([s, e]); }
const d = dashes.map(([s, e]) => { const seg = segment(tAt(s * unit), tAt(e * unit)); return `M${f(seg[0][0])} ${f(seg[0][1])}C${f(seg[1][0])} ${f(seg[1][1])} ${f(seg[2][0])} ${f(seg[2][1])} ${f(seg[3][0])} ${f(seg[3][1])}`; }).join('');

// 워드마크 아웃라인: logo-horizontal.svg의 <text x=110 y=68 size=46 letter-spacing=1.8 textLength=268 spacingAndGlyphs>
const font = opentype.loadSync(path.join(__dirname, 'Oswald-600.woff'));
const text = 'SQUAD MAKER', size = 46, tracking = 1.8;
let x = 0; const glyphs = font.stringToGlyphs(text); const scale = size / font.unitsPerEm; const parts = [];
glyphs.forEach((g, i) => { parts.push({ g, x }); x += g.advanceWidth * scale + tracking; if (i < glyphs.length - 1) x += font.getKerningValue(g, glyphs[i + 1]) * scale; });
const natural = x - tracking; // 마지막 글자 뒤 자간 제외
const sx = 268 / natural;
const pathData = parts.map(({ g, x: gx }) => g.getPath(0, 0, size).commands.map(c => {
  const tx = (px) => f(110 + (gx + px) * sx); const ty = (py) => f(68 + py);
  if (c.type === 'M') return `M${tx(c.x)} ${ty(c.y)}`; if (c.type === 'L') return `L${tx(c.x)} ${ty(c.y)}`;
  if (c.type === 'Q') return `Q${tx(c.x1)} ${ty(c.y1)} ${tx(c.x)} ${ty(c.y)}`;
  if (c.type === 'C') return `C${tx(c.x1)} ${ty(c.y1)} ${tx(c.x2)} ${ty(c.y2)} ${tx(c.x)} ${ty(c.y)}`; return 'Z';
}).join('')).join('');
const out = { runLength: +L.toFixed(3), dashes, dashPath: d, wordmark: { naturalWidth: +natural.toFixed(2), scaleX: +sx.toFixed(4), path: pathData, font: `${font.names.fontFamily.en} ${font.names.fontSubfamily.en}` } };
fs.writeFileSync(path.join(__dirname, 'geometry.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify({ runLength: out.runLength, dashes, dashPath: d, wordmark: { naturalWidth: out.wordmark.naturalWidth, scaleX: out.wordmark.scaleX, font: out.wordmark.font, pathChars: pathData.length } }, null, 1));
