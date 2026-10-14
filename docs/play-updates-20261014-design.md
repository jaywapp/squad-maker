# Google Play flexible 업데이트 설계

## 채널·상태 흐름

Google app-update2.1.0을 사용한다. 정확한 정식 package, release build, `com.android.vending` 설치 출처를 native에서 모두 확인한 후 manager/listener를 생성한다. Preview/debug/web에서는 SDK 조회·다운로드·설치 요청을 실행하지 않는다. 정식 sideload는 지원하지 않는 상태를 표시한다. [공식 구현](https://developer.android.com/guide/playcore/in-app-updates/kotlin-java).

Native `SquadUpdates` plugin은 `getState/check/startFlexible/dismiss/beginCompletion/complete`와 `state` event를 제공한다. 상태는 unsupported/idle/checking/not-available/available/pending/downloading/downloaded/installing/installed/cancelled/failed다. 모든 다운로드 시도는 새 AppUpdateInfo를 얻어 FLEXIBLE로 실행한다. 취소한 버전은 SharedPreferences에 보존하고 수동 확인으로 다시 안내한다. 복귀 시 정보/진행만 갱신하며 자동 설치하지 않는다. 조회 epoch와 listener 세대로 늦은 조회가 다운로드 완료를 되돌리지 않게 한다.

JS `SquadUpdateController`는 명시적인 `check({manual})/start()/dismiss()/complete()`를 직렬화한다. 중복 클릭은 같은 pending promise를 사용한다. 취소/dispose가 이전 세대의 callback을 무효화한다. UI는 기존 도움말 스타일·focus trap을 재사용하고 상태/행동 버튼 및 세션 내 단계별 알림을 제공한다. 리디자인은 하지 않는다.

## 저장·재시작 계약

1. 편집 준비 상태, 읽기전용, 활성 파일, drag/draw/재생/export/mutation을 확인한다.
2. update lock을 잡아 editor를 inert로 만들고 contract.run mutation을 차단한다. 모달 닫기·저장·내보내기와 잠금의 합을 현재 상태에서 계산한다.
3. 기존 save queue 완료를 기다리고 현재 최신 snapshot을 **항상 다시 저장**한다. 단계별8초 제한이 끝나면 설치를 차단한다. underlying 쓰기를 임의 취소하거나 데이터 삭제하지 않는다.
4. snapshot/revision==savedRevision/storage.saved/fileId가 그대로인지 검사한다. Native Storage AtomicFile write+readback 성공의 메모리 전용 receipt 문자열을 확인한다.
5. 일회용 challenge를 얻고 다운로드 버전·receipt를 다시 확인한다. SDK complete 직전 JS도 snapshot/revision/file/gesture/lock을 다시 검증한다.
6. Native도 같은 Storage LOCK에서 receipt의 세대·현재 성공·일회용 challenge·DOWNLOADED·foreground를 검사한 뒤 receipt를 소비하고 `completeUpdate()`를 실행한다. pause/destroy/new write/version change는 승인을 무효화한다.

`SquadMakerContract.prepareForUpdateRestart()` → `{ok:true,receipt:string}` 또는 `{ok:false,reason}`. 성공 시 lock을 유지하며 호출자가 `releaseUpdateRestart()`로 해제한다. 실패는 자체 해제한다. `validateUpdateRestart(receipt)`는 complete 직전 현재 상태를 확인한다. 설치 진행 상태는 lock을 유지하고 설치 실패 시 현재 modal 상태에 맞게 복구한다. 이 계약은 기존 저장 데이터 형식/키나 .sq 형식을 변경하지 않는다.

## 호환성·검증 경계

app/platform-native.js는 native 상태를 허용 필드로 정규화하고 receipt envelope의 verified/generation을 검사해 문자열만 controller에 준다. Android bundle은 update-controller.js를 필수 포함한다. Android 실제 SDK 컴파일, 순수 정책 및 fake JS/E2E를 구분한다. Activity 수명주기·Play 설치/다운로드·서명 연속성 검증은 실제 테스트 트랙/기기에서 남긴다. [공식 테스트 조건](https://developer.android.com/guide/playcore/in-app-updates/test).

제보/API/Vercel/Supabase 작업은 사용자가 취소했다. 기존 제보에 새 개인정보/중복 방지 계약을 적용했다고 보고하지 않는다.
