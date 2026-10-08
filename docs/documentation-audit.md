# 문서 분류·이동·검증 기록

- 기준일: 2026-10-07 · orchestrator: Codex
- 기준 main: `e5877ddf198aaf54082d535a8c1894c346984973`
- [문서 안내](README.md) · [상품 기획](product-plan.md) · [작업 기록](squad-product-20261007-tasks.md)
- 작업 시작의 recursive Git tree 응답은 `truncated=false`. 문서·시안 자산을 전수 분류했다.
- 최신 원격 커밋·Draft PR URL은 이 변경의 PR metadata에서 확인한다. 문서 안에 자기 커밋 SHA를 선행 작성하지 않는다.

## 1. 통합한 내용과 보관 이유

최신 상품 기획에는 사용자·문제·Android 단계·화면·실패/취소/되돌리기·A 시각 원칙·저장/이전·슬롯/구매·광고/개인정보·라이선스/지원·출시 기준·의존성·미정 목록을 통합했다. README의 오래된 작업 현황과 중복 상세는 현재 웹 참고 및 이력으로 분리했다.

과거 계정/클라우드 우선·Pro/Club 구독·가격·기간·광고 삽입 제안은 최신 방향과 다르므로 보관한다. 안전성·호환성·개인정보 보호 원칙은 계속 참고한다. B/C는 선택되지 않았다. A 원본과 현재 개선 제안을 별도 문서에 나눠 실제 구현 완료로 오해하지 않게 했다.

원본 리뷰·테스트 증거·캡처는 삭제하지 않는다. 링크가 실제 이동을 따라가도록 필요한 상대 경로만 갱신하고, 과거 계획 문서에는 이력 안내를 붙였다. 증거 내용에 새 실행 결과를 덧씌우지 않는다.

## 2. 기존 Markdown 전수 분류

| 원래 경로 | 분류/근거 | 최종 위치 |
|---|---|---|
| `AGENTS.md` | 작업 지침·변경 없음 | [AGENTS.md](../AGENTS.md) |
| `CLAUDE.md` | 작업 지침·변경 없음 | [CLAUDE.md](../CLAUDE.md) |
| `README.md` | 진입점 갱신·중복 기획/운영 설명 분리 | [README.md](../README.md) |
| `docs/2026-07-18-monetization-strategy-feedback.md` | 과거 기획·미채택 가격/상품/광고 가설 보관 | [archive/legacy-planning/2026-07-18-monetization-strategy-feedback.md](archive/legacy-planning/2026-07-18-monetization-strategy-feedback.md) |
| `docs/2026-07-18-monetization-strategy.md` | 과거 기획·미채택 가격/상품/광고 가설 보관 | [archive/legacy-planning/2026-07-18-monetization-strategy.md](archive/legacy-planning/2026-07-18-monetization-strategy.md) |
| `docs/2026-07-18-ui-ux-review.md` | 원본 리뷰/테스트 증거 보관·내용 동일 | [archive/legacy-planning/2026-07-18-ui-ux-review.md](archive/legacy-planning/2026-07-18-ui-ux-review.md) |
| `docs/2026-07-20-monetization-implementation-plan.md` | 과거 기획·미채택 가격/상품/광고 가설 보관 | [archive/legacy-planning/2026-07-20-monetization-implementation-plan.md](archive/legacy-planning/2026-07-20-monetization-implementation-plan.md) |
| `docs/2026-07-20-monetization-stage0-review-fixes.md` | 원본 리뷰/테스트 증거 보관·내용 동일 | [archive/legacy-planning/2026-07-20-monetization-stage0-review-fixes.md](archive/legacy-planning/2026-07-20-monetization-stage0-review-fixes.md) |
| `docs/2026-07-20-monetization-stage0-worklog-feedback.md` | 원본 리뷰/테스트 증거 보관·내용 동일 | [archive/legacy-planning/2026-07-20-monetization-stage0-worklog-feedback.md](archive/legacy-planning/2026-07-20-monetization-stage0-worklog-feedback.md) |
| `docs/2026-07-20-monetization-stage0-worklog.md` | 원본 리뷰/테스트 증거 보관·내용 동일 | [archive/legacy-planning/2026-07-20-monetization-stage0-worklog.md](archive/legacy-planning/2026-07-20-monetization-stage0-worklog.md) |
| `docs/2026-07-21-beta-readiness.md` | 과거 기획·미채택 가격/상품/광고 가설 보관 | [archive/legacy-planning/2026-07-21-beta-readiness.md](archive/legacy-planning/2026-07-21-beta-readiness.md) |
| `docs/2026-07-21-user-guide.md` | 과거 기획·미채택 가격/상품/광고 가설 보관 | [archive/legacy-planning/2026-07-21-user-guide.md](archive/legacy-planning/2026-07-21-user-guide.md) |
| `docs/2026-10-07-ux-ui-independent-review.md` | 원본 증거·변경 없음 | [2026-10-07-ux-ui-independent-review.md](2026-10-07-ux-ui-independent-review.md) |
| `docs/README.md` | 진입점 갱신·중복 기획/운영 설명 분리 | [README.md](README.md) |
| `docs/ad-placement.md` | 과거 기획·미채택 가격/상품/광고 가설 보관 | [archive/legacy-planning/ad-placement.md](archive/legacy-planning/ad-placement.md) |
| `docs/adr/0001-analytics-provider.md` | 웹 구현 참고 유지·이력 안내와 이동 링크만 갱신 | [adr/0001-analytics-provider.md](adr/0001-analytics-provider.md) |
| `docs/analytics-event-dictionary.md` | 웹 구현 참고 유지·이력 안내와 이동 링크만 갱신 | [analytics-event-dictionary.md](analytics-event-dictionary.md) |
| `docs/research/coach-interview-script.md` | 과거 기획·미채택 가격/상품/광고 가설 보관 | [archive/legacy-planning/research/coach-interview-script.md](archive/legacy-planning/research/coach-interview-script.md) |
| `docs/runtime-resilience-20260909-analysis.md` | 현재 운영/완료 검증 참고·변경 없음 | [runtime-resilience-20260909-analysis.md](runtime-resilience-20260909-analysis.md) |
| `docs/runtime-resilience-20260909-design.md` | 현재 운영/완료 검증 참고·변경 없음 | [runtime-resilience-20260909-design.md](runtime-resilience-20260909-design.md) |
| `docs/runtime-resilience-20260909-tasks.md` | 현재 운영/완료 검증 참고·변경 없음 | [runtime-resilience-20260909-tasks.md](runtime-resilience-20260909-tasks.md) |
| `docs/superpowers/plans/2026-07-18-responsive-ux-overhaul.md` | 과거 기획·미채택 가격/상품/광고 가설 보관 | [archive/legacy-planning/superpowers/plans/2026-07-18-responsive-ux-overhaul.md](archive/legacy-planning/superpowers/plans/2026-07-18-responsive-ux-overhaul.md) |
| `docs/superpowers/specs/2026-07-18-multi-step-tactical-patterns-design.md` | 과거 기획·미채택 가격/상품/광고 가설 보관 | [archive/legacy-planning/superpowers/specs/2026-07-18-multi-step-tactical-patterns-design.md](archive/legacy-planning/superpowers/specs/2026-07-18-multi-step-tactical-patterns-design.md) |
| `docs/superpowers/specs/2026-07-18-responsive-ux-overhaul-design.md` | 과거 기획·미채택 가격/상품/광고 가설 보관 | [archive/legacy-planning/superpowers/specs/2026-07-18-responsive-ux-overhaul-design.md](archive/legacy-planning/superpowers/specs/2026-07-18-responsive-ux-overhaul-design.md) |
| `docs/ux-redesign-20261007-analysis.md` | 선택 전 계획/비교 이력 보관·현재 A 선택 안내 | [archive/ux-redesign-20261007/ux-redesign-20261007-analysis.md](archive/ux-redesign-20261007/ux-redesign-20261007-analysis.md) |
| `docs/ux-redesign-20261007-design.md` | 선택 전 계획/비교 이력 보관·현재 A 선택 안내 | [archive/ux-redesign-20261007/ux-redesign-20261007-design.md](archive/ux-redesign-20261007/ux-redesign-20261007-design.md) |
| `docs/ux-redesign-20261007-tasks.md` | 선택 전 계획/비교 이력 보관·현재 A 선택 안내 | [archive/ux-redesign-20261007/ux-redesign-20261007-tasks.md](archive/ux-redesign-20261007/ux-redesign-20261007-tasks.md) |
| `docs/ux-redesign-20261007/claude/README.md` | 선택 전 계획/비교 이력 보관·현재 A 선택 안내 | [archive/ux-redesign-20261007/claude/README.md](archive/ux-redesign-20261007/claude/README.md) |
| `docs/workspace-environment-setup-analysis.md` | 현재 운영/완료 검증 참고·변경 없음 | [workspace-environment-setup-analysis.md](workspace-environment-setup-analysis.md) |
| `docs/workspace-environment-setup-design.md` | 현재 운영/완료 검증 참고·변경 없음 | [workspace-environment-setup-design.md](workspace-environment-setup-design.md) |
| `docs/workspace-environment-setup-tasks.md` | 현재 운영/완료 검증 참고·변경 없음 | [workspace-environment-setup-tasks.md](workspace-environment-setup-tasks.md) |
| `tests/vendor/README.md` | 테스트 라이선스·원본 안내 보존 | [tests/vendor/README.md](../tests/vendor/README.md) |

## 3. 시안 자산 이동

HTML 데모·공통 데이터·PNG는 문서 시안 자산이다. 운영 루트 index.html은 이동·편집하지 않는다. 선택 A·B·C 데모와 18개 PNG는 같은 blob SHA를 재사용했다. 이전 비교 페이지만 현재 선택 안내와 이동한 A 참조를 갱신했다.

| 원래 경로 | 최종 위치 |
|---|---|
| `docs/ux-redesign-20261007/claude/concept-01/index.html` | [design-a/prototype.html](design-a/prototype.html) |
| `docs/ux-redesign-20261007/claude/concept-02/index.html` | [archive/ux-redesign-20261007/claude/concept-02/index.html](archive/ux-redesign-20261007/claude/concept-02/index.html) |
| `docs/ux-redesign-20261007/claude/concept-03/index.html` | [archive/ux-redesign-20261007/claude/concept-03/index.html](archive/ux-redesign-20261007/claude/concept-03/index.html) |
| `docs/ux-redesign-20261007/claude/index.html` | [archive/ux-redesign-20261007/claude/index.html](archive/ux-redesign-20261007/claude/index.html) |
| `docs/ux-redesign-20261007/claude/screenshots/a-d-select.png` | [design-a/screenshots/a-d-select.png](design-a/screenshots/a-d-select.png) |
| `docs/ux-redesign-20261007/claude/screenshots/a-d-share.png` | [design-a/screenshots/a-d-share.png](design-a/screenshots/a-d-share.png) |
| `docs/ux-redesign-20261007/claude/screenshots/a-d-tactic.png` | [design-a/screenshots/a-d-tactic.png](design-a/screenshots/a-d-tactic.png) |
| `docs/ux-redesign-20261007/claude/screenshots/a-m-select.png` | [design-a/screenshots/a-m-select.png](design-a/screenshots/a-m-select.png) |
| `docs/ux-redesign-20261007/claude/screenshots/a-m-share.png` | [design-a/screenshots/a-m-share.png](design-a/screenshots/a-m-share.png) |
| `docs/ux-redesign-20261007/claude/screenshots/a-m-tactic.png` | [design-a/screenshots/a-m-tactic.png](design-a/screenshots/a-m-tactic.png) |
| `docs/ux-redesign-20261007/claude/screenshots/b-d-select.png` | [archive/ux-redesign-20261007/claude/screenshots/b-d-select.png](archive/ux-redesign-20261007/claude/screenshots/b-d-select.png) |
| `docs/ux-redesign-20261007/claude/screenshots/b-d-share.png` | [archive/ux-redesign-20261007/claude/screenshots/b-d-share.png](archive/ux-redesign-20261007/claude/screenshots/b-d-share.png) |
| `docs/ux-redesign-20261007/claude/screenshots/b-d-tactic.png` | [archive/ux-redesign-20261007/claude/screenshots/b-d-tactic.png](archive/ux-redesign-20261007/claude/screenshots/b-d-tactic.png) |
| `docs/ux-redesign-20261007/claude/screenshots/b-m-select.png` | [archive/ux-redesign-20261007/claude/screenshots/b-m-select.png](archive/ux-redesign-20261007/claude/screenshots/b-m-select.png) |
| `docs/ux-redesign-20261007/claude/screenshots/b-m-share.png` | [archive/ux-redesign-20261007/claude/screenshots/b-m-share.png](archive/ux-redesign-20261007/claude/screenshots/b-m-share.png) |
| `docs/ux-redesign-20261007/claude/screenshots/b-m-tactic.png` | [archive/ux-redesign-20261007/claude/screenshots/b-m-tactic.png](archive/ux-redesign-20261007/claude/screenshots/b-m-tactic.png) |
| `docs/ux-redesign-20261007/claude/screenshots/c-d-select.png` | [archive/ux-redesign-20261007/claude/screenshots/c-d-select.png](archive/ux-redesign-20261007/claude/screenshots/c-d-select.png) |
| `docs/ux-redesign-20261007/claude/screenshots/c-d-share.png` | [archive/ux-redesign-20261007/claude/screenshots/c-d-share.png](archive/ux-redesign-20261007/claude/screenshots/c-d-share.png) |
| `docs/ux-redesign-20261007/claude/screenshots/c-d-tactic.png` | [archive/ux-redesign-20261007/claude/screenshots/c-d-tactic.png](archive/ux-redesign-20261007/claude/screenshots/c-d-tactic.png) |
| `docs/ux-redesign-20261007/claude/screenshots/c-m-select.png` | [archive/ux-redesign-20261007/claude/screenshots/c-m-select.png](archive/ux-redesign-20261007/claude/screenshots/c-m-select.png) |
| `docs/ux-redesign-20261007/claude/screenshots/c-m-share.png` | [archive/ux-redesign-20261007/claude/screenshots/c-m-share.png](archive/ux-redesign-20261007/claude/screenshots/c-m-share.png) |
| `docs/ux-redesign-20261007/claude/screenshots/c-m-tactic.png` | [archive/ux-redesign-20261007/claude/screenshots/c-m-tactic.png](archive/ux-redesign-20261007/claude/screenshots/c-m-tactic.png) |
| `docs/ux-redesign-20261007/claude/shared/state.js` | [archive/ux-redesign-20261007/claude/shared/state.js](archive/ux-redesign-20261007/claude/shared/state.js) |

원본에서 코드 블록·문장으로 설명한 당시 파일 위치/실행 예시는 이력 문맥이다. 활성 클릭 링크·이미지·HTML 자원 참조는 최종 트리에 맞췄다. 현재 A 실행은 [A 자료 안내](design-a/README.md)를 따른다.

## 4. 신규/갱신 문서

| 파일 | 이유 |
|---|---|
| [product-plan.md](product-plan.md) | 현재 사용자 결정 중심의 상세 상품 기획 |
| [분석](squad-product-20261007-analysis.md) | 범위·권한·근거·sandbox 제한 |
| [설계](squad-product-20261007-design.md) | 데이터/상태/이전/화면 계약 제안 |
| [작업 계획](squad-product-20261007-tasks.md) | 의존성·미정 결정·검증·상태 |
| [A 자료](design-a/README.md) | 실제 캡처와 예정 개선 구분 |
| [현재 웹 참고](current-web-reference.md) | 운영 기능·실행·회귀 검증 참고 통합 |
| [보관 안내](archive/README.md) | 미채택 시안·과거 가격/상품 가설 안내 |
| [루트 README](../README.md), [문서 README](README.md) | 최신 진입점 연결 |
| 이 정리 기록 | 모든 기존 문서와 이동·검증 추적 |

## 5. 정적 검증 결과

- 검사 대상: 전체 Markdown 및 문서 HTML의 정적 상대 링크·이미지 src/href·CSS url, 파일 경로와 정적 앵커.
- 결과: **검사 파일 44개 / 내부 참조 246건 / 깨진 경로·앵커 0건**.
- 시안 A의 `href="#i-"`는 JS 문자열로 아이콘 ID를 합성하는 동적 참조 1건으로 따로 확인. 정적 누락으로 계산하지 않음.
- 원격 전체 트리의 파일 존재 여부와 Markdown heading/HTML id를 비교. 외부 URL은 내부 링크 검사에서 제외. 신규 스토어 정책의 공식 자료는 별도 열람했으며 과거 외부 URL 전체의 가용성을 보증하지 않음.
- A/B/C 원본 데모 3개·PNG 18개·공통 state.js: 이동 전후 blob SHA 동일.
- 독립 UX 검토와 과거 원본 테스트/리뷰 증거: 내용 SHA 동일.
- 보호 경로: README를 제외한 모든 비-docs 파일의 경로·blob SHA 동일. AGENTS.md·CLAUDE.md·운영 index.html·api·tests/vendor·fixtures·package/lockfile·배포/운영 설정 포함.
- 제거된 기존 경로 41개는 모두 새 경로의 보관/선택 자료로 대응. 영구 제거만 된 자료 0건.
- GitHub 원격 커밋 tree를 재읽어 게시 내용과 비교하고 PR diff에서 문서/시안 외 변경 여부를 확인.

## 6. 실행 제한과 미정 항목

로컬 shell 실행은 Windows sandbox 초기화 접근 오류로 시작하지 못했다. 로컬 브랜치·미커밋 변경과 로컬에만 있는 .agents/skills는 확인 불가이며 변경하지 않았다. 권한 우회·시스템 설정 변경 없이 GitHub 커넥터로 원격 main 기반 전용 브랜치·Git objects·PR을 사용했다. 원격 트리에 .agents/skills가 없는 것을 확인했다.

새 브라우저 렌더링·npm test·실제 Android·광고/결제 실행은 하지 않았다. 이번 검증은 문서 참조·자산 동일성·변경 범위이며 앱 기능 수정/출시 완료를 뜻하지 않는다. 실제 Android 재현·데이터 보호 구현은 별도 후속 작업이다.

슬롯 단위·무료량·확장량·가격·구매 시점·Android 기술과 나머지 결정은 [기획서의 결정 목록](product-plan.md#14-사용자-결정-목록)에 있다. 사용자 A 선택을 다시 대기 상태로 만들지 않는다. main 병합·배포는 수행하지 않는다.
