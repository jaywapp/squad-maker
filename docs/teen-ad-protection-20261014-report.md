# TEEN·개인화 OFF·G 적용 결과

2026-10-14. orchestrator=Codex. **사용자가 승인한 보호 설정 구현·로컬 검증 완료. 운영 광고 활성화는 차단 유지.** 실제 연령/동의 처리, 별도 NPA, 정책 URL, 키 생성·서명·출시 승인을 대신하지 않는다.

## 작업 위치와 변경

- 워크트리: `D:\station\.worktrees\iam-headcoach-production-identity-20261014`
- 브랜치: `feat/production-identity-20261014`, 기반 `9e41887532f59606d87924346dcbc4957446a098`.
- 이전 production identity 변경을 포함해 모두 미커밋 상태다. 다른 워크트리/원본 main/사용자 데이터는 수정하지 않았다.

| 파일 | 이번 변경 |
|---|---|
| `android/app/src/main/java/com/jaywapp/squadmaker/preview/ConsentRequestConfiguration.java` | 기존 CHILD·TFUA true·TFCD true 또는 테스트 underAge=true이면 CHILD, 나머지는 TEEN. PPT DISABLED/G 강제. false 입력은 기존 TFUA를 변경하지 않음. 기존 테스트 기기/TFCD 등 보존 |
| 같은 경로 `ConsentAdPolicy.java` | 명시적인 testAdsOnly 생성자. 미확정 운영 모드에서 UMP 갱신·폼·pending no-op·동의 허용·광고/콜백 수락 차단 |
| 같은 경로 `SquadAdsPlugin.java` | BuildConfig.ADS_TEST_ONLY를 정책에 전달. 기존 초기화 전/배너·전면 load 전 보호 적용 위치 유지 |
| `scripts/production-build-config.gradle` | 운영 모드는 연령 값 누락/true/false와 무관하게 구성 및 variant 정책에서 차단. 우회용 승인 플래그 없음 |
| Java `ConsentRequestConfigurationTest`, `ConsentAdPolicyTest` | 실제 SDK 설정 객체의 우선순위/TFUA 보존/PPT/G/반복 적용, UMP 허용 mock·복귀·폼·SDK 준비 상태에도 운영 차단 검사 |
| `tests/unit/production-build-config.groovy`, `.test.js` | 명시 TFUA 값으로도 운영 gate 우회 불가, native testOnly 연결 회귀 |
| 이번 분석/설계/작업/보고 및 기존 문서 안내 | 승인 범위·검증·미완료 사항 분리 |

NPA=1 extras는 추가하지 않았다. UMP false를 실제 사용자 연령 판정으로 확정하지 않았다. 테스트 광고는 기존 UMP 흐름과 테스트 설정을 유지한다. 생산용 광고 요청은 실제 연령 판단 구현이 없으므로 전부 미확정으로 취급한다.

## 실제 검증

기존 JBR21/Gradle8.14.3/SDK36 cache를 사용하고 Gradle은 offline으로 실행했다. 의존성·SDK 설치나 실기기/운영 광고 호출은 없다.

| 검사 | 실제 결과 |
|---|---|
| Node unit 전체 | 173 pass / fail0 / skip0. 실제 Groovy 정책 포함 |
| productionRelease Java | 29 pass / fail0 / error0 / skip0 |
| previewRelease Java | 29 pass / fail0 / error0 / skip0 |
| 두 release lint | 각 Error0 / 기존 Warning4 (activity_main, config, package_name, custom_url_scheme의 UnusedResources) |
| 정식·Preview APK/AAB | 네 개 모두 빌드 성공. 19초, 280 tasks 중 40 실행/240 up-to-date |
| 실물 검사 | 네 개 모두 unsigned, sample App ID와 banner/interstitial ID 포함, 모든 ZIP entry에서 운영 publisher ID 부재 |
| 운영 gate | 실제 Gradle `-PsquadAdsMode=production -PsquadUmpUnderAgeOfConsent=true` 요청을 구성 단계에서 예상 차단 |
| 독립 Codex 읽기 리뷰 | API/import·우선순위·누락/회귀 지적 없음. 리뷰 자체는 테스트 실행을 뜻하지 않음 |

Mock은 양성 UMP 권한·폼 완료·pause/resume·이미 준비된 SDK 상태에도 미확정 운영의 요청/폼/콜백이 허용되지 않음을 확인한다. 테스트 모드의 기존 UMP 거절·실패·개인정보 변경·Activity 상태와 내보내기 공통10분 검사는 유지됐다. 실제 SDK 객체 검사에서는 test-device 목록/원본 설정 보존, 기존 CHILD/TFUA/TFCD 우선, false로 TFUA true를 내리지 않음, 반복 적용, 콘텐츠 등급/개인화 상태 조합을 검증했다.

실제 운영 gate 오류는 `Production ads are blocked until actual age and consent handling is approved and implemented`다. 이 테스트의 true는 실패 확인용 입력이며 운영 UMP 정책 결정이 아니다. 이후 나오는 compileSdk 오류는 이 조기 예외의 후속 오류이고 정상 테스트 모드 빌드는 SDK36으로 성공했다. Gradle9 deprecated feature 안내는 기존대로 남아 있다.

빌드 명령(android 디렉터리):

```powershell
.\gradlew.bat :app:assembleProductionRelease :app:bundleProductionRelease :app:assemblePreviewRelease :app:bundlePreviewRelease :app:testProductionReleaseUnitTest :app:testPreviewReleaseUnitTest :app:lintProductionRelease :app:lintPreviewRelease --offline --no-daemon --console=plain
```

## 새 unsigned 산출물

정식은 `아이엠 헤드코치 / com.jaywapp.iamheadcoach / 1.0.0(1)`, Preview는 `아이엠 헤드코치 Preview / com.jaywapp.squadmaker.preview / 0.1.0-preview.1.main.100.9e418875(1102)`다. minSdk24/targetSdk36, 각 FileProvider authority, release/debug=false를 유지했다. 모든 산출물은 **테스트 광고이며 설치/Play 제출 가능한 서명본이 아니다.**

| 파일(워크트리 기준) | SHA256 |
|---|---|
| `android/app/build/outputs/apk/production/release/app-production-release-unsigned.apk` | `665e26e0c152a6852d5e49f2f6085166a426c3ee709d23a6cb0e4d9a2f2e46fe` |
| `android/app/build/outputs/bundle/productionRelease/app-production-release.aab` | `89e4f8590820391471896c06bd02d5fccb1ed0caa2e3f70f8f5a1994d59b67d6` |
| `android/app/build/outputs/apk/preview/release/app-preview-release-unsigned.apk` | `a8a2ae628f9e088031326f7fc7cdd0beaf1e779222a4d9a5a1af2fd9aaf641cf` |
| `android/app/build/outputs/bundle/previewRelease/app-preview-release.aab` | `598778e8c2d6fe6d24b6ea8d68418816e2451df812cfda4dc559b0d7bd7ae672` |

이전 identity 단계 산출물 네 개는 `.work/production-identity-20261014/artifacts/`에 원래 파일명으로 보존했으며 이전 verification.json의 해시와 일치한다. 원래 build 출력 경로는 위 새 파일로 갱신됐으므로 이전 보고서의 해시는 보존 사본에 적용한다. 버전은 미커밋 로컬 변경이므로 이전 identity 검사와 같다.

새 증거: `.work/teen-ad-protection-20261014/verification.json`, `SHA256SUMS.txt`, unit/android/gate 로그, 채널별 APK/AAB signature/badging/manifest 기록. APK는 apksigner의 서명 부재, AAB는 jarsigner의 unsigned 및 signature entry 부재를 확인했다. AAB base manifest/resources는 검사 전용 복사본을 aapt2로 변환하여 확인했다. `*-base-inspection.apk`는 배포 산출물이 아니다.

## 남은 결정과 미검증

- **미확정 실제 연령/동의 처리:** 16+ 타깃만으로 실제 이용자 연령을 인증하지 않았다. UMP/지역·연령 미만·연령 불명 처리 모델이 결정·구현될 때까지 운영 광고는 계속 차단한다. 단순 true/false 입력으로 열리지 않는다.
- **NPA는 선택 대기:** 승인된 PPT 개인화 OFF는 적용했지만 별도 NPA=1은 추가하지 않았다. PPT와 NPA는 제3자 vendor 제한 범위가 다르며 NPA도 필요한 동의를 없애지 않는다. [Google PPT/NPA](https://support.google.com/admob/answer/14323214?hl=en).
- **실기기/폼/표시 미검증:** 테스트 광고 실제 표시, UMP 지역별 폼, OS/복귀/회전, Preview와 공존, SQ 이전은 이번에 실행하지 않았다. 이번 결과는 JVM mock/SDK 객체·로컬 빌드 검사다.
- **출시 정보 대기:** 공개 정책 URL·운영자/문의/보관·삭제 정보, AdMob 인증/메시지/스토어 연결, Play 등록/심사/Data safety, 업로드 키 실제 생성은 별도 단계다.
- 전체 브라우저 E2E는 웹/UI/저장 코드 변경이 없어 반복하지 않았다. Node 회귀는 실제 재실행했으며 과거 PR57 E2E 결과와 합산하지 않는다.
- 원격 commit/push/PR/merge, CI 활성화, 배포, 키 생성·서명·설치·운영 광고 호출은 하지 않았다. 자동 승인 심사 거절도 없다.

설정 근거는 [Google 요청 설정](https://developers.google.com/admob/android/targeting), [연령 처리](https://support.google.com/admob/answer/6219315?hl=en), [UMP 연령 신호](https://developers.google.com/admob/android/privacy/gdpr)와 실제 GMA25.5.0 API다. 이 보호 설정을 개인정보 미수집 또는 실제 연령 확인 완료로 표현하지 않는다.
