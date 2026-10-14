# 커밋·검증·병합과 수동 배포 준비 설계

## Git 흐름

identity 원본의21파일은 검증된 사본 내용으로 index에 담아 `feat(android): apply production identity and teen ad protections` commit으로 남긴다. index는 처음 비어 있음을 확인한다. SDK 한 줄/README 새 인덱스처럼 겹치는 파일은 원본 blob을 첫 commit에 넣고 현재 작업 파일의 나머지를 두 번째 Play update commit에 넣는다. 원본 worktree의 파일·index·branch는 건드리지 않는다.

두 번째 commit은 flexible 업데이트/native receipt/JS 저장 보호/UI/테스트와 후속 문서다. 소스/검증 자료와 키·환경·ignored 산출물을 분리하여 명시된 관련 파일만 stage한다. 두 commit을 합친 최종 clean source의 unit·E2E·Android 검증 후 remote branch를 일반 push한다.

같은 head의 기존 PR이 없으면 main 대상 Draft를 만들고 task에 attach한다. 원격 main/head가 검증 기준과 같은지 확인한 뒤 ready 전환하여 `--match-head-commit`의 일반 merge로 병합한다. CI/branch protection을 켜거나 우회하지 않는다. 변경되면 차이와 충돌을 검토하고 영향 검증한다.

병합 후 origin/main을 fetch하고 feature local branch를 merge commit으로 fast-forward하여 동일 tree의 source를 확인한다. main 작업 공간을 checkout하거나 기존 파일을 덮어쓰지 않는다. Preview Git count/SHA versionName은 feature/merge commit에 따라 달라지므로 merge commit에서 다시 unsigned build하고 최신 metadata/hash를 기록한다. formal1.0.0/1은 유지한다.

## 배포 준비 산출물

CI를 사용하지 않는 수동 Gradle 명령, 양 채널 unsigned APK/정식 AAB의 실제 package/label/version/hash, APK 안의 최종 web 자산 일치, 설치·Play 검증 조건을 로컬 evidence에 기록한다. APK/AAB/키/로그를 Git이나 공개 Release에 업로드하지 않는다. 실제 서명 단계는 별도 승인 후 구현/실행한다.

운영 광고 빌드 게이트는 유지한다. 테스트 광고 산출물을 정식 수익화 빌드로 해석하지 않는다. old CI YAML의 aggregate flavor 경로 문제는 비활성 상태에서 남은 자동화 항목으로 문서화하고, 검증된 명시 flavor 명령을 이번 수동 준비에 사용한다.

배포 준비 완료와 공개 출시 완료를 구분한다. 실제 Play 업데이트에는 동일 package/서명 계보·높은 versionCode 및 계정·기기가 필요하다. 정책/광고/키·제출은 readiness checklist에서 승인된 값과 실행 대기를 구분한다.
