// Apply package A snippets to a Run Line (PR #47) index.html copy, the way the work request describes.
const fs = require('fs'), path = require('path');
const [site, pkg] = process.argv.slice(2);
const f = path.join(site, 'index.html');
let s = fs.readFileSync(f, 'utf8');
const snip = (n) => fs.readFileSync(path.join(pkg, 'assets/web', n), 'utf8');
const between = (str, a, b) => { const i = str.indexOf(a), j = str.indexOf(b, i); if (i < 0 || j < 0) throw new Error('marker missing: ' + a); return [i, j + b.length]; };
// 1. header
let [i, j] = between(s, '<h1 class="wordmark">', '</h1>');
const h = snip('header-logo.snippet.html'); const [hi, hj] = between(h, '<h1 class="wordmark">', '</h1>');
s = s.slice(0, i) + h.slice(hi, hj) + s.slice(j);
// 2. intro block
[i, j] = between(s, '<div id="brandIntro"', '</script>');
const it = snip('brand-intro.snippet.html'); const [ii, ij] = between(it, '<div id="brandIntro"', '</script>');
s = s.slice(0, i) + it.slice(ii, ij) + s.slice(j);
// 3. meta
s = s.replace(/<title>[^<]*<\/title>/, '<title>아이엠 헤드코치, 축구 포메이션 & 전술 공유</title>')
     .replace(/(og:title"\s+content=")[^"]*/, '$1아이엠 헤드코치, 축구 포메이션 & 전술 공유')
     .replace(/(twitter:title"\s+content=")[^"]*/, '$1아이엠 헤드코치, 축구 포메이션 & 전술 공유');
fs.writeFileSync(f, s);
console.log('applied');
