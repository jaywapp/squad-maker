# 정식 식별자 후속 작업표

orchestrator=Codex. 모든 owner는 Codex. 승인된 식별자 적용만 구현한다.

| 작업 | owner/model/effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|
| I0 기준·보존·격리 | Codex/current/high | 없음 | setup | 새 로컬 Git 워크트리 | merge/head tree 동일·기존 상태 | 완료 |
| I1 식별자·정책 회귀 반영 | Codex/current/high | I0 | identity | scripts/production-build-config.gradle, tests/unit/production-build-config.groovy, android/app/build.gradle | 실제 Groovy/Android variant | 완료 |
| I2 청소년 보호 읽기 검토 | Codex/current/high | I0 | policy-readonly | 파일 변경 없음 | 공식 문서·GMA25.5.0 지원 | 완료, 정책 결정은 대기 |
| I3 unsigned 빌드·실물 검사 | Codex/current/high | I1 | build | ignored .work/, android build outputs | unit/Java/lint/APK/AAB/서명·ID | 완료: unit173, Java각23, lint각0/4, APK/AAB4개 unsigned/test, 운영 게이트 예상 차단 |
| I4 문서·결정·결과 통합 | Codex/current/high | I2,I3 | report | docs/production-identity-20261014-*.md, docs/README.md, 기존 결정 문서 안내 | 실제 결과와 차단 분리 | 완료 |

I2는 읽기 전용이라 I1/I3와 충돌하지 않는다. 파일 변경/빌드/통합은 root만 순차 수행한다. 모델은 상속한 Codex current를 유지한다. 키·서명·설치·네트워크 광고·원격 Git 변경·CI·배포는 수행하지 않는다.
