# 코치 사용성 수정 작업

orchestrator: Codex. 동일 운영 파일 `index.html`은 부모만 수정한다. 테스트 파일은 독립 에이전트에 배정해 충돌을 방지한다.

| ID | 목표 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| F1 | 분석·설계·범위 기록 | Codex | gpt-6.1-sol | high | 없음 | 준비 | docs/coach-fixes-20261013-*.md | 승인 범위와 일치 | 완료 |
| F2 | 6개 오류 구현 | Codex | gpt-6.1-sol | high | F1 | 구현 | index.html | 직접 재현·회귀 | 완료 |
| F3 | 독립 회귀 테스트 | Codex | gpt-6.1-sol | high | F1 | 구현 | tests/e2e/coach-fixes-20261013.spec.js | 6개 오류·호환성, 28/28 통과 | 완료 |
| F4 | 저장·복원·재생 검토 | Codex | gpt-6.1-sol | high | F2 | 검증 | 읽기 전용 | diff 독립 검토, P1/P2 발견 없음 | 완료 |
| F5 | 통합 검사·화면 재검증·결과 | Codex | gpt-6.1-sol | high | F2,F3,F4 | 완료 | docs/coach-review-20261013, docs/coach-fixes-20261013-*.md, 관련 E2E 5개, tests/helpers/pattern-start.js | 단위 161, E2E 고유 149 통과·1 생략, 번들·브라우저 | 완료 |
| F6 | 후속 Git 승인 기록·병합 준비 | Codex | gpt-6.1-sol | medium | F5 | 순차 통합 | docs/coach-fixes-20261013-*.md, PR #54 | 작업본·원격 HEAD·main 기준·CI 상태 확인 | 완료 |

데이터 호환성 및 시간축 변경이 있어 높은 추론 수준을 사용한다. 운영 파일의 여러 영역을 동시에 고치지 않고 부모가 순차 통합한다. 최초 수정 단계에서는 커밋·push·PR·배포를 하지 않았다. 2026-10-13 후속 요청으로 커밋·push·병합이 승인되어 기존 PR #54를 main 대상으로 통합한다. Git 작업은 순차 의존이므로 부모가 처리한다. 원격 최종 상태는 [PR #54](https://github.com/jaywapp/squad-maker/pull/54)에서 확인한다. 배포와 CI 재활성화는 수행하지 않는다.

F3은 `/root/coach_fix_tests`, F4는 `/root/coach_fixes_review`가 수행했다. F5에서 부모가 테스트 원문·실행 결과와 브라우저 화면을 확인했다. 기존 기대값은 선택적 시작 배치·공유 장면·일시정지 문구·명시적 재시작 버튼에 맞췄으며 원본 v1 fixture는 보존했다. 발견한 불필요 자동저장 제거 후 관련 82개를 재검증했다.
