# PR64 P2 파일 선택창 복귀 — 실제 검증 보고

2026-10-23. orchestrator=Codex. [리뷰 P2](https://github.com/jaywapp/squad-maker/pull/64#issuecomment-6336149076)의 정상 picker 결과→resume→close 경합을 보수했다. 기존 `bd38aad` 위의 같은 브랜치·Draft PR64에서 진행했으며, 최종 SHA/커밋 후 재빌드 결과는 PR 본문과 완료 댓글에 기록한다.

## 수정

- `ExportAdReceipts.java`: 소유 문서 token의 picker 왕복 상태와 광고 receipt epoch를 분리했다. staging용 generation도 광고 readiness 변경과 분리한다. 예상된 한 번의 pause·결과/첫 resume만 보존하고 별도 전환은 폐기한다.
- `SquadDocumentsPlugin.java`: 실제 main-thread picker launch와 arm을 같은 runnable에서 처리한다. 결과 순간 epoch를 고정하지 않고 owned token을 전달한다. 파일 close 성공 순간 transaction을 단일 소모해 현재 foreground·ready 광고를 평가한다. 실패/취소/복원/중복은 광고 권한을 만들지 않는다.
- `SquadAdsPlugin.java`: 정상 picker 왕복을 구분하는 `pause/resume`을 호출한다. 이미 발급된 receipt는 항상 폐기하며 UMP/clearAds/destroy·공유 취소 경계는 그대로 유지한다.
- `DocumentPickerLifecycleTest.java`: 실제 저장 writer·첫 저장 정책·DocumentSaveAttempts·receipt를 함께 쓰는 협력 객체 테스트 17개를 추가했다. main/worker queue와 close latch로 실행 순서를 제어하며 receipt를 사전 mock하지 않는다.
- 새 분석/설계/작업표/보고·문서 인덱스와 기존 설계/계약/기기 체크리스트를 갱신했다. UI·저장 데이터·.sq·광고 ID·버전 규칙·서명·배포 설정은 변경하지 않았다.

## 재현과 실제 로컬 실행

로그 경로는 `.work/issue-64-picker-20261023/`이며 Git 제외다. 이전 2026-10-22 결과를 이번 결과로 재사용하지 않았다.

| 항목 | 실제 결과 | 증거 |
|---|---|---|
| 기존 코드 실패 재현 | 준비된 광고·결과→resume→close에서 receipt null, 기대 assertion 실패 1건 | `red-lifecycle.log`, `red-test.java`, `red-test-result.xml` |
| 수정 후 Java | Preview/Production 각각 105/105 통과, 실패/skip0. 신규 협력 객체17 포함 | `android-final-source.log`, `android/app/build/test-results/` |
| JS 전체 unit | 216/216 통과, 실패/skip0. 기존 JBR21 지정 | `unit.log` |
| 전체 desktop/mobile E2E | 473 통과·기존 skip1·실패0, 7.3분 | `e2e-full.log`, `test-results/` |
| E2E 소스 대조 | 이번 실행 전후 웹/테스트65파일 SHA-256 일치 | `e2e-source-sha256.json`, `verify-current.cjs` |
| Android bundle/sync | 성공, App/Share 플러그인과 로컬 웹 번들 확인 | `android-sync.log` |
| unsigned release | Preview/Production APK 및 Production AAB 성공, test 광고 모드 | `android-final-source.log`, `android/app/build/outputs/` |
| lint | 각 채널0오류/기존4경고 | `android/app/build/reports/lint-results-{preview,production}Release.txt` |
| 독립 읽기 전용 리뷰 | critical/high 미발견. resume와ready 재게시 사이의 보수적skip 경계 지적 후 해당 테스트 추가 | Codex 리뷰 세션·신규17번째 테스트 |
| Git diff | `git diff --check` 통과. sync 생성 Gradle 파일은 내용 동일 확인 후 줄바꿈만 복구 | Git diff |

검증 실행은 로컬이며 CI 통과가 아니다. APK/AAB는 unsigned 검증 산출물이며 설치/배포하지 않았다. 키·자격증명을 읽거나 생성하지 않았다.

### 신규 협력 객체 검증 범위

정상 result→resume→close는 writer close latch를 사용해 실제 바이트 저장 뒤 유효한 단일 receipt를 얻는다. resume→result 및 pause 없는 foreground 결과도 검사한다. close→resume, resume→close→ready 재게시, no-fill→나중 load는 파일 성공을 유지하되 광고를 재평가하지 않는다.

staging 중 일반 ad 교체는 launch를 막지 않고, staging 중 background/share는 arm을 막는다. 추가 pause/resume, 공유/취소/동의 초기화·destroy가 사용하는 무효화 API, read/write/flush/close 실패, 첫 성공 면제, 복원 callback, 중복 결과의 busy·파일 수, preference 지연 TTL, 새 저장/광고 교체 이후 폐기, 세 MIME 공통 cooldown을 검사했다. 실제 SDK show 콜백은 구동하지 않았으며 기존 show-only 갱신 코드는 수정하지 않았다.

### 기존 skip·경고

- skip1은 `guest-free-regression.spec.js`의 중복 GIF 인코딩을 모바일에서 생략하는 기존 조건이다. desktop 실제 GIF 및 별도 mobile GIF 흐름은 통과했다. 기기 인코딩 증거로 간주하지 않는다.
- 동일 Capacitor 리소스 `activity_main`, `config`, `package_name`, `custom_url_scheme`의 UnusedResources 4개가 채널별로 표시된다(합계 표시8). 호환성 리소스를 이번 작업에서 삭제하지 않았다. 오류0이며 기존 flatDir/Gradle deprecated 경고도 유지했다.
- 초기 red 실패는 결함 재현 목적이며 숨기지 않았다. 수정 후17개 및 양 채널 전체105개에서 실패0을 확인했다.

## 남은 미검증·안전 경계

이 테스트는 Android framework·실제 Documents provider·ActivityResultLauncher·UMP/광고 SDK를 구동한 실기기/에뮬레이터 검증이 아니다. **실기기 미검증**으로 남기고 [추가 기기 절차](issue-59-60-save-20261021-device-checklist.md)를 따른다. 실제 기기에서는 SHA·기기/OS/provider와 테스트 광고 상태를 함께 기록해야 한다.

close가 resume/ready보다 빠르거나 두 이벤트 사이에 끼면 광고를 보수적으로 skip한다. close부터1초 TTL·공유/별도 배경·동의 차단을 유지하고 대기 타이머나 다음 복귀 재생을 추가하지 않았다. 앱이 picker로 이미 stopped인 동안 외부에서 일어난 모든 이동을 관측할 수 있다고 보장하지 않는다.

main/PR63 미병합, Draft·기존 base 유지. 운영 광고 미커밋 작업트리67개와 기본 폴더 `.ux-review/`를 보존한다. repository Actions 전체 비활성 및 수동 workflow 비활성을 유지하고 서명·설치·운영 광고 테스트·공개 배포는 하지 않는다. P2의 로컬 회귀 수정과 실제 기기 완료 조건을 구분하며 이슈를 자동 종료하지 않는다.
