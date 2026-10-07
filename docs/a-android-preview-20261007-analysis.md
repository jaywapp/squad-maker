# A 통합과 Android 설치 검증 APK: 분석

- slug: `a-android-preview-20261007`; orchestrator: Codex. A UI는 별도 Claude 실행 트리.
- 목표: 확정 A UI·기기 보관·PNG/GIF·공유를 구현/통합하고 같은 APK 설치·재시작·오프라인 검증 후 squad-maker GitHub Releases에 게시한다. 계획/PR만으로 완료하지 않는다.
- 사용자 승인: 구현·테스트·Android 방식 판단·전용 브랜치·테스트 APK 게시. 새 서명 자격 증명·영구 접근·계정/비밀 설정은 사전 확인. main 병합은 별도 확인 대상이다.
- baseline: PR43 `d7996738db3388c9022ce3c8ae0cf77fd7bbb628`. PR42 head `0d71b540a1a2be1c2cddd25364575725dc66d31d`는 PR43 ancestor. 중복 cherry-pick하지 않는다. PR41/42/43은 확인 시 open draft, main은 PR40 `5653661`.
- 원본 main과 기존 P0 worktree가 clean임을 확인한 뒤 전용 worktree에 `feat/a-android-preview-20261007`을 생성했다. fc-squad-maker는 대상이 아니다.

## 확인한 환경과 제약

- PR43 CI 37576625976: success, API 7 / 웹 161 passed, 모바일 전체 GIF 1 skip. 실제 Android 증거가 아니다. 로컬 전체 회귀를 다시 실행한다.
- Android SDK 34/35/36, build-tools 34/35/36, system images 35/36, JBR 21.0.6와 Phone API36/Tablet AVD 설치. ADB 연결 기기는 없다.
- Orca CLI가 PATH에 없다. 지원되는 Computer Use 초기화는 kernel 시작 전에 `helper_sandbox_lock_failed`/Windows 접근 오류로 실패했다. 해당 스킬은 terminal automation을 금지한다. 세션 파일·스크린샷·추측한 ID로 우회하지 않는다. Claude 직접 전달은 미실행이며 [붙여넣기 요청문](a-android-preview-20261007-claude-request.md)을 제공한다.
- 새 전용 preview 서명키 승인과 휴대폰 검증 방식 질문은 사용자 응답 대기. 서명키를 아직 생성하지 않는다.

## 제품 결정과 구현 원칙

무료량/가격/확장량/정식 슬롯 단위/Q9 장기 복구는 미정이다. preview에서는 교체 가능한 policy를 사용하며 production 무료량을 확정하지 않는다. 기본 preview는 과금/무료 한도 없음, 단위별 제한 동작은 테스트 전용 fixture로 검증한다. 팀/전술 ID는 보관 기능용이며 과금 단위를 뜻하지 않는다.

현재 세션 한 단계 undo·명시적 .sq 백업/복원과 삭제된 슬롯 즉시 재사용을 구현한다. 영구 휴지통/재설치 복원은 보장하지 않는다. 기존 v:1/공유 snapshot과 원문 저장본을 보존하고 container 이전은 별도 키·버전으로 검증한다.

UI는 A 원본을 보존하며 Claude가 담당한다. C-02/C-03 완료 전에는 별도 prototype 경로만 사용하고, 이후 기준 SHA·계약·실제 허용 파일을 확인하여 UI를 순차 통합한다. 광고는 테스트 광고만 사용하며 실제 수익화/구매 완료를 주장하지 않는다.

## 완료 증거

최종 관련 웹·저장·ID·native 계약 테스트, 앱 build, 동일 APK 설치/콜드 스타트/기기 저장·삭제 재사용·.sq·PNG/GIF·공유/취소·뒤로 가기·오프라인, 광고 영역 비간섭, 서명·패키지·버전·해시, GitHub Release 재다운로드 파일 일치와 설치 결과를 각각 기록한다. emulator/실기기·미검증·실패를 구분한다.

## 진행 결과

C-02/C-03와 native 경계를 구현했고 통합 단위93/웹185 passed(기존1skip), unsigned build/lint를 확인했다. 세부 결과와 남은 UI·서명·설치·Release 조건은 실행 기록에 구분한다. 현재 구현은 A UI 교체 완료나 설치 검증 APK 게시 완료가 아니다. 새 서명키/휴대폰/Claude 직접 전달 질문에 사용자 답변은 아직 없으므로 해당 종속 작업을 실행하지 않았다.

cc037a8 CI의 단위93/웹187(기존1skip)/unsigned Android build도 성공했다. 후속 긴 내보내기 파일명 경계 보완에서 단위95와 unsigned build/lint를 재확인했다. 최종 native SHA의 CI는 PR에서 확인한다.
