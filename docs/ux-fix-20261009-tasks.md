# UX/UI 개선 1차 (2026-10-09): 작업 지시서

- slug: `ux-fix-20261009` · [분석](ux-fix-20261009-analysis.md) · [설계](ux-fix-20261009-design.md)
- orchestrator: Claude. 모든 owner는 Claude(레포 규칙상 한 작업 트리에서 도구를 섞지 않는다). 사람이나 다른 세션이 맡아도 이 표의 순서·검증·상태 갱신 규칙을 그대로 따른다. Codex로 진행하려면 별도 작업 트리에서 orchestrator를 Codex로 바꾼 새 작업계획을 만든다.
- 결정 사항: Q1~Q5는 [분석 4장](ux-fix-20261009-analysis.md)에 확정됐다. 2단계는 진행, 3단계는 콘셉트 3종까지 진행, 파비콘 유지, 확인 버튼은 위험 스타일, 병합은 사용자가 한다.
- 근거 자료: `ux-fix-20261009/issues.md`, `ux-fix-20261009/browser.md`(이슈별 Repro·Evidence·Files), `ux-fix-20261009/detect.md`, 스크린샷·Lighthouse·`.sq` 픽스처는 `ux-fix-20261009/evidence/`(모두 `docs/` 기준 경로). 재검증 결과도 이 폴더에 덧붙인다.
- 순차 실행 이유: 1·2단계 작업 전부가 `index.html` 한 파일을 바꾼다. 병렬 편집하지 않는다. 검증도 같은 로컬 서버·브라우저와 적은 메모리를 쓰므로 순차로 한다.

## 0. 작업자 공통 지시

1. 작업 브랜치: `fix/ux-fix-20261009`를 최신 `origin/main`에서 만든다. `main` 직접 수정 금지.
2. 로컬 실행: `npm ci` 후 `npm run serve`(http://127.0.0.1:4317). 점검은 4318 포트였지만 같은 정적 서버다. 브라우저 테스트는 `npx playwright install chromium`이 필요할 수 있다.
3. 시작 전 읽을 것: `AGENTS.md`, `CLAUDE.md`, 이 지시서와 [설계](ux-fix-20261009-design.md), `docs/a-ui-20261007-design.md`(토큰·색 역할), 그리고 각 작업의 대상 이슈 항목(`ux-fix-20261009/browser.md`).
4. UI 작업이므로 `impeccable`과 `design-taste-frontend` 스킬의 SKILL.md·pre-flight를 먼저 읽고 적용한다. 다른 taste 변형은 쓰지 않는다.
5. 기존 토큰·컴포넌트를 재사용한다. 새 토큰이 필요하면 설계 문서에 이유를 적는다.
6. 범위 밖 리팩터링·의존성 변경 금지. 저장 계약 v2·데이터 모델·분석 이벤트·Android 네이티브 코드는 건드리지 않는다.
7. 위험하거나 설계와 다르게 해야 하면 고치지 말고 해당 이슈를 `Deferred`로 두고 이유를 적는다.
8. 문구로 요소를 찾는 e2e가 있으면 같은 작업에서 기대값을 함께 바꾸고, 바꾼 테스트를 실행 기록에 적는다.
9. 커밋은 작업 단위로(Conventional Commits, 영어 메시지). push·PR 생성은 사용자 확인 후, 병합은 사용자가 직접 한다. **`main` push가 APK 릴리스를 만든다(2c9e738)** 는 점을 PR 본문에 적는다.
10. 각 작업이 끝나면 아래 표의 `status`와 "실행 기록"을 갱신한다.

## 1. 작업 표

| ID | 작업 | 대상 이슈 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|---|
| F-00 | 브랜치 생성, 기준선 측정: `npm run test:unit` → `npx playwright test --project=desktop-1280 --workers=1` → `--project=mobile-390 --workers=1` | - | Claude | sonnet | low | - | g0 | - | 통과 수 기록 | todo |
| F-01 | fixed 레이어 폭·컨텍스트 메뉴 위치·대상 선수 표시·트레이 동기화·토스트 폭 | B-01, B-16 | Claude | sonnet | high | F-00 | g1 (순차) | `index.html`(759행 `body > *`, 232행 `#ctxMenu`, 2666~2678행 `showCtxMenu`, 606~612·1055행 `.toast`) | 390 에뮬레이션 길게 누르기: 메뉴 rect가 화면 안, 견본 10개 모두 보임, 머리에 대상 이름, 트레이 같은 선수. 1280 우클릭 메뉴 폭 ≤ 260px. 토스트 폭 ≤ 560px | todo |
| F-02 | 확인 대화상자: 동사 라벨·위험 톤·초기 포커스 취소·aria 연결, 호출부 전부 갱신 | B-05 | Claude | sonnet | high | F-01 | g1 (순차) | `index.html`(2231~2260행 `uiConfirm`, 2178·2328행 등 호출부), 관련 e2e | 1280에서 8vs8·초기화·복원 확인창: 라벨이 동사+대상, 열린 직후 `activeElement`=취소, `aria-describedby` 존재, Enter로 실행되지 않음 | todo |
| F-03 | 제보 모달 Esc 닫기, 창구 실패 시 보내기 비활성 + 다시 시도 | B-08 | Claude | sonnet | medium | F-02 | g1 (순차) | `index.html`(3789행 Esc, 1592행, 4041~4102행) | Esc로 닫히고 포커스가 "제보" 버튼으로 복귀. 로컬(API 404)에서 보내기 `disabled` | todo |
| F-04 | 전역 CSS·토큰: color-scheme, scrollbar-gutter, keep-all, 태그 대비, 번호 굵기, "+ 선수 추가" 대비, 11.2px 본문, width transition, 인원 버튼 활성 초크 | B-17, B-23, B-07, B-20/D-01, D-02, D-05, D-06, B-13(선택 상태만) | Claude | sonnet | medium | F-03 | g1 (순차) | `index.html`(27·740행 `:root`, 763행, 571~577행 `.tactic-tag`, 890~893행, 130행 `.mode-pill.active`, 1138행) | 대비 측정: 태그·번호·"+ 선수 추가" 모두 기준 충족. 흰 스크롤바 없음, 탭 전환 시 헤더 x 이동 0. 390 내보내기 시트 음절 중간 줄바꿈 없음. detector 1280·390 재실행에서 D-01·02·05·06 소멸 | todo |
| F-05 | 상태 표시: 복원 결과 줄, 최대 인원 이유, 이름 카운터·전체 이름, 미리보기 단계 표시 통일 | B-10, B-26, B-22, B-04 | Claude | sonnet | medium | F-04 | g1 (순차) | `index.html`(979~982행 `.export-status`, 921·897행, 패턴 재생 루프) | `invalid.sq` 복원 → 결과 줄에 빨간 오류 지속, 이전 성공 문구 없음. 13자 입력 시 카운터 12/12. 미리보기 중 배지와 단계 줄 일치 | todo |
| F-06 | 접근성 의미: 인원 `aria-pressed`, 선수 접근성 이름, 색상 견본 이름 | B-18, B-19 | Claude | sonnet | medium | F-05 | g1 (순차) | `index.html`(1968행, 2670행, 선수 토큰 생성부) | Lighthouse mobile `label-content-name-mismatch` 0건, Accessibility 100 유지. 접근성 트리에서 현재 인원 pressed | todo |
| F-07 | 문구·아이콘: 도움말 재작성, 힌트 정리, em dash 제거, 문자 글리프 → Tabler SVG(파비콘 제외) | B-09, B-21, B-25, B-24 | Claude | sonnet | medium | F-06 | g1 (순차) | `index.html`(1539·1546행 도움말, 880·919·1085행 힌트, 6·10·17·3800행, 패턴 패널·공유 모달 버튼) | 도움말 항목이 실제 탭·버튼 이름과 일치. 화면 문구에 `—` 0건(`grep`). 768×1024에서 트레이가 힌트를 덮지 않음 | todo |
| V-01 | 회귀: 단위 → 데스크톱 e2e → 모바일 e2e(포그라운드, `--workers=1`, 프로젝트별 순차), `npm run android:bundle` 표식 확인 | - | Claude | sonnet | medium | F-07 | g2 (순차) | - | 기준선과 같은 통과 수 | todo |
| V-02 | UX 재검증: F-01~F-07 대상 이슈의 Repro를 같은 뷰포트로 재실행, 390 에뮬레이션에서 D-10 겹침 재확인, 44px·가로 넘침 재측정, console error 확인 | 1단계 전부 | Claude | opus | high | V-01 | g2 (순차) | `ux-fix-20261009/issues.md`, `ux-fix-20261009/evidence/` | 이슈별 Resolved/Remaining/Regression 기록 | todo |
| R-01 | 코드 리뷰(code-reviewer): 브랜치 diff 정확성·회귀 위험 | - | Claude | opus | high | V-02 | g3 | - | 지적 사항 처리 또는 근거 기록 | todo |
| H-01 | 1단계 실행 기록·`docs/README.md` 갱신, PR 생성(사용자 확인 후, base `main`) | - | Claude | sonnet | low | R-01 | g3 | 이 문서, `docs/README.md` | PR 본문에 재검증 수치·APK 릴리스 주의 | todo |
| P2-01 | 패턴 캔버스 렌더를 DOM 피치 토큰에 맞춤(글꼴·배율 보정 12px·알약 이름표·말줄임표·GK 회피·토큰 지름) | B-03 | Claude | sonnet | high | H-01 | g4 (순차) | `index.html`(1847행 `PLAYER_R`, 2942~2958행 `canvasPlayer`) | 390 에뮬레이션에서 캔버스 이름 화면 크기 ≥ 12px, 토큰 ≥ 36px, GK 이름이 골라인과 겹치지 않음. GIF 1장 생성해 프레임 확인 | todo |
| P2-02 | 패턴 패널 정리: GIF 버튼 중복 제거, 삭제·초기화 더보기 메뉴, 준비 중 칩 이동, 화면당 라임 1개, 지침서 색 | B-14, B-13 | Claude | sonnet | high | P2-01 | g4 (순차) | `index.html`(945~958행 패턴 패널, `#patternUI`, 568·571~577행) | 1280 패턴 패널 동시 노출 버튼 ≤ 7, 화면별 라임 바탕 요소 1개, 분석 이벤트 e2e 통과 | todo |
| P2-03 | 구형 모달 3개를 A 시트 머리줄로, 공유 "텍스트 파일로 받기" | B-11 | Claude | sonnet | high | P2-02 | g4 (순차) | `index.html`(1460·1539·1592행), 관련 e2e·unit | 세 모달 모두 제목+X 머리줄, Esc·포커스 트랩·복귀 동작, `platform-native.test.js` 통과 | todo |
| P2-04 | 키보드 선수 이동 + `aria-live` 안내, 패턴 단계 텍스트 요약, 재생 중 이전·다음 잠금 | B-15, B-04 잔여 | Claude | sonnet | high | P2-03 | g4 (순차) | `index.html`(`#field .player` 키 처리, `#patternCanvas`) | 1280에서 Tab→선수→↑ 이동 확인, 새로고침 후 위치 유지, 되돌리기 동작, 스크롤 충돌 없음 | todo |
| V-03 | 2단계 회귀(V-01과 같은 절차) + 대상 이슈 Repro 재실행 + 코드 리뷰 | 2단계 전부 | Claude | opus | high | P2-04 | g4 (순차) | `ux-fix-20261009/issues.md` | 기준선 통과 수 유지, 이슈 상태 갱신 | todo |
| H-02 | 2단계 실행 기록 갱신, PR 생성(사용자 확인 후) | - | Claude | sonnet | low | V-03 | g4 | 이 문서 | - | todo |
| P3-01 | 콘셉트 3종 프로토타입(가로 모바일·대형 데스크톱·결과물 헤더), 각 README·스크린샷 | B-02, B-06, D-07, B-12 | Claude | opus | high | F-00 | g5 (1·2단계와 병렬 가능: `docs/ux-concepts/`만 쓰고 `index.html`은 안 건드림) | `docs/ux-concepts/ux-fix-20261009/concept-01~03/` | 1280·1920·390·844×390에서 확인, 기본 접근성(대비·포커스·44px), 설계 3A의 세 문제를 모두 다룸 | todo |
| P3-02 | 사용자에게 3종 제시, 선택·피드백을 분석 문서에 기록. 선택 후 운영 구현용 새 작업계획 작성 | - | Claude | opus | medium | P3-01 | g5 | 분석 문서, 새 작업계획 | 사용자 선택 기록 존재 | blocked(사용자 선택 대기) |

모델 선택 이유: 1·2단계는 설계가 확정된 단일 파일 수정이라 구현은 sonnet. 재검증(V-02, V-03)은 시각·접근성 판단이 섞여 opus. 3단계 콘셉트는 디자인 판단이 커서 opus. `index.html` 전체 맥락을 반복해 읽지 않도록 F-01~F-07, P2-01~P2-04는 **한 구현 세션** 이 순서대로 처리한다. P3-01만 다른 세션이 병렬로 맡을 수 있다.

권장 PR 분리: 1단계 PR(F-01~F-07) → 병합 후 2단계 PR(P2-01~P2-04) → 3단계 콘셉트 PR(문서만).

## 2. 회귀 위험 체크리스트

- `body > *` 제외 목록이 레이아웃 요소를 빠뜨리지 않았는가(1280·1366·390·768 첫 화면 비교).
- 확인창 라벨 변경으로 e2e 선택자가 깨지지 않았는가(`data-safety`, `local-library`, `player-id-safety`, `ui-contract`, `guest-free-regression`, `tests/unit/platform-native.test.js`).
- `scrollbar-gutter`가 모바일·native(Capacitor)에서 여백을 만들지 않는가.
- 전역 `keep-all`이 긴 영문·URL(공유 링크)을 넘치게 하지 않는가(`overflow-wrap: anywhere` 확인).
- `.mode-pill.active`를 초크로 바꿔도 선택이 구분되는가(색 외 표시 = `aria-pressed` + 굵기·테두리).
- (2단계) 패턴 캔버스 배율 보정이 GIF 출력 크기·프레임 렌더를 바꾸지 않는가. 경로 그리기 히트 영역이 그대로인가.
- (2단계) GIF 버튼 제거 후 분석 이벤트(`tests/e2e/analytics-events.spec.js`)가 계속 같은 이름으로 발생하는가.
- (2단계) 방향키 이동이 입력 필드·모달 안 방향키와 충돌하지 않는가.

## 3. 실행 기록

(작업자가 채운다: 기준선 결과, 작업별 커밋 SHA, 바꾼 테스트, Deferred 이유, 재검증 수치)
