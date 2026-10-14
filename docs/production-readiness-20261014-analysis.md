# 정식 출시 구조 준비 분석

2026-10-14. orchestrator=Codex. 이번 범위는 로컬 구현·검증·문서화다.

## 후속 Git 작업 승인

사용자가 현재 변경의 커밋·push·main 병합을 명시적으로 요청했다. 이 후속 지시는 아래 초기 로컬 한정 범위 중 Git 작업에 우선한다. `feat/production-readiness-20261014`의 준비 변경만 커밋하고 main 대상 PR을 만들어 검증 후 병합한다. 기존 PR47/53과 다른 작업 트리 변경은 포함하지 않는다. 브랜치 삭제·force push는 하지 않는다.

이 요청은 정식 패키지/첫 버전·서명·TEEN 보호안의 확정, 운영 광고 활성화·공개 정책 게시·APK Release/배포·Play 제출·키 생성/서명·기기 설치를 승인한 것이 아니다. production gate와 테스트 광고·CI/자동 배포 비활성 상태를 유지한다. 커밋 후 Git 이력에 따른 Preview 버전/소스 SHA가 바뀌므로 최종 PR head에서 unit·전체 desktop/mobile E2E·bundle/sync·unsigned Preview APK/AAB·lint를 다시 확인하고 결과를 PR에 기록한다. 이 문서의 기존 dirty 소스 결과를 커밋 후 빌드 결과로 바꾸어 사용하지 않는다.

첫 commit `3096da4`의 fresh 전체 E2E는399 통과/기존1skip/2실패였다. desktop/mobile의 같은 interest-preview 테스트가 폐기한 포괄적 개인정보 미수집 문구를 기대한 원인이다. 앱 문구를 되돌리거나 테스트를 skip하지 않고, 기존 이벤트 속성 `{source}` 검증을 유지하며 팀/선수/전술 분석 제외 안내와 포괄적 미수집 문구의 부재를 확인하도록 테스트를 수정한다. 실패 로그를 보존하고 새 정상 commit의 전체 검증 후 PR57을 병합한다.

## 확인한 기준

- 최신 원격 main: `b6b0420f24d4b998a5e986fa0a5aaabfb1b0cbca`, PR56 병합 완료.
- 기존 Preview1097과 패키지 `com.jaywapp.squadmaker.preview`, 기존 인증서 및 내보내기 공통10분 정책을 보존한다.
- primary 폴더는 main27a34ca9이며 `.ux-review/`를 보존했다. 기존 export-interstitial worktree도 변경하지 않는다.
- 이번 로컬 작업: `D:\station\.worktrees\iam-headcoach-production-readiness-20261014`, `feat/production-readiness-20261014`, main b6b0420에서 분리했다.
- 별도 ‘아이엠 헤드코치 운영 광고 준비’ 세션은 코드·문서 변경/워크트리 생성 없이 중단했다는 최종 응답을 확인했다. 이전 읽기 검색 프로세스 종료 여부는 미확인이고 임의 종료하지 않는다.
- GitHub Actions `enabled:false`. 원격 push·PR·main 병합·CI 활성화·배포·Play 제출·키 생성/변경·서명·기기 설치는 이번 범위 밖이다.

## 사용자 결정 대기

1. 정식 applicationId 후보 `com.jaywapp.iamheadcoach`, 정식 첫 `versionCode=1/versionName=1.0.0`, Preview 별도 단조 증가 계보.
2. Google 관리 Play App Signing 앱 서명 키와 Preview와 분리된 업로드 키 전략. 이번에는 생성하거나 등록하지 않는다.
3. 개인정보처리방침·개발자 웹사이트의 실제 공개 URL과 운영자/보관·삭제 정보. 공개 지원·대상·첫 국가/언어는 아래 후속 답변으로 일부 확정됐다.

답변 전 applicationId·서명 정체성을 확정하지 않는다. 답변과 무관한 테스트 광고·UMP·빌드 안전 장치·SQ 테스트·출시 항목 준비는 진행한다. 정책 미확정과 계정/스토어 심사 미완료를 광고 활성화 완료로 표시하지 않는다.

첫 준비 검증 시점에는 세 질문의 답변이 미수신이었다. `approvedProductionIdentity=null`과 정식 태스크 차단을 유지했다. 그 시점의 Preview1099 unsigned APK/AAB, unit173·desktop201/mobile200+skip1·Java23·lint 오류0/경고4는 해당 코드 해시 기준의 결과다. 후속 문구 변경의 검증과 구분하며 [최종 보고](production-readiness-20261014-report.md)를 따른다.

## 2026-10-14 후속 답변·범위

- 공개 지원 이메일 blueheart.dev@gmail.com, 첫 배포 대한민국·한국어, 실제 제품 대상16세 이상 축구·풋살 선수/성인 동호인·코치가 확정됐다.
- Play 타겟 연령16~17세/18세 이상을 기준으로 검토한다. 실제 Console 설정/콘텐츠 등급·심사 결과가 확정됐다는 뜻은 아니다.
- 패키지·첫 버전·서명 최종 확정과 키 생성·제출은 여전히 미승인이다. production gate는 바꾸지 않는다.
- 정책 URL은 실제 공개 페이지를 준비한 뒤 사용하라는 지시다. 이번 범위에서 게시/호스팅/가짜 URL 연결은 하지 않는다.
- 공식 Play/AdMob 문서와 실제 SDK25.5 API를 확인했다. UMP/TFUA만으로 TEEN 보호·광고 등급·Data safety가 완성되지 않는 구현 차이가 있다.
- 생년월일 수집 없이 전 사용자 TEEN/비개인화/G, 더 강한 신호는 CHILD를 유지하는 첫 출시 보호안을 별도로 질문했다. 답변 전 네이티브 광고 요청 정책을 임의 확정하지 않는다.
- 도움말/메타/README의 현재 제품·지원 문구만 최소 수정한다. 기존 인터뷰 주소·사용자가 입력하는 제보 연락처·저장/내보내기/광고 위치/간격은 유지한다.
- [연령/문구/광고 정책](production-readiness-20261014-audience-policy.md), [방침 초안](production-readiness-20261014-privacy-draft.md), [Data safety 대조](production-readiness-20261014-data-safety.md)를 로컬 작성한다. 콘솔 제출·공개 URL·법적 검토 완료로 보고하지 않는다.

## 승인된 공개 광고 식별자

- App: `ca-app-pub-3532115669945697~1919738204`
- Banner: `ca-app-pub-3532115669945697/4481041102`
- Interstitial: `ca-app-pub-3532115669945697/3966035787`

이 값은 공개 식별자다. 운영 광고를 실제 요청·반복 노출·클릭하지 않는다. Preview·개발·자동 테스트에는 Google 테스트 식별자만 사용한다.

## 완료 기준

Preview/정식 설정 분리, 동의 갱신·필요 화면·canRequestAds·개인정보 옵션, 광고 실패 시 내보내기 지속, SQ 복원 후 수정/저장/재시작 보존을 로컬에서 검증한다. 서명·설치·실기기·운영 광고·계정 심사는 별도 미검증/차단으로 기록한다.
