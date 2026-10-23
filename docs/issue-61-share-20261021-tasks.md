# #59~61 Issue-based 작업표

orchestrator=Codex. 모든 owner=Codex. 공유 파일 충돌을 피하도록 구현 파일을 분리한다. 중대한 추가 설계 변경은 이슈에 기록한다.

| ID | 목표·산출물 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| A | main/이슈/로컬 변경 확인·#59 질문 | Codex | gpt-6.1-sol | high | 없음 | A | 분석·설계 문서 | 원격 SHA/댓글·기존 worktree 읽기 | 완료 |
| B | #61 native/JS 공유 광고 거부·지연 요청 무효화 | Codex | gpt-6.1-sol | high | A | B | platform-native.js, SquadAdsPlugin, ExportAdPolicy, 관련 단위 테스트/보조 정책 | JS206·Java57/채널 통과 | 완료 |
| C | #61 편집기 공유 분기와 안내·통합 테스트 | Codex | gpt-6.1-sol | high | A | B | index.html, export E2E, docs | 데스크톱/모바일 공유38 통과 | 완료 |
| D | 통합 검증·독립 리뷰·결과 문서 | Codex | gpt-6.1-sol | high | B,C | C | 결과 보고서 | 전체 E2E455통과+기존skip1, Android unsigned/lint 통과, 리뷰 High 없음 | 완료 |
| E | 커밋·push·PR·이슈 결과 기록 | Codex | gpt-6.1-sol | high | D | D | 이번 변경만 | diff/시크릿 제외/CI 비활성 | 실행 준비 |
| F | #59 면제 범위 확정·#60 저장 이후 광고 | Codex | gpt-6.1-sol | high | 사용자 이슈 답변 | E | 별도 후속 브랜치 | 해당 이슈 완료 조건 | 답변 대기 |

#61의 실제 기기 테스트는 기기/설치 승인·테스트 광고 빌드가 필요하다. 이 증거가 없으면 이슈를 완결/자동 종료하지 않고 로컬 구현 결과와 미검증을 구분한다.

이 표는 커밋 직전 스냅샷이다. E의 실제 완료 SHA·PR URL·최종 커밋 빌드는 이슈 댓글/PR 본문에 기록한다. 미검증 실기기 항목은 Draft PR에 표시하고 자동 종료 연결을 걸지 않는다.
