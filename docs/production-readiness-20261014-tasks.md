# 정식 출시 준비 작업표

orchestrator=Codex, owner=Codex. 모델은 Codex 계열로 통일하고 파일 소유권을 분리한다.

| 작업 | owner/model/effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|
| R0 최신 상태/보존/격리 | Codex/current/high | 없음 | setup | 로컬 Git metadata만 | main/PR56/clean/중단세션/Actionsfalse | 완료 |
| R1 패키지·버전·서명·출시 정책 결정 | Codex/current/high | R0 | decisions | analysis/design | 사용자 답변 전 적용 금지 | 일부 답변 기록: 지원/대한민국/한국어/16세이상 확정, ID/버전/서명/공개 URL 대기 |
| R2 빌드 분리·광고 설정 안전 장치 | Codex/gpt-6.1-sol/medium | R0, ID 적용은 R1 | build | Android Gradle/manifest/variant 리소스/scripts/build tests | Preview 유지/운영 명시 선택/unsigned builds | 준비 완료, Preview1099 검증/production 승인 전 차단 확인 |
| R3 UMP·native 광고 | Codex/gpt-6.1-sol/medium | R0 | consent | SquadAdsPlugin/새 consent Java/해당 Java tests | 동의 실패/거절/중복/광고 실패 | 구현·독립 리뷰 수정·Gradle Java23 통과, 실기기 미검증 |
| R4 SQ 이전 회귀 | Codex/gpt-6.1-sol/medium | R0 | migration | 새 migration tests/해당 backup 문서 | 독립 저장소 복원·수정·저장·재시작 | desktop/mobile6 통과, 실기기 미검증 |
| R5 web native bridge·개인정보 옵션 | Codex/current/high | R3 인터페이스 | integration | app/platform-native.js/index.html/전용web tests | 기존 설정 디자인·복귀/회전·실패 | unit51·privacy E2E12·합성 시각6 관측/캡처 확인 완료 |
| R6 정책·Data safety·app-ads·서명 준비 | Codex/current/high | R0 | release-docs | 출시 체크리스트/결과 | 실제 코드/SDK와 결정/미확인 분리 | 준비 문서 완료, 사용자 정책/계정/스토어 확인 대기 |
| R7 독립 리뷰·최종 로컬 검증 | Codex/gpt-6.1-sol/high 및 root | R2~R6 | verification | 리뷰 읽기 전용/ignored evidence | fresh unit/web/android/lint/hash | unit173·E2E401+skip1·unsigned APK/AAB·lint0/4 완료; production/기기/운영 미검증 |
| R8 후속 대상·화면·스토어/청소년 보호 점검 | Codex/current/high 및 기존 production_review | R0, 사용자 후속 답변 | audience-review | UI/문구 읽기 전용 및 audience-policy 문서 | 공식 Play/AdMob와 실제 코드 구분 | 읽기 검토 완료, TEEN 보호안 사용자 답변 대기 |
| R9 공개 지원·방침/Data safety 초안 | Codex/current/high | R8 | policy-docs | index.html/README/product-plan 상단/분석·설계·표·체크리스트/새 정책3문서 | 문구/역할/링크·SDK data 대조 | 로컬 작성 완료, 실제 정책 URL/운영 세부 미확인 |
| R10 후속 변경 영향 검증 | Codex/current/medium | R9 | audience-verification | ignored logs/최종 report | fresh unit·영향 E2E·sync/Preview unsigned/lint·hash | 완료: unit173/E2E72/Java23/unsigned/lint0/4/시각6·문서10, 이전 전체401 결과와 구분 |
| R11 사용자 승인 Git 통합 | Codex/current/high 및 기존 production_review 읽기 전용 | R10, 사용자 commit/push/merge 지시 | git-integration | 이번 준비 소스/문서·interest-preview 기존 회귀·PR 설명, ignored 최종 SHA 증거 | 최종 commit unit/full E2E/sync/unsigned/lint·PR/main/Actions 상태 | 진행 중:3096da4 push/DraftPR57, fresh E2E399/skip1/fail2의 옛 개인정보 기대값 수정 후 새commit 재검증. 키/배포/정식 결정 대기는 유지 |

후속 조정자는 Codex다. 기존 production_review는 문구/코드 읽기 전용, production_consent는 실제 SDK API 읽기 전용이며 root만 UI와 정책 문서를 수정한다. 새 모델/세션을 만들거나 같은 파일을 동시 수정하지 않는다. 네이티브 보호안은 사용자 답변 의존이므로 구현 차단 상태다. 이번 추가 문구는 기존 디자인 유지 범위이며 새로운 시안/재설계가 아니다. R11은 후속 Git 승인에 따라 실행하며 이전 원격 작업 금지 기록에 우선한다. 완료 SHA/커밋 기준 결과는 PR에 기록하여 추가 문서 커밋으로 versionCode가 다시 바뀌는 반복을 피한다.

R2/R3/R4는 서로 다른 파일만 수정한다. R5는 R3의 bridge 계약을 고정한 뒤 root가 담당한다. R1 미답변 사항은 차단 상태로 남기며 R2의 결정과 무관한 부분은 진행한다. CI·원격push·PR·공개배포·기기설치는 모든 작업에서 금지한다.

실제 실행 기준·경고·서버 종료·산출물과 해시는 [최종 보고](production-readiness-20261014-report.md), `.work/production-readiness-20261014/verification.json`을 따른다. 중간 helper 인수/비동기 테스트 대기 오류는 수정 후 재실행했고 최종 성공 결과와 섞지 않는다. 단계별 모델을 나눈 이유는 빌드/native/이전의 독립 구현을 medium에, 정책·통합·독립 리뷰를 high에 배정하기 위해서다.
