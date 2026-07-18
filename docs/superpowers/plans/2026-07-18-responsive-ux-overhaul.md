# 반응형 UX 개편 + 전술 보드 테마 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** squad-maker를 작성자(PC 2패널)·열람자(모바일 뷰어 모드) 모두에게 맞는 반응형 구조로 개편하고 전술 보드 테마로 교체한다.

**Architecture:** 단일 파일 `index.html` 유지. 좌표계는 480×660 고정, 렌더링만 `transform: scale`/캔버스 백킹 스토어로 반응형화. 공유 링크(`#s=`) 진입 시 body 클래스 기반 뷰어 모드. 데스크톱은 CSS Grid 2패널.

**Tech Stack:** Vanilla HTML/CSS/JS, html2canvas, gif.js. 빌드 없음.

## Global Constraints

- 좌표계·저장 포맷(`v:1` 스냅샷)·GIF 출력 480×660 절대 불변.
- 단일 파일 `index.html` 유지, 새 외부 의존 금지(웹폰트 1종 예외, `font-display: swap`).
- 복원 경로 신규 필드는 반드시 sanitize 통과.
- UI 텍스트 한국어, 커밋은 conventional commits 영어.
- 각 태스크 종료 시: 인라인 스크립트 `node --check` + 헤드리스 스크린샷(390/1440px) 확인 후 커밋.

**검증 공통 명령** (각 태스크 Step에서 "구문 검증 + 스크린샷"으로 지칭):

```powershell
# 구문 검증 (PowerShell 5.1)
$html = Get-Content index.html -Raw -Encoding UTF8
$m = [regex]::Match($html, '(?s)<script>(?!.*<script>)(.*)</script>')
[IO.File]::WriteAllText("$env:TEMP\sm-check.js", $m.Groups[1].Value, [Text.UTF8Encoding]::new($false))
node --check "$env:TEMP\sm-check.js"   # 기대: 출력 없음(성공)

# 스크린샷 (스크래치 디렉토리에)
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
& $chrome --headless=new --disable-gpu --window-size=390,844  --hide-scrollbars --virtual-time-budget=8000 --screenshot="$out\m.png" "file:///D:/workspace/repositories/apps/squad-maker/index.html"
& $chrome --headless=new --disable-gpu --window-size=1440,900 --hide-scrollbars --virtual-time-budget=8000 --screenshot="$out\d.png" "file:///D:/workspace/repositories/apps/squad-maker/index.html"
```

---

### Task 1: 필드 스케일링 기반

**Files:**
- Modify: `index.html` — CSS `#fieldWrapper`/`#field`/`#patternCanvas` 블록, JS DRAG 섹션, `saveImage()`, INIT 섹션

**Interfaces:**
- Produces: `getFieldScale(): number`, `applyFieldScale(): void` — 이후 태스크(2패널·뷰어)가 레이아웃 변경 후 호출.

- [ ] **Step 1: CSS를 반응형으로 교체**

`#fieldWrapper` 규칙(현 `width:480px; height:660px`)을 다음으로 교체:

```css
#fieldWrapper {
  position: relative; width: 100%; max-width: 480px;
  aspect-ratio: 480 / 660; flex-shrink: 0;
}
#field {
  position: absolute; top: 0; left: 0;
  width: 480px; height: 660px; border-radius: 6px;
  transform-origin: top left;
  background: #276d41; box-shadow: 0 8px 32px rgba(0,0,0,0.6); overflow: hidden;
}
#patternCanvas {
  position: absolute; top: 0; left: 0;
  transform-origin: top left;
  border-radius: 6px; box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  cursor: crosshair; display: none;
}
```

미디어쿼리(≤500px)의 `#fieldWrapper { overflow-x: auto; }` 삭제.

- [ ] **Step 2: 스케일 적용 JS 추가**

CONSTANTS 아래에 추가. 캔버스는 백킹 스토어를 `s×dpr`로 재설정하고 좌표계는 setTransform으로 480×660 유지(선명도 확보). 모든 렌더 함수는 그대로 480 좌표를 사용.

```js
function getFieldScale() {
  const w = document.getElementById('fieldWrapper').getBoundingClientRect().width;
  return w / FIELD_W || 1;
}
function applyFieldScale() {
  const s = getFieldScale();
  document.getElementById('field').style.transform = `scale(${s})`;
  const dpr = window.devicePixelRatio || 1;
  pCanvas.style.width  = (FIELD_W * s) + 'px';
  pCanvas.style.height = (FIELD_H * s) + 'px';
  pCanvas.width  = Math.round(FIELD_W * s * dpr);
  pCanvas.height = Math.round(FIELD_H * s * dpr);
  pCtx.setTransform(s * dpr, 0, 0, s * dpr, 0, 0);
  if (appMode === 'pattern' && !isPlaying) renderPatternFrame(0);
}
window.addEventListener('resize', applyFieldScale);
```

INIT 블록 끝에 `applyFieldScale();` 추가. `pCanvas`/`pCtx` 선언이 이 함수보다 앞서야 함(현재 1392행 부근 — CONSTANTS 뒤에 두면 순서 문제 없도록 함수 정의만 앞에 두고 호출은 INIT에서).

- [ ] **Step 3: HTML 필드 드래그 스케일 보정**

mouse/touch move 핸들러의 델타 계산에 `/s` 적용 (mousedown·touchstart에서 `sc: getFieldScale()` 저장):

```js
// dragState 생성부에 sc 추가
dragState = { id, el: pe, sx: e.clientX, sy: e.clientY, px: p.x, py: p.y, sc: getFieldScale() };
// mousemove / touchmove
const x = Math.max(26, Math.min(FIELD_W-26, dragState.px + (e.clientX - dragState.sx) / dragState.sc));
const y = Math.max(26, Math.min(FIELD_H-26, dragState.py + (e.clientY - dragState.sy) / dragState.sc));
```

(터치는 `t.clientX/Y`.) `canvasCoords()`는 rect 기반이라 수정 불요 — 단, `pCanvas.width`가 dpr 배수로 바뀌므로 `FIELD_W / rect.width` 계산은 그대로 유효함을 확인.

- [ ] **Step 4: saveImage 스케일 임시 해제**

```js
function saveImage() {
  // ...banner 생성까지 동일...
  const wrapper = document.getElementById('fieldWrapper');
  const prevMax = wrapper.style.maxWidth, prevTf = f.style.transform;
  wrapper.style.maxWidth = '480px'; wrapper.style.width = '480px'; f.style.transform = 'none';
  html2canvas(f, { scale:2.5, backgroundColor:'#276d41', useCORS:true, logging:false })
    .then(canvas => { /* 기존 다운로드 */ })
    .finally(() => {
      wrapper.style.maxWidth = prevMax; wrapper.style.width = ''; f.style.transform = prevTf;
      applyFieldScale();
      if (banner.parentNode) f.removeChild(banner);
    });
}
```

- [ ] **Step 5: 검증 — 하니스로 드래그 보정 단언**

스크래치에 `test-harness.html` 생성(iframe 390px 폭으로 앱 로드) 후:
- `iframe.contentWindow.eval('getFieldScale()')` < 1 확인
- 선수 1명에 MouseEvent(mousedown@중심 → mousemove +50px → mouseup) 디스패치, `squads.basic.positions` 델타가 `50/scale`±2 인지 단언
- 390px에서 필드 우측 잘림 없는지 스크린샷 확인(수비3·미드3 보임)

구문 검증 + 스크린샷(390/1440). 하니스 파일은 커밋하지 않음.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: responsive field scaling with fixed 480x660 coordinate system"
```

---

### Task 2: 뷰어 모드 (공유 링크 열람 전용)

**Files:**
- Modify: `index.html` — INIT 분기, autoSave 가드, 인터랙션 가드, 뷰어 배너/버튼 HTML+CSS, 읽기 전용 지침 카드

**Interfaces:**
- Consumes: `applyFieldScale()`
- Produces: 전역 `viewerMode: boolean`, `body.viewer-mode` 클래스, `.editor-only` CSS 클래스 — 이후 태스크의 표시 조건에 사용.

- [ ] **Step 1: 뷰어 모드 상태·초기화 분기**

```js
let viewerMode = false;
// INIT
if (loadFromURL()) {
  viewerMode = true;
  document.body.classList.add('viewer-mode');
  refreshUI();
  renderViewerBar();
} else if (!loadFromLocalStorage()) {
  initAllSquads();
}
```

기존 `readonlyBanner`는 뷰어 바(Step 3)로 대체 — 배너 요소·CSS 삭제.

- [ ] **Step 2: 저장·편집 차단**

- `autoSave()` 첫 줄에 `if (viewerMode) return;`
- 필드 mousedown/touchstart, dblclick(startInlineEdit), contextmenu(showCtxMenu) 핸들러 첫 줄에 `if (viewerMode) return;`
- `beginDraw()` 첫 줄에 `if (viewerMode) return false;`
- 패턴 캔버스 contextmenu 삭제 로직에 `if (viewerMode) return;`

- [ ] **Step 3: 편집 UI 숨김 + 뷰어 바**

편집 전용 요소에 `editor-only` 클래스 부여: 팀 설정 카드, 선수 컨트롤(controls), 지침 입력 카드(notes-wrap 내 textarea 카드), 공유/파일 controls, 포메이션 select·초기화 버튼, 패턴 bar의 이름 입력·추가/삭제·`+ 단계`/`🗑 단계`·`↺ 단계 초기화`, 매치 전략 탭 버튼.

```css
.viewer-mode .editor-only { display: none !important; }
.viewer-bar {
  width:100%; max-width:480px; display:flex; align-items:center; gap:10px;
  background:#1c241e; border:1px solid #2c3830; border-radius:10px; padding:10px 14px;
}
.viewer-bar .vb-title { flex:1; font-weight:700; font-size:0.9rem; }
```

`renderViewerBar()`: 팀명 + "공유받은 전술" 라벨 + 버튼 2개:
- **내 스쿼드로 가져오기**: 확인 후 `localStorage.setItem(LS_KEY, JSON.stringify(buildStateSnap()))` → `location.href = location.pathname` (해시 제거 리로드 → 편집 모드).
- **내 스쿼드 열기**: `location.href = location.pathname`.

패턴 모드의 미리보기·GIF 저장·패턴/단계 이전다음 nav는 뷰어에서도 유지.

- [ ] **Step 4: 읽기 전용 지침 카드**

뷰어 모드 스쿼드 탭에서 지침을 카드로 표시(입력 대신). `renderNotesPanel()` 안에서 분기:

```js
if (viewerMode) {
  document.getElementById('notesWrap').innerHTML = buildViewerNotesHtml(sq);
  return;
}
```

`buildViewerNotesHtml(sq)`: 팀 전체 지침 텍스트 + 지침 있는 선수만 `이름: 지침` 목록. 전부 비었으면 카드 자체 숨김. XSS: 반드시 `escHtml` 경유.

- [ ] **Step 5: 검증**

하니스: `#s=<enc>` 로 iframe 로드 →
- `viewerMode === true`, `.editor-only` 전부 display none
- 드래그 디스패치해도 positions 불변
- localStorage에 키 미생성(`autoSave` 차단) 확인
- 뷰어 스크린샷(390px) — 뷰어 바·읽기 카드 확인

구문 검증 + 스크린샷. Commit:

```bash
git commit -am "feat: read-only viewer mode for shared links with storage isolation"
```

---

### Task 3: 데스크톱 2패널 레이아웃

**Files:**
- Modify: `index.html` — body 마크업 래핑, 레이아웃 CSS, `setAppMode()` 클래스 정리

**Interfaces:**
- Consumes: `applyFieldScale()` (레이아웃 전환 시 호출), `.editor-only`
- Produces: `.layout`/`.pane-field`/`.pane-side` 구조 — 테마 태스크가 이 구조 기준으로 스타일링.

- [ ] **Step 1: 마크업 래핑**

`<main>` 내부를 재구성 (요소 자체는 이동만, id/class 유지):

```html
<main>
  <div class="layout">
    <div class="pane-field">
      <!-- squad-tabs, formation-bar, fieldWrapper, hintText -->
    </div>
    <div class="pane-side">
      <!-- team-setup, patternUI, 선수 controls, notesWrap, 공유 controls, strategyUI -->
    </div>
  </div>
</main>
```

app-tabs·viewer-bar는 `.layout` 밖(위) 전체 폭 유지. 모바일에서는 pane-field → pane-side 순 세로 스택(팀 설정이 필드 아래로 내려가는 순서 변경은 의도된 것 — 모바일은 필드가 주인공).

- [ ] **Step 2: 레이아웃 CSS**

```css
.layout { width:100%; display:flex; flex-direction:column; align-items:center; gap:10px; }
.pane-field, .pane-side { width:100%; max-width:480px; display:flex; flex-direction:column; align-items:center; gap:10px; }

@media (min-width: 1024px) {
  .layout { flex-direction:row; align-items:flex-start; justify-content:center; gap:28px; max-width:1160px; }
  .pane-field { max-width:640px; position:sticky; top:16px; }
  .pane-field #fieldWrapper { max-width:640px; }
  .pane-side { max-width:440px; align-items:stretch; }
  body.mode-strategy .pane-field { display:none; }
  body.mode-strategy .pane-side { max-width:640px; }
}
```

기존 `.team-setup, .squad-tabs, ...` 공통 max-width 규칙은 `.pane-side`/`.pane-field` 내부 100%로 정리. `@media (min-width:960px) body max-width` 규칙 삭제.

- [ ] **Step 3: setAppMode 정리**

`setAppMode()`에서 `document.body.classList.toggle('mode-' + m, ...)` 로 `mode-squad`/`mode-pattern`/`mode-strategy` 클래스 부여(기존 인라인 style.display 토글은 유지하되 strategy 필드 숨김은 body 클래스 CSS로도 동작). 모드 전환 끝에 `applyFieldScale()` 호출(2패널 진입/이탈 시 폭 변동 대응).

- [ ] **Step 4: 검증**

- 1440px 스크린샷: 좌 필드(≈640px)+우 패널 나란히, 지침 카드가 첫 화면에 보임
- 1440px 패턴 모드 스크린샷(setAppMode 주입 사본): 패턴 컨트롤이 우측 패널에
- 390px 스크린샷: 세로 스택 유지
- 하니스: 데스크톱 폭에서 `getFieldScale() > 1` && 드래그 좌표 보정 재확인

구문 검증 + 스크린샷. Commit:

```bash
git commit -am "feat: two-pane desktop layout with sticky field"
```

---

### Task 4: 전술 보드 테마

**Files:**
- Modify: `index.html` — CSS 전면(변수화), 버튼/탭/배지 라벨(이모지 제거), h1 워드마크, favicon, 커스텀 다이얼로그 JS

**Interfaces:**
- Produces: `uiConfirm(msg): Promise<boolean>`, `uiAlert(msg): void`(토스트 위임) — Task 5가 사용.

- [ ] **Step 1: CSS 변수 도입 및 팔레트 교체**

```css
:root {
  --bg:#141a16; --surface:#1c241e; --surface2:#232d26; --border:#2c3830;
  --ink:#e8ede8; --muted:#8fa096; --faint:#5c6b61;
  --accent:#b8e986; --accent-ink:#1a2412;
  --warn:#f0b429; --danger:#e05d5d;
  --pitch:#2b5e3f;
}
```

기존 색상 일괄 치환: `#0f172a`→`var(--bg)`, `#1e293b`→`var(--surface)`, `#334155`→`var(--border)`, `#64748b`/`#94a3b8`→`var(--muted)`, `#3b82f6`(active/포인트)→`var(--accent)`+`color:var(--accent-ink)`, `#60a5fa`(focus)→`var(--accent)`, 필드 `#276d41`→`var(--pitch)`(canvasField·html2canvas backgroundColor 포함 — JS 쪽은 상수 `PITCH_COLOR = '#2b5e3f'`로 통일). 버튼 계열: btn-green/blue/orange/amber/purple → `btn-primary`(accent)/`btn-ghost`(투명+보더)/`btn-danger` 3계열로 축소, 호출부 클래스 치환.

스쿼드 구분색 재조정: basic `#4a90d9`→차분한 스틸 블루 유지 톤다운, attack `#d97843`, defense `#5a8dd6` 수준으로 채도 낮춤 (배지·탭 active에만 사용).

- [ ] **Step 2: 워드마크·타이포**

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&display=swap" rel="stylesheet">
<h1 class="wordmark">SQUAD MAKER<span class="wm-sub">전술 보드</span></h1>
```

```css
.wordmark { font-family:'Oswald', 'Segoe UI', sans-serif; font-size:1.35rem; font-weight:600;
  letter-spacing:0.12em; color:var(--ink); display:flex; align-items:baseline; gap:10px; }
.wordmark .wm-sub { font-family:'Segoe UI', sans-serif; font-size:0.72rem; font-weight:600;
  letter-spacing:0.2em; color:var(--muted); }
```

favicon SVG의 `%23276d41` → `%23141a16`, 공 이모지 → 라임 사각 안 초크 라인 스타일 유지 가능(이모지 유지 허용 — 파비콘 한정).

- [ ] **Step 3: 이모지 제거**

버튼·탭·배지·카드 제목의 이모지 제거 대상: 앱 탭(⚽🎯📋), 스쿼드 탭·배지(🔵⚔️🛡), 버튼(+ 선수 추가 유지, 📸/📤/👤/💾/📂/🎞/📋/↺/🗑 등 접두 이모지 제거), notes 카드 제목, 힌트. `SQUAD_META.icon`은 **공유 텍스트·PNG 배너·GIF 라벨에서는 유지**(카톡 텍스트 가독성엔 이모지가 유리) — UI 라벨 생성부(`refreshUI`의 badge/teamNoteLabel)만 아이콘 없이 조합하도록 분리: `SQUAD_META[type].uiLabel = '기본' | '공격' | '수비'`.

삭제(🗑) 등 아이콘이 실질 도움인 곳은 인라인 SVG 3종만: play(▶ 대체), trash, share. 그 외 텍스트 라벨.

- [ ] **Step 4: 커스텀 다이얼로그**

```js
function uiConfirm(msg) {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'dlg-backdrop';
    wrap.innerHTML = `<div class="dlg" role="alertdialog" aria-modal="true">
      <p>${escHtml(msg)}</p>
      <div class="dlg-actions">
        <button class="btn btn-ghost" data-r="0">취소</button>
        <button class="btn btn-primary" data-r="1">확인</button>
      </div></div>`;
    wrap.addEventListener('click', e => {
      const r = e.target.dataset?.r;
      if (r !== undefined) { wrap.remove(); resolve(r === '1'); }
      else if (e.target === wrap) { wrap.remove(); resolve(false); }
    });
    document.body.appendChild(wrap);
    wrap.querySelector('[data-r="1"]').focus();
  });
}
```

호출부 교체(전부 async 전환 없이 `.then` 사용 가능):
- `onModeChange` confirm → `uiConfirm(...).then(ok => { if (!ok) return; ... })`
- `onFormationChange` 이름 재할당 confirm → 동일 패턴
- `ctxRemove`/`deletePattern` 등의 alert → `showToast`
- `ctxRename`의 prompt → 해당 선수 요소 찾아 `startInlineEdit` 호출: `const el = document.querySelector('.player[data-id="'+selectedPlayer.id+'"]'); if (el) startInlineEdit(el, selectedPlayer);`
- copyShareText/copyShareUrl/copyManual의 alert → `showToast`

```css
.dlg-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:2500;
  display:flex; align-items:center; justify-content:center; padding:20px; }
.dlg { background:var(--surface); border:1px solid var(--border); border-radius:12px;
  padding:20px; max-width:340px; display:flex; flex-direction:column; gap:16px; }
.dlg p { font-size:0.9rem; line-height:1.6; white-space:pre-wrap; }
.dlg-actions { display:flex; gap:8px; justify-content:flex-end; }
```

- [ ] **Step 5: 검증**

- 스크린샷 3폭(390/768/1440) × 스쿼드/패턴/전략/뷰어 — slate·파랑·이모지 잔재 grep(`#0f172a|#1e293b|#3b82f6|#334155` 검색 0건, 라벨 이모지 시각 확인)
- confirm 교체 확인: 인원 변경 시 커스텀 다이얼로그 스크린샷(하니스 eval로 오픈)

구문 검증 + 스크린샷. Commit:

```bash
git commit -am "feat: tactics-board theme, custom dialogs, emoji-free UI"
```

---

### Task 5: 터치 패리티·잔여 UX

**Files:**
- Modify: `index.html` — 필드 터치 핸들러(롱프레스), 패턴 캔버스 탭 삭제, `onFormationChange` 경고, 힌트 분기, 탭 타깃 CSS

**Interfaces:**
- Consumes: `uiConfirm`, `showToast`, `showCtxMenu`

- [ ] **Step 1: 롱프레스 컨텍스트 메뉴 (iOS 대응)**

필드 touchstart에서 500ms 타이머; 8px 이상 이동 시 취소(드래그로 간주), 발화 시 드래그 중단·메뉴 표시:

```js
let lpTimer = null;
fieldEl.addEventListener('touchstart', e => {
  if (viewerMode) return;
  const pe = e.target.closest('.player');
  if (!pe) return;
  const id = Number(pe.dataset.id);
  const p = getPlayers().find(p => p.id === id);
  if (!p) return;
  const t = e.touches[0];
  dragState = { id, el: pe, sx: t.clientX, sy: t.clientY, px: p.x, py: p.y, sc: getFieldScale() };
  pe.classList.add('dragging');
  clearTimeout(lpTimer);
  lpTimer = setTimeout(() => {
    if (!dragState) return;
    dragState.el.classList.remove('dragging');
    const r = roster.find(r => r.id === dragState.id);
    dragState = null;
    if (r) showCtxMenu(t.clientX, t.clientY, r);
  }, 500);
  e.preventDefault();
}, { passive: false });
```

touchmove에서 `if (Math.hypot(dx,dy) > 8) clearTimeout(lpTimer);`, touchend에서 `clearTimeout(lpTimer);`. (기존 touchstart 핸들러를 이 구현으로 대체.)

- [ ] **Step 2: 패턴 화살표 탭 삭제 팝오버**

`pCanvas` click 핸들러 추가(드래그 종료 직후 클릭 오발동 방지 — `endDraw`에서 `justDrew = true` 세팅 후 다음 틱 해제):

```js
pCanvas.addEventListener('click', e => {
  if (viewerMode || justDrew || drawState) return;
  const { x, y } = canvasCoords(e);
  const hit = hitArrow(x, y);
  if (!hit) return;
  showArrowPopover(e.clientX, e.clientY, hit);
});
```

`showArrowPopover`: ctxMenu 재활용한 소형 팝오버(삭제 버튼 1개). 삭제 시 기존 contextmenu 로직과 동일 처리 + `showToast('경로 삭제됨')`.

- [ ] **Step 3: 포메이션 변경 배치 초기화 경고**

`onFormationChange`를: 커스텀 배치가 기본 배치와 다르면 `uiConfirm('포메이션을 변경하면 현재 배치가 초기화됩니다. 계속할까요?')` 후 진행. 이름 재할당 confirm과 중복 노출되지 않게 하나의 다이얼로그로 통합(배치 경고 확인 시 이름도 기본이면 자동 재할당, 별도 질문 제거).

- [ ] **Step 4: 힌트 분기·탭 타깃**

```js
const isCoarse = matchMedia('(pointer: coarse)').matches;
// setAppMode 힌트 문자열: coarse → '드래그: 이동 | 길게 누르기: 메뉴 | 화살표 탭: 삭제' 계열로 교체
```

CSS: `.formation-select`, `.pattern-nav button` `min-height:44px`(모바일 미디어쿼리), `.pattern-nav button` padding 확대.

- [ ] **Step 5: 검증**

- 하니스: touchstart 후 510ms 대기 → ctxMenu.visible 단언 / touchstart+8px 초과 move → 메뉴 미표시·드래그 정상 단언
- 390px 패턴 모드 스크린샷(터치 힌트 확인)

구문 검증 + 스크린샷. Commit:

```bash
git commit -am "feat: touch parity - long-press menu, tap arrow delete, formation guard"
```

---

### Task 6: README 갱신·최종 검증

- [ ] README 개발 현황 섹션 갱신(뷰어 모드·2패널·테마·터치, 남은 과제에서 공유 URL 덮어쓰기 항목 제거)
- [ ] 전 폭(390/768/1440) × 전 모드(스쿼드/패턴/전략/뷰어) 스크린샷 일괄 재확인
- [ ] `git commit -am "docs: update README for responsive UX overhaul"`
