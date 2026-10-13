# iam-headcoach 로컬 폴더 전환 감사·새 세션 절차

2026-10-10 23:18~23:20 KST, orchestrator=Codex. **현재 이동 미실행**이다. `D:\station\repos\squad-maker`는 그대로 있고 `D:\station\repos\iam-headcoach`는 없다. 이 문서는 읽기 감사와 다음 세션의 실행 조건을 기록한다. 현재 Preview 변경·검증·기존 Draft PR54 업데이트를 먼저 마친 뒤 이 문서를 마지막 인계 자료로 사용한다.

최신 결정은 [분석](iam-headcoach-preview-20261010-analysis.md), [설계](iam-headcoach-preview-20261010-design.md), [작업계획](iam-headcoach-preview-20261010-tasks.md)을 따른다. 기술명은 `iam-headcoach`, 정식 브랜드는 `아이엠 헤드코치`, 현재 Android 테스트 표시명은 `아이엠 헤드코치 Preview`다. 폴더 이동은 GitHub 저장소·remote·도메인·공유 주소 변경을 포함하지 않는다. 제품 저장소 커밋과 허브 커밋도 함께 처리하지 않는다.

## 이전 경로 → 새 경로·보존 위치

| 대상 | 현재(source) | 전환 후(destination) | 경계 |
|---|---|---|---|
| 물리 primary main worktree | `D:\station\repos\squad-maker` | `D:\station\repos\iam-headcoach` | 유일한 폴더 이동 대상. primary의 branch/HEAD·사용자 자료 보존 |
| 허브 gitlink 경로 | `repos/squad-maker` | `repos/iam-headcoach` | 경로만 이동. 기존 index OID `54a97fc…` 유지 |
| `.gitmodules` 대상 path | `repos/squad-maker` | `repos/iam-headcoach` | 대상 section의 path만 변경. 기존 staged 변경 보존 |
| 서브모듈 logical name | `repos/squad-maker` | 기존 이름 유지 | path와 logical name은 다르다. section rename 불필요 |
| common gitdir | `D:\station\.git\modules\repos\squad-maker` | 같은 경로 유지 | objects/refs/index/worktrees를 함께 옮기지 않음 |
| 현재 Preview 작업 트리 | `D:\station\.worktrees\squad-maker-korean-branding-20261010` | 같은 경로 유지 | 이동 대상 primary와 구별. branch `feat/korean-branding-20261010` 유지 |
| 나머지 linked worktree 10개 | `D:\station\.worktrees\squad-maker-*` | 같은 경로 유지 | branch/HEAD/dirty·gitfile/backlink 보존 |
| 현재 dependency junction | 현재 작업 트리의 `node_modules` | 같은 경로·target 유지 | target은 `D:\station\.worktrees\squad-maker-editing-desk-20261010\node_modules` |
| Codex 저장 프로젝트 | `D:\station` | 같은 프로젝트 유지 후보 | 하위 폴더 이동만으로 프로젝트 루트를 바꿀 근거 없음. 실제 재연결 확인 필요 |
| 별도 기존 폴더 | `D:\workspace\repositories\apps\squad-maker` | 변경하지 않음 | 존재만 확인. 원격·용도·활성 세션 동일성 미확인 |

`D:\station\repos`, source 및 현재 작업 트리 자체는 조회 시 일반 디렉터리였다. 목적지는 파일·폴더 모두 부재했고 대상 gitlink도 없다. `Resolve-Path`/부모 경로 확인은 **이동 직전 다시 수행**한다. 상위 디렉터리 또는 대상이 reparse point로 바뀌거나 목적지가 새로 생기면 중단한다. 허용 대상은 위 두 primary 절대 경로뿐이며, `D:\station`, `repos` 전체·common gitdir·다른 저장소는 이동 범위가 아니다.

## 읽기 감사 결과와 한계

설치 Git은 `2.50.1.windows.1`이다. 셸은 `login=false`, Git 조회는 `-c core.fsmonitor=false`를 사용했다. 후속 조회는 `GIT_OPTIONAL_LOCKS=0`으로 선택적 index refresh를 억제했다. 소스 파일·Git 설정·index 수정, `git mv` dry-run/실행, worktree repair, 서버 종료·재시작은 하지 않았다. `.gitmodules` 원문·프로세스 argv/env·세션 JSONL 대화·시크릿은 읽거나 출력하지 않았다.

### primary·허브 보존 기준

| 항목 | 관측값 | 전환 때 유지할 조건 |
|---|---|---|
| primary branch/HEAD | `main` / `27a34ca97d5622d69effc46956ed23e9abb5a70a` | main 직접 커밋·checkout·pull하지 않음 |
| primary status | `?? .ux-review/` | untracked 자료를 삭제·무단 stage하지 않음 |
| primary gitfile | `gitdir: ../../.git/modules/repos/squad-maker` | 새 위치에서도 동일 common gitdir로 해석 |
| primary `core.worktree` | `../../../../repos/squad-maker` | 이동 후 `../../../../repos/iam-headcoach`로 해석되어 새 top-level과 일치 |
| 허브 HEAD | `f55a3664c904d8eecbda3332cfafbf9b3e1ce249` | 이동만으로 변경하지 않음 |
| 기존 index gitlink | mode `160000`, OID `54a97fcd2301ab27ec0ab57aec353162df767fe4`, stage0 | 새 path에도 같은 mode/OID/stage. primary `27a34ca…`나 PR54 HEAD로 바꾸지 않음 |
| `.gitmodules` status | `M  .gitmodules`; cached diff 있음, working/index diff는 없음 | 기존 staged delta 위에 path 변경만 추가. 다른 section·URL·의미 변경 없음 |
| `.gitmodules` HEAD blob OID | `4b289fd3406d21d9661db6c165cd909d975ffaf3` | 기존 baseline 식별자 |
| `.gitmodules` index blob OID | `0772678ff6a89392d48f2a30eab6e5730101f1b6` | 실행 전 baseline. 이동 후에는 path 수정으로 바뀌므로 전체 hash 동일성을 요구하지 않음 |
| `.gitmodules` working raw SHA-256 | `8034c0954f59934e19dfa25d9c9758f8f71edacb3f2a6ae256c78c0673484ccd` | 이전 naming-final 관측과 동일. 이동 전 fresh hash를 별도로 기록 |

허브에는 `.gitmodules` 외에도 다른 서브모듈·추적/미추적 변경이 있다. 현재 조회에는 이전 기록에 없던 다른 저장소의 dirty 표기도 관측됐다. 이 감사는 변경 원인·소유권을 판정하거나 다른 저장소의 내용을 비교하지 않는다. 대상 외 index entry·working 자료는 실행 전후 동일해야 하며, 전체 `git add`, `stash`, `reset`, `.gitmodules` HEAD 복원으로 상태를 정리하면 안 된다.

이전 `.work/korean-branding-20261010/naming-final/git-preservation.json`은 2026-10-10 13:01:42Z의 **메타데이터 기록**이다. primary·PR52/53·현재 작업 트리 HEAD, linked worktree 수, 허브 gitlink, working `.gitmodules` hash는 현 관측과 맞는다. 과거 JSON의 index/HEAD SHA-256은 UTF-8 trim 뒤 계산했고 working hash는 raw bytes이므로 서로 직접 비교하지 않는다. 과거 dirty 내용 전체의 원본 byte snapshot이 없어 모든 사용자 변경이 byte-identical이라는 증거로 쓰지 않는다. 현재 Preview 문서·라벨 변경은 root의 진행 작업이므로 현재 작업 트리가 과거 clean 상태와 다르다.

### linked worktree 연결

`git worktree list --porcelain`은 12개(primary1 + linked11)를 반환했다. 첫 항목은 물리 primary 대신 common gitdir 경로로 표시되므로 `core.worktree`와 `rev-parse --show-toplevel`을 함께 확인했다. 아래 모든 linked worktree의 `.git`은 common gitdir 아래 자기 admin directory를 가리키며, admin `gitdir`은 해당 worktree의 `.git`을 가리켰고 `commondir`는 `../..`였다. listed branch/HEAD와 각 worktree 조회가 일치했다. 경로는 모두 `D:\station\.worktrees\` 아래다.

| worktree 폴더 | branch | HEAD(축약) | 조회 시 status |
|---|---|---|---|
| `squad-maker-a-ui-20261007` | `feat/a-ui-20261007` | `d6c16cef` | clean |
| `squad-maker-brand-20261008` | `design/brand-20261008` | `a80e43db` | clean |
| `squad-maker-brand-headcoach-20261010` | `design/brand-headcoach-20261010` | `d41ea68f` | clean |
| `squad-maker-brand-run-line` | `feat/brand-run-line` | `e67e61da` | tracked3개 dirty |
| `squad-maker-data-safety-20261007` | `feat/a-android-preview-20261007` | `21c2b547` | clean |
| `squad-maker-editing-desk-20261010` | `codex/editing-desk-20261010` | `cda5d21f` | clean |
| `squad-maker-korean-branding-20261010` | `feat/korean-branding-20261010` | `56372fdf` | root의 현재 Preview 작업 변경·새 문서 있음 |
| `squad-maker-launch-readiness-20261010` | `feat/launch-readiness-20261010` | `d449d02b` | clean |
| `squad-maker-main-apk-release-20261009` | `feat/main-apk-release-20261009` | `a466e4c9` | clean |
| `squad-maker-preview-release-20261007` | `feat/explicit-save-export-ads-20261008` | `7f1f1a97` | tracked6개·untracked6개 항목 dirty |
| `squad-maker-ux-fix-20261009` | `fix/ux-fix-20261009` | `f4a0f729` | clean |

이 표의 clean은 Git status 관측이고 ignored build/cache·사용 중인 파일·프로세스 없음의 증거가 아니다. branch·HEAD는 다음 세션에서 갱신된 정상 작업 결과를 fresh baseline으로 기록한다. 과거 SHA로 되돌려 맞추지 않는다.

primary `node_modules`는 없었다. 현재 작업 트리의 junction target인 editing-desk `node_modules`는 일반 디렉터리로 존재했다. current `android`도 일반 디렉터리였다. 모든 worktree 하위 reparse point·npm/Gradle cache·IDE/MCP/자동화 설정은 전수 확인하지 않았다. source 내부 junction이 발견되면 target과 이동 영향을 별도 기록하고 링크 target까지 재귀 이동하지 않는다.

### 실행 중인 서버·세션

| local listener | 현재 PID/process | 이전 preservation 기록과 비교 | 실제 cwd·용도 |
|---|---|---|---|
| `127.0.0.1:4317` | `58568` / node | 이전 `53552`와 다름 | 미확인 |
| `127.0.0.1:4318` | `32112` / node | 이전 PID와 동일 | 미확인 |
| `127.0.0.1:4319` | `42248` / node | 이전 PID와 동일 | 미확인 |
| `4334` | 조회 시 listener 없음 | 이번 QA 예정 포트 | 이후 QA에서 생길 수 있어 종료 시 재조회 |

PID 동일성은 cwd나 프로세스 lifetime 전체의 동일성 증거가 아니다. 4317 PID 변화의 원인·담당 세션은 확인하지 않았다. 임의 PID 종료 없이 각 서버를 시작한 터미널/세션의 작업 경로와 소유자를 확인한 뒤 해당 소유자가 정상 종료해야 한다. 모든 포트는 변동 가능하므로 실제 이동 직전에 다시 조회한다.

Codex `list_projects`에서 저장된 local 프로젝트는 `station`, path `D:\station`으로 확인했다. 현재 루트 요청의 환경 cwd도 station이며, 이 감사의 Git 조회는 각 명시 경로에서 실행했다. 이것은 앱 내 모든 기존 task/attachment·터미널의 cwd를 확인한 결과가 아니다. 과거 naming 문서에는 station 및 별도 기존 폴더에 대응하는 Claude 세션 디렉터리가 기록되어 있지만 이번에는 대화 파일을 읽지 않았다. 세션 DB를 직접 치환하지 않는다. 기존 task의 UI 연결·MCP cwd·IDE workspace·자동화는 소유 세션에서 확인하고 지원되는 설정 방법으로 새 locator를 연결한다.

**지금 이동을 실행하지 않는 이유:** Preview 작업과 QA가 진행 중이고 서버/기존 세션의 실제 cwd·종료/재연결을 전수 확정하지 못했다. 현재 구조에서 이동을 영구적으로 할 수 없다는 판정은 아니다. 현재 작업을 끝낸 뒤 활동을 정리한 새 세션에서 fresh baseline과 아래 조건을 확인하면 된다.

## 공식 Git 근거와 방법 선택

- 설치 버전에 해당하는 [git-mv 2.50.0](https://git-scm.com/docs/git-mv/2.50.0)은 gitfile 서브모듈 이동 때 gitfile·`core.worktree`를 갱신하고 `.gitmodules` path 수정·stage를 시도한다고 설명한다. dry-run은 이동하지 않는다. 따라서 허브에서 대상 서브모듈 하나에 `git mv`를 사용하는 방법을 후보로 삼는다.
- [git-worktree 2.48.0](https://git-scm.com/docs/git-worktree/2.48.0)의 move 제한·repair·details에 따라 main worktree에 `git worktree move`를 적용하지 않는다. linked worktree는 별도 admin/gitfile 양방향 연결을 가진다. 이 버전의 문서는 submodule 지원 한계도 명시하므로 이 조합의 성공을 문서만으로 보장하지 않는다.
- [git-submodule 2.47.0](https://git-scm.com/docs/git-submodule/2.47.0)의 `sync`는 remote URL 동기화다. 여기서는 URL을 바꾸지 않으므로 자동으로 실행할 단계가 아니다. 이미 common gitdir에 연결된 구조이므로 `absorbgitdirs`도 필요하지 않다.
- 추가로 [Git v2.50.1의 공식 mv 구현](https://github.com/git/git/blob/v2.50.1/builtin/mv.c)을 확인했다. 서브모듈 처리에는 `.gitmodules` stage 적합성 검사, path 연결 갱신, 기존 index entry의 이름 변경이 있다. **기존 gitlink OID가 보존되는 것이 기대 동작**이지만 설치된 Windows 빌드의 실제 이동 결과로 다시 검증한다. dry-run도 index lock을 잡을 수 있으므로 writer가 없는 상태에서 실행한다.

현재 `.gitmodules`는 이미 staged이고 working/index diff는 없었다. 이 상태를 dirty라는 이유로 reset/stash하지 않는다. 다음 세션에 unstaged delta나 conflict가 새로 있으면 기존 작업 소유자와 보존 방법을 정한 뒤 진행한다. `git mv`가 `.gitmodules` 전체를 stage하므로 무관한 unstaged 내용을 무단으로 포함할 수 있는 상태에서는 멈춘다.

이번 계획에서는 common gitdir와 linked worktree 경로를 그대로 둔다. 따라서 이들의 기존 양방향 연결은 바뀌지 않을 것으로 예상되지만 이는 경로 구조에 근거한 판단이다. 이동 뒤 11개 모두 실제 Git 조회로 확인한다. common gitdir까지 옮기는 수동 Move-Item·rename, blanket `worktree repair`, 직접 config/backlink 편집을 이 절차에 끼워 넣지 않는다. 연결이 끊기면 자료를 보존하고 repair가 필요한 실제 경로·버전·변경 범위를 먼저 확인한다.

## 새 세션에서 실행할 순서

### 1. 현재 작업 종료·fresh baseline

현재 Preview 검증과 PR54 처리를 완료하고 최종 HEAD·결과·인계 문서를 남긴다. 이동을 시행할 다음 세션은 기존 primary 안이 아닌 안정적인 허브 `D:\station`에서 시작한다. 다음 세션은 공통 rules·station CLAUDE·repo AGENTS/CLAUDE와 본 문서를 다시 읽고 orchestrator=Codex로 유지한다.

실제 이동 전 owner별 서버·터미널·IDE·빌드·agent 세션을 확인한다. source 또는 관련 자료를 사용하는 세션의 작업을 끝내고 정상 종료/재연결 계획을 확인한다. 소유자·cwd가 불명확하면 이동을 보류하고 확인 가능한 나머지 검증만 진행한다. 4317/4318/4319/4334를 재조회하고 QA가 생성한 서버도 포함한다.

허브 index/HEAD·대상 gitlink, `.gitmodules` index blob/working hash 및 기존 staged/unstaged 경계, 모든 worktree branch/HEAD/status·gitfile/common dir/backlink를 fresh baseline으로 보존한다. ignored·untracked 자료는 파일 목록·크기/hash와 소유자를 확인한다. 필요한 로컬 복구본은 별도 안전 경로에 두고 시크릿·`.env`를 출력·커밋·업로드하지 않는다. 이전 JSON은 비교 참고이며 fresh 복구본을 대신하지 않는다.

### 2. 절대 경로·목적지 확인과 dry-run

다음 읽기 명령은 예시이며 이동 전 새 세션에서 실행한다. 모든 Git 명령의 exit code를 확인하고 실패 시 다음 단계로 넘어가지 않는다. 경로 문자열뿐 아니라 `Resolve-Path`와 부모/대상의 `Attributes,LinkType,Target`을 대조하여 source·부모가 예상 위치이고 목적지가 부재한지 확인한다.

```powershell
$env:GIT_OPTIONAL_LOCKS = '0'
Get-Location
Resolve-Path -LiteralPath 'D:\station\repos'
Resolve-Path -LiteralPath 'D:\station\repos\squad-maker'
Get-Item -LiteralPath 'D:\station\repos','D:\station\repos\squad-maker' | Select-Object FullName,Attributes,LinkType,Target
Test-Path -LiteralPath 'D:\station\repos\iam-headcoach'
git --version
git -c core.fsmonitor=false -C D:\station ls-files --stage -- .gitmodules repos/squad-maker repos/iam-headcoach
git -c core.fsmonitor=false -C D:\station diff --name-status -- .gitmodules
git -c core.fsmonitor=false -C D:\station\repos\squad-maker rev-parse --show-toplevel --absolute-git-dir --git-common-dir
git -c core.fsmonitor=false -C D:\station\repos\squad-maker worktree list --porcelain
git -c core.fsmonitor=false -C D:\station mv --dry-run -- repos/squad-maker repos/iam-headcoach
```

dry-run은 **이번 감사에서 미실행**이다. source 하나와 destination 하나만 예고하고 성공해야 한다. 성공은 Windows 열린 파일/실제 rename·재연결 성공을 보장하지 않는다. dry-run 전후 index OID/target gitlink·경로·metadata가 변하지 않았는지 확인한다. 새 충돌/lock·정의되지 않은 source·destination 중첩·새 symlink/junction·설정 차이가 있으면 중단하며 `--force`, `-k`로 통과시키지 않는다.

### 3. 종료 확인 뒤 primary만 Git-aware 이동

fresh baseline·복구 계획·활성 세션 종료·목적지 부재·dry-run 통과가 모두 확인된 다음, 허브 `D:\station`에서 한 번만 수행할 후보 명령이다. 현재 실행하라는 뜻이 아니다.

```powershell
git -c core.fsmonitor=false -C D:\station mv -- repos/squad-maker repos/iam-headcoach
```

이는 허브 index와 `.gitmodules`를 수정하는 작업이다. `.gitmodules` 대상 path, gitfile·`core.worktree` 갱신과 gitlink 경로 rename을 한 경계로 검토한다. 무관한 기존 staged delta가 사라지거나 새 gitlink OID가 `27a34ca…`/PR54 HEAD로 바뀌면 성공으로 보고하지 않는다. 명령이 실패하거나 일부만 진행되면 source/destination·index·Git metadata를 그대로 보존한 채 멈춘다. 자동 역이동·삭제·reset·prune·submodule update로 덮어쓰지 않는다.

### 4. 새 경로에서 세션 재개·Git 연결 확인

이동 후 새 primary 루트 `D:\station\repos\iam-headcoach`를 실제 작업 경로로 여는 새 Codex 세션을 시작한다. 앱 저장 프로젝트가 station이면 프로젝트는 유지하면서 대상 파일·터미널 cwd를 새 primary로 연결한다. Preview 개발을 계속하는 task는 기존 linked worktree를 그대로 열고 primary와 혼동하지 않는다. 이동만으로 primary `main`에 PR54 코드를 checkout하지 않는다.

```powershell
$env:GIT_OPTIONAL_LOCKS = '0'
git -c core.fsmonitor=false -C D:\station\repos\iam-headcoach rev-parse --show-toplevel --absolute-git-dir --git-common-dir
git -c core.fsmonitor=false -C D:\station\repos\iam-headcoach config --get core.worktree
git -c core.fsmonitor=false -C D:\station\repos\iam-headcoach branch --show-current
git -c core.fsmonitor=false -C D:\station\repos\iam-headcoach rev-parse HEAD
git -c core.fsmonitor=false -C D:\station\repos\iam-headcoach status --short
git -c core.fsmonitor=false -C D:\station\repos\iam-headcoach worktree list --porcelain
git -c core.fsmonitor=false -C D:\station config -f .gitmodules --get submodule.repos/squad-maker.path
git -c core.fsmonitor=false -C D:\station ls-files --stage -- repos/squad-maker repos/iam-headcoach
git -c core.fsmonitor=false -C D:\station submodule status --cached -- repos/iam-headcoach
git -c core.fsmonitor=false -C D:\station submodule status -- repos/iam-headcoach
```

필수 비교 대상은 새 primary의 top-level, 같은 common gitdir, 기존 main/HEAD, 옛 path의 index 제거와 새 path의 동일 gitlink OID, 11 linked worktree의 HEAD/status/backlink다. cached status는 `54a97fc…`, 물리 primary는 `27a34ca…`라는 기존 차이를 유지하므로 일반 submodule status의 `+`는 이동 실패의 증거가 아니다. 차이를 없애기 위한 update/add를 하지 않는다.

`git worktree list`의 primary 표시가 여전히 common gitdir이더라도 그것만으로 실패를 판정하지 않고 새 primary의 `--show-toplevel`과 `core.worktree`를 확인한다. 각 linked worktree에서도 branch/HEAD/status·absolute gitdir/common dir를 다시 조회하고 `.git` ↔ admin `gitdir`·`commondir`가 서로 같은 실제 경로를 가리키는지 확인한다.

### 5. 자료·import·bundle/Capacitor sync·도구 재연결 검증

새 primary의 `.ux-review/` 등 사용자 자료·ignored/untracked 목록/hash, 허브 대상 외 staged/index entry·변경 경계, 모든 linked worktree dirty 목록과 내용을 fresh baseline에 대조한다. 허브 `.gitmodules` diff는 기존 delta 위에 대상 path 한 곳만 추가되는지 로컬에서 검토하고 원문·URL을 대화나 외부로 내보내지 않는다.

새 경로에서 package scripts와 상대 import·asset references, junction target·dependency resolution·Gradle 생성 상대 경로를 읽기 확인한다. primary는 다른 HEAD(main)이므로 Preview task의 검증 결과를 primary 이동 검증으로 대신하거나 main의 구 제품명을 네이밍 누락으로 판정하지 않는다. 실제 새 primary에서 필요한 dependency·bundle·Capacitor sync/unsigned 검증은 **그 HEAD의 README/scripts와 새 세션의 승인 범위**에 따라 수행하고 결과를 남긴다. linked Preview 작업 트리에도 영향이 없는지 최소 회귀를 확인한다. 기존 session DB·historical docs/worktree 이름을 전역 치환하지 않는다.

서버는 확인된 소유 터미널에서 새 cwd로 재시작한 후 실제 페이지·API·Git·MCP 연결을 확인한다. Git submodule `sync`와 Capacitor sync는 다른 작업이며, URL 변경이 없는 이번 이동의 Git submodule sync는 불필요하다. 사용자 저장·복원·export·공유 계약, Android ID·서명 계보·Preview 표시, 원격/공개 주소는 보존한다. 키 접근·서명·설치·배포를 이동 검증에 추가하지 않는다.

허브 commit/push/PR은 현재 범위에서 미승인이다. 허브 path 변경을 남긴 상태와 기존 staged delta를 명시하고, 영속적인 허브 commit이 필요하면 독립 작업·feature branch·검토 범위로 분리한다. 현재 제품 저장소의 PR54 업데이트와 동시에 허브 commit하지 않는다.

## 새 세션 점검 체크리스트

- [ ] 기존 Preview 작업의 최종 HEAD·검증·Draft54 업데이트 결과를 확인했다.
- [ ] rules/station CLAUDE/repo AGENTS·CLAUDE·최신 분석/설계/본 문서를 읽었다.
- [ ] 대상 source/destination의 절대 해석·부모·reparse point·목적지 충돌을 다시 확인했다.
- [ ] 허브 staged delta·index gitlink와 primary main/HEAD의 기존 차이를 fresh baseline으로 기록했다.
- [ ] 11 linked worktree의 HEAD/branch/status·양방향 Git 연결과 ignored/untracked 보존 자료를 기록했다.
- [ ] source 관련 세션/IDE/MCP/자동화와 4317/4318/4319/4334 서버의 소유자·cwd·정상 종료/재연결을 확인했다.
- [ ] `git mv --dry-run`을 통과했고 baseline·경로가 유지된다.
- [ ] Git-aware 이동 결과에서 `.gitmodules` 기존 delta·gitlink OID·primary/linked HEAD·자료가 보존됐다.
- [ ] 새 primary와 기존 linked worktree의 실제 Git 읽기·dependency/import·필요한 bundle/sync 검증을 통과했다.
- [ ] 새 cwd 서버·IDE·MCP 등 실제 연결을 확인했고, 미확인 항목을 명시했다.
- [ ] 원격/도메인 rename·허브 commit·키/서명·설치·배포가 추가되지 않았다.
- [ ] 이동 전후 경로와 검사 결과를 근거로 완료/중단을 판정했다. 파일 존재만으로 완료 선언하지 않았다.

## 마지막 사용자 재개 프롬프트

아래 문구는 현재 작업 종료 뒤 **D:\station에서 시작하는 새 Codex 세션**에 전달한다. 이동 후 재연결 점검 task는 새 primary에서 연다.

> 기술명 iam-headcoach 폴더 전환을 이어서 진행해 줘. 먼저 `D:\station\.worktrees\squad-maker-korean-branding-20261010\docs\iam-headcoach-preview-20261010-folder-transition.md`와 최신 Preview 분석/설계/작업계획, 공통 rules·station CLAUDE·repo AGENTS/CLAUDE를 읽어. 현재 Preview 작업의 최종 HEAD·Draft PR54·검증 완료를 확인한 다음 `D:\station\repos\squad-maker` → `D:\station\repos\iam-headcoach`의 상태를 다시 감사해. primary main과 허브 index gitlink의 기존 차이, staged `.gitmodules`, 11 linked worktree·junction·ignored/untracked 자료를 보존해. 세션·서버의 실제 cwd/소유자·정상 종료/재연결과 fresh baseline을 먼저 확인하고, 목적지 부재·Git mv dry-run·보존 조건이 충족되면 문서의 Git-aware 이동을 진행해. 미확인 사용자가 있으면 추측 종료나 강제 이동을 하지 말고 이유와 다음 확인을 알려 줘. 이동 뒤 새 primary 세션의 실제 Git·import/dependency·필요한 bundle/Capacitor sync 및 서버/MCP 연결을 검증해. 현재 PR54와 허브 commit을 묶지 말고 원격/도메인 rename·push·키/서명·설치·배포를 추가하지 마. 실제 이동·재연결이 확인된 범위만 완료로 보고해.
