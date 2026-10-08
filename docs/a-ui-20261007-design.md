# A 운영 UI (U-01~U-03): 설계

- slug: `a-ui-20261007` · [분석](a-ui-20261007-analysis.md) · [작업](a-ui-20261007-tasks.md)
- 기준 SHA `046f5f60a775abcc05f76143bce919dbf19b56da`, 계약 v2

## 1. 구조

```text
.topbar (A 헤더)        wordmark · 버전 · 도움말 · 제보
#fileBar (편집 전용)     [전술 목록] 팀 › 전술 · 상태(기본/공격/수비) · 저장 칩 · [내보내기·공유]
.app-tabs               배치 | 움직임 패턴 | 매치 전략
#saveStatus             평상시 숨김(스크린리더 상태는 유지), 오류·차단·파일 없음일 때 경고 띠 + 다시 저장·백업
main .layout
  .pane-field (모바일 1열, 데스크톱 고정 왼쪽)
    기본/공격/수비 · 포메이션 · 배치 초기화
    #fieldWrapper (피치)
    #playerActions (선택 시 선수 도구. 모바일은 하단 고정)
  .pane-side
    팀 설정 · 움직임 패턴 패널 · 선수 추가 · 지침
    #exportPanel [aria-label="공유 및 파일"] 이미지 / GIF / 링크·텍스트 / 백업
    출시 준비 중(수요 측정)
#librarySheet (dialog)   팀 선택 · 전술 파일 목록 · 새 전술 · 이름 변경 · 삭제 · 삭제 되돌리기 · 보관 현황
```

`#exportPanel`은 같은 DOM을 두 방식으로 보인다. 평소에는 오른쪽(모바일은 아래) 카드이고, 헤더 버튼으로 열면 하단 시트(`.as-sheet`)가 된다. 이렇게 하면 버튼과 기능 호출이 한 곳에만 존재한다.

## 2. 계약 연결

| UI | 계약 / 기존 함수 | 표시 |
|---|---|---|
| 부팅 잠금 | `ready()`, `state.ready` | `body.ui-booting`: 피치 위 "기기 저장소를 여는 중" |
| 저장 칩 | `state.storage.status` | idle/pending/saving → "저장 중", saved → "기기에 저장됨", error → "저장 실패", blocked → "저장 중단", no-file → "보관된 전술 없음", read-only → 숨김 |
| 오류 띠 | `#saveStatus`(기존 문구) + `#retrySaveBtn`(기존) | 새 "백업 파일 저장" → `run('export-sq')`, blocked일 때 "백업에서 복원" → 기존 파일 입력 |
| 헤더 이름 | `localLibrary.teams/items`, `snapshot.squad` | 팀 › 전술 · 상태. 이름 변경·파일 열기 즉시 갱신 |
| 전술 목록 | `create-team`, `create-file`, `rename-file`, `rename-team`, `open-file`, `delete-file`, `undo-delete` | 확인창은 기능 코드(`uiConfirm`)가 띄운다. 결과 코드를 문장으로 표시 |
| 보관 현황 | `localLibrary.slots` | `policy:'preview-unlimited'`면 "미리보기 빌드는 보관 개수를 제한하지 않습니다. 무료 수량은 아직 정해지지 않았습니다." 숫자 한도는 "테스트 정책"으로만 표시 |
| 내보내기 | `run('export-png'|'export-gif'|'export-sq', {destination})`, `share-url`은 기존 공유 모달 | 처리 중·성공(`download-requested`/`file-saved`/`share-sheet-finished`)·취소·실패·`native-unavailable` 문장. OS 공유 버튼은 `platform.native`일 때만 |
| 선수 도구 | 기존 `#playerActions` 버튼 | 현재 상태 이름(기본/공격/수비)을 함께 표시 |
| 뒤로가기 | `window.SquadUi.closeTopLayer()` | 색상 메뉴 → 화살표 팝오버 → 내보내기 시트 → 전술 목록 → 수요 측정 모달 순서로 하나만 닫고 true. 선택은 지우지 않음 |

기능 코드는 바꾸지 않는다. 예외로 정적 마크업 문구(탭 이름 등)와 버튼 배치만 바꾼다. 내보내기 결과는 `squad-maker:result` 이벤트를 구독해 표시한다.

## 3. 시각 규칙 (A 이어받기)

- 색: 기존 `:root` 팔레트(차콜 그린, 라임 강조) 유지. 라임은 주 행동(내보내기·공유, 새 전술, 선택 링)에만 쓴다. 활성 탭은 밝은 초크 바탕, 파괴적 행동은 빨간 글자와 테두리.
- 글꼴: 숫자·워드마크 Oswald, 본문 IBM Plex Sans KR(웹 Google Fonts). Android 번들은 Google Fonts를 제거하므로 `Noto Sans KR`/시스템 글꼴로 대체되며, 레이아웃은 대체 글꼴 기준으로도 맞춘다.
- 크기: 본문·입력 16px, 보조 14px, 주요 터치 영역 48px.
- 피치: 이름표는 짙은 반투명 바탕 위 흰 글자. 화면 기준 이름 12px 이상, 토큰 지름 36px 이상, 탭 영역 48px. 골키퍼 이름표는 골라인과 겹치지 않게 토큰 옆에 둔다.
- 모서리: 버튼·입력 10px, 카드·시트 16px, 토큰·칩 원형.

## 4. 반응형

- ≤760px: 1열. 헤더 2줄 이하, 피치 폭 = 화면 폭 - 좌우 여백. 선수 도구는 화면 하단 고정 트레이. 움직임 패턴 패널은 "패턴 선택 → 단계 이동+재생 → 단계 편집 → GIF" 4줄로 접고 재생 버튼을 단계 이동과 같은 줄에 고정한다.
- ≥1024px: 2열. 왼쪽 고정 영역의 피치 폭을 화면 높이에 맞춰(헤더·탭·도구 높이 제외) 1366×768에서 피치와 선수 도구가 함께 보인다.

## 5. 접근성

- 시트는 `role="dialog" aria-modal="true"`, 열 때 첫 항목, 닫을 때 연 버튼으로 포커스 복귀. Tab 순환, Esc 닫기.
- 저장 칩·내보내기 결과는 `role="status"`. 오류 띠는 기존 `#saveStatus` 상태 영역.
- 큰 글자: rem/em 기반, 버튼 줄은 줄바꿈 허용, 고정 높이 텍스트 상자 없음.
- `prefers-reduced-motion`: 시트 이동 효과 제거.

## 6. 검증 전략

- 회귀: `npm test`(단위 + Android 번들 + Playwright 2 viewport) 기준선과 비교.
- 화면: Playwright Chromium으로 360×800, 390×844, 412×915(터치 에뮬레이션)와 1366×768, 1440×900 캡처. 가로 넘침·피치/도구 동시 노출·재생 버튼 경계·대비·48px·포커스를 스크립트로 측정. 긴 이름(12자), 루트 글자 크기 200%, 키보드만 사용, reduced-motion.
- 계약 흐름: 목록 열기·닫기 전후 `getState()`의 선택·패턴·revision 비교, 저장 실패 주입 후 띠·재시도, 내보내기 취소(native fake)·실패 표시.
- 실제 Android·TalkBack은 검증하지 않으며 그렇게 보고하지 않는다.
