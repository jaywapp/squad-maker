이 문서는 PR 요청 전 적용 단계의 과거 기록이다. 현재 권한·검증·Draft PR·T7는 [최신 실행 기록](brand-run-line-pr-20261008-tasks.md)을 따른다. 아래 검증 수치는 과거 결과다.

# 런 라인 브랜딩 작업·검증

orchestrator: Codex. 기준 main aa891870d9bb1649a7d64b507c232534e16cb6dd, branch feat/brand-run-line. 적용 사양과 에셋은 work/tasks/branding/를 따른다. root가 모든 파일을 순차 소유하고 독립 리뷰는 읽기 전용이다. 병렬 P1은 원 요청의 가능 그룹이며 실제 변경은 공유 상태·복사 원본 보존을 쉽게 확인하기 위해 순차 수행한다.

| id | orchestrator | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| T1 | Codex | Codex | gpt-6.1-sol | medium | 없음 | P1(실행 순차) | index.html | h1 유지·제공 SVG·favicon·28/32px·360px 배치 | 완료 |
| T2 | Codex | Codex | gpt-6.1-sol | medium | T1 | sequential | index.html, scripts/build-android-web.mjs, tests/e2e/brand-intro.spec.js | native/ready/탭/reduce/timeout·data-brand-intro·주석 오인 방지 | 완료 |
| T3 | Codex | Codex | gpt-6.1-sol | medium | 없음 | P1(실행 순차) | android/app/src/main/res/** | 참조 grep·제공 아이콘 동일·v24/PNG 잔재 없음 | 완료 |
| T4 | Codex | Codex | gpt-6.1-sol | medium | T3 | sequential | styles.xml, MainActivity.java, capacitor.config.json | 두 스타일 diff·SplashScreen 순서·배경·sync·unsigned 빌드 | 완료 |
| T5 | Codex | Codex | gpt-6.1-sol | low | 없음 | P1(위치 기록만) | work/tasks/branding/assets/preview/icon-store-512.png | 제공512 PNG 위치·원본 동일, 재생성 안 함 | 완료 |
| T6 | Codex | Codex | gpt-6.1-sol | high | T1,T2,T3,T4 | sequential | 테스트·번들·unsigned build/lint 산출물 | 아래 순서의 명령·통과/실패/skip·삽입 위치 | 완료 |
| T7 | Codex | Codex | gpt-6.1-sol | high | T6 | human | 아래 실기기 확인표 | 물리 기기·OS·런처와 실제 관측 | 대기 |

## 자동 검증 기록

| 순서 | 명령/검사 | 결과 |
|---|---|---|
| T4 준비 | npm run android:sync | 성공·Capacitor plugins2·기존버전 유지 |
| 1 | npm run test:unit | 95통과/0실패/0skip |
| 2 | npm run android:bundle | 성공·로컬export assets·analytics disabled |
| 3 | npx playwright test --project=desktop-1280 --workers=1 | 최종전체105통과/0실패/0skip (2.0분); 초기fixture1실패 보완 기록 아래 |
| 4 | npx playwright test --project=mobile-390 --workers=1 | 최종전체104통과/0실패/기존1skip (2.2분); 초기fixture1실패 보완 기록 아래 |
| 5 | cd android; .\gradlew.bat :app:assembleRelease :app:lintRelease --console=plain --no-daemon | 최초성공(39분7초·204tasks), lint0오류/8경고; 최종재확인 성공(2분11초·1실행/203up-to-date) |
| 추가 | 번들 intro 뒤/native adapter/원래 app script 순서 | 실제script DOM 순서·중복없음·ready 모두통과 |
| 추가 | 제공 assets 원본 동일·범위 밖 파일 무변경·기본 리소스 잔재 없음 | assets41/res17 SHA동일·18삭제·기본참조0 |

## T7 물리 기기 확인표

모든 행은 사람의 확인을 기다린다. 이번에는 서명 APK·배포를 만들지 않아 설치 검증을 하지 않는다. 기기·Android 버전·런처: **대기**.

| # | 확인 | 기대 | 상태 |
|---|---|---|---|
| 1 | 홈 화면 아이콘/마스크 | pitch 바탕·lime 점·점선·화살촉, 원/둥근 사각에서 잘림 없음 | 대기 |
| 2 | Android13+ 테마 아이콘 | 단색으로 같은 모양 | 대기 |
| 3 | 설정의 앱 아이콘 | 같은 아이콘 | 대기 |
| 4 | 프로세스 종료 후 첫 실행 | 단색→모션→앱, 흰 화면 없음 | 대기 |
| 5 | 모션 중 탭 | 즉시 완성 로고, ready 이후 종료 | 대기 |
| 6 | 동작/애니메이션 제거 | 정지 로고 짧게 표시 후 종료 | 대기 |
| 7 | 백그라운드에서 복귀 | 살아 있는 WebView는 인트로 재생 없음 | 대기 |
| 8 | 헤더 로고 | 선명·글꼴 변경 없음·버튼 겹침 없음 | 대기 |
| 9 | 시스템 단색 화면 시간 | 1초 넘으면 R3 검토·사용자 확인 | 대기 |
| 10 | Android7~11 호환 | 레거시 아이콘·compat 단색 정상 | 대기 |

T7은 목표 완료에서 제외된 대기 항목이다. R3/R4 문제가 확인되면 대안을 제시하고 사용자 결정 전에는 자산·동작을 변경하지 않는다.

구현 정적 확인: assets41개/적용 res17개 SHA256 원본 동일, intro 전체 byte 그대로 삽입. v24 foreground·기존 drawable background·foreground PNG5·splash PNG11(합18파일) 제거, 사용 참조0. styles diff는 지정한 두 style블록뿐, 기존 plugin3개 및 manifest/app ID/name/version/dependencies/data contract 유지. 저장 내보내기는 #field만 캡처(R5). 512 PNG는 제공 위치만 사용하며 재생성하지 않았다.

독립 리뷰의 초기 E2E fixture 지적(중첩 svg strict selector, ready의 State 반환)을 보완했다. 새7개 E2E는 pageerror도0인지 확인한다. 정적 문자열 개수 검사는 스니펫 주석을 실제태그로 세는 오류가 있어 제거했고 실제 script 위치는 DOM 회귀로 검증한다. 이 보완은 제품 자산이나 모션/색 결정 변경이 아니다.

T6 실행 기록(순차·foreground·workers1): unit95→bundle성공→desktop전체104통과/fixture1실패(4.9분)→수정된 brand-intro7개 desktop재검증7통과(23.8초)→mobile전체103통과/fixture1실패/기존1skip(3.3분)→수정된 초기로드 헤더 desktop/mobile2개 재검증2통과(49.5초)→unsigned assembleRelease/lintRelease 진행. 모든 변경은 관측 fixture뿐이며 제품을 반복 수정하거나 테스트 기대값을 완화하지 않았다. 최종 고유 E2E는209통과/기존1skip/미해결실패0이다. 최초 실패와 진단 근거는 analysis 및 .work/branding/ 로그에 남긴다.

기존 skip: guest-free-regression.spec.js의 전체패턴GIF는 인코딩 시간 절약으로 desktop-1280만 실행한다. 개별패턴GIF와 실제PNG/GIF번들·SQ·저장/복원·ID·touch·contract 회귀는 양쪽에서 통과했다.

T3의 assembleDebug는 자동 debug 서명 APK를 만들기 때문에 이번 사용자 서명APK 금지 범위에서 실행하지 않는다. 동일 리소스 컴파일·패키징은 필수 unsigned assembleRelease와 lintRelease로 확인한다. T7 설치/물리 확인도 대기이며 새 계정·서명키·시크릿 설정을 하지 않는다.

## 최종 전체 검증과 APK 리소스

fixture 보완 뒤 partial 재검증만으로 종료하지 않고 요청된 전체명령을 다시 순차 실행했다. desktop105통과/0실패/0skip(2.0분), mobile104통과/0실패/기존1skip(2.2분)으로 최종 전체209개가 통과했다. 이후 동일 unsigned assembleRelease/lintRelease를 캐시로 재확인한다. 단위95·bundle 성공 당시부터 제품 코드/자산은 동일하다.

최초 unsigned APK: android/app/build/outputs/apk/release/app-release-unsigned.apk, 7,141,697bytes, SHA256=7dc722bd34bff3caec22dec684a31950b226b7e49068aa877ebcd9f38cc6f63f. apksigner verify의 예상exit1(Missing META-INF/MANIFEST.MF)로 서명 없음 확인. sign 명령은 실행하지 않았다.

aapt2 실제 APK 확인: foreground는 default vector만 있고 v24 없음, mipmap foreground·drawable splash 없음, adaptive background/foreground/monochrome이 color/ic_launcher_background·drawable/ic_launcher_foreground·drawable/ic_launcher_monochrome을 참조한다. 배경은 #ff2b5e3f, brand_night/splash_background는 #ff141a16. legacy5density와 adaptive-v26가 함께 있다. Raw dump와 adaptive XMLtree는 .work/branding/apk-resources.txt, apk-adaptive-icon.txt에 기록했다.

release lint: 오류0, 경고8. 제공 colors_brand.xml의 brand_pitch/brand_chalk/brand_lime 미사용3개는 새 경고다. 자산 보존 지시에 따라 지우거나 색을 바꾸지 않는다. 나머지5개는 변경하지 않은 appcompat 버전 알림·activity_main/config/package_name/custom_url_scheme 미사용이다. 의존성 업그레이드와 범위 밖 삭제는 하지 않았다. Gradle의 flatDir2경고와 Capacitor unchecked javac 안내도 기록한다.

## 커밋/PR 초안 (실행하지 않음)

- commit: `feat: apply Run Line app branding`
- PR title: `feat: apply Run Line branding to header, icons and splash`
- PR body:
  - 사용자 선택 A 런 라인을 헤더·favicon·native 인트로·Android 아이콘과 시스템 스플래시에 적용한다. 제공 자산을 유지하고 h1.wordmark와 data-brand-intro 계약을 보존한다.
  - 기존 번들러가 인트로 주석의 script 문자열을 오인하는 문제를 고쳐 실제 app script 앞에 native adapter가 삽입되게 했다.
  - unit95, desktop105, mobile104+기존1skip, unsigned release와 lint(0오류/8경고)를 검증했다. 새 미사용색 경고3개는 제공 자산 보존 때문에 유지한다.
  - 서명·배포·실기기 설치는 보류하며 T7 물리 확인10항목은 대기다. 이름·ID·버전·OG·알림 아이콘·데이터계약·의존성은 유지한다.

## 완료 기준 근거

| 기준 | 근거 | 상태 |
|---|---|---|
| 웹 favicon/header/h1·web intro없음 | 양쪽 brand-intro E2E, 360/390/1280 초기배치·접근성·페이지오류0 | 완료 |
| native 최소1400/ready/tap/reduce400/max6000 | 공급snippet 그대로·양쪽6동작검증 | 완료 |
| adaptive/mono/legacy교체·기본잔재제거 | assets41/res17 SHA동일·18삭제·참조0·APK aapt2 확인 | 완료 |
| 시스템/창/WebView night 설정 | 두styles 비교·MainActivity install순서·config1키·compiled컬러확인 | 완료(실제흰깜빡임은T7대기) |
| unit/desktop/mobile/unsigned/lint | 최종전체105+104, unit95, 아래 마지막빌드 재확인 | 완료 |
| docs3/index/package상태 | 모두미커밋반영·PR번호미생성 | 완료 |
| 물리기기·R3/R4 확인 | 위T7표10행·기기/OS/런처 미확인 | 대기(목표제외) |

## 전체 변경 파일 목록


추가 (56개):

- android/app/src/main/res/drawable/ic_launcher_foreground.xml
- android/app/src/main/res/drawable/ic_launcher_monochrome.xml
- android/app/src/main/res/values/colors_brand.xml
- docs/brand-run-line-20261008-analysis.md
- docs/brand-run-line-20261008-design.md
- docs/brand-run-line-20261008-tasks.md
- tests/e2e/brand-intro.spec.js
- work/tasks/branding/01-design-spec.md
- work/tasks/branding/02-work-request.md
- work/tasks/branding/03-goal-prompt.md
- work/tasks/branding/README.md
- work/tasks/branding/assets/android/res/drawable/ic_launcher_foreground.xml
- work/tasks/branding/assets/android/res/drawable/ic_launcher_monochrome.xml
- work/tasks/branding/assets/android/res/mipmap-anydpi-v26/ic_launcher.xml
- work/tasks/branding/assets/android/res/mipmap-anydpi-v26/ic_launcher_round.xml
- work/tasks/branding/assets/android/res/mipmap-hdpi/ic_launcher.png
- work/tasks/branding/assets/android/res/mipmap-hdpi/ic_launcher_round.png
- work/tasks/branding/assets/android/res/mipmap-mdpi/ic_launcher.png
- work/tasks/branding/assets/android/res/mipmap-mdpi/ic_launcher_round.png
- work/tasks/branding/assets/android/res/mipmap-xhdpi/ic_launcher.png
- work/tasks/branding/assets/android/res/mipmap-xhdpi/ic_launcher_round.png
- work/tasks/branding/assets/android/res/mipmap-xxhdpi/ic_launcher.png
- work/tasks/branding/assets/android/res/mipmap-xxhdpi/ic_launcher_round.png
- work/tasks/branding/assets/android/res/mipmap-xxxhdpi/ic_launcher.png
- work/tasks/branding/assets/android/res/mipmap-xxxhdpi/ic_launcher_round.png
- work/tasks/branding/assets/android/res/values/colors_brand.xml
- work/tasks/branding/assets/android/res/values/ic_launcher_background.xml
- work/tasks/branding/assets/android/res/values/styles.xml
- work/tasks/branding/assets/preview/header-mobile.png
- work/tasks/branding/assets/preview/icon-store-512.png
- work/tasks/branding/assets/preview/logo-usage.png
- work/tasks/branding/assets/preview/splash-final-360.png
- work/tasks/branding/assets/preview/splash-preview.gif
- work/tasks/branding/assets/source/icon-background.svg
- work/tasks/branding/assets/source/icon-foreground.svg
- work/tasks/branding/assets/source/icon-monochrome.svg
- work/tasks/branding/assets/source/icon-store-512.svg
- work/tasks/branding/assets/source/logo-horizontal.svg
- work/tasks/branding/assets/source/logo-symbol-small.svg
- work/tasks/branding/assets/source/logo-symbol.svg
- work/tasks/branding/assets/source/splash-intro-reference.html
- work/tasks/branding/assets/svg/favicon.svg
- work/tasks/branding/assets/svg/icon-foreground.svg
- work/tasks/branding/assets/svg/icon-monochrome.svg
- work/tasks/branding/assets/svg/icon-store-512.svg
- work/tasks/branding/assets/svg/logo-header.svg
- work/tasks/branding/assets/svg/logo-horizontal.svg
- work/tasks/branding/assets/svg/run-line-symbol-small.svg
- work/tasks/branding/assets/svg/run-line-symbol.svg
- work/tasks/branding/assets/web/brand-intro.snippet.html
- work/tasks/branding/assets/web/favicon.snippet.html
- work/tasks/branding/assets/web/header-logo.snippet.html
- work/tasks/branding/tools/build-geometry.cjs
- work/tasks/branding/tools/geometry.json
- work/tasks/branding/tools/write-assets.cjs
- work/tasks/branding/tools/write-web.cjs

수정 (20개):

- android/app/src/main/java/com/jaywapp/squadmaker/preview/MainActivity.java
- android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
- android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml
- android/app/src/main/res/mipmap-hdpi/ic_launcher.png
- android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-mdpi/ic_launcher.png
- android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
- android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
- android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
- android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
- android/app/src/main/res/values/ic_launcher_background.xml
- android/app/src/main/res/values/styles.xml
- capacitor.config.json
- docs/README.md
- docs/pr-cleanup-20261008-tasks.md
- index.html
- scripts/build-android-web.mjs

삭제 (18개):

- android/app/src/main/res/drawable-land-hdpi/splash.png
- android/app/src/main/res/drawable-land-mdpi/splash.png
- android/app/src/main/res/drawable-land-xhdpi/splash.png
- android/app/src/main/res/drawable-land-xxhdpi/splash.png
- android/app/src/main/res/drawable-land-xxxhdpi/splash.png
- android/app/src/main/res/drawable-port-hdpi/splash.png
- android/app/src/main/res/drawable-port-mdpi/splash.png
- android/app/src/main/res/drawable-port-xhdpi/splash.png
- android/app/src/main/res/drawable-port-xxhdpi/splash.png
- android/app/src/main/res/drawable-port-xxxhdpi/splash.png
- android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml
- android/app/src/main/res/drawable/ic_launcher_background.xml
- android/app/src/main/res/drawable/splash.png
- android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png


## 완료 감사 (최종)

T1~T6 완료, T7의10행만 사람 확인 대기. 최종 전체 desktop105/0/0, mobile104/0/기존1skip, unit95/0/0, bundle·sync성공, unsigned assembleRelease/lintRelease 최종exit0(2분11초,204tasks=1실행+203up-to-date). 마지막 APK는 처음 확인한 SHA256과 동일하다. lint는0오류/8경고이며 새미사용색3개를 위에 기록했다.

보존 확인: h1.wordmark 및 data-brand-intro 유지, 공급 assets41개/applied res17개 SHA동일, source사양·툴 변경없음(패키지 README 상태만갱신), v24_foreground/oldforegroundPNG5/background/splashPNG11 제거, actual APK adaptive3층·default-only vector 및night/pitch컬러 확인. app·manifest·ID·name·version·OG·알림·dependency 무변경. 단위/bundle 완료 후 제품코드변경 없이 관측fixture만 수정했으며 최종 전체검증은 모두통과했다.

완료base SHA는 aa891870d9bb1649a7d64b507c232534e16cb6dd이다. 브랜딩의 새commit SHA/PR은 없으며 모든변경은 feat/brand-run-line의 미커밋 상태다. 전체변경은 추가56/수정20/삭제18, 제공패키지49파일을 포함한다. .work의 JDK/SDK산출물/로그와 node_modules는 Git제외다. 기존광고작업과 원본design/UI/native tree는 보존했다. 추가배포/Release없음, 자동배포중단 상태는 유지한다.
