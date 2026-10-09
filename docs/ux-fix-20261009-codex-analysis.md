# UX 개선 Codex 인계 분석

orchestrator: Codex. 원본 [분석](ux-fix-20261009-analysis.md)·[설계](ux-fix-20261009-design.md)·[작업지시](ux-fix-20261009-tasks.md)의 Q1~Q5 확정 사항을 이어받는다. 2026-10-09 사용자가 "모든 작업은 너가 진행", 필요시 서브에이전트 사용을 직접 지시하여 구현·검증·콘셉트를 Codex에 인계했다. 원본 Claude 계획은 작성 당시 기록으로 보존하고 이 별도 계획을 사용한다.

## 기준과 범위

전용 작업 트리 `D:/station/.worktrees/squad-maker-ux-fix-20261009`, branch `fix/ux-fix-20261009`, 기준 최신 origin/main `c165c0b60737f080cc6c9dced0a90b41b19e2115`(UX 문서 PR49 병합)다. 원본 docs 브랜치의 `.ux-review/`, 광고 트리의 기존12개 변경, Run Line 트리의 기존3개 변경과 PR47을 보존한다. 4318은 Run Line PR47/e67e61d 서버이므로 이번 main 기준 QA에 사용하지 않는다.

1단계 F-01~07과 2단계 P2-01~04를 구현·검증한다. 2단계는 Q1에서 콘셉트 절차가 면제되었다. 3단계는 서로 다른 실행 가능한 콘셉트3종, 네 뷰포트 검증 및 제시까지 만들고 사용자 선택 전에 운영 HTML에 반영하지 않는다. 기존 A 토큰·컴포넌트와 파비콘을 유지한다. 확인창은 위험 톤/취소 초기 포커스다. 스토리지 v2·스냅샷 형식·분석 이벤트·native 코드·의존성·기존 서명/배포 설정은 변경하지 않는다.

## 실행 및 승인 경계

각 단계의 구현/검증은 로컬 feature branch에서 진행한다. 단계1·2를 별도 로컬 커밋으로 남기고 phase1 main 병합을 기다리지 않고 같은 브랜치에서 phase2를 진행한다. 문서의 PR 분리는 권장안이며, main 병합으로 중간 APK를 게시하지 않기 위한 순서다. push·PR은 원본 지시서의 확인 단계에서 구체적 결과와 함께 요청하고, main 병합은 Q5대로 사용자가 한다. APK 생성·설치·Release를 이번 웹 작업의 검증으로 실행하지 않는다.

## 완료 기준

새 작업 트리의 unit/desktop/mobile 기준선 → 구현 → 같은 테스트 회귀를 실제 실행한다. 기존 통과 테스트의 의미를 보존하고 추가 regression은 별도 수로 기록한다. shared index 편집과 실제 브라우저/메모리 사용은 순차다. 이슈별 같은 Repro/viewport·대비/좌표/포커스·console·모바일 touch·Lighthouse·실제 GIF 프레임 증거를 새 evidence 디렉터리에 남긴다. 저장·취소·재시작의 데이터 보호를 회귀 검사한다. 상태를 Resolved/Remaining/Deferred로 기록하고 미검증 항목을 완료로 표시하지 않는다.
