# #61 로컬 구현 결과

## 구현

기준 main `75d2f5476ce19288c20ace58283d7a7d83e6688a`에서 분리한 `fix/61-share-without-interstitial`이다. 텍스트 공유 광고 제거, PNG/GIF/SQ 공유의 저장 광고 우회, JS/native 공유 placement 거부, file share 중 직접 광고 호출 차단, 공유 시작·pause/resume/destroy 이후 queued 표시 요청 무효화를 적용했다. 무효화 응답이 실패하거나 오지 않아도 공유를 기다리게 하지 않는다.

이미 Google SDK에 전달된 표시를 강제 종료하는 기능이 아니다. 기존 앱 export busy가 활성 저장 광고 중 공유 진입을 막는다. 파일 공유 완료는 `share-sheet-finished`이며 실제 외부 전송 성공으로 집계하지 않는다. 원본 byte·MIME·권한·공유 URL·저장 데이터/형식을 유지한다.

## 이번 변경 기준 검증

| 검사 | 결과 | 증거 |
|---|---|---|
| JS 전체 단위 | 206 통과, 실패/skip 0 | `.work/issue-61-20261021/unit.log` |
| 공유·기존 저장 E2E (desktop1280/mobile390) | 38 통과 | `e2e-export-final.log` |
| 전체 desktop/mobile E2E | 455 통과, 기존 skip 1, 실패 0 (6.6분) | `e2e-full.log` |
| Android bundle/sync | 성공 | `android-sync.log` |
| Preview/production unsigned APK, production AAB | 성공, 광고 mode=test | `android-final.log` |
| Android Java 단위 | 채널별 57 통과, 실패/error/skip 0 | `android/app/build/test-results/` |
| Android lint | 채널별 오류0/경고4 | `android/app/build/reports/lint-results-*Release.txt` |
| 독립 읽기 전용 리뷰 | Critical/High 회귀 발견 없음, bridge64 재실행 통과 | #61 작업 기록/PR |
| UI detector | 기존350행 side-tab accent 경고1 유지. 이번 안내 수정과 무관 | `impeccable.json` |
| 실기기 | 미검증 | [체크리스트](issue-61-share-20261021-device-checklist.md) |

lint의 미사용 리소스는 기존 activity_main, Cordova config.xml, package_name/custom_url_scheme 네 항목이다. 원본/호환성 리소스 보존으로 유지했다. 기존 flatDir/Gradle deprecation·SDK legacy 태그 안내가 남는다. Java helper 테스트는 epoch 검사이며 실제 Plugin/Handler/Activity/SDK 통합 테스트가 아니다. 브라우저 회전/복귀도 viewport+합성 이벤트만 검증한다.

기존 skip 1개는 guest-free-regression의 GIF 인코딩을 모바일에서 중복 실행하지 않는 시간 절약 조건이다. 데스크톱 실제 인코딩 및 다른 모바일 GIF/공유 검증은 실행했다. 새 skip은 없다. 안내 문구는 데스크톱·모바일 캡처를 직접 확인해 기존 패널 안에서 줄바꿈·가로 넘침 없음이 확인됐다.

초기 E2E는 기존 광고 대기 중 busy 기대를 텍스트 모달이 열린 뒤에도 적용해 2건 실패했다. 기존 모달의 main inert 검증으로 바로잡아 38개 모두 재실행 통과했다. 초기 Android Java는 기존 ConsentAdPolicyTest가 share-text 허용을 기대해 1건 실패했다. 새 공유 제외 계약으로 정정 후 양 채널57개 통과했다. 실패 로그는 삭제하지 않았다.

최종 commit SHA와 commit 후 빌드 결과는 PR·이슈 댓글에 추가하며, 이전 SHA 검증을 새 코드 검증으로 표시하지 않는다. 로그·생성 산출물은 Git에 포함하지 않는다.

## 남은 경계

- #59 첫 저장 면제 상세는 [확인 댓글](https://github.com/jaywapp/squad-maker/issues/59#issuecomment-6308175693) 답변 대기. #60도 이에 의존한다. 이번 변경은 첫 저장 면제/PNG 저장 광고/저장 광고 순서를 구현하지 않았다.
- 별도 운영 광고 미커밋 worktree·code2 서명 산출물은 그대로 보존했다. 여기에 변경을 적용한 새 운영 산출물이나 출시 검증 완료를 의미하지 않는다.
- 기기 설치·실제 SDK 공유 전환은 미검증이므로 #61 전체 완료/자동 종료를 걸지 않는다.
- CI·자동 배포 비활성 유지. 병합·공개 배포·새키/서명·기기 설치·계정 설정 변경 없음.
