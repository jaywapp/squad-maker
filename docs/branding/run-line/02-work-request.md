# 02. 적용 작업요청서 — 브랜딩 A 런 라인

| 항목 | 내용 |
|---|---|
| 요청 | 앱 아이콘·좌상단 로고·시작 스플래시를 시안 A "런 라인"으로 교체 |
| 요청일 | 2026-10-08 |
| 선택 근거 | 사용자 선택 (A·B·C 비교: `docs/ux-concepts/brand-20261008/`) |
| 사양 | [01-design-spec.md](01-design-spec.md) — 숫자·색·모션은 그 문서가 기준 |
| 기준 브랜치 | `feat/a-preview-release-20261007` (`7f1f1a9`). 이후 이 브랜치가 main에 머지됐으면 main 최신에서 시작 |
| 작업 브랜치(제안) | `feat/brand-run-line` |
| 예상 규모 | 웹 3곳(index.html) + Android 리소스 교체 + MainActivity 1줄 + 설정 1줄. 반나절 + 실기기 확인 |

## 0. 시작 전에 꼭 읽기

1. 저장소 규칙 `AGENTS.md`(Claude는 `CLAUDE.md`도). 이 저장소는 코드 변경 전에 `docs/<slug>-analysis.md`, `-design.md`, `-tasks.md` 3종을 만든다. 이 패키지가 그 입력이다. slug 예: `brand-run-line-20261008`.
   - analysis에는 "사용자 선택: A 런 라인(2026-10-08)"과 이 문서 링크를, design에는 §2의 결정을, tasks에는 §4의 작업 표를 옮긴다.
2. `index.html`과 `android/`는 Codex가 A 통합·릴리스 작업을 한 영역이다. 시작 전에 열린 PR·작업 브랜치에서 같은 파일을 고치는 중인지 확인하고, 겹치면 순서를 정한 뒤 시작한다. 같은 파일을 두 세션이 동시에 고치지 않는다.
3. 커밋·push·PR은 사용자가 요청할 때만 한다. 레포 관례는 스쿼시 머지.

## 1. 범위

**한다**

| # | 대상 | 결과 |
|---|---|---|
| W1 | 좌상단 헤더 | `h1.wordmark` 안을 런 라인 로고 SVG로 교체 |
| W2 | 파비콘 | 공(⚽) 이모지 파비콘 2줄을 런 라인 파비콘으로 교체 |
| W3 | 앱 안 모션 인트로 | 네이티브 앱 시작 시 1.4초 런 라인 모션, 앱 준비 완료 후 사라짐 |
| A1 | Android 런처 아이콘 | adaptive icon(배경·전경·단색) + 레거시 PNG 교체 |
| A2 | Android 시스템 스플래시 | 기존 `splash.png` 배경 → night 단색 + 투명 아이콘 |
| A3 | 흰 깜빡임 방지 | WebView·창 배경을 night로 |
| S1 | Play 스토어 아이콘 | 512×512 PNG 산출 (업로드는 하지 않음) |

**하지 않는다**

- 앱 이름(`스쿼드 메이커 Preview`), 패키지 ID, 버전 변경. 버전 올림은 릴리스 작업에서 한다.
- 알림 아이콘, 위젯, iOS, OG 공유 이미지(`og-image.png`) 교체. 필요하면 별도 요청.
- 헤더 외 UI 색·레이아웃 변경.
- 스토어 등록·업로드, 서명 APK 배포.

## 2. 결정 사항 (바꾸려면 사용자 확인)

| 결정 | 이유 |
|---|---|
| 스플래시는 2단계(시스템 단색 → 웹 모션) | Android 12+ 시스템 스플래시는 GIF·임의 모션 불가 |
| 시스템 스플래시 아이콘은 투명 | 마크가 두 번 나타나지 않게. 대안은 §6 R3 |
| 웹 인트로는 네이티브에서만 | 공유 링크 열람자(웹)에게 대기를 강요하지 않음 |
| 인트로는 최소 1.4초, `SquadMakerContract.ready()`까지, 최대 6초 | 모션이 잘리지 않고, 저장소 준비가 늦어도 갇히지 않게 |
| 워드마크는 아웃라인 경로 | Android 번들은 Google Fonts를 지움(`scripts/build-android-web.mjs`) |
| 헤더 보조 문구 "전술 보드" 삭제 | 로고 옆 설명 문구 금지(01 §7) |
| 아이콘은 런처에서도 표준 점선형 | 01 §5 |

## 3. 준비물 (이 폴더에 다 있음)

| 용도 | 파일 |
|---|---|
| 헤더 로고 스니펫 | `assets/web/header-logo.snippet.html` |
| 파비콘 스니펫 | `assets/web/favicon.snippet.html` |
| 인트로 스니펫 | `assets/web/brand-intro.snippet.html` |
| Android 리소스 | `assets/android/res/**` (앱 `android/app/src/main/res/`와 같은 구조) |
| 스토어 아이콘 원본 | `assets/svg/icon-store-512.svg`, 확인용 `assets/preview/icon-store-512.png` |
| 결과 비교용 | `assets/preview/*.png`, `*.gif` |

스니펫 3개는 2026-10-08 Chromium(Playwright)에서 확인했다: 인트로 500/800/1400ms 시점 모양 정상, 준비 완료 후 1.9초 안에 DOM 제거, 헤더 로고 높이 28px·폭 약 108px, 콘솔 오류 0.
Android XML은 `aapt2 compile`(build-tools 36.0.0) 통과. **실기기·에뮬레이터 확인은 아직 안 했다.**

## 4. 작업 순서

작업 표 (tasks 문서에 옮길 때 orchestrator에 맞게 owner/model을 채운다):

| ID | 작업 | depends_on | parallel_group | files |
|---|---|---|---|---|
| T1 | 웹: 헤더 로고·파비콘 (W1, W2) | - | P1 | `index.html` |
| T2 | 웹: 모션 인트로 (W3) | T1 (같은 파일) | - | `index.html` |
| T3 | Android: 아이콘 리소스 (A1) | - | P1 | `android/app/src/main/res/**` |
| T4 | Android: 스플래시·깜빡임 (A2, A3) | T3 (같은 폴더) | - | `res/values/styles.xml`, `MainActivity.java`, `capacitor.config.json` |
| T5 | 스토어 512 PNG (S1) | - | P1 | `.work/` 또는 릴리스 산출물 위치 |
| T6 | 자동 검증 | T1~T4 | - | - |
| T7 | 실기기 검증 | T6 | - | - |

T1·T2는 같은 `index.html`이라 순차로 한다. T3·T4도 같은 리소스 폴더라 순차. 웹(T1)과 Android(T3)는 서로 다른 파일이라 병렬 가능.

### T1. 헤더 로고와 파비콘 — `index.html`

1. **파비콘**: `<head>`의 아래 두 줄(현재 21~22행 근처, `⚽`가 들어 있음)을 지우고 `assets/web/favicon.snippet.html`의 `<link rel="icon" ...>` 한 줄로 바꾼다.
   ```html
   <link rel="icon" href="data:image/svg+xml,<svg ...><text ...>⚽</text></svg>">
   <link rel="apple-touch-icon" href="data:image/svg+xml,<svg ...><text ...>⚽</text></svg>">
   ```
   `apple-touch-icon`은 SVG를 받지 않으므로 지금은 다시 넣지 않는다(iOS는 범위 밖).
2. **헤더 로고**: `<body>` 바로 아래 줄을 찾는다.
   ```html
   <h1 class="wordmark">SQUAD MAKER<span class="wm-sub">전술 보드</span></h1>
   ```
   이 줄을 `header-logo.snippet.html`의 `<h1 class="wordmark">…</h1>` 블록으로 바꾼다. **`h1` 요소와 `wordmark` 클래스는 반드시 남긴다**(`tests/e2e/guest-free-regression.spec.js:40`이 `h1.wordmark` 노출을 확인).
3. **CSS**: 스니펫의 `<style>` 안 3줄을 `index.html` `<style>`의 헤더 구역(현재 769행 `/* ── 헤더 ── */` 아래 `.wordmark { grid-column: 1; ... }` 바로 뒤)에 옮긴다. 스니펫의 `<style>` 태그 자체는 붙이지 않는다.
   - 기존 `.wordmark`(57행)의 Oswald 글꼴 규칙은 이제 쓰이지 않지만, 769행의 `grid-column`·`justify-self`는 배치에 필요하니 남긴다.
   - 더 이상 쓰지 않는 `.wm-sub` 규칙 3곳(62행, 770행, 1090행 근처 `@media (max-width: 420px)` 안)을 지운다.
4. 확인: 브라우저(`npm run serve` → `http://localhost:4317`)에서 좌상단에 마크+`SQUAD MAKER`가 높이 28px(창 폭 1024px 이상이면 32px)로 보이고, 오른쪽 상단 바와 세로 가운데가 맞는지. 360px 폭에서 가로 넘침이 없는지.

### T2. 모션 인트로 — `index.html`

1. `assets/web/brand-intro.snippet.html` 전체(주석 포함, `<div id="brandIntro">` + `<style>` + `<script data-brand-intro>`)를 `<body class="mode-squad">` **바로 다음 줄**, T1에서 바꾼 `h1.wordmark`보다 위에 붙인다.
2. **`<script data-brand-intro>`의 `data-brand-intro` 속성을 지우지 않는다.** `scripts/build-android-web.mjs`는 `index.html`에서 처음 나오는 `<script>` 문자열 앞에 `platform-native.js`를 끼워 넣는다. 속성이 없으면 인트로 스크립트가 그 자리가 되어, `platform-native.js`가 본문 요소가 생기기 전에 실행된다.
3. 인트로 스크립트는 `window.Capacitor.isNativePlatform()`으로 네이티브 여부를 판단한다(Capacitor 브리지는 페이지 스크립트보다 먼저 주입됨). 웹에서는 즉시 `#brandIntro`를 제거한다.
4. 닫힘 조건은 스니펫 안에 구현돼 있다: 모션 끝(1400ms, 동작 줄이기면 400ms) **그리고** `SquadMakerContract.ready()` 이행 → 220ms 페이드 후 제거. 6000ms가 지나면 무조건 닫는다. 탭하면 모션만 끝 상태로 건너뛴다.
5. 일반 브라우저에서는 인트로가 뜨지 않는다. 모양은 `assets/source/splash-intro-reference.html`(모션 단독 페이지)로, 동작은 아래 E2E 테스트로 확인한다.
6. **E2E 테스트 추가** (권장, `tests/e2e/brand-intro.spec.js`):
   - 웹(기본): 로드 후 `#brandIntro`가 DOM에 없다.
   - 네이티브 흉내: `page.addInitScript(() => { window.Capacitor = { isNativePlatform: () => true }; })` 후 로드 → `#brandIntro`가 보이고, 3초 안에 사라지며, 그 뒤 `h1.wordmark`가 보인다.
   - 동작 줄이기: `page.emulateMedia({ reducedMotion: 'reduce' })` + 네이티브 흉내 → 1초 안에 사라진다.
   - 기존 네이티브 흉내 테스트(`tests/e2e/local-library.spec.js`, `native-short-viewport.spec.js`)는 `window.SquadPlatform`만 바꾸고 `window.Capacitor`는 넣지 않으므로 인트로가 뜨지 않아 영향이 없어야 한다. 실패하면 인트로가 원인인지 먼저 확인한다.

### T3. Android 아이콘 — `android/app/src/main/res/`

1. **복사(덮어쓰기)** — 이 폴더 `assets/android/res/`에서 같은 경로로:

   | 원본 (이 패키지) | 대상 (앱) | 비고 |
   |---|---|---|
   | `mipmap-anydpi-v26/ic_launcher.xml` | 같은 경로 | 덮어씀. foreground가 `@drawable/…`로 바뀌고 monochrome 추가 |
   | `mipmap-anydpi-v26/ic_launcher_round.xml` | 같은 경로 | 덮어씀 |
   | `drawable/ic_launcher_foreground.xml` | 같은 경로 | 새 파일 |
   | `drawable/ic_launcher_monochrome.xml` | 같은 경로 | 새 파일 |
   | `values/ic_launcher_background.xml` | 같은 경로 | 덮어씀. `#FFFFFF` → `#2B5E3F` |
   | `values/colors_brand.xml` | 같은 경로 | 새 파일 |
   | `mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png`, `ic_launcher_round.png` | 같은 경로 | 덮어씀 (48/72/96/144/192px) |

2. **삭제** — Capacitor 기본 아이콘 잔재:

   | 파일 | 왜 지우나 |
   |---|---|
   | `drawable-v24/ic_launcher_foreground.xml` | **꼭 지운다.** 남아 있으면 API 24 이상에서 새 `drawable/ic_launcher_foreground.xml`보다 우선 선택되어 Capacitor 기본 그림이 나온다 |
   | `mipmap-*/ic_launcher_foreground.png` (5개) | 새 adaptive xml이 더는 참조하지 않음 |
   | `drawable/ic_launcher_background.xml` | 기본 격자 배경. 새 xml은 `@color/ic_launcher_background`를 씀 |

   지우기 전에 `git grep -n "ic_launcher_foreground\|drawable/ic_launcher_background" android/`로 다른 참조가 없는지 확인한다.
3. 확인: `android/` 에서 `.\gradlew.bat :app:assembleDebug --console=plain` 성공. Android Studio의 Resource Manager나 `aapt2 dump`로 `mipmap/ic_launcher`가 새 그림인지 본다.

### T4. 시스템 스플래시와 흰 깜빡임 — Android 설정

1. **`res/values/styles.xml`** 을 이 패키지의 `assets/android/res/values/styles.xml`로 덮어쓴다. 바뀌는 점:
   - `AppTheme.NoActionBarLaunch`: `android:background @drawable/splash` 삭제 → `windowSplashScreenBackground @color/splash_background`, `windowSplashScreenAnimatedIcon @android:color/transparent`, `postSplashScreenTheme @style/AppTheme.NoActionBar`.
   - `AppTheme.NoActionBar`: `android:windowBackground @color/brand_night` 추가(WebView가 첫 화면을 그리기 전 흰 창 방지).
   - 다른 스타일은 그대로다. 덮어쓰기 전 `git diff --no-index`로 현재 파일과 비교해 이 두 곳 외 차이가 없는지 확인한다(그사이 누가 고쳤으면 병합).
2. **`splash.png` 삭제**: `res/drawable/splash.png`와 `drawable-port-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/splash.png`, `drawable-land-{…}/splash.png` 11개. 지우기 전 `git grep -n "drawable/splash\|@drawable/splash" android/`로 참조가 styles.xml뿐이었는지 확인한다. 빈 `drawable-port-*`, `drawable-land-*` 폴더는 같이 지운다.
3. **`MainActivity.java`** (`android/app/src/main/java/com/jaywapp/squadmaker/preview/MainActivity.java`): API 24~30에서도 같은 단색 스플래시를 쓰도록 `super.onCreate` 전에 설치한다.
   ```java
   import androidx.core.splashscreen.SplashScreen;
   // ...
   @Override
   public void onCreate(Bundle savedInstanceState) {
       SplashScreen.installSplashScreen(this);
       registerPlugin(SquadStoragePlugin.class);
       registerPlugin(SquadDocumentsPlugin.class);
       registerPlugin(SquadAdsPlugin.class);
       super.onCreate(savedInstanceState);
   }
   ```
   의존성 `androidx.core:core-splashscreen:1.2.0`은 이미 `android/app/build.gradle`에 있다. Capacitor `BridgeActivity.onCreate`가 테마를 `AppTheme.NoActionBar`로 직접 바꾸므로 `postSplashScreenTheme`과 결과가 같다(충돌 없음).
4. **`capacitor.config.json`**: 최상위에 `"backgroundColor": "#141a16"`를 추가한다(WebView 배경색). 다른 키는 건드리지 않는다.
   ```json
   {
     "appId": "com.jaywapp.squadmaker.preview",
     "appName": "스쿼드 메이커 Preview",
     "webDir": ".work/android-web",
     "backgroundColor": "#141a16",
     ...
   }
   ```
5. `npm run android:sync` 후 빌드.

### T5. Play 스토어 아이콘

- `assets/preview/icon-store-512.png`가 `icon-store-512.svg`를 512×512로 렌더한 결과다(32bit PNG, 풀블리드). 스토어 등록 시 이 파일을 쓴다. 지금은 레포 어디에도 넣지 않고 릴리스 작업 때 산출물로 첨부한다.
- 다시 만들려면 아무 SVG 렌더러로 `icon-store-512.svg`를 512×512 PNG로 내보낸다(투명 없음, 모서리 깎지 않음 — 스토어가 마스크를 씌움).

### T6. 자동 검증

메모리가 빠듯한 PC에서는 백그라운드 E2E가 강제 종료될 수 있다. **포그라운드로, 순서대로, `--workers=1`** 로 돌린다.

```powershell
npm run test:unit
npm run android:bundle
npx playwright test --project=desktop-1280 --workers=1
npx playwright test --project=mobile-390 --workers=1
```

추가로:

- `.work/android-web/index.html`을 열어 `<script src="app/platform-native.js">`가 `<script data-brand-intro>` **뒤**, 원래 앱 `<script>` 바로 앞에 들어갔는지 확인.
- `cd android; .\gradlew.bat :app:assembleRelease :app:lintRelease --console=plain --no-daemon` — CI(`.github/workflows/android-preview-verify.yml`)와 같은 명령. lint 오류 0, 새 경고가 있으면 기록.

### T7. 실기기 검증 (사람이 해야 함)

에뮬레이터만으로 끝내지 말고 가능하면 실제 기기 한 대 이상. 확인 결과(기기·Android 버전·런처)를 tasks 문서에 남긴다.

| # | 확인 | 기대 |
|---|---|---|
| 1 | 홈 화면 아이콘 | 피치 녹색 바탕, 라임 점 + 점선 + 화살촉. 원형·둥근 사각 마스크에서 잘림 없음 |
| 2 | 테마 아이콘 (Android 13+, 배경화면 > 테마 아이콘 켜기) | 단색으로 같은 모양 |
| 3 | 설정 > 앱 > 스쿼드 메이커 Preview | 같은 아이콘 |
| 4 | 앱 첫 실행 (프로세스 종료 후) | 어두운 단색 → 런 라인 모션 → 앱 화면. **흰 화면이 한 번도 비치지 않음** |
| 5 | 모션 중 탭 | 즉시 완성된 로고로 바뀌고, 준비되면 사라짐 |
| 6 | 개발자 옵션 > 애니메이션 끄기 (또는 접근성 > 애니메이션 제거) | 모션 없이 정지 로고가 짧게 보이고 사라짐 |
| 7 | 백그라운드에서 다시 돌아오기 (따뜻한 시작) | 인트로가 다시 나오지 않음 (WebView가 살아 있으면 페이지를 다시 읽지 않음) |
| 8 | 좌상단 헤더 | 로고 선명, 시스템 글꼴로 바뀌지 않음, 상단 버튼과 겹치지 않음 |
| 9 | 시스템 스플래시 길이 | 단색 화면이 1초 넘게 머물면 §6 R3 검토 |
| 10 | Android 7~11 기기(있으면) | 레거시/compat 스플래시도 단색, 아이콘 정상 |

## 5. 완료 기준

- [ ] 웹: 파비콘이 런 라인, 헤더가 로고 SVG, `h1.wordmark` 유지, 웹에서는 인트로 없음.
- [ ] 네이티브: 인트로가 1.4초 이상 재생되고 준비 완료 후 사라짐, 탭 건너뛰기·동작 줄이기 동작.
- [ ] Android 아이콘(적응형·단색·레거시) 교체, Capacitor 기본 아이콘·`splash.png` 잔재 제거.
- [ ] 시스템 스플래시 → 인트로 → 앱 사이 흰 깜빡임 없음.
- [ ] `npm run test:unit`, 데스크톱·모바일 E2E, `assembleRelease`·`lintRelease` 통과(기존 skip 외 새 실패 0).
- [ ] 실기기 확인표(T7) 결과 기록.
- [ ] `docs/<slug>-analysis/design/tasks.md`와 `docs/README.md` 인덱스 갱신, 이 패키지 `README.md` 상태를 "적용 완료(PR #…)"로 변경.

## 6. 위험과 대응

| ID | 위험 | 대응 |
|---|---|---|
| R1 | `drawable-v24/ic_launcher_foreground.xml`을 안 지워 기본 아이콘이 계속 나옴 | T3-2에서 반드시 삭제. 빌드 후 아이콘 확인 |
| R2 | 인트로 `<script>`에서 `data-brand-intro`가 빠져 번들러 치환 위치가 바뀜 | T2-2. 번들 결과 `index.html` 확인(T6) |
| R3 | 시스템 스플래시(단색)가 길게 보여 "멈춘 것처럼" 느껴짐 | 대안: `windowSplashScreenAnimatedIcon`에 정지 마크(전경 벡터 `@drawable/ic_launcher_foreground`, `windowSplashScreenIconBackgroundColor`는 지정하지 않음)를 넣고, 인트로 CSS에서 `bi-dot`·`bi-reveal`·`bi-head` 애니메이션을 빼서 마크를 처음부터 완성 상태로 둔 뒤 마크 이동·워드마크 펼침(900ms 이후)만 재생. 사용자 확인 후 적용 |
| R4 | 작은 런처(48dp)에서 점선이 "길 안내/경로" 아이콘과 비슷해 보임 | 실기기 확인. 문제면 아이콘만 소형 실선형으로 바꾸는 안을 사용자에게 제안(에셋은 `run-line-symbol-small.svg` 기하로 재생성) |
| R5 | 헤더 SVG가 html2canvas 이미지 내보내기에 들어가 모양이 깨짐 | 내보내기 영역에 헤더가 포함되는지 확인. 포함되면 내보내기 결과 이미지로 확인 |
| R6 | 인트로가 `SquadMakerContract.ready()`를 영원히 기다림 | 6초 강제 닫힘이 구현돼 있음. 그 뒤는 기존 `body.ui-booting` 표시가 이어받음 |
| R7 | `index.html`·Android를 다른 세션이 동시에 수정 | §0-2. 시작 전 열린 PR 확인, 파일 소유권 정리 |

## 7. 에셋 재생성

손으로 SVG를 고치지 말고 도구로 다시 만든다. 도구는 레포 의존성에 넣지 않았다(일회성).

```powershell
# 임시 폴더에서
npm init -y; npm install opentype.js@1.3.4
# Oswald SemiBold(600) woff 파일을 Oswald-600.woff 이름으로 같은 폴더에 둔다 (Google Fonts, OFL)
Copy-Item <repo>\docs\branding\run-line\tools\*.cjs .
node build-geometry.cjs                                   # geometry.json 생성 (점선 분해·워드마크 아웃라인)
node write-assets.cjs <repo>\work\tasks\branding          # assets/svg, assets/android/res 의 XML
node write-web.cjs   <repo>\work\tasks\branding           # assets/web 스니펫 3개
```

- 기하(곡선·점선 비율·워드마크 글자)를 바꾸면 `build-geometry.cjs` 맨 위 상수를 고친다. 색·아이콘 배율은 `write-assets.cjs`, 인트로 시간·크기는 `write-web.cjs`.
- 레거시 mipmap PNG와 `preview/` 이미지는 이 스크립트가 만들지 않는다. SVG를 바꿨다면 `icon-foreground.svg`를 배경 `#2B5E3F` 위에 48/72/96/144/192px로 렌더해 둥근 사각(모서리 18%)·원형으로 잘라 다시 만든다.
- `tools/geometry.json`은 현재 에셋을 만든 값이다. 바꾸지 않았다면 `build-geometry.cjs`를 다시 돌릴 필요 없다.
