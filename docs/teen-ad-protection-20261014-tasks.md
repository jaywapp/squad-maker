# 청소년 광고 보호 작업표

orchestrator=Codex. 기존 미커밋 identity 변경을 보존한다.

| 작업 | owner/model/effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|
| P0 승인 범위·기존 산출물 보존 | Codex/current/high | 없음 | setup | 새 docs, ignored artifacts | 기존 hash 대조 | 완료 |
| P1 SDK/우선순위 설계 읽기 검토 | Codex/current/high | P0 | review | 파일 변경 없음 | 공식 문서·실제 SDK API | 완료, 구현 후 독립 리뷰도 지적 없음 |
| P2 보호 설정·운영 gate 구현 | Codex/current/high | P0 | implementation | ConsentRequestConfiguration/ConsentAdPolicy/SquadAdsPlugin, Gradle policy, tests | 실제 객체·mock·정책 matrix | 완료 |
| P3 unsigned 재검증 | Codex/current/high | P1,P2 | verification | ignored evidence | node unit/Java/lint/4 artifacts/서명·ID | 완료: node173, Java각29, lint각0/4, 네 unsigned test artifacts, 실제 운영 gate 예상실패 |
| P4 결과·남은 결정 인계 | Codex/current/high | P3 | report | docs/teen-ad-protection-20261014-*.md 및 인덱스 | 기존 결과와 구분 | 완료 |

P1은 읽기 전용으로 P2와 병렬이며 파일/빌드는 root만 수행한다. 원격/서명/설치/운영 광고는 실행하지 않는다.
