# 정식 출시 결정·검증 체크리스트

> 후속 승인: 정식 패키지/첫 버전/서명 전략은 [identity 적용](production-identity-20261014-report.md), TEEN/PPT OFF/G는 [최신 보호·unsigned 검증](teen-ad-protection-20261014-report.md)을 따른다. 아래는 PR57 당시 기록이며 키 생성·정책 URL·실제 연령/동의 처리·실기기/Play 확인은 여전히 미완료다.

2026-10-14. 로컬 준비 문서이며 출시 승인·법적 검토 완료·Play 제출 결과가 아니다. [분석](production-readiness-20261014-analysis.md), [빌드 행렬](production-readiness-20261014-build-matrix.md), [SQ 이동](production-readiness-20261014-data-transfer.md)을 함께 읽는다.

## 아직 필요한 사용자 결정

| 항목 | 확인된 값/근거 | 남은 결정 |
|---|---|---|
| 정식 브랜드 | 아이엠 헤드코치, 승인된 한글 A안 | 변경 없음 |
| 정식 applicationId·첫 버전 | 후보 com.jaywapp.iamheadcoach / 1 / 1.0.0 | 승인 대기, 승인 전 실제 production 태스크 차단 |
| Preview | com.jaywapp.squadmaker.preview, 기존 인증서·1097 계보 | 이번 unsigned 코드1099, 서명·업데이트는 별도 승인 |
| Play 계정 | 사용자 제공: jaywapp 개발자 계정 존재, 앱 미등록 | 앱 등록·계정별 테스트 요건·출시 접근 상태는 Console 미확인 |
| 서명 | Google 관리 Play App Signing + Preview와 분리된 업로드 키 제안 | 전략 승인·실제 키 준비는 별도 승인; 이번 키 생성/읽기/서명 없음 |
| 지원 연락처 | 사용자 확정 blueheart.dev@gmail.com, 도움말 링크 반영 | 실제 수신/회신 운영 미검증. 개인정보 문의에도 같은 주소를 쓸 후보이며 담당/처리 기준 확인 대기. 기존 인터뷰 주소와 역할 구분 |
| 개인정보/개발자 사이트 | 확정된 정식 URL 없음 | 운영자·URL·문의·보관/삭제 정책 승인 |
| 연령/국가/언어 | 사용자 확정 대한민국·한국어,16세 이상 선수/성인 동호인·코치, Play16~17/18이상 기준 검토 | Console/콘텐츠 등급·청소년 광고 보호안과 TFUA 적용 기준 확인 |
| 광고 포함 | 운영 연결 준비 요청·공개 광고 ID 제공 | 실제 출시 광고 고지·동의 메시지·정책과 정식 모드 승인 |

## 실제 코드와 Data safety 대조

| 경로 | 실제 구현/준비 상태 | 제출 전에 확인할 항목 |
|---|---|---|
| 팀·선수·전술 | 로컬 저장, 사용자 선택 SQ·이미지·GIF·텍스트/URL 공유 | 공유 데이터에 이름·지침 등이 포함될 수 있음. 전체 앱을 개인정보 미수집으로 선언하지 않음 |
| Android 저장 | 기존 namespace/저장 키·schema 유지, OS backup 비활성 | 실제 설치/재시작·SQ 전술별 백업과 목록 수동 재구성 검증 |
| AdMob SDK | GMA25.5.0, UMP4.0.0, 동의 갱신/canRequestAds·옵션 준비 | IP 기반 대략 위치, 사용 상호작용, 진단, 기기/계정 식별자 등 SDK 처리와 최종 신고 대조 |
| UMP | SDK 동의 상태 사용, raw consent 별도 로그/SQ 저장 없음 | 계정 Privacy & messaging에 실제 메시지 구성·대상 지역·기기 폼 검증 |
| 연령 보호 | UMP TFUA와 GMA 요청 설정에 동일 boolean 적용, 실제25.5 TEEN API 존재 확인 | TEEN/비개인화/G 보호안 승인·구현은 대기. TFUAfalse나UMP만으로 청소년 보호 완료 처리하지 않음 |
| 제보 | native 공개 /api/feedback URL. 제목/내용·선택 연락처/진단은 GitHub Issue로, 별도 Turnstile 검증 토큰/IP는 Cloudflare로 전송 | 운영 hostname/API/CORS·실접수·공개 범위·각 제공자/담당자·보관/삭제 미확인. 이번 실제 전송 없음 |
| 분석 | 웹은 Umami ID 주입 때만 활성, Android bundle은 analytics disabled | 향후 분석 활성화가 있으면 동의·방침·Data safety 재대조 |
| 라이선스 | 기존 승인 원본·OFL 및 로컬 export 라이브러리 고지 보존 | SDK/전달용 라이브러리까지 출시용 종합 고지 점검 |

GMA 설명은 현재 사용한 SDK25.5.0의 [Google 공식 데이터 공개 안내](https://developers.google.com/admob/android/privacy/play-data-disclosure)를 기준으로 한다. 계정 설정·사용 방식에 따라 신고를 확정해야 하며 위 표를 Console 답안으로 자동 제출하지 않는다. [Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en), [User Data/개인정보처리방침 정책](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)을 최종 운영 정보와 대조한다. [방침 초안](production-readiness-20261014-privacy-draft.md)과 [Data safety 후보표](production-readiness-20261014-data-safety.md)는 작성했으나 실제 공개 정책 페이지·URL과 앱 내 방침 링크는 아직 없다. [연령/스토어 문구](production-readiness-20261014-audience-policy.md)와 함께 검토한다.

## AdMob/app-ads.txt 준비

- 사용자 제공 상태: AdMob 계정 인증 대기, 앱·스토어 연결/심사 미완료. 공개 ID가 코드에 있어도 실제 광고 활성화·수익화 완료가 아니다.
- 명시적인 productionRelease 운영 설정에만 제공 App/Banner/Interstitial ID를 사용한다. Preview/debug 및 자동 QA는 테스트 ID만 사용하고 실제 운영 광고를 클릭/반복 노출하지 않는다.
- SDK 폼과 별도로 AdMob Privacy & messaging의 메시지 유형·정책 URL·지역을 구성해야 한다. 계정 화면은 이번 작업에서 변경하지 않았다.
- app-ads.txt 후보의 공개 publisher 값은 `pub-3532115669945697`이다. 개인화 snippet은 AdMob app-ads.txt 화면에서 복사·대조한 뒤 사용한다. 아래는 배포하지 않은 형식 참고이며 최종 snippet 검증이 아니다.

```text
google.com, pub-3532115669945697, DIRECT
```

개발자 웹사이트를 Play listing에 연결하고 해당 hostname 루트의 `/app-ads.txt`를 게시·크롤링 검증해야 한다. 기존 `https://jaywapp.github.io/squad-maker/`를 그대로 사이트로 고르면 `/squad-maker/app-ads.txt`만으로 충분하다고 가정하면 안 된다. 다른 저장소·도메인·호스팅 변경은 이번에 하지 않는다. [공식 설치 절차](https://support.google.com/admob/answer/9363762?hl=en).

## 정식 AAB·서명 준비 순서

1. applicationId·정식 첫 버전·연령/광고 정책 승인 후 production 승인 설정을 기록한다.
2. 먼저 테스트 광고 productionRelease unsigned APK/AAB를 빌드하고 실제 label/package/version·권한·SDK 포함을 검사한다.
3. 운영 모드는 명시적으로 선택해 정적/산출물 ID·문구 검증만 수행한다. 운영 광고를 요청하는 QA로 바꾸지 않는다.
4. 별도 승인 후 Play App Signing 등록·업로드 키 생성/보관 및 서명한다. Preview 키는 기존 업데이트용으로 보존한다. Google Play 설치본과 별도 로컬 서명본의 인증서 차이를 고려한다. [Android 공식 서명 안내](https://developer.android.com/studio/publish/app-signing).
5. 서명 AAB/기기 테스트·내부/비공개 트랙·스토어/방침/Data safety·AdMob 심사를 완료한 뒤 별도 승인으로 제출·공개한다. 개인 계정 생성일/출시 접근에 따라 적용되는 [테스트 요건](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)은 Console에서 확인한다.

CI·자동 배포는 계속 의도적으로 비활성화한다. flavors로 변경되어 기존 CI YAML의 옛 태스크/산출물 경로는 향후 재활성화 승인 때 수정·재검증해야 하며, 이번에는 수정/실행/원격 push하지 않는다.

Google 관리 앱 서명 키를 고르면 업로드 키로 서명한 로컬 정식 APK와 Play 설치본은 같은 서명이 아니다. 정식 QA는 승인 후 Play 내부 트랙의 Google 서명본으로 하거나 별도 QA 패키지를 사용하는 전략이 필요하다. 업로드 키 APK로 먼저 정식 패키지를 설치한 뒤 삭제 없이 Play 업데이트가 된다고 가정하지 않는다.

이번 Preview1099 APK의 실제 병합 권한에는 INTERNET/ACCESS_NETWORK_STATE, AD_ID 및 ACCESS_ADSERVICES_AD_ID/ATTRIBUTION/TOPICS, WAKE_LOCK/FOREGROUND_SERVICE, 패키지 내부 dynamic receiver 권한이 있다. SDK 병합 결과이며 권한만으로 모든 수집/사용을 확정하지 않는다. 실제 서비스·사용 경로 및 필요한 Console 선언을 정식 산출물에서 재대조한다.

## 폰 체크리스트: 전부 미검증

| 확인 항목 | 절차·기대 결과 | 증거 위치(향후) | 상태 |
|---|---|---|---|
| 두 채널 공존 | Preview 이름/기존 데이터 유지, 정식 이름·별도 앱 ID·승인 아이콘/마스크/테마 | 승인 후 `.work/production-device/<device>/identity.json`, icons.png | 미검증 |
| 첫 실행 | system splash→한글 intro→탭, 동작 줄이기/글자 확대에서도 접근 | cold-start.mp4, accessibility.json | 미검증 |
| 동의/옵션 | UMP 필요 화면·선택/거절/실패·옵션 재진입, canRequestAds에 따른 요청 | 합성 테스트 설정·consent-cases.json(선택 원문 제외) | 미검증 |
| 광고/내보내기 | 테스트 배너·GIF/SQ/단톡방 공통10분, 실패/오프라인에도 결과 진행 | export-cases.json, test-ads.mp4 | 미검증 |
| 복귀/회전 | 동의/광고 화면 중 전환·백그라운드/재진입·회전·Activity 재생성 | lifecycle.mp4, results.json | 미검증 |
| 데이터 이동 | 모든 전술 SQ 외부 백업→새 앱 복원→수정·저장→재시작, 양쪽 데이터 대조 | transfer-results.json, 파일별 SHA256 목차 | 미검증 |
| OS 범위 | API24부터 지원; 기존 사용 가능한 Android7~11 및 최신OS에서 위 흐름 | device.json, legacy-results.json | 미검증 |

서명·설치·새 emulator/OS image·사용자 데이터 삭제는 실행하지 않았다. 자동 browser/native facade 결과를 실제 Android/UMP/Play 검증으로 표시하지 않는다. 설치 오류는 삭제·초기화·강제 다운그레이드로 해결하지 않는다.
