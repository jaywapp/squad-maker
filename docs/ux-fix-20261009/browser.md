# squad-maker 브라우저 UX·UI·시각 디자인 점검 (2026-10-09)

- 대상: http://127.0.0.1:4318/index.html (로컬 정적 서버, `main` aa89187 작업 트리 기준, 익명 사용자)
- 방식: audit-only. 코드·문서는 수정하지 않았다. 산출물은 원래 로컬 `.ux-review/`에 썼고, 인계를 위해 이 폴더(`docs/ux-fix-20261009/`)로 옮겼다. 경로는 이 폴더 기준이다.
- 도구
  - 데스크톱: Playwright MCP(Chromium) 1280×800, 1366×768, 1920×1080, 768×1024. 마우스·키보드 실제 입력.
  - 모바일: chrome-devtools MCP `emulate` 390×844×3 mobile/touch, 844×390×3 landscape. 터치는 페이지 안에서 `TouchEvent`를 합성해 탭·드래그·길게 누르기를 흉내 냈다(Chromium 에뮬레이션, 실기기 아님).
  - Lighthouse(mobile, navigation): Accessibility 100 / Best Practices 100 / SEO 100. 실패 1건(`label-content-name-mismatch`, UX-B-19). 보고서: `evidence/lighthouse/report.html`
- 평가 기준: `docs/a-ui-20261007-design.md`(A NightPitch 설계 의도), impeccable `critique` 휴리스틱·인지 부하 기준, design-taste-frontend의 색 고정(4.2)·모양 고정(4.4)·버튼 대비(4.5)·아이콘(3.C)·em-dash(9.G) 규칙. design-taste-frontend는 스스로 "dense product UI는 범위 밖"(13장)이라고 밝히므로, 제품 UI에 적용 가능한 규칙만 근거로 썼다.
- 제외한 관찰(도구 아티팩트): Playwright가 되돌리기 토스트 클릭 시 `#field`가 가로막는다고 보고했으나 `elementFromPoint`로 확인하니 토스트 버튼이 최상단이었고 재시도에서 정상 동작했다. 결함에서 뺐다. `/api/feedback` 404는 로컬 정적 서버에 API가 없어서 생긴 것으로 보고, 404 자체는 결함으로 올리지 않았다(UX-B-08은 그 상황에서의 화면 처리만 다룸).

## 이전 검토(2026-10-07) 대조 요약

| 이전 항목 | 이번 관찰 | 결과 |
|---|---|---|
| P0-1 인원 변경 무확인 초기화 | 확인창 + "되돌리기" 토스트, 되돌리기로 이름·인원 복원 확인 | 해결됨 |
| P1-1 불러오기 무확인·미저장 | 확인창 표시, 복원 후 새로고침해도 유지 | 해결됨 |
| P1-2 모바일 탭 선택 불가 | 390 에뮬레이션에서 탭 → 하단 트레이 표시 | 해결됨(에뮬레이션 기준) |
| P1-3 데스크톱 툴바 화면 밖 | 1280×800, 1366×768에서 피치·선수 도구 동시 노출 | 해결됨 |
| P1-4 초기화 무보호 | 확인창 표시(문구·버튼은 UX-B-05) | 해결됨 |
| P1-5 자동 저장 비가시 | 헤더 "저장됨" 칩 표시 | 해결됨(실패 경로는 미검증) |
| P1-6 저장·공유 분산·명칭 | 내보내기 패널 하나로 모음, 결과 문장 표시. 공유 모달 "파일 저장" 명칭과 웹 OS 공유 부재는 남음 | 부분 해결 → UX-B-10, UX-B-11 |
| P2-2 라인·라벨 겹침, PNG 배너 | DOM 피치는 해결. 패턴 캔버스·PNG 내보내기는 남음 | 미해결 → UX-B-03, UX-B-12 |
| P2-4 강조색 남용 | 탭은 초크로 바뀜. 인원·미리보기·전략 화면은 라임 다수 | 미해결 → UX-B-13 |
| P2-5 모바일 인원 줄 | 390에서는 4열 격자로 정리. 1920 데스크톱에서 새로 깨짐 | 해결됨(모바일) / 신규 UX-B-06 |
| P2-6 모바일 터치 영역 | 390에서 44px 미만 인터랙티브 요소 0개 | 해결됨 |
| P2-7 작은 글자 | DOM 선수 이름 12px로 상향. 캔버스는 남음 | 부분 해결 → UX-B-03 |
| P2-8·P2-9 패턴 버튼 배치, 준비 중 칩 | 단계 이동·재생은 위로 올라옴. 중복 GIF 버튼·준비 중 칩 혼재는 남음 | 미해결 → UX-B-14 |
| P2-10 캔버스·키보드 접근성 | 변화 없음 | 미해결 → UX-B-15 |
| P2-11 도움말 문구 | 탭 이름까지 바뀌어 더 어긋남 | 미해결 → UX-B-09 |
| P2-13 외부 라이브러리 런타임 로드 | `vendor/html2canvas.min.js`, `vendor/gif.js` 로컬 로드 확인 | 해결됨 |

---

## 이슈

### UX-B-01
- Severity: High
- Category: Responsive
- Page: 배치(스쿼드) 화면
- Role: anonymous
- Component: 선수 컨텍스트 메뉴 `#ctxMenu` (길게 누르기 / 우클릭)
- Problem: 메뉴 폭이 화면 폭과 같아진다. 390 모바일에서는 메뉴가 x=210에서 시작해 폭 390px로 열려 오른쪽 180px가 화면 밖으로 잘린다. 색상 견본 10개 중 5개 이상과 메뉴 오른쪽이 보이지 않는다. 1280 데스크톱 우클릭에서는 폭 1265px 메뉴가 피치 절반과 오른쪽 패널을 덮는다. 또 모바일에서 다른 선수(5번)를 선택해 둔 상태로 7번을 길게 누르면, 하단 트레이는 "5. 미드1"을 그대로 보여 주고 메뉴에는 대상 선수 이름이 없다. 어느 선수를 지우거나 색을 바꾸는지 화면에서 알 수 없다.
- Evidence: `evidence/UX-B-01-390.png`, `evidence/UX-B-01-1280.png`. 측정: 390에서 `#ctxMenu` rect `[210,525,390,274]`, computed `width:390px`, `position:fixed`. 1280에서 rect `[346,507,1265,232]`.
- Repro: (1) 390×844×3 mobile·touch 에뮬레이션으로 연다. (2) 5번 선수를 짧게 탭해 트레이를 연다. (3) 7번 선수를 0.9초 길게 누른다. → 메뉴가 오른쪽으로 잘리고 트레이는 5번을 표시. 데스크톱: 1280×800에서 아무 선수나 우클릭 → 화면 폭 메뉴.
- Impact: 모바일 사용자의 주요 편집 경로(길게 누르기)에서 색상 절반을 고를 수 없고, 대상이 모호한 상태로 "삭제"가 노출돼 잘못된 선수를 지울 수 있다(되돌리기는 있음).
- Recommendation: `#ctxMenu`에 `width:max-content`(또는 고정 `min(240px, 100vw - 16px)`)를 지정해 A 레이아웃의 `body > * { width:100% }` 상속을 끊는다. `showCtxMenu`의 위치 보정을 실제 `offsetWidth/offsetHeight` 기준으로 바꾼다. 메뉴 머리에 "7. 미드3" 같은 대상 이름을 넣고, 메뉴를 여는 순간 트레이 선택도 같은 선수로 맞춘다.
- Files: `index.html` 759행 `body > * { … width:100%; }`, 232행 `#ctxMenu {`, 1450행 `<div id="ctxMenu">`, 2666~2678행 `showCtxMenu()`(`innerWidth-180` 가정)
- Status: Open
- 이전검토대조: 신규

### UX-B-02
- Severity: Medium
- Category: Responsive
- Page: 배치 화면 (모바일 가로)
- Role: anonymous
- Component: 헤더·탭 영역, `#fieldWrapper`, 하단 선수 트레이
- Problem: 844×390 가로에서 헤더·파일바·앱 탭·스쿼드 탭이 248px를 차지해 피치는 y=248부터 시작한다. 선수를 탭하면 94px 트레이가 y=289에 떠서, 보이는 피치 띠(약 40px)마저 덮는다. 선택한 선수가 화면에 보이지 않는다.
- Evidence: `evidence/UX-B-02-844x390.png`. 측정: `#fieldWrapper` `[278,248,288,396]`, `#playerActions` `[142,289,560,94]`, `innerHeight` 390.
- Repro: 844×390×3 mobile·touch·landscape 에뮬레이션 → 배치 탭 → 5번 선수 탭.
- Impact: 휴대폰을 옆으로 돌리면 편집 대상(피치)을 볼 수 없다. 경기장에서 가로로 보여 주는 상황에서 쓸 수 없다.
- Recommendation: `max-height: 500px` 같은 가로 조건에서 헤더를 한 줄로 접고(워드마크·버전 숨김, 파일바와 탭 합치기), 피치와 트레이를 좌우 2열로 배치한다. 최소한 트레이를 피치 옆 열로 옮긴다.
- Files: `index.html` 1067~1087행 `@media (max-width:1023px)` 트레이 고정 규칙. 가로 전용 미디어 쿼리는 확인되지 않았다(877행 native 전용 규칙만 있음).
- Status: Open
- 이전검토대조: 신규

### UX-B-03
- Severity: Medium
- Category: Visual
- Page: 움직임 패턴 화면
- Role: anonymous
- Component: `#patternCanvas` 선수 렌더링 `canvasPlayer()`
- Problem: 캔버스 선수 이름을 `bold 10px Segoe UI`, 번호를 `bold 13px Segoe UI`로 그린다. 390 화면에서 캔버스가 0.76배로 줄어 이름은 약 7.6px, 번호는 약 9.9px로 보인다. 이름은 `slice(0,7)`로 말줄임표 없이 잘린다. 배치 화면의 DOM 피치(이름 12px, 어두운 알약 바탕, Oswald 번호)와 글꼴·크기·라벨 처리가 달라 같은 앱의 두 피치가 다르게 보인다. GK 이름은 골라인 위에 겹친다. 캔버스 토큰 지름은 44 캔버스 단위라 390에서 약 33px다.
- Evidence: `evidence/UX-B-03-1280.png`, `evidence/UX-B-03-390-full.png`, `evidence/UX-B-14-1280.png`
- Repro: 390×844 에뮬레이션 → "움직임 패턴" 탭 → 피치의 선수 이름 크기 확인. 데스크톱 1280×800에서도 GK 라벨이 골라인과 겹침.
- Impact: 패턴 화면과 GIF 결과물에서 이름을 읽기 어렵다. 설계 문서의 "이름 12px 이상, 토큰 36px 이상, 탭 48px" 기준을 패턴 화면이 지키지 않는다.
- Recommendation: `canvasPlayer`가 DOM 피치와 같은 토큰을 쓰게 한다: 이름은 화면 기준 12px 이상이 되도록 `1/scale` 보정, `var(--font)`·`var(--num)` 글꼴, 어두운 반투명 알약 바탕, 골라인 근처 라벨은 옆으로. 이름은 말줄임표로 자른다.
- Files: `index.html` 1847행 `PLAYER_R = 22`, 2942~2958행 `canvasPlayer()`(2951·2955행 `ctx.font`, 2956행 `name.slice(0, 7)`)
- Status: Open
- 이전검토대조: 이전 지적 미해결(P2-2·P2-7 중 캔버스 부분)

### UX-B-04
- Severity: Medium
- Category: UX
- Page: 움직임 패턴 화면
- Role: anonymous
- Component: 미리보기 재생 중 단계 표시
- Problem: 2단계 패턴을 미리보기로 재생하는 동안 캔버스 왼쪽 위 배지는 "단계 1/2"인데 같은 순간 단계 이동 줄은 "단계 2 / 2"를 표시한다. 재생 버튼은 "일시정지"로 바뀐다.
- Evidence: `evidence/UX-B-04-1280.png`
- Repro: 1280×800 → 움직임 패턴 → 5번 선수를 드래그해 경로 → "+ 단계" → 다시 드래그 → "미리보기" → 0.7초 뒤 두 표시 비교.
- Impact: 지금 몇 단계를 보고 있는지 알 수 없다. 단계별 설명을 하려는 사용자에게 혼란을 준다.
- Recommendation: 재생 중에는 단계 이동 줄 라벨을 재생 중인 단계로 갱신하거나 "재생 중 1/2"로 바꾸고 이전·다음 버튼을 잠근다. 표시 출처를 하나로 맞춘다.
- Files: 확인 못 함(재생 루프와 `.step-nav span` 갱신 위치는 소스에서 특정하지 않았다)
- Status: Open
- 이전검토대조: 신규

### UX-B-05
- Severity: Medium
- Category: UX
- Page: 공통(인원 변경, 포메이션 초기화, 백업 복원, 포메이션 변경 확인)
- Role: anonymous
- Component: `uiConfirm()` 확인 대화상자
- Problem: (1) 되돌릴 수 없는 계열 작업의 확인 버튼이 라임 주 행동 스타일(`btn-green`)이고, 라벨이 대상과 무관하게 "변경"이다. 초기화 확인도 "변경", 복원 확인도 "변경"이다. (2) 열리자마자 포커스가 확인("변경") 버튼에 있어 Enter 한 번으로 실행된다. (3) `aria-label="변경 확인"`이 모든 확인창에 고정이고 본문을 `aria-describedby`로 연결하지 않는다. (4) 본문이 `word-break: normal`이라 "기본/공격/수\n비", "있습니\n다"처럼 음절 단위로 끊긴다. Esc 닫기·포커스 복귀·Tab 순환은 정상이다.
- Evidence: `evidence/UX-B-05-1280.png`, `evidence/restore-confirm-1280.png`. 측정: 열린 직후 `document.activeElement` = "변경" 버튼, `role=alertdialog`, `aria-describedby` 없음.
- Repro: 1280×800 → 선수 이름을 바꾼 뒤 "8vs8" 클릭 → 확인창 표시 → 포커스 위치·버튼 라벨 확인. "초기화" 버튼으로도 같은 창이 "변경" 버튼으로 뜬다.
- Impact: 데이터를 지우는 행동이 안전한 주 행동처럼 보이고 키보드 사용자는 실수로 실행하기 쉽다. 스크린리더는 무엇을 확인하는지 본문을 듣지 못할 수 있다.
- Recommendation: 호출부별 동사 라벨("8vs8로 바꾸기", "배치 초기화", "백업으로 바꾸기")을 넘기고, 데이터가 사라지는 확인은 위험(빨간 테두리) 스타일로 한다. 초기 포커스는 "취소"에 둔다. 제목·본문을 `aria-labelledby`/`aria-describedby`로 연결한다. `.dlg p`에 `word-break: keep-all`.
- Files: `index.html` 2231~2260행 `uiConfirm()`(2236행 aria-label 고정, 2240행 `btn-green`), 2178·2328행 `uiConfirm(…, '변경')` 호출
- Status: Open
- 이전검토대조: 신규(이전 검토는 `uiConfirm` 도입을 강점으로 봤다)

### UX-B-06
- Severity: Medium
- Category: Responsive
- Page: 배치 화면 (큰 데스크톱)
- Role: anonymous
- Component: `.layout` 2열 그리드, 인원 버튼 `#modePills`
- Problem: 화면이 넓어질수록 오른쪽 설정 열이 좁아진다. 1280에서 440px이던 열이 1920에서는 345px로 줄어 인원 버튼이 6개 + "11vs11" 1개로 줄바꿈되고, 둘째 줄에 버튼 하나가 덩그러니 남는다. 원인: 본문 폭을 1240px로 묶은 상태에서 왼쪽 열(피치 560 + 도구 280 = 856px)이 `auto`로 먼저 커지고 오른쪽 열은 `minmax(340px,440px)`의 남은 폭만 받는다.
- Evidence: `evidence/UX-B-06-1920.png`. 측정: 1920에서 `.layout` 열 `856px 345px`, `#modePills` 폭 277px.
- Repro: 1920×1080 → 배치 탭 → 오른쪽 "인원" 줄 확인.
- Impact: 가장 큰 화면에서 오히려 설정 열이 깨져 미완성처럼 보인다.
- Recommendation: 큰 화면에서는 본문 최대 폭을 넓히거나(예: 1360px) 오른쪽 열에 최소 400px를 보장한다. 인원 버튼은 모바일처럼 4열 격자를 데스크톱에도 쓰면 어느 폭에서도 줄이 고르다.
- Files: `index.html` 1111행 `padding-inline: max(20px, calc((100vw - 1240px) / 2))`, 1115행 `.layout { grid-template-columns: auto minmax(340px, 440px) }`, 1118행 `.pane-field grid-template-columns: auto 280px`
- Status: Open
- 이전검토대조: 신규(이전 P2-5는 모바일 360 문제였고 모바일은 해결됨)

### UX-B-07
- Severity: Medium
- Category: Accessibility
- Page: 매치 전략 → 전술 지침서
- Role: anonymous
- Component: 역할 태그 `.tactic-tag`
- Problem: "미드필더" 태그가 라임 글자(#B8E986)를 회색 바탕(#8B9A90) 위에 그려 대비 2.11:1이다(11.5px, 기준 4.5:1). A 설계가 `--faint`를 #74847A → #8B9A90으로 밝히면서 이 토큰을 바탕색으로 쓰던 태그가 같이 밝아졌다. "GK" 태그도 #E05D5D on #33201F 4.31:1로 기준 미달이다. 역할을 빨강·초록·회색·주황 색으로만 구분한다.
- Evidence: `evidence/UX-B-07-1280.png`. 측정값은 위와 같다(계산식 WCAG 2.x 상대 휘도).
- Repro: 1280×800 → 매치 전략 → "전술 지침서 생성" → 개별 선수 지침의 "미드필더" 태그.
- Impact: 저시력 사용자와 야외 직사광선에서 태그를 읽을 수 없다. 단톡방으로 복사할 지침서의 핵심 분류다.
- Recommendation: 미드필더 태그도 다른 태그처럼 짙은 바탕 + 밝은 글자 조합을 별도로 지정하고, 텍스트 토큰(`--faint`)을 바탕색으로 쓰지 않는다. GK 태그 글자는 `--danger-ink`(#FF9D9D)로.
- Files: `index.html` 571~577행 `.tactic-tag`(572행 `background:var(--faint)`), 741행 `--faint: #8b9a90`, 3623행 태그 클래스 분기
- Status: Open
- 이전검토대조: 신규

### UX-B-08
- Severity: Medium
- Category: Accessibility
- Page: 제보 모달
- Role: anonymous
- Component: `#feedbackModal`
- Problem: Esc로 닫히지 않는다. 포커스가 제목 입력에 있을 때도, "닫기" 버튼에 있을 때도 Esc 뒤 모달이 그대로였다. 전역 Esc 처리에 도움말·관심·공유·선수 시점·메뉴만 있고 제보 모달이 빠져 있다. 또 모달을 여는 즉시(사용자가 아무것도 하지 않았는데) 빨간 "제보 창구를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요." 문구가 뜨는데 "제보 보내기" 버튼은 활성 라임 상태로 남는다(로컬 환경에서 `/api/feedback` 404일 때 관찰).
- Evidence: `evidence/UX-B-08-1280.png`, `evidence/console-desktop-1280.log`(404 1건)
- Repro: 1280×800 → 헤더 "제보" → Esc → 모달 유지 확인. (이 로컬 서버에서는 열자마자 오류 문구 표시.)
- Impact: 키보드 사용자가 모달을 닫으려면 Tab으로 "닫기"를 찾아야 한다. 오류인데 보내기 버튼이 살아 있어 보내도 되는지 알 수 없다.
- Recommendation: 전역 Esc 처리에 `#feedbackModal`을 추가한다. 제보 창구를 준비하지 못한 상태에서는 보내기 버튼을 비활성화하고 "다시 시도"와 대체 경로(진단 정보 복사)를 함께 보여 준다.
- Files: `index.html` 1592행 `#feedbackModal`, 3789~3796행 전역 `keydown` Esc 처리, 4041~4102행 제보 열기·닫기
- Status: Open
- 이전검토대조: 신규

### UX-B-09
- Severity: Medium
- Category: UX
- Page: 도움말 모달
- Role: anonymous
- Component: `#helpModal` 본문
- Problem: 도움말이 현재 화면과 다르다. "위쪽 스쿼드 / 전술 패턴 / 매치 전략 탭"이라고 하지만 탭 이름은 "배치 / 움직임 패턴 / 매치 전략"이다. "파일 저장 / 파일 불러오기"라고 하지만 버튼은 "백업 파일 저장 (.sq) / 백업에서 복원"이다. "이름은 더블클릭(모바일은 길게 누르기)"이라고 하지만 모바일 주 경로는 탭 → 트레이 "이름"이다. "선수를 길게 눌러 선수 시점 보기"라고 하지만 오른쪽 패널에 "선수 시점 보기" 버튼이 있다. 전술 목록·내보내기 시트는 설명이 없다. 열면 첫 포커스가 "제보"(라임 버튼)로 간다.
- Evidence: `evidence/UX-B-09-1280.png`
- Repro: 1280×800 → 헤더 "도움말" → 1~4 항목과 실제 화면 라벨 비교.
- Impact: 처음 쓰는 사용자가 도움말을 따라 하면 해당 버튼을 찾지 못한다.
- Recommendation: 탭·버튼 실제 라벨로 다시 쓰고 전술 목록·내보내기 시트를 추가한다. 첫 포커스는 제목이나 닫기에 둔다.
- Files: `index.html` 1539행 `#helpModal`, 1546행 "스쿼드 / 전술 패턴 / 매치 전략" 문구
- Status: Open
- 이전검토대조: 이전 지적 미해결(P2-11, 탭 이름 변경으로 더 어긋남)

### UX-B-10
- Severity: Medium
- Category: Error
- Page: 내보내기·공유 패널 → 백업
- Role: anonymous
- Component: "백업에서 복원" 결과 표시 `.export-status`
- Problem: 잘못된 `.sq`를 고르면 오류("파일 형식이 올바르지 않습니다. 기존 전술은 유지됩니다.")는 몇 초 뒤 사라지는 토스트로만 나오고, 버튼 바로 아래 결과 줄에는 앞선 성공 문구 "백업 파일 다운로드를 요청했습니다…"가 초록색으로 그대로 남는다.
- Evidence: `evidence/UX-B-10-1280.png`(토스트가 사라진 뒤 초록 성공 문구만 남은 상태), 픽스처 `evidence/fixtures/invalid.sq`
- Repro: 1280×800 → 내보내기 패널 "백업 파일 저장 (.sq)" → "백업에서 복원" → `invalid.sq` 선택 → 2초 뒤 화면 확인.
- Impact: 복원이 실패했는데 가까운 곳에는 성공처럼 보이는 문장이 남아 사용자가 결과를 잘못 읽는다.
- Recommendation: 복원 성공·실패·취소를 같은 `.export-status`에 `data-tone`과 함께 쓰고(오류는 빨강, 지속 표시), 토스트는 보조로만 쓴다.
- Files: `index.html` 979~982행 `.export-status` 스타일. 복원 결과를 쓰는 함수는 소스에서 특정하지 않았다.
- Status: Open
- 이전검토대조: 신규

### UX-B-11
- Severity: Medium
- Category: Visual
- Page: 단톡방 공유 모달, 도움말, 제보
- Role: anonymous
- Component: 구형 모달(`#shareModal`, `#helpModal`, `#feedbackModal`) vs A 시트(`#librarySheet`, `.export-panel.as-sheet`)
- Problem: 모달 체계가 둘이다. A 시트는 머리줄 제목 + 오른쪽 위 X 아이콘 버튼 + 구분선이고, 구형 모달은 머리줄 구분 없이 본문 아래 "닫기"·"✕ 닫기"(문자 글리프) 버튼을 둔다. 공유 모달에는 여전히 "파일 저장"(텍스트 파일)이 있어 내보내기 패널의 "백업 파일 저장 (.sq)"과 이름이 겹친다. 공유 모달 안 미리보기 상자는 밝은 기본 스크롤바를 쓴다(UX-B-17).
- Evidence: `evidence/UX-B-11-1280.png`, `evidence/UX-B-09-1280.png`, `evidence/library-1280.png`, `evidence/UX-B-17-1280.png`
- Repro: 1280×800 → "단톡방 공유 텍스트 생성" 모달과 파일바 "전술 목록" 시트를 차례로 열어 비교.
- Impact: 같은 앱 안에서 닫는 위치와 모양이 바뀌어 학습이 끊긴다. "파일 저장"이 무엇을 저장하는지 헷갈린다.
- Recommendation: 구형 모달 3개를 A 시트 머리줄 구성(제목 + X)으로 옮기고, 공유 모달 버튼을 "텍스트 파일로 받기"로 바꾼다. 웹에서도 `navigator.canShare({files})`가 되면 이미지 "보내기"를 노출한다(현재 OS 공유는 native 전용).
- Files: `index.html` 1460~1466행 `#shareModal`(1466행 "파일 저장"), 1539행 `#helpModal`, 1592행 `#feedbackModal`, 977~978행 `.native-only`
- Status: Open
- 이전검토대조: 이전 지적 미해결(P1-6의 명칭·웹 공유 시트 부분)

### UX-B-12
- Severity: Medium
- Category: Visual
- Page: 내보내기 → 이미지(PNG)
- Role: anonymous
- Component: PNG 내보내기 결과물
- Problem: 결과 이미지 상단 제목 배너("기본 스쿼드 [3-3-1]")가 반투명이라 골 에어리어 선이 글자 위로 지나간다. 배너 앞에 광택 그라데이션 구(球) 아이콘을 쓴다. 앱 피치의 잔디 줄무늬가 결과물에는 없다. 팀명이 비어 있으면 결과물에 팀 표시가 없다.
- Evidence: `evidence/UX-B-12-export.png`(1200×1650 실제 다운로드 파일), 파일명 `스쿼드_기본 스쿼드_3-3-1.png`
- Repro: 1280×800 → 팀명 비운 상태 → 내보내기 패널 "이미지 저장" → 다운로드 파일 열기.
- Impact: 단톡방에 올라가는 결과물이 이 앱의 대표 인상인데, 선이 제목을 가로지르고 장식 아이콘이 앱 톤과 맞지 않는다.
- Recommendation: 내보낼 때 피치 위에 별도 헤더 띠(불투명 `--bg`)를 붙여 제목·팀명을 넣고 피치는 그 아래 그린다. 구 아이콘 대신 스쿼드 색 원형 또는 텍스트만 쓴다. 줄무늬는 앱 피치와 맞춘다.
- Files: 확인 못 함(PNG 렌더 경로는 html2canvas 기반으로 보이나 배너 생성 위치는 특정하지 않았다)
- Status: Open
- 이전검토대조: 이전 지적 미해결(P2-2 중 PNG 배너)

### UX-B-13
- Severity: Medium
- Category: Visual
- Page: 배치, 움직임 패턴, 매치 전략
- Role: anonymous
- Component: 색 역할(라임 강조, 선택 상태, 보조색)
- Problem: 설계 문서는 "라임은 주 행동(내보내기·공유, 새 전술, 선택 링)에만, 활성 탭은 초크 바탕"이라고 정했다. 그런데 활성 인원 버튼(9vs9)은 라임 바탕이다(같은 '선택 상태'인 스쿼드 탭·앱 탭은 초크). 움직임 패턴 화면은 "내보내기·공유"와 "미리보기"가 둘 다 라임이고, 매치 전략 화면은 "내보내기·공유", "기본 스쿼드 · 8vs8" 칩, "전술 지침서 생성" 3곳이 라임이다. 지침서는 주황 선수명, 라임 소제목, 빨강·초록·회색·주황 태그를 섞고 패턴 칩은 주황 테두리다.
- Evidence: `evidence/first-1280.png`(9vs9 라임), `evidence/UX-B-14-1280.png`(미리보기), `evidence/UX-B-13-1280.png`, `evidence/UX-B-07-1280.png`. 측정: `.mode-pill.active` 배경 rgb(184,233,134).
- Repro: 1280×800에서 각 탭을 열어 라임 바탕 요소 수를 센다.
- Impact: 화면마다 주 행동이 하나로 보이지 않는다. design-taste-frontend 4.2 "Color Consistency Lock", impeccable 인지 부하 "Visual hierarchy" 항목 위반.
- Recommendation: 선택 상태는 전부 초크(`--chalk`)로 통일하고 라임은 화면당 1개(배치·전략: 내보내기·공유 / 패턴: 미리보기 중 하나를 고름)로 줄인다. 지침서의 역할 색은 바탕 없는 작은 텍스트 라벨로 낮추고 선수명은 `--ink`로.
- Files: `index.html` 130행 `.mode-pill.active { background: var(--accent) }`, 568행 `.tactic-player-title { color:var(--warn) }`, 571~577행 `.tactic-tag`
- Status: Open
- 이전검토대조: 이전 지적 미해결(P2-4, 탭은 해결·나머지 남음)

### UX-B-14
- Severity: Medium
- Category: UX
- Page: 움직임 패턴 화면
- Role: anonymous
- Component: `#patternUI` 버튼 묶음과 내보내기 패널
- Problem: 같은 화면에 GIF 버튼이 두 벌 있다. 패턴 패널의 "GIF 저장 / 전체 패턴 GIF"와 바로 아래 내보내기 패널의 "현재 패턴 GIF 저장 / 전체 패턴 GIF 저장"이 같은 일을 다른 이름으로 한다. "고급 영상 (준비 중)" 칩이 실제 버튼과 같은 줄에 섞여 있다. 패턴 "삭제"가 혼자 한 줄을 차지하고, "+ 단계 / 단계 초기화 / 단계 삭제"가 붙어 있다. 데스크톱 기준 버튼 13개가 한 패널에 동시에 보인다.
- Evidence: `evidence/UX-B-14-1280.png`, `evidence/UX-B-03-390-full.png`
- Repro: 1280×800 또는 390×844 → "움직임 패턴" 탭 → 오른쪽(모바일은 아래) 패널.
- Impact: 인지 부하 기준(결정 지점 4개 이하)을 크게 넘는다. 같은 기능의 두 라벨이 "다른 기능인가?"를 묻게 한다(design-taste 4.5 No Duplicate CTA Intent).
- Recommendation: 패턴 패널의 GIF 버튼을 없애고 내보내기 패널 하나만 둔다. "준비 중" 칩은 패널 맨 아래 출시 준비 묶음으로 옮긴다. 패턴·단계 삭제·초기화는 더보기 메뉴로 모은다.
- Files: `index.html` 945~958행 패턴 패널 스타일. 버튼 마크업 위치는 `#patternUI` 안(행 번호 미확인).
- Status: Open
- 이전검토대조: 이전 지적 미해결(P2-8·P2-9 일부)

### UX-B-15
- Severity: Medium
- Category: Accessibility
- Page: 배치, 움직임 패턴
- Role: anonymous
- Component: 선수 토큰 키보드 조작, `#patternCanvas`
- Problem: 키보드로 선수를 선택(Enter)할 수는 있지만 옮길 수는 없다. 포커스한 선수에서 ↑ 두 번 → 위치 변화 0px. 패턴 캔버스는 `tabindex=-1`이고 경로·단계를 설명하는 텍스트 대안이 없다. 앱의 핵심 작업(배치·경로 그리기)을 키보드·스크린리더로 할 수 없다.
- Evidence: 측정 로그(이 문서 작성 중 Playwright `evaluate`): `{moved:false, dy:0}`, 캔버스 `aria-label="전술 패턴 캔버스 — 선수를 드래그해 이동 경로를 그리세요" | tabindex=-1`
- Repro: 1280×800 → Tab으로 "5번 미드1 선수 편집"까지 이동 → ↑ 키 → 위치 확인.
- Impact: WCAG 2.1.1(키보드) 위반. 마우스·터치를 못 쓰는 사용자는 배치를 만들 수 없다.
- Recommendation: 포커스한 선수에 방향키 이동(기본 8px, Shift 32px)을 넣고 `aria-live`로 "미드1, 왼쪽 30% 위쪽 45%"처럼 알린다. 패턴은 단계별 텍스트 요약 목록을 캔버스 옆에 둔다.
- Files: `#field .player` 키 처리(행 미확인), `#patternCanvas` tabindex 설정(행 미확인)
- Status: Open
- 이전검토대조: 이전 지적 미해결(P2-10)

### UX-B-16
- Severity: Low
- Category: Visual
- Page: 공통
- Role: anonymous
- Component: 토스트 `.toast`
- Problem: 토스트가 가운데 작은 알림이 아니라 화면 폭 전체(1280에서 x=5~1260) 띠로 뜬다. 원인은 A 레이아웃의 `body > * { width:100% }`가 `position:fixed` 토스트에도 적용되기 때문이다. 1280×800에서 5초 동안 피치 아래쪽과 GK를 덮는다.
- Evidence: `evidence/UX-B-16-1280.png`
- Repro: 1280×800 → 선수 이름 변경 → "8vs8" → 확인 → 하단 토스트 폭 확인.
- Impact: 되돌리기 버튼이 왼쪽 끝 작은 글자로 떨어져 있고, 편집 대상이 가려진다.
- Recommendation: `.toast { width:auto; max-width:min(560px, 100vw - 24px) }`로 되돌린다. UX-B-01과 같은 원인이므로 `body > *` 규칙에서 fixed 레이어(`.toast`, `#ctxMenu`, 대화상자)를 빼는 편이 근본 수정이다.
- Files: `index.html` 606~612행 `.toast`, 759행 `body > *`, 1055행 A 토스트 규칙
- Status: Open
- 이전검토대조: 신규

### UX-B-17
- Severity: Low
- Category: Visual
- Page: 공통(페이지, 내보내기 시트, 공유 모달)
- Role: anonymous
- Component: 스크롤바·`color-scheme`
- Problem: `color-scheme`이 `normal`이라 다크 화면에 밝은 기본 스크롤바가 그려진다. 데스크톱 내보내기 시트는 내용이 13px 넘쳐(scrollHeight 683 / clientHeight 670) 흰 스크롤바가 시트 오른쪽에 붙는다. 매치 전략 탭으로 가거나 시트를 열면 페이지 스크롤바가 사라지며 헤더 전체가 약 15px 옆으로 밀린다.
- Evidence: `evidence/UX-B-17-1280.png`, `evidence/UX-B-11-1280.png`, `evidence/UX-B-13-1280.png`(헤더 위치 비교: 배치 화면 대비 "내보내기·공유" x 707 → 722)
- Repro: 1280×800 → 헤더 "내보내기·공유" → 시트 오른쪽 스크롤바 확인. 배치 ↔ 매치 전략 탭 전환 시 헤더 이동 확인.
- Impact: 다크 테마 표면 위에 이질적인 흰 막대가 생기고, 탭 전환마다 화면이 흔들린다.
- Recommendation: `:root { color-scheme: dark; }`와 `html { scrollbar-gutter: stable; }`를 추가하고 시트 내부 여백을 13px 줄인다.
- Files: `index.html` 27행·740행 `:root`(color-scheme 없음), 1138행 `.export-panel.as-sheet { max-height:84vh }`
- Status: Open
- 이전검토대조: 신규

### UX-B-18
- Severity: Low
- Category: Accessibility
- Page: 배치 화면
- Role: anonymous
- Component: 인원 버튼 `.mode-pill`
- Problem: 현재 인원은 `.active` 클래스(색)로만 표시되고 `aria-pressed`나 `aria-current`가 없다. 스크린리더는 7개 버튼 중 무엇이 현재 값인지 알 수 없다.
- Evidence: 측정: 7개 모두 `aria-pressed=null`, 활성 버튼만 배경 rgb(184,233,134).
- Repro: 1280×800 → 접근성 트리에서 "인원" 그룹 버튼 상태 확인.
- Impact: 색으로만 상태를 전달(WCAG 1.3.1/4.1.2).
- Recommendation: 생성 시 `aria-pressed="true|false"`를 넣거나 라디오 그룹으로 바꾼다.
- Files: `index.html` 1968행 `<button class="mode-pill…" onclick="onModeChange(…)">`
- Status: Open
- 이전검토대조: 신규

### UX-B-19
- Severity: Low
- Category: Accessibility
- Page: 배치 화면
- Role: anonymous
- Component: 선수 토큰 이름, 색상 견본
- Problem: Lighthouse `label-content-name-mismatch` 실패: 화면 글자는 "2 / 수비1"인데 접근성 이름은 "2번 수비1 선수 편집"이라 음성 제어("수비1 누르기")가 맞지 않을 수 있다. 색상 견본 이름은 "선수 색상 #E53935"처럼 16진 코드다.
- Evidence: `evidence/lighthouse/report.html`, `report.json` audit `label-content-name-mismatch`(9개 노드)
- Repro: 390×844 mobile Lighthouse(navigation) 실행.
- Impact: 음성 제어·스크린리더 사용자에게 의미 없는 색 이름.
- Recommendation: 접근성 이름을 "2 수비1, 선수 편집"처럼 보이는 글자로 시작하게 하고, 견본은 "빨강", "파랑"처럼 이름을 붙인다.
- Files: `index.html` 2670행 `aria-label="선수 색상 ${c}"`, 선수 토큰 생성부(행 미확인)
- Status: Open
- 이전검토대조: 신규

### UX-B-20
- Severity: Low
- Category: Accessibility
- Page: 배치 화면
- Role: anonymous
- Component: 선수 번호 원
- Problem: 흰 번호(18.5px, 600)가 기본 파랑 #1E88E5 위 3.68:1, GK 빨강 #E53935 위 4.23:1이다. 18.66px 굵게(700) 미만이라 큰 글자 기준(3:1)이 아닌 4.5:1이 적용된다.
- Evidence: `evidence/first-1280.png`, 대비 측정 스크립트 결과(1280×800)
- Repro: 1280×800 → 기본 9vs9 화면 → 번호 원 대비 측정.
- Impact: 야외 밝은 곳에서 번호 판독이 떨어진다(영향은 작음, 원 형태와 이름표가 보조).
- Recommendation: 번호를 700 굵기로 올려 큰 글자 기준을 충족하거나 기본 파랑을 #1565C0 계열로 어둡게 한다.
- Files: `index.html` 890~893행 `#field .player-circle`(font-weight 600)
- Status: Open
- 이전검토대조: 신규

### UX-B-21
- Severity: Low
- Category: UX
- Page: 배치 화면
- Role: anonymous
- Component: 조작 안내 `.hint`, 선수 도구 빈 상태 `.pa-empty`
- Problem: 안내가 실제 동작과 어긋난다. 모바일 힌트는 "길게 누르기: 이름·색상·삭제 메뉴"만 알리고, 실제 주 경로인 "탭 → 하단 도구"는 알리지 않는다. 데스크톱 빈 상태 카드는 "끌면 자리만 옮겨집니다"라고 하지만 드래그한 선수가 선택돼 도구가 바뀐다(드래그 뒤 `.selected` = 드래그한 선수). 데스크톱은 같은 내용의 안내가 피치 옆 카드와 피치 아래 줄로 두 번 보인다. 768×1024에서는 트레이가 힌트 줄(y=912)을 덮는다(트레이 y=923).
- Evidence: `evidence/first-390.png`, `evidence/first-1280.png`, `evidence/UX-B-21-768.png`
- Repro: 390×844 → 피치 아래 힌트 문구 확인. 1280×800 → 선수 하나 드래그 → 오른쪽 도구에 드래그한 선수 표시 확인.
- Impact: 탭 선택을 발견하지 못하거나, 안내와 다른 결과에 혼란.
- Recommendation: 모바일 힌트를 "탭: 선수 도구 · 끌기: 이동"으로 바꾸고, 데스크톱은 한 곳만 남긴다. 문구를 실제 동작(끌면 이동하고 그 선수가 선택됨)에 맞춘다.
- Files: `index.html` 880행 `.hint`, 919행 `.pa-empty`, 1085행 `body.has-selection .hint { visibility:hidden }`
- Status: Open
- 이전검토대조: 신규

### UX-B-22
- Severity: Low
- Category: UX
- Page: 배치 화면
- Role: anonymous
- Component: 선수 이름 입력
- Problem: 이름 입력이 `maxLength=12`라 13번째 글자는 알림 없이 버려진다. 피치 이름표는 84px에서 말줄임되고, 설계 문서가 "전체 이름은 선택 트레이에 표시"라고 했지만 데스크톱 트레이(280px)도 "5. 김수한무거…"로 잘린다. 전체 이름을 볼 곳이 없다.
- Evidence: `evidence/UX-B-22-1280.png`
- Repro: 1280×800 → 5번 선택 → "이름" → "김수한무거북이와두루미삼천"(13자) 입력 → Enter → 트레이·피치 확인.
- Impact: 긴 이름(별명+등번호 등)을 쓰는 팀은 누가 누구인지 확인이 어렵다.
- Recommendation: 입력 옆에 "n/12" 카운터를 두고, 트레이 이름은 줄바꿈 허용 또는 `title`/툴팁으로 전체 이름을 보인다.
- Files: `index.html` 921행 `.player-actions-name { white-space:nowrap; text-overflow:ellipsis }`, 897행 `#field .player-name max-width`
- Status: Open
- 이전검토대조: 신규

### UX-B-23
- Severity: Low
- Category: Visual
- Page: 공통(대화상자, 내보내기 패널, 도움말, 제보)
- Role: anonymous
- Component: 한글 줄바꿈
- Problem: `word-break: keep-all`이 버튼·탭에만 있고 본문은 `normal`이라 "바\n뀌지", "않습니\n다", "수\n비"처럼 음절 중간에서 줄이 바뀐다.
- Evidence: `evidence/export-sheet-390.png`, `evidence/UX-B-05-1280.png`, `evidence/UX-B-09-1280.png`
- Repro: 390×844 → "내보내기" 시트 → "링크·텍스트" 설명 줄 끝 확인.
- Impact: 읽기 리듬이 깨지고 덜 다듬어진 인상.
- Recommendation: `body { word-break: keep-all; overflow-wrap: anywhere; }`로 전역 적용한다.
- Files: `index.html` 763행 `button, .app-tab, .squad-tab { word-break: keep-all; }`
- Status: Open
- 이전검토대조: 신규

### UX-B-24
- Severity: Low
- Category: Visual
- Page: 움직임 패턴, 공유 모달, 브라우저 탭
- Role: anonymous
- Component: 아이콘
- Problem: A 영역은 Tabler 인라인 SVG(초기화·공유·목록·닫기)를 쓰지만, 패턴 패널은 "◀ ▶ ↺" 문자, 공유 모달은 "✕ 닫기" 문자, 파비콘은 ⚽ 이모지다. 같은 "초기화" 의미가 배치 화면에서는 SVG, 패턴 화면에서는 "↺" 문자다.
- Evidence: `evidence/UX-B-14-1280.png`, `evidence/UX-B-11-1280.png`, `evidence/first-1280.png`
- Repro: 1280×800 → 배치 "초기화"와 움직임 패턴 "↺ 단계 초기화" 비교.
- Impact: 글리프 굵기·기준선이 SVG와 달라 컴포넌트 일관성이 떨어진다(design-taste 3.C 한 아이콘 계열, 3.D 이모지).
- Recommendation: 문자 글리프를 같은 Tabler 경로(chevron-left/right, refresh, x)로 교체하고 파비콘은 워드마크 기호로 바꾼다.
- Files: `index.html` 21~22행 파비콘, 766행 `.ui-icon`, 패턴 패널·공유 모달 버튼 마크업(1460행대)
- Status: Open
- 이전검토대조: 신규

### UX-B-25
- Severity: Low
- Category: Visual
- Page: 공통
- Role: anonymous
- Component: 문구의 em dash(—)
- Problem: 화면·메타 문구에 em dash가 여러 곳 있다: 문서 제목 "스쿼드 메이커 — 축구 포메이션…", 지침 라벨 "기본 스쿼드 — 전체 지침", 토스트 "복사됨 — 단톡방에 붙여넣기 하세요", 도움말 "단톡방 공유 텍스트 생성 — …", 피치 영역 `aria-label`.
- Evidence: `evidence/first-1280.png`("기본 스쿼드 — 전체 지침"), `evidence/UX-B-09-1280.png`
- Repro: 1280×800 → 오른쪽 지침 카드 제목 확인.
- Impact: design-taste-frontend 9.G 기준의 대표적 "AI 문체" 신호. 사용자 영향은 작다.
- Recommendation: "기본 스쿼드 전체 지침", "복사했습니다. 단톡방에 붙여 넣으세요."처럼 마침표·쉼표로 바꾼다.
- Files: `index.html` 6·10·17행 title/og, 3800행 `showToast('복사됨 — …')`, 1546행대 도움말
- Status: Open
- 이전검토대조: 신규

### UX-B-26
- Severity: Low
- Category: UX
- Page: 배치 화면
- Role: anonymous
- Component: "+ 선수 추가" 버튼
- Problem: 인원 수만큼 선수가 있으면 버튼이 투명도 0.4로 비활성되지만 이유(최대 인원 도달)를 알려 주지 않는다. 버튼은 계속 같은 자리에서 첫 화면에 보인다.
- Evidence: `evidence/first-1280.png`
- Repro: 1280×800 첫 화면 → "+ 선수 추가" 버튼 상태 확인(9vs9, 9명).
- Impact: 왜 못 누르는지 몰라 인원 버튼을 눌러 보게 되고, 그러면 초기화 확인창이 뜬다.
- Recommendation: 비활성 옆에 "9명 모두 배치됨" 보조 문구를 두거나 선수를 지웠을 때만 버튼을 보인다.
- Files: 선수 추가 버튼 마크업(행 미확인)
- Status: Open
- 이전검토대조: 신규

---

## 디자인 총평

평가 방식: impeccable critique 기준으로 단일 맥락에서 평가했다(이 작업은 위임받은 서브에이전트라 Assessment A/B 이중 실행을 하지 않았다). 자동 검사 결과는 같은 폴더의 `detect.md`/`evidence/detect-*.json`을 이 문서 작성 뒤에 대조해야 한다.

### 강점
1. **피치가 확실한 주인공이다.** 1280·1366·390 모두 첫 화면에 피치 전체와 선택 도구가 함께 들어온다. 이전 검토의 가장 큰 배치 문제(P1-3)를 실제로 풀었다.
2. **데이터 보호 장치가 생겼다.** 인원 변경·초기화·복원에 확인 + 되돌리기가 붙었고, 복원 결과가 새로고침 뒤에도 유지된다. "저장됨" 칩으로 자동 저장이 보인다.
3. **DOM 피치의 이름표 처리.** 짙은 알약 바탕 12px 이름표, GK 이름표를 토큰 옆으로 빼는 처리, Oswald 번호가 라인과 겹쳐도 읽힌다.
4. **터치 기본기.** 390에서 44px 미만 인터랙티브 요소 0개, 가로 넘침 0, 터치 드래그 중 스크롤 0. 탭 선택 → 하단 트레이 모델이 데스크톱 "선택 → 도구"와 맞춰졌다.
5. **A 시트(전술 목록·내보내기)의 완성도.** 제목 + X 머리줄, 포커스 트랩, Esc, 포커스 복귀가 정확히 동작한다.

### 약점
1. **A 이전 화면이 섞여 있다.** 패턴 캔버스(Segoe UI 10px, 이름표 없음), 공유·도움말·제보 모달(아래쪽 닫기, 문자 글리프), 지침서(주황·라임·태그 색 혼합)가 A의 토큰·컴포넌트를 쓰지 않아 한 앱 안에서 두 시대의 UI가 보인다(UX-B-03, 11, 13, 24).
2. **전역 레이아웃 규칙의 부작용.** `body > * { width:100% }` 하나가 컨텍스트 메뉴(화면 밖 잘림)와 토스트(전체 폭)를 깨뜨렸다(UX-B-01, 16). 큰 화면에서 설정 열이 좁아지는 그리드 계산도 같은 계열이다(UX-B-06).
3. **강조색 규칙이 화면별로 지켜지지 않는다.** 선택 상태가 초크·라임으로 갈리고, 패턴·전략 화면은 라임이 2~3개다(UX-B-13).
4. **움직임 패턴 화면의 밀도.** 버튼 13개, 같은 GIF 기능 두 벌, 준비 중 칩 혼재. 인지 부하 체크리스트 중 Single focus·Minimal choices·Visual hierarchy 3개 실패(UX-B-14).
5. **키보드·보조기술 경로의 공백.** 선수 이동·경로 그리기를 키보드로 못 하고, 제보 모달은 Esc가 안 된다(UX-B-08, 15).

### 우선 개선 방향
1. **[작은 수정] 레이어·토큰 버그 일괄 정리** — `body > *`에서 fixed 레이어 제외(UX-B-01·16), `color-scheme: dark`·`scrollbar-gutter`(UX-B-17), 전역 `keep-all`(UX-B-23), 태그 대비(UX-B-07), 제보 Esc(UX-B-08), 확인창 라벨·포커스(UX-B-05), 도움말 문구(UX-B-09). CSS·문구 위주라 콘셉트 절차 없이 진행 가능.
2. **[작은~중간 수정] 패턴 화면을 A 체계로 편입** — 캔버스 렌더를 DOM 피치 토큰(글꼴·12px 이름표·골라인 처리)에 맞추고(UX-B-03), 중복 GIF 버튼·준비 중 칩을 정리(UX-B-14), 재생 중 단계 표시 통일(UX-B-04), 구형 모달을 A 시트로 이전(UX-B-11). 기존 A 설계 문서 범위 안의 정돈이라 새 콘셉트는 불필요하다고 판단하나, 패턴 패널 재배치는 레포 규칙상 "주요 UX 변경" 여부를 사용자가 판단해야 한다.
3. **[콘셉트 재설계 필요] 가로·대형 화면과 결과물 정체성** — 모바일 가로(UX-B-02)·대형 데스크톱(UX-B-06) 레이아웃, PNG/GIF 결과물 헤더 띠(UX-B-12)는 화면 구조를 바꾸는 작업이다. AGENTS.md 규칙대로 `docs/ux-concepts/<slug>/`에 콘셉트 3종(예: 가로 2열 편집 / 헤더 접힘형 / 결과물 템플릿형)을 먼저 만들고 선택을 받아야 한다.

## Not verified

- 실제 Android·iOS 기기 터치, 소프트 키보드, 다운로드 폴더 동작, 카카오톡 공유. 모바일은 Chromium 에뮬레이션과 페이지 내 `TouchEvent` 합성으로만 확인했다(브라우저 기본 제스처·패시브 리스너 차이는 반영되지 않음).
- GIF 내보내기 실제 인코딩·진행률·실패 처리(이번에는 실행하지 않음), 저장 공간 초과·사생활 모드 등 localStorage 실패, 오프라인 내보내기.
- 공유 링크를 받은 사람의 열람 모드 화면, 클립보드 복사 결과(권한 팝업 포함), 제보 실제 전송(지시대로 하지 않음). 로컬 서버에 `/api/feedback`이 없어 정상 제보 창구 상태의 화면은 보지 못했다.
- 스크린리더(NVDA/TalkBack) 실사용 낭독, 200% 확대·루트 글자 크기 확대, `prefers-reduced-motion`, 라이트 모드(앱은 다크 고정이라 design-taste 6.C의 양 모드 요구는 브리프상 적용하지 않음).
- Lighthouse Performance(도구가 제외), 느린 네트워크에서의 Google Fonts 대체 글꼴 레이아웃.
- 768×1024 태블릿은 마우스 입력으로만 봤고 터치 에뮬레이션은 하지 않았다.
