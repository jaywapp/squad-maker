# #61 공유 흐름과 광고 경계

## 흐름

- 텍스트: 기존 busy 진입 → 오래된 표시 기회 무효화 → URL/텍스트 생성 → busy 해제 → 기존 모달. 광고 로드/표시/닫힘을 기다리지 않는다.
- 파일 공유: 생성 → `destination=share` → 저장 광고 분기 우회 → 이전 광고 기회 무효화 → stage → 시스템 공유창. 완료는 `share-sheet-finished`이며 외부 전송 성공을 의미하지 않는다.
- 저장: GIF/SQ만 기존 생성 → 준비된 광고 → 파일 저장 순서를 유지한다. #60 구현 전 저장 순서를 이번 변경에 섞지 않는다. PNG 저장도 이번에는 기존 동작 유지.
- JS/native allowlist는 `gif`, `sq`만 허용한다. 기존 `share-text` 및 임의 placement는 skipped.

## 지연·동시 요청

기존 전역 export busy가 저장 광고 진행 중 공유 진입과 중복 내보내기를 막는다. 추가로 native 표시 요청에는 실행 기회를 기록하고 공유 시작/pause/destroy는 과거 요청을 무효화한다. 로드 콜백·resume에서는 표시하지 않는다. 무효화는 광고 시각·광고 설정·저장 데이터를 변경하지 않는다. 이미 SDK에 넘긴 광고를 임의로 강제 종료한다고 주장하지 않는다.

## 화면

기존 Operate 편집기·한글 브랜딩·색·글꼴·배치·버튼 유지. 광고 안내에서 단톡방 텍스트를 제외하고 파일 저장/공유를 구분한다. 새로운 화면이나 주요 UX 변경이 아니므로 3종 시안 절차 대상은 아니다. impeccable harden 및 design-taste-frontend의 기존 디자인 보존 원칙 적용. 디자인 변화/모션/밀도는 기존값 유지.

## 검증

JS bridge 및 Java 정책 단위 테스트, facade 기반 데스크톱/모바일 통합 테스트로 광고 상태별 공유 호출 0, 취소·실패·중복·회전·복귀·데이터 보존, 기존 저장 광고를 검증한다. Android bundle/sync·unsigned build·lint로 브리지/패키지/번들 참조를 확인한다. 물리 기기·실제 광고 SDK 전환은 별도 미검증으로 기록한다.

공식 근거: [AdMob 전면광고 제한](https://support.google.com/admob/answer/6201362?hl=en), [Android 전면광고](https://developers.google.com/admob/android/interstitial). 2026-10-21 열람. SDK main thread·캐시/닫힘 처리 및 예상하지 못한 외부/복귀 노출 방지를 검토한다. 정책 심사 통과를 의미하지 않는다.
