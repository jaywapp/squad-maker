# 한글 브랜드 '아이엠 헤드코치' 전환 시안 (2026-10-10): 설계

- slug: `brand-headcoach-20261010` · [분석](brand-headcoach-20261010-analysis.md) · [작업계획](brand-headcoach-20261010-tasks.md)
- 기준: Run Line 사양 `docs/branding/run-line/01-design-spec.md`(원본 PR #47 `work/tasks/branding/`). 아래에 적지 않은 규칙(마크 기하, 금지 사항, 여백, 접근성)은 Run Line 사양을 그대로 따른다.
- **선택: A안 · 최소 변경 (2026-10-10).** 인계 패키지 `docs/branding/headcoach/`
- 시안 파일: `docs/ux-concepts/brand-headcoach-20261010/` ([비교 보드](ux-concepts/brand-headcoach-20261010/index.html))

## 1. 바뀌지 않는 것 (두 안 공통)

| 항목 | 값 |
|---|---|
| 색 | night `#141A16`, pitch `#2B5E3F`, chalk `#E8EDE8`, lime `#B8E986`, muted `#8FA096` (새 색 없음) |
| 마크 | 표준형 viewBox `17 17 67 67`(40px 이상), 소형 실선형 viewBox `14 14 72 72`(16~39px) |
| 앱 아이콘 | pitch 바탕 + 표준 점선 마크, 이름 없음. Android adaptive·monochrome·레거시 PNG·스토어 512 모두 PR #47 그대로 |
| 파비콘 | pitch 둥근 사각 + 소형 마크 (`shared/favicon.svg`) |
| 시스템 스플래시 | night 단색, 아이콘 투명 |
| 인트로 모션 | 0~920ms 마크(토큰 튀어나옴 → 점선 그려짐 → 화살촉), 900~1400ms 마크 왼쪽 이동. 총 1400ms, 탭 건너뛰기, 동작 줄이기 지원 |
| 접근성 이름 | 로고 그림의 이름은 항상 "아이엠 헤드코치" |

## 2. A안 · 최소 변경 (`concept-01/`)

- 구조: Run Line 가로형과 같다. 마크 칸 0~100, 글자 시작 x=110.
- 글자: "아이엠 헤드코치" 한 줄, IBM Plex Sans KR Bold, 자간 -0.01em, 글자 덩어리 높이 44(viewBox 단위), 세로 중심 y=49.5. 색 chalk.
  - Run Line 영문 대문자 높이는 약 37이었다. 한글은 획이 많아 같은 높이면 작게 읽혀 44로 키웠다.
- 크기: 헤더 28px(모바일), 32px(1024px 이상). 전체 viewBox `0 0 415.4 100` → 28px일 때 폭 약 116px.
- 한글 보조 표기 줄("스쿼드 메이커")은 없앤다. 이름 자체가 한글이 되었기 때문이다.
- 인트로: 영문 줄 대신 한글 한 줄이 1060~1400ms에 왼쪽부터 펼쳐진다(마크 이동과 겹치지 않게 Run Line보다 100ms 늦춤).
- 파일: `assets/logo-header.svg`(소형 마크), `assets/logo-horizontal.svg`(표준 마크), `assets/wordmark.svg`, `intro.html`.

## 3. B안 · 한글 배치 개선 (`concept-02/`)

- 생각: 이름의 핵심어는 "헤드코치"다. 작은 헤더에서 7글자를 같은 무게로 두면 모두 작아지므로, "아이엠"을 앞말(보조)로 낮추고 "헤드코치"를 크게 둔다.
- 한 줄형(헤더, 공유 이미지): "아이엠" Pretendard SemiBold, 높이 40, muted / "헤드코치" Pretendard ExtraBold, 높이 56, 자간 -0.02em, chalk. 두 단어 아래쪽 맞춤(y=77.5), 간격 14. 글자 시작 x=106.
  - 28px 헤더에서 "헤드코치" 약 16px, "아이엠" 약 11px. viewBox `0 0 443.3 100` → 폭 약 124px.
- 두 줄형(인트로, 스플래시, 스토어 등 로고 높이 48px 이상): 1행 "아이엠" 높이 24, 자간 0.06em, muted / 2행 "헤드코치" 높이 52, chalk. 행 간격 10, 묶음을 마크 칸 세로 중앙에 맞춤. viewBox `0 0 306.6 100`.
- 인트로: 1040ms에 "아이엠"이 아래에서 올라오고(300ms), 1080ms에 "헤드코치"가 왼쪽부터 펼쳐진다(320ms). 끝 1400ms.
- 대비: muted `#8FA096` / night 6.4:1. "아이엠"은 11px 이상에서만 쓰고, 그보다 작아지는 자리(16px 아이콘 등)에는 로고를 쓰지 않는다.
- 파일: `assets/logo-header.svg`, `assets/logo-horizontal.svg`, `assets/logo-stacked.svg`, `intro.html`.

## 4. 크기별 사용표 (선택 후 확정)

| 위치 | 표시 크기 | A안 | B안 |
|---|---|---|---|
| 앱 좌상단 헤더 | 28px / 32px | `logo-header.svg` | `logo-header.svg`(한 줄형) |
| 인트로·스플래시 | 마크 56~220px | 한 줄 가로형 | 두 줄형 |
| 공유 이미지·문서 머리 | 높이 40px 이상 | `logo-horizontal.svg` | 한 줄형 또는 두 줄형 |
| 브라우저 탭 | 16~32px | 파비콘(변경 없음) | 같음 |
| Android 런처·스토어 | 48dp / 512px | 아이콘(변경 없음) + 라벨 "아이엠 헤드코치" | 같음 |

## 5. 앱 이름이 바뀌는 곳 (교체 대상 후보)

| 파일 | 현재 값 | 바뀔 값 |
|---|---|---|
| `index.html` `<title>`, `og:title`, `twitter:title` | 스쿼드 메이커, 축구 포메이션 & 전술 공유 | 아이엠 헤드코치, … (Q3) |
| `index.html` `h1.wordmark` | SQUAD MAKER + 전술 보드 (PR #47 이후 Run Line SVG) | 고른 안의 헤더 SVG, `aria-label="아이엠 헤드코치"` |
| 인트로 스니펫 `brand-intro` | Run Line 영문 워드마크 | 고른 안의 인트로 |
| `capacitor.config.json` `appName` | 스쿼드 메이커 Preview | 아이엠 헤드코치 (Preview 표기는 출시 정책에 따름) |
| `android/app/src/main/res/values/strings.xml` `app_name`, `title_activity_main` | 스쿼드 메이커 계열 | 아이엠 헤드코치 (Q2) |
| `tests/e2e/brand-intro.spec.js`(PR #47에서 추가) 등 이름을 확인하는 테스트 | Run Line 기준 | 새 이름 |

패키지 ID(`com.jaywapp.squadmaker…`), 저장 키, 백업 파일 형식(.sq)은 바꾸지 않는다. 바꾸면 기존 사용자 데이터·업데이트 설치가 끊긴다.

## 6. 대안과 트레이드오프

- 아이콘에 "헤" 같은 한 글자 모노그램 넣기: 작은 크기에서 마크와 경쟁하고 Run Line 정체성을 약하게 해 제외했다.
- B안을 IBM Plex Sans KR로 만들기: 새 글꼴 의존은 없어지지만 ExtraBold가 없어 2단 무게 대비가 약하다. Pretendard는 화면용 한글 판독성이 좋고 굵기가 9단계라 B안 목적에 맞다.
- A안 글자를 Run Line과 같은 높이(37)로 두기: 28px에서 한글이 약 10px가 되어 판독이 떨어져 44로 키웠다.

## 7. 검증 방법과 결과

- 실제 앱: 현재 `main`(27a34ca)을 로컬에서 띄우고, 390px(3배, 모바일·터치 에뮬레이션)와 1280px(2배)에서 `h1.wordmark` 안쪽만 시안 SVG로 바꿔 찍었다. 헤더 높이, 버튼 배치, 줄바꿈 변화는 없었다.
- 작은 크기: 360dp 3배 해상도에서 런처 48dp(원형·둥근 사각), 라벨 2줄·1줄, 96/48/24 아이콘, 16px 파비콘 탭을 찍었다.
- 인트로: 50ms 간격 프레임을 고정해 찍어 GIF와 필름스트립을 만들었다. 1.1초 프레임에서 글자와 화살촉이 겹치지 않는 것을 확인했다.
- 미검증: 실기기 런처 라벨 표시(제조사 런처마다 다름), Android 시스템 스플래시 → 인트로 전환 실기기 확인, 상표.
- 재생성: `ux-concepts/brand-headcoach-20261010/tools/`의 `gen.cjs`(opentype.js 1.3.4) → `intro.cjs` → `frames.cjs`·`appshots.cjs`. 글꼴 파일은 저장소에 넣지 않았고 분석 4장의 출처에서 받는다.
