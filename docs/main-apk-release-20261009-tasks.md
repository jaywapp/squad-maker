# main 자동 APK Release 작업계획

orchestrator: Codex. root는 workflow/version/metadata/sign/local smoke/Git/docs를 소유한다. 독립 publisher 담당은 publisher와 그 unit만 편집한다. signer key/환경 값/기존 private .work는 하위 에이전트에 전달하지 않는다. shared build 자원 및 실제 서명은 root가 순차 실행한다.

| ID | orchestrator | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| CI-01 | Codex | Codex | gpt-6.1-sol | high | 없음 | plan | 이 문서3개/docs index | current main·Secret names-only·approval·공식docs | 완료 |
| CI-02 | Codex | Codex | gpt-6.1-sol | high | CI-01 | implementation | release-apk.yml, ci-apk-version.gradle, apk-release-metadata.mjs, sign-release-apk.ps1, metadata unit | event/permission/version/sign/identity 경계 | 완료 |
| CI-03 | Codex | Codex | gpt-6.1-sol | medium | CI-01 | implementation | publish-apk-release.mjs, publish unit | stale-main/draft/redownload/idempotence/fail boundaries | 완료 |
| CI-04 | Codex | Codex | gpt-6.1-sol | high | CI-02,CI-03 | review | 읽기만 | 독립 diff 및 artifact 계약 리뷰 | 완료 |
| CI-05 | Codex | Codex | gpt-6.1-sol | high | CI-04 | sequential | 로컬 .work만/CI PR | unit·workflow·실제 init/local sign/PR unsigned CI | 완료(d59b917 CI 및 local sign) |
| CI-06 | Codex | Codex | gpt-6.1-sol | medium | CI-05 | sequential | 원격 encrypted Secrets·자동화PR만 | 사용자 승인 후 registry/main activation/실제 run | 사용자 승인·등록 완료, 병합/실행 확인 진행 |

원격 서명/Release 게시와 휴대폰/T7 검증은 현재 미실행/미검증이다. local smoke와 mock 테스트를 원격 게시 결과로 보고하지 않는다. 기존 광고/브랜딩 변경·서명 APK·키는 보존한다.

2026-10-09(KST) 사용자 "승인"을 받았다. root가 기존 인증서 pin 확인 후 기존4개 서명값을 stdin으로 encrypted GitHub Secrets에 등록하고 이름만 확인했다. 기존 private 입력 전후 hash 동일/새 키·plaintext 파일 생성 없음. 승인 증거는 `.work/auto-apk-release-20261009/secret-registration.json`(공개 이름/상태만). GitHub 설정·main 병합·해당 push run·Release 검증은 순차 의존이고 private 입력 공유를 피하기 위해 root가 직접 처리한다. 병합 이후 CI-06의 실행 결과·main SHA·Release·재다운로드 증거와 완료 상태는 [PR48](https://github.com/jaywapp/squad-maker/pull/48)에 기록한다. 휴대폰/T7은 별도로 미검증을 유지한다.

승인 전 최종 head d59b917의 [Main APK run37805705491](https://github.com/jaywapp/squad-maker/actions/runs/37805705491)과 [verification run37805705452](https://github.com/jaywapp/squad-maker/actions/runs/37805705452) 모두 PASS. unit128/E2E195/skip1, sync/bundle·unsigned·lint(0errors/15warnings)·manifest PASS. PR merge ref6b9dd7bc source/version1076의 기존-key local sign/cert/v2/v3/zipalign/hash 및4개 artifact publisher 계약도 PASS. 증거는 `.work/auto-apk-release-20261009/{ci-run-d59b917.log,final-ci-unsigned,final-ci-lint,final-signed-smoke,final-sign-smoke-verification.json}`다.

검증 기준 구현 SHA=`b930dbd100a256258a3dfc6f5b4b72ee78e0b95f`. 전체 unit 128/128 통과(새 release unit 33개), 로컬 desktop/mobile E2E 195 PASS/1 skip. Node syntax·PowerShell AST·YAML parse 통과. 독립 정적 리뷰의 artifact 디렉터리 정리와 equal-code/different-SHA gate 수정 반영.

새 workflow [run37804181433](https://github.com/jaywapp/squad-maker/actions/runs/37804181433) 및 기존 verification [run37804181297](https://github.com/jaywapp/squad-maker/actions/runs/37804181297) 모두 PASS. PR merge ref source=`db09bb11b70e383dcfd7c98b050843a22d517bef`에서 실제 full-history version1075, sync/bundle, init version 주입, assembleRelease/lintRelease/unsigned manifest 검사 성공. 새 run의 regression은 unit128/E2E195/skip1. release job은 PR에서 skipped.

그 unsigned artifact를 내려받아 기존 approved key path를 직접 사용한 Windows local signing smoke 성공. 실제 APK package/minSdk24/target36/version1075, pinned cert, v2/v3, zipalign 및 SHA256 확인. 기존 private key/credential 파일의 전후 hash가 같음. signer의 정확한4파일 산출물을 publisher에 mock adapter로 연결해 계약 검증 성공(실제 GitHub 호출 없음). PR의 merge ref APK이며 main 공개 Release 또는 Run Line PR47 APK라고 표시하지 않는다.

증거는 `.work/auto-apk-release-20261009/{ci-run-b930dbd.log,ci-unsigned,ci-lint,signed-smoke,sign-smoke-verification.json}`. local smoke APK SHA256=`3ef3ba605c88d0baf0e5ccb5cd22485e78aff8af773e8b0662c1bbd13a241b40`, 7369845bytes. 최종 문서/PR 경로 필터 변경 후의 CI 결과와 최종 head는 [Draft PR48](https://github.com/jaywapp/squad-maker/pull/48)의 최신 검사에 별도로 기록한다. 이전 구현 run을 다른 SHA의 실행 결과로 표시하지 않는다.
