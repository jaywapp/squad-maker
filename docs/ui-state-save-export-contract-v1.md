# UI 상태·저장·내보내기 계약 v1

P0-01~03/C-01의 웹 기능 경계다. [실행 기록](data-safety-ui-contract-20261007-tasks.md), [PR #41 계획](https://github.com/jaywapp/squad-maker/pull/41)을 함께 읽는다. A 화면 디자인은 Claude가 맡는다. 이 계약의 완료는 C-03 로컬 보관·Android 구현 완료가 아니다.

## 공개 경계

`window.SquadMakerContract.version === 1`.

- `getState()`: 깊은 복사한 현재 UI 상태. 반환값을 고쳐도 앱에 영향 없음.
- `subscribe(listener)`: 상태 변경 구독, 즉시 현재 상태 전달. 반환 함수는 구독 해제. 서버·분석 전송이 아니다.
- `run(operation, payload?)`: `Promise<Result>`. 아래 지원 명령 이외는 `unsupported` 반환.
- DOM 이벤트 `squad-maker:state`와 `squad-maker:result`: 같은 문서 안의 상태·결과 알림. 외부 진단에 스냅샷을 전송하지 않는다.

`getState`의 필드는 다음과 같다.

| 필드 | 의미 |
|---|---|
| contractVersion | `1`, UI runtime 계약 버전 |
| snapshot | 검증된 현 교환 payload `v/team/mode/squad/roster/squads/pat` |
| revision | 현재 탭 세션의 snapshot 변경 번호. 앱 재시작 시 0부터, v:1 payload에 넣지 않음 |
| savedRevision | 저장·재읽기 확인된 revision. 미저장 시작은 null |
| storage | `status`, `error`, `retryable`. idle/pending/saving/saved/error/blocked/read-only |
| view | `appMode`, `selectedPlayerId`, `selectedPlayerName`, `patternIndex`, `stepIndex`, `readOnly` |
| undoAvailable | 최근 복구본이 현재 세션에 있는지. reload 후 false |
| export | `busy`, `kind`. 생성 중 사용자 편집/다른 명령은 busy |
| localLibrary | `supported:false`, `teamId:null`, `fileId:null`, `items:[]`, `slots:{status:'unavailable',limit:null,used:null}` |

선수 선택은 ID로 유지하고 이름은 현재 roster에서 조회한다. `snapshot.mode`는 인원수, `snapshot.squad`는 basic/attack/defense, `view.appMode`는 squad/pattern/strategy다. 기본/공격/수비는 현 한 전술의 세 상태이며 파일 세 개나 슬롯 세 개로 계산하지 않는다. 선택·목록/시트 닫기만으로 payload를 변경하지 않는다. UI에서 닫기만 하는 동작은 선택을 지우지 않는다.

## 명령과 결과

| operation | payload | 동작 |
|---|---|---|
| select-player | `{id}` | 존재하는 ID 선택, 이름·피치·도구 동일 |
| switch-squad | `{squad}` | 기존 지침 보존 후 해당 상태로 이동·저장 요청 |
| change-mode | `{mode}` | 전체 영향 확인, 취소 또는 보호 변경 |
| reset-layout | 없음 | 현재 스쿼드 배치만 확인 후 초기화 |
| undo | 없음 | 최근 보호 동작 직전 전체 스냅샷과 선택/탭/패턴/단계 복구·즉시 저장 |
| import-snapshot | `{snapshot}` | 검증/sanitize → 교체 확인 → 즉시 저장·재읽기 |
| retry-save | 없음 | 현재 revision 즉시 저장·재읽기, 이전 실패 숨기지 않음 |
| export-sq | 없음 | 현 스냅샷 JSON 파일의 웹 다운로드 요청 |
| export-png | 없음 | 현 피치/팀명/스쿼드/포메이션의 PNG 생성·다운로드 요청 |
| export-gif | `{allPatterns:boolean}` | 현 패턴/모든 패턴의 단계·공 이동 GIF 생성·다운로드 요청 |
| share-url | 없음 | 현 스냅샷의 읽기 전용 URL 생성. 복사/OS 전달 성공은 주장하지 않음 |

Result는 `{contractVersion:1, operation, status, code, revision, savedRevision, completion}`. status는 success/cancelled/error/unsupported/busy. 입력 오류는 invalid-input/unsupported-version, 저장 오류는 storage-quota/storage-unavailable/storage-verification/storage-read-blocked, read-only/busy/unsupported-operation도 구조적으로 구분한다. 성공을 먼저 표시한 뒤 저장을 요청하지 않는다. cancelled는 오류 토스트나 상태 변경이 없다.

undo는 최근 한 단계의 전체 복구본이다. 새 보호 동작은 이전 복구본을 교체한다. 그 이후 일반 편집이 있다면 전체 undo가 그 편집도 되돌린다. 재시작·기기 교체를 넘는 복구와 파일 삭제 복구는 Q9/C-03 범위다. 보호 동작 실패 시 기존 undo도 보존한다.

## 저장·가져오기

추가 사유는 `file-read-failed`, `undo-unavailable`, `export-failed`, `storage-rollback-failed`다. 마지막 사유는 원문 복구를 확인하지 못했다는 뜻이고 자동저장/재시도를 차단한다. DOMException의 숫자 code는 공개 사유로 사용하지 않는다. `import-shared`는 기존 뷰어 버튼의 별도 결과 이벤트이며 같은 검증 저장 함수를 사용한다.

일반 편집은 600ms debounce로 pending → saving → saved/error. 저장됨은 setItem과 동일 문자열 getItem 검증 후다. 오류에서는 편집 중 데이터와 마지막 성공 저장본을 보존하며 지속 안내·재시도·.sq 백업을 제공한다. hidden/pagehide에서 대기 저장을 flush하지만 OS 강제 종료·브라우저 저장 삭제까지 보장하지 않는다.

인원 변경/초기화/가져오기/undo는 즉시 저장한다. 저장 실패 시 보호 변경 직전 메모리 상태로 복구하고 원문 저장본을 유지한다. 써진 값 재읽기 검증 실패는 기존 원문으로 rollback을 시도한다. rollback도 실패할 경우 복구 불확실 오류로 구분하며 성공을 주장하지 않는다.

손상 JSON/지원 불가 버전/읽기 오류로 시작한 저장본은 기본값으로 덮지 않는다. blocked 상태에서는 일반 저장·재시도가 원문을 교체하지 않는다. 유효한 .sq를 **명시적으로 확인하여 가져올 때만** 기존 저장본 교체를 허용한다. 파일 선택 취소, 파싱/구조/버전 오류와 교체 취소는 메모리·선택·저장 원문 무변경. 구형 `pat[{n,m}]`은 기존 한 단계 규칙으로 정규화한다.

`snapshot` 버전은 `v:1`을 유지한다. 향후 팀/파일 container, ID·영속 revision·이전/충돌/슬롯 카운터는 C-03에서 별도 버전으로 설계한다. match 전략 폼의 추가 영속화를 암묵적으로 넣지 않는다.

## 내보내기·공유와 fixture

PNG/GIF는 요청 순간의 snapshot/revision을 기준으로 생성한다. 생성 중 main/작업 탭을 inert로 두고 contract의 변경 명령도 busy로 거절한다. 정상 완료·오류·timeout에서 잠금을 해제하고 원본·선택을 보존한다. 결과의 `completion:'download-requested'`는 웹 다운로드 요청이며 실제 OS 저장 위치/수신 앱 전달을 확인한 결과가 아니다. URL 생성은 `url-created`다. web에는 OS 공유·사용자 OS 취소를 구현하지 않는다.

공유 URL 열람은 read-only이고 localStorage 쓰기를 요청하지 않는다. 명시적 `내 스쿼드로 가져오기`만 별도 확인·저장 경로다. 정상 PNG/GIF는 기존 고정 vendor 회귀로 검사한다.

[fixture](../tests/fixtures/ui-contract-v1.json)는 정상·빈 명단/목록·긴 이름·세 스쿼드·저장중/실패·지원 불가·export 오류·공유 취소를 UI에서 표시하기 위한 예다. `illustrative:true` 케이스의 슬롯 가득 참/OS 공유 취소는 **미구현 미래 adapter 표시 예**이며 현재 명령의 성공·무료 수량·구매 가격·결정 Q 번호로 쓰지 않는다.

fixture의 `cases`는 기존 `snapshot-v1.json`과 runtime 기본값에 적용하는 **부분 상태 override**다. 전체 Result나 저장 payload로 그대로 가져오지 않는다. 실제 경계의 구조·revision/저장 상태·읽기 전용·실패·취소는 `tests/e2e/ui-contract.spec.js`와 `data-safety.spec.js`에서 실행 검증한다.

## 순차 인계와 다음 게이트

검증 commit SHA·실행 명령·결과는 이 계약을 포함하는 draft PR와 실행 기록에 둔다. 소스 commit 자체에 자기 SHA를 쓰는 순환을 만들지 않는다.

- 이번 Codex 소유: `index.html`, `tests/e2e/data-safety.spec.js`, 계약 테스트/fixture, 고유 실행 문서와 docs 인덱스의 추가 링크.
- 보존: 원본 A HTML/6 PNG, 기존 v:1 fixture/vendor, AGENTS/CLAUDE, 배포/SDK/비밀값 설정.
- Claude 운영 `index.html` 편집 시작 조건: 검증 head와 계약 v1 확인 및 PR #41의 C-02/C-03 준비. 같은 파일을 동시 편집하지 않는다. U-01 화면 탐색은 Claude 고유 경로에서 fixture를 사용 가능.
- C-03/Q1/Q2/Q9 로컬 한도·복구, Q6 Android 후보 선택, 최종 공유 Q8, 광고/구매/서명·APK 실기기 검증은 미완료다. 이 PR은 APK/스토어 검증 완료를 뜻하지 않는다.
