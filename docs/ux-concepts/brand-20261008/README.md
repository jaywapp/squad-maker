# 브랜드 시안 3종 (brand-20261008)

앱 아이콘, 좌상단 로고, 시작 스플래시 모션 시안. 상태: **A 런 라인 선택 (2026-10-08 사용자).** 운영 앱·Android 리소스는 아직 바꾸지 않았다.

적용 시안·작업요청서·운영 에셋: [`work/tasks/branding/`](../../../work/tasks/branding/README.md)

- 브리프: [brief.md](brief.md)
- 비교 페이지: [index.html](index.html)
- 기준 브랜치: `feat/a-preview-release-20261007` (`7f1f1a9`), 작업 브랜치 `design/brand-20261008`

| 시안 | 아이디어 | 파일 |
|---|---|---|
| A 런 라인 | 선수 점 하나 + 점선 런 라인(살짝 S) | `concept-01/` |
| B 포메이션 도트 | 선수 점 7개가 S자 대형, 선택 선수 1명만 라임 | `concept-02/` |
| C 초크 피치 | 하프라인 + 센터서클을 비튼 S 모노그램, 녹색 피치 타일 | `concept-03/` |

각 폴더 구성:
- `index.html`: 발표 페이지(헤더 로고 목업, 아이콘 마스크·크기·단색, 2단계 스플래시, 사양)
- `splash.html`: 모션 인트로 단독(CSS 애니메이션만)
- `assets/`: `logo-horizontal.svg`, `logo-symbol.svg`, `logo-symbol-small.svg`, `icon-foreground.svg`, `icon-background.svg`, `icon-monochrome.svg`, `icon-store-512.svg`
- 렌더 결과: `splash-preview.gif`(360×780, 25fps), `splash-final-360.png`, `icon-store-512.png`, `header-mobile.png`, `board-desktop.png`, `board-mobile-top.png`

## 렌더·점검 (2026-10-08, Playwright Chromium)
- `splash.html`의 애니메이션을 `document.getAnimations()`로 시간 고정해 25fps 프레임을 뽑고 ffmpeg로 GIF를 만들었다. 무한 반복 애니메이션 0개, 길이 A 1400ms · B 1460ms · C 1500ms.
- 발표 페이지 360px·1280px 가로 넘침 0(리드가 A·B 좁은 화면 넘침과 B 아이콘의 불필요한 골 에어리어 선, A 스토어 아이콘 여백을 수정).
- 미확인: 실제 Android 홈 화면·런처 마스크, 상표 검색, 사용자 테스트.

## 적용 시 할 일 (선택 후)

상세 절차는 [`work/tasks/branding/02-work-request.md`](../../../work/tasks/branding/02-work-request.md). 아래는 요약이다.
1. 워드마크 `<text>`를 아웃라인 경로로 변환(Android 번들은 Google Fonts를 쓰지 않음).
2. Android adaptive icon(foreground/background/monochrome) 벡터 리소스와 mipmap PNG, Play 512 생성.
3. 시스템 스플래시: `windowSplashScreenBackground`·아이콘 설정(필요하면 1000ms 이하 AVD).
4. 앱 안 모션 인트로를 index.html에 넣고 `SquadMakerContract.ready()`와 연결, 탭 건너뛰기·동작 줄이기 대응.
5. 좌상단 `h1.wordmark`를 선택한 로고로 교체(회귀 테스트가 `h1.wordmark` 노출을 확인하므로 요소는 유지).
