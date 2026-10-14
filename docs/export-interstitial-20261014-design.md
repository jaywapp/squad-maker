# 내보내기 전면 광고 설계

기존 vanilla JS·Capacitor·Google Mobile Ads 25.5.0 구성에서 SDK 전면 광고를 추가한다. 서버나 새 데이터 저장소는 필요하지 않다. 광고 후 보상을 지급하거나 완주를 강제하지 않는다.

## 제어 흐름

1. 앱이 준비되면 기존 테스트 배너와 별도로 전면 광고를 미리 로드한다. 로드 완료 자체로 표시하지 않는다.
2. GIF/`.sq` blob 또는 공유 텍스트·링크를 먼저 만든다. Android에서만 공통 `showExportAd(placement)`를 호출한다.
3. 플러그인은 placement 허용 목록, 10분 간격, foreground, 준비된 광고의 유효기간을 확인한다. 준비되지 않았거나 조건이 맞지 않으면 즉시 skipped를 반환한다.
4. 표시 가능한 광고는 한 번만 사용한다. promise는 닫힘/표시 실패에서 종료하고 원래 행동을 계속한다. 표시 실패는 광고 완료나 파일 저장 완료로 표현하지 않는다.
5. 실제 표시 시각은 광고 전용 SharedPreferences에 기록한다. 앱 재시작에도 세 형식 공통 간격이 유지된다.

## 인터페이스

- Native `prepareExportInterstitial()` → 사전 로드 요청. `showExportInterstitial({placement})` → `{status, reason?, testOnly:true}`. placement는 `gif`, `sq`, `share-text`만 허용한다.
- JS `SquadPlatform.showExportAd(placement)`는 native 플러그인 오류를 fail-open으로 처리한다. 웹은 unsupported다.
- `deliverExport()`는 GIF와 SQ만 광고 단계를 거친다. `openShare()`는 생성된 텍스트를 고정한 뒤 광고 종료 후 기존 모달을 연다. 복사·다운로드 버튼에서는 추가 광고를 요청하지 않는다.
- 생성/광고/전달 중에는 기존 export busy 상태로 중복 실행과 관련 변경을 막는다. 자동저장은 광고 호출과 분리한다.

## 화면과 검증

조기축구 코치가 쓰는 기존 Operate 화면을 유지한다. incumbent 다크 그린·라임·Pretendard 계열·기존 버튼/상태 영역을 그대로 사용하고 새 모션을 추가하지 않는다. 디자인 변화/모션/밀도는 기존값 유지이며 taste의 마케팅 페이지 요소는 이 편집기에 적용하지 않는다. 기존 패널에 표시 대상과 닫은 후 계속 진행된다는 안내를 둔다.

단위 테스트로 native 오류/미지원/호출 payload를 검증한다. 브라우저에서는 native facade를 사용해 결과 생성 → 광고 대기 → 정확한 blob 전달/텍스트 표시, 중복 탭·실패 통과·웹 및 PNG/자동저장 제외를 검증한다. Java 정책 테스트는 빈도와 캐시 만료 경계를 확인하고 Android release/lint는 SDK API 호환을 확인한다. SDK 수명주기·콜백은 코드 리뷰로 확인하며 실제 기기 검증과 구분한다. 브라우저 facade 성공을 실제 SDK 광고 노출 성공으로 표현하지 않는다.

공식 근거: [Android 전면 광고 구현](https://developers.google.com/admob/android/interstitial), [자연스러운 전환과 빈도](https://support.google.com/admob/answer/6201350?hl=en), [예상치 못한 광고 제한](https://support.google.com/googleplay/android-developer/answer/9857753). Google 테스트 전면 광고 ID만 사용하며 Play 출시 정책/동의 처리를 완료했다고 주장하지 않는다.
