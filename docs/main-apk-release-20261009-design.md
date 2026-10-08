# main 자동 APK Release 설계

orchestrator: Codex. 공식 [GitHub Secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), [Release API](https://docs.github.com/en/rest/releases/releases), [Latest 다운로드](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases), [AGP finalizeDsl](https://developer.android.com/build/extend-agp)를 기준으로 한다.

## 흐름과 버전

main push마다 regression 및 unsigned-android jobs를 독립 실행한다. PR 이벤트에서는 이 두 검증만 하고 release job을 건너뛴다. workflow permission은 contents:read, release job만 contents:write. GitHub 공식 Actions는 확인한 release commit SHA에 고정하고 checkout persist-credentials=false로 둔다. 빌드에는 signing Secrets를 전달하지 않는다.

plan은 full-history 현재 source SHA와 reachable commit count, Gradle의 기본 version을 읽는다. code=`max(baseCode,1002)+commitCount`(positive, 2100000000 이하), name=`baseName.main.commitCount.shortSha`. main의 append/merge/revert history에서 code가 증가하고 같은 SHA 재실행은 같은 code/tag다. history rewrite나 기준 code 감소로 이전 managed release보다 code가 낮아지면 publish하지 않는다. `scripts/ci-apk-version.gradle`의 androidComponents.finalizeDsl에서 -P 값을 적용한다. 로컬 build의 기본버전·app ID/이름/저장 schema는 유지한다.

## 서명과 결과 계약

서명 step에만 `SQUAD_PREVIEW_KEYSTORE_BASE64`, `SQUAD_PREVIEW_STORE_PASSWORD`, `SQUAD_PREVIEW_KEY_ALIAS`, `SQUAD_PREVIEW_KEY_PASSWORD`가 필요하다. 승인 후 GitHub encrypted Secrets에 등록한다. key는 runner temp의 private 파일로 복원하고 finally에서 그 파일/빈 디렉터리만 제거한다. local smoke는 기존 approved key path를 직접 사용한다. 출력/명령행에 암호를 넣지 않고 apksigner env: 참조를 사용한다. 키를 자동 생성하지 않는다.

cert SHA256 pin=`d5f7ede86e1020419ccb6a7a97fa3b8072ee6522ac878787641f19d5c33771b6`, package=`com.jaywapp.squadmaker.preview`. unsigned APK에서 plan code/name/package/minSdk를 확인하고 sign 뒤 v2/v3·cert·zipalign·hash를 확인한다. 실패하면 설치 불가 unsigned APK를 Release에 게시하지 않는다.

publish artifactDir의 계약은 `squad-maker-latest.apk`, `SHA256SUMS.txt`, `build-info.json`, `release-notes.md`다. build-info schemaVersion1에 repository/sourceSha/commitCount/baseVersionCode/baseVersionName/versionCode/versionName/applicationId/minSdk/targetSdk/certificateSha256/signatureSchemes/apk{fileName,sha256,size}/unsignedApkSha256/generatedAt를 기록한다. 비밀값은 없다.

## 게시와 재시도

tag=`apk-versionCode-shortSha12`. main push만 publish 가능하며 직전 main SHA가 build source와 다른 경우 superseded로 건너뛴다. concurrency는 main group을 직렬화하고 진행 중 release를 취소하지 않는다. 새 draft release에 explicit4개 파일만 업로드한 뒤 다운로드해 APK/hash/metadata를 대조하고 다시 main SHA를 확인해 publish/make_latest=true 한다. 공개 이전 실패는 draft로 남겨 재실행 때 복구한다. 이미 게시된 동일 source/hash release는 변경하지 않고 idempotent 완료한다. 잘못된 기존 release/낮은 code/metadata 불일치에는 중단한다. branch/기존 tag/기존 public release를 삭제하거나 force update하지 않는다.

## 승인과 검증

module unit/CLI 검사·workflow 정적 검토·Gradle init 실제 unsigned/signed local smoke·독립 리뷰·PR CI까지 먼저 완료한다. 이후 기존 키와 암호를 encrypted Secrets에 신규 저장하는 승인, 자동화 PR을 main에 병합하여 최초 자동 APK 게시를 시작하는 승인을 모아 받는다. 이전 PR47과 웹 배포·휴대폰 설치는 이 승인에 포함하지 않는다.
