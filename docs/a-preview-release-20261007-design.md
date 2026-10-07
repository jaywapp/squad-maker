# A UI Android preview 통합 설계

## 승인된 방향

기존 A 나이트피치 코치 UI의 토큰·테마·정보 구조를 보존한다. impeccable Operate/clarify 및 design-taste-frontend 보존/pre-flight를 적용한다. context.mjs는 SCOPED_EXISTING_ALLOWED를 반환했다. 이미 선택된 A 디자인과 승인된 최소 정책 수정이므로 새 콘셉트 선택은 필요하지 않다.

## 구조와 인터페이스

native #44에서 별도 브랜치를 만들고 UI #45 완료 SHA를 merge한다. index UI는 SquadMakerContract v2 ready/getState/subscribe/run과 SquadUi.closeTopLayer를 사용한다. 저장은 기존 AtomicFile 두 키 커밋/검증, v:1 스냅샷 검증과 live ID 할당을 유지한다.

저장 완료=최신 revision 지속 기록, 파일 저장 완료=SAF 쓰기/close 완료, share-sheet-finished=OS 공유 시트 종료이다. 수신자 전달로 단정하지 않는다. 취소/오류는 전술을 보존하고 마지막 파일 삭제 후 자동 저장으로 재생성하지 않는다.

## 최소 변경과 대안

수요 측정 모달의 세 가격 줄을 제공 범위·가격 미정으로 수정한다. 버튼/이벤트 이름·무료 편집·개인정보 안내는 유지한다. 회귀는 세 모달의 미정 안내와 임의 요금/수량 표현 부재를 검증한다. CI push 대상에 통합 브랜치를 추가하여 source head를 확인한다.

원본 브랜치 병합은 담당 작업을 섞으므로 별도 작업 트리를 선택했다. 새 서명키는 업데이트 호환성을 깨므로 기존 승인 키만 사용한다. 비밀값은 npm/Gradle에 상속하지 않고 서명 도구에만 전달한다.

## 검증

단위 → desktop → mobile → exact head CI → 서명/Gradle lint → ADB/UIAutomator 실제 APK 순서다. 디버깅/root/타 앱 자격 증명을 사용하지 않는다. 기존 legacy APK를 A UI 증거로 재사용하지 않는다. 공개 SHA256/package/version/cert만 Release 자산과 검증 문서에 기록한다. native 실패 발견 시 최소 수정 후 영향 검증과 최종 APK를 다시 만든다.

## 독립 리뷰 후 최소 보완

저장 장치 읽기 실패(blocked/storage-unavailable)에서는 .sq 복원이 성공할 수 있다고 단정하지 않고 원문 보호 및 접근 실패를 안내한다. inner 데이터 손상/미래 버전의 기존 복원 흐름은 유지한다. OS touchcancel에서 선수 드래그·롱프레스·A UI 탭 및 패턴 미완료 그리기를 정리하고 활성 touch identifier로 다른 손가락의 이동/종료를 구분한다. 브라우저 회귀는 이를 확인하며 실제 Android 터치 검증과 구분한다. native 저장 엔진을 자동 reset하거나 원본을 덮지 않는다.

Windows 로컬 npm.cmd 래퍼가 진행 없이 대기하여, 서명 스크립트는 같은 npm android:sync 내용인 Node 번들 생성과 설치된 Capacitor CLI sync를 직접 호출한다. 의존성·웹 코드·서명 입력 격리 의미는 유지하며 실제 최종 빌드로 검증한다.

## 실제 Android의 짧은 높이 보완

전용 API 36 에뮬레이터의 360×682 CSS px에서 피치(하단 644px)와 선택 도구(상단 580px)가 64px 겹침을 확인했다. 기존 288px 최소 폭이 높이 계산을 막는다. native squad 화면에서 높이 748px 이하일 때만 최소 폭을 풀어 기존 높이 계산을 적용한다. 테마·데이터 계약·선수 좌표·터치 크기는 보존하며 기하 회귀와 실제 APK의 선택·드래그·PNG를 검증한다. 복원 버튼은 Android DocumentsUI를 정상 실행했으며 초기 캡처 지연을 기능 실패로 기록하지 않는다.

새 기하 회귀가 시작 시 native 클래스 적용 후 배율이 이전 최소 폭에 남는 문제를 잡았다(두 화면 각각 48px/78.5px 차이). 플랫폼 클래스가 바뀔 때만 배율을 동기화하여 처음 실행부터 피치와 선수 좌표를 맞춘다.

최종 기하 회귀는 실제 360dp 폭의 높이 682px와 640px를 대상으로 한다. 추가 탐색한 320×640에서는 기존 큰 글자용 컨테이너 분기로 상단 두 줄이 늘어 피치와 선택 도구를 함께 보려면 세로 스크롤이 필요하다. 360dp 미만·큰 글자·가로 화면의 전체 가시성은 이번 preview 검증의 제한으로 기록한다.

## 실제 Android 백업 확장자 보완

API 36의 파일 저장 완료 뒤 NativeSparseQA-final.sq.json이 만들어짐을 확인했다. JSON MIME 타입에 따른 Android 파일 제공자의 확장자 추가이며, .sq 복원 선택성과 백업 명명 계약을 지키기 위해 native Documents.save의 JSON .sq 파일 선택기에서만 application/octet-stream을 지정한다. 브리지의 허용 MIME, JSON bytes, 계약 v2, 웹 .sq, PNG/GIF와 공유 동작은 보존한다. 승인된 최소 native 보완이다. 기존 AOSP FileUtils splitFileName 근거: https://android.googlesource.com/platform/frameworks/base/+/cf628c4/core/java/android/os/FileUtils.java . 최종 APK로 실제 .sq 파일명·원본 bytes·재복원을 확인한다.
