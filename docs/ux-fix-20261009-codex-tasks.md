# UX 개선 Codex 작업계획

orchestrator: Codex. 사용자의 2026-10-09 직접 인계에 따라 모든 owner는 Codex다. 원본 Claude 작업지시의 단계별 목표·재현 절차·Q1~Q5를 유지한다. 구현/브라우저는 shared 파일·메모리 때문에 순차, 독립 사전 리뷰와 콘셉트 파일 작성만 병렬이다. 각 단계에서 실제 검증과 로컬 커밋을 남기고 push/PR 및 콘셉트 선택은 결과가 준비된 뒤 확인한다. main 병합은 사용자만 수행한다.

| ID | orchestrator | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| SETUP | Codex | Codex | gpt-6.1-sol | high | 없음 | setup | 이 계획3개, docs index | 원본 보존·c165c0b 별도WT·Q1~Q5·스킬 | 완료 |
| F-00 | Codex | Codex | gpt-6.1-sol | medium | SETUP | baseline | .work 및 포트 독립 테스트 보완 | npm ci, unit→desktop→mobile workers1 실제 기준선 | 완료 |
| R-00 | Codex | Codex `/root/ux_risk_review` | gpt-6.1-sol | high | SETUP | parallel-read | 읽기만 | 원본 지시·code/contract·test selectors의 구현 위험 검토 | 완료 |
| F-01~F-07 | Codex | Codex `/root/ux_implementation` | gpt-6.1-sol | high | F-00 | implementation-sequential | index.html, 필요한 기존 tests | 원본 F01~07 같은 Repro·데이터 보호 | 완료 |
| V-01/V-02/R-01/H-01 | Codex | Codex | gpt-6.1-sol | high | F-07 | verification-sequential | 신규 regression, evidence, 이슈/실행 기록 | unit→desktop→mobile, bundle·모바일 실측·Lighthouse·독립 리뷰 | 검증 완료, 로컬 checkpoint/PR 확인 준비 |
| P2-01~P2-04 | Codex | Codex | gpt-6.1-sol | high | phase1 검증/로컬 checkpoint | implementation-sequential | index.html, 필요한 기존 tests | 원본 P2 목표, analytics/undo/save/real GIF | 대기 |
| V-03/H-02 | Codex | Codex | gpt-6.1-sol | high | P2-04 | verification-sequential | 신규 regression/evidence/이슈·실행 기록 | 전체 회귀·같은 viewport·독립 리뷰·로컬 checkpoint | 대기 |
| P3-01 | Codex | Codex `/root/ux_concepts` | gpt-6.1-sol | high | SETUP | concepts-independent | docs/ux-concepts/ux-fix-20261009/만 | 세 방향·같은 내용·4 viewport·a11y·실행 가능 | 완료 |
| P3-02 | Codex | Codex | gpt-6.1-sol | high | P3-01 검증 | decision | 분석/계획만 | 실제3종을 제시해 사용자 선택 기록 | 선택 대기 |
| HANDOFF | Codex | Codex | gpt-6.1-sol | medium | V-03, P3 제시 | approval | 로컬 PR 초안/최종보고 | 정확한 SHA·검증·미검증·push/PR 확인·main 미병합 | 대기 |

## 실행 기록

- 시작: latest origin/main c165c0b, `fix/ux-fix-20261009`/별도 WT 생성. 사용자 원본 docs tree의 `.ux-review/`와 기존 광고/브랜딩 변경은 수정하지 않는다.
- 최신 원본 분석에서 Q1(2단계 면제), Q2(3종 제작), Q3(파비콘 유지), Q4(위험), Q5(사람 병합)가 확정됐음을 확인했다. 이를 다시 질문하지 않는다.
- F-00: c165c0b의 운영 코드, npm ci 완료. unit 128/128, Android 웹 bundle 성공. desktop 첫 실행은 기존4317 서버로 시작 실패. 서버를 보존하고 ignored config의4321로 옮긴 후97 통과/Android origin allowlist1실패. 해당 테스트의 허용 origin을 baseURL에서 읽도록 보완한 재실행1통과. mobile97통과/기존GIF-all skip1. 전체 기준선은195통과/skip1이며 최초 실패·재실행 로그 모두 보존한다.
- 기존 skip은 mobile 전체 패턴 GIF 인코딩 시간을 줄이기 위한 것으로 desktop에서 실제 인코딩한다. 코드 오류를 숨기는 skip이 아니다. CLI NO_COLOR/FORCE_COLOR·http-server DEP0066 경고는 기준선 환경 경고다.
- R-00: canvas DPR 논리 배율, 히트 반지름과 시각 반지름 분리, 뷰어 GIF 경로, 제보 재시도/실패 script와 honeypot, native data-r/close 함수, 입력·모달 방향키 충돌과 undo 경계를 독립 검토했다.
- Phase1 최초 구현 index SHA-256 `166ba368f8d430a0a6b8be36541c56b3a30abdfd51f7ebe883c646da3a5d9e44`: unit128, bundle 성공. desktop103통과/3실패. 기존 native-short2가 추가 scrollbar-gutter에 의해 피치/트레이 겹침, 새10색 대비 테스트가 트레이의 색상 버튼으로 연 메뉴의 즉시 닫힘을 검출했다. 독립 리뷰가 완료한 모바일 드래그의 실제 선택과 안내 불일치를 찾았다. 실패 로그를 보존하고 코드 보완 후 영향 검증을 다시 실행한다. 이 수치는 최종 통과로 사용하지 않는다.
- P3-01: 코드·콘셉트의 JS 정적 검사, 독립 리뷰,12뷰포트 첫 확인→단일 보정 배치→12뷰포트 확인을 완료했다. 최종 `evidence/codex-20261009/concepts/confirmation`에서 overflow0·44px미만0·console0·모달Esc/포커스복귀·이름카운터·GK변경색PNG반영 통과. 가로 피치 하단 C1=385/C2=387/C3=386px(높이390). Lighthouse13.4.1 mobile 접근성3종100. PNG대표3개 생성/직접 시각 확인. 오프라인 캡처는 폰트 폴백, 실기기·운영 데이터·실제 공유는 미검증이다.
- P3-02: 갤러리 `http://127.0.0.1:4320/index.html`와 구조별 실행 페이지를 제시하고 사용자 선택 질문을 요청했다. 선택 전 운영 구조 변경은 하지 않는다.
- Phase1 최종 index SHA-256 `4944ad97b65b7a0579ea1df754a15664552c91bc97ad632c6becf625730f7c58`: unit128, bundle 성공, desktop107, mobile106/기존skip1. 기준선195회 유지+새UX9개×2프로젝트=18회 추가다. 동일한 코드로 순차 전체 재실행했다.
- 1280/1366/768/390(DPR3/touch) 실제 캡처·실측, Lighthouse mobile100/label mismatch 통과, 실제 저장 완료 칩과 역할 태그 대비 측정 완료. detector 잔여 text-occlusion은1px/clip0 aria-live 알림 오탐으로 확인했고 기존 디자인 advisory·3단계 긴 설정 열은 보존했다. 자세한 실행/실패/제약은 [검증 기록](ux-fix-20261009-codex-report.md)에 있다.
