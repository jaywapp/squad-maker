# 승인 자산·출처와 현재 코드 적용 기준

승인 원본은 PR53 `d41ea68ff27061e8b1d3c3d8f9c9dca34f889c12`의 `docs/branding/headcoach` A안이다. 운영 코드 기반은 PR52 `d449d02b9f90133bda905dda90acf7a49b4277f1`이며 구 브랜치의 앱 코드는 복사하지 않았다. 원본 가이드·시안·생성 도구·라이선스 기록을 보존하고, 이 문서에 최신 코드와 다른 전제를 정정한다.

## 적용·보존

| 원본 | 이번 적용 |
|---|---|
| assets/web/header-logo.snippet.html | 실제 h1.wordmark의 SVG. 소형 실선 마크, 승인 아웃라인 한글, 기존 28/32px CSS |
| assets/web/brand-intro.snippet.html | 기존 native intro 위치. 로고/간격/워드마크 타이밍만 변경, 기존 JS·ready/tap/6초/reduced motion 보존 |
| assets/web/meta.snippet.html | title/OG/Twitter 제목. 기존 기능 설명·공유/OG URL 보존 |
| assets/svg/*-on-light.svg | 밝은 외부 문서용 원본 보존, 앱 night 팔레트 변경 근거로 쓰지 않음 |
| assets/svg/unchanged 4개 + PNG store 1개 | PR52 Run Line 원본과 SHA256 동일. favicon/native adaptive·monochrome·legacy·splash 교체/재생성하지 않음 |
| docs/branding/run-line + ux-concepts/brand-headcoach-20261010 | 원형 설계와 A/B 비교/제작 근거 보존. B안은 운영 적용하지 않음 |

정확한 이름은 **아이엠 헤드코치**, ASCII 공백 1개, IBM Plex Sans KR Bold 700 아웃라인이다. 영문 병기·보조 부제·새 도형·색·글꼴 의존성을 만들지 않는다. Android Preview 포함 여부와 npm 기술 이름은 사용자 결정 전 미확정이다.

## 원본 문서의 전제와 이번 지시의 우선순위

- 원본의 PR47 main 선병합·상표 확인 완료·commit/push/PR 금지는 이번 최신 사용자 지시와 다른 당시 인계 조건이다. 이번은 PR52 기반 별도 Draft이며 main 병합·배포·서명·설치를 하지 않는다.
- 과거 BRAND INTRO 주석 앵커와 tests/e2e/brand-intro.spec.js는 PR52에 없다. 현재 DOM 위치와 launch-brand-feedback-20261010.spec.js 등 실제 파일을 따른다.
- 과거 native colors_brand.xml의 미사용 3개 색을 PR52로 되살리지 않는다.
- 원본 README의 일부 PNG 치수와 '투명 배경' 설명은 실제 파일과 다르다. 재생성하지 않고 아래 실측 표로 확인한다. 투명 RGBA는 로고 PNG이며 intro/store PNG에는 배경이 있다.
- 공급 패키지에는 TTF 버전/해시가 없다. 정확한 사용 원본 바이너리·재현 일치는 **미확인**이며, 최종 SVG에는 text/font 임베드가 없어 런타임 의존성이 없다.

## 출처·라이선스

IBM Plex Sans KR — Copyright © 2017 IBM Corp. with Reserved Font Name "Plex". SIL Open Font License 1.1. [공식 IBM 저장소](https://github.com/IBM/plex), [Google Fonts 원본](https://github.com/google/fonts/tree/main/ofl/ibmplexsanskr), [OFL](https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsanskr/OFL.txt). 원본 fonts.md를 보존하고 앱 라이선스 폴더에 고지를 포함한다. 로고 아웃라인이 라이선스 전체 준수/법적 사용 적합성 검토 완료를 뜻하지 않는다.

상표 참고는 사용자 제공 조사 범위인 '동일 전체 이름을 공개 검색에서 발견하지 못했으며 관련 분야 headcoach 등록상표가 있음'만 기록한다. 검색 관할·데이터베이스·분류·검색일·등록번호를 이번 작업에서 확인한 것은 아니다. 사용 불가/법적 검토 완료로 단정하거나 이를 이유로 개명하지 않는다.

## 원본 SVG 해시

| 파일 | SHA-256 |
|---|---|
| logo-header.svg | 98b360101233d2943d48991d6f1df861790c8d738079f9cb4fda386a5a21f745 |
| logo-horizontal.svg | 4f0818fdd236fea56f9723be94730cedfecb9d3f1dcd45618d3dee65c37cee8a |
| wordmark.svg | e4b28735a18a9aeabbcef843cc1fba1508f98232d1165c6492941b1354a5d933 |
| logo-header-on-light.svg | 3c43f2be37b3859461bf805c909dc388c45a7400d01683c093bd719d09920e0d |
| logo-horizontal-on-light.svg | 07c96e0e15f8fd3479399461c43f13f7df3df47d4165b99339dced6c46de10b0 |
| wordmark-on-light.svg | 0300950f7c22c888148db358f35ce1e91e29264dad362683dd483acaa3e56f6f |

## 실측 PNG 메타데이터

재생성 없이 원본 PNG IHDR로 읽은 값이다. color type 6=RGBA, 2=RGB.

| 원본 경로 | 실제 픽셀 | 형식 |
|---|---|---|
| png/intro-final-360x780@1x.png | 360×780 | RGB |
| png/intro-final-360x780@3x.png | 1080×2340 | RGB |
| png/logo-header-28@1x.png | 117×28 | RGBA |
| png/logo-header-28@2x.png | 234×56 | RGBA |
| png/logo-header-28@3x.png | 351×84 | RGBA |
| png/logo-header-32@1x.png | 133×32 | RGBA |
| png/logo-header-32@2x.png | 266×64 | RGBA |
| png/logo-header-32@3x.png | 399×96 | RGBA |
| png/logo-header-on-light-28@2x.png | 234×56 | RGBA |
| png/logo-header-on-light-28@3x.png | 351×84 | RGBA |
| png/logo-header-on-light-32@2x.png | 266×64 | RGBA |
| png/logo-header-on-light-32@3x.png | 399×96 | RGBA |
| png/logo-horizontal-48@1x.png | 200×48 | RGBA |
| png/logo-horizontal-48@2x.png | 400×96 | RGBA |
| png/logo-horizontal-48@3x.png | 600×144 | RGBA |
| png/logo-horizontal-64@1x.png | 266×64 | RGBA |
| png/logo-horizontal-64@2x.png | 532×128 | RGBA |
| png/logo-horizontal-64@3x.png | 798×192 | RGBA |
| png/logo-horizontal-on-light-64@2x.png | 532×128 | RGBA |
| png/logo-horizontal-on-light-64@3x.png | 798×192 | RGBA |
| png/unchanged/icon-store-512.png | 512×512 | RGB |
| png/wordmark-64@1x.png | 193×64 | RGBA |
| png/wordmark-64@2x.png | 386×128 | RGBA |
| png/wordmark-64@3x.png | 579×192 | RGBA |
