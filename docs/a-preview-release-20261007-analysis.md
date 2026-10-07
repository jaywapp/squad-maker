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
