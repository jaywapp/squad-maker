# 정식 출시 구조 로컬 준비 결과

2026-10-14. 지원·대상·국가/언어 후속 답변을 아래에 반영했다. **정식 패키지/버전·서명 전략·청소년 광고 보호안·공개 정책 URL은 대기 중이며 정식 공개 출시 가능 판정은 아니다.**

사용자가 이후 현재 준비 변경의 commit·push·main 병합을 승인했다. 아래 결과는 커밋 전 생성 시점의 로컬 기록으로 보존하고, Git 통합의 최종 소스 SHA·fresh 검증·병합 결과는 해당 main 대상 PR에 기록한다. 패키지/키·서명·TEEN 보호안·배포/Play 승인과 혼동하지 않는다. CI·자동 배포는 비활성 유지다.

## 후속 지원·대상 반영 — 현재 결과

- 공개 지원은 blueheart.dev@gmail.com, 첫 배포는 대한민국·한국어, 제품 대상은16세 이상 축구·풋살 선수/성인 동호인·코치로 확정됐다. Play16~17세/18세 이상은 검토 기준이며 Console 제출/콘텐츠 등급은 미확인이다.
- 앱 도움말에 대상과 이메일 지원 링크, 메타/README에 축구·풋살 기능 소개를 반영했다. 관심도 안내의 포괄적인 개인정보 미수집 표현을 팀·선수·전술 내용이 분석에 포함되지 않는다는 범위로 좁혔다. 인터뷰 모집 주소·제보 API·저장/SQ/광고 위치/10분 정책·승인 디자인은 유지했다.
- [연령/스토어·광고 보호 검토](production-readiness-20261014-audience-policy.md), [개인정보 초안](production-readiness-20261014-privacy-draft.md), [Data safety 대조](production-readiness-20261014-data-safety.md)를 작성했다. 실제 정책 URL/앱 내 방침 링크/게시/Console 설정은 없다. 지원 메일 수신은 미검증이고 개인정보 문의에도 같은 주소를 쓰는 것은 담당/처리 절차 확인 대기 후보다.
- UMP/TFUA만으로 청소년 보호가 완료되지 않는 차이를 확인했다. GMA25.5 실제 바이너리에 TEEN API가 존재하며, 생년월일 수집 없이 전 사용자 TEEN/비개인화/G 및 더 강한 CHILD 보존을 제안했다. **보호안 답변은 미수신, 네이티브 요청 정책은 추가 변경하지 않았다.** 운영 광고를 요청하지 않았다.
- 독립 문서 리뷰의 Turnstile/GitHub 수령자 혼동을 수정했다. 제보 본문·선택 연락처/진단은 GitHub Issue로, 별도 스팸 검증 토큰/IP는 Cloudflare로 전달됨을 실제 API와 대조했다.

현재 기준 HEAD는 `b6b0420f24d4b998a5e986fa0a5aaabfb1b0cbca`, 브랜치는 `feat/production-readiness-20261014`이며 **이번 변경은 미커밋**이다. 현재 코드19파일의 SHA-256 묶음은 `5764b091b30435bb1ebda5f0e23c382f6184d421746993a08517d67725a8f1cb`다. 아래 초회 전체 검증과 같은 코드라고 주장하지 않는다.

| 후속 변경 검증 | 현재 실제 결과 |
|---|---|
| 전체 JS/Groovy unit | 173 passed, fail/skip0 |
| 영향 desktop/mobile E2E | transfer/privacy/export-interstitial/beta-ui/korean-branding5 spec: desktop36 + mobile36 =72 passed, fail/skip0 |
| Android bundle/sync | 통과, Android 웹 분석 비활성 및 기존 로컬 export 자산 유지 |
| clean Preview Java/unsigned APK/AAB/lint | `JAVA_HOME=기존JBR`, `ANDROID_HOME=기존SDK`, 기존 명령의 clean/test/lint/assemble/bundle: BUILD SUCCESSFUL, Java23 fail/error/skip0 |
| lint | 오류0/UnusedResources 경고4: activity_main/config/package_name/custom_url_scheme |
| 지원 문구/접근 | 기본/200%rem/가로200% desktop/mobile 총6 관측: 지원 mailto/대상 문구·버튼 접근/가로 overflow 없음, PNG2개 직접 확인. 메일 전송 없음 |
| 문서/CI | 정책 관련10문서 내부 링크 누락0, 스토어 짧은 설명40자, Actions GET enabled:false |

후속은 문구·지원/정책 문서 변경이라 영향 검증을 수행했다. 전체401+skip1은 아래 초회 `d741…` 소스 기준이며 후속 전체 테스트를 재실행한 것으로 표시하지 않는다. 기존 skip1의 원인은 모바일 전체GIF 중복 인코딩 생략/desktop 실행이다. 실기기/SDK 폼/정식 산출물/운영 API/실제 지원·공개 방침은 계속 미검증이다.

Android 첫 실행은 SDK 경로 환경 변수 누락으로 작업 실행 전에 실패했다. `android-sdk-missing.log`를 보존하고 기존 확인된 SDK 경로를 이번 프로세스에만 지정해 새로 통과했다. 전역 환경·키·설치/배포를 변경하지 않았다. TFUA deprecated/기존 unchecked/Gradle9 및 앞선 개발 의존성 경고는 해결됐다고 처리하지 않는다.

현재 unsigned 산출물은 아래 초회와 같은 출력 위치에 재생성됐다. Preview name/package/code1099/name`0.1.0-preview.1.main.97.b6b0420f`/min24/target36을 실제 aapt로 확인했다. 버전의 SHA 표기는 기준 HEAD이며 dirty 코드 해시는 위에 별도 기록했다.

- APK7,169,408bytes, SHA-256=`1db32d7f79fd90b37d299e3151367cc4f98781abecc406f58e6c42981b903ea9`. apksigner는 unsigned로 예상 거절.
- AAB6,861,720bytes, SHA-256=`cd3ba4504296234b7b7bd82111b86b5f687e83683eecfeea30861db1f1c3d7f6`. 서명 태스크/키를 사용하지 않은 unsigned AAB이며 업로드용이 아니다.
- 새 증거는 `.work/audience-policy-20261014/`의 verification.json·unit/e2e/sync/android/visual 로그·PNG2개다. 실제 API 확인은 기존 `.work/production-readiness-20261014/teen-api/api-bytecode.txt`에 있다. 전용4324/4325는 검증 후 종료됐고 기존4317~4319를 변경/종료하지 않았다.
- 원격 commit/push/PR/병합·CI 활성화·공개 정책/Release/배포·Play·키 생성/서명·설치·폴더 이동은 수행하지 않았다.

## 초회 준비 결과 보존 — 후속 문구 반영 전

**이하 결과/해시는 초회 코드 `d741…`와 당시 결정 상태의 기록이다. 후속 현재 결과는 위를 따르며 아래 옛 APK/AAB 해시·전체E2E·답변 미수신 표현을 현재 상태로 사용하지 않는다.**

## 기준과 보존

- 최신 확인 main/기준 HEAD: `b6b0420f24d4b998a5e986fa0a5aaabfb1b0cbca`, PR56 병합 완료.
- 작업 경로: `D:\station\.worktrees\iam-headcoach-production-readiness-20261014`, 로컬 브랜치 `feat/production-readiness-20261014`.
- 새 커밋은 만들지 않았다. **미커밋 소스 변경을 빌드·검증했으며 main b6 그 자체의 검증 결과가 아니다.** 변경 코드·테스트19파일의 실제 파일 해시 및 묶음 SHA는 `.work/production-readiness-20261014/verification.json`에 있다.
- 변경 코드 묶음 SHA-256: `d7414f1edb609561e49fa905cdbdc4db46e2ba264934af21b09fd15b321aacf1`.
- primary27a34ca9와 `.ux-review/`, 기존 export-interstitial735696f worktree 및 키/광고/SQ 자료를 보존했다. 새 worktree에서만 소스를 수정했다. 폴더 이동·기존 서버/세션 종료 없음.
- 별도 운영 광고 준비 세션의 중단/변경 없음 응답을 확인했으며 새 세션이나 중복 원격 작업을 만들지 않았다.
- GitHub Actions 최종 GET `enabled:false`. 원격 commit/push·PR·main 병합·Release·배포·Play·키 생성/변경/서명·기기 설치 없음.

## 빌드별 계약

| 빌드 | 표시명 | applicationId | 광고 | 실제 검증 |
|---|---|---|---|---|
| previewDebug/previewRelease | 아이엠 헤드코치 Preview | com.jaywapp.squadmaker.preview | Google 테스트 ID, 운영 모드 요청 거절 | release unsigned1099 실제 검증; debug APK 미생성 |
| productionDebug | 아이엠 헤드코치 | 승인 대기, 후보 com.jaywapp.iamheadcoach | 테스트 ID만 | 실제 빌드 차단 |
| productionRelease 기본 test | 아이엠 헤드코치 | 승인 대기 | 정식 ID로 하는 QA용 테스트 설정, 제출용 아님 | 실제 빌드 차단 |
| productionRelease 명시 production | 아이엠 헤드코치 | 승인 대기 | 제공된 App/Banner/Interstitial 운영 ID와 명시적인 UMP 연령 값 | 정책/Groovy 검증; 실제 산출물·운영 광고 미검증 |

Java namespace·공개 bridge/plugin 이름·저장 키/schema·SQ v1·FileProvider의 applicationId 기반 권한·외부 공유 URL은 유지했다. 승인 자산/아이콘/스플래시/인트로·라이선스를 새 디자인으로 교체하지 않았다. `capacitor.config.json`은 기존 Preview scaffold이며 실제 채널 이름/패키지는 Gradle flavors·리소스·APK의 App 정보로 구분한다.

승인되지 않은 production identity는 null gate다. 임의 property로 패키지 승인을 대신하지 않으며 실제 resolved task graph에서 production 빌드를 작업 실행 전에 거부한다. 현재 reserved placeholder는 최종 패키지로 선택되거나 빌드된 적이 없다. 정식 첫1/1.0.0·Play App Signing+독립 업로드 키는 제안만 했다.

## 이번 실제 검증

모든 결과는 이 작업 공간의 현재 미커밋 코드 기준이다. 기존 PR56/Preview1097/CI 성공 결과를 재사용하지 않았다.

| 검사 | 실제 명령/결과 |
|---|---|
| 전체 JS/실제 Groovy 정책 unit | `JAVA_HOME=AndroidStudio jbr` + `npm run test:unit`: 173 passed, fail/skip0 |
| 우선 E2E | 새 transfer/privacy 및 기존 export-interstitial3 spec: 44 passed |
| 전체 desktop/mobile E2E | `node node_modules/@playwright/test/cli.js test --config .work/production-readiness-20261014/playwright.local.cjs`: desktop201, mobile200+skip1, 실패0 |
| Android bundle/sync | `npm run android:sync` 통과, 로컬 export 라이브러리/analytics disabled. 생성 Gradle2파일은 내용 diff0 |
| Preview Java/unsigned APK/AAB/lint | JBR21/SDK36: `gradlew --no-daemon --max-workers=1 :app:clean :app:testPreviewReleaseUnitTest :app:lintPreviewRelease :app:assemblePreviewRelease :app:bundlePreviewRelease`: BUILD SUCCESSFUL, Java23 tests/fail/skip0 |
| lint | 실제 lint-results-previewRelease.xml: 오류0·UnusedResources 경고4 |
| 미승인 production gate | `:app:assembleProductionRelease`가 패키지·첫 버전 승인 필요 오류로 예상 차단. 앱 빌드 성공이 아니라 안전 거부 테스트 통과 |
| 산출물 | 실제 aapt2 label/package/version·Manifest app ID·APK/AAB DEX ID·ZIP/서명 검사 통과 |
| 시각/접근 | 합성 native bridge, desktop/mobile 기본·200%rem·가로200% 총6 관측: 새 옵션 표시/버튼/가로 overflow 확인, PNG2개 root 직접 확인 |
| diff | `git diff --check` 통과 |

전체 E2E의 skip1은 전체 패턴 GIF 중복 인코딩을 mobile에서 생략하고 desktop에서 실행하는 기존 정책이다. 기본 config의 CDN smoke 제외와 실제 외부 API 접수는 skip1과 별도이며 이번 실행에 포함하지 않았다. 브라우저 재로딩·viewport 회전·facade 복귀는 실제 Android 프로세스/Activity/OS 회전 검증을 대신하지 않는다.

독립 리뷰 High(TFUA가 GMA 요청에 전달되지 않던 문제)와 Medium(privacy폼 종료 후 pending form 미처리)은 수정 후 재검토 완료했다. 최종 Java23에는 요청 설정 보존·폼 콜백 순서 및 기존 ExportAdPolicy가 포함된다. 전체 unit173에도 새 bridge 상태/리스너 종료/실패 및 기존 내보내기·저장 회귀가 포함된다.

## unsigned 산출물

- APK: `android/app/build/outputs/apk/preview/release/app-preview-release-unsigned.apk`, 7,169,276bytes.
- APK SHA-256: `e71ecbdfee9b9ce81a0624d50ed4e44ffaf040494eec69a6162f4c4ff61b3b88`.
- AAB: `android/app/build/outputs/bundle/previewRelease/app-preview-release.aab`, 6,861,587bytes.
- AAB SHA-256: `ac326c5b3c9e248864ca756f255f21ee48f6d5825cbf8c2d0688fad888b38247`.
- 실제 Preview label `아이엠 헤드코치 Preview`, package `com.jaywapp.squadmaker.preview`, versionCode1099, versionName`0.1.0-preview.1.main.97.b6b0420f`, minSdk24/targetSdk36.
- `.main.97.b6…`은 기존 산정 규칙의 기준 HEAD 표기이며 dirty 소스를 빌드했다는 사실과 코드 해시를 위에 별도 기록했다.
- APK/AAB DEX는 테스트 Banner/Interstitial ID 포함, 운영 publisher ID 미포함. APK Manifest의 app ID도 Google 샘플값이며 제공된 운영 app ID가 없다.
- 새 APK는 apksigner 검사가 unsigned로 거부되고 AAB는 jarsigner의 `jar is unsigned` 및 META-INF 서명0으로 확인했다. 설치용 서명 APK·업로드용 서명 AAB가 아니다.
- 기존 `build/squad-maker-latest.apk`는 실제1097/기존 Preview 패키지이며 서명 검사가 통과했다. 기존 인증서 SHA-256=`d5f7ede86e1020419ccb6a7a97fa3b8072ee6522ac878787641f19d5c33771b6`. 새 unsigned 산출물에 이 인증서가 들어 있다고 주장하지 않는다. 기존 공개1097 파일을 교체하지 않았다.
- 휴대폰 실제 설치 버전·인증서와 새 서명 업데이트 호환성은 미확인/미검증이다. 서명 승인 후 동일 키·버전 조건을 다시 검증해야 한다.

## 남은 경고/제약

- lint4는 기존 scaffold/호환 리소스 `activity_main`, `config`, `package_name`, `custom_url_scheme` 미사용 경고다. 이번에 숨기거나 삭제하지 않았다. 이전 lint5/6/8은 시점·온라인 버전 안내 차이가 있으므로 이번 결과로 재사용하지 않았다.
- GMA25.5의 TFUA API deprecated 컴파일 안내, 기존 unchecked 코드/Gradle9 비호환 deprecation 안내가 남아 있다. 현재 빌드는 성공했으며 향후 연령 정책 확정 시 새 age-restricted API 등 SDK 전략을 별도로 결정해야 한다.
- npm audit는 moderate4(@capacitor/cli/xcode/uuid, 개발 http-server→union→qs)이며 lockfile/의존성 업그레이드는 하지 않았다. 개발 도구 경고를 Android runtime 취약점 통과로 해석하지 않는다.
- UI detector exit2의 경고1은 기존 index.html:350의 border-left3px 스타일이다. 이번 옵션에는 새 스타일을 추가하지 않았고 승인 디자인 밖의 정리를 하지 않았다.
- cap sync 후 생성파일2개에 Git stat/CRLF 표시가 남을 수 있지만 내용 diff0이며 staged 변경은 없다.
- 중간 비동기 테스트 harness 대기/독립JUnit 이름/JDK 인수·viewport 프레임 대기 문제는 바로잡아 새 결과를 확인했다. 이전 실패·초기 관측을 최종 성공 근거로 쓰지 않았다.
- actual UMP/AdMob·실기기·production binary·서명·계정 인증/스토어심사·운영 제보 API/실접수·정식 방침/지원 URL은 완료되지 않았다. 운영 광고를 실제 요청하거나 클릭하지 않았다.

## 변경 파일

- `android/app/build.gradle`, `android/app/src/main/AndroidManifest.xml`, preview/production의 `res/values/strings.xml`.
- `SquadAdsPlugin.java`, 새 `ConsentAdPolicy.java`/`ConsentRequestConfiguration.java`, 대응 Java tests2개. 원래 ExportAdPolicy와 저장 구현은 그대로다.
- `app/platform-native.js`, `index.html`, `tests/unit/platform-native.test.js`, 새 privacy/data-transfer E2E2개.
- `scripts/production-build-config.gradle`, 실제 Groovy 정책 unit2파일, `scripts/build-preview-apk.ps1`, `scripts/ci-apk-version.gradle`.
- `README.md`, `docs/README.md`, production-readiness 분석·설계·작업표·빌드 행렬·데이터 이전·출시 체크리스트·이 보고서.
- CI YAML·서명 키/인증정보·패키지 호환성 데이터·기존 APK/브랜딩 자산·다른 작업 트리 파일은 수정하지 않았다.

## 인계와 다음 단계

증거는 `.work/production-readiness-20261014/`의 unit/sync/android/e2e 로그, `e2e-results.json`, `verification.json`, archive/signature/gate 검사, npm audit 및 `evidence/`의 PNG/시각 JSON에 있다. 임시 생성 `debug.log`는 내용 출력 없이 ignored `generated-debug.log`로 보존했다. 전용4324/4325 서버는 종료 확인했고 기존4317~4319는 변경/종료하지 않았다.

먼저 대기 중인 패키지·첫 버전/서명 전략/정책 질문 답변을 기록한 뒤 production ID 적용·fresh unsigned 빌드/실제 운영 설정 검사를 한다. 이후 키·서명·기기·Play/배포는 각각 별도 승인 범위에서 진행한다. 실기기와 Data safety/app-ads/계정 항목은 [출시 체크리스트](production-readiness-20261014-release-checklist.md), SQ 전술별 백업은 [데이터 이전 안내](production-readiness-20261014-data-transfer.md)를 따른다. Preview에서 자동 이전되거나 삭제 없이 모든 별도 서명본을 업데이트할 수 있다고 가정하지 않는다.
