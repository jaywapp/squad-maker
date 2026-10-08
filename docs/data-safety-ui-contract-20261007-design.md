# 데이터 보호와 UI 계약: 설계

- orchestrator: Codex. [분석](data-safety-ui-contract-20261007-analysis.md), [작업](data-safety-ui-contract-20261007-tasks.md).
- 사용자의 PR #41 실행 지시를 이 범위의 요구사항·설계 승인으로 적용한다. 추가 제품 결정은 만들지 않는다.

## 보호 흐름

확인 → 변경 직전 v:1 깊은 복사와 선택/패턴/단계 복구본 → 변경 → 즉시 저장과 동일 문자열 재읽기 → 성공 안내와 한 단계 undo. 취소는 mutation 없음. 보호 동작의 저장 실패는 변경 직전 화면으로 복구하고 마지막 성공 저장본을 보존한다. 일반 편집 저장 실패는 편집 중 상태를 유지하고 지속 오류·재시도·.sq 백업을 제공한다.

외부 입력은 파싱·버전·구조 검증과 sanitize를 완료한 뒤 적용한다. 입력 오류에서 부분 변경을 허용하지 않는다. 잘못된 시작 저장 데이터는 덮어쓰지 않고 저장을 차단해 .sq 백업/명시적 파일 복원을 안내한다.

## 저장과 호환성

현 교환 payload `v/team/mode/squad/roster/squads/pat`, `squad-maker-v1` 키를 유지한다. 선택·저장 오류·revision·undo는 runtime에만 존재한다. 저장 성공은 `setItem`과 동일 값 `getItem` 확인 이후다. 저장 실패의 오류는 구조적 코드로 전달하며 원본/개인정보를 진단에 포함하지 않는다. 일반 편집의 600ms debounce는 유지하고 숨김/pagehide에서는 대기 저장을 flush한다.

## 계약과 내보내기

최소 adapter는 현 단일 파일에 둔다. `window.SquadMakerContract`는 버전·읽기·구독·명령 경계다. 구체적 API와 fixture는 [UI 계약](ui-state-save-export-contract-v1.md)에 기록한다. payload revision과 현재 runtime revision을 구분한다. PNG/GIF 생성 동안 편집을 막아 요청 시 상태·이름·스쿼드·단계와 결과를 고정한다. 웹 다운로드 요청은 OS 파일 저장/수신자 전달 성공을 증명하지 않는다.

팀/파일 ID·목록·슬롯·OS 공유는 현재 미구현 상태로 표현하며 테스트용 가득 참/취소 fixture를 실상품 정책으로 취급하지 않는다. 기존 CDN 자산과 분석 이벤트 계약은 보존한다.

## 파일 소유권과 검증

Codex가 이번 `index.html`, 관련 `tests/e2e`, 고유 실행 문서와 계약 fixture를 독점 편집한다. Claude는 별도 UI 실행 문서/프로토타입 경로를 사용할 수 있으나 이 완료 SHA/계약과 C-02/C-03 게이트 확인 전 운영 `index.html`을 편집하지 않는다. 큰 모듈 분리와 framework 이전은 하지 않는다.

기존 고정 vendor로 외부 네트워크를 차단하고 1280/390px Playwright 회귀를 실행한다. 새 손실 테스트는 먼저 기준 소스에서 실패를 확인한다. 전체 `npm test`, 인라인 JS 구문 검사, UI 상태와 내보내기 실패·취소 계약 검사를 수행한다. Android 실기기 증거는 포함하지 않는다.

## 구현된 세부 보장

- 저장 오류는 DOMException의 숫자 code를 UI 계약으로 노출하지 않고 정해진 문자열 사유로 매핑한다. 재읽기·rollback을 검증하고 rollback 확인 실패는 blocked로 유지한다.
- 이름 편집 확정은 저장 요청과 선택 도구 갱신을 수행한다. getState/알림은 snapshot 변경을 먼저 관측하여 새 데이터를 이전 revision의 저장 완료로 전달하지 않는다. 패턴/단계 이동은 payload revision을 증가시키지 않고 view 알림만 보낸다.
- 외부 ID는 양의 안전 정수·중복 없음으로 검증하고, 다음 선수 ID는 가장 작은 미사용 양의 정수로 할당해 재시작 호환성을 유지한다.
- PNG는 30초 timeout, GIF는 worker 가져오기 15초 abort와 준비/프레임/인코딩 90초 기한을 적용한다. topbar도 출력 잠금에 포함하고 열린 모달에서 출력 시작을 거부해 inert 해제를 통한 편집을 방지한다.
- 명시적 공유 가져오기도 같은 검증 저장 함수를 사용하며 확인되지 않은 쓰기로 화면을 이동하지 않는다.
