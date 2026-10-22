# #59·#60 저장 완료 후 광고 — 분석 초안

2026-10-21. orchestrator=Codex. Issue-based 범위는 #59~61의 로컬 구현·검증·커밋·push·PR이며 병합·배포·서명·기기 설치는 별도다.

## 재개 상태와 권한

- main: `75d2f5476ce19288c20ace58283d7a7d83e6688a`.
- PR #63: `96a7543a07bf6589505dc7ebbe40f9b614fc7fb3`, Draft/미병합. 본 후속 브랜치는 이 공유 광고 제거 변경 위에서 준비한다. #63과 별도이며 중복 PR은 만들지 않았다.
- 사용자 채팅: “pr 확인했고 이어서 진행”. 작업 재개 근거이며 첫 저장 면제 범위나 PR 병합을 확정한 발언으로 인용하지 않는다.
- [Aina 답변](https://github.com/jaywapp/squad-maker/issues/59#issuecomment-6308402023)은 에이전트 기술 제안이다. 사용자 승인으로 바꾸지 않는다. [원 확인 질문](https://github.com/jaywapp/squad-maker/issues/59#issuecomment-6308175693)은 초안 시점에 답변 대기였으며 아래 직접 사용자 답변으로 해소했다.
- `feat/live-ads-release-20261015`의 연령/UMP/정책/code2 미커밋 변경은 보존하며 복사·수정하지 않는다.

## 코드에서 확인한 사실

1. `SquadDocumentsPlugin.save()`는 캐시에 바이트를 stage하고 ACTION_CREATE_DOCUMENT를 시작한다. chooser 중 중복 save는 busy로 거부한다.
2. `documentCreated()`는 취소/URI 없음에서 cancelled를 반환한다. 실제 대상 스트림에 write/flush하고 close까지 마친 후에만 success를 반환한다. 실패하면 file-write-failed다. 클라우드 제공자의 원격 업로드 완료까지 입증하는 것은 아니다.
3. `platform-native.exportFile()`은 cancelled 외 결과를 file-saved로 매핑한다. 후속 광고를 연결하려면 명시적인 status=success만 인정하고 누락/알 수 없는 결과를 성공으로 추정하지 않도록 검토해야 한다.
4. 현재 `deliverExport()`는 저장 GIF/SQ에서 광고를 먼저 기다린다. PNG 저장은 광고 대상이 아니며 #63에서 공유는 이미 광고에서 분리했다.
5. 실제 표시 시각은 `onAdShowedFullScreenContent`에서만 기록한다. 10분 제한·1시간 캐시·시계 역행·foreground·UMP·activeShow 검사가 있다. 첫 저장 면제 기록은 없다.

## 사용자 확인 완료 (2026-10-22)

직전 채팅에서 위 범위를 다시 제시했고 사용자가 직접 “응”이라고 답했다. 앱 데이터 기준 첫 성공 명시 저장 1회(PNG/GIF/SQ 공통)를 영속 면제한다. 기존 설치는 기록이 없으면 업데이트 후 첫 성공 저장 면제, 공유/자동저장/취소/실패는 비소모, 재시작 유지, .sq 복원 비간섭, 새 설치/데이터 삭제 시 초기화한다. 세션별 면제로 바꾸지 않는다. #59 댓글6335485775, #60 댓글6335486753에 직접 답변 근거를 기록했다.

정책 확인 대기를 해제하고 구현·로컬 검증·커밋/push·후속 Draft PR까지 진행한다. 실기기/실제 SDK 전환 증거가 없으면 해당 완료 조건은 미검증이며 자동 이슈 종료를 하지 않는다. 기존 #63은 병합하지 않고 후속 PR은 #63 브랜치를 base로 해 중복 diff를 피한다.
