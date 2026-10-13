# iam-headcoach 폴더 이동 설계

orchestrator=Codex. 승인 범위와 확인된 상태는 [분석](iam-headcoach-migration-20261011-analysis.md)을 따른다. 이동 전 안전 게이트가 확인될 때만 실행한다.

## Git-aware 이동 후보

Git `2.50.1.windows.1`의 gitfile submodule 구조를 유지하고 허브 `D:\station`에서 source 하나와 destination 하나만 지정한 `git mv --dry-run` 뒤 `git mv`를 한 번 실행한다. logical submodule name `repos/squad-maker`, common gitdir, 기존 linked worktree 경로를 유지한다. primary에 `git worktree move`를 사용하지 않는다.

[공식 git-mv 2.50.0 매뉴얼](https://git-scm.com/docs/git-mv/2.50.0)은 gitfile·core.worktree 갱신과 .gitmodules path 수정·stage를 설명하며 2.50.1에 변경 없음이다. [git-worktree 매뉴얼](https://git-scm.com/docs/git-worktree/2.48.0)은 main worktree move를 허용하지 않는다. [v2.50.1 mv 구현](https://github.com/git/git/blob/v2.50.1/builtin/mv.c)은 실제 rename 뒤 연결·index를 갱신하므로 후반 실패는 부분 진행일 수 있다. [index entry 구현](https://github.com/git/git/blob/v2.50.1/read-cache.c)에 근거해 gitlink OID 보존을 기대하되 실제 결과로 검증한다.

core.worktree는 새 primary를 가리켜야 한다. `.gitmodules` 대상 path와 허브 gitlink 이름만 전환하고 OID `54a97fcd…`는 primary `27a34ca…`나 PR54 HEAD로 맞추지 않는다. extensions.worktreeConfig와 각 linked .git ↔ admin gitdir/commondir를 fresh 확인한다. 다른 staged 내용을 자동 commit하지 않는다.

## 백업·실행·검증 흐름

1. source/destination/부모 절대경로·reparse point와 활성 사용자의 종료/저장 상태를 확인한다.
2. source 전체 파일과 Git metadata를 별도 안전 로컬 경로에 복사한다. 링크는 타깃을 따라 복사하지 않고 복구 방법을 별도로 기록한다. 백업 ACL, Git 제외, 목록·크기/hash, metadata 복구 가능성을 먼저 검증한다. 비밀값을 출력하거나 외부 전송하지 않는다.
3. baseline과 dry-run의 보존을 확인하고 단일 git mv를 수행한다. 실패 시 상태와 백업을 유지한 채 중단한다.
4. `-C`로 새 primary를 검사하되 세션 cwd는 station을 유지한다. 전체 linked 연결과 dirty/untracked/ignored 자료를 비교한다.
5. 실제 새 primary의 기존 HEAD 기준으로 package/README에 맞는 회귀·Android unsigned/lint·참조 검사를 순차 실행한다. 긴 실행은 session ID로 기다리고 중복 시작하지 않는다.
6. 새 cwd의 서버 응답과 주요 화면·IDE/MCP 연결을 확인하고 검증 서버를 정리한다.
7. PR54 작업 트리에서 migration 문서와 필요한 활성 경로 수정만 검토·커밋·일반 push한다. PR54는 Draft와 PR52 base를 유지한다.

수동 일반 폴더 rename은 Git metadata 갱신을 누락할 수 있어 선택하지 않는다. common gitdir/linked 이름을 함께 변경하면 범위와 복구 위험이 커지므로 선택하지 않는다. blanket repair, reset, force, submodule update는 자동 복구 방법이 아니다.

## 중단과 복구

안전 게이트 미확인 시 이동은 미실행으로 기록한다. 백업 전 중단이면 복구본 존재를 주장하지 않는다. 부분 진행이면 source/destination·허브 index/.gitmodules·primary config/gitfile·linked admin과 백업을 삭제/역이동하지 않고 actual 상태를 보존한다. 사용자 조치와 경로별 복구 계획을 [결과](iam-headcoach-migration-20261011-report.md)에 기록한 뒤 재개한다.
