# iam-headcoach 폴더 이동 분석

2026-10-11 KST, orchestrator=Codex. 실행 세션의 cwd는 `D:\station`으로 유지한다. 이 세션이 백업·이동·새 위치 검증·문서·PR54 처리의 유일 실행 담당자다. 원래 요청 세션은 읽기와 결과 확인만 한다.

## 승인된 목표와 경계

`D:\station\repos\squad-maker`를 `D:\station\repos\iam-headcoach`로 안전하게 이동하고 Git 연결·자료·실제 새 위치 빌드를 검증한다. 필요한 경로 수정과 본 기록만 기존 PR54 브랜치에 commit/push하고 같은 Draft의 제목·본문을 갱신하는 범위는 이미 승인됐다. 이전 문서의 재승인 조건보다 최신 사용자 지시를 우선한다.

primary main에 PR54를 checkout/merge하지 않는다. 다른 worktree, 광고, Android ID/Java package/서명 계보, 저장 형식·schema·`.sq`, remote/domain, 공개 배포 경로를 보존한다. 허브의 기존 staged 변경을 제품 커밋에 포함하지 않는다. main merge, Release/Play, 서명 APK 생성·설치, 키·인증 설정, force push·브랜치 삭제는 범위 밖이다.

## fresh 확인된 상태

| 항목 | 이번 조회 |
|---|---|
| 설치 Git | `2.50.1.windows.1` |
| primary | `main`, `27a34ca97d5622d69effc46956ed23e9abb5a70a`, `?? .ux-review/` |
| PR54 작업 트리 | `feat/korean-branding-20261010`, `c93ac560b65dd2aaaaa0743d15da941e03854314`, 이번 문서 추가 전 baseline은 clean |
| source·station·repos·D 드라이브 루트 | 일반 디렉터리, reparse point 아님; source/부모 Resolve-Path 확인 |
| destination | 존재하지 않음 |
| primary gitfile/common gitdir | `../../.git/modules/repos/squad-maker`, `D:\station\.git\modules\repos\squad-maker` |
| primary core.worktree | `../../../../repos/squad-maker` |
| worktree 목록 | primary 1 + linked 11; PR52 `d449d02b…`, PR54 `c93ac560…` 포함 |
| 허브 대상 gitlink | stage 0, mode `160000`, OID `54a97fcd2301ab27ec0ab57aec353162df767fe4` |
| .gitmodules index blob | `0772678ff6a89392d48f2a30eab6e5730101f1b6` |
| .gitmodules raw SHA-256 | `8034c0954f59934e19dfa25d9c9758f8f71edacb3f2a6ae256c78c0673484ccd` |
| .gitmodules staged/unstaged | 기존 staged `M  `, working/index diff exit 0 |

허브에는 다른 저장소의 staged/unstaged 변경도 있다. 과거 SHA로 되돌리지 않고 fresh baseline을 보존한다. 위 목록 조회만으로 모든 linked worktree의 dirty 내용·ignored 자료·양방향 연결 보존을 검증한 것은 아니다.

작업 중 PR54에 정상 문서 커밋 `2b5891e06315fbf7ba13f4cca62af08a0b69ab2f`(`docs(preview): prepare local signed APK handoff`)이 추가됐다. 최신 local-preview 분석/설계/계획/설치 안내4개를 읽고 보존했다. README diff는 migration 인덱스1행만 남아 있어 새 Preview 연결을 덮어쓰지 않았다. 원래 c93 비교 검사는 최신 SHA 차이로 중단했으며 이를 되돌려 맞추지 않는다. 같은 브랜치의 별도 APK 빌드가 진행 중이므로 그 시작/끝 SHA를 바꾸지 않도록 문서 commit은 종료 확인 뒤 처리한다. 원격 origin과 실제 push 목적지는 `git@github.com:jaywapp/squad-maker.git` 일치를 비밀값 없이 확인했다.

## 부족한 정보와 중단 조건

**안전 게이트 blocked: IDE의 열린 source 파일·미저장 상태와 station cwd의 다른 Codex/Claude 세션이 source를 사용하지 않는다는 사실을 확정할 수 없다.** 이 세션의 native 앱 API가 비활성화되어 IDE 미저장 UI를 확인할 수 없다. 2026-10-11 05:04 KST 읽기 감사에서 선택 대상 283개 프로세스의 실제 cwd 조회는 모두 성공했고 primary source cwd는 0개였지만, 이는 열린 파일이나 `-C` 사용 부재의 증거가 아니다. argv/env/대화/버퍼 내용은 읽지 않았다.

4317 PID58568은 `D:\station\repos\kickwork\`, 4318 PID32112는 `D:\station\.worktrees\squad-maker-brand-run-line\`, 4319 PID42248은 `D:\station\.worktrees\squad-maker-ux-fix-20261009\`를 cwd로 사용한다. OS owner는 모두 `JAYWAPP\jaywa`이며 이번 작업 소유로 입증되지 않았다. 4334 listener는 없다. 이동 대상 primary 밖의 서버이므로 종료하지 않았고 일괄 종료가 필요하지 않다.

VS Code 12개 중 PID24060의 cwd와 Claude 15개 중 5개의 cwd는 station이다. VS Code Gradle 확장 cwd의 Java PID30052도 source 사용·빌드 여부를 확정할 수 없다. Codex 지원 목록(4 pinned + 최근50)의 station cwd 활성 `fc-squad-maker` 채팅 및 로컬 VS Code workspace metadata25개/global storage 읽기 결과 역시 source 미사용·미저장 부재를 증명하지 않는다.

사용자가 source 관련 편집 내용을 저장하고 해당 IDE 파일/프로젝트를 닫은 뒤, source를 사용하는 세션·터미널·빌드가 정상 종료되거나 source 밖으로 전환됐음을 확인해야 한다. 확인 후 fresh baseline부터 재개한다. 이 조건은 최신 사용자 지시의 중단 조건이며 추가 이동 승인 요청이 아니다. 백업·dry-run·이동·새 위치 검증은 미실행으로 중단한다.

백업은 source/destination 밖, Git에 포함되지 않는 안전 경로에 모든 tracked/untracked/ignored 파일과 복구용 Git metadata를 포함해야 한다. 허브 `.work`의 ignore는 확인되지 않았으므로 백업 후보에서 제외한다. `%TEMP%` 부모는 여러 sandbox 계정의 접근 권한을 포함해 그대로 사용하지 않으며, 고유 하위 디렉터리의 제한 ACL과 복구 검증이 필요하다. 현재 백업 생성·검증은 미실행이다.

destination 충돌, reparse point 변경, .gitmodules unstaged delta/conflict, 동시 writer, 백업/권한 검증 불가, Git 이동 실패·부분 진행은 중단 조건이다. 자동 역이동·삭제/reset/prune/submodule update를 수행하지 않는다.

## 완료 기준

안전 게이트 → 전체 로컬 복구본 검증 → git mv dry-run → 단일 submodule git mv → HEAD/branch/remote/index/gitlink/common dir 및 linked 11 연결·자료 비교 → 실제 새 primary HEAD의 단위/전체 desktop·mobile E2E/Android bundle·sync/unsigned release/lint/문서·자산 참조 → 새 cwd 서버·주요 화면·MCP/IDE 재연결 → 서버 정리 → 기록·기존 Draft54 업데이트 순이다. 실패·미완료·skip·실기기 미검증을 분리한다. 과거 CI나 다른 worktree의 성공은 새 위치 성공의 근거로 사용하지 않는다.

[설계](iam-headcoach-migration-20261011-design.md) · [작업계획](iam-headcoach-migration-20261011-tasks.md) · [결과·복구](iam-headcoach-migration-20261011-report.md) · [이전 전환 절차](iam-headcoach-preview-20261010-folder-transition.md)
