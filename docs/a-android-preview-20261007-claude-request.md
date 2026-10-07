# Claude Code에 붙여 넣을 A UI 요청

아래 요청은 **직접 전달되지 않았다**. 지원된 세션 도구가 없고 Computer Use kernel이 Windows sandbox 초기화 오류로 시작하지 못했다. 이름/경로/현재 변경을 확인하지 않은 터미널에 입력하지 않는다.

```text
squad-maker의 확정 A(나이트피치, 피치 중심 코치형) UI를 담당해 주세요. fc-squad-maker는 다른 프로젝트입니다.

먼저 공통 .ai/rules와 대상 AGENTS.md/CLAUDE.md, 현재 branch/status를 확인하고 기존 변경을 보존하세요. 지정된 이 프로젝트의 Claude 세션인지 확인한 뒤 별도 Claude 실행 analysis/design/tasks를 만드세요. 데이터/native 구현 기준은 feat/a-android-preview-20261007의 bc1e76a0de598ec651a717438086c42014f36ef7입니다. 해당 원격 브랜치 최신 head에서 별도 UI checkout/branch를 만들고 시작하세요. PR43/42가 포함됩니다. PR41의 작업계획도 읽으세요.

필수 자료: docs/product-plan.md, docs/design-a/README.md, docs/design-a/prototype.html와 원본6PNG, docs/ui-state-save-export-contract-v2.md, tests/fixtures/snapshot-v1.json 및 ui-contract-v2.json. impeccable/design-taste-frontend를 적용하세요. A는 이미 사용자 선택 완료이고 다른 전체 테마로 바꾸지 마세요.

현재 단계: C-02/C-03 구현과 계약 v2·회귀가 완료되었습니다. Codex는 index.html/UI 자산을 동결했습니다. U-01(기존 A 선택과 프로토타입 근거 확인) 이후 U-02/U-03 운영 UI를 진행할 수 있습니다. 변경 허용: 별도 Claude 실행 문서·고유 docs/ux-concepts 경로, index.html의 UI/DOM/CSS 및 고유 app/ui-a.* 자산. 변경 금지: app/local-library.js, app/platform-native.js, Android, scripts/build/signing, package/lockfile, 데이터/ID/native/API 회귀 테스트와 vendor, 원본 A 자료. 기존 inline 기능은 계약 v2에 연결하고 함수/검증/상태 저장을 UI에서 중복 구현하지 마세요. index 기능 코드 변경이 필요하면 변경 이유·경계를 먼저 인계하여 순차 반영합니다. 같은 파일 동시 편집 금지입니다.

A 필수 흐름: 피치 중심의 가독성 좋은 선수 이름·선택 도구; 기본/공격/수비·팀/파일 헤더 이름 동기화; 항상 접근 가능한 전술 목록과 목록 닫기 후 같은 선택/스크롤 복귀; 배치/움직임 패턴 용어; 좁은 화면에서 단계/재생 버튼 잘림 없음; 이름/색상/지침 편집·소프트키보드 완료; 지속 저장 오류·재시도/백업; 내보내기 시트에서 이미지/GIF/백업/링크·공유 의미 분리; 취소/실패/undo 계약 유지.

무료량·가격·과금 슬롯 단위는 미정입니다. 데모 숫자를 운영 정책으로 확정하지 마세요. preview 정책/fixture는 테스트라고 표시하세요. 로그인·자체 서버·구매·실제 광고 식별자는 추가하지 마세요. native 광고/파일/OS 공유는 Codex adapter가 담당하며 UI는 상태를 표시합니다.

완료 조건: 360/390/412와 데스크톱, 긴 한글·큰 글자·키보드/포커스·reduced-motion 기본 접근성; 원본 캡처와 A 디자인 근거; 기능 fixture/오류/공유 취소를 표시; 허용 변경 파일과 검증 명령/결과 및 최종 UI commit SHA를 반환하세요. main 직접 commit/무단 merge/다른 앱 키 재사용 금지입니다. 완료 UI SHA, 허용된 변경 파일, 브라우저 검증 결과를 반환해 주세요. Codex가 SHA를 받아 순차 통합합니다. Android APK/서명/Release는 Codex 담당입니다.
```
