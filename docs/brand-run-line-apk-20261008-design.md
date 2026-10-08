# Run Line 로컬 서명 APK 설계

orchestrator: Codex. 요청은 설치용 파일 준비다. 휴대폰이나 AVD에 설치하지 않고 빌드·서명·패키지 비교·수동 인계까지만 실행한다.

## 빌드와 서명 경계

- versionCode 1002/versionName 0.1.0-preview.2만 app Gradle에서 변경한다. package/appName·min24/target36·저장 schema/위치·allowBackup=false는 유지한다.
- 기존 helper는 승인된 환경 입력4개만 사용하고 build 전에 로컬 변수로 옮겨 환경에서 제거한다. npm/Gradle/zipalign에는 암호를 상속하지 않으며 apksigner sign 동안만 env: 참조로 전달한 뒤 제거한다. 인증정보가 command argument/log에 직접 들어가지 않는다.
- helper는 Gradle versionName을 엄격하게 읽고 안전한 파일명 문자만 허용한다. 저장할 APK 이름은 `squad-maker-0.1.0-preview.2.apk`. 키를 생성하지 않고 입력/키가 없으면 기존 실패 경계를 유지한다.
- 원래 승인 보관 폴더의 record/키는 읽기만 한다. loader는 기존 값을 프로세스 메모리에만 전달하며 출력·다른 파일에 직렬화·영구 환경 등록을 하지 않는다. 기존 키가 실제 이전 인증서와 일치함을 먼저 확인했다.

## 검증과 근거

빌드 source SHA를 먼저 커밋하고 해당 SHA에서 app clean 및 helper의 실제 sync/bundle/assembleRelease/lintRelease/sign을 실행한다. 공개 결과를 `.work/branding-apk-20261008/`에 저장한다. 최종 APK에서 zipalign 검사, apksigner v2/v3 검증과 SHA256 공개 인증서, aapt2 package/versionCode/versionName/minSdk, APK 파일 SHA256 및 포함 HTML/adapter와 최종 bundle 동일성을 확인한다. 이전 Preview 실제 APK의 SHA·서명·badging을 다시 읽어 비교한다. 두 APK를 byte 단위로 데이터 호환으로 표현하지 않고 identity+인증서+더 큰 code라는 업데이트 조건을 판정한다.

이번 변경은 native 버전/빌드 helper/문서만이다. 이전 SHA의 unit/E2E 수치를 새 SHA의 실행 결과로 사용하지 않는다. 변경분은 실제 helper 빌드/서명 및 APK metadata로 검증하고 최종 PR head CI가 실행하는 전체 회귀와 unsigned Android 결과를 별도로 연결한다. source 추가 변경이 생기면 영향받는 검사와 APK를 다시 생성한다.

## 사용자 백업과 설치

Android allowBackup=false이므로 자동 클라우드 백업을 기대하지 않는다. 팀/보관 목록의 전술 파일마다 명시적 `.sq` 백업을 하고 화면으로 목록/선택/보관 수를 기록한다. `.sq` 하나는 현재 전술의 선수·기본/공격/수비·패턴 원본이며 전체 library의 팀/파일 메타데이터 일괄 백업은 아니다. PNG/GIF/링크만으로 편집 원본 백업을 대신하지 않는다.

사용자는 APK를 휴대폰에 복사한 후 기존 앱을 삭제하지 않고 OS의 업데이트로 설치한다. 선택적으로 `adb install -r`을 사용할 수 있지만 이 세션은 실행하지 않는다. 설치 취소·서명 충돌·downgrade 오류는 중단하며 uninstall/clear/-d를 사용하지 않는다. 실제 데이터 유지·홈/스플래시·탭·재진입은 사람의 결과로만 완료 처리한다. [서명 공식 문서](https://developer.android.com/studio/publish/app-signing), [adb 공식 문서](https://developer.android.com/tools/adb)를 따른다.

## 실제 결과와 후속 기록

기존 키만으로 로컬 서명 APK 생성/검증이 완료됐다. source=a736c49853c0fff382e8bcf2a00c00f515dcc8b3, package/cert 이전Preview 동일, 1002/0.1.0-preview.2·min24/target36·v2/v3 검증 성공, 기존credential record/키 무변경·신규 저장0. 실제 APK정보/수동 절차는 install, 검증 결과는 tasks 및 PR #47을 따른다. 이 결과 기록의 docs 커밋은 APK source/bytes를 바꾸지 않는다. 실기기·이번APK 에뮬레이터 실행·설치후 데이터 유지·T7은 미검증, 직접 설치/Release/main병합은 수행하지 않았다.
