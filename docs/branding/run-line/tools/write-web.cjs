// 웹 적용 스니펫 생성: 앱 안 모션 인트로(#brandIntro), 좌상단 헤더 로고(h1.wordmark 내부), 파비콘 링크
const fs = require('fs');
const path = require('path');
const g = JSON.parse(fs.readFileSync(path.join(__dirname, 'geometry.json'), 'utf8'));
const out = process.argv[2];
const WORD = g.wordmark.path;
const DASH = g.dashPath;
const write = (rel, text) => { const p = path.join(out, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text.trim() + '\n'); };

write('assets/web/brand-intro.snippet.html', `
<!-- ═══ BRAND INTRO (Run Line) ═══════════════════════════════════════════
  붙여 넣는 위치: index.html <body> 바로 다음 (첫 번째 자식).
  - CSS 애니메이션만 사용, 총 1400ms. 기본 스타일 = 마지막 정지 상태(동작 줄이기 대응).
  - 워드마크는 Oswald SemiBold 아웃라인 경로라 Android 번들(구글 글꼴 없음)에서도 동일.
  - 표시 조건·닫기는 아래 <script data-brand-intro>가 처리: 네이티브 앱에서만, 애니메이션 끝 + SquadMakerContract.ready() 둘 다 충족 시 닫음.
  - 주의: scripts/build-android-web.mjs는 index.html의 "첫 번째 <script>" 문자열 앞에 platform-native.js를 끼워 넣는다.
    이 스크립트 태그에 data-brand-intro 속성을 붙여 그 치환 대상이 되지 않게 했다. 속성을 지우지 말 것.
  ═════════════════════════════════════════════════════════════════════ -->
<div id="brandIntro" class="brand-intro" role="img" aria-label="스쿼드 메이커" hidden>
  <div class="bi-lockup">
    <svg class="bi-mark" viewBox="17 17 67 67" aria-hidden="true">
      <defs>
        <mask id="biRunReveal" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <path class="bi-reveal" d="M44 62.5 L48 62 C78 58 38 36 76 25 L79.8 23.9" pathLength="100"
                fill="none" stroke="#fff" stroke-width="14" stroke-dasharray="100 100"/>
        </mask>
      </defs>
      <circle class="bi-dot" cx="33" cy="70" r="11" fill="#b8e986"/>
      <g mask="url(#biRunReveal)">
        <path d="${DASH}" fill="none" stroke="#e8ede8" stroke-width="6" stroke-linecap="round"/>
      </g>
      <path class="bi-head" d="M65.8 20.9 L76 25 L69.6 33.9" fill="none" stroke="#e8ede8"
            stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div class="bi-word">
      <svg class="bi-en" viewBox="108 28 274 42" aria-hidden="true"><path d="${WORD}" fill="#e8ede8"/></svg>
      <span class="bi-ko" aria-hidden="true">스쿼드 메이커</span>
    </div>
  </div>
</div>
<style>
  .brand-intro {
    --m: clamp(56px, 18vmin, 220px); --F: calc(var(--m) * 0.42); --gap: calc(var(--m) * 0.2); --ww: calc(var(--F) * 6.4);
    --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
    position: fixed; inset: 0; z-index: 4000; background: #141a16;
    display: grid; place-items: center; overflow: hidden;
    transition: opacity 220ms ease-out;
  }
  .brand-intro[hidden] { display: none; }
  .brand-intro.is-leaving { opacity: 0; pointer-events: none; }
  .bi-lockup { display: flex; align-items: center; gap: var(--gap); }
  .bi-mark { width: var(--m); height: var(--m); display: block; overflow: visible; animation: bi-shift 500ms 900ms var(--ease-out) both; }
  .bi-dot { transform-box: fill-box; transform-origin: center; animation: bi-pop 260ms 0ms cubic-bezier(0.16, 1, 0.3, 1) both; }
  .bi-reveal { stroke-dashoffset: 0; animation: bi-draw 600ms 180ms cubic-bezier(0.45, 0, 0.2, 1) both; }
  .bi-head { transform-box: view-box; transform-origin: 76px 25px; animation: bi-snap 180ms 740ms cubic-bezier(0.16, 1, 0.3, 1) both; }
  .bi-word { width: var(--ww); display: flex; flex-direction: column; gap: calc(var(--F) * 0.18); animation: bi-word-in 440ms 960ms var(--ease-out) both; }
  .bi-en { height: calc(var(--F) * 0.92); width: auto; display: block; }
  .bi-ko { font-family: 'IBM Plex Sans KR', 'Noto Sans KR', 'Malgun Gothic', sans-serif; font-weight: 500;
    font-size: calc(var(--F) * 0.42); line-height: 1; letter-spacing: 0.32em; color: #8fa096; white-space: nowrap; }
  @keyframes bi-pop { 0% { transform: scale(0.2); opacity: 0; } 45% { opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
  @keyframes bi-draw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
  @keyframes bi-snap { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes bi-shift { from { transform: translateX(calc((var(--ww) + var(--gap)) / 2)); } to { transform: translateX(0); } }
  @keyframes bi-word-in { from { opacity: 0; transform: translateX(calc(var(--F) * -0.5)); clip-path: inset(0 100% 0 0); }
                          to { opacity: 1; transform: translateX(0); clip-path: inset(0 0 0 0); } }
  @media (prefers-reduced-motion: reduce) {
    .bi-mark, .bi-dot, .bi-reveal, .bi-head, .bi-word { animation: none; }
    .brand-intro { transition: none; }
  }
</style>
<script data-brand-intro>
(() => {
  const intro = document.getElementById('brandIntro');
  // 네이티브 앱에서만 보인다 (웹 공유 링크 열람자·브라우저 사용자는 바로 화면을 본다).
  // Capacitor 네이티브 브리지는 페이지 스크립트보다 먼저 주입되므로 window.Capacitor로 판단한다.
  // (platform-native.js는 이 시점에 아직 로드되지 않았다. 아래 <script data-brand-intro> 참고)
  const cap = window.Capacitor;
  const native = Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  if (!intro || !native) { if (intro) intro.remove(); return; }
  intro.hidden = false;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOTION_MS = reduce ? 400 : 1400;           // 동작 줄이기: 정지 로고를 짧게만 보여 줌
  const MAX_MS = 6000;                              // 저장소 준비가 늦어도 6초 뒤에는 닫는다(앱의 부팅 잠금 표시가 이어받음)
  let motionDone = false, ready = false, closed = false;
  const close = () => {
    if (closed) return; closed = true;
    intro.classList.add('is-leaving');
    setTimeout(() => intro.remove(), reduce ? 0 : 240);
  };
  const tryClose = () => { if (motionDone && ready) close(); };
  setTimeout(() => { motionDone = true; tryClose(); }, MOTION_MS);
  setTimeout(close, MAX_MS);
  // 탭하면 모션을 끝 상태로 건너뛴다 (닫기는 준비 완료를 기다림)
  intro.addEventListener('pointerdown', () => {
    intro.getAnimations({ subtree: true }).forEach(a => a.finish());
    motionDone = true; tryClose();
  });
  const waitReady = () => window.SquadMakerContract
    ? window.SquadMakerContract.ready().then(() => { ready = true; tryClose(); }, () => { ready = true; tryClose(); })
    : setTimeout(waitReady, 50);
  waitReady();
})();
</script>
<!-- ═══ /BRAND INTRO ═════════════════════════════════════════════════ -->`);

write('assets/web/header-logo.snippet.html', `
<!-- ═══ 좌상단 헤더 로고 ═══════════════════════════════════════════════
  index.html의 기존 <h1 class="wordmark">SQUAD MAKER<span class="wm-sub">전술 보드</span></h1> 을 아래로 교체.
  - h1.wordmark 요소와 클래스는 유지한다(회귀 테스트 tests/e2e/guest-free-regression.spec.js가 노출을 확인).
  - 표시 높이: 모바일 28px, 데스크톱(1024px 이상) 32px. 소형 실선 심볼 + 워드마크 아웃라인.
  ═════════════════════════════════════════════════════════════════════ -->
<h1 class="wordmark">
  <svg class="wordmark-logo" viewBox="0 0 384 100" role="img" aria-label="스쿼드 메이커">
    <svg x="0" y="0" width="100" height="100" viewBox="14 14 72 72">
      <circle cx="31" cy="72" r="12" fill="#b8e986"/>
      <path d="M48 62C78 58 38 36 76 25" fill="none" stroke="#e8ede8" stroke-width="9" stroke-linecap="round"/>
      <path d="M63.9 20.2L76 25L68.4 35.5" fill="none" stroke="#e8ede8" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <path d="${WORD}" fill="#e8ede8"/>
  </svg>
</h1>
<style>
  /* 기존 .wordmark 글꼴 규칙을 덮는다 (A UI CSS 블록 뒤에 둘 것) */
  .wordmark { display: flex; align-items: center; line-height: 0; letter-spacing: 0; }
  .wordmark-logo { height: 28px; width: auto; display: block; }
  @media (min-width: 1024px) { .wordmark-logo { height: 32px; } }
</style>
<!-- ═══ /좌상단 헤더 로고 ═════════════════════════════════════════════ -->`);

write('assets/web/favicon.snippet.html', `
<!-- index.html <head>의 기존 이모지 파비콘 2줄(rel="icon", rel="apple-touch-icon")을 아래로 교체 -->
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(fs.readFileSync(path.join(out, 'assets/svg/favicon.svg'), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim())}">`);
console.log('web snippets written');
