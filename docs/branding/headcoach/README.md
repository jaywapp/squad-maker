# 브랜드 전환 패키지: 아이엠 헤드코치 (A안)

Run Line 브랜딩(PR #47)의 영문 이름 `SQUAD MAKER`를 한글 '아이엠 헤드코치'로 바꾸기 위한 작업 묶음이다.
이 폴더만 보고 Codex가 적용할 수 있게 사양, 교체표, 완성 자산, 폰트 정보, 재생성 도구를 함께 넣었다.

| 항목 | 내용 |
|---|---|
| 상태 | **인계 준비 완료, 적용 대기.** 선행 조건: 국내 상표 확인, PR #47 병합 |
| 선택 | A안 · 최소 변경 (2026-10-10 사용자 선택). 마크·아이콘·색은 그대로, 워드마크만 한글 |
| 시안 비교 | `docs/ux-concepts/brand-headcoach-20261010/` (A·B 비교 보드) |
| 결정 기록 | `docs/brand-headcoach-20261010-analysis.md`, `-design.md`, `-tasks.md` |
| 만든 브랜치 | `design/brand-headcoach-20261010` |

## 읽는 순서

1. **[01-design-spec.md](01-design-spec.md)**: 무엇이 바뀌는가. 워드마크 기하, 크기별 사용표, 모션 변경분, 금지 사항.
2. **[02-work-request.md](02-work-request.md)**: 기존 파일 교체표, 작업 순서, 검증, 위험.
3. **[fonts.md](fonts.md)**: 폰트 이름·버전·라이선스·출처·고지 문구.
4. Codex에 맡길 때는 **[03-goal-prompt.md](03-goal-prompt.md)** 블록을 그대로 붙여 넣는다.

![실제 앱 헤더 (PR #47 코드 위 적용, 390px)](assets/preview/applied-on-run-line-390.png)

![인트로 모션](assets/preview/intro.gif)

## 색상값

| 토큰 | 값 | 이번 자산에서 |
|---|---|---|
| night | `#141A16` | 배경, 밝은 바탕용 로고의 글자·선 |
| pitch | `#2B5E3F` | 아이콘·파비콘 바탕(변경 없음) |
| chalk | `#E8EDE8` | 워드마크, 런 라인, 화살촉 |
| lime | `#B8E986` | 선수 토큰 |

## 자산 목록

### SVG (`assets/svg/`)

| 파일 | 용도 | viewBox |
|---|---|---|
| `logo-header.svg` | 앱 헤더 28/32px (소형 실선 마크) | `0 0 415.4 100` |
| `logo-horizontal.svg` | 높이 40px 이상 (표준 점선 마크) | `0 0 415.4 100` |
| `wordmark.svg` | 워드마크만 | `0 0 301.4 100` |
| `*-on-light.svg` | 밝은 바탕용(글자·선 night) | 위와 같음 |
| `unchanged/*` | Run Line 마크·파비콘·스토어 아이콘. 바꾸지 않음, 참고용 사본 | |

### PNG (`assets/png/`, 투명 배경)

| 파일 | 픽셀 |
|---|---|
| `logo-header-28@1x/2x/3x.png` | 116×28 / 232×56 / 349×84 |
| `logo-header-32@1x/2x/3x.png` | 133×32 / 266×64 / 398×96 |
| `logo-horizontal-48@1x/2x/3x.png` | 199×48 / 398×96 / 598×144 |
| `logo-horizontal-64@1x/2x/3x.png` | 266×64 / 531×128 / 797×192 |
| `wordmark-64@1x/2x/3x.png` | 193×64 / 385×128 / 578×192 |
| `logo-header-on-light-28@2x/3x.png`, `-32@2x/3x.png` | 232×56, 349×84, 266×64, 398×96 |
| `logo-horizontal-on-light-64@2x/3x.png` | 531×128 / 797×192 |
| `intro-final-360x780@1x/3x.png` | 360×780 / 1080×2340 (인트로 마지막 화면) |
| `unchanged/icon-store-512.png` | 512×512 (Run Line 그대로) |

### 웹 스니펫 (`assets/web/`)

| 파일 | 넣는 곳 |
|---|---|
| `header-logo.snippet.html` | `index.html` `h1.wordmark` 블록 교체 |
| `brand-intro.snippet.html` | `index.html` BRAND INTRO 블록 교체 (주석 포함 전체) |
| `meta.snippet.html` | `<title>`, `og:title`, `twitter:title` 이름 교체 |

### 미리보기 (`assets/preview/`)

`applied-on-run-line-390/1280.png`(PR #47 코드에 적용), `header-390/1280.png`·`screen-390.png`(현재 main에 헤더만 끼운 시안 캡처), `intro.gif`, `intro-filmstrip.png`, `small-sizes-360.png`(아이콘 48dp·런처 라벨·파비콘 실제 크기).

### 도구 (`tools/`)

`gen.cjs`(워드마크 아웃라인), `intro.cjs`(시안 인트로 페이지), `package-a.cjs`(이 폴더의 SVG·스니펫 생성), `png-a.cjs`(PNG), `apply-a.cjs`·`verify-a.cjs`(PR #47 복사본에 적용·검증한 참고 구현). 사용법은 02 문서 §6.
