# 정식 출시 구조 설계

## 후속 통합 경계

사용자가 현재 변경의 commit/push/main 병합을 승인했다. 새 디자인/운영 정책을 추가하지 않고 현 feature branch에서 커밋 후 최종 head를 검증해 PR을 병합한다. GitHub Actions repository enabled:false 및 APK/웹 배포 워크플로 disabled_manually를 유지한다. 정식 ID/버전·서명과 TEEN 보호안 승인 대기는 해제하지 않는다. 실제 결과 SHA·검증은 PR/최종 인계에 기록하고 기존 로컬 검증 문서는 생성 시점의 기록으로 보존한다.

첫 commit 전체검증의 interest-preview2 실패는 문구의 기존 기대값 누락이다. `interest-previews.spec.js`에서 scoped 분석 제외 문구와 잘못된 전역 미수집 문구의 부재를 확인하고 기존 실제 이벤트 속성 검증은 유지한다. 개인정보 경계를 약화하거나 제품 동작·광고 설정을 바꾸지 않는 회귀 테스트 수정이다. force push/amend 없이 후속 commit에서 재검증한다.

## 빌드 경계

- `preview`는 기존 applicationId·Java namespace·저장 형식과 기존 Preview 서명 계보를 유지한다.
- `production`은 별도 applicationId로 분리하되 사용자 승인 전 최종 ID 적용/실제 설치용 산출물을 만들지 않는다.
- Preview 및 debug 빌드의 광고 식별자는 항상 Google 테스트 값이다. 정식 release도 기본은 테스트이며 명시적인 운영 광고 선택만 운영 식별자를 허용한다.
- 운영 모드를 Preview/debug에 요청하거나 버전/패키지가 비어 있으면 빌드가 실패해야 한다. 서명 설정·키 생성은 추가하지 않는다.
- 네이티브 아이콘·시스템 splash는 승인된 자산을 공유한다. 이름만 채널별 리소스로 구분한다. 기술용 파일 이름과 과거 기록은 일괄 치환하지 않는다.

## 동의·광고 흐름

매 앱 실행에서 UMP consent information 갱신 → 필요한 consent form → `canRequestAds()` 확인 → 한 번만 SDK 초기화·광고 요청. 개인정보 옵션 필요 여부를 상태로 노출하고 기존 설정 화면에서 사용자가 재진입할 수 있게 한다. 실패/거절로 광고 요청이 허용되지 않으면 광고를 요청하지 않고 앱 기능은 유지한다. UMP 실패 시 이전 세션의 동의로 요청이 가능한지는 공식 `canRequestAds()` 값을 따르며 자체 만료·동의 문자열을 만들지 않는다.

기존 배너 위치와 export 공통10분 간격·실패 시 진행을 유지한다. 광고나 동의 화면 중첩, 중복 초기화, Activity 복귀/회전, 재동의 후 광고 상태 변경을 검증한다. 개인정보 선택 자체를 `.sq`나 별도 로그에 포함하지 않는다.

## SQ 이동

Preview와 정식 앱의 저장소는 독립적이다. 모든 팀·전술 SQ 내보내기 → 앱 밖 백업 → 정식 환경의 SQ 복원 → 수정·저장 → 재시작을 검증한다. SQ에 포함되지 않는 앱 설정·동의·광고 간격·로컬 정보는 실제 export 구현을 감사해서 명시한다. 앱 삭제·초기화는 이행 방식으로 사용하지 않는다.

## 검증/증거

로컬 unit, desktop/mobile E2E, Android bundle/sync, Java unit, unsigned APK/AAB 및 lint를 가능한 범위에서 수행한다. 최종 dirty 파일 해시와 기준HEAD·명령·결과를 기록한다. 운영 광고는 호출하지 않으며 실기기 상태는 체크리스트의 미검증으로 남긴다. 이전 CI나 Preview1097 결과를 이번 성공으로 사용하지 않는다.

## 공식 기준

- https://developers.google.com/admob/android/privacy
- https://developers.google.com/admob/android/quick-start
- https://developer.android.com/studio/publish/app-signing

최신 공식 문서를 구현 시점에 읽고 확인된 SDK/정책 세부 사항과 참조를 결과 문서에 추가한다.

## 후속 지원·대상·개인정보 구조

첫 국가/언어는 대한민국/한국어, 지원은 blueheart.dev@gmail.com, 제품 대상은16세 이상 축구·풋살 선수/성인 동호인·코치다. 도움말 기존 섹션과 버튼 스타일로 이메일 지원 진입점과 제품 대상 문구를 추가한다. 승인 시각 디자인·아이콘/인트로/레이아웃을 바꾸지 않는 좁은 문구 개선이다. 기존 인터뷰 링크와 공개 제보 API의 목적은 보존한다.

개인정보 문서는 로컬 전술과 공유·GMA/UMP·공개 제보·지원 이메일·선택 웹 분석을 따로 설명한다. Android 웹 분석 비활성과 AdMob SDK 통신은 별개다. 정책 URL은 실제 공개 페이지 검증 후 적용하는 의존성으로 두며 이번에 가짜 URL을 채우지 않는다.

현재 TFUA 전달 외 TEEN/광고 콘텐츠 등급/명시 비개인화 설정이 빠져 있다. GMA25.5 실제 enum/builder/getter가 존재함을 확인했으며 SDK 업그레이드는 필요하지 않다. 제안은 모든 요청 TEEN+G+비개인화, 동의 연령 미만 또는 더 강한 기존 신호는 CHILD 우선이다. 생년월일 수집이나 성인 여부 추정은 추가하지 않는다. 보호안 답변 전 구현을 보류하며 Play 타겟 연령·콘텐츠 등급·국내 개인정보/SDK 처리 의무가 모두 해결됐다고 주장하지 않는다. 세부 후보는 [연령 정책](production-readiness-20261014-audience-policy.md)을 따른다.

## 구현·검증 결과와 보류 경계

GMA25.5.0은 보존하고 UMP4.0.0을 고정했다. `ConsentAdPolicy`는 동의 갱신·폼 대기/세대·복귀/파괴·SDK 초기화 중복을 관리하며, `ConsentRequestConfiguration`은 기존 SDK 설정을 보존하면서 UMP와 같은 TFUA 값을 광고 요청에 전달한다. `showBanner`/기존 alias와 state/privacy-options bridge를 구현했다. 개인정보 옵션은 기존 도움말 디자인으로 표시하고 웹/미필요 상태에는 숨긴다.

독립 리뷰의 연령값 전달 및 폼 종료 후 대기 처리 두 항목은 수정·재검토했다. Preview unsigned APK/AAB·fresh 자동 검증은 완료했으며 실제 production 산출물은 ID/첫 버전 승인 전 차단했다. productionRelease 기본 test 모드는 QA용이고 제출용 운영 설정과 구분한다. 운영 ID/문구의 실제 production APK 검사는 승인 후 빌드해야 하며 지금 통과로 표시하지 않는다. 자세한 값/결과는 [최종 보고](production-readiness-20261014-report.md)에 있다.
