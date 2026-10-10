# iam-headcoach Preview 네이밍 설계·선행 대응표

최신 지시가 승인 A 원본의 과거 선행 조건과 이전 plain Android 결정에 우선한다. UI/색/geometry/intro lifecycle은 변경하지 않는다.

## 변경 전 → 변경 후

| 현재 값/경로 | 목표 값/경로 | 범위·영향 |
|---|---|---|
| capacitor.config.json appName: 아이엠 헤드코치 | 아이엠 헤드코치 Preview | Android 채널 표시만 |
| strings.xml app_name/title_activity_main: 아이엠 헤드코치 | 아이엠 헤드코치 Preview | launcher/설정/activity 표시·manifest ref 유지 |
| npm/lock root3곳: iam-headcoach | iam-headcoach 유지 | 의존성/scripts 변경 없음 |
| assets/branding/iam-headcoach/iam-headcoach-* | 동일9개 유지 | 공급 원본 byte equality, QA 자산 ref 유지 |
| README/docs index의 현재 Android 안내 | Preview 테스트 앱/정식 브랜드 구분 | 현재 안내만 갱신·historical source 보존 |
| 새 현재 네이밍/전환 문서 | docs/iam-headcoach-preview-20261010-* | 기술명 파일명, 상대 링크/index 연결 |
| D:\station\repos\squad-maker | D:\station\repos\iam-headcoach | 이동 안전성 점검·절차 준비, 현재 이동 미실행 |
| docs/branding/headcoach·run-line 및 과거 docs/worktree 명칭 | 기존 경로/내용 유지 | source provenance·시점/세션/Git 연결 |
| Android ID/Java package·서명·저장키/형식/.sq·광고 | 기존 값 유지 | 데이터/업데이트/bridge 보존 |
| GitHub/remote/배포/도메인/공유/APK basename | 기존 값 유지 | 명시 범위 밖·외부 계약 |

## 테스트 채널과 정식 이름

공식 브랜드/웹 title·헤더/인트로/accessibility는 **아이엠 헤드코치**, 기술명은 **iam-headcoach**. 현재 Preview Android 라벨3곳만 **아이엠 헤드코치 Preview**. 향후 정식 출시 승인 시 같은3곳의 접미사를 제거하고 bundle/sync·APK 실제 라벨·설치 호환성을 다시 검증한다. 이번에 production flavor/키/ID/배포 스위치를 추가하거나 release build에서 자동으로 접미사를 제거하지 않는다. 현재 assembleRelease도 테스트 채널 앱이다.

## 제어·검증

기존 manifest의 resource 참조→strings의 명칭 및 Capacitor appName을 유지한다. Gradle/version history·CI·imports·asset path는 변동이 필요한지 검사하고 이미 올바른 참조는 수정하지 않는다. 실제 APK aapt label/ID/code/name 및 apksigner의 서명 부재를 확인한다.

같은 최종 SHA의 unit/전체 desktop·mobile E2E/Android web bundle+sync/clean unsigned/lint를 순차 실행한다. 한글 header320/360/390/1280·CSS text200%·rotation/touchcancel/저장·SQ복원·PNG/GIF/공유는 기존 회귀를 유지한다. 라벨의 실제 launcher 잘림과 OS 글자 확대는 기기 미검증이다. 기존skip/경고와 온라인 버전 안내를 실제 새 보고서로 집계한다.

폴더 이동은 Git-aware submodule 구조와 기존dirty hub/linked worktree/세션·서버 cwd를 보존하는 절차로 분리한다. 파일명 문자열을 전역 치환하거나 과거 세션DB를 편집하지 않는다. 원격 rename·서명·배포와 묶지 않는다.
