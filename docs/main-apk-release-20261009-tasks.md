# main 자동 APK Release 작업계획

orchestrator: Codex. root는 workflow/version/metadata/sign/local smoke/Git/docs를 소유한다. 독립 publisher 담당은 publisher와 그 unit만 편집한다. signer key/환경 값/기존 private .work는 하위 에이전트에 전달하지 않는다. shared build 자원 및 실제 서명은 root가 순차 실행한다.

| ID | orchestrator | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| CI-01 | Codex | Codex | gpt-6.1-sol | high | 없음 | plan | 이 문서3개/docs index | current main·Secret names-only·approval·공식docs | 완료 |
| CI-02 | Codex | Codex | gpt-6.1-sol | high | CI-01 | implementation | release-apk.yml, ci-apk-version.gradle, apk-release-metadata.mjs, sign-release-apk.ps1, metadata unit | event/permission/version/sign/identity 경계 | 완료 |
| CI-03 | Codex | Codex | gpt-6.1-sol | medium | CI-01 | implementation | publish-apk-release.mjs, publish unit | stale-main/draft/redownload/idempotence/fail boundaries | 완료 |
| CI-04 | Codex | Codex | gpt-6.1-sol | high | CI-02,CI-03 | review | 읽기만 | 독립 diff 및 artifact 계약 리뷰 | 완료 |
| CI-05 | Codex | Codex | gpt-6.1-sol | high | CI-04 | sequential | 로컬 .work만/CI PR | unit·workflow·실제 init/local sign/PR unsigned CI | 진행 |
| CI-06 | Codex | Codex | gpt-6.1-sol | medium | CI-05 | approval | 원격 encrypted Secrets·자동화PR만 | 사용자 승인 후 registry/main activation/실제 run | 승인 대기·미실행 |

원격 서명/Release 게시와 휴대폰/T7 검증은 현재 미실행/미검증이다. local smoke와 mock 테스트를 원격 게시 결과로 보고하지 않는다. 기존 광고/브랜딩 변경·서명 APK·키는 보존한다.

검증 중간 기록: 전체 unit 128/128 통과, 새 release unit 33개 포함. Node syntax·PowerShell AST·YAML parse 통과. 독립 정적 리뷰의 artifact 디렉터리 정리와 equal-code/different-SHA gate 수정 반영. E2E/Android local smoke/PR CI는 진행 또는 대기이며 완료로 보고하지 않는다.
