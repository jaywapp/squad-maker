# 브랜드 사용 가이드

로고·아이콘·색을 쓰거나 새 자산을 만들 때 이 문서 하나로 판단할 수 있게 정리했다.
숫자와 규칙의 원본은 [run-line/01-design-spec.md](run-line/01-design-spec.md)와 [headcoach/01-design-spec.md](headcoach/01-design-spec.md)이다. 두 문서와 이 가이드가 다르면 원본을 따르고 이 가이드를 고친다.

## 1. 한눈에

| 항목 | 내용 |
|---|---|
| 앱 | 축구·풋살 전술과 선수 배치를 직접 만들고 저장·공유하는 전술판 |
| 이름 | 현재 "스쿼드 메이커" (영문 워드마크 `SQUAD MAKER`). 전환 예정 "아이엠 헤드코치" (상표 확인 전) |
| 마크 | **런 라인(Run Line)**: 라임색 선수 토큰 → 분필색 점선 런 라인 → 화살촉. "선수를 놓고 움직임을 그린다" |
| 분위기 | 나이트피치. 어두운 바탕, 피치 녹색, 분필색, 라임 강조 하나 |
| 원칙 | 한글 이름을 앞세운다. 영문 이름을 함께 쓰지 않는다. 공(⚽)·방패 같은 일반 축구 상징을 쓰지 않는다 |

![크기별 사용 예시 (Run Line, 영문 워드마크 시절)](run-line/assets/preview/logo-usage.png)

## 2. 색

| 토큰 | 값 | 쓰는 곳 | 쓰지 않는 곳 |
|---|---|---|---|
| night | `#141A16` | 앱·스플래시·인트로 배경, 헤더 바탕, 밝은 바탕용 로고의 글자·선 | |
| pitch | `#2B5E3F` | 앱 아이콘·파비콘 바탕(면) | 선·글자색. night 위에서 2.3:1이라 경계가 약하다 |
| chalk | `#E8EDE8` | 워드마크, 런 라인, 화살촉 | |
| lime | `#B8E986` | 마크 안의 선수 토큰 하나 | 런 라인·글자. 마크 안에서 라임은 토큰뿐이다 |
| muted | `#8FA096` | Run Line 시절 한글 보조 표기 | 아이엠 헤드코치 로고에는 쓰지 않는다 |

명암비: chalk/night 14.9, lime/night 12.6, chalk/pitch 6.4, lime/pitch 5.4. 새 색을 추가하지 않는다.

## 3. 마크

| 변형 | 표시 크기 | 모양 | 파일 |
|---|---|---|---|
| 표준형 | 40px 이상 | 점선 런 라인(실제 선분 4개), 선 굵기 6 | `run-line/assets/svg/run-line-symbol.svg` (viewBox `17 17 67 67`) |
| 소형 | 16~39px | 실선 런 라인, 굵기 9, 토큰 조금 크게 | `run-line/assets/svg/run-line-symbol-small.svg` (viewBox `14 14 72 72`) |
| 없음 | 16px 미만 | 마크를 쓰지 않는다 | |

예외: Android 런처 아이콘(48dp)은 큰 화면(설정·스토어)에서도 보이므로 표준 점선형을 쓴다.

## 4. 워드마크

| | 현재 (Run Line) | 전환 후 (아이엠 헤드코치 A안) |
|---|---|---|
| 글자 | `SQUAD MAKER` | `아이엠 헤드코치` 한 줄 |
| 글꼴 | Oswald SemiBold (600) | IBM Plex Sans KR Bold (700) |
| 글자 높이 | 37 (viewBox 단위, 대문자) | 44 (한글은 획이 많아 키움) |
| 한글 보조 표기 | "스쿼드 메이커"(48px 이상일 때만) | 없음 |
| 전달 형태 | 아웃라인 경로 | 아웃라인 경로 |

- 워드마크는 항상 **아웃라인 경로**로 쓴다. Android 번들은 웹 글꼴을 지우므로(`scripts/build-android-web.mjs`) `<text>`로 두면 기기 글꼴로 바뀐다.
- 가로형 구성: 왼쪽 100×100 칸에 마크, x=110부터 워드마크. 간격·비율을 바꾸지 않는다.
- 로고 그림의 접근성 이름은 브랜드 이름 그대로("스쿼드 메이커", 전환 후 "아이엠 헤드코치").

폰트 라이선스(둘 다 SIL Open Font License 1.1, 상업 사용·앱 배포 가능):
- IBM Plex Sans KR: https://github.com/google/fonts/tree/main/ofl/ibmplexsanskr, 상세 [headcoach/fonts.md](headcoach/fonts.md)
- Oswald: https://github.com/google/fonts/tree/main/ofl/oswald (Run Line 사양 §4, 재생성은 run-line/02-work-request.md §7)

## 5. 파일 고르기

전환 전(Run Line)과 전환 후(아이엠 헤드코치) 파일을 위치별로 정리했다. 아이콘·파비콘·스플래시는 두 단계가 같다.

| 쓰는 곳 | 표시 크기 | 전환 전 (Run Line) | 전환 후 (아이엠 헤드코치) |
|---|---|---|---|
| 앱 좌상단 헤더 | 높이 28px(모바일), 32px(1024px 이상) | `run-line/assets/web/header-logo.snippet.html` | `headcoach/assets/web/header-logo.snippet.html`, PNG `headcoach/assets/png/logo-header-28@2x.png` 등 |
| 네이티브 인트로 | 마크 56~220px | `run-line/assets/web/brand-intro.snippet.html` | `headcoach/assets/web/brand-intro.snippet.html` |
| 공유 이미지·문서 머리 | 높이 40px 이상 | `run-line/assets/svg/logo-horizontal.svg` | `headcoach/assets/svg/logo-horizontal.svg`, PNG `logo-horizontal-48/64@1x~3x.png` |
| 워드마크만 | | | `headcoach/assets/svg/wordmark.svg`, PNG `wordmark-64@1x~3x.png` |
| 밝은 바탕(인쇄·외부 문서) | 28px 이상 | (별도 파일 없음) | `headcoach/assets/svg/*-on-light.svg`, PNG `*-on-light-*.png` |
| 브라우저 탭 파비콘 | 16~32px | `run-line/assets/svg/favicon.svg`, `assets/web/favicon.snippet.html` | 같음 |
| Android 런처 아이콘 | 48dp | `run-line/assets/android/res/**` | 같음 |
| Android 시스템 스플래시 | 전체 화면 | night 단색, 아이콘 없음 (`run-line/assets/android/res/values/styles.xml`) | 같음 |
| Play 스토어 아이콘 | 512px | `run-line/assets/preview/icon-store-512.png` | 같음 (`headcoach/assets/png/unchanged/icon-store-512.png`) |

PNG 픽셀 크기 전체 목록: [headcoach/README.md](headcoach/README.md#png-assetspng-투명-배경).

## 6. 하지 말 것

- 마크를 늘이거나 누르거나 회전하지 않는다. 그림자·외곽선·그라데이션·광택을 넣지 않는다.
- 토큰 외에 라임을 쓰지 않는다. 런 라인을 라임으로 칠하지 않는다.
- 40px 미만에 점선형을, 16px 미만에 마크를 쓰지 않는다. 한글 로고는 높이 28px 미만에 쓰지 않는다.
- 워드마크를 글꼴 `<text>`로 다시 치지 않는다.
- 아이콘에 이름 글자를 넣지 않는다. 공(⚽) 이모지 아이콘·파비콘을 다시 쓰지 않는다.
- 영문 이름과 한글 이름을 같이 쓰지 않는다.
- 로고 주변 여백은 토큰 지름(마크 높이의 약 1/3) 이상. 헤더처럼 좁은 곳은 토큰 반지름까지.
- 브랜드 이름을 바꿀 때 패키지 ID, 저장 키(`squad-maker-*`), 이벤트 이름, `.sq` 형식, 도메인, 저장소 이름은 건드리지 않는다. 바꾸면 업데이트 설치와 저장된 데이터가 끊긴다.

## 7. 다시 만들기

SVG·PNG·스니펫을 손으로 고치지 않는다. 도구로 다시 만든다. 도구는 레포 의존성에 넣지 않았으므로 임시 폴더에서 설치한다.

### 준비

```powershell
# 임시 폴더(예: $env:TEMP\brand-tools)에서
npm init -y
npm install opentype.js@1.3.4 playwright-core@1.54.1
npx playwright install chromium   # 이미 있으면 생략
```

| 글꼴 파일 | 받는 곳 | 쓰는 도구 |
|---|---|---|
| `IBMPlexSansKR-Bold.ttf` | https://github.com/google/fonts/tree/main/ofl/ibmplexsanskr | headcoach `gen.cjs` |
| `Pretendard-SemiBold.otf`, `Pretendard-ExtraBold.otf` | https://github.com/orioncactus/pretendard/releases/tag/v1.3.9 (`public/static/`) | headcoach `gen.cjs`(선택되지 않은 B안도 함께 만들기 때문에 필요) |
| Oswald SemiBold(600) woff | Google Fonts (OFL) | run-line `build-geometry.cjs` |

글꼴 파일은 저장소에 넣지 않는다.

### 아이엠 헤드코치 자산

```powershell
# <fonts> 폴더에 IBMPlexSansKR-Bold.ttf, pretendard/public/static/*.otf 를 둔다
node <repo>\docs\branding\headcoach\tools\gen.cjs <fonts> <repo>\docs\ux-concepts\brand-headcoach-20261010
node <repo>\docs\branding\headcoach\tools\package-a.cjs <repo>\docs\ux-concepts\brand-headcoach-20261010 <repo>\docs\branding\headcoach <repo>\docs\branding\run-line
node <repo>\docs\branding\headcoach\tools\png-a.cjs <repo>\docs\branding\headcoach
```

- 글자 크기·위치·자간을 바꾸려면 `gen.cjs`의 `Concept 01` 블록(`height`, `tracking`, `place(..., 110, ...)`)을 고친다.
- 인트로 시간을 바꾸려면 `package-a.cjs`의 `bi-word` 애니메이션 값과 `intro.cjs`를 함께 고친다.
- PNG 크기를 추가하려면 `png-a.cjs`의 `jobs` 표에 높이·배율을 더한다.
- `png-a.cjs`, `verify-a.cjs`는 `%LOCALAPPDATA%\ms-playwright\chromium-1248` 경로를 쓴다. 설치된 버전이 다르면 경로를 고친다.
- 스크립트는 `require('playwright-core')`를 쓰므로 준비 단계의 임시 폴더로 복사해서 실행한다(레포 안에서 바로 실행하면 모듈을 찾지 못한다).

### Run Line 자산

[run-line/02-work-request.md §7](run-line/02-work-request.md)을 따른다(`build-geometry.cjs` → `write-assets.cjs` → `write-web.cjs`). Android 레거시 PNG와 미리보기 이미지는 그 도구가 만들지 않는다.

### 만든 뒤 확인

1. 어두운 바탕(night)과 밝은 바탕에 PNG를 올려 잘림·번짐이 없는지 본다.
2. 헤더 스니펫을 앱에 넣고 390px·1280px에서 높이(28/32px)와 가로 넘침을 확인한다. `headcoach/tools/apply-a.cjs`, `verify-a.cjs`가 참고 구현이다.
3. 바뀐 자산을 쓰는 문서(각 패키지 README, 01 사양)의 숫자를 함께 고친다.

## 8. 앱 안에서 브랜드가 들어가는 곳

| 위치 | 파일 | 무엇 |
|---|---|---|
| 좌상단 헤더 | `index.html` `h1.wordmark` | 로고 SVG. `h1.wordmark`, `svg.wordmark-logo`는 테스트가 확인한다 |
| 네이티브 인트로 | `index.html` BRAND INTRO 블록(`<body>` 바로 다음) | 네이티브 앱에서만 1.4초 모션. `<script data-brand-intro>` 속성 유지 |
| 파비콘 | `index.html` `<link rel="icon">` | |
| 탭·공유 제목 | `index.html` `<title>`, `og:title`, `twitter:title` | |
| 앱 이름 | `capacitor.config.json` `appName`, `android/app/src/main/res/values/strings.xml` | |
| 앱 아이콘·스플래시 | `android/app/src/main/res/` mipmap·drawable·values | |
| 공유 미리보기 이미지 | `og-image.png` | 아직 브랜드 작업 범위에 넣지 않았다 |

PR #47 병합 전 `main`에는 위 중 헤더·인트로·파비콘·아이콘이 아직 Run Line이 아니다(§1 상태 참고).

## 9. 자주 묻는 것

**아이콘에 이름을 넣어야 하나?** 넣지 않는다. 48dp에서 글자가 읽히지 않고 마크와 경쟁한다.

**런처에서 이름이 "아이엠 헤…"로 잘린다.** 한 줄만 보여 주는 런처에서 생긴다. 기본은 전체 이름 유지다. 줄인 라벨은 사용자 결정이 필요하다.

**밝은 바탕에서 라임 토큰이 잘 안 보인다.** 맞다(약 1.4:1). 밝은 바탕용은 어두운 바탕을 쓸 수 없을 때만 쓴다.

**웹 글꼴로 로고를 쓰면 안 되나?** Android 번들이 웹 글꼴을 지워 모양이 바뀐다. 아웃라인 경로 파일을 쓴다.

**상표 확인 전에 이름을 바꿔도 되나?** 안 된다. 확인 결과를 [../brand-headcoach-20261010-analysis.md](../brand-headcoach-20261010-analysis.md) §5에 기록한 뒤 적용한다.
