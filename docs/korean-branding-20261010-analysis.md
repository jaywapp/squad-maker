# 한글 브랜딩·네이밍 정리 분석

2026-10-10, orchestrator=Codex. 사용자는 승인된 아이엠 헤드코치 A안(최소 변경)을 PR52 기능 개선 위에 적용하도록 지시했다. 새 디자인은 만들지 않는다.

## 상태·근거

- 지정 primary `D:\station\repos\squad-maker`: main27a34ca97d5622d69effc46956ed23e9abb5a70a, 기존 `.ux-review/` 미커밋 보존. 최신 원격 main도 동일.
- PR52 Draft/open: `d449d02b9f90133bda905dda90acf7a49b4277f1`; Run Line 자산·터치 취소 저장 보호·작은 화면·제보/공유 개선을 모두 보존한다.
- PR53의 Claude 인계: `d41ea68ff27061e8b1d3c3d8f9c9dca34f889c12`/`design/brand-headcoach-20261010`. primary에는 docs/branding이 없지만 해당 브랜치에 완성 자료가 있다. 문서·시안·원본 자산만 선택 복사하고 앱·index·배포 설정은 가져오지 않는다.
- 별도 `feat/korean-branding-20261010`, 작업 트리 `D:\station\.worktrees\squad-maker-korean-branding-20261010`를 PR52에서 분리했다. 활성 primary/기존 worktree를 이동하지 않는다.
- 이름은 `아이엠 헤드코치`(공백1개), IBM Plex Sans KR Bold700 아웃라인 A안. 부제/한글 보조 표기·영문 병기 없음. 제목의 기존 설명 `축구 포메이션 & 전술 공유`는 보존. 승인 마크·파비콘·Android 아이콘/시스템 스플래시·색은 동일하다.

## 한 번에 확인할 결정

1. 기술용 영문 식별자가 인계에서 확정되지 않았다. 추천 `iam-headcoach`, 대안 `i-am-headcoach`. 내부 npm 프로젝트/배포하지 않는 runtime 브랜드 자산 이름과 향후 폴더 대응표에 사용한다. GitHub 저장소/도메인·packageID·저장키·public계약은 그대로 둔다. 답변 전 기술 이름을 적용하지 않는다.
2. Android 표시 이름은 spec의 `아이엠 헤드코치`와 작업표의 `아이엠 헤드코치 Preview`가 다르다. Preview 채널을 유지하는 후자를 추천하되 사용자 답변 전 설정/strings는 바꾸지 않는다. 원본 런처명은 축약하지 않는다.

자산 A 승인/글자 간격/부제는 분명하므로 시안을 다시 선택해 달라고 요구하지 않는다. 구자료의 PR47 main 선병합·상표 완료 gate·Git 작업 금지는 최신 사용자 지시와 충돌한다. 현재 지시에 따라 PR52 위 별도 Draft, 미병합·미배포로 진행하고 상표 참고 범위만 기록한다. 법적 사용 가능/불가·검토 완료를 선언하지 않는다.

## 범위·경계

- 사용자 표시 이름/문구·한글 헤더/인트로, 지정된 내부 기술 이름·관련 import/build/test/CI/docs 참조, 공급 자산·라이선스/출처 보존, 이름 대응표·루트 전환 절차, 최종 새 검증/Draft PR.
- package `com.jaywapp.squadmaker.preview`·키·storage키/schema·.sq·외부 공유/공개 APK 링크·광고·관계없는 로컬 변경을 보존한다.
- main 병합·Release/Play·서명 APK·기기 설치·GitHub 저장소/도메인 변경은 하지 않는다.
- 기존 앱은 night 팔레트/고정 dark UI다. light OS 설정과 공급 on-light 자산은 각각 확인하되 새 light 앱 테마를 임의 디자인하지 않는다. 실기기와 browser/emulation을 구분한다.
- 정적 편집기·기존 저장/API를 보존하므로 새 Supabase/backend는 불필요하다.

## 완료 기준

이름 결정 뒤 공급 자산 그대로 적용, 대응표에 따른 좁은 이름 정리·남은 이름 분류, 단위/desktop·mobile E2E/bundle·sync/unsigned/lint를 최종 변경에서 새로 실행한다. PR52 기능 회귀·원본/라이선스·기존 변경 보존과 실제 기기 미검증을 보고한다. PR은 PR52 작업 브랜치 대상 stacked Draft로 준비해 이번 브랜드 delta를 검토할 수 있게 하고, 향후 main 전환/병합은 별도 승인 후 진행한다.