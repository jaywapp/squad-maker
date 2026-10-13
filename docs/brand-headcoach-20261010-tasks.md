# 한글 브랜드 '아이엠 헤드코치' 전환 시안 (2026-10-10): 작업계획

- slug: `brand-headcoach-20261010` · [분석](brand-headcoach-20261010-analysis.md) · [설계](brand-headcoach-20261010-design.md)
- orchestrator: Claude. 모든 owner는 Claude. 운영 적용은 이 계획의 T-05 인계 문서를 받아 Codex가 별도 작업 트리에서 orchestrator=Codex인 새 작업계획으로 진행한다.
- 작업 트리: `D:\station\.worktrees\squad-maker-brand-headcoach-20261010`, 브랜치 `design/brand-headcoach-20261010`(기준 `origin/main` 27a34ca).
- 순차 실행 이유: 모든 산출물이 같은 생성 도구와 글꼴 파일, 같은 로컬 브라우저를 쓴다. 메모리가 적은 머신이라 브라우저 작업을 병렬로 돌리지 않는다.

| ID | 작업 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| S-01 | Run Line 자산·사양·실제 앱 화면 확인 | Claude | opus | medium | - | g0 | - | 분석 2장 | done |
| S-02 | 폰트 라이선스 원문 확인(IBM Plex Sans KR, Pretendard) | Claude | opus | low | - | g0 | 분석 4장 | 원문 LICENSE·OFL.txt | done |
| S-03 | A·B 워드마크 아웃라인, 헤더·가로형·두 줄형 SVG | Claude | opus | high | S-01, S-02 | g1 | `ux-concepts/brand-headcoach-20261010/concept-0*/assets/` | 28/32/40/64px 렌더 확인 | done |
| S-04 | 인트로 페이지, 프레임·GIF·필름스트립·마지막 화면 | Claude | opus | medium | S-03 | g1 | `concept-0*/intro.html`, `concept-0*/preview/` | 1.1초 프레임 겹침 없음 | done |
| S-05 | 실제 앱 헤더 적용 캡처(390·1280), 아이콘·파비콘·런처 라벨 실제 크기 | Claude | opus | medium | S-03 | g1 | `concept-0*/preview/`, `shared/`, `baseline/` | 헤더 높이·배치 변화 없음 | done |
| S-06 | 비교 보드와 분석·설계·작업 문서 | Claude | opus | medium | S-04, S-05 | g1 | `index.html`, 이 문서 3종, `docs/README.md` | 보드 1회 렌더 확인 | done |
| T-00 | 사용자 선택과 Q2~Q5 답 기록 | Claude | opus | low | S-06 | g2 | 분석 5장 | 기록 존재 | done (A안, Q2~Q4 기본안, Q5 미확인) |
| T-01 | A안 최종 SVG(헤더, 가로형, 워드마크, 밝은 바탕용)와 웹 스니펫(헤더, 인트로, 메타) | Claude | opus | medium | T-00 | g3 | `docs/branding/headcoach/assets/svg/`, `assets/web/` | PR #47 복사본에 적용해 확인(아래 기록) | done |
| T-02 | PNG: 헤더 28/32, 가로형 48/64, 워드마크 64 각 1x~3x, 밝은 바탕용, 인트로 마지막 화면 1x/3x, 스토어 512(변경 없음 사본) | Claude | opus | medium | T-01 | g3 | `docs/branding/headcoach/assets/png/` | 픽셀 크기 목록, 어두운·밝은 바탕 합성 확인 | done |
| T-03 | 사양서(색상값·크기 규칙·모션 변경분·금지 사항) | Claude | opus | medium | T-01 | g3 | `docs/branding/headcoach/01-design-spec.md` | 설계 문서와 일치 | done |
| T-04 | 폰트 정보와 고지 문구 | Claude | opus | low | T-00 | g3 | `docs/branding/headcoach/fonts.md` | 분석 4장과 일치 | done |
| T-05 | Codex 인계: 교체표, 작업 절차, 검증, 목표 프롬프트, README | Claude | opus | high | T-01~T-04 | g3 | `docs/branding/headcoach/02-work-request.md`, `03-goal-prompt.md`, `README.md` | 교체표 경로·줄 번호를 PR #47 head(e67e61d)에서 확인 | done |

## 기존 파일 교체표

확정본은 `docs/branding/headcoach/02-work-request.md` §2다. 아래는 시안 단계의 초안으로, 이력용으로 남긴다.

### 초안

기준은 Run Line(PR #47)이 `main`에 병합된 상태다(분석 Q4 기본안). PR #47 산출물 중 브랜드 이름·워드마크가 들어간 파일만 바뀐다. 마크·아이콘·스플래시 그림은 그대로 둔다.

| 기존 파일 (PR #47 기준) | 처리 | 새 자산 |
|---|---|---|
| `index.html` 좌상단 `h1.wordmark` 안 SVG | 교체 | 고른 안 `logo-header.svg` |
| `index.html` `<title>`, `og:title`, `twitter:title` | 문구 교체 | 분석 Q3 문구 |
| `index.html` 네이티브 인트로 블록(`brand-intro` 스니펫) | 교체 | 고른 안 인트로 스니펫 |
| `index.html` 파비콘·`apple-touch-icon` | 유지 | Run Line 그대로 |
| `capacitor.config.json` `appName` | 문구 교체 | 아이엠 헤드코치 (Preview 표기 정책 확인) |
| `android/app/src/main/res/values/strings.xml` `app_name`, `title_activity_main` | 문구 교체 | 분석 Q2 |
| `android/app/src/main/res/mipmap-*/ic_launcher*.png`, `drawable/ic_launcher_*.xml`, `values/ic_launcher_background.xml` | 유지 | 이름이 없는 아이콘이라 그대로 |
| `android/app/src/main/res/drawable*/splash.png`, `values/styles.xml`, `values/colors_brand.xml` | 유지 | 시스템 스플래시는 배경색만 |
| `work/tasks/branding/assets/svg/logo-horizontal.svg`, `logo-header.svg` (PR #47, 사본 `docs/branding/run-line/`) | 보존(이력) | 새 자산은 `docs/branding/headcoach/`에 따로 둔다 |
| `tests/e2e/brand-intro.spec.js`, `tests/e2e/guest-free-regression.spec.js`의 이름·라벨 확인 | 기대값 교체 | 새 이름 |
| 패키지 ID, 저장 키, `.sq` 형식 | 유지 | 바꾸지 않음 |

## 실행 기록

- 2026-10-10: S-01~S-06 완료. 시안은 커밋하지 않았다(사용자 요청 범위가 시안까지).
- 2026-10-10: 사용자 A안 선택. T-00~T-05 완료.
  - 모델: 사양·자산·교체표가 한 맥락에 이어져 있어 서브에이전트 없이 부모 세션(opus)이 직접 수행했다.
  - 사전 적용 검증: PR #47 head(e67e61d)의 `index.html`·`app/` 복사본(저장소 밖)에 헤더·인트로·메타 스니펫을 적용했다. 390px 헤더 28px·폭 116px, 1280px 32px·133px, 가로 넘침 없음, 웹에서 인트로 없음, 네이티브 흉내에서 인트로 표시 후 약 2.3초에 닫힘, 동작 줄이기 0.8초에 닫힘, 콘솔 오류 0.
  - 발견·수정: 헤더 스니펫 주석에 `h1` 여는 태그 글자가 있어, 표식 기준 치환 시 주석 조각이 화면에 새어 나오고 모바일 화면 폭이 넓어져 인트로가 화면 밖에 그려졌다. 주석 문구를 고쳐 다시 확인했다. 작업요청서 위험 R2로 남겼다.
  - 실행하지 않은 것: 저장소 단위·E2E 테스트, Android 빌드, 실기기 확인(운영 적용 단계에서 Codex가 수행).
- 생성 환경: Node 22, opentype.js 1.3.4, playwright-core 1.54.1 + 로컬 Chromium 1248, ffmpeg. 글꼴은 분석 4장의 출처에서 받아 저장소 밖에서 사용했다.
