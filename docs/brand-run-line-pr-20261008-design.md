# Run Line 최종 검토 설계

orchestrator: Codex. 사용자 선택 A Run Line과 공급 사양을 보존한다. 기존 구현의 [설계](brand-run-line-20261008-design.md)를 바꾸지 않고 최종 검토·근거 연결·T7 준비를 수행한다.

## 검토와 검증 흐름

1. root가 편집/Git 작업을 단독 소유하고 Codex reviewer는 현재 diff 읽기만 수행한다. 공유 파일·빌드 자원 때문에 테스트와 Android 빌드는 순차, Playwright workers=1로 실행한다.
2. assets 41개와 적용 Android res 17개의 SHA256, 전체 intro snippet 포함 여부, 기본 리소스 18개 제거를 확인한다. h1.wordmark/data-brand-intro, ready 계약과 실제 script 삽입 순서를 검토한다.
3. 이번 작업 트리의 새 검증을 먼저 실행하고 결과를 문서화한 뒤 범위 내 파일만 Conventional Commit으로 기록한다. 최종 SHA에서 전체 검증을 다시 실행한다. 최종 실행 후 source 수정이 생기면 영향받는 검증과 SHA 기록을 새로 수행한다.
4. `.work/branding-final-review-20261008/candidate/`와 `final/`에 로그를 분리한다. `final/verification.json`에 실제 commit/tree/환경/명령/종료 코드/결과를 남긴다. 이 JSON과 unsigned APK는 Git에 넣지 않는다. 최종 SHA를 자기 자신의 커밋 문서에 넣는 순환을 피하고 PR 본문에서 정확히 연결한다.
5. 정상 push로 Draft PR을 만든다(기존 동일 head PR이 생기면 업데이트). 자동 배포 중단을 전후 확인한다. 서명 helper·assembleDebug·install·release·merge 명령은 실행하지 않는다.

## 경고 정책과 호환성

전체패턴 GIF의 기존 mobile skip은 인코딩 비용을 줄이는 desktop 전용 조건이다. 새 skip을 추가하지 않는다. lint는 실제 이번 보고서의 issue ID/file/line으로 기록한다. 제공 colors_brand의 미사용 색 3개를 임의 삭제하지 않으며 기존 의존성 알림과 미사용 리소스도 범위 밖 수정으로 없애지 않는다.

T7 업데이트는 동일 package 및 호환 인증서를 실제 설치 앱에서 확인해야 한다. versionCode는 이번 브랜딩에서 변경하지 않는 1001이므로 설치 앱 버전도 먼저 읽는다. 호환되지 않거나 설치 버전이 더 높으면 강제 downgrade/삭제로 우회하지 않고 사용자에게 결정받는다. [Android 서명 공식 문서](https://developer.android.com/studio/publish/app-signing)와 [adb 공식 문서](https://developer.android.com/tools/adb)의 업데이트/`install -r` 의미를 따른다. 데이터 유지 기대는 백업과 설치 전후 비교로 검증하며 보장으로 표현하지 않는다.

T7의 시스템 스플래시/런처/동작 줄이기 OS 전달/warm resume는 브라우저 mock이나 aapt2 결과로 대체하지 않는다. Android 7~11은 API24~30의 실제 호환성 검증을 별도로 준비한다.
