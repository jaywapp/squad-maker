# 한글 브랜딩·네이밍 정리 분석

2026-10-10, orchestrator=Codex. 사용자는 승인된 아이엠 헤드코치 A안(최소 변경)을 PR52 기능 개선 위에 적용하도록 지시했다. 새 디자인은 만들지 않는다.

## 상태·근거

- 지정 primary `D:\station\repos\squad-maker`: main27a34ca97d5622d69effc46956ed23e9abb5a70a, 기존 `.ux-review/` 미커밋 보존. 최신 원격 main도 동일.
- PR52 Draft/open: `d449d02b9f90133bda905dda90acf7a49b4277f1`; Run Line 자산·터치 취소 저장 보호·작은 화면·제보/공유 개선을 모두 보존한다.
- PR53의 Claude 인계: `d41ea68ff27061e8b1d3c3d8f9c9dca34f889c12`/`design/brand-headcoach-20261010`. primary에는 docs/branding이 없지만 해당 브랜치에 완성 자료가 있다. 문서·시안·원본 자산만 선택 복사하고 앱·index·배포 설정은 가져오지 않는다.
- 별도 `feat/korean-branding-20261010`, 작업 트리 `D:\station\.worktrees\squad-maker-korean-branding-20261010`를 PR52에서 분리했다. 활성 primary/기존 worktree를 이동하지 않는다.
- 이름은 `아이엠 헤드코치`(공백1개), IBM Plex Sans KR Bold700 아웃라인 A안. 부제/한글 보조 표기·영문 병기 없음. 제목의 기존 설명 `축구 포메이션 & 전술 공유`는 보존. 승인 마크·파비콘·Android 아이콘/시스템 스플래시·색은 동일하다.

## 확정된 명칭 (2026-10-10 사용자 답변)

사용자: “추천대로 하고 Android 표시명은 아이엠 헤드코치로”.

- 기술 식별자 **iam-headcoach** 확정: private npm name/lock root, 브랜드 전달 파일명, 향후 로컬 폴더 이름.
- Android 표시 이름 **아이엠 헤드코치** 확정: appName/app_name/title_activity_main에서 Preview 접미사를 사용하지 않는다. 한글 띄어쓰기/아웃라인/부제는 A안 그대로다.
- Preview 패키지·버전 계보/릴리스 채널·외부 APK 파일명은 호환 계약이므로 그대로다. 표시명 결정은 packageID/키/저장키/도메인/저장소 rename을 승인하지 않는다.
- 활성 primary/linked worktree 실제 이동은 이번에 하지 않는다. 후보 경로 D:\station\repos\iam-headcoach의 이름만 확정하고 별도 전환 절차·범위는 유지한다.

자산 A 승인/글자 간격/부제는 분명하므로 시안을 다시 선택해 달라고 요구하지 않는다. 구자료의 PR47 main 선병합·상표 완료 gate·Git 작업 금지는 최신 사용자 지시와 충돌한다. 현재 지시에 따라 PR52 위 별도 Draft, 미병합·미배포로 진행하고 상표 참고 범위만 기록한다. 법적 사용 가능/불가·검토 완료를 선언하지 않는다.

## 범위·경계

- 사용자 표시 이름/문구·한글 헤더/인트로, 지정된 내부 기술 이름·관련 import/build/test/CI/docs 참조, 공급 자산·라이선스/출처 보존, 이름 대응표·루트 전환 절차, 최종 새 검증/Draft PR.
- package `com.jaywapp.squadmaker.preview`·키·storage키/schema·.sq·외부 공유/공개 APK 링크·광고·관계없는 로컬 변경을 보존한다.
- main 병합·Release/Play·서명 APK·기기 설치·GitHub 저장소/도메인 변경은 하지 않는다.
- 기존 앱은 night 팔레트/고정 dark UI다. light OS 설정과 공급 on-light 자산은 각각 확인하되 새 light 앱 테마를 임의 디자인하지 않는다. 실기기와 browser/emulation을 구분한다.
- 정적 편집기·기존 저장/API를 보존하므로 새 Supabase/backend는 불필요하다.

## 완료 기준

이름 결정 뒤 공급 자산 그대로 적용, 대응표에 따른 좁은 이름 정리·남은 이름 분류, 단위/desktop·mobile E2E/bundle·sync/unsigned/lint를 최종 변경에서 새로 실행한다. PR52 기능 회귀·원본/라이선스·기존 변경 보존과 실제 기기 미검증을 보고한다. PR은 PR52 작업 브랜치 대상 stacked Draft로 준비해 이번 브랜드 delta를 검토할 수 있게 하고, 향후 main 전환/병합은 별도 승인 후 진행한다.
## 확정 이름 적용 계획

orchestrator=Codex. 기존 Draft #54/head14deb708의 깨끗한 feature 작업 트리에서 이름 metadata 4파일과 제품용 이름 파일/QA 참조·현재 통합 문서만 수정한다. 승인 원본 docs/branding/headcoach/와 시안/라이선스는 그대로 보존한다. 제공한 최종 SVG6·snippet3을 새 디자인 없이 assets/branding/iam-headcoach/에 명명해 QA 및 후속 브랜드 전달의 제품 파일로 제공한다. 앱은 기존 inline SVG·intro를 계속 사용하므로 HTML/bootstrap/편집·저장·내보내기 코드는 바꾸지 않는다. Android resource ID도 표준명 유지다.

명칭 확정 후 전체 unit/E2E/sync/unsigned/lint를 새 commit으로 실행하고 .work/korean-branding-20261010/naming-final/에 새 증거를 저장한다. 이전 final/14deb708 결과는 이력이며 새 코드 검증으로 대체하지 않는다. Git은 root만 수행하고 같은 Draft를 업데이트한다. 추가 승인 질문은 필요 없다.
