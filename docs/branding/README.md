# 브랜딩 자료 안내

스쿼드 메이커(새 이름 후보 **아이엠 헤드코치**)의 로고, 앱 아이콘, 스플래시, 인트로 모션, 폰트, 색에 관한 모든 자료가 이 폴더에 있다.
디자이너, 개발자, Codex·Claude 세션 누구든 이 문서에서 시작하면 된다.

## 1. 지금 상태 (2026-10-10)

| 단계 | 내용 | 상태 | 다음 할 일 |
|---|---|---|---|
| 현재 운영 앱 (`main`) | 헤더 `SQUAD MAKER` 글자 로고, 파비콘 ⚽, 앱 이름 "스쿼드 메이커 Preview" | 운영 중 | - |
| ① Run Line 브랜딩 | 마크(선수 토큰 + 점선 런 라인 + 화살촉), 앱 아이콘, 2단계 스플래시, 인트로 모션. 2026-10-08 선택 | [PR #47](https://github.com/jaywapp/squad-maker/pull/47) Draft, **`main`과 충돌** | PR #47 충돌 해결·실기기 확인·병합 |
| ② 이름 전환 "아이엠 헤드코치" | Run Line 위 워드마크·앱 이름만 한글로. 2026-10-10 A안(최소 변경) 선택 | 인계 패키지 준비 완료, **국내 상표 확인 대기** | 상표 확인 → ①이 병합된 뒤 적용 |

**적용 순서는 반드시 ① → ②다.** ②의 교체표는 ①이 `main`에 들어간 상태를 기준으로 쓰였다.

## 2. 무엇을 하려는가

| 하려는 일 | 볼 곳 |
|---|---|
| 로고·색·크기 규칙만 빨리 알고 싶다 | [guide.md](guide.md) |
| 앱에 Run Line을 적용(또는 PR #47을 마무리)한다 | [run-line/02-work-request.md](run-line/02-work-request.md) |
| 이름을 "아이엠 헤드코치"로 바꾼다 | [headcoach/02-work-request.md](headcoach/02-work-request.md) |
| Codex에 작업을 맡긴다 | ① [run-line/03-goal-prompt.md](run-line/03-goal-prompt.md), ② [headcoach/03-goal-prompt.md](headcoach/03-goal-prompt.md) |
| 로고 PNG·SVG 파일이 필요하다 | [guide.md §5 파일 고르기](guide.md#5-파일-고르기) |
| 로고를 다시 만들거나 크기를 추가한다 | [guide.md §7 다시 만들기](guide.md#7-다시-만들기) |
| 폰트 라이선스를 확인한다 | [headcoach/fonts.md](headcoach/fonts.md) |
| 왜 이렇게 정했는지 알고 싶다 | §4 결정 기록 |

## 3. 폴더 구성

```text
docs/branding/
├─ README.md          이 문서 (현황과 진입점)
├─ guide.md           브랜드 사용 가이드 (색, 마크, 워드마크, 크기, 금지 사항, 파일 고르기, 다시 만들기)
├─ run-line/          ① Run Line 패키지 (PR #47 원본의 사본)
│  ├─ README.md, 01-design-spec.md, 02-work-request.md, 03-goal-prompt.md
│  ├─ assets/svg/        마크·가로형 로고·헤더 로고·파비콘·아이콘 SVG (워드마크 SQUAD MAKER)
│  ├─ assets/android/res Android 아이콘·스플래시 리소스 (앱 res 폴더와 같은 구조)
│  ├─ assets/web/        헤더·파비콘·인트로 HTML 스니펫
│  ├─ assets/source/     원본 SVG, 인트로 레퍼런스 페이지
│  ├─ assets/preview/    확인용 PNG·GIF
│  └─ tools/             워드마크 아웃라인·SVG·Android XML 생성 도구
└─ headcoach/         ② 아이엠 헤드코치 A안 패키지
   ├─ README.md, 01-design-spec.md, 02-work-request.md, 03-goal-prompt.md, fonts.md
   ├─ assets/svg/        한글 워드마크 헤더·가로형·워드마크, 밝은 바탕용, unchanged/(Run Line 사본)
   ├─ assets/png/        크기별 PNG 1x~3x, 인트로 마지막 화면, unchanged/스토어 아이콘 512
   ├─ assets/web/        헤더·인트로·제목 스니펫
   ├─ assets/preview/    실제 앱 적용 캡처, 인트로 GIF, 아이콘·라벨 실제 크기
   └─ tools/             워드마크 아웃라인·스니펫·PNG 생성, 적용·검증 참고 스크립트
```

## 4. 결정 기록

| 날짜 | 결정 | 기록 |
|---|---|---|
| 2026-10-08 | 브랜드 마크 3안 중 A "런 라인" 선택 | `design/brand-20261008` 브랜치 `docs/ux-concepts/brand-20261008/`, [run-line/README.md](run-line/README.md) |
| 2026-10-08 | Run Line 적용, Preview APK 준비 | PR #47 문서 `docs/brand-run-line-*` (PR #47 브랜치) |
| 2026-10-10 | 한글 이름 "아이엠 헤드코치" 전환 시안 2안 중 A안(최소 변경) 선택 | [분석](../brand-headcoach-20261010-analysis.md), [설계](../brand-headcoach-20261010-design.md), [작업계획](../brand-headcoach-20261010-tasks.md), [A·B 비교 보드](../ux-concepts/brand-headcoach-20261010/index.html) |

결정을 바꾸려면 사용자 확인을 받고, 위 표에 한 줄을 더한다.

## 5. 이 폴더를 고칠 때

- 자산(SVG·PNG·스니펫)은 손으로 고치지 말고 각 패키지 `tools/`로 다시 만든다. 방법은 [guide.md §7](guide.md#7-다시-만들기).
- 상태가 바뀌면(PR #47 병합, 상표 확인, 이름 적용) §1 표를 먼저 고친다.
- 새 브랜드 작업은 `docs/branding/<이름>/` 폴더를 만들고 §1·§3·§4에 연결한다.
- 레포 규칙(`AGENTS.md`)대로 운영 코드를 바꾸는 작업은 `docs/<slug>-analysis/design/tasks.md`를 따로 만든다. 이 폴더는 자료실이고 작업 기록은 그쪽에 둔다.
