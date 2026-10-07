# Claude Code에 붙여 넣을 A UI 요청

아래 요청은 **직접 전달되지 않았다**. 지원된 세션 도구가 없고 Computer Use kernel이 Windows sandbox 초기화 오류로 시작하지 못했다. 이름/경로/현재 변경을 확인하지 않은 터미널에 입력하지 않는다.

```text
squad-maker의 확정 A(나이트피치, 피치 중심 코치형) UI를 담당해 주세요. fc-squad-maker는 다른 프로젝트입니다.

먼저 공통 .ai/rules와 대상 AGENTS.md/CLAUDE.md, 현재 branch/status를 확인하고 기존 변경을 보존하세요. 지정된 이 프로젝트의 Claude 세션인지 확인한 뒤 별도 Claude 실행 analysis/design/tasks를 만드세요. 기준은 PR43 d7996738db3388c9022ce3c8ae0cf77fd7bbb628이며 PR42가 포함됩니다. PR41의 작업계획도 읽으세요.

필수 자료: docs/product-plan.md, docs/design-a/README.md, docs/design-a/prototype.html와 원본6PNG, docs/ui-state-save-export-contract-v1.md, tests/fixtures/snapshot-v1.json 및 ui-contract-v1.json. impeccable/design-taste-frontend를 적용하세요. A는 이미 사용자 선택 완료이고 다른 전체 테마로 바꾸지 마세요.

현재 단계 U-01: docs/ux-concepts/a-integration-20261007/ 또는 Claude 고유 UI 프로토타입 경로만 변경 가능합니다. index.html, app/local-library.js, native/Android, package/lockfile, 기능/tests/vendor, 원본 A 자료는 지금 편집하지 마세요. Codex가 C-02/C-03 상태·목록·저장·내보내기 계약을 완성하는 중입니다. Codex의 최종 C-03 SHA/계약과 허용 파일 인계 이후 U-02/U-03 운영 UI를 진행하세요. 같은 파일 동시 편집 금지입니다.

A 필수 흐름: 피치 중심의 가독성 좋은 선수 이름·선택 도구; 기본/공격/수비·팀/파일 헤더 이름 동기화; 항상 접근 가능한 전술 목록과 목록 닫기 후 같은 선택/스크롤 복귀; 배치/움직임 패턴 용어; 좁은 화면에서 단계/재생 버튼 잘림 없음; 이름/색상/지침 편집·소프트키보드 완료; 지속 저장 오류·재시도/백업; 내보내기 시트에서 이미지/GIF/백업/링크·공유 의미 분리; 취소/실패/undo 계약 유지.

무료량·가격·과금 슬롯 단위는 미정입니다. 데모 숫자를 운영 정책으로 확정하지 마세요. preview 정책/fixture는 테스트라고 표시하세요. 로그인·자체 서버·구매·실제 광고 식별자는 추가하지 마세요. native 광고/파일/OS 공유는 Codex adapter가 담당하며 UI는 상태를 표시합니다.

완료 조건: 360/390/412와 데스크톱, 긴 한글·큰 글자·키보드/포커스·reduced-motion 기본 접근성; 원본 캡처와 A 디자인 근거; 기능 fixture/오류/공유 취소를 표시; 허용 변경 파일과 검증 명령/결과 및 최종 UI commit SHA를 반환하세요. main 직접 commit/무단 merge/다른 앱 키 재사용 금지입니다. 운영 UI source handoff 전에는 prototype 결과만 공유하세요.
```
