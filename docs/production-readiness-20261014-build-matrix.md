# Android 채널별 빌드와 광고 설정

> 후속 승인: 정식 `com.jaywapp.iamheadcoach`, `1.0.0/1`, Google 관리 Play App Signing + 별도 업로드 키 전략을 확정했다. [identity 적용](production-identity-20261014-report.md), [최신 TEEN/PPT OFF/G와 unsigned 검증](teen-ad-protection-20261014-report.md)이 아래 대기 기록을 대체한다. 실제 키 생성·이용자 연령/동의 처리·운영 광고 빌드는 계속 대기한다.

2026-10-14. 로컬 준비 범위이며 CI 활성화·서명·키 생성·설치·배포는 하지 않는다.

## 빌드 행렬

| Variant | 패키지 | 이름 | 기본 광고 | 운영 모드 요청 |
|---|---|---|---|---|
| previewDebug | `com.jaywapp.squadmaker.preview` | 아이엠 헤드코치 Preview | Google 테스트 | 실패 |
| previewRelease | 기존 Preview와 동일 | 아이엠 헤드코치 Preview | Google 테스트 | 실패 |
| productionDebug | 사용자 승인 대기, 실제 빌드 차단 | 아이엠 헤드코치 | Google 테스트 | 실패 |
| productionRelease | 사용자 승인 대기, 실제 빌드 차단 | 아이엠 헤드코치 | Google 테스트 | 승인 후 명시 선택 필요 |

Java namespace는 기존 `com.jaywapp.squadmaker.preview`를 유지한다. 승인된 아이콘·시스템 splash 자산은 공유하고 이름만 flavor 리소스로 구분한다. FileProvider의 기존 `${applicationId}.fileprovider` 계약과 저장 데이터 형식은 바꾸지 않는다.

승인되지 않은 production의 DSL 내부 패키지는 `com.jaywapp.unapproved.production`, 버전명은 `unapproved`다. 후보 `com.jaywapp.iamheadcoach`와 첫 버전 `1/1.0.0`은 확정하지 않았다. `scripts/production-build-config.gradle`의 `approvedProductionIdentity=null`이 production 태스크를 실행 전에 차단한다. 임의 `-P` 옵션으로 승인 게이트를 해제할 수 없다. 사용자의 확정 답변을 기록하고 승인된 정체성만 코드에 반영한 뒤 통합 검증해야 한다.

## 광고 입력과 생성 계약

`-PsquadAdsMode=test`가 기본이다. 운영 모드는 `-PsquadAdsMode=production`이며 productionRelease에서만 허용한다. 운영 모드에는 `-PsquadUmpUnderAgeOfConsent=true` 또는 `false`를 명시해야 한다. 이 입력은 대상 연령·스토어 정책 결정 자체를 대신하지 않는다. 값이 없거나 잘못되면 실패한다. 테스트 모드에서 연령 태그 기본값은 false이며 true/false의 명시 입력도 지원한다.

| BuildConfig 필드 | 타입 | 테스트 기본값 |
|---|---|---|
| ADS_TEST_ONLY | boolean | true |
| ADS_MODE | String | test |
| BANNER_AD_UNIT_ID | String | Google 테스트 배너 |
| INTERSTITIAL_AD_UNIT_ID | String | Google 테스트 전면 광고 |
| UMP_UNDER_AGE_OF_CONSENT | boolean | false |

Manifest의 AdMob 앱 ID는 `${admobAppId}` placeholder로 주입한다. 테스트 App/Banner/Interstitial ID는 Google 공식 샘플이며 productionRelease에서 운영 모드를 명시한 경우에만 사용자가 제공한 공개 ID 세트를 적용한다. 모든 ID는 같은 publisher의 app/unit 조합을 유지한다. Preview/debug에 운영 모드를 요청하면 해결된 Gradle task graph에서 거절하므로 축약 태스크·aggregate 태스크도 차단 대상이다.

Google Mobile Ads `25.5.0`을 유지하고 UMP `4.0.0`을 고정 추가했다. 기존 minSdk24/targetSdk36은 유지한다. [UMP 공식 안내](https://developers.google.com/admob/android/privacy)와 [Android flavor 및 resource 병합 안내](https://developer.android.com/build/build-variants)를 확인했다.

## Preview 버전과 로컬 명령

Preview 버전은 기존 배포 계산식 `1002 + 전체 Git commit count`를 사용한다. 현재 count97 기준 versionCode1099이며 Preview1097보다 높다. 이름은 기존 metadata와 동일한 `0.1.0-preview.1.main.<count>.<sha8>`다. shallow checkout, 1097 이하, Android 버전 상한 초과, 계산식과 다른 override는 거절한다. 새로운 로컬 코드 변경은 같은 HEAD에서 같은 버전을 갖고, 이후 커밋은 기존 단조 증가 정책을 따른다.

루트 통합 이후 실행할 unsigned Preview 명령:

```powershell
# android directory; no signing inputs required
.\gradlew.bat :app:assemblePreviewRelease :app:lintPreviewRelease --console=plain --no-daemon
```

출력은 `android/app/build/outputs/apk/preview/release/app-preview-release-unsigned.apk`다. 승인 전 production APK/AAB/compile/test/lint 등 variant 태스크는 실제 작업을 시작하기 전에 실패해야 한다. `assembleRelease`/`lintRelease`처럼 production을 포함하는 aggregate 요청도 승인 전 실패한다. 승인 후 정식 unsigned AAB는 명시적인 `:app:bundleProductionRelease`로 검증하며 기본 테스트 광고를 유지한다.

기존 `scripts/build-preview-apk.ps1`의 Preview 태스크와 unsigned 입력 경로만 채널에 맞게 수정했다. 이 스크립트는 기존 승인 Preview 인증서를 사용하는 서명 경로이므로 이번 작업에서 실행하지 않는다. 기존 서명 방식·입력·인증서 계보는 변경하지 않았다. 새로운 production 서명/업로드 키 설정은 추가하지 않았다.

## CI 후속 변경 필요

GitHub Actions는 비활성 상태를 유지하며 YAML을 변경하거나 실행하지 않았다. 기존 `.github/workflows/android-preview-verify.yml`과 `release-apk.yml`의 `assembleRelease`/`lintRelease` 및 `outputs/apk/release` 경로는 향후 별도 승인 작업에서 Preview flavor 태스크와 `outputs/apk/preview/release` 경로로 갱신해야 한다. 기존 `app-release-unsigned.apk` 복사·업로드 입력도 새 파일명에 맞춰야 한다. 현재 CI를 그대로 재활성화하면 aggregate 태스크의 production 승인 차단 또는 변경된 경로 때문에 실패한다. 호환 alias와 산출물 자동 복사는 추가하지 않았다.

기존 `ci-apk-version.gradle`은 Preview flavor에만 override하며 전체 Git 계산식과 같은 값인지 검증한다. 정식 버전 계보를 CI Preview 값으로 덮어쓰지 않는다. release metadata의 기존 Preview 패키지·인증서·1002+count 원칙은 유지한다.

## 실행한 검증과 남은 검증

`JAVA_HOME=C:\Program Files\Android\Android Studio\jbr` 설정으로 다음 검사를 실행했다.

```powershell
node --test tests/unit/production-build-config.test.js tests/unit/apk-release-metadata.test.js
```

7개 모두 통과, skip0. 새 검사는 실제 Gradle에서 적용하는 Groovy 정책 파일을 캐시된 Gradle8.14.3의 Groovy 런타임으로 직접 평가한다. 광고 모드 오타, 연령 태그 누락/오타, Preview/debug 운영 모드, 미승인 production, 버전 후퇴/다른 override/상한 초과를 거절하는지 확인했다. 추가 정적 검사로 필드·manifest·리소스·metadata·Preview 스크립트 연결을 검증했다. 시스템 기본 Java 실행 경로는 응답하지 않아 해당 검사를 중단하고 Android Studio JBR21로 재실행했다.

실제 Android Gradle 구성, resolved task graph의 미승인 production 차단, Preview unsigned APK/lint, 생성된 manifest/BuildConfig, 이후 승인된 production AAB는 루트 통합 검증 담당이다. standalone 정책 검사를 실제 APK/AAB 성공으로 간주하지 않는다. 서명·기기 설치·실기기 UMP·운영 광고 요청·Play 심사는 미실행 상태다.
