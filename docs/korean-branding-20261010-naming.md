# 한글 브랜딩 네이밍 대응표와 경로 전환 조건

2026-10-10, orchestrator=Codex. 이 문서는 이름 영향 감사와 향후 경로 전환 조건을 기록한다. 실제 루트 이동, GitHub 저장소·호스팅 이름 변경, 서버 재시작, 배포·서명·설치는 수행하지 않았다.

## 기준과 결정 상태

- 기능 기준: PR52 `d449d02b9f90133bda905dda90acf7a49b4277f1`. 한글 적용 작업 트리는 이 커밋에서 분리한 `feat/korean-branding-20261010`이다.
- 승인 자산 기준: PR53 `d41ea68ff27061e8b1d3c3d8f9c9dca34f889c12`의 아이엠 헤드코치 A안. 마크·색·아이콘·Run Line 개선·광고는 유지한다.
- 사람에게 보이는 이름은 `아이엠 헤드코치`로 승인되었다. 공백은 한 개이며 영문 병기와 새 부제는 추가하지 않는다.
- 기술 이름은 `iam-headcoach` 추천, `i-am-headcoach` 대안으로 **미확정**이다. npm·제품용 자산 경로·향후 로컬 폴더에 어느 이름도 확정값으로 적용하지 않는다.
- Android 표시 이름은 `아이엠 헤드코치 Preview` 추천과 `아이엠 헤드코치` 사이에서 **미확정**이다. 런처에서 잘린다는 이유로 별도 축약명을 정하지 않는다.
- 상표에 관한 사용자 참고 자료는 참고 범위로만 취급한다. 법적 사용 가능·불가, 국내외 상표 조사 완료, 등록 가능성을 결론 내리지 않는다. 참고 자료의 원문이나 사용자 제공 주소를 이 문서에 복사하지 않는다.

최신 통합 계약은 [분석](korean-branding-20261010-analysis.md), [설계](korean-branding-20261010-design.md), [작업 계획](korean-branding-20261010-tasks.md)을 따른다. 아래 표는 변경 대상의 대응표이며 적용 완료를 뜻하지 않는다. 통합 이후의 실제 완료 여부는 작업 계획과 최종 diff·검증 결과로 판정한다.

## 이전 이름 → 새 이름 대응표

| 분류 | 실제 이전 값·위치 | 새 값 또는 대응 | 결정·검증 경계 |
|---|---|---|---|
| 사람용·승인 | `index.html` 헤더/인트로 워드마크 `SQUAD MAKER` | 승인 A안 아웃라인 `아이엠 헤드코치` | 공급 SVG path·간격·색을 사용. 기존 ready 계약과 모션 제어 보존 |
| 사람용·승인 | 인트로 `bi-ko`의 한글 보조 이름 | 보조 표기 제거 | 이름 자체가 한글이므로 A안에 따라 제거. 새 부제 없음 |
| 사람용·승인 | title, `og:title`, `twitter:title`의 `스쿼드 메이커, 축구 포메이션 & 전술 공유` | `아이엠 헤드코치, 축구 포메이션 & 전술 공유` | 설명 부분은 그대로 유지 |
| 사람용·승인 | 로고 SVG·인트로·main의 `aria-label="스쿼드 메이커"` | `aria-label="아이엠 헤드코치"` | h1 유일성·접근성 이름·설명 주석 비노출 확인 |
| 사람용·승인 | `스쿼드 메이커 사용 안내` | `아이엠 헤드코치 사용 안내` | 도움말 내용과 기능은 유지 |
| 사람용·승인 | 인터뷰 메일 제목의 `[스쿼드 메이커]` | `[아이엠 헤드코치]` | 제목만 변경. 수신처·메일 전달 동작 유지 |
| 사람용·승인 | `[스쿼드 메이커 진단 정보]` | `[아이엠 헤드코치 진단 정보]` | 진단 payload·복사·버전 출처 유지 |
| 사람용·승인 | README 제목 `스쿼드 메이커` | `아이엠 헤드코치` | 현재 제품 설명만 정합화. 과거 이력은 별도 분류 |
| 사람용·승인 | package description `SQUAD MAKER — 아마추어 축구 전술 보드` | `아이엠 헤드코치 — 아마추어 축구 전술 보드` | 설명 metadata이며 기능·의존성 변경 없음 |
| 사람용·조건부 | capacitor `appName`, Android `app_name`·`title_activity_main`: `스쿼드 메이커 Preview` | `아이엠 헤드코치 Preview` 추천 또는 `아이엠 헤드코치` | Preview 답변 전 적용 대기. appId·scheme와 분리 |
| 사람용·승인 | release 표시 제목 `SQUAD MAKER Preview ${info.versionName}` | `아이엠 헤드코치 Preview ${info.versionName}` | 사용자에게 보이는 제목만. APK 파일명·tag·marker·version은 유지 |
| 기술용·조건부 npm | package `name` 및 lockfile root/`packages[""]`의 `squad-maker` | `iam-headcoach` 추천 또는 `i-am-headcoach` | slug 답변 후 세 위치 일치. private 패키지이며 감사 범위에서 자기 이름 import는 발견하지 못함 |
| 기술용·조건부 제품 복사본 | 공급 generic `logo-header.svg`, `wordmark.svg`, `brand-intro.snippet.html` 등 | 필요할 때만 `assets/branding/<확정 기술 이름>/`의 제품 복사본 제안 | 새 경로가 필요하다는 결정도 별도. 파일 복사 시 원본 해시·출처와 참조 연결 검증. 인라인만 사용하면 불필요한 복사본을 만들지 않음 |
| 자산 원본·보존 | `docs/branding/headcoach/assets/svg`, `assets/web`, `assets/png`, `assets/*/unchanged` | 같은 경로·원본 유지 | 공급 패키지와 provenance를 기술 slug에 맞춰 이동하지 않음 |
| 자산 원본·보존 | `docs/branding/headcoach/tools` 및 기존 원본 작업 문서 | 같은 경로·원본 유지 | 변환용 구 이름 match 조건까지 치환하지 않음. 최신 적용 차이는 통합 문서에서 설명 |
| 호환성·공개 계약 | packageID, 저장 키, globals·이벤트, API·릴리스 식별자 | 기존 값 유지 | 아래 보존 계약 참조 |
| framework·표준 | `ic_launcher`, Android resource 키, `MainActivity`, `:app`, capacitor 생성 설정·상대 빌드 경로 | 유지 | 브랜드 문자열과 별개. generated 내용은 검증된 빌드/sync로만 재생성 |
| framework·현재 설정 | `android/settings.gradle`에는 `rootProject.name` 없음 | 추가하지 않음 | 이름 변경만으로 새 Gradle 설정을 만들 필요 없음 |
| 과거 이력·보존 | `docs/branding/run-line`, 과거 analysis/design/tasks, 날짜별 테스트·branch·worktree 이름 | 기존 이름 유지 | 과거 시점과 승인 근거를 보존. 현재 안내만 최신 통합 문서에 연결 |
| 폴더·조건부 | `D:\station\repos\squad-maker` | `D:\station\repos\<확정 기술 이름>` 제안 | 실제 루트 이동 승인 없음. 경로 전환은 아래 별도 절차 |
| 타 저장소·범위 밖 | `repos/fc-squad-maker` | 유지 | 이름 일부가 같아도 독립 저장소 |
| 별도 기존 경로·미확인 | `D:\workspace\repositories\apps\squad-maker` | 자동 변경하지 않음 | 존재만 확인. station 대상과 동일한 원격·용도인지는 미확인 |

표시 이름을 검증하는 `beta-ui.spec.js`의 진단 제목과 `launch-brand-feedback-20261010.spec.js`의 로고 접근성 기대값은 같은 승인 이름으로 정합화한다. `platform-native.test.js`의 `Squad Maker`는 합성 AppInfo fixture 이름이며 실제 설치 이름의 증거가 아니다. fixture 이름을 정리해도 id/version/build 검증은 유지한다. 저장 키·도메인·globals를 쓰는 테스트는 새 브랜드로 치환하지 않는다.

## 고정 보존 계약

| 영역 | 보존 값·형태 | 이유·검증 |
|---|---|---|
| Android 설치 정체성 | `com.jaywapp.squadmaker.preview`의 appId/applicationId/namespace/Java package 및 custom URL scheme | 표시 이름과 설치 식별자를 분리. 기존 서명 정체성·버전 계보도 유지. 키 자료를 읽거나 문서에 기록하지 않음 |
| 로컬 저장 | `squad-maker-v1`, `squad-maker-library-v1`, schema·CAS·canonical snapshot·undo 계약 | 기존 전술과 라이브러리 복구·동시 저장 보호. 키 변경이나 데이터 마이그레이션을 추가하지 않음 |
| 백업 | `.sq` 확장자와 기존 데이터 버전·검증 형태 | 기존 백업 복원과 공유 데이터 해석 유지 |
| 공개 JavaScript | `SquadMakerContract`, `SquadPlatform`, `SquadUi`, `SquadLibrary`, `SquadFeedbackClient` | UI·native facade·테스트·기존 외부 연동 계약 |
| 이벤트·native plugin | `squad-maker:state`, `squad-maker:result`, `SquadStorage`, `SquadDocuments`, `SquadAds` | 구독·bridge 등록 유지. 실제 AppInfo는 기존 Capacitor App.getInfo 사용 |
| 서버 identity | 기존 API repository 값, `squad-maker-feedback-relay` User-Agent | GitHub issue 대상과 API 요청 계약 유지 |
| 외부 주소 | 기존 Pages 공유 base, feedback endpoint, OG 이미지 주소, 공개 APK 링크 | 여기서 주소를 복사하지 않음. 기존 값을 기준으로 동일성 검증. 현재 제보 API 404 제약은 이름 변경으로 해소되지 않음 |
| 릴리스 | `squad-maker-latest.apk`, `squad-maker-apk-release:v1`, release tag·build-info 구조 | 기존 다운로드·중복 게시 방지·출처 연결 유지 |
| 빌드 임시 파일 | `squad-maker-aligned-unsigned.apk`, `squad-maker-0.1.0-preview.1.apk` | 내부 이름을 바꿀 이익이 작음. producer/consumer 변경과 불필요한 회귀를 피하도록 보존 |
| CI | `squad-maker-production` concurrency, 기존 repository gate | 배포 실행 순서와 배포 대상 유지. 운영 lineage를 표시 이름에 맞춰 새로 만들지 않음 |
| 제품 기능·자산 | Run Line 마크·아이콘·favicon·시스템 splash·팔레트·ads | 승인 A안의 최소 변경 경계. 편집·저장·복원·공유 동작 보존 |

이 보존 목록을 바꾸는 작업은 네이밍 정리의 일부로 처리하지 않는다. 별도 호환성 설계·승인·검증이 필요하다.

## 이전 이름이 남는 곳의 판정

| 분류 | 남아도 되는 예 | 판정·대응 |
|---|---|---|
| 호환성 | packageID, 저장 키, globals, 이벤트, endpoint·repository identity, APK 파일명·marker·CI group | 의도된 잔존. 보존 계약과 테스트에 대응하면 누락으로 보지 않음 |
| 과거 기록·원본 | 기존 PR/branch/worktree·날짜별 문서, 공급 원본, 도구의 old-match 입력 | 의도된 이력. 원문을 새 이름으로 덮어쓰지 않고 최신 통합 문서로 연결 |
| 변경 대기 | npm name·제품용 자산 경로·로컬 루트·Android Preview 결정 | 미확정 상태를 기록. 답변 전 구현·이동하지 않음 |
| framework·업무 용어 | `.squad-tabs`, snapshot의 `squads`, Android resource 키·클래스, capacitor 파일명 | 전술 자료 구조·표준 식별자. 브랜드의 이전 이름으로 분류하지 않음 |
| 누락 | 최종 통합 뒤 실제 사용자에게 보이는 구 워드마크, title·접근성 이름·도움말·진단 제목, 현재 README 제목 | 승인 목록 대상인데 남았으면 누락 후보. 문맥·실제 렌더·최종 diff로 확인하고 소유자에게 수정 요청 |

검색 결과를 0건으로 만드는 것이 완료 기준은 아니다. 최종 검사에서는 vendor·generated·과거 자료를 구분하고, 남은 제품명 각각을 이 분류 중 하나에 연결한다. 주석 안 예제와 실제 h1을 혼동하거나 `squad` 업무 용어를 브랜드로 오인하지 않는다.

## station 경로·세션 감사 근거

아래는 2026-10-10 감사 시점의 관측이다. 향후 이동 시점에는 다시 조회해야 한다.

- station `.gitmodules`의 대상 section/path는 `repos/squad-maker`이다. 원본 `.git`은 `../../.git/modules/repos/squad-maker`를 가리키고 `core.worktree`는 `../../../../repos/squad-maker`이다. 내부 gitdir/section 이름을 표시 브랜드와 함께 바꿀 필요는 없다.
- station `.gitmodules`는 이미 변경된 상태였다. station index의 대상 gitlink는 `54a97fcd2301ab27ec0ab57aec353162df767fe4`, 물리 primary main은 `27a34ca97d5622d69effc46956ed23e9abb5a70a`였다. 둘의 차이는 기존 상태이며 PR52 HEAD로 자동 갱신하면 안 된다.
- primary의 기존 untracked `.ux-review/`와 station의 관련 없는 변경을 보존한다. hub commit은 제품 저장소 commit과 독립이며 별도 승인 대상이다.
- 최초 감사에는 linked worktree 10개가 있었다. 한글 브랜딩 작업 트리 추가 후 다시 읽은 목록은 linked worktree 11개다. 기존 PR52/PR53 작업 트리와 branch·HEAD 연결은 그대로 남아 있다.
- `git worktree list`의 primary 표기는 common gitdir 위치로 나왔지만 실제 작업 디렉터리는 `core.worktree`로 확인했다. 목록 문자열만으로 primary를 이동 대상으로 결정하지 않는다.
- Codex의 관측된 저장 프로젝트 루트는 station이고, 기존 squad-maker task의 cwd도 station이었다. 하위 폴더가 바뀌어도 저장 프로젝트 루트를 자동 변경해야 한다는 근거는 없다. 오래된 task 전체의 cwd/attachment는 전수 확인하지 않았다.
- Claude에는 station 세션 디렉터리와 위 별도 기존 경로에 대응하는 세션 디렉터리가 있었다. 후자는 JSONL 파일 40개를 목록으로만 확인했다. 대화 내용·사용자 자료를 읽거나 복사하지 않았다.
- 관련 Node 프로세스와 localhost 4317/4318/4319 listener를 메타데이터로 확인했지만 각 서버의 실제 cwd는 확정하지 못했다. 명령행·환경값은 출력하지 않았으며 프로세스는 종료하지 않았다.
- npm/Gradle cache, local dependency junction, IDE·MCP·자동화의 모든 saved cwd는 전수 확인하지 않았다. 캐시나 파일이 존재한다는 사실만으로 이동 후 복구 성공을 선언할 수 없다.

## 향후 Git-aware 경로 전환 절차

이 절차는 실행 승인이 아니다. 검증할 조건과 중단 기준을 제시하며, 이 특수 서브모듈/linked worktree 구조에서 검증하지 않은 명령 조합을 나열하지 않는다. 감사 시 설치 Git은 `2.50.1.windows.1`이었다. Git 공식 git-mv 문서는 gitfile 기반 서브모듈 이동 시 gitfile·core.worktree·gitmodules 처리를 설명하고, git-worktree 문서는 main worktree 이동 제한과 연결 repair 조건을 설명한다. 실제 전환은 설치 버전의 해당 문서와 구조를 다시 확인한다.

| 단계 | 선행 조건·수행 범위 | 통과 증거 | 중단 기준 |
|---|---|---|---|
| 1. 범위 확정 | 기술 slug, source/destination 절대 경로, 로컬 이동·hub 변경 범위를 별도 승인 | 승인 기록과 대상 whitelist | 미확정 slug, destination 충돌, 타 저장소 포함 |
| 2. 기존 상태 기록 | primary·hub·모든 linked worktree의 HEAD/branch/status/gitdir/backlink, ignored·untracked 자료와 junction 목록 기록 | 이동 전 상태 목록과 복구 가능한 보존 계획 | 사용자 변경 소유 불명, 자료 보존 불가, gitlink 차이를 설명하지 못함 |
| 3. 사용 세션 확인 | 서버·IDE·Codex/Claude·MCP·자동화 중 대상 cwd를 실제 확인. 중지 또는 재연결 계획을 승인 범위에서 준비 | 대상 프로세스와 cwd의 확실한 연결, 재시작 계획 | cwd 미확인 프로세스를 추측으로 종료해야 하는 상황 |
| 4. Git 경로 전환 | 서브모듈 gitfile 구조에 맞는 검증된 Git-aware 방법 선택. 내부 section/gitdir·기존 linked worktree 경로는 가능한 유지 | .gitmodules path·gitfile·core.worktree·backlink가 서로 일치 | 관련 없는 .gitmodules 변경, 기존 gitlink/HEAD 변동, dangling 연결 |
| 5. 변경 경계 검토 | 필요한 현재 locator·문서 지도·명시적 cwd 설정만 갱신. 과거 로그·session DB는 직접 치환하지 않음 | 허용 파일 diff와 이전 gitlink 보존 증거 | 전역 substring 치환, 이력 재작성, 기존 task·다른 저장소 침범 |
| 6. 재연결·빌드 확인 | 새 루트에서 실제 Git 읽기·의존성 resolution·bundle/sync·테스트 확인. 확인된 서버와 도구 연결 재개 | 이전 branch/HEAD와 자료 보존, 실제 서버·MCP 연결·saved cwd 사용 성공 | 파일 존재만 확인, 깨진 worktree·import·생성 경로, 저장 데이터 회귀 |
| 7. 완료 판정 | hub 변경과 제품 변경을 분리 검토하고 미확인 한계를 남김 | 최종 경로 대응표·검증 결과·남은 이름 분류 | 승인하지 않은 hub commit, push·배포·서명·설치가 필요해짐 |

문제가 생기면 새 경로와 기존 자료를 보존한 채 중단하고 원인을 보고한다. 복구를 위해 무단 reset·삭제·prune·서버 종료를 수행하지 않는다. 경로 이동 자체와 별개의 원격 rename을 한 단계에 묶지 않는다.

## GitHub·호스팅 이름 변경은 별도 작업

| 대상 | 영향 | 별도 승인·검증 단계 |
|---|---|---|
| GitHub repository | remote/submodule 주소, repository gate, issue target, release API·APK 링크, 문서 링크·외부 사용자 | 실제 repository rename 범위를 승인받고 기존 링크·redirect·권한·CI 조건을 공식 자료와 현 설정에서 검증. 현재 호환 값을 먼저 치환하지 않음 |
| Pages 공유 호스팅 | 기존 share URL·viewer 경로·OG 이미지·deep link·저장 origin | 기존 공유물을 계속 열 수 있는 정책과 새 origin의 데이터 경계를 설계. redirect 존재를 추측하지 않고 읽기 검증. 게시 승인은 별도 |
| Vercel project/domain | feedback endpoint·CORS·배포 연결·CI lineage·운영 설정 | 새 주소와 허용 origin, 기존 client 호환·서비스 가용성을 검증한 뒤 별도 배포 승인. 시크릿을 문서나 로그에 복사하지 않음 |
| 릴리스 공개 이름 | 기존 APK asset 링크·tag·marker와 사용자 안내 | 표시 제목 변경과 파일/주소 변경을 분리. 기존 다운로드 유지 정책·새 배포/서명 승인은 별도 |

원격 rename·호스팅 이동은 npm 이름이나 로컬 폴더 rename으로 자동 승인되지 않는다. 실서비스 성공·기존 URL redirect·API 접수·업데이트 설치는 이번 이름 감사나 합성 테스트로 주장하지 않는다.

## 원본 보존과 최신 통합 문서

[승인 원본 사양](branding/headcoach/01-design-spec.md)과 [원본 작업요청서](branding/headcoach/02-work-request.md)는 공급 당시 자료로 유지한다. PR47 선병합 조건, 상표 gate, 과거 line 번호·테스트 목록은 원본의 시점 정보이며 최신 사용자 지시에 맞춘 통합 기준으로 다시 판단한다.

- 원본 문서·tools·asset blobs를 새 요구에 맞춰 덮어쓰지 않는다.
- 최신 [분석](korean-branding-20261010-analysis.md)·[설계](korean-branding-20261010-design.md)·[작업 계획](korean-branding-20261010-tasks.md)에서 PR52 기반 적용과 override 이유를 연결한다.
- 원본 도구의 적용 앵커가 현 index와 다르면 실행하지 않고 차이를 확인한다. 승인 자산을 의미 단위로 통합하며 ready/저장/제보/공유 계약을 유지한다.
- 제품 복사본이 필요하면 기술 이름 결정 후 별도 생성하고 원본과의 동일성·라이선스·출처를 검증한다. 원본 경로는 유지한다.
- 사용자 자료·세션 대화·원본 URL·시크릿은 문서에 복사하지 않는다. 이 문서에는 필요한 식별자와 조사 메타데이터만 기록한다.

## 이번 문서의 검증과 한계

현재 작업 트리의 package/lock 계약, capacitor/Android 이름·settings, 빌드·릴리스·CI 식별자, 관련 테스트와 원본 자산 경로를 읽기 대조했다. 문서는 지정된 단일 파일만 작성하고 로컬 상대 링크와 diff를 정적 확인한다. 실행 명령의 Git 조회에는 `core.fsmonitor=false`, 셸에는 `login=false`를 사용했다.

실제 루트 이동·새 npm 이름 적용·원격 rename·서버 재연결·실기기 업데이트·상표 검토는 미실행이다. 본 문서는 이후 적용의 체크 기준이며 제품 전체 테스트 통과나 배포 준비 완료를 대신하지 않는다.
