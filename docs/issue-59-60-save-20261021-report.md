# #59·#60 구현·검증 보고

2026-10-22. orchestrator=Codex. 사용자 직접 확인으로 앱 데이터 기준 첫 성공 명시 저장 1회 면제를 확정했다. 승인 기록은 [분석](issue-59-60-save-20261021-analysis.md)을 따른다.

2026-10-23 후속: 정상 picker result→resume→close가 광고 근거를 잃는 PR64 P2를 수정했다. 아래 수치는 최초 구현 기록이며 [이번 수정·재검증](issue-64-picker-return-20261023-report.md)이 최신 결과다. 실기기 검증 완료를 뜻하지 않는다.

## 적용 결과

- PNG/GIF/.sq 명시 파일 저장은 대상 스트림 write·flush·close 성공 → 저장 완료 안내 → 이미 준비된 선택적 광고 순서다. 광고 실패/취소/응답 시간 초과는 파일 성공을 되돌리거나 다시 저장하지 않는다.
- 세 형식이 첫 성공 면제를 공유한다. 앱 전용 영속 기록으로 재시작 후 유지하며 기존 설치에 기록이 없으면 업데이트 후 첫 성공 저장을 면제한다. 실패/취소/공유/자동저장/.sq 복원은 소모하지 않는다. 형식·저장 데이터 키는 바꾸지 않았다.
- 10분은 전역이고 실제 SDK show callback에서만 한 번 갱신한다. 기존 UMP/연령·시계 역행·캐시 만료 보호를 보존했다. 운영 광고 설정이나 배너 위치를 바꾸지 않았다.
- 파일 성공 시점의 native 일회성 근거만 광고를 허용한다. 공유/새 저장/생명주기 변경/광고 교체는 근거를 무효화하고, 완료 후 1초가 지나면 최종 SDK 전달 직전에도 폐기한다. 준비/로드/복귀를 기다렸다가 표시하지 않는다.
- 첫 기록 commit 실패 시 해당 프로세스에서는 이후 광고도 skip한다. 중복 Documents callback은 파일 재쓰기와 면제 재소모를 막으며, 재생성 callback은 파일을 마칠 수 있지만 이전 광고를 복원하지 않는다.
- JS 광고 응답 대기는 30초로 제한했다. 응답이 없어도 편집기 busy를 해제하고 파일 성공을 유지한다. 이미 SDK에 전달한 광고 강제 종료나 실제 callback 이전 native activeShow 해제를 보장하지 않는다.

## 변경 파일 범위

| 영역 | 파일 |
|---|---|
| native 성공·일회성 근거·면제 | `SquadDocumentsPlugin.java`, `SquadAdsPlugin.java`, `ExportAdPolicy.java`, `ExportAdBridge.java`, `ExportAdReceipts.java`, `FirstSuccessfulSave.java`, `SavedDocumentWriter.java`, `DocumentSaveAttempts.java` |
| 웹/브리지 | `app/platform-native.js`, `index.html`의 내보내기 흐름·안내 |
| 검증 | Java 정책 테스트 6파일, `tests/unit/platform-native.test.js`, `tests/e2e/export-interstitial-20261014.spec.js` |
| 계약/기록 | 이 작업의 analysis/design/tasks/report/device-checklist, `docs/README.md`, `ui-state-save-export-contract-v2.md`, 과거 광고 설계의 최신 기준 링크 |

## 실제 로컬 검증

아래는 이번 변경 소스로 실행한 결과다. 과거 PR63의 206/455/57 결과를 재사용하지 않았다. 검증 후 문서만 보완하고 커밋하며, 최종 커밋 SHA·커밋 후 Android 재빌드 결과는 PR 본문/이슈 완료 댓글에 기록한다. E2E 실행 전후 관련 소스·테스트 65파일 SHA-256이 일치했다.

| 검증 | 실제 결과 | 근거 위치 (로컬, Git 제외) |
|---|---|---|
| 전체 JS unit | 216/216 통과, 실패/skip 0 | `.work/issue-59-60-20261022/unit.log` |
| 저장·공유 집중 E2E | 데스크톱/모바일 합계 56 통과 | `e2e-save.log` |
| 전체 E2E | desktop-1280/mobile-390 합계 473 통과, 기존 skip 1, 실패 0 (7.5분) | `e2e-full.log`, `test-results/`, `e2e-source-sha256.json` |
| Android bundle/sync | 성공, 로컬 내보내기 라이브러리·Capacitor App/Share 포함 | `android-sync.log` |
| Android Java unit | Preview 88/88, Production 88/88 통과, 실패/skip 0 | `android-final-source.log`, `android/app/build/test-results/` |
| unsigned release | Preview APK·Production APK·Production AAB 성공, 두 채널 모두 test 광고 모드 | `android-final-source.log`, `android/app/build/outputs/` |
| lint | 각 채널 오류 0·기존 경고 4, 합계 경고 표시 8 | `android/app/build/reports/lint-results-{preview,production}Release.{txt,html}` |
| 독립 리뷰 | 초기 및 최종 Java 경계 보강 리뷰에서 Critical/High 없음. 부모가 구현/검증 로그 재확인 | Codex 리뷰 세션·이 기록 |
| diff/참조 | `git diff --check` 통과, 생성 Gradle 파일은 내용 동일 확인 후 줄바꿈만 복구 | Git diff |

표의 로그 약칭은 `.work/issue-59-60-20261022/` 아래다. APK/AAB는 검증용 unsigned 산출물이며 설치용/배포용으로 제공하지 않는다. 키 접근·서명·기기 설치·실제 광고 요청은 하지 않았다.

### 기존 skip·경고 및 재실행

- skip 1: `guest-free-regression.spec.js`의 실제 GIF 인코딩을 시간 절약을 위해 desktop에서만 실행하는 기존 조건이다. 동일 케이스 desktop은 통과했고 이번 저장 광고의 GIF 흐름은 두 viewport에서 별도로 통과했다. 실제 Android GIF/picker 검증을 대신하지 않는다.
- lint 각 4건은 동일 `UnusedResources`: `activity_main.xml`, `config.xml`, `package_name`, `custom_url_scheme`이다. Capacitor 기본/호환성 리소스로 유지하고 이번 광고 변경에서 삭제하지 않았다. 중복 표시 합계가 8이며 서로 다른 8개 결함이 아니다. 기능 실패나 빌드 차단은 없지만 미사용 리소스 정리는 별도다.
- 첫 Android 실행은 `ConsentAdPolicyTest`의 이전 `gif/sq` 위치 기대값 1건이 실패했다. 새 `save-png/save-gif/save-sq` 계약으로 수정하고 전체 두 채널 unit/build/lint를 재실행해 통과했다. TTL 최종 전달 경계 테스트도 3개 추가했다.
- Gradle 캐시 쓰기 권한 제한으로 wrapper 시작이 한 번 실패한 뒤 기존 캐시 접근 권한으로 재실행했다. 새 키/환경 설정은 만들지 않았다.
- Gradle의 deprecated/flatDir 등 기존 빌드 경고는 유지했다. 의존성 업그레이드나 보안 취약점 해결을 주장하지 않는다.

## 검증 한계·다음 게이트

브라우저 광고 테스트는 `SquadPlatform` facade를 사용한 모의 결과이며 Java 테스트는 순수 helper 정책/스트림/상태 경계다. 실제 Android Documents provider, SharedPreferences 저장 매체, Activity 회전/재생성, SDK 광고 callback·기기 복귀는 **미검증**이다. 기기·OS 증거가 없어 #59/#60을 자동 종료하지 않는다. [기기 체크리스트](issue-59-60-save-20261021-device-checklist.md)를 다음 게이트로 남긴다.

이번 브랜치는 PR63의 공유 광고 제거 SHA `96a7543a07bf6589505dc7ebbe40f9b614fc7fb3` 위에 쌓는다. 후속 Draft PR base는 `fix/61-share-without-interstitial`이며 PR63을 선병합하지 않는다. `Refs #59, #60`으로 연결하고 실기기 미검증 상태에서 `Closes`를 쓰지 않는다.

main은 `75d2f5476ce19288c20ace58283d7a7d83e6688a`로 유지한다. 다른 live-ads 작업트리의 67개 미커밋 상태와 기본 폴더의 `.ux-review/`를 수정하지 않았다. 원격 push 전 repository Actions `enabled:false`와 수동 워크플로 4개 `disabled_manually`를 확인했다. 동적 Pages 항목은 active로 표시되지만 저장소 Actions 전체가 꺼져 있다. CI/자동 배포 설정을 변경하지 않는다.

병합·공개 배포·서명·기기 설치·운영 광고 실험·폴더 이동은 이번 결과에 포함하지 않는다.
