# A 운영 UI (U-01~U-03): 분석

- slug: `a-ui-20261007` · [설계](a-ui-20261007-design.md) · [작업](a-ui-20261007-tasks.md)
- orchestrator: Claude. 작업 트리 `.worktrees/squad-maker-a-ui-20261007`, 브랜치 `feat/a-ui-20261007`
- 기준: PR #44 `feat/a-android-preview-20261007`, 검증 SHA `046f5f60a775abcc05f76143bce919dbf19b56da`. 요청문(`a-android-preview-20261007-claude-request.md`)에 남은 `bc1e76a…`는 사용자 지시에 따라 이 SHA로 대체한다.

## 1. 요청

- 계약 v2(`ui-state-save-export-contract-v2.md`)에 연결된 A(나이트피치) 운영 UI를 `index.html`에 구현한다.
- U-01 근거 확인 뒤 U-02/U-03을 진행한다. 비동기 준비·저장 상태·팀/전술 목록·취소·실패·undo를 계약으로 연결하고 기능을 중복 구현하지 않는다.
- 현재 preview 무제한 슬롯을 확정 무료 정책으로 해석하지 않는다.
- 360/390/412px·데스크톱, 긴 한글·큰 글자·키보드·포커스를 검증하고 최종 SHA·변경 파일·화면 캡처·테스트 결과를 Codex에 인계한다. 병합·서명·APK 게시는 Codex 몫이다.

## 2. 시작 상태와 소유권 확인

| 항목 | 확인 결과 |
|---|---|
| 메인 checkout `repos/squad-maker` | `main` 5653661, 변경 없음. 건드리지 않음 |
| Codex 작업 트리 `.worktrees/squad-maker-data-safety-20261007` | PR 브랜치 046f5f6, 미커밋 변경 없음. 건드리지 않음 |
| 원격 PR 브랜치 head | `046f5f60a775abcc05f76143bce919dbf19b56da`, 검증 SHA와 일치 |
| index.html 소유권 | 실행 기록 `a-android-preview-20261007-tasks.md` 41~45행: Codex는 index.html/UI 자산 편집을 멈췄고 Claude가 별도 checkout에서 U-02/U-03 진행. 계약 v2 67~69행도 같은 내용 |
| 수정 금지 | `app/local-library.js`, `app/platform-native.js`, `android/`, `scripts/`, 서명, `package.json`/lockfile, `tests/`(회귀·fixture·vendor), `docs/design-a/` 원본 |

## 3. U-01 근거

- 사용자 선택: `docs/design-a/README.md` 3행 "사용자 선택: A", `docs/product-plan.md` 4·94행 확정. 시안 재선택을 묻지 않는다(product-plan 272행).
- 원본: `docs/design-a/prototype.html`과 PNG 6장(데스크톱·모바일 × 선택·전술·공유). 원본 모바일 전술 캡처에서 재생·단계 버튼 오른쪽 잘림이 기록돼 있다(README 28행).
- 원본에서 이어받을 것: 다크 그린 배경·녹색 피치·라임 주 행동, 선수 이름 짙은 배경, 선택하면 나타나는 선수 도구, 피치 중심 배치.
- 원본에서 보완할 것(요청문 14행·product-plan 5장): 항상 열 수 있는 전술 목록, 배치/움직임 패턴 용어, 좁은 화면 단계·재생 잘림 해소, 이름·상태 헤더 동기화, 지속 저장 오류·재시도·백업, 이미지/GIF/백업/링크 의미 분리.

## 4. 현재 구현 관찰 (046f5f6)

- 계약 v2는 `index.html` 4116행 `window.SquadMakerContract`에 구현돼 있다. 보호 변경 확인(`uiConfirm`)·저장·undo·삭제 확인은 기능 코드가 수행한다.
- 팀/전술 목록 UI는 DOM에 없다. 계약 `localLibrary`(teams, items, slots, undoDeleteAvailable)만 있다.
- 필드는 480×660 좌표를 `transform: scale(s)`로 줄인다. 360px 폭에서 s≈0.7이라 선수 이름(10.4px)은 화면에서 약 7px, 원 지름 44px은 약 31px가 된다.
- `saveImage()`는 `activeModal`이 있으면 `busy`를 반환한다. 내보내기 시트는 기존 모달 장치를 쓰면 안 된다.
- Android 번들(`scripts/build-android-web.mjs`)은 `app/`에서 `platform-native.js`·`local-library.js`만 복사한다. 새 `app/ui-a.*` 파일은 APK에 들어가지 않는다.
- e2e 테스트가 기존 DOM을 고정한다: `.topbar` 안 "도움말"/"제보", `h1.wordmark`, `.app-tab[data-app]`, `.squad-tab[data-squad]`, `#playerActions`의 "이름" 버튼과 `#field .player input` 인라인 편집, `#saveStatus` 문구, `#retrySaveBtn`, "단톡방 공유 텍스트 생성", `button:has-text("이미지 저장")`, `[aria-label="공유 및 파일"]` 안 "파일 저장", `#gifBtn`/`#gifAllBtn`, `#patternUI`의 "+ 추가", `#patternCounter`, `.interest-section`·`.interest-chip`(보여야 함, 가격 문구 포함), 모달 ID들, 360px 미만 가로 넘침 없음.

## 5. 결정과 근거

| 결정 | 근거 / 대안 |
|---|---|
| UI CSS/JS를 index.html 안에 둔다 | 번들 스크립트가 `app/ui-a.*`를 복사하지 않고 스크립트는 Codex 소유. 대안(새 파일+스크립트 수정)은 소유권 위반 |
| 기존 ID·버튼 문구를 유지한 진화형 재구성 | 회귀 테스트 수정 금지. 전면 재작성은 테스트를 깨고 기능 중복 위험 |
| 내보내기 패널은 기존 모달 장치(`activeModal`) 없이 자체 포커스 처리 | `saveImage()`가 `activeModal`에서 busy 반환 |
| 피치 라벨·토큰 크기는 역배율 CSS 변수로 화면 기준 크기 보장 | 480 좌표 scale 구조 유지(기능 코드 무변경). `#field` style 변화를 관찰해 내보내기(scale 해제) 때 1배로 돌아감 |
| 패턴 캔버스(움직임 패턴) 라벨 크기는 바꾸지 않는다 | 캔버스 그리기는 GIF 출력과 공유하는 기능 코드. 인계 항목으로 남김 |
| 수요 측정 칩(`.interest-section`, 가격 문구)은 문구·동작을 바꾸지 않고 시각적으로만 낮춘다 | 테스트가 노출·문구를 고정할 뿐 상용 정책으로 채택한 것이 아니다. 제품 기획(가격·무료량·구독 미정)과 preview 무제한 정책에 충돌하므로 문구·위치·동작을 기록해 Codex에 결정 요청([인계 6장](a-ui-20261007-handoff.md)) |
| 짧은 터치 탭을 UI 스크립트에서 공개 계약 `select-player`로 전달 | 기능 코드 `touchstart`의 `preventDefault`로 click이 생기지 않는 환경(에뮬레이션 재현)에서도 선수 도구가 열리게. 기능 코드는 바꾸지 않음. 실제 Android 확인은 인계 항목 |

## 6. 부족한 정보

핵심 요구사항은 요청문·계약 v2·product-plan으로 확인돼 구현을 막는 질문은 없다. 아래는 인계 시 Codex/사용자 결정이 필요한 항목이다.

- 수요 측정 모달의 가격 문구 유지 여부(테스트 고정).
- 패턴 캔버스 라벨 가독성 개선(기능 코드·GIF 영향).
- 실제 Android TalkBack·소프트 키보드·햇빛 가독성 검증(실기기 없음).

## 7. 범위

- 포함: `index.html`의 UI/DOM/CSS, UI 전용 인라인 스크립트(`window.SquadUi`), 이 slug의 문서 3종과 캡처, `docs/README.md` 인덱스 한 줄.
- 제외: 기능 함수·검증·저장 로직 변경, 보관/native 모듈, Android·빌드·서명·패키지, 테스트 수정, 원본 A 자료, 병합·서명·APK 게시.

## 8. 완료 기준

1. 기존 전체 회귀(`npm test`)가 기준선과 같은 결과로 통과한다.
2. 360/390/412×(800~915)와 1366×768, 1440×900에서 가로 넘침 0, 피치와 선택 도구 동시 노출, 단계·재생 버튼 잘림 없음.
3. 전술 목록 열기·닫기 뒤 선택 선수·패턴·revision·페이지 스크롤이 그대로다.
4. 저장 오류 시 재시도·백업 경로가 보이고, 내보내기 취소·실패·성공 결과가 시트에 표시된다.
5. 긴 한글 이름(12자), 글자 크기 200%, 키보드만으로 주요 흐름, 포커스 표시, reduced-motion.
6. preview 슬롯을 무료 정책처럼 표시하지 않는다.
