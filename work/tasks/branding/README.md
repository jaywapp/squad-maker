# 브랜딩 적용 패키지 — A 런 라인 (Run Line)

앱 아이콘, 앱 좌상단 로고, 시작 스플래시(시스템 스플래시 + 앱 안 모션 인트로)를 운영 앱에 적용하기 위한 작업 묶음이다.
이 폴더만 보고 누구나 적용할 수 있게 시안 사양, 작업 절차, 완성 에셋, 재생성 도구를 함께 넣었다.

| 항목 | 내용 |
|---|---|
| 상태 | **적용 완료 · Draft PR 검토 단계** · T7 실기기 미검증 |
| 선택 | 시안 A "런 라인" — 2026-10-08 사용자 선택 |
| 시안 원본 | `design/brand-20261008`의 `docs/ux-concepts/brand-20261008/` (A·B·C 비교, A = `concept-01/`, 원본 작업 트리에 보존) |
| 작업 기준 브랜치 | `feat/a-preview-release-20261007` (`7f1f1a9`, `v0.1.0-preview.1` APK 기준) |
| 이 패키지를 만든 브랜치 | `design/brand-20261008` |

## 읽는 순서

1. **[01-design-spec.md](01-design-spec.md) — 적용 시안.** 로고가 무엇이고, 어떤 크기에서 어떤 변형을 쓰고, 무엇을 하면 안 되는지. 모션 타임라인.
2. **[02-work-request.md](02-work-request.md) — 적용 작업요청서.** 어느 파일을 어떻게 바꾸는지 단계별 절차, 검증 체크리스트, 완료 기준.
3. 미리보기 이미지로 결과를 먼저 눈으로 확인한다.
4. 작업 세션에 맡길 때는 **[03-goal-prompt.md](03-goal-prompt.md)** 의 프롬프트를 그대로 붙여 넣는다.

| 미리보기 | 파일 |
|---|---|
| 스플래시 모션 (360×780, 1.4초) | [assets/preview/splash-preview.gif](assets/preview/splash-preview.gif) |
| 스플래시 마지막 정지 화면 | [assets/preview/splash-final-360.png](assets/preview/splash-final-360.png) |
| 좌상단 헤더 적용 모습 (모바일) | [assets/preview/header-mobile.png](assets/preview/header-mobile.png) |
| Play 스토어 아이콘 512 | [assets/preview/icon-store-512.png](assets/preview/icon-store-512.png) |
| 크기별 사용 예시 | [assets/preview/logo-usage.png](assets/preview/logo-usage.png) |

![스플래시 모션](assets/preview/splash-preview.gif)

## 폴더 구성

```text
work/tasks/branding/
├─ README.md                 이 문서
├─ 01-design-spec.md         적용 시안 (사양·사용 규칙·모션)
├─ 02-work-request.md        적용 작업요청서 (절차·검증·완료 기준)
├─ assets/
│  ├─ svg/                   운영용 SVG (그대로 사용) — 점선은 실제 선분으로 분해, 워드마크는 아웃라인 경로
│  │  ├─ run-line-symbol.svg        심볼 표준형 (40px 이상)
│  │  ├─ run-line-symbol-small.svg  심볼 소형 (16~39px)
│  │  ├─ logo-horizontal.svg        가로형 로고 (높이 40px 이상)
│  │  ├─ logo-header.svg            좌상단 헤더용 가로형 (높이 24~32px)
│  │  ├─ favicon.svg                브라우저 탭 아이콘
│  │  ├─ icon-foreground.svg        adaptive icon 전경 (108 캔버스)
│  │  ├─ icon-monochrome.svg        Android 13 테마 아이콘
│  │  └─ icon-store-512.svg         Play 스토어 512 원본
│  ├─ android/res/           Android 리소스 (같은 경로로 복사)
│  ├─ web/                   index.html에 붙일 스니펫 3개 (인트로·헤더 로고·파비콘)
│  ├─ preview/               확인용 렌더 이미지 (운영에 넣지 않음)
│  └─ source/                시안 원본 SVG·인트로 단독 페이지 (참고용, 운영에 넣지 않음)
└─ tools/                    에셋 재생성 스크립트 (02 문서 "에셋 재생성" 참고)
```

## 한 줄 요약

선수 토큰(라임 점) 하나가 점선 런 라인을 따라 앞으로 뛰어나가는 마크. 전술 보드에서 코치가 그리는 "선수 이동 화살표" 그 자체다.
아이콘은 피치 녹색 바탕에 이 마크, 좌상단은 소형 실선 마크 + `SQUAD MAKER` 워드마크, 스플래시는 점 → 선 → 화살촉 순으로 그려진 뒤 워드마크가 펼쳐지는 1.4초 모션이다.

## 미확인 사항 (적용 작업에서 확인)

- 실제 Android 기기의 런처 마스크(원·둥근 사각·물방울), 테마 아이콘, 스플래시 → 웹 인트로 전환. 지금까지는 Chromium 렌더와 `aapt2 compile`까지만 확인했다.
- 상표 검색, 사용자 반응.

## 적용 기록 (2026-10-08)

전체 PR을 병합한 main aa891870d9bb1649a7d64b507c232534e16cb6dd에서 feat/brand-run-line으로 적용했다. [작업·검증·실기기 대기표](../../../docs/brand-run-line-20261008-tasks.md)를 기준으로 확인한다. 원본 시안 비교는 D:/station/.worktrees/squad-maker-brand-20261008/docs/ux-concepts/brand-20261008/에 보존되어 있다. 이 branch에는 사용자 지시대로 작업 패키지만 복사했다.

제공 assets41개/적용 Android res17개는 원본 SHA256과 동일하며 스토어512 PNG는 기존 파일을 재사용했다. 이전 적용 단계에서는 서명 APK·배포·PR 게시를 하지 않았다. 이후 사용자 요청으로 최종 검증·commit/push·main 대상 Draft PR을 진행한다. [최신 실행 기록](../../../docs/brand-run-line-pr-20261008-tasks.md)과 [T7 체크리스트](../../../docs/brand-run-line-pr-20261008-t7.md)를 따른다. PR은 GitHub의 feat/brand-run-line head로 조회한다. 실제기기의 흰 깜빡임·마스크·테마 아이콘·warm start는 미검증이며 서명/설치/배포/병합을 보류한다.
