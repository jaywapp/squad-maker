# Google Play 업데이트 로컬 구현·검증 결과

2026-10-14. 제보 기능 보강과 Vercel/Supabase 준비는 사용자 지시로 **취소**했다. 이번에 추가했던 제보 UI/client 변경을 원복했고 기존 API/client/제보 UI/Issue Template/플랫폼 설정에 내용 diff가 없다. 실제 Issue 생성·DB 연결·배포·API 복구는 수행하지 않았다. 앞선 플랫폼/저장소 질문은 철회한다.

이 문서는 최초 로컬9e+미커밋 단계의 실제 검증 기록이다. 이후 사용자가 commit/push/main merge/배포 준비를 승인했으며 [후속 계획](play-updates-merge-prep-20261014-analysis.md)과 [수동 출시 게이트](play-updates-merge-prep-20261014-release-checklist.md)를 따른다. 이후 발견한 cold-start version metadata 회귀와 새 commit source 검증은 해당 단계에서 별도 기록한다.

## 작업 위치·소스 기준

- worktree: `D:\station\.worktrees\iam-headcoach-updates-feedback-20261014`
- branch: `feat/updates-feedback-20261014` (처음 요청의 이름을 유지하며 폴더/브랜치 이동하지 않음)
- HEAD 및 마지막 원격 main 확인: `9e41887532f59606d87924346dcbc4957446a098`
- 변경은 **미커밋**이다. 이 결과는 main9e의 변경 없는 APK나 새 commit/CI 결과가 아니다. 최종 source delta 및 APK/AAB SHA-256은 `.work/updates-feedback-20261014/final-build-manifest.json`에 기록했다.
- identity 원본 worktree의21파일 해시와 HEAD9e/status21항목은 유지했다. 원본에 대한 수정/빌드/서버 종료는 없다. inherited identity/TEEN 보호는 검증 사본으로 재사용했다.
- commit/push/PR/merge/공개 Release/Play 제출/서명 APK/키 생성·변경/기기 설치를 하지 않았다. GitHub Actions repository enabled=false, 저장소4개 YAML workflow disabled_manually를 확인했다. 동적 Pages workflow의 표시가 active여도 Actions repository 자체가 비활성이다. workflow와 원격 배포 설정을 변경하지 않았다.

## 이번 고유 변경 파일

| 범위 | 파일·역할 |
|---|---|
| native 연결 | `android/app/build.gradle` app-update2.1.0 한 줄, `MainActivity.java` plugin 등록 한 줄 |
| flexible SDK | `SquadUpdatesPlugin.java`, `FlexibleUpdatePolicy.java`: 정확한 package/release/Play 출처, FLEXIBLE만 실행, 취소/닫기/수동 재시도/복귀/조회 race 보호 |
| 저장 증명 | `SquadStoragePlugin.java`, `VerifiedStorageReceipt.java`: 기존 AtomicFile write/readback에 메모리 전용 receipt·generation 추가. 기존 데이터 형식/키 변경 없음 |
| web/native 계약 | `app/platform-native.js`, `app/update-controller.js`: 허용 상태/필드, opaque receipt, user-triggered start/complete, 중복·취소·구세대 차단 |
| UI·저장 보호 | `index.html`: 도움말 업데이트 안내, save queue→최신 write→snapshot/revision/file/receipt 재확인, 모달 닫기 중 잠금 보존. 320px/200% 제목·닫기 버튼 잘림 보정은 도움말에만 적용 |
| Android 자산 | `scripts/build-android-web.mjs`: update-controller 필수 복사 및 누락 시 실패 |
| 검증 | 새 Java test2개, `tests/unit/update-controller.test.js`, `tests/unit/platform-native.test.js`, 새 `tests/e2e/play-updates-20261014.spec.js`/`play-updates-layout-20261014.spec.js` |
| 문서 | play-updates의 analysis/design/tasks/device-checklist/report 및 docs/README 인덱스 |

inherited21파일에는 정식 identity/청소년 광고 보호 code·tests·docs가 포함된다. 이번 고유 변경과 혼동하지 않는다. `android/app/build.gradle`/`docs/README.md`는 inherited 내용 위에 scoped 한 줄/문서 인덱스를 추가한 겹치는 파일이다.

## 빌드별 실제 결과

| 빌드 | 표시명 | 실제 package | versionName / versionCode | 광고/업데이트 |
|---|---|---|---|---|
| Preview release | 아이엠 헤드코치 Preview | com.jaywapp.squadmaker.preview | 0.1.0-preview.1.main.100.9e418875 /1102 | 테스트 광고 유지, Play SDK 요청 없음, Releases 정보 링크만 |
| 정식 release | 아이엠 헤드코치 | com.jaywapp.iamheadcoach | 1.0.0 /1 | 이번 검증은 테스트 광고, 실제 운영 광고 차단 유지; Play로 설치한 경우에만 flexible |
| 웹 | 아이엠 헤드코치 | 해당 없음 | 웹 개발본 | native Play 호출 없음 |

두 APK의 실제 badging/4-byte alignment를 확인했다. minSdk24/targetSdk36이다. 두 APK는 의도적으로 unsigned이며 apksigner는 exit1/`Missing META-INF/MANIFEST.MF`로 서명이 없음을 확인했다. 서명 인증서나 설치 업데이트 호환성을 검증한 APK로 보고하지 않는다.

산출물은 `android/app/build/outputs/apk/{preview,production}/release/`와 `android/app/build/outputs/bundle/productionRelease/app-production-release.aab`다. 두 APK의 실제 `assets/public/index.html`, `app/update-controller.js`, `app/platform-native.js`를 최종 번들 바이트와 비교했고 저장 보호·최종 viewport 보정이 들어 있음을 확인했다. AAB도 update-controller 바이트가 일치한다. 설치·공개 전달용 서명 빌드는 아니다.

## 실제 검증과 실행 기준

| 검사 | 결과 | 기준·증거 |
|---|---|---|
| JS unit | **199/199**, fail/skip0 | 최종 code, JBR21 환경; `.work/updates-feedback-20261014/unit.log` |
| 전체 desktop/mobile E2E | **443 pass /1 skip** | 현재 브랜치 local 변경의 전체 회귀; `e2e-full.log`. 아래 도움말 CSS 후속 수정 이전 결과임을 구분 |
| 최종 수정 영향 E2E | **72/72**, skip0 | 마지막 도움말 CSS 수정 후 update/layout/ux-fix/ux-pattern 두 viewport 재실행; `e2e-final-affected.log`. 저장·모달·드래그·회전·복원 영향 확인 |
| 업데이트 기능 E2E | **34/34** | 위 최종72에 포함. latest save/reload, cancel/offline, no file/readOnly/drag/export, changed receipt/version/revision, timeout/늦은 write 보존 |
| 레이아웃/HTTP | **8/8** | 위 최종72에 포함. 1280×800/390×844/320×568+200%/844×390, 두 브라우저 preset; 실제 close/restart 버튼 범위·HTTP200 |
| Android bundle/sync | 통과 | 최종 HTML/bridge/controller; `android-sync.log` 및 실제 APK/AAB 자산 비교 |
| native compile/unit | 통과; **49/49 각 release 채널** | SDK2.1 실제 compile 및 Java XML. 새 update/receipt 순수 정책20개 포함. Java 변경 이후 성공했으며 후속 HTML-only rebuild에서는 test task up-to-date |
| unsigned release | Preview APK/정식 APK/정식 AAB 성공 | 최종 자산 sync 후 Gradle271tasks(53executed/218up-to-date); `android-release.log` |
| Android lint | **두 채널 error0, warning4씩** | `android/app/build/reports/lint-results-{previewRelease,productionRelease}.xml/html` |
| diff/원본 보존 | 통과 | scope diff/원본21sha/원격 main9e/미커밋 상태 재확인 |

실행은 `.work/updates-feedback-20261014/playwright.local.config.js`의4327 포트를 사용했다. 기존4317/4318/4319를 재사용·종료하지 않았다. 자체 테스트 서버는 Playwright가 정상 종료했다. 이전 commit/CI 검증으로 이번 결과를 대신하지 않았다. CDNs smoke는 기존 별도 config 대상이라 이번 전체 기본 E2E에 포함하지 않았다.

처음 JS unit은 기본 PATH의 Java25와 Groovy3의 class version69 충돌로 실패했으며 JBR21을 명시해 해결했다. 처음 Android compile은 새 worktree의 미sync 생성 파일 부족으로 실패했고 android:sync 뒤 성공했다. 첫 새 shared-view test는 hash-only navigation이 문서를 다시 초기화하지 않아 실패했으며 실제 share-url+reload 방식으로 수정했다. 추가한 큰 글자 close 검사는 모바일 fixed modal369px/visual viewport320px 불일치를 찾아 scoped100vw 제한 후 통과했다. 실패를 성공으로 대체하거나 숨기지 않는다.

## skip·경고

- 기존 E2E skip1: `guest-free-regression.spec.js`의 GIF 인코딩은 실행 시간 절약을 위해 desktop에서만 수행한다. mobile 자체 GIF 인코딩의 해당 중복 case는 미실행이다. 다른 GIF/내보내기·광고 실패 회귀와 desktop 실제 인코딩은 실행했다.
- lint 각4개/합계8: `activity_main` layout, Cordova `config` XML, `package_name`, `custom_url_scheme` 문자열의 UnusedResources다. 기존 Capacitor/Cordova 생성 자산 및 호환성 이름이며 이번 범위에서 삭제하지 않았다. 빌드 오류는 아니고 일부 자산 크기 경고다.
- 기존 Gradle flatDir metadata/Gradle9 deprecation, http-server DEP0066와 색상 env 경고가 남는다. 의존성 업그레이드/광범위 정리는 하지 않았다.
- 추가 `-Xlint:deprecation` 진단에서는 기존 광고 보호 helper의 deprecated AdMob legacy tag 사용6건과 새 update plugin의 `getInstallerPackageName`1건을 확인했다. 후자는 Android24~29에서 설치 출처를 읽는 호환성 분기이고30+는 getInstallSourceInfo를 사용한다. 경고를 숨기거나 더 강한 기존 광고 보호를 제거하지 않았다. `compiler-warnings.log`에7건을 구분해 기록했다.
- Impeccable detector는 기존 line350의 warn callout `border-left:3px`1건을 표시했다. 새 업데이트 UI 결함이 아니므로 기존 디자인을 보존했다. 실제 UI 캡처/버튼 접근성 검증을 별도로 수행했다.
- npm 설치는 offline/ignore-scripts로 수행했다. offline audit0을 새로운 운영 취약점 점검 완료나 과거 advisory 해소로 해석하지 않는다.

## 미검증·별도 승인 대기

실제 Play 업데이트/사용자 계정 소유권/동일 서명·higher versionCode/Activity 재생성/Android 실제 저장·회전·재시작은 **실기기 미검증**이다. Google 공식 테스트 조건을 따르는 두 Play 설치 빌드·테스트 계정/기기·업로드 승인이 필요하다. [실기기 체크리스트](play-updates-20261014-device-checklist.md), [공식 조건](https://developer.android.com/guide/playcore/in-app-updates/test).

Preview→정식은 다른 package이므로 자동 데이터 이전으로 보고하지 않는다. 사용자 .sq 백업→정식 복원→수정·저장→재시작 유지가 실제 출시 기기 검증에 남는다. 현재 브라우저 fixture에서는 해당 기본 저장·복원·재시작 회귀가 통과했다.

Play App Signing/업로드 키 실제 구성, 앱 등록/테스트 트랙, 정책 공개 URL·Data safety/AdMob 처리·청소년 보호 실제 절차·광고 계정 인증/심사는 기존 출시 항목이다. 코드의 광고 연결을 실제 운영 광고 활성화로 보고하지 않는다. Play Core 데이터 처리의 정책 대조도 체크리스트에 추가했으며 개인정보·스토어 양식을 제출하지 않았다.

기존 제보 API의 읽기 전용404 확인은 복구 완료가 아니다. 사용자가 제보 보강·플랫폼 작업을 취소했으므로 해당 상태를 이번 업데이트 완료 범위에 포함하지 않는다. 실제 접수/외부 Issue 테스트는 수행하지 않았다. 기존 기능 자체 제거/다른 접수 체계 도입은 별도 요청 범위다.
