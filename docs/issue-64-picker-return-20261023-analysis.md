# PR64 정상 파일 선택창 복귀 — 분석

2026-10-23. orchestrator=Codex. 관련 #59/#60, [PR64 리뷰 P2](https://github.com/jaywapp/squad-maker/pull/64#issuecomment-6336149076).

## 요청·실제 상태

사용자가 코멘트 확인 결과를 받은 뒤 “이어서 진행”을 지시했다. 승인된 Issue-based 범위에서 결함 수정·로컬 검증·커밋/push·같은 Draft PR 업데이트를 진행한다. 첫 저장 면제·빈도·저장 성공 보호 정책은 재결정하지 않는다. PR63 선병합이나 배포 승인이 아니다.

- 시작 HEAD `bd38aadbaeae4474d0a736e74680b78bb2aaa5bd`, `feat/59-60-post-save-ads`, clean.
- fetch 후 main `75d2f5476ce19288c20ace58283d7a7d83e6688a`. PR63/64 모두 Draft/open, PR64 base는 `fix/61-share-without-interstitial`.
- repository Actions `enabled:false`. 다른 운영 광고 작업트리의 미커밋 67개 항목은 보존한다. 서버/작업트리/기기/키를 변경하지 않는다.

## 확인 근거

현재 Documents는 결과 callback에서 epoch를 잡은 뒤 비동기 파일 쓰기를 수행한다. Ads는 pause/resume 모두 `suspend`하고, resume에서 준비 상태를 다시 publish할 때에도 ready identity 변경으로 epoch가 바뀐다. 결과→resume→close 순서에서는 파일 성공은 유지되지만 광고 snapshot은 stale이다. resume 전 close이면 foreground ready가 없어 역시 광고를 생략한다.

설치된 Capacitor 8.5.2 `Plugin.triggerActivityCallback`은 callback을 직접 호출하고 `Plugin.execute`는 bridge task handler에 작업을 보낸다. `Bridge.onResume`은 플러그인에 resume을 동기 전달한다. [Android Activity reference](https://developer.android.com/reference/android/app/Activity#onActivityResult(int,%20int,%20android.content.Intent))와 [Activity Result API](https://developer.android.com/training/basics/intents/result)는 결과 처리 및 재생성 가능성을 설명한다. 이 자료·소스 대조는 실기기 재현이 아니다.

## 범위·완료 기준

- 소유한 picker 왕복을 token으로 추적하고 완료 receipt epoch와 분리한다. result와 resume 순서 때문에 정상 쓰기 성공의 광고 기회가 사라지지 않게 한다.
- 새로운 배경 이동·공유·취소·실패·복원/중복 callback·동의 변경·destroy는 계속 광고를 막는다. 모든 lifecycle 무효화를 없애지 않는다.
- close 시점에 foreground이고 준비된 광고가 있을 때만 기존 1초 receipt를 만들며 이후 load/resume으로 재생하지 않는다. close가 먼저면 즉시 skip한다.
- 실제 파일 close 성공·첫 면제·전역10분 show 갱신·.sq 데이터·웹/UI 계약을 보존한다.
- 기존 실패 순서를 Java 협력 객체로 재현하고 수정 후 성공/취소/지연/별도 배경/동의/복원 경계를 검증한다. 실제 SDK/provider/Activity 결과는 미검증으로 남긴다.

새로운 제품 정책 질문은 없다. Vercel/Supabase·제보 기능·UI/디자인 변경은 이번 수정과 무관하다.
