# PR64 파일 선택창 복귀 작업표

orchestrator=Codex. 기존 승인 범위의 경계 결함 보수이며 새 UI/제품 정책 선택은 없다. 구현은 부모 단독 소유로 순차 진행하고 설계/리뷰는 읽기 전용 에이전트로 분리한다.

| ID | 목표 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| A | 최신 지침/원격/리뷰·상태 확인 | Codex | gpt-6.1-sol | high | 없음 | A | 읽기 전용 | clean·HEAD·Draft·CI중단 | 완료 |
| B | lifecycle 원인·설계 검토 | Codex | gpt-6.1-sol | high | A | B | 읽기 전용, 문서는 부모 | Capacitor·native 흐름 대조 | 완료 |
| C | 실패 재현·native 경계 구현 | Codex | gpt-6.1-sol | high | A,B | C | 부모: receipts/Documents/Ads·Java 테스트 | 의도한 실패1→통과17, 양채널105 | 로컬 완료 |
| D | 웹 회귀/단위·Android bundle/sync/release/lint | Codex | gpt-6.1-sol | high | C,웹은 A | D | 로컬 로그·보고 | JS216/E2E473+skip1/Android성공 | 로컬 완료 |
| E | 독립 최종 리뷰·결과 문서 | Codex | gpt-6.1-sol | high | C,D | E | 읽기 전용 리뷰, 부모 문서 | 중대결함0·보수적skip17번째테스트 | 로컬 완료, 기기 미검증 |
| F | commit/push·PR64·이슈 기록 | Codex | gpt-6.1-sol | high | E | F | 이번 파일만 | 최종 SHA 재빌드·Draft·CI중단 | 진행, 최종상태 PR/이슈 기록 |

웹 소스와 native 파일을 동시에 수정하지 않는다. 기록은 이 작업의 분석/설계/보고 및 원 PR 문서 최신 기준 링크에 추가한다. 실기기 완료 조건은 남긴다.
