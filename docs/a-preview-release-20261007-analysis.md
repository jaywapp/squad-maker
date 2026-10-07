# A UI Android preview 통합 분석

목표: 확정된 A UI와 P0-01~03/C-01 데이터 보호·계약 v2를 통합하고, 검증한 동일 APK를 GitHub Releases에 게시한 뒤 다시 내려받아 서명·해시·설치를 확인한다.

## 시작 근거와 승인

- native PR #44: 21c2b5474e77d97aef827b0d45e311eb585d1164.
- Claude A UI PR #45 완료: d6c16cefb32500b02c8e975b701b67e216ef9233. 해당 head CI 성공.
- 두 원본 작업 트리 clean, 별도 feat/a-preview-release-20261007에서 충돌 없이 merge 완료(8c87b7f).
- 기존 사용자 승인으로 생성한 로컬 preview 키를 재사용한다. 새 키·계정·비밀값·권한 설정은 먼저 확인한다.
- main 병합/직접 커밋은 승인되지 않았다. 전용 브랜치·draft PR·테스트 APK Release는 사용자 목표에 포함한다.

## 확정/미정/범위

확정: A 피치 중심 코치 UI, 기기 내 저장, 삭제 후 슬롯 재사용, 일회성 영구 슬롯 확장 방향. 미정: 무료 개수·확장 수량·가격, 고급 기능 제공 범위·구독. preview-unlimited 정책 유지. 미정인 무료 1팀/5문서와 월 6,900원 문구만 중립화한다. 새 유료 정책은 만들지 않는다.

수요 측정 이벤트/무료 기능/상태·취소 테스트와 저장 보호를 유지한다. native/UI 원본을 수정하지 않고 통합 브랜치에서 작업한다. 서버·Supabase·로그인·상용 광고·결제·Play Store·Vercel 배포는 범위 밖이다. 로컬 정적 편집기에 별도 서버가 필요하지 않다.

## 완료와 검증 범위

최종 단위/desktop/mobile 및 exact head CI → 승인 키 서명 → 동일 APK Android 터치/IME/back/저장·재실행·삭제undo/.sq 복원 수정 저장/PNG·GIF·SAF/OSshare 취소·완료/광고 비간섭 → Release → 재다운로드 해시·패키지·버전·인증서 일치 및 재설치. 브라우저·가짜 native·실제 Android를 구분하고 실기기/TalkBack 등의 미실행 이유를 명시한다.

가용 RAM 약 4GB이며 다른 작업을 종료하지 않는다. 테스트/Gradle/AVD는 순차 실행, OOM 및 중단 결과는 통과로 합산하지 않는다.

## 독립 리뷰 후 최소 보완

저장 장치 읽기 실패(blocked/storage-unavailable)에서는 .sq 복원이 성공할 수 있다고 단정하지 않고 원문 보호 및 접근 실패를 안내한다. inner 데이터 손상/미래 버전의 기존 복원 흐름은 유지한다. OS touchcancel에서 선수 드래그·롱프레스·A UI 탭 및 패턴 미완료 그리기를 정리하고 활성 touch identifier로 다른 손가락의 이동/종료를 구분한다. 브라우저 회귀는 이를 확인하며 실제 Android 터치 검증과 구분한다. native 저장 엔진을 자동 reset하거나 원본을 덮지 않는다.

## 실제 Android의 짧은 높이 보완

전용 API 36 에뮬레이터의 360×682 CSS px에서 피치(하단 644px)와 선택 도구(상단 580px)가 64px 겹침을 확인했다. 기존 288px 최소 폭이 높이 계산을 막는다. native squad 화면에서 높이 748px 이하일 때만 최소 폭을 풀어 기존 높이 계산을 적용한다. 테마·데이터 계약·선수 좌표·터치 크기는 보존하며 기하 회귀와 실제 APK의 선택·드래그·PNG를 검증한다. 복원 버튼은 Android DocumentsUI를 정상 실행했으며 초기 캡처 지연을 기능 실패로 기록하지 않는다.

새 기하 회귀가 시작 시 native 클래스 적용 후 배율이 이전 최소 폭에 남는 문제를 잡았다(두 화면 각각 48px/78.5px 차이). 플랫폼 클래스가 바뀔 때만 배율을 동기화하여 처음 실행부터 피치와 선수 좌표를 맞춘다.

최종 기하 회귀는 실제 360dp 폭의 높이 682px와 640px를 대상으로 한다. 추가 탐색한 320×640에서는 기존 큰 글자용 컨테이너 분기로 상단 두 줄이 늘어 피치와 선택 도구를 함께 보려면 세로 스크롤이 필요하다. 360dp 미만·큰 글자·가로 화면의 전체 가시성은 이번 preview 검증의 제한으로 기록한다.

## 실제 Android 백업 확장자 보완

API 36의 파일 저장 완료 뒤 NativeSparseQA-final.sq.json이 만들어짐을 확인했다. JSON MIME 타입에 따른 Android 파일 제공자의 확장자 추가이며, .sq 복원 선택성과 백업 명명 계약을 지키기 위해 native Documents.save의 JSON .sq 파일 선택기에서만 application/octet-stream을 지정한다. 브리지의 허용 MIME, JSON bytes, 계약 v2, 웹 .sq, PNG/GIF와 공유 동작은 보존한다. 승인된 최소 native 보완이다. 기존 AOSP FileUtils splitFileName 근거: https://android.googlesource.com/platform/frameworks/base/+/cf628c4/core/java/android/os/FileUtils.java . 최종 APK로 실제 .sq 파일명·원본 bytes·재복원을 확인한다.
