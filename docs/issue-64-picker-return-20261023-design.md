# PR64 정상 파일 선택창 복귀 — 설계

orchestrator=Codex. 기존 [저장 광고 계약](issue-59-60-save-20261021-design.md)을 보존하는 native 경계 수정이다.

## 상태·흐름

1. 저장 준비 시작 때 기존 광고 근거를 폐기한다. 실제 picker launch 직전에 main thread에서 소유 staged token과 준비 epoch를 검증해 왕복을 arm한다. 준비 중 다른 공유/배경 전환이 있으면 새 권한을 되살리지 않는다.
2. picker transaction은 receipt epoch와 분리한다. launch→한 번의 예상 pause→결과/첫 resume→쓰기 상태만 허용한다. 결과가 먼저인 일반 순서와 resume이 먼저인 순서를 모두 처리하되, 별도 pause/반복 resume은 transaction을 폐기한다.
3. pause/resume은 기존 receipt를 항상 폐기하고 ready 표시를 지운다. 예상된 단 한 번의 picker 왕복만 transaction을 보존한다. resume의 UMP/광고 준비 상태 갱신은 실제 현재 자격을 다시 게시한다.
4. 파일 close 성공 순간 transaction token·쓰기 상태·foreground를 검사한 뒤 현재 ready 광고를 snapshot한다. transaction은 이 평가 한 번으로 끝난다. close가 resume/ready보다 먼저면 null로 확정하고 이후 재평가하지 않는다.
5. 첫 저장 영속 기록, MIME별 일회성 receipt, 1초 TTL·SDK 직전 재검사·실제 show만10분 기록은 유지한다. 광고 자격 bookkeeping은 파일 성공을 실패로 바꾸지 않는다.

공유/취소/새 저장/동의 clearAds/destroy는 transaction과 receipt를 함께 폐기한다. 준비 상태의 일시적인 null→같은 광고 갱신은 transaction 자체를 폐기하지 않지만 이미 발급된 receipt는 계속 무효화한다. 이 구분은 뒤늦은 load를 이미 완료한 저장에 붙이기 위한 대기 기능이 아니다.

준비 중 정상 광고 ready 변경이 launch 자격을 막지 않도록 preparation generation도 receipt epoch와 분리한다. 반면 pause/resume·공유·동의 초기화는 preparation을 무효화한다. worker close가 resume과 readiness 재게시 사이에 실행되면 안전하게 skip한다. 두 이벤트 사이를 기다리거나 완료된 저장을 다시 평가하지 않는다.

앱이 picker 때문에 이미 stopped인 동안 다른 앱으로 이동했다가 picker로 돌아오는 동작은 앱 Activity에 추가 이벤트를 만들지 않을 수 있다. 이 구현은 관측 가능한 별도 lifecycle·공유·취소 전환을 차단하며 외부 화면에서의 모든 사용자 이동을 판별한다고 보장하지 않는다. 실제 기기 검증 경계로 남긴다.

## 검증

- 먼저 현행 result→resume→close 실패를 순수 Java 협력 객체 테스트로 재현한다.
- 수정 후 실제 writer·첫 저장 정책·transaction·receipt를 함께 사용해 정상 순서, 역순/foreground 완료, close 선행 시 skip, 첫 면제, write/flush/close 실패·취소·공유·중복·추가 배경·재생성·동의 철회·후행 load·TTL을 검사한다.
- JS/unit, desktop/mobile E2E, Android bundle/sync·두 채널 Java/release/lint를 로컬 실행한다. 웹 소스 미변경 여부를 hash로 대조하고 최종 커밋에서 Android 버전/SHA를 재빌드한다.
- 리뷰는 별도 Codex 읽기 전용으로 받는다. 실제 Android framework/picker/SDK를 구동한 결과로 표현하지 않는다.

기기 설치·서명·운영 광고·병합·배포·CI 재활성화는 포함하지 않는다. 정확한 파일 변경과 검증 결과는 후속 보고에 기록한다.
