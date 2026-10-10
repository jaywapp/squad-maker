# 02. 적용 작업요청서: 아이엠 헤드코치 (A안)

| 항목 | 내용 |
|---|---|
| 요청 | Run Line 브랜딩의 이름을 한글 '아이엠 헤드코치'로 바꾼다. 워드마크·인트로 글자·앱 이름 문구만 바꾸고 마크·아이콘·색·기능·화면 구조는 그대로 둔다 |
| 선택 | 2026-10-10 사용자 선택 A안 · 최소 변경 |
| 사양 | [01-design-spec.md](01-design-spec.md) |
| 선행 조건 | ① **국내 상표 확인 완료(사용자 확인)**, ② Run Line PR #47이 `main`에 병합됨 |
| 작업 브랜치(제안) | `feat/brand-headcoach` (최신 `main`에서) |
| 예상 규모 | `index.html` 블록 2개 + 문구 8곳, 설정 2파일, 테스트 기대값. 반나절 + 실기기 확인 |

## 0. 시작 전에 꼭 확인

1. 저장소 규칙 `AGENTS.md`(Claude는 `CLAUDE.md`도). 코드 변경 전에 `docs/<slug>-analysis.md`, `-design.md`, `-tasks.md`를 만든다. slug 예: `brand-headcoach-apply-YYYYMMDD`.
   - analysis에 "사용자 선택 A안(2026-10-10)", 상표 확인 결과와 날짜, 이 패키지 경로를 적는다. 상표 확인 기록이 없으면 **시작하지 않고 사용자에게 묻는다.**
   - 이 결정의 이력은 `docs/brand-headcoach-20261010-analysis.md`, `-design.md`, `-tasks.md`에 있다.
2. **PR #47 상태 확인.** 2026-10-10 기준 PR #47(`feat/brand-run-line`, head `e67e61d`)은 Draft이고 `main`과 충돌(CONFLICTING)한다. 병합 전이면 이 작업을 시작하지 않는다. PR #47의 충돌 해결·병합은 별도 작업이며 사용자 요청이 있어야 한다.
3. `index.html`, `android/`, `capacitor.config.json`을 다른 열린 PR·세션이 고치고 있는지 확인한다. 겹치면 순서를 정한 뒤 시작한다.
4. 커밋·push·PR은 사용자가 요청할 때만 한다. `main` push는 APK 릴리스·Vercel 배포를 실행한다.

## 1. 범위

**한다**

| # | 대상 | 결과 |
|---|---|---|
| W1 | 좌상단 헤더 | `h1.wordmark` 안 SVG를 한글 워드마크 헤더 로고로 교체 |
| W2 | 네이티브 인트로 | BRAND INTRO 블록을 한글 워드마크 버전으로 교체 |
| W3 | 문서 제목·공유 제목 | 이름 부분만 교체 |
| W4 | 앱 안 이름 문구 | 접근성 이름, 도움말 제목, 제보·진단 문구의 이름 부분 교체 |
| A1 | Android 앱 이름 | `capacitor.config.json` `appName`, `strings.xml`의 이름 부분 교체 |
| T | 테스트 | 이름을 확인하는 기대값 교체 |

**하지 않는다**

- 마크, 앱 아이콘(adaptive·monochrome·레거시 PNG), 파비콘, 시스템 스플래시, 색 변경.
- 패키지 ID(`com.jaywapp.squadmaker.preview`), `custom_url_scheme`, 버전, 저장 키(`squad-maker-v1`, `squad-maker-library-v1`), 이벤트 이름(`squad-maker:*`), `.sq` 형식, 도메인, 저장소 이름(`jaywapp/squad-maker`), 제보 API의 `User-Agent`.
- `og-image.png` 교체(별도 요청), 스토어 등록, 상표 조사.
- 헤더 외 UI 변경.

## 2. 기존 파일 교체표

줄 번호는 PR #47 head(`e67e61d`) 기준이다. 병합 뒤 `main`에서는 달라지므로 표의 "찾는 표식"으로 찾는다.

| # | 파일 | 찾는 표식 (PR #47 줄) | 처리 | 새 내용 |
|---|---|---|---|---|
| 1 | `index.html` | `<!-- ═══ BRAND INTRO (Run Line)` ~ `<!-- ═══ /BRAND INTRO ═══ -->` (1150~1243) | 블록 전체 교체(주석 포함) | `assets/web/brand-intro.snippet.html` 전체 |
| 2 | `index.html` | `<h1 class="wordmark">` ~ 닫는 `</h1>` (1246~1255) | 블록 교체 | `assets/web/header-logo.snippet.html`의 `h1` 블록(주석 제외) |
| 3 | `index.html` | `.wordmark-logo` CSS 2줄 (767~768) | 유지 | 바꿀 것 없음 |
| 4 | `index.html` | `<title>` (6) | 이름 교체 | `assets/web/meta.snippet.html`. 설명 부분은 병합 후 `main`의 현재 문구를 유지하고 이름만 바꾼다 |
| 5 | `index.html` | `og:title` (10), `twitter:title` (17) | 이름 교체 | 위와 같음 |
| 6 | `index.html` | `<main aria-label="스쿼드 메이커">` (1298) | 이름 교체 | `아이엠 헤드코치` |
| 7 | `index.html` | `스쿼드 메이커 사용 안내` (1642) | 이름 교체 | `아이엠 헤드코치 사용 안내` |
| 8 | `index.html` | `[스쿼드 메이커] 코치 인터뷰` 메일 제목 (4019) | 이름 교체 | `[아이엠 헤드코치] 코치 인터뷰` |
| 9 | `index.html` | `[스쿼드 메이커 진단 정보]` (4060) | 이름 교체 | `[아이엠 헤드코치 진단 정보]` |
| 10 | `index.html` | 파비콘 `<link rel="icon">` (21) | 유지 | Run Line 그대로 |
| 11 | `capacitor.config.json` | `"appName": "스쿼드 메이커 Preview"` | 이름 교체 | `"아이엠 헤드코치 Preview"` (Preview 표기는 채널 표시라 유지) |
| 12 | `android/app/src/main/res/values/strings.xml` | `app_name`, `title_activity_main` | 이름 교체 | `아이엠 헤드코치 Preview` |
| 13 | `strings.xml` | `package_name`, `custom_url_scheme` | 유지 | 바꾸면 업데이트 설치·링크가 끊긴다 |
| 14 | `android/app/src/main/res/mipmap-*`, `drawable*/ic_launcher_*`, `values/ic_launcher_background.xml`, `values/colors_brand.xml`, `values/styles.xml` | | 유지 | 이름 없는 아이콘·단색 스플래시 |
| 15 | `tests/e2e/brand-intro.spec.js` | `aria-label` 기대값 `'스쿼드 메이커'` (54, 86행) | 기대값 교체 | `'아이엠 헤드코치'` |
| 16 | `tests/e2e/beta-ui.spec.js` | `'스쿼드 메이커 진단 정보'` (86행) | 기대값 교체 | `'아이엠 헤드코치 진단 정보'` (표 9와 짝). 그 밖의 `tests/`에는 2026-10-10 기준 이름 문자열이 없다. 병합 후 다시 `git grep`으로 확인 |
| 17 | `work/tasks/branding/` (PR #47이 추가하는 Run Line 패키지) | | 보존 | 같은 내용의 사본이 `docs/branding/run-line/`에 있다. 이 패키지는 `docs/branding/headcoach/`에 둔다 |

표에 없는 "스쿼드 메이커" 문자열이 나오면 바꾸기 전에 목록으로 보고한다. 문서(`docs/`, `README.md`)의 과거 기록은 바꾸지 않는다.

## 3. 작업 순서

| ID | 작업 | depends_on | parallel_group | files |
|---|---|---|---|---|
| T1 | 웹: 표 1·2 (인트로, 헤더) | - | P1 | `index.html` |
| T2 | 웹: 표 4~9 (문구) | T1 (같은 파일) | - | `index.html` |
| T3 | Android·설정: 표 11·12 | - | P1 | `capacitor.config.json`, `strings.xml` |
| T4 | 테스트 기대값: 표 15·16 | T1, T2 | - | `tests/**` |
| T5 | 자동 검증 | T1~T4 | - | - |
| T6 | 실기기 검증 | T5 | - | - |

### T1. 인트로와 헤더

1. 표 1: 기존 BRAND INTRO 블록을 **여는 주석부터 닫는 주석까지** 지우고 스니펫 파일 전체를 같은 자리(`<body>` 바로 다음)에 붙인다. 스니펫의 `<script data-brand-intro>` 속성을 지우지 않는다(Run Line R2: 번들러 삽입 위치).
2. 표 2: 헤더 스니펫에서 주석을 뺀 `h1` 블록만 붙인다. `h1.wordmark`, `svg.wordmark-logo` 클래스를 유지한다.
3. 찾아 바꾸기 도구를 쓸 때는 스니펫 주석 안의 글자가 아니라 실제 태그를 기준으로 잡는다. 이 패키지의 `tools/apply-a.cjs`가 같은 교체를 하는 참고 구현이다(검증용, 그대로 실행하라는 뜻은 아니다).

### T5. 자동 검증

메모리가 적은 PC다. 포그라운드에서 순서대로, `--workers=1`.

```powershell
npm run test:unit
npm run android:bundle
npx playwright test --project=desktop-1280 --workers=1
npx playwright test --project=mobile-390 --workers=1
cd android; .\gradlew.bat :app:assembleRelease :app:lintRelease --console=plain --no-daemon
```

추가 확인:

- 390px에서 헤더 로고 높이 28px·폭 약 116px, 1280px에서 32px·약 133px, 가로 넘침 없음.
- `svg.wordmark-logo`와 `#brandIntro`의 `aria-label`이 "아이엠 헤드코치".
- 네이티브 흉내(`window.Capacitor.isNativePlatform = () => true`)에서 인트로가 보였다가 준비 후 사라짐. 동작 줄이기에서 1초 안에 닫힘.
- `.work/android-web/index.html`에서 `platform-native.js`가 `<script data-brand-intro>` 뒤에 들어감.
- `git grep -n "스쿼드 메이커" -- index.html android capacitor.config.json tests`의 남은 결과가 모두 "하지 않는다" 범위인지.

2026-10-10 사전 검증: PR #47 head 복사본에 표 1·2·4·5를 적용해 위 웹 항목을 확인했다(헤더 28/116, 32/133, 인트로 표시 후 약 2.3초에 닫힘, 동작 줄이기 0.8초, 콘솔 오류 0). 결과 그림: `assets/preview/applied-on-run-line-390.png`, `-1280.png`. 전체 테스트와 Android 빌드는 실행하지 않았다.

### T6. 실기기 검증 (사람이 할 일)

| # | 확인 | 기대 |
|---|---|---|
| 1 | 홈 화면 라벨 | "아이엠 헤드코치 Preview" 또는 런처에 따라 잘림. 잘린 모양을 기록 |
| 2 | 설정 > 앱 목록 | 같은 이름 |
| 3 | 첫 실행 인트로 | 어두운 단색 → 런 라인 → "아이엠 헤드코치" 펼침 → 앱. 흰 화면 없음 |
| 4 | 좌상단 헤더 | 한글이 시스템 글꼴로 바뀌지 않고 선명함, 버튼과 겹치지 않음 |
| 5 | 기존 사용자 업데이트 설치 | 저장된 전술이 그대로 있음(패키지 ID·저장 키 유지 확인) |

## 4. 완료 기준

- [ ] 상표 확인 결과가 analysis 문서에 기록됨.
- [ ] 교체표 1~16 처리, "하지 않는다" 항목 변경 없음.
- [ ] 단위·데스크톱·모바일 E2E, `assembleRelease`·`lintRelease` 통과(기존 skip 외 새 실패 0).
- [ ] T5 추가 확인 항목 기록, T6 실기기 표 기록(또는 "대기").
- [ ] `docs/README.md` 인덱스와 이 패키지 `README.md` 상태 갱신.

## 5. 위험과 대응

| ID | 위험 | 대응 |
|---|---|---|
| R1 | PR #47이 `main`과 충돌한 채로 이 작업을 먼저 시작 | §0-2. PR #47 병합이 선행 조건 |
| R2 | 스니펫 주석 안의 태그 글자를 기준으로 찾아 바꿔 주석 조각이 화면에 새어 나옴 | T1-3. 2026-10-10 사전 검증에서 실제로 발생해 스니펫 주석을 고쳤다. 적용 후 첫 화면 위쪽에 깨진 글자가 없는지 본다 |
| R3 | 이름을 일괄 치환하다 저장 키·이벤트·패키지 ID까지 바뀜 | 표에 있는 위치만 바꾼다. `squad-maker` 영문 식별자는 건드리지 않는다 |
| R4 | 1줄 런처에서 "아이엠 헤…"로 잘림 | 기록만 한다. 줄인 라벨은 사용자 결정 |
| R5 | 상표 확인 결과 이름을 쓸 수 없게 됨 | 적용 중단. 워드마크는 `tools/gen.cjs`의 문자열만 바꿔 다시 만들 수 있다 |

## 6. 에셋 재생성

손으로 SVG 경로를 고치지 않는다. 도구는 레포 의존성에 넣지 않았다(일회성).

```powershell
# 임시 폴더에서
npm init -y; npm install opentype.js@1.3.4 playwright-core@1.54.1
# 글꼴: IBMPlexSansKR-Bold.ttf (fonts.md 출처) 를 <fonts> 폴더에 둔다. B안 비교용 Pretendard는 이제 필요 없지만 gen.cjs가 읽으므로 같이 둔다.
node <repo>\docs\branding\headcoach\tools\gen.cjs <fonts> <repo>\docs\ux-concepts\brand-headcoach-20261010
node <repo>\docs\branding\headcoach\tools\package-a.cjs <repo>\docs\ux-concepts\brand-headcoach-20261010 <repo>\docs\branding\headcoach <repo>\docs\branding\run-line
node <repo>\docs\branding\headcoach\tools\png-a.cjs <repo>\docs\branding\headcoach
```

`png-a.cjs`·`verify-a.cjs`는 로컬 Playwright Chromium 경로(`%LOCALAPPDATA%\ms-playwright\chromium-1248`)를 쓴다. 다른 버전이면 경로를 고친다.
