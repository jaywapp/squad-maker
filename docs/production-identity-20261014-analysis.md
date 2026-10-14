# 승인된 정식 앱 식별자 적용 분석

2026-10-14. orchestrator=Codex. PR #57 merge `9e41887532f59606d87924346dcbc4957446a098` 기준의 격리 로컬 후속 작업이다. 검증 head `db2db0dcfc4f4663166ed0e864ed36910c07ad28`와 merge의 파일 차이는 없다.

## 확인된 승인과 범위

- 사용자 승인: 정식 `com.jaywapp.iamheadcoach`, 표시명 `아이엠 헤드코치`, 첫 versionCode `1`, versionName `1.0.0`.
- 서명 전략: Google 관리 Play App Signing + 별도 업로드 키. 실제 키 생성·서명은 별도 승인 전 실행하지 않는다.
- 공개 지원 `blueheart.dev@gmail.com`, 대한민국·한국어 첫 출시, 실제 16세 이상 대상은 기존 결정이다.
- 이번 요청은 identity 게이트 반영, 정식 unsigned APK/AAB와 Preview 광고 격리 검증, 문서화다. 원격 commit/push/PR/merge, CI 재활성화, 배포, Play 제출, 설치, 기존 자료 삭제는 범위 밖이다.
- UMP·Preview/production 분리는 PR #57 구현을 그대로 사용한다. 청소년 TEEN/비개인화/G 보호, UMP underAge 설정, 정책 URL/운영자 정보는 미결정이다. 해당 결정을 대신하는 false 입력으로 운영 광고 게이트를 통과하지 않는다.

## 작업 상태와 보존

원본 `D:\station\repos\squad-maker`는 main `27a34ca`, `.ux-review/` untracked 상태이며 수정하지 않았다. 새로운 작업 경로는 `D:\station\.worktrees\iam-headcoach-production-identity-20261014`, 브랜치는 `feat/production-identity-20261014`다. 기존 production-readiness 워크트리도 수정하지 않는다.

## 완료 기준

승인 identity를 단일 정책에 반영하고 실제 Groovy 검사를 갱신한다. 기본 test ads 정식 release APK/AAB 및 Preview release APK를 생성해 이름·패키지·버전·샘플 AdMob ID·운영 ID 부재·unsigned 상태를 확인한다. 운영 ID의 소스 정확성과 실제 운영 산출물 미검증을 분리한다. 청소년 정책 권고는 공식 문서/설치된 SDK와 대조하고 적용 전 결정을 남긴다.

## 남은 결정

청소년 광고 보호안, UMP TFUA, 공개 정책 URL와 운영자 정보, 업로드 키 생성은 대기한다. 테스트 광고 정식 unsigned 빌드는 이 결정과 독립적으로 진행한다. 실제 수익화·스토어 심사 완료로 보고하지 않는다.
