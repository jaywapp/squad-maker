# A 운영 UI (U-02/U-03): Codex 인계

- slug: `a-ui-20261007` · [분석](a-ui-20261007-analysis.md) · [설계](a-ui-20261007-design.md) · [작업](a-ui-20261007-tasks.md)
- 작성: Claude (orchestrator=Claude, 별도 작업 트리 `.worktrees/squad-maker-a-ui-20261007`)
- 기준: PR #44 `feat/a-android-preview-20261007` 검증 SHA `046f5f60a775abcc05f76143bce919dbf19b56da`
- UI 브랜치: `feat/a-ui-20261007`. UI 코드 커밋 `89de5bc801d713d818cfa554d2b4914d40a9cabc`(index.html). 그 뒤 커밋은 문서·캡처만 추가한다. 브랜치 최종 head SHA와 draft PR은 PR 본문에 적는다.
- Codex 담당으로 남긴 것: main 병합, PR #44 통합, APK 빌드·서명·설치·Release 게시, 실제 Android 검증.

## 1. 변경 파일

| 파일 | 내용 |
|---|---|
| `index.html` | UI 마크업·CSS·UI 전용 인라인 스크립트. 기능 함수·검증·저장 로직은 바꾸지 않음 |
| `docs/a-ui-20261007-analysis.md`, `-design.md`, `-tasks.md`, `-handoff.md` | 이 작업의 문서 |
| `docs/a-ui-20261007/screenshots/*.png` (29장) | 최종 코드 화면 캡처 |
| `docs/a-ui-20261007/ui-verify.playwright.js` | 화면 검증 스크립트(Playwright MCP `browser_run_code`, 로컬 `http://127.0.0.1:4320`) |
| `docs/README.md` | 문서 인덱스 한 줄 |

수정하지 않은 것: `app/local-library.js`, `app/platform-native.js`, `android/`, `scripts/`, 서명, `package.json`·lockfile, `tests/`(회귀·fixture·vendor), `docs/design-a/` 원본.

## 2. index.html 변경 범위 (Android 번들 포함 확인용)

UI CSS/JS는 별도 파일(`app/ui-a.*`) 없이 index.html 안에 인라인으로 넣었다. 이유: `scripts/build-android-web.mjs`는 `app/`에서 `platform-native.js`·`local-library.js`만 복사하므로 새 파일은 APK에 들어가지 않는다. 스크립트는 Codex 소유라 수정하지 않았다.

| 위치(검색 표식) | 내용 |
|---|---|
| `<head>` Google Fonts 링크 | `IBM Plex Sans KR` 추가. 번들 스크립트가 이 링크를 제거하므로 APK에서는 `Noto Sans KR`·시스템 글꼴로 대체됨 |
| `<style>` 끝 `A 나이트피치 운영 UI` 주석 이후 | A UI CSS 전체. 기존 규칙은 지우지 않고 뒤에서 덮어씀 |
| `<body>` `.topbar` 다음 `#fileBar` | 새 파일 헤더(전술 목록 열기, 저장 칩, 내보내기 열기) |
| `.app-tabs`, `.squad-tabs` | 버튼 문구만 변경: 배치/움직임 패턴/매치 전략, 기본/공격/수비 |
| `#saveStatus` | 경고 띠 버튼 추가(백업 파일 저장, 백업에서 복원). 기존 `#saveStatusText`·`#retrySaveBtn`과 문구는 그대로 |
| `.formation-bar` 다음 `#emptyFileCard` | 보관된 전술 없음(no-file) 빈 상태 |
| `#playerActions` | 내부 구조(이름 줄 + 도구 줄), "색상" 버튼(aria-label "색상·더보기") |
| `#patternUI` | 4줄 재배치. `#playBtn`을 단계 이동 줄로 이동. ID·`+ 추가`·`#gifBtn`·`#gifAllBtn` 유지 |
| `.controls[aria-label="선수 조작"]` | `이미지 저장`을 내보내기 패널로 옮기고 `선수 시점 보기`를 이곳으로 |
| `#exportPanel[aria-label="공유 및 파일"]` | 기존 공유·파일 버튼 묶음을 이미지/GIF/링크·텍스트/백업 4그룹 패널로 교체. 헤더 버튼으로 같은 DOM을 시트로 연다 |
| `#librarySheet` (모달 영역) | 전술 목록 시트 |
| 마지막 `<script>` `A UI LAYER` | UI 전용 스크립트. `window.SquadUi = { closeTopLayer, openLibrary, openExport }` |

번들 확인: `npm run android:bundle` 결과물 `.work/android-web/index.html`에 `A UI LAYER`, `A 나이트피치 운영 UI`, `id="librarySheet"`, `id="exportPanel"`, `SquadUi = Object.freeze`가 각 1회 있고 Google Fonts 링크는 0회다. 번들 스크립트의 첫 `<script>` 치환(platform-native 주입)은 기존 본문 스크립트 앞에서만 일어나고 UI 스크립트에는 영향이 없다. `tests/e2e/android-bundle.spec.js` 통과.

## 3. 계약 v2 연결 (기능 중복 없음)

| UI | 사용한 경계 |
|---|---|
| 부팅 잠금, 처리 중 | `subscribe()`의 `ready`, `busy.mutation`, `export.busy` |
| 저장 칩·경고 띠·빈 상태 | `storage.status/error/retryable`. 다시 저장은 기존 `#retrySaveBtn`(`flushSave`), 백업은 `run('export-sq')`, 복원은 기존 파일 입력(`loadSquadFile` → `import-snapshot` 경로) |
| 헤더 이름 | `localLibrary.teams/items/teamId/fileId`, `snapshot.squad` |
| 전술 목록 | `run('create-team'|'rename-team'|'create-file'|'rename-file'|'open-file'|'delete-file'|'delete-team'|'undo-delete')`. 삭제 확인창은 기능 코드가 띄움 |
| 보관 현황 | `localLibrary.slots`. `preview-unlimited`는 "미리보기 빌드는 보관 개수를 제한하지 않습니다. 무료 보관 수량은 아직 정해지지 않았습니다."로만 표시. 숫자 한도는 "(테스트 정책 값)"으로만 표시 |
| 내보내기 결과 | `run('export-png'|'export-gif'|'export-sq', {destination})` 결과와 `squad-maker:result` 이벤트. OS 공유 버튼은 `platform.native`일 때만 표시 |
| 선수 선택(터치) | `run('select-player', {id})` (아래 5장) |
| 뒤로가기 | `window.SquadUi.closeTopLayer()`: 색상 메뉴 → 화살표 팝오버 → 내보내기 시트 → 전술 목록(입력 폼 먼저) → 수요 측정 모달 순으로 하나만 닫고 `true`. 선택은 유지. 처리할 레이어가 없으면 `false`라 platform-native의 기존 모달 처리·저장 후 종료 흐름이 이어짐 |

## 4. 검증 결과 (최종 코드: index.html SHA-256 `D58A5A716C36F81B…`)

환경: Windows 11, Node 22.19.0, Playwright Chromium. 테스트는 기존 설정(`workers: 1`, `fullyParallel: false`)에 `--workers=1`과 `--project`로 데스크톱·모바일을 나눠 순차 실행했다. 각 단계 전 가용 메모리와 Codex Gradle 활동(잠금 파일 17:46 이후 갱신 없음)을 확인했다. Codex의 headless 에뮬레이터·Gradle 데몬은 종료하지 않았다.

| 단계 | 명령 | 결과 |
|---|---|---|
| 기준선(046f5f6, 수정 전) | `npm test` | 단위 95/95, e2e 187 통과 / 1 skip |
| 1 단위 | `npm run test:unit` | 95/95 |
| 2 데스크톱 e2e | `npm run android:bundle` 후 `npx playwright test --project=desktop-1280 --workers=1` | 94 통과 (3.0분) |
| 3 모바일 e2e | `npx playwright test --project=mobile-390 --workers=1` | 93 통과, 1 skip (기준선과 같은 `전체 패턴 GIF 내보내기` mobile skip) |
| 4 화면 검증 | `docs/a-ui-20261007/ui-verify.playwright.js` | 전 항목 통과 (아래) |

테스트 파일·기대값은 바꾸지 않았다. 앞선 1차 실행(e2e 106개 통과 시점)은 시스템 메모리 부족으로 Claude Code가 백그라운드 작업을 중단한 자원 부족 중단이었고, 그 뒤 코드가 바뀌었으므로 결과에 합산하지 않았다.

### 화면 검증 (Chromium 에뮬레이션, 실제 Android 아님)

| 항목 | 360×800 | 390×844 | 412×915 | 1366×768 | 1440×900 |
|---|---|---|---|---|---|
| 가로 넘침 | 0 | 0 | 0 | 0 | 0 |
| AA 대비 미달(피치 밖 텍스트) | 0 | 0 | 0 | 0 | 0 |
| 48px 미만 터치 영역(모바일) / 40px 미만(데스크톱) | 0 | 0 | 0 | 0 | 0 |
| 피치 이름표 / 토큰 화면 크기 | 12px / 36px | 12 / 36 | 12 / 36 | 12 / 36 | 12.1 / 44 |
| 피치와 선택 도구 동시 노출(겹침 없음) | 피치 아래 696 / 트레이 위 699 | 740 / 743 | 782 / 814 | 패널 188~364 | 패널 188~364 |
| 전술 목록 왕복 후 선택·패턴·단계·revision·스크롤 동일, 포커스 복귀 | 예 | 예 | 예 | 예 | 예 |
| 재생·이전/다음 단계 버튼 화면 안 | 예(재생 아래 760) | 예(782) | 예(812) | 예 | 예 |
| 콘솔 오류 | 0 | 0 | 0 | 0 | 0 |

| 시나리오 | 결과 |
|---|---|
| 긴 한글 이름(12자) + 루트 글자 200% (360) | 가로 넘침 0, 트레이 버튼 넘침 없음, 이름표 말줄임, 움직임 패턴 재생 버튼 화면 안 |
| 키보드만(1366) | Enter로 선수 선택, 선택 링 표시, 이름 변경, 전술 목록 열기, Tab 12회 동안 포커스가 시트 밖으로 나가지 않음(중간에 자동 저장 상태 변화 2회 주입), Esc 닫기 후 연 버튼으로 복귀, 포커스 링 3px |
| reduced-motion | 시트 `animation-name: none` |
| 저장 실패 주입(localStorage quota) | 저장 칩 "저장 실패", 경고 띠 고정, 다시 저장·백업 버튼 표시, 계약 `storage-quota / retryable:true` |
| 내보내기(가짜 native 어댑터) | 공유 버튼 표시, 취소 → "취소했습니다. 전술은 그대로입니다.", 실패 → 오류 문구, `share-sheet-finished` → 전달 완료로 단정하지 않는 문구. 이후 선택·패턴·revision 유지 |
| 전술 목록 | 생성(긴 이름) → 헤더 반영, 삭제 확인창, 삭제 되돌리기, 마지막 파일 삭제 후 `no-file` 빈 상태 카드 |
| 뒤로가기 `closeTopLayer` | 첫 호출 시트 닫힘 `true`, 다음 호출 `false`, 선택 유지 |
| 보관 가득 참 | **preview 기본값에는 한도가 없어 미적용.** 계약이 허용한 테스트 주입(`SQUAD_MAKER_PREVIEW_POLICY={limit:1}`)에서만 "보관 중 1 / 1 (테스트 정책 값)"과 `slots-full` 안내를 확인했다. 과금 정책은 만들지 않았다 |

## 5. 짧은 탭 → `select-player` (R1 대응, 실제 Android 확인 필요)

기능 코드의 `#field` `touchstart`가 `preventDefault()`를 호출해 터치 후 `click`이 생기지 않는 환경에서는 탭으로 선수 도구가 열리지 않는다(Chromium 터치 에뮬레이션에서 재현). 기능 코드는 바꾸지 않고, UI 스크립트에서 passive 터치 리스너로 짧은 탭만 공개 계약 `run('select-player')`로 보냈다.

- 판정: 선수 위에서 시작, 손가락 1개, 이동 8px 이하, 450ms 이내, 인라인 이름 입력 중이 아님, 색상 메뉴가 열려 있지 않음, 읽기 전용 아님.
- 에뮬레이션 결과: 짧은 탭 선택 1회. 드래그 종료 0회(위치만 이동), 길게 누르기 0회(메뉴만), 피치 밖에서 시작한 스크롤 0회(페이지는 스크롤됨), 빈 피치 탭 0회, 4px 흔들림 탭 1회.
- 중복: `select-player`는 같은 선수 선택을 반복해도 결과가 같다. 실제 기기에서 브라우저가 `click`도 보내면 기존 click 경로와 합쳐 2회 호출될 수 있으나 상태 결과는 같다.
- **Codex 요청**: 실제 Android(WebView/Chrome, 기기·OS 버전 기록)에서 탭·드래그·길게 누르기·스크롤을 확인하고, `click`이 함께 오는지(선택 호출 횟수) 기록. 원인 확정 뒤 기능 코드에서 터치 판정을 정리할지 결정.

## 6. 가격이 표시되는 수요 측정 칩 (검토 요청)

테스트(`interest-previews.spec.js`)가 노출과 문구(`6,900원` 포함)를 고정하고 있어 그대로 두었다. **상용 정책으로 채택한 것이 아니다.** 시각적으로만 낮췄다(투명도·위치 유지).

| 위치 | 문구 / 동작 |
|---|---|
| 배치 화면 설정 열 하단 `.interest-section` "출시 준비 중" | 칩 3개: 클라우드에 팀 저장, 고급 영상 내보내기, 선수별 브리핑 |
| 움직임 패턴 패널 GIF 줄 | 칩 "고급 영상 (준비 중)" |
| 칩을 누르면 `#interestModal` | "아직 출시 전인 기능입니다 … 지금 쓰고 계신 무료 기능은 그대로 무료로 유지됩니다." 기능 설명 3줄, 가격 줄: 클라우드 = "무료 계정: 팀 1개 · 전술 문서 5개 / Pro(예상 월 6,900원): 여러 팀 · 무제한 문서", 고급 영상·브리핑 = "Pro 요금제(예상 월 6,900원) 포함 기능" |
| 연결 동작 | 분석 이벤트 `track()`(Android 번들은 분석 비활성), 코치 인터뷰 `mailto:` 링크 |

충돌: product-plan의 미정 항목(무료 수량·가격·슬롯 단위·구독 여부)과 preview 무제한 보관 정책. 특히 "무료 계정: 팀 1개 · 전술 문서 5개"는 현재 preview 동작과도 다르다. **Codex 요청**: Android preview에서 칩을 숨길지, 가격 문구를 "미정"으로 바꿀지, 테스트 계약을 바꿀지 결정. 결정 전 UI는 문구를 바꾸지 않는다.

## 7. 미검증 / 남은 위험

- 실제 Android: 터치·소프트 키보드(`enterkeyhint="done"`, 입력칸 가림), TalkBack, 하드웨어 뒤로가기 실동작, SAF 저장·OS 공유 실제 결과, 햇빛 가독성. 위 결과는 Chromium 에뮬레이션과 가짜 native 어댑터 기준이다.
- APK 글꼴: Google Fonts가 제거되어 Oswald/IBM Plex Sans KR 대신 시스템 글꼴. 숫자·탭 폭이 달라질 수 있어 APK 화면 확인 필요.
- 움직임 패턴 캔버스: 선수 이름표 크기는 바꾸지 않았다(캔버스 그리기는 GIF 출력과 공유하는 기능 코드). 360px에서 작게 보인다.
- 긴 이름은 피치에서 말줄임(전체는 선택 트레이·지침 목록에 표시). 5명 이상 한 줄 배치에서 긴 이름표가 서로 가까울 수 있다.
- 기본 undo·삭제 undo는 세션 한 단계(계약 그대로). 재시작 후 복구로 표시하지 않았다.
- 테스트 광고 영역은 native WebView 밖이라 웹 UI에서는 표시·검증하지 않았다.

## 8. Codex 순서 제안

1. 이 브랜치 head를 PR #44 기준과 비교(변경 파일은 1장 목록만).
2. `npm test` 전체 재확인 후 PR #44에 순차 통합.
3. 6장 수요 측정 칩 결정, 5장 실기기 확인.
4. 서명 승인 뒤 APK 설치에서 2·4·7장의 화면(글꼴 대체 포함) 확인.
