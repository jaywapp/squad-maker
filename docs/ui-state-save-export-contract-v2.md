# UI 상태·보관·내보내기 계약 v2

현재 전용 브랜치의 C-02/C-03 및 Android 경계다. v1 계약은 PR42 이력으로 유지한다. 교환용 .sq/공유 payload는 계속 `v:1`이고 보관 컨테이너는 별도 `version:1`이다. 무료 개수·가격·상용 과금 슬롯 단위·기기 간 복구 정책은 확정하지 않았다.

## 공개 API와 상태

`window.SquadMakerContract.version === 2`. `ready():Promise<State>`로 비동기 기기 저장 초기화를 기다린다. 초기화 동안 편집 영역은 잠기며 `ready:false`다. `getState()`, `subscribe(listener)`, `run(operation,payload):Promise<Result>`, 문서 내부 `squad-maker:state/result` 이벤트는 v1과 같은 깊은 복사·구독 해제 경계를 유지한다. UI는 snapshot/보관 원문을 분석·서버에 전달하지 않는다.

| 필드 | 의미 |
|---|---|
| contractVersion / ready | 2 / 저장 초기화 완료 |
| snapshot | 현 보드의 v1 교환 데이터. 파일 메타데이터·슬롯을 삽입하지 않음 |
| revision / savedRevision | 세션 snapshot 변경 번호 / 읽기 검증 완료된 번호. async 저장 중 새 편집은 pending으로 남음 |
| storage | idle/pending/saving/saved/error/blocked/read-only/no-file, error:string 또는 null, retryable |
| view | appMode, 선택 선수의 현재 ID·이름, patternIndex, stepIndex, readOnly |
| busy.mutation | 확인·보호 변경·보관 작업 진행 중. 반복 명령은 busy |
| undoAvailable | 인원/초기화/가져오기 직전 전체 보드 복원본. 세션 한 단계 |
| export | busy, kind:sq/png/gif 또는 null |
| localLibrary | supported, teamId, fileId, teams, items, revision, undoDeleteAvailable, slots |
| platform.native | Android native adapter 여부 |

`teams=[{id,name}]`, `items=[{id,teamId,name,revision,createdAt,updatedAt}]`. 목록에 snapshot/원문 복구 bytes를 노출하지 않는다. teamId/fileId는 보관 ID이며 선수 ID와 다른 문자열이다. 목록·시트 닫기는 선수 선택/패턴/보드 revision을 바꾸지 않는다. 기본/공격/수비는 한 파일의 세 스쿼드다.

`slots={status:'available'|'full',used,limit,policy}`. preview 기본은 `limit:null, policy:'preview-unlimited'`이다. 테스트에서만 `window.SQUAD_MAKER_PREVIEW_POLICY={limit:2}` 등을 주입한다. 이 숫자를 무료 정책으로 표시하지 않는다. 수정·자동 저장·이름 변경은 보관 수를 늘리지 않고 삭제 성공 후 공간을 재사용한다.

마지막 파일 삭제 후 `fileId:null,items:[],storage.status:'no-file',savedRevision:null`이다. 기본 보드는 새 파일을 만들 때 사용할 임시 화면이며 자동 저장/재시작이 파일을 다시 만들지 않는다. UI는 빈 상태와 새 전술 동작을 표시한다.

## 명령

| operation | payload | 완료 의미 |
|---|---|---|
| select-player / switch-squad | {id} / {squad} | 기존 선택/스쿼드 계약. switch는 저장 요청 |
| change-mode / reset-layout / undo | {mode} / 없음 / 없음 | 전체 영향 확인·즉시 저장, 실패 시 메모리 복구 |
| import-snapshot | {snapshot} | v1 검증→확인→active 교체·즉시 저장. empty는 명시적으로 파일 생성 |
| retry-save | 없음 | 현 snapshot 저장·재읽기 확인. no-active-file는 파일을 생성하지 않음 |
| create-team / rename-team | {name} / {id,name} | 팀 메타데이터 저장 |
| create-file | {teamId,name,snapshot?} | 새 파일 생성·활성화. snapshot 생략은 현재 보드 복사 |
| rename-file / open-file | {id,name} / {id} | 이름 변경 / 미저장 편집 먼저 저장 후 파일 열기 |
| delete-file / delete-team | {id} | 확인 후 삭제. 팀 삭제는 해당 파일 모두. 현재 파일이면 다른 파일/빈 상태 |
| undo-delete | 없음 | 최근 삭제 팀/파일만 복구, 이후 생성·수정한 파일을 보존. 부족 공간은 slots-full |
| export-sq / export-png | {destination?:'save'|'share'} | v1 백업 / 현재 피치 이미지 |
| export-gif | {allPatterns:boolean,destination?} | 현 패턴 또는 모든 패턴 |
| share-url | 없음 | 현재 v1의 읽기 전용 공개 URL 생성 |

`Result={contractVersion:2,operation,status,code,revision,savedRevision,completion,...}`. status는 success/cancelled/error/unsupported/busy. 보관 성공은 `completion:'local-commit'` 및 fileId/teamId가 추가된다. 생성 팀 ID는 teamId로 받는다. 보호 동작 취소는 무변경이다. 지원하지 않는 구매/일반 share-native 명령은 unsupported-operation이며 구매 기능 완료를 뜻하지 않는다.

저장 사유는 storage-quota/unavailable/verification/conflict/read-blocked/rollback-failed, 보관 사유는 slots-full/no-active-file/team-not-found/file-not-found/invalid-name/undo-unavailable/revision-overflow다. 공개 사유는 항상 문자열이다. conflict는 자동 재시도로 외부 변경을 덮지 않는다.

## 저장과 복구

웹은 localStorage `squad-maker-library-v1` + active mirror `squad-maker-v1`을 CAS·재읽기·검증 rollback으로 보존한다. 웹의 두 키는 OS 종료를 넘는 원자적 transaction을 보장하지 않는다. Android는 두 키를 한 app-private AtomicFile `squad-store-v1.json` transaction에 기록한다. native 성공은 쓰기 완료와 재읽기 이후다. 저장 await 중 새 편집은 저장된 revision과 분리한다.

기존 유효한 v1은 처음 보관으로 이전하며 선수 ID·배치·지침·패턴을 유지한다. 기존 container가 있고 active mirror가 달라졌다면 다른 파일은 유지하고 이전 active 한 본을 legacyRecovery로 남긴다. 손상·future 데이터는 기본값으로 덮지 않고 blocked 상태다. 유효한 .sq의 교체 확인이 끝난 경우만 recoverSnapshot을 호출하며 손상 원문은 container rawRecovery에 보존한다. rawRecovery는 정상 교환 파일이나 UI state로 내보내지 않는다.

기본 undo와 삭제 undo는 서로 다른 세션 한 단계다. 재시작·앱 제거·저장 삭제·기기 변경 복구 정책으로 표시하지 않는다. Android allowBackup은 false이며 .sq 명시적 백업을 제공한다.

## 내보내기와 Android UI

웹 `completion:'download-requested'`는 다운로드 요청이다. Android save는 SAF 파일 선택기에서 쓰기와 close 완료 후 `file-saved`, 취소는 cancelled/null이다. Android share는 cache 파일+OS sheet 종료 후 `share-sheet-finished`이며 수신 앱 전달 완료로 표시하지 않는다. 웹 destination:share는 native-unavailable이다. native 생성 공유 링크는 `https://squad-maker.vercel.app/#s=...`이고 localhost 링크를 외부에 전달하지 않는다.

생성/선택기/공유 동안 export.busy를 유지한다. 실패·취소 이후 원래 snapshot·선택을 보존하고 잠금을 해제한다. PNG 생성 timeout 30초, GIF 생성 90초/worker fetch 15초. 사용자가 파일 위치를 선택하는 시간에 임의 timeout을 두지 않는다. 큰 SAF 데이터는 cache 파일로 전달하여 Activity Bundle에 이미지 본문을 넣지 않는다. 파일명/OS 공유 제목은 native 경계에서 160자로 제한하고 경로 제어 문자를 치환하며 파일 본문은 그대로 유지한다. OS 강제 종료로 중단된 export 성공을 주장하지 않는다.

Android 뒤로가기는 확인 취소/시트·모달 닫기 우선, 내보내기/보호 작업 중 종료 금지, 종료 전 저장·revision 일치 확인이다. Claude UI는 `window.SquadUi.closeTopLayer():boolean`으로 열린 레이어만 닫고 처리 여부를 반환할 수 있다. 레이어 닫기는 선택을 지우지 않는다.

native 테스트 광고는 WebView 아래 별도 예약 영역(레이블20dp+배너50dp)이며 피치/내보내기에 겹치지 않는다. `window.SquadPlatform.showTestAd()/getAdState()`는 테스트 SDK 상태다. 공식 demo ID만 사용하며 실제 광고/계정/수익화 연결로 표시하지 않는다. 실패·오프라인에서도 편집이 계속돼야 한다.

## Claude 소유권 인계

C-03 검증 SHA 인계 전 root가 index 기능 통합을 소유한다. 이후 Claude의 U-02/U-03은 별도 checkout/branch에서 index.html 및 고유 UI 자산을 소유하며 root는 해당 파일 수정을 멈춘다. app/local-library.js, app/platform-native.js, Android, package/lockfile, 기능 회귀 테스트는 Codex가 소유한다. 이름 변경/파일 목록/내보내기 화면에서 위 공개 계약을 사용하고 데이터 모델을 중복 구현하지 않는다.

검증한 SHA·draft PR 및 전수 결과는 [실행 기록](a-android-preview-20261007-tasks.md)에 갱신한다. 이 계약의 구현 완료는 A UI 통합·APK 설치·Release 게시 완료를 뜻하지 않는다.
