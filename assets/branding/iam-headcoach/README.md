# 아이엠 헤드코치 브랜드 전달본

확정된 기술 이름 `iam-headcoach`를 사용하는 제품 전달 파일이다. 승인된 A안의 최종 SVG 6개와 웹 스니펫 3개를 원본과 바이트 단위로 동일하게 복사했다. 파일명만 바꾸었으며 SVG 모양·색·폰트 아웃라인·ARIA와 HTML 주석을 포함한 내용은 원본 그대로다.

현재 앱은 [index.html](../../../index.html)에 같은 승인 SVG와 인트로를 인라인으로 사용한다. 이 폴더는 QA 및 후속 브랜드 재사용을 위한 전달본이며, 앱의 인라인 SVG를 외부 이미지로 교체하지 않는다. 기존 [on-light QA](../../../tests/e2e/korean-branding-20261010.spec.js)는 여기의 밝은 바탕용 SVG 3개를 읽는다.

## 원본과 파일명 대응

원본 경로는 `docs/branding/headcoach/assets/`이다. 아래 SHA-256은 원본의 바이트 해시이며 제품 전달본과 동일하다.

| 원본 상대 경로 | 제품 전달 파일명 | 원본 SHA-256 |
|---|---|---|
| [svg/logo-header.svg](../../../docs/branding/headcoach/assets/svg/logo-header.svg) | [iam-headcoach-header.svg](iam-headcoach-header.svg) | `98b360101233d2943d48991d6f1df861790c8d738079f9cb4fda386a5a21f745` |
| [svg/logo-header-on-light.svg](../../../docs/branding/headcoach/assets/svg/logo-header-on-light.svg) | [iam-headcoach-header-on-light.svg](iam-headcoach-header-on-light.svg) | `3c43f2be37b3859461bf805c909dc388c45a7400d01683c093bd719d09920e0d` |
| [svg/logo-horizontal.svg](../../../docs/branding/headcoach/assets/svg/logo-horizontal.svg) | [iam-headcoach-horizontal.svg](iam-headcoach-horizontal.svg) | `4f0818fdd236fea56f9723be94730cedfecb9d3f1dcd45618d3dee65c37cee8a` |
| [svg/logo-horizontal-on-light.svg](../../../docs/branding/headcoach/assets/svg/logo-horizontal-on-light.svg) | [iam-headcoach-horizontal-on-light.svg](iam-headcoach-horizontal-on-light.svg) | `07c96e0e15f8fd3479399461c43f13f7df3df47d4165b99339dced6c46de10b0` |
| [svg/wordmark.svg](../../../docs/branding/headcoach/assets/svg/wordmark.svg) | [iam-headcoach-wordmark.svg](iam-headcoach-wordmark.svg) | `e4b28735a18a9aeabbcef843cc1fba1508f98232d1165c6492941b1354a5d933` |
| [svg/wordmark-on-light.svg](../../../docs/branding/headcoach/assets/svg/wordmark-on-light.svg) | [iam-headcoach-wordmark-on-light.svg](iam-headcoach-wordmark-on-light.svg) | `0300950f7c22c888148db358f35ce1e91e29264dad362683dd483acaa3e56f6f` |
| [web/header-logo.snippet.html](../../../docs/branding/headcoach/assets/web/header-logo.snippet.html) | [iam-headcoach-header.snippet.html](iam-headcoach-header.snippet.html) | `408ece77a54480d31e3da3fda06663a406c0d2df44bc067d16a0cfc94f511cee` |
| [web/brand-intro.snippet.html](../../../docs/branding/headcoach/assets/web/brand-intro.snippet.html) | [iam-headcoach-intro.snippet.html](iam-headcoach-intro.snippet.html) | `88bb01105952ce72d756fd9e5efda74d35f773d6a303451afde4f3e6684bdf32` |
| [web/meta.snippet.html](../../../docs/branding/headcoach/assets/web/meta.snippet.html) | [iam-headcoach-meta.snippet.html](iam-headcoach-meta.snippet.html) | `afa6b1129707849ecf96f56c9d9e63654b45c4306cec870522b560da1b822f9b` |

## 출처 및 라이선스

원본은 `design/brand-headcoach-20261010`의 commit `d41ea68ff27061e8b1d3c3d8f9c9dca34f889c12`에서 전달된 승인 A안이다. [원본 패키지 README](../../../docs/branding/headcoach/README.md), [디자인 명세](../../../docs/branding/headcoach/01-design-spec.md), [작업 요청](../../../docs/branding/headcoach/02-work-request.md), [폰트 출처 및 라이선스 기록](../../../docs/branding/headcoach/fonts.md)을 함께 보존한다. 현재 적용 범위와 사용자 확정 사항은 [현재 분석](../../../docs/korean-branding-20261010-analysis.md) 및 [현재 설계](../../../docs/korean-branding-20261010-design.md)를 따른다.

워드마크의 IBM Plex Sans KR Bold 700 아웃라인과 저작권·SIL Open Font License 1.1 출처는 원본 [fonts.md](../../../docs/branding/headcoach/fonts.md)에 기록되어 있다. [앱에 보존된 OFL 원문](../../../app/licenses/ibm-plex-sans-kr-OFL.txt)과 [저작권 고지](../../../app/licenses/ibm-plex-sans-kr-notice.txt)도 함께 유지한다. 원본에서 연결한 [Google Fonts 폰트·OFL 자료](https://github.com/google/fonts/tree/main/ofl/ibmplexsanskr), [IBM Plex 원 저장소](https://github.com/IBM/plex), [SIL OFL](https://openfontlicense.org)를 그대로 연결한다. 이 사본은 새 디자인이나 새 라이선스를 부여하지 않으며 폰트 바이너리를 추가하지 않는다.
