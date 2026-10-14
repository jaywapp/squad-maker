# 청소년 광고 보호와 미확정 운영 광고 차단 설계

2026-10-14. orchestrator=Codex. 사용자 승인에 따라 개인화 OFF·G·청소년 보호만 구현한다.

## 요청 설정

기존 RequestConfiguration.toBuilder()로 test device 등 무관한 값을 보존한다. 기본 age treatment는 TEEN이며 기존 CHILD, 기존 TFUA=true, 기존 TFCD=true, 테스트 구성의 underAge=true 중 하나라도 있으면 CHILD를 적용한다. PPT는 DISABLED, 최대 광고 콘텐츠 등급은 G로 설정한다. underAge=true일 때만 기존 TFUA를 true로 강화하고 false 입력은 기존 TFUA 값을 유지한다. 연령 인증·동의 완료를 새로 추정하지 않는다. NPA extras는 추가하지 않는다.

기존 MobileAds.initialize 전 및 배너/전면 load 직전의 applyRequestPrivacy() 연결을 유지한다. SDK 버전 업그레이드는 필요하지 않다. 근거: [Google 요청 설정](https://developers.google.com/admob/android/targeting), [연령 처리](https://support.google.com/admob/answer/6219315?hl=en), [PPT/NPA 차이](https://support.google.com/admob/answer/14323214?hl=en).

## 운영 광고 차단

실제 연령/동의 처리 모델은 아직 없다. 임의 approved/age 플래그나 -P 우회 옵션을 만들지 않고 모든 production 광고 모드를 Gradle 구성/variant 정책에서 거절한다. 테스트 광고의 productionRelease는 계속 허용한다. 테스트 모드 UMP boolean 파서는 유지한다. 운영 모드는 누락/true/false 모두 연령·동의 처리 미확정 오류로 차단하여 값을 입력하면 활성화된다는 오해를 피한다.

네이티브 ConsentAdPolicy는 BuildConfig.ADS_TEST_ONLY를 생성자로 받는다. false이면 UMP 갱신·폼·동의 허용·광고 사용을 차단한다. 따라서 개발자가 Gradle 게이트만 제거해도 기존 runtime 경로는 UMP/MobileAds 요청으로 진행하지 못한다. 실제 연령을 확인한 이용자도 현재 구현에는 판별 근거가 없으므로 모든 운영 광고를 미확정으로 취급한다. 미래 연령 분기는 별도 승인/설계로 교체해야 한다.

테스트 광고는 기존 UMP 갱신/canRequestAds/개인정보 옵션을 유지한다. false인 UMP 테스트 기본값은 운영 정책 승인이 아니다. UMP가 연령을 판별하지 않으며 true는 동의 요청을 생략하므로 타깃 선언만으로 false/true를 확정하지 않는다. [UMP 안내](https://developers.google.com/admob/android/privacy/gdpr).

## 검증

실제 SDK RequestConfiguration 조합으로 CHILD/TEEN 우선순위, TFUA 보존, PPT/G, test-device 유지, 반복 적용을 검사한다. 동의 정책 mock은 미확정 운영에서 UMP=true/폼/복귀/초기화/캐시 콜백이 광고를 허용하지 않는지 확인한다. 기존 테스트 광고 동의/실패/10분 검사도 유지한다. Gradle 운영 모드에 테스트용 true 입력을 주어도 hard gate에서 거절됨을 확인하며 실제 광고 요청은 없다. 두 release variant Java/unit/lint/unsigned 실물과 승인 identity를 재검증한다.
