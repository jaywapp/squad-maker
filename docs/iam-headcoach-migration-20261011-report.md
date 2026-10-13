# iam-headcoach 폴더 이동 결과·복구 기록

2026-10-11 KST, orchestrator=Codex. 현재 상태는 **이동 전 안전 게이트 blocked·이동 미실행**이다. 실행 cwd는 `D:\station`이며 Git 조회는 명시적 `-C`를 사용했다. docs와 기존 Draft54의 상태 기록 처리는 이동 완료와 구별한다.

- 실제 source: `D:\station\repos\squad-maker`
- 목표 destination: `D:\station\repos\iam-headcoach` (현재 없음)
- primary source SHA: `27a34ca97d5622d69effc46956ed23e9abb5a70a` / main
- 문서 기준 PR54 SHA: `c93ac560b65dd2aaaaa0743d15da941e03854314`
- c93 이후 보존한 정상 문서 SHA: `2b5891e06315fbf7ba13f4cca62af08a0b69ab2f` (별도 로컬 Preview 안내)
- 백업/복구본: 미생성·미검증
- dry-run/실제 이동: 미실행
- 새 위치 unit/desktop·mobile E2E/bundle·sync/unsigned release/lint/문서·자산 참조/서버·IDE·MCP: 미실행
- 실기기: 미검증

최신 전환 문서 5개와 대상 지침·README를 읽고 source·부모 Resolve-Path, reparse 속성, destination 부재, 실제 primary/PR54 HEAD/status, .gitmodules staged 경계/hash, gitlink, primary gitfile/common dir/core.worktree, worktree 12개 목록 및 설치 Git 공식 제약을 조회했다. 조회 결과는 [분석](iam-headcoach-migration-20261011-analysis.md)에 있다. 이 기록은 모든 자료 hash·metadata 복구 가능성 검증을 대신하지 않는다.

기본 exec는 `helper_sandbox_lock_failed`/`SetNamedSecurityInfoW` 오류 5로 프로세스 생성에 실패했다. 읽기 전용 require_escalated 실행은 성공했다. 파일 읽기 Node REPL은 timeout으로 종료돼 해당 결과를 사용하지 않았다. 같은 느린 셸 실행을 중복 시작하지 않고 session ID로 기다렸다.

## 정확한 중단 조건과 사용자 조치

native 앱 API가 비활성화되어 IDE의 열린 source 파일·미저장 상태를 확인할 수 없고 station cwd의 활성 Codex/Claude 세션이 source를 사용하지 않는다고 보장할 수 없다. 최신 사용자 지시가 이 경우 이동 전에 중단하도록 요구하므로 추가 승인을 요청하지 않고 중단했다.

2026-10-11 05:04 KST 보조 읽기 감사는 Toolhelp PID/parent, PEB CurrentDirectory, token owner를 사용했다. 선택 대상 프로세스283개 모두 cwd 조회가 성공했고 primary source cwd는0개다. 이는 열린 파일/미저장/`-C` 사용의 부재를 증명하지 않는다. argv/env/대화/버퍼 내용은 읽지 않았다. Codex 지원 목록은4 pinned+최근50개 범위이며 VS Code workspace metadata25개와 global storage에 source 참조가 없다는 결과도 동일한 한계가 있다.

| listener | PID / OS owner | 실제 cwd | 조치 |
|---|---|---|---|
| 4317 | 58568 / JAYWAPP\jaywa | `D:\station\repos\kickwork\` | 이번 작업 소유로 입증되지 않음·종료하지 않음 |
| 4318 | 32112 / JAYWAPP\jaywa | `D:\station\.worktrees\squad-maker-brand-run-line\` | 기존 linked 서버·종료하지 않음 |
| 4319 | 42248 / JAYWAPP\jaywa | `D:\station\.worktrees\squad-maker-ux-fix-20261009\` | 기존 linked 서버·종료하지 않음 |
| 4334 | listener 없음 | — | 종료 대상 없음 |

사용자가 **source 관련 편집 내용을 저장하고 해당 IDE 파일/프로젝트를 닫은 뒤, source를 사용하는 세션·터미널·빌드가 정상 종료되거나 source 밖으로 전환됐음을 확인**해야 한다. 위 다른 저장소·linked 서버를 일괄 종료할 필요는 없다. 확인 후 fresh 경로·Git·프로세스 상태부터 다시 검사하며 과거 SHA로 맞추지 않는다.

## 실행한 명령과 증거

- cwd=`D:\station`; `git --version`, 명시 경로별 `git -c core.fsmonitor=false -C … status --short`, `rev-parse HEAD/--show-toplevel/--absolute-git-dir/--git-common-dir`, `branch --show-current`, `worktree list --porcelain`, 허브 `ls-files --stage`, .gitmodules `diff --quiet`/path 조회, `Resolve-Path`/`Get-Item`/`Get-FileHash`.
- `gh api repos/jaywapp/squad-maker/pulls/54`로 open/Draft, head=`c93ac560…`, base=`feat/launch-readiness-20261010` 확인.
- ignored 증거 후보: `D:\station\.worktrees\squad-maker-korean-branding-20261010\.work\iam-headcoach-migration-20261011\`. `git check-ignore -v`는 제품 `.gitignore:18:.work/`를 반환했다. 이 위치의 파일 hash·Git metadata 기록은 **복구본이 아니며** source 전체 백업을 대신하지 않는다.
- 전체 worktree 파일·metadata baseline collector는 Git 조회마다 큰 지연이 발생한 상태에서 안전 중단이 이미 확정되어 취소했다. session82198의 task 전용 PID54692와 고유 `inspect.cjs` 절대경로를 먼저 확인하고 해당 읽기 프로세스 하나만 종료했다. 종료 결과는 exit-1이며 전체 `baseline.json` 수집 완료를 주장하지 않는다. 기존 서버·세션·빌드를 종료한 것이 아니다. 재개 시 전체 fresh baseline과 백업 검증을 새로 수행해야 한다.
- unit/전체 desktop·mobile E2E/Android bundle·sync/unsigned/lint는 새 경로 자체가 없으므로 모두 미실행이다. 문서 전용 diff·로컬 링크 검사는 별도 결과로 남긴다. 과거 c93 CI를 이번 새 위치 결과로 사용하지 않는다.
- 기존 PR54 브랜치에 문서5개만 검토·Conventional Commit·일반 push한 뒤 같은 Draft의 제목/본문만 갱신한다. 최종 문서 SHA와 PR readback 결과는 PR54 및 세션 최종 응답에서 확인한다. 이동·새 위치 검증·재연결은 계속 blocked다.
- 작업 중 정상 추가된2b5891e 문서4개와 README 연결을 읽어 보존했다. c93에 고정한 첫 문서 검사 실패는 최신 HEAD 변화였으며 source를 reset하지 않았다. 동일 브랜치에서 별도 local Preview Android clean release/lint가 진행 중임을 지원 `read_thread`로 확인해 완료 전에 migration commit으로 HEAD를 바꾸지 않는다. 실제 문서 커밋·push·PR 상태 기록의 결과는 ignored `commit-result.json`/최종 JSON과 현재 PR54에서 판별한다.

## 복구 경계

이동 전 중단이면 원래 source와 Git metadata를 유지하며 역이동할 대상이 없다. 현재 복구본을 만들었다고 주장하지 않는다. 실제 이동이 일부 진행된 경우에는 당시 source/destination·허브 index/.gitmodules·primary Git 연결·linked metadata와 검증된 백업을 보존하고 자동 역이동·삭제/reset을 하지 않는다.

## 다음 서명 APK 준비

이번 이동 검증과 별도로 서명 APK 생성·설치는 승인 범위 밖이다. 다음 단계는 최종 승인된 제품 SHA, 기존 applicationId/서명 계보·키 보존 및 승인된 빌드/전달 경로, 실제 기기의 Preview 표시·스플래시/인트로·동작 줄이기·회전/글자 확대·기존 데이터/.sq 복원 후 저장 확인이 필요하다. 키 내용을 출력하거나 새 키를 생성/교체하지 않는다.

별도 local Preview 준비에는 [최신 분석](iam-headcoach-local-preview-20261011-analysis.md)과 [앱 밖 SQ 백업·삭제 없는 업데이트·T7 안내](iam-headcoach-local-preview-20261011-install-guide.md)가 있다. 그 task의 서명/빌드 결과를 이번 이동 검증으로 가져오지 않는다. 휴대폰 설치본 version·인증서·자료 상태와 T7는 해당 안내에서도 미검증으로 구분한다.
