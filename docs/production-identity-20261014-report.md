# 승인된 정식 앱 식별자 — 로컬 검증 결과와 인계

> 후속 사용자 승인에 따라 TEEN·PPT 개인화 OFF·G를 적용했다. [최신 보호 구현·새 산출물](teen-ad-protection-20261014-report.md)을 따른다. 아래는 identity 단계 기록이며, 원래 산출물 네 개는 `.work/production-identity-20261014/artifacts/`에 같은 파일명·해시로 보존했다. 현재 build 출력 경로는 후속 산출물로 갱신됐다. 단순 UMP false 승인으로 운영 게이트를 여는 선택은 폐기했고 실제 연령/동의 처리 대기를 유지한다.

2026-10-14. orchestrator=Codex. **정식 앱 식별자 적용 및 테스트 광고 unsigned 검증 완료. 운영 광고·서명·출시 완료는 아니다.** PR #57의 패키지/첫 버전/서명 전략 승인 대기 기록은 이 후속 결정으로 대체한다. 원격 커밋·push·PR·병합은 실행하지 않았다.

## 경로와 변경

- 워크트리: `D:\station\.worktrees\iam-headcoach-production-identity-20261014`
- 브랜치: `feat/production-identity-20261014`
- 기반: merge `9e41887532f59606d87924346dcbc4957446a098`; PR 검증 head `db2db0dcfc4f4663166ed0e864ed36910c07ad28`와 파일 tree 동일 확인.
- 미커밋 변경: `scripts/production-build-config.gradle`의 승인 identity, 실제 Groovy 정책 회귀, `android/app/build.gradle`의 설명 주석, 이번 분석/설계/작업/보고·문서 인덱스와 기존 결정 문서의 후속 안내.
- 기존 root main `27a34ca`와 `.ux-review/` untracked 상태를 보존했다. 다른 워크트리·Preview 키·앱 데이터는 변경하지 않았다.
- 서명 전략은 Google 관리 Play App Signing + 별도 업로드 키로 승인됐다. 키 생성·읽기·사용·서명 설정은 이번에 하지 않았다.

## 실제 생성한 산출물

모든 경로는 위 워크트리를 기준으로 한다. **아래 APK/AAB는 전부 테스트 광고이며 unsigned이다.** 설치/제출용 signed 파일로 표시하지 않는다.

| 산출물 | 파일 | 앱 ID / 버전 | SHA256 |
|---|---|---|---|
| 정식 APK | `android/app/build/outputs/apk/production/release/app-production-release-unsigned.apk` | `com.jaywapp.iamheadcoach`, `1.0.0` / `1` | `c3afd30ee46b8d58c49ab13f96e0c581efa2638fb7611cfe97e98b986663da2a` |
| 정식 AAB | `android/app/build/outputs/bundle/productionRelease/app-production-release.aab` | 위와 동일 | `e72d1df47ac3bcc6471ac3c3e410b824f2adb1fe87dedf8a66e5b6106397c9ec` |
| Preview APK | `android/app/build/outputs/apk/preview/release/app-preview-release-unsigned.apk` | `com.jaywapp.squadmaker.preview`, `0.1.0-preview.1.main.100.9e418875` / `1102` | `558d03e1ecbdeeaea5af8f2016d55a56f736290156999bd72b95a428a03f7461` |
| Preview AAB | `android/app/build/outputs/bundle/previewRelease/app-preview-release.aab` | 위와 동일 | `6e9990df9c63fa2f537f0a480a6229ffda71ee582188436b275ea3fec0d18e4f` |

APK를 aapt로 읽고, AAB의 실제 base manifest/resources를 별도 검사 복사본에서 aapt2로 binary 변환해 다음을 대조했다. 검사 복사본 `*-base-inspection.apk`는 실행/설치 산출물이 아니다.

- 표시명: 정식 `아이엠 헤드코치`, Preview `아이엠 헤드코치 Preview`.
- 패키지·버전은 표와 일치. minSdk24 / targetSdk36 유지. FileProvider authority는 각 `${applicationId}.fileprovider`로 분리됐다.
- Java namespace와 activity는 기존 `com.jaywapp.squadmaker.preview`를 유지한다. 실제 앱 ID는 manifest에서 분리됐으며 저장 코드/스키마/키는 변경하지 않았다. Capacitor 공통 설정의 Preview 메타데이터도 임의 변경하지 않았다.
- 네 파일 모두 AdMob sample App ID가 manifest에 있고, sample banner/interstitial ID가 DEX에 있다. 모든 ZIP entry의 UTF-8/UTF-16 검사에서 운영 publisher `3532115669945697`은 발견되지 않았다.
- 생성된 두 BuildConfig는 `ADS_MODE="test"`, `ADS_TEST_ONLY=true`, release/debug=false다. manifest에 debuggable/testOnly=true가 없다.
- apksigner는 두 APK에 `DOES NOT VERIFY / Missing META-INF/MANIFEST.MF`를 반환했고, jarsigner는 두 AAB에 `jar is unsigned`를 반환했다. 네 ZIP 모두 JAR signature entry가 없다. Gradle의 `sign*ReleaseBundle`이라는 태스크 이름 자체를 서명 완료 증거로 간주하지 않았다.

운영 광고 ID는 정책 source와 실제 Groovy 검사에서 다음과 정확히 대조했다. **운영 모드 APK/AAB에 주입된 결과는 미검증**이다.

| 용도 | 운영 ID |
|---|---|
| App | `ca-app-pub-3532115669945697~1919738204` |
| Banner | `ca-app-pub-3532115669945697/4481041102` |
| Interstitial | `ca-app-pub-3532115669945697/3966035787` |

## 실행한 검사

환경: 기존 Android Studio JBR21, Gradle8.14.3 cache, Android SDK36. 기존 readiness 워크트리와 package-lock SHA256 일치를 확인한 뒤 node_modules를 새 워크트리로 복사했다. 의존성/SDK 설치와 네트워크 다운로드 없이 진행했다. Gradle은 `--offline --no-daemon`으로 실행했다.

| 검사 | 실제 결과 |
|---|---|
| `node --test tests/unit/*.test.js` | 173 pass, 0 fail, 0 skip. 실제 Groovy 정책 검사 포함 |
| Android web bundle + Capacitor sync | 성공, Android analytics disabled·로컬 export assets 유지 |
| productionRelease / previewRelease APK 및 AAB | 모두 성공, 280 tasks 실행, 28초 |
| 두 release variant Java 단위 검사 | 각각 23 pass, failure/error/skip 0 |
| 두 release lint | 각각 Error0/Warning4. 기존 UnusedResources: activity_main, config, package_name, custom_url_scheme |
| APK/AAB 실물 ID·서명·광고 검사 | 네 파일 모두 통과 |
| `assembleProductionRelease -PsquadAdsMode=production` | 연령 입력 없이 예상 실패: `Production ads require explicit squadUmpUnderAgeOfConsent=true or false` |
| `git diff --check` | 통과 |

빌드 명령(android 디렉터리):

```powershell
.\gradlew.bat :app:assembleProductionRelease :app:bundleProductionRelease :app:assemblePreviewRelease :app:bundlePreviewRelease :app:testProductionReleaseUnitTest :app:testPreviewReleaseUnitTest :app:lintProductionRelease :app:lintPreviewRelease --offline --no-daemon --console=plain
```

기본 test 광고만 사용했으며 운영 gate 검사에는 true/false를 입력하지 않았다. 예상 실패 로그의 추가 compileSdk 오류는 정책 예외가 Android DSL 구성 전에 발생하며 나온 후속 오류다. 정상 test 빌드는 SDK36 구성으로 성공했다. Gradle9 비호환 deprecated feature 안내도 남아 있으며 이번에 업그레이드하지 않았다.

증거는 `.work/production-identity-20261014/`에 있다: `verification.json`(source hashes/결과/산출물), `SHA256SUMS.txt`, `unit.log`, `sync.log`, `android.log`, `production-ads-block.log`, 채널별 `*-signature.log`, `*-badging.txt`, `*-manifest.txt`, `collect.mjs`, `inspect-bundles.ps1`. source SHA는 기반 커밋이고 identity 변경은 미커밋 상태이므로 해당 source hashes와 함께 읽는다.

## 청소년 광고 정책: 권장과 필요한 결정

현재 GMA25.5.0/UMP4.0.0과 설치된 API JAR를 읽기 검토했다. 25.5.0에 `AgeRestrictedTreatment.TEEN/CHILD`, PPT `DISABLED`, 최대 콘텐츠 `G` API가 있어 의존성 업그레이드가 필요하지 않다. 현재 앱은 TFUA boolean 전달만 구현하며 TEEN/PPT/G는 미구현이다. 정책 unit에 존재하는 PG/PPT 입력은 기존 설정 보존 검사이며 앱 정책 적용 증거가 아니다.

권장 첫 출시안은 생년월일을 추가 수집하지 않고 성인을 포함한 모든 광고 요청에 **TEEN + 개인화 OFF + 최대 G**를 적용하는 것이다. 기존 CHILD/TFUA true/TFCD true 신호는 낮추지 않는다. GMA의 기존 TFUA/TFCD는 새 age treatment로 대체되는 API이며 더 강한 보호가 우선한다. [Google Android 요청 설정](https://developers.google.com/admob/android/targeting).

다음 질문을 사용자에게 확인한 뒤 별도 구현한다.

1. **성인을 포함한 모든 광고 요청에 TEEN 보호·개인화 OFF·최대 G를 적용할까요?** 실제 연령 인증을 의미하지 않는다.
2. **개인화 OFF뿐 아니라 제3자 광고·추적 vendor 제한도 적용할까요?** PPT DISABLED와 `NPA=1`은 다르다. PPT는 제3자 vendor 사용을 허용하므로 NPA의 제한을 원하면 별도 명시/요청 설정과 AdMob 수요 설정 확인이 필요하다. [PPT와 NPA 차이](https://support.google.com/admob/answer/14323214).
3. **첫 출시 UMP는 동의 연령 미만으로 일괄 분류하지 않는 일반 동의 흐름(`underAge=false`)을 사용할까요, 아니면 연령 미만 처리 기준이 정해질 때까지 운영 광고를 계속 막을까요?** UMP `true`는 18세 미만 보호 스위치가 아니라 동의 연령 미만 신호이고 동의 요청을 생략한다. 16세 이상 타겟/한국 출시만으로 실제 이용자 연령을 인증하지 못한다. 이번 검증을 위해 false로 게이트를 해제하지 않았다. [UMP 연령 신호](https://developers.google.com/admob/android/privacy/gdpr).

정책 구현 시 현재 `ConsentRequestConfiguration.apply(existing,false)`가 기존 TFUA=true를 false로 덮어쓰는 부분도 보완해야 한다. CHILD 우선·TEEN/PPT/G·기존 test-device 목록 유지·배너/전면 공통 적용을 검사하고, Google 초기화 전 요청 설정을 적용한다. UMP 갱신/canRequestAds·옵션·광고 실패 시 내보내기·공통10분 정책은 보존한다.

## 미검증·차단·다음 단계

- **사용자 결정 대기:** 청소년 보호/UMP 정책, 실제 공개 개인정보 URL·운영자/문의 처리·보관/삭제 정보, 업로드 키 생성 승인. 위 질문 답변 전 운영 모드 빌드는 계속 차단한다. 자동 승인 심사에 의한 거절은 없었다.
- **실기기 미검증:** 앱 설치/공존, Preview→정식 SQ 전술별 내보내기·복원·수정·재시작, UMP 실제 폼/옵션·회전/복귀·오프라인, 광고 표시. 이번에는 기기나 운영 광고 요청을 실행하지 않았다.
- **브라우저 E2E:** 이번 식별자 변경은 저장/UI/JS 동작을 변경하지 않아 전체 E2E를 재실행하지 않았다. PR57 검증 head의 기존 결과는 별도 이력이며 이번 새 실행 결과로 계산하지 않는다.
- **출시 미완료:** AdMob 계정 인증·스토어 연결·메시지/정책·app-ads.txt, Play 앱 등록·서명·테스트 요건·Data safety·콘텐츠 등급·국가/언어·제출은 이 작업에서 확인하거나 변경하지 않았다. 부모 담당이다.
- **서명/원격 작업 미실행:** 키 생성·읽기·사용, APK/AAB 서명, 설치, 사용자 자료 삭제, 원격 push/PR/merge, CI 활성화·공개 배포·Play 제출 없음.

계속할 때 이 워크트리의 미커밋 변경과 검증 증거를 먼저 확인한다. 사용자가 원격 통합을 별도로 승인하기 전 commit/push/PR/merge를 하지 않는다. 기기 이전은 기존 [SQ 이동 안내](production-readiness-20261014-data-transfer.md)를 따른다.
