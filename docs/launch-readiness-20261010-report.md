# Run Line·기본 기능 출시 준비 인계

작성일 2026-10-10. 브랜치 `feat/launch-readiness-20261010`, 기반 main `27a34ca97d5622d69effc46956ed23e9abb5a70a`. 이 문서는 출시 준비의 코드·검증 범위와 차단 요소를 인계한다. **최종 커밋 SHA와 그 SHA에서 새로 실행한 결과는 이 브랜치의 Draft PR 본문 및 `.work/launch-readiness-20261010/final/` 실행 기록을 따른다.** 커밋 전 부분 검증을 최종 검증으로 사용하지 않는다.

## 변경과 보존

- PR #47 head `e67e61dadd084cff934c3f3c5e0a811f9b02befb`의 승인 Run Line 자산만 파일별 대조해 통합했다. 공급 원본은 `work/tasks/branding/`에 보존한다. 이전 브랜치 전체 병합, 예전 버전 1002·전용 서명 도구·배포 설정·옛 편집기는 가져오지 않았다.
- 헤더·favicon·legacy/adaptive/monochrome Android 아이콘·단색 시스템 스플래시·native 인트로를 연결했다. 중복 축구공 favicon을 제거했다. 살아 있는 WebView 재진입은 인트로를 반복하지 않고, 탭은 모션만 마치며 저장소 ready 뒤 편집기를 연다. reduced-motion과 실패 시 최대 대기 종료를 회귀 검증한다.
- 웹은 `웹 개발본`, native는 기존 `@capacitor/app`의 실제 `name/id/version/build`를 도움말에 표시한다. 오래된 beta 날짜를 버전으로 쓰지 않는다. 조회 실패는 미확인으로 표시한다.
- 실제 touchcancel이 중간 좌표를 저장하던 결함을 수정했다. 이동 중 조회/revision에도 임시 좌표가 관측되지 않으며, 다른 완료된 팀/지침 편집·이전 undo·CAS 저장은 보존한다.
- 짧은 가로 화면은 번호·접근 가능한 전체 이름·선택 도구의 전체 이름을 보존하고 이름표 겹침을 줄였다. 작은 세로 화면의 도구는 피치 아래 흐름에 배치해 선수를 가리지 않고, 이름표 폭·선택 이름 줄바꿈을 화면 간격에 맞춘다. canonical 480×660 좌표, 저장 내용 및 독립 출력 장면을 바꾸지 않는다.
- native 제보는 localhost 상대 경로 대신 기존 공개 HTTPS API를 사용한다. server는 정확한 `https://localhost` CORS와 android platform을 지원한다. client/server timeout·404·non-JSON·provider 실패를 안전하게 표시한다. 실패 시 입력을 보존하고, 전송 중 새로 작성한 초안을 성공 후에도 지우지 않는다. 공개 GitHub Issue·선택 연락처/진단의 공개 가능성을 명시했다.
- native 공유는 실제 v1 수신 검증을 통과한 기존 GitHub Pages를 사용한다. URL 인코딩 실패 시 현재 페이지 주소를 성공 링크처럼 제공하지 않고 모달·복사·성공 이벤트를 중단한다.
- primary `.ux-review/`, PR47 작업 트리의 미커밋 3개, 광고 작업 트리의 12개 변경과 기존 서버를 보존했다. 광고 plugin/ID, package `com.jaywapp.squadmaker.preview`, 기존 Preview 표시 이름·서명·버전 규칙·의존성·배포 workflow는 변경하지 않았다.

## 실제 외부 서비스와 로컬 회귀의 구분

| 항목 | 관측 결과와 한계 |
|---|---|
| 기존 Vercel 주소 | HTTP 200이지만 현재 다른 영어 팀 편성 앱이며 이 저장소의 전술 viewer를 제공하지 않는다. 운영 API GET은 404 HTML, OPTIONS는 API CORS가 없다. 서비스 장애로 추정하지 않는다. |
| 기존 GitHub Pages | 과거 `565366114d4b10a6bc7928c24754910cadd97e15`의 v1 화면. 실제 Chromium에서 합성 전술의 팀·9명 이름/좌표·지침·읽기 전용·기존 두 저장키 sentinel 보존을 확인했다. 최신 편집 데스크·Run Line·library container가 배포됐다는 뜻은 아니다. |
| native facade E2E | 실제 생산 HTML, 터치·화면 회전·PNG/GIF/.sq와 공개 계약을 실행한다. Capacitor/App.getInfo·Turnstile·API/provider는 합성 fixture로 분리한다. 공개 이슈를 만들지 않았다. |
| Android 컴파일 | 기존 SDK/JBR/cache를 사용하는 unsigned 빌드와 lint다. unsigned APK는 설치용 산출물이 아니며 실제 WebView/OS 공유·설치 데이터 유지의 실행 증거가 아니다. |
| 실기기/에뮬레이터 | 실제 기기 테스트 및 Android 에뮬레이터 설치·실행을 수행하지 않았다. 모든 T7 runtime 항목은 미검증이다. Chromium 모바일 흉내를 실기기로 세지 않는다. |

## 최종 SHA 검증 절차·증거

1. 기능·자산·회귀·이 문서를 작업 브랜치에 커밋하고 SHA와 diff를 기록한다.
2. 해당 SHA에서 `npm run test:unit`, 전체 desktop/mobile E2E, `npm run android:sync`(bundle 포함), `:app:clean :app:assembleRelease :app:lintRelease`를 실행한다. 기존 JBR21/SDK36을 사용하며 서명·키 접근은 하지 않는다.
3. 기존 4317 서버를 보존하기 위해 로컬 전체 E2E는 ignored config에서 동일 프로젝트/fixture/timeout/workers1·retries0을 유지하고 새 4331 검증 서버만 사용한다. CI는 저장소 기본 `npm test`를 실행한다.
4. node_modules는 lock hash가 같은 기존 트리의 junction이다. sync가 이를 이웃 트리 경로로 생성하면 own `android/capacitor.settings.gradle`만 저장소의 정상 `../node_modules/` 경로로 정규화한다. 이웃 트리 파일과 의존성은 수정하지 않는다.
5. source SHA, 시작/종료·명령/exit, unit/E2E JSON·lint XML/HTML·unsigned APK metadata/hash·bundle manifest를 `.work/launch-readiness-20261010/final/`에 남긴다. 실패하면 기록을 보존하고 영향 검증을 재실행한다. 새 최종 코드에 이전 결과를 붙이지 않는다.
6. Draft PR CI의 merge-ref SHA는 branch source SHA와 구분한다. PR은 Draft이며 main push-only release job은 실행 대상이 아니다.

[휴대폰에서도 GitHub에서 볼 수 있는 UI 검토 화면](launch-readiness-20261010/evidence/README.md)을 코드와 함께 저장했다. 실제 Android 화면이 아니다.

선행 기능 증거는 `.work/launch-readiness-20261010/qa/`, `brand-feedback-qa/`, `share-errors-qa/`, `public-share-qa/`에 있다. 최초 touchcancel 실패, 중복 헤더 fixture 실패, 가로 이름 가림·세로 도구 겹침·선택 이름 잘림과 수정 후 재검증을 별도 보존했다. 최종 수치는 PR을 따른다.

UI detector 최종 수동 실행은 warning2/advisory7을 기록했다. uppercase 본문 경고와 긴 우측 작업 열의 첫 viewport 길이, 기존 border/shadow·피치 줄무늬에 대한 디자인 휴리스틱이다. 닫힌 화면의 실제 영문 uppercase 문장은 재현되지 않았으며 검사기 경고와 실제 화면 문제를 구분한다. 수평 스크롤 오류 판정이 아니며 승인된 편집 데스크/브랜드를 바꾸거나 경고를 suppress하지 않는다. 실제 화면·접근성 및 전체 기능 회귀는 별도 결과를 따른다.

### 기존 skip 1개와 lint 8개

기존 mobile `guest-free-regression.spec.js`의 전체 패턴 GIF 한 사례는 인코딩 시간을 줄이기 위한 desktop-only skip이다. skip은 삭제하거나 통과로 세지 않는다. 새 launch 회귀에서 양 프로젝트의 실제 전체 GIF binary/frame/delay와 상태·저장키 보존을 추가 확인한다. 동일 기존 skipped 사례 자체를 실행했다는 주장은 하지 않는다.

PR47의 8개는 그 브랜치의 결과였다: appcompat 업데이트 알림1, activity_main/config/package_name/custom_url_scheme 미사용4, 제공 색 brand_pitch/chalk/lime 미사용3. 이번 제품 리소스에서는 직접 쓰지 않는 3색 선언만 제외하고 승인 공급 원본은 그대로 보존했다. 다른 기존 생성·문자열 리소스 및 의존성은 보존했다. 새 기준 main의 이전 lint13/CI15나 PR47의8을 최종 수치로 재사용하지 않으며, 최종 clean lint의 issue ID/위치·영향을 PR에 기록한다. warning suppress나 범위 밖 업그레이드는 하지 않는다.

## 출시 차단 요소·사용자 결정

1. **정식 표시 이름 미확정:** 추천 `스쿼드 메이커`, 승인 영문 로고 `SQUAD MAKER`. 질문에 답변이 없어 Android 표시 이름 `스쿼드 메이커 Preview`는 보존했다. 이름·Preview 접미사를 승인 뒤 일관되게 적용하고 영향 검증해야 한다.
2. **운영 웹/API 호스팅·제보:** 현재 API404. 정식 도메인/실제 저장소 연결과 배포 승인, Android Turnstile hostname·토큰·접수 확인이 필요하다. 기존 Pages의 v1 수신 확인은 API 또는 새 브랜드 배포를 대신하지 않는다.
3. **개인정보·지원:** 운영자·문의처·데이터 흐름·보관/삭제/공개 Issue 정책·정식 처리방침 URL·SDK 권한/Data safety가 미정이다.
4. **첫 출시 광고:** 포함 여부/형식/빈도/대상/동의가 미정이다. 기존 테스트 광고와 별도 광고 작업을 보존했다.
5. **Play AAB·서명/패키지 전략:** Preview 업데이트와 Play 등록·App Signing/upload key 관계를 결정해야 한다. 새 key/account/auth·AAB 제출·서명 APK·실기기 설치는 이번 작업에서 수행하지 않는다.
6. **T7:** 기기 모델·Android OS·런처, 설치 앱의 공개 package/version/certificate, 외부 백업을 확인한 뒤 승인된 후보 APK로 검증해야 한다. 실제 기기·Android7~11 runtime은 미검증이다.

세부 출시 및 T7 절차는 [별도 체크리스트](launch-readiness-20261010-release-checklist.md)를 따른다. main 병합·공개 배포·Play 제출은 별도 승인 전 실행하지 않는다. Main APK release workflow는 기존 active 상태를 보존하며, main을 변경하지 않아 새 공개 APK가 만들어지지 않는다. Vercel 자동 배포는 disabled_manually 상태를 보존한다.

## 폰에서 확인할 5개

모두 향후 확인이며 **현재 실기기 미검증**이다.

- 홈·설정 아이콘과 테마 아이콘의 모양/잘림.
- 프로세스 종료 후 첫 실행의 시스템 스플래시→인트로→편집 화면.
- 인트로 중 탭했을 때 모션 종료 및 저장 데이터 준비 전 편집 차단.
- 다른 앱에서 복귀 시 인트로 반복 없음·상태 유지.
- 백업한 모든 팀/전술 목록·이름·개수·내용이 업데이트/재시작 후 유지됨.