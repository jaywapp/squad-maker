# ⚽ 스쿼드 메이커

축구 포메이션을 짜고 전술 지침을 작성하며, 공격 패턴을 GIF로 만들어 팀원과 공유하는 싱글-파일 웹앱입니다.

- **작성**: PC·태블릿 큰 화면에 최적화된 2패널 편집 화면 (모바일 작성도 지원)
- **열람**: 공유 링크로 열면 모바일 친화적인 **읽기 전용 뷰어 모드**

**🔗 [라이브 데모](https://squad-maker.vercel.app/)**

---

## 주요 기능

### ⚽ 스쿼드 편집
- **5~11인제 전 지원** — 5v5 · 6v6 · 7v7 · 8v8 · 9v9 · 10v10 · 11v11
- **3개 스쿼드** — 기본 / 공격 / 수비 스쿼드를 탭으로 독립 관리
- **포메이션 선택** — 모드별 다양한 프리셋 (예: 4-3-3, 3-5-2 등)
- **자유 배치** — 선수를 드래그(마우스/터치)해 원하는 위치로 이동
- **이름 수정** — 더블클릭 인라인 편집
- **색상 변경** — 우클릭 → 10가지 색상 선택
- **이미지 저장** — PNG로 내보내기 (팀명 + 스쿼드 + 포메이션 정보 포함)

### 🎯 전술 패턴 모드
- **다단계 시퀀스** — 약속된 움직임을 단계(1단계 → 2단계 → …)로 나눠 순서대로 재생
- **경로 그리기** — 선수를 클릭-드래그해 단계별 이동 경로(화살표) 설정
- **공(볼) 움직임** — 공을 드래그해 패스·드리블 경로 설정, 선수 위에 놓으면 침투 위치로 스냅
- **경로 삭제** — 화살표를 우클릭해 개별 삭제
- **패턴 관리** — 여러 패턴을 이름 지정 후 저장, 이전/다음 탐색
- **애니메이션 미리보기** — 단계별 ease-in-out 연속 재생, 자동 루프
- **GIF 저장**
  - 단일 패턴 GIF (모든 단계 포함)
  - 전체 패턴 연속 GIF (패턴 이름·단계 레이블 포함)

### 📋 매치 전략
- **매치 정보 입력** — 상대팀, 일시, 감독 메모
- **스쿼드 요약** — 현재 스쿼드 구성·공격 패턴 현황 확인
- **전술 지침서 자동 생성** — 포메이션·배치·패턴 기반 규칙 생성, 복사/텍스트 저장

### 📝 전술 지침
- **팀 전체 지침** — 스쿼드별 공통 메시지 작성
- **개별 선수 지침** — 선수마다 개인 지침 입력
- **선수 시점 보기** — 특정 선수 기준으로 위치·지침을 미니맵 + 카드로 확인

### 📤 공유
- **단톡방 공유 텍스트** — 카카오톡 등에 붙여넣기 가능한 텍스트 자동 생성
- **URL 공유** — 스쿼드 전체 상태를 URL에 인코딩해 링크로 공유
- **뷰어 모드** — 공유 링크로 진입하면 편집 UI 없는 열람 전용 화면(스쿼드·패턴 재생·지침 확인, 열람자의 기존 로컬 데이터 보존). "내 스쿼드로 가져오기"로 명시적 저장 가능
- **파일 저장/불러오기** — `.sq` 형식(JSON)으로 스쿼드 저장 및 복원

### 💾 자동 저장
- 브라우저 LocalStorage에 자동 저장 — 새로고침 후에도 마지막 상태 유지

---

## 사용법

### 스쿼드 모드

| 동작 | 기능 |
|------|------|
| 드래그 | 선수 위치 이동 |
| 더블클릭 (PC) | 이름 수정 |
| 우클릭 (PC) / 길게 누르기 (터치) | 색상 변경 / 이름 변경 / 삭제 / 선수 시점 보기 |
| `+ 선수 추가` | 선수 추가 (모드별 최대 인원) |
| `↺ 초기화` | 포메이션 기본 배치로 리셋 |
| `이미지 저장` | PNG 다운로드 |
| `단톡방 공유 텍스트 생성` | 전술 텍스트 + URL 공유 |
| `선수 시점 보기` | 선수별 포지션·지침 모달 |
| `파일 저장` | `.sq` 파일 다운로드 |
| `파일 불러오기` | `.sq` 파일 복원 |

### 전술 패턴 모드

| 동작 | 기능 |
|------|------|
| 선수 클릭-드래그 | 현재 단계의 이동 경로 설정 |
| 공 클릭-드래그 | 현재 단계의 공 이동(패스) 설정 |
| 공 살짝 끌기 | 공 시작 위치 재배치 |
| 화살표 클릭/탭 또는 우클릭 | 해당 경로 삭제 |
| `◀ 단계 ▶` / `+ 단계` / `단계 삭제` | 단계 탐색·추가·삭제 |
| `미리보기` | 전체 단계 연속 재생/일시정지 |
| `↺ 단계 초기화` | 현재 단계 경로 전체 삭제 |
| `GIF 저장` | 현재 패턴 GIF 다운로드 |
| `전체 패턴 GIF` | 모든 패턴 연속 GIF 다운로드 |

---

## 포메이션 목록

| 모드 | 포메이션 |
|------|---------|
| 5v5  | 2-2 / 1-2-1 / 2-1-1 |
| 6v6  | 2-2-1 / 3-2 / 2-3 / 1-3-1 |
| 7v7  | 3-2-1 / 2-3-1 / 2-2-2 / 3-3 |
| 8v8  | 3-3-1 / 3-2-2 / 2-3-2 / 4-3 |
| 9v9  | 3-3-2 / 3-2-3 / 4-3-1 / 2-4-2 / 3-4-1 |
| 10v10 | 4-4-1 / 4-3-2 / 3-4-2 / 3-5-1 |
| 11v11 | 4-4-2 / 4-3-3 / 3-5-2 / 4-2-3-1 / 5-3-2 / 3-4-3 |

---

## 기술 스택

- **순수 HTML / CSS / JavaScript** — 빌드 도구 없음, 단일 파일(`index.html`)로 실행
- **[html2canvas](https://html2canvas.hertzen.com/)** — PNG 이미지 내보내기 (CDN)
- **[gif.js](https://jnordberg.github.io/gif.js/)** — 브라우저 기반 GIF 인코딩 (CDN)
- **Vercel** — 정적 호스팅 및 GitHub Issues `제보` 중계 함수

---

## 로컬 실행

별도 설치 없이 `index.html`을 브라우저에서 열면 바로 사용 가능합니다.

```bash
git clone https://github.com/jaywapp/squad-maker.git
cd squad-maker
# index.html을 브라우저로 열기
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

> GIF 내보내기는 CDN에서 gif.js 워커를 불러오므로 인터넷 연결이 필요합니다.

---

## 🛠 개발 현황 (AI/개발 세션용, 2026-07-24 기준)

> 다음 작업 세션이 프로젝트 컨텍스트를 빠르게 파악하기 위한 섹션입니다.

### 아키텍처

- **단일 파일 `index.html`** (~3,800줄): CSS + HTML + vanilla JS, 빌드 도구 없음
- **상태 모델**
  - `roster` — 전 스쿼드 공유 명단 `[{id, name(≤12자), color}]`
  - `squads[basic|attack|defense]` — `{formation, positions:{id:{x,y}}, teamNote, playerNotes:{id:text}}`
  - `patterns` — 전술 패턴 `[{name(≤20자), ballStart:{x,y}, steps:[{moves:{id:{toX,toY}}, ball:{toX,toY}|null}]}]`
    (단계 N 시작 위치 = 단계 N-1 종료 위치 누적, 1단계 시작 = 현재 스쿼드 배치)
- **좌표계 480×660 고정** — 렌더링만 반응형: `#field`는 `transform: scale(s)`, `#patternCanvas`는 백킹 스토어를 `s×dpr`로 재설정(`applyFieldScale()`). HTML 드래그는 델타를 `dragState.sc`로 나눠 보정. PNG 캡처 시 스케일 임시 해제
- **앱 모드 3개**: `squad` / `pattern` / `strategy` — `setAppMode()`가 `.app-squad-only`·`body.mode-*` 클래스와 개별 요소 표시를 토글
- **뷰어 모드**: `#s=` 진입 시 `viewerMode=true` + `body.viewer-mode` — `.editor-only` 숨김/`.viewer-only` 표시, autoSave·드래그·편집 차단(열람자 localStorage 보존), `importSharedSquad()`로 명시적 가져오기
- **레이아웃**: ≥1024px에서 `.layout` 2패널(`.pane-field` sticky 필드 최대 640px / `.pane-side` 컨트롤·지침), 미만은 세로 스택
- **테마**: `:root` CSS 변수(전술 보드 팔레트 — `--bg/--surface/--accent(라임)/--pitch` 등), UI 라벨 이모지 없음(공유 텍스트·내보내기 이미지에는 유지), 네이티브 `alert/confirm/prompt` 금지 — `uiConfirm()`/`showToast()` 사용
- **영속화**: localStorage(`squad-maker-v1`) · 공유 URL `#s=`(URL-safe base64) · `.sq` JSON — 모두 `buildStateSnap()`/`restoreState()` 경유, 스냅샷 버전 `v:1`
  - 복원 데이터는 반드시 `sanitizeRoster()`/`sanitizePatterns()`로 정규화 (XSS·크래시 방어). 구형 단일 화살표 패턴 `{n,m}`은 1단계 패턴으로 자동 마이그레이션
- **외부 의존(CDN)**: html2canvas(PNG 저장, 제작자 도메인), gif.js 0.2.0 + worker(cdnjs, GIF 인코딩), Google Fonts Oswald(워드마크, swap 폴백)

### 배포

- Vercel — `main` 브랜치 push 시 GitHub Actions가 테스트 후 prebuilt production 배포
- 배포에는 GitHub Secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`가 필요합니다.
- 제보 중계에는 Vercel 환경 변수 `GITHUB_ISSUES_TOKEN`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`가 필요합니다. 허용할 추가 출처는 `FEEDBACK_ALLOWED_ORIGINS`에 쉼표로 구분합니다.
- Vercel Git Integration과 Actions가 같은 커밋을 중복 배포하지 않도록 Git Integration의 production 자동 배포를 비활성화합니다.

### 검증 방법

1. **회귀 계약 (필수, 배포 차단)** — 외부 네트워크 없이 결정적으로 통과해야 한다:
   ```bash
   npm install          # 최초 1회
   npx playwright install chromium   # 최초 1회
   npm test             # 390px·1280px 두 뷰포트로 실행
   ```
   | 스펙 | 고정하는 계약 |
   |---|---|
   | `guest-free-regression` | 편집·자동 저장, PNG/GIF 내보내기, 패턴 추가, `#s=` 뷰어, `.sq` 왕복, 공유 링크 열람 시 LocalStorage 보존 |
   | `analytics-events` | 이벤트 화이트리스트, once 중복 금지, 분석 비활성 시 무전송 |
   | `analytics-payload` | 실제 Umami로 나가는 최종 본문에 `#s=`·이름·지침 0건, 로드 지연·실패 시 큐 동작 |
   | `interest-previews` | 수요 측정 진입점 노출·이벤트 구분, 뷰어 모드 비노출 |
   | `beta-ui` | 도움말·의견 창구·버전 표시, 의견 폼 폴백, 진단 정보에 개인정보 미포함 |

   - `v:1` 스냅샷 계약 픽스처: `tests/fixtures/snapshot-v1.json`
   - html2canvas·gif.js·Umami는 `tests/vendor`의 고정 버전을 route로 주입하고 그 외 외부
     요청은 전부 차단한다 — 실제 라이브러리가 실행되므로 스텁이 아니다
2. **CDN 가용성 smoke (선택)** — 실패는 앱 회귀가 아니라 공급자·네트워크 문제:
   ```bash
   npm run test:cdn
   ```
3. 인라인 스크립트 추출 후 `node --check` 구문 검증
4. claude-in-chrome 확장이 연결되어 있으면 실브라우저 검증 우선

### 최근 작업

| 상태 | 내용 |
|---|---|
| [#25](https://github.com/jaywapp/squad-maker/pull/25) | XSS 수정(escHtml 따옴표 이스케이프 + sanitize), 복원 로직 단일화(`restoreState`+`refreshUI`), og-image 추가 |
| [#26](https://github.com/jaywapp/squad-maker/pull/26) | 공격 패턴 에디터·GIF·매치 전략 탭을 현 구조로 재이식 (구 feature 브랜치 3개는 이식 후 삭제) |
| [#27](https://github.com/jaywapp/squad-maker/pull/27) | 다단계 전술 패턴 + 공 이동/패스 스냅 (설계: `docs/superpowers/specs/2026-07-18-multi-step-tactical-patterns-design.md`) |
| [#29](https://github.com/jaywapp/squad-maker/pull/29) | 반응형 UX 개편: 필드 스케일링·뷰어 모드·2패널·전술 보드 테마·터치 패리티 |
| [#30](https://github.com/jaywapp/squad-maker/pull/30) | 편집 안전성과 접근성 개선 |
| [#31](https://github.com/jaywapp/squad-maker/pull/31) | 수익화 0단계 측정 기반과 클로즈드 베타 운영 도구. 분석 P1 수정과 결정적 회귀 테스트까지 `main` 반영 |
| 배포 표준화 브랜치 | GitHub Actions 기반 Vercel 배포와 GitHub Issues `제보` 중계 구현. 현재 `agent/project-delivery-standard-20260724`에서 검증·PR 대기 |

- 병합된 기능 브랜치는 PR 스쿼시 머지 후 삭제하고 `main`만 유지한다.

### 남은 후보 과제

- [ ] 배포 표준화 브랜치 검증 후 PR
- [ ] Umami 웹사이트 ID 설정 후 4주 측정·코치 인터뷰·Gate A 판정
- [ ] html2canvas를 제작자 개인 도메인 CDN에서 로드 중 → cdnjs + SRI로 하드닝 권장
- [ ] 광고 삽입 계획 실행: `docs/ad-placement.md` (일부 라인 참조는 구식 — 적용 전 재확인)

### 컨벤션

- 커밋: conventional commits(영어) / UI 텍스트·문서: 한국어
- `main` 직접 커밋 금지 — feature 브랜치 + PR(스쿼시 머지)
- 복원(외부 입력) 경로에 새 필드를 추가할 때는 반드시 sanitize 함수에 검증 추가
