# iam-headcoach Preview 이름·참조 감사

2026-10-10, orchestrator=Codex, owner=Codex, model=gpt-6.1-sol, effort=medium. P4는 읽기 감사와 이 문서 작성만 담당했다. 시작 기준은 `feat/korean-branding-20261010`, HEAD `56372fdfd79b154aeb8ee6463ae6a9307e62e5f3`이다. root의 P3 표시명·현재 안내 변경과 병렬로 읽었으므로 아래 metadata는 해당 읽기 시점의 상태이며 최종 commit 검증을 대신하지 않는다.

현재 확정 기준은 [후속 분석](iam-headcoach-preview-20261010-analysis.md)과 [대응표·설계](iam-headcoach-preview-20261010-design.md)다. 기술명은 `iam-headcoach`, 정식 브랜드·웹 표시는 `아이엠 헤드코치`, 테스트 Android 표시명은 `아이엠 헤드코치 Preview`다. 원본의 PR47 선병합·상표 선행 조건과 이전 plain Android 결정은 이번 최신 지시의 gate가 아니다.

## 현재 변경 필요와 적용 상태

| 위치 | 필요한 상태 | 읽기 확인·판정 |
|---|---|---|
| `capacitor.config.json`의 `appName` | 아이엠 헤드코치 Preview | P3 병렬 적용 뒤 해당 값 확인. `appId`는 기존값 유지 |
| `android/app/src/main/res/values/strings.xml`의 `app_name`, `title_activity_main` | 아이엠 헤드코치 Preview | 두 값 확인. package_name·custom_url_scheme는 기존값 유지 |
| `package.json`, lock root·빈 경로 package 이름 | iam-headcoach | 세 위치 동일. scripts·의존성을 이름 정리 때문에 변경할 필요 없음 |
| `README.md`, `docs/README.md`, 현재 통합 안내 | 정식 브랜드와 Preview 채널 구분 및 새 대응표 연결 | root 소유. 날짜별 구결정을 현재 기준으로 읽지 않도록 후속 map 연결 필요. 문서 인덱스의 새 P4/P5 항목은 병렬 작성 파일 완료 후 링크 검증 필요 |
| `assets/branding/iam-headcoach` | iam-headcoach 파일명 9개·원본/라이선스 설명 유지 | 동일 사본과 README 모두 존재. 새 자산 이름 변경 필요 없음 |
| `tests/e2e/korean-branding-20261010.spec.js` | on-light 테스트가 제품 자산 3개 참조 | 제품 경로와 세 파일명이 일치. 코드·assertion 변경 불필요 |
| 웹 title·header·intro·ARIA, 진단 제목, release 표시 제목 | 공식 브랜드 plain, release 제목은 Preview 채널 | 기존 `아이엠 헤드코치` 및 `아이엠 헤드코치 Preview ${info.versionName}`가 역할에 맞음. 웹에 Preview를 붙이지 않음 |

표시명 3곳과 현재 안내 외에 이번 감사에서 추가로 바꿔야 할 실행 코드·import·CI·제품 자산 이름은 발견하지 않았다. Android manifest는 `@string/app_name`, `@string/title_activity_main`을 참조하므로 resource 이름 자체를 바꿀 필요가 없다.

## 남은 옛 이름과 경로의 분류

| 분류 | 대표 위치·값 | 유지 근거 |
|---|---|---|
| 설치·네이티브 호환 계약 | Gradle namespace/applicationId, Capacitor appId, strings package_name/custom_url_scheme, Java package의 `com.jaywapp.squadmaker.preview` | 표시 브랜드와 별개인 설치·업데이트·bridge 정체성. 사용자 rename 범위 밖 |
| 저장·파일·UI/native 계약 | `index.html`, `app/local-library.js`, `SquadStoragePlugin.java`, 관련 회귀의 `squad-maker-v1`, `squad-maker-library-v1`, `SquadMakerContract`, `squad-maker:state/result`, `SQUAD_MAKER_PREVIEW_POLICY` | 기존 데이터·구독·native 저장·편집 계약을 지킴. `.sq`, snapshot/library/schema 버전도 이름 변경 대상 아님 |
| 분석·feedback 내부 계약 | `SQUAD_MAKER_ANALYTICS_ID`, `__squadMakerBeforeSend`, API의 `__squadMakerFeedbackAttempts`, `squad-maker-feedback-relay` | 이벤트/분석 주입 및 요청·제한 처리의 식별자. 사람용 제품 표시가 아니며 범위 밖 변경 불필요 |
| 외부 주소·저장소 계약 | `jaywapp/squad-maker`, `https://jaywapp.github.io/squad-maker/`, `https://squad-maker.vercel.app/api/feedback`, OG 이미지 URL | 공유 열람·제보·배포·기존 다운로드와 연결된 외부 경로. README의 공유 뷰어 주소도 유지 |
| CI·APK 계보 | `squad-maker-production` concurrency, release repository/main gate, `squad-maker-latest.apk`, release marker, preview APK basename | 배포 대상·중복 방지·기존 게시물 관리·공개 다운로드 계약. 기술 npm name과 함께 자동 rename하지 않음 |
| 테스트의 합성 이름 | `tests/unit/platform-native.test.js`의 `Squad Maker`, E2E의 `Synthetic installed app` | getAppInfo 결과 전달·유효성 검사의 합성 fixture. 실제 앱 label의 근거가 아님. rename을 위해 기대값과 fixture를 함께 치환할 필요 없음 |
| 공급 원본·시안·라이선스 | `docs/branding/headcoach/assets/svg/logo-*.svg`, `wordmark*.svg`, `assets/web/*.snippet.html`, `docs/branding/run-line`, 폰트/OFL·tools | 제작 당시 원본·출처·생성 경로·승인 근거. 제품 사본과 대응표를 제공했으므로 원본 이름/내용은 보존 |
| 날짜별 과거 문서 | `docs/*-20261007-*`, `*-20261009-*`, 이전 `korean-branding-20261010-*`, 과거 UX 시안 | 당시 상태·결정·증거의 이력. 새 기준의 링크/주의 문구로 구분하고 원문을 전역 치환하지 않음 |
| 실제 루트 전환 대기 | `D:\station\repos\squad-maker`, `.worktrees\squad-maker-korean-branding-20261010`, 관련 gitdir·submodule 이름 | 현재 작업·세션·Git 연결 경로. 목적지 `D:\station\repos\iam-headcoach`를 정한 것과 실제 이동 완료는 별개. P5 절차/미확인을 따름 |
| 표준·업무 식별자 | `ic_launcher`, `ic_launcher_round`, Android resource 키·MainActivity·`:app`, `.squad-tabs`, snapshot의 `squads`, Capacitor 생성 파일명 | framework/전술 자료 구조 명칭이며 옛 제품 이름으로 일괄 분류하지 않음 |

API·build·CI·회귀 테스트의 옛 이름은 위 보존 계약을 검증하는 참조다. 이를 제거하려고 관련 테스트를 변경하면 실제 기존 계약을 검증하지 못할 수 있다. 광고·계정·환경 값·키는 감사하거나 변경하지 않았다.

## 날짜별 문서 원문 보존과 현재 안내

[product-plan.md](product-plan.md)는 기준일 2026-10-07 문서이며 맨 앞의 2026-10-08 실행 현황도 당시 기록임을 명시한다. 구 제목 `스쿼드 메이커`, 당시 미정 Android 스택, 당시 main/실행 상태를 현재 기술명에 맞춰 다시 쓰면 계획과 구현의 시점을 섞게 된다. 원문을 유지하고 제품 방향·미정 정책 참고로 연결하는 것이 맞다.

[current-web-reference.md](current-web-reference.md)는 main `e5877ddf198aaf54082d535a8c1894c346984973`를 기준으로 명시한 구현 참고다. 단일 저장·당시 테스트 명령·Android 미구현 설명은 날짜별 source 상태이지 이번 Preview의 현재 구현 설명이 아니다. 이름뿐 아니라 기능 상태까지 과거 자료이므로 원문을 유지한다.

root에 권고하는 현재 안내는 `docs/README.md`의 상품 방향 기준과 현재 실행/네이밍 기준을 구분하고, README의 현재 Android 안내에서 [새 대응표](iam-headcoach-preview-20261010-design.md)를 직접 연결하는 것이다. 이전 통합 문서의 plain Android 결정은 이력 표시와 최신 링크로 구분한다. 원본 PR47/상표 조건을 재승인 대기 gate로 되살리지 않는다. 법적 조사 완료나 사용 가능/불가를 선언하지 않는다.

## 제품 자산·참조 정적 검증

[제품 자산 README](../assets/branding/iam-headcoach/README.md)의 old→new 대응표로 원본 SVG 6개와 snippet 3개를 읽어 검증했다. 제품 파일 9개 모두 원본과 byte equality, SHA-256 equality, README 기재 원본 hash가 일치했다. 9개의 개별 hash·provenance·폰트/OFL 링크는 해당 README에 있다. 제품 README의 로컬 링크 **30개**는 검사 시점에 모두 존재했다. root의 현재 안내 링크 추가도 반영된 읽기 결과다.

on-light QA의 `assetDir`와 `iam-headcoach-header-on-light.svg`, `iam-headcoach-horizontal-on-light.svg`, `iam-headcoach-wordmark-on-light.svg` 세 참조가 모두 존재한다. npm 이름 3곳도 동일하다. `index.html`, `app/*.js`, `scripts/*.mjs`의 정적으로 명시된 로컬 src/href·relative import 대상 2개는 존재했다. npm scripts의 bundle/sync 명령과 `scripts/build-android-web.mjs`를 읽어 index→native bootstrap·vendor·app/licenses 복사 흐름이 제품 자산 외부 img rename을 요구하지 않음을 확인했다. 동적·원격 경로 가용성이나 모든 generated Android 내용의 실행 확인을 주장하지 않는다.

실행한 것은 read-only Git branch/HEAD/status 조회, 지정 source·문서 검색/읽기와 Node fs/hash/path 비교다. unit/E2E·빌드·서버·브라우저·sync·서명·설치·배포·Git 쓰기는 실행하지 않았다. source·원본·제품 자산·라이선스·테스트를 수정하지 않았다. 최종 SHA의 bundle/sync·APK label/ID·서명 부재·전체 회귀 검증은 root의 P7에서 새로 실행해야 한다.
