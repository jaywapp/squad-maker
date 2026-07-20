# 수익화 0단계 구현 작업 기록

- 작업일: 2026-07-20
- 브랜치: `codex/monetization-strategy` (기준점 `8f1d0cb`, 아직 push 안 함)
- 기준 문서: [수익화 적용 계획서](./2026-07-20-monetization-implementation-plan.md)
- 범위: 계획서 §14 "첫 실행 묶음" 중 **코드로 구현 가능한 0단계 전부**
- 리뷰: [작업 로그 리뷰 피드백](./2026-07-20-monetization-stage0-worklog-feedback.md) — P1 2건 수정 완료
- 결과: Playwright 51건 통과(외부 네트워크 차단 상태), 워킹 트리 클린

---

## 1. 이번 작업에서 한 것 / 하지 않은 것

### 한 것

| 계획서 태스크 | 산출물 |
|---|---|
| Task 0.1 — Guest 회귀 계약 고정 | Playwright e2e 스위트 + `v:1` 스냅샷 픽스처 + README 검증 절차 |
| Task 0.2 — 분석 어댑터와 이벤트 사전 | `track()` 어댑터 + 이벤트 사전 + ADR 0001 + 계약 검증 e2e |
| Task 0.3 — 설명형 수요 측정 UI | 3개 진입점 + 사전 안내 모달 + 코치 인터뷰 스크립트 + 검증 e2e |

### 의도적으로 하지 않은 것

- **인증·클라우드 DB·결제 관련 코드 일절 없음** — 계획서 §14에 따라 Gate A 승인 전 착수 금지.
- **기존 무료 기능 수정 없음** — 계획서 §2.1 무료 기능 불변 조건을 회귀 테스트로 고정한 뒤,
  이후 커밋이 그 계약을 깨지 않는지 매번 확인하는 순서로 진행했다.
- **push·PR 생성 안 함** — 전역 규칙(사용자 명시 요청 전 push 금지)에 따름.

---

## 2. 커밋별 상세

계획서 §12의 PR 분할 원칙(인증·마이그레이션·결제를 한 PR에 묶지 않음, 각 커밋 독립 롤백 가능)을 따랐다.

### `4b3d7ae` docs: add monetization strategy, feedback, and implementation plan

미추적 상태로 남아 있던 문서 3건을 브랜치에 커밋했다.

- `docs/2026-07-18-monetization-strategy.md`
- `docs/2026-07-18-monetization-strategy-feedback.md`
- `docs/2026-07-20-monetization-implementation-plan.md`

### `e7f6288` test: lock guest monetization regression contract

수익화 작업이 기존 무료 경험을 깨는 순간 빌드가 실패하도록, **배포 차단 테스트**를 먼저 만들었다.

**추가 파일**

- `package.json` — Playwright + http-server (devDependencies만, 런타임 의존성 없음)
- `playwright.config.js` — `desktop-1280` / `mobile-390` 두 프로젝트, http-server 자동 기동
- `tests/fixtures/snapshot-v1.json` — `v:1` 스냅샷 계약 픽스처 (roster 3명, 2단계 패턴 포함)
- `tests/e2e/guest-free-regression.spec.js` — 10개 테스트
- `.gitignore` — `node_modules/`, `test-results/`, `playwright-report/` 추가
- `README.md` — 검증 방법 섹션에 실행 절차 추가

**검증 범위** (계획서 §2.1·§2.2 대응)

| 테스트 | 고정하는 계약 |
|---|---|
| 앱 로드 + pageerror 0건 | 편집 모드 진입, 스크립트 오류 없음 |
| LocalStorage `v:1` 복원 | 기존 `squad-maker-v1` 데이터 호환 |
| 편집 → `v:1` 자동 저장 | 저장 스냅샷 버전·구조 불변 |
| PNG 내보내기 | html2canvas 경로 동작 |
| 패턴 추가 + 단일 GIF | gif.js 경로 + 진행 오버레이 정상 종료 |
| 전체 패턴 GIF | 데스크톱에서만 실행(인코딩 시간 절약) |
| `#s=` 공유 URL 뷰어 진입 | 기존 공유 링크 계속 열림, 편집 UI 숨김 |
| 뷰어 선수 시점 보기 | 비회원 열람 기능 유지 |
| **공유 링크 열람 시 LocalStorage 불변** | 열람자의 기존 로컬 데이터 보존 (autoSave 디바운스 초과 대기 후 원문 비교) |
| `.sq` 저장 → 상태 변경 → 재로드 | 파일 왕복이 데이터를 보존 |

> 초안에서는 `.sq` 재로드 검증을 "LocalStorage를 지우고 새로고침 → 빈 상태"로 잡았는데,
> 앱이 저장본 없이 뜨면 기본 스쿼드를 만들어 자동 저장하므로 팀명이 비지 않았다.
> "상태를 바꾼 뒤 같은 파일을 불러와 원본으로 돌아오는지" 확인하는 방식으로 수정했다.

### `1347086` feat: add privacy-safe product analytics

**추가·수정 파일**

- `index.html` — `track()` 어댑터 + 이벤트 연결 지점
- `docs/adr/0001-analytics-provider.md`
- `docs/analytics-event-dictionary.md`
- `tests/e2e/analytics-events.spec.js` — 6개 테스트

**ADR 0001 결정: Umami Cloud (Hobby 무료 티어)**

| 기준 | Plausible Cloud | **Umami Cloud** | Umami 자체 호스팅 |
|---|---|---|---|
| 비용 | 월 €9~ | **무료 (월 100k 이벤트)** | 서버·DB + 관리 시간 |
| 운영 부담 | 없음 | 없음 | 직접 부담 |
| 데이터 위치 | EU | 미국 | 선택 가능 |
| 동의 배너 | 불필요 | 불필요 | 불필요 |

0단계는 수익 0원이므로 지출 없이 측정을 시작하는 것을 우선했다. 데이터 위치(미국)는
개인정보를 보내지 않는 설계라 수용 가능하며, 1단계에서 계정·개인정보를 다루기 시작하면
`docs/privacy-data-map.md`(Task 1.1)에서 재평가한다. 도구 종속을 피하려고 앱 코드는
`track(name, properties)` 하나만 호출하므로, 교체 시 어댑터 내부와 스크립트 태그만 바꾸면 된다.

> ⚠️ **이 커밋 시점의 설계에는 결함이 있었다.** 아래 "화이트리스트가 구조적으로 강제한다"는
> 설명은 **어댑터가 넘기는 속성에 대해서만** 참이었다. Umami가 payload에 자동으로 붙이는
> `url`에 `#s=` 공유 스냅샷이 그대로 포함되는 문제를 놓쳤다. §7에서 수정 내용을 다룬다.

**개인정보 보호 설계 (계획서 §9 금지 값 목록을 구조적으로 강제)**

```
ANALYTICS_EVENTS = { 이벤트명: [허용 속성 키...] }
```

- 사전에 없는 **이벤트 이름**은 전송하지 않고 폐기한다.
- 사전에 없는 **속성 키**는 페이로드 구성 시 아예 복사되지 않는다.
  실수로 `{name: '김선수', url: '#s=...'}`를 넘겨도 payload에 들어갈 수 없다.
- 속성 값은 문자열 변환 후 40자로 자른다(긴 콘텐츠 혼입 방지).
- `websiteId`가 비어 있으면 스크립트를 로드하지 않고 아무것도 보내지 않는다 —
  계획서 §10.1의 `analytics` 기능 플래그 역할.
- 모든 전송은 `try/catch` + optional chaining — 스크립트 차단·장애가 앱을 방해하지 않는다.
- localhost에서는 전송 대신 `console.debug('[analytics]', ...)` — 개발 중 이벤트 검증용.

**연결된 0단계 이벤트**

| 이벤트 | 발생 지점 | once |
|---|---|:---:|
| `squad_started` | `autoSave()` — 단, INIT 완료 후(`_appReady`)의 첫 호출만 | ✔ |
| `squad_completed` | 결과물 산출(PNG·GIF·공유 생성) 중 첫 행동 | ✔ |
| `image_exported` | `saveImage()` 성공·실패 양쪽 | |
| `gif_exported` | `exportGif()` finished (`single`/`all` 구분) | |
| `share_link_created` | `openShare()`(text) / `copyShareUrl()`(public_url) | |
| `share_link_opened` | `#s=` 뷰어 진입 | ✔ |
| `cloud_save_interest_clicked` 외 2건 | 수요 측정 진입점 클릭 (Task 0.3) | |

> `squad_completed`는 "스쿼드 작성 완료"를 직접 알 수 없으므로 **결과물 산출 행동**을 대리 지표로 정의했다.
> 이 정의는 이벤트 사전에 명시해 두어, 나중에 퍼널을 해석할 때 오해가 없도록 했다.
>
> `_appReady` 플래그가 필요했던 이유: 앱 초기화(`initAllSquads`)와 저장본 복원도 `autoSave()`를
> 호출하므로, 그대로 두면 **페이지를 열기만 해도** `squad_started`가 찍혀 "실제 편집" 신호가 오염된다.

**계약 검증 e2e** — 문서에 적힌 규칙을 테스트로 고정했다.

- `squad_started`가 여러 번 편집해도 1회만 발생
- 페이지 로드·복원만으로는 `squad_started` 미발생 (위 오염 방지의 회귀 테스트)
- `share_link_created` 매번 / `squad_completed` 1회만
- `#s=` 진입 시 `share_link_opened` 1회
- 화이트리스트 밖 속성·미등록 이벤트 폐기
- `websiteId` 미설정 시 분석 네트워크 요청 0건 + 앱 정상 동작

### `c547a53` feat: add monetization interest previews

**추가·수정 파일**

- `index.html` — 진입점 3개, 안내 모달, `openInterestPreview()` 로직, `.interest-*` 스타일
- `docs/research/coach-interview-script.md`
- `tests/e2e/interest-previews.spec.js` — 4개 테스트

**설계 원칙: 기능을 약속하지 않고 관심만 측정한다**

계획서 §2.1(무료 기능 불변)과 Task 0.3의 "정직하게 알린다"를 지키기 위해:

- 기존 무료 버튼은 하나도 바꾸지 않았다. `출시 준비 중` 라벨이 붙은 **별도 섹션**에 칩 3개를 추가했다.
- 모달은 클릭 즉시 세 가지를 고지한다 —
  ① 아직 출시 전이며 어떤 기능부터 만들지 결정하려 관심을 측정 중,
  ② 지금 쓰는 무료 기능은 그대로 무료 유지,
  ③ 예상 가격(월 6,900원)과 무료/Pro 한도.
- 인터뷰 참여는 `mailto:` 링크로 **별도 명시적 동의** 후에만 이루어지며,
  "이메일은 인터뷰 연락에만 쓰고 분석 데이터에 포함하지 않는다"를 화면에 명시했다.
- 뷰어 모드(`.editor-only`)에서는 노출되지 않는다 — 공유받은 선수에게 판촉 요소를 보이지 않는다.

**진입점과 이벤트 매핑**

| 진입점 위치 | `source` 속성 | 기능 |
|---|---|---|
| 스쿼드 모드 공유 도구 아래 | `share_toolbar` | 클라우드 저장 / 고급 영상 / 선수별 브리핑 |
| 패턴 모드 GIF 버튼 옆 | `pattern_controls` | 고급 영상 |

`source`를 분리해 두어 Gate A에서 **어느 맥락의 사용자가 어떤 기능에 반응하는지**
구분해 볼 수 있다(GIF를 뽑는 중인 사용자 vs 공유하려는 사용자).

**코치 인터뷰 스크립트** — Gate A의 "5~8명 중 3명 이상 구체적 결제 의향" 판정을 위한 진행 대본.

- 3부 구성: 현재 워크플로우와 불편 → 후보 기능 반응(순서 무작위화) → 가격·결제 주체
- 유도 질문 금지, 가격은 마지막에, 가치를 스스로 말하게 한다
- 기록 템플릿은 이름·팀명·연락처를 남기지 않는 익명 요약 형식
- **집계 기준 명시**: "좋네요, 쓸 것 같아요"는 의향으로 세지 않는다.
  **누가, 어떤 돈으로, 언제**가 나온 경우만 센다.

---

## 3. 검증 결과

### 최초 구현 시점 (커밋 `c547a53`)

| 환경 | 결과 |
|---|---|
| 구현자 환경 | `39 passed (41.3s)`, 1 skipped |
| 독립 검토 환경 | 비-CDN 대상 20건 통과, PNG·GIF는 CDN 접근 제한으로 타임아웃, 서버 종료 지연 |

두 결과 모두 사실이다. 검토 환경의 실패는 앱 결함이 아니라 **외부 CDN 접근 차단** 때문이었고,
이는 배포 차단 테스트가 네트워크 조건에 따라 흔들린다는 실제 문제를 드러냈다(§7 P2-1에서 수정).

### P1·P2 수정 후 (현재)

```
npm test
```

```
1 skipped
51 passed (52.0s)
```

- **외부 네트워크를 전면 차단한 상태**에서 통과한다. html2canvas·gif.js·Umami는
  `tests/vendor`의 고정 버전을 route로 주입하고, 그 외 모든 외부 요청은 abort된다.
- 스킵 1건은 모바일 프로젝트의 "전체 패턴 GIF"(인코딩 시간 절약, 데스크톱에서만 실행).
- 실행 후 포트 4317에 LISTENING 소켓이 남지 않는 것을 확인했다(TIME_WAIT는 정상 잔여).
- 실제 CDN 가용성은 `npm run test:cdn`으로 분리 확인 — 4건 통과.
- 헤드리스 브라우저 스크린샷으로 진입점·모달이 기존 전술 보드 테마(다크 그린, 라임 액센트)와
  일관되는지, 모바일 터치 타깃 44px가 확보되는지 확인했다.

---

## 4. 파일 변경 요약

```
docs/
  2026-07-18-monetization-strategy.md            (커밋)
  2026-07-18-monetization-strategy-feedback.md   (커밋)
  2026-07-20-monetization-implementation-plan.md (커밋)
  2026-07-20-monetization-stage0-worklog.md      (이 문서)
  2026-07-20-monetization-stage0-worklog-feedback.md (리뷰)
  analytics-event-dictionary.md                  (신규)
  adr/0001-analytics-provider.md                 (신규)
  research/coach-interview-script.md             (신규)
tests/
  e2e/guest-free-regression.spec.js              (신규, 10 tests)
  e2e/analytics-events.spec.js                   (신규, 6 tests)
  e2e/analytics-payload.spec.js                  (리뷰 대응, 6 tests)
  e2e/interest-previews.spec.js                  (신규, 4 tests)
  e2e/cdn-smoke.spec.js                          (리뷰 대응, opt-in 4 tests)
  helpers/stub-cdn.js                            (리뷰 대응)
  vendor/                                        (리뷰 대응: 고정 버전 CDN 자산)
  fixtures/snapshot-v1.json                      (신규)
index.html                                       (수정: 분석 어댑터, 수요 측정 UI)
package.json / package-lock.json                 (신규)
playwright.config.js / playwright.cdn.config.js  (신규)
README.md                                        (수정: 검증 방법)
.gitignore                                       (수정: node_modules, test-results)
```

`index.html` 수정은 **추가만** 있고 기존 무료 기능 로직은 건드리지 않았다
(내보내기·공유 함수에 `track()` 호출 한 줄씩 삽입한 것이 전부).

---

## 5. 다음 단계

### 사용자 결정·행동이 필요한 항목

1. **push와 PR 생성** — 전역 규칙에 따라 명시 요청 전까지 push하지 않았다.
   요청 시 `codex/monetization-strategy` → `main` PR을 생성한다.
2. **Umami 웹사이트 등록** — `cloud.umami.is`에서 사이트를 만들고 발급된 ID를
   `window.SQUAD_MAKER_ANALYTICS_ID`로 주입하거나 `ANALYTICS_CFG.websiteId`에 넣어야
   측정이 시작된다. (현재는 비어 있어 안전하게 비활성 상태)
3. **개인정보 처리 문서화** — 활성화 전에 `docs/privacy-data-map.md`에 수집 항목·목적·
   보유기간·처리 국가·국외 이전을 기록하고, 실제 payload를 캡처해 대조한다(ADR 0001).
4. **4주 측정 + 코치 5~8명 인터뷰** — 사람이 해야 하는 활동.
5. **Gate A 회의록 작성 및 판정.**

### Gate A 통과 조건 (계획서 §7.1 재확인)

- [ ] 측정 오류율 5% 미만, 4주 또는 완성 세션 200건 이상 데이터
- [ ] 활성 제작자의 10% 이상이 유료 후보 기능 중 하나를 확인
- [ ] 인터뷰 5~8건 중 3명 이상이 월 6,900원 수준의 구체적 결제 의향·예산 승인 경로 설명
- [ ] Pro 25명(손익분기) 도달 가능한 현실적 유입 경로 존재

**조건 미충족 시 인증·결제를 만들지 않는다.** 측정 보정, 가치 제안 변경, 유입 확보를 우선한다.

### 1단계 착수 시 첫 작업 (Gate A 통과 후에만)

Task 1.1 — 출시 전 개인정보·기술 결정 (`adr/0002-frontend-modules.md`,
`adr/0003-backend-provider.md`, `privacy-data-map.md`, 개인정보처리방침·이용약관 초안).

---

## 6. 리뷰에서 배운 것

이번 리뷰의 핵심 교훈은 하나로 요약된다.

> **개인정보 경계는 우리가 부르는 함수에서 끝나지 않는다.**
> 서드파티 스크립트가 스스로 덧붙이는 필드까지 포함해야 전송 계약이 완성된다.

초기 구현은 "화이트리스트로 구조적으로 강제한다"고 문서에 적었지만, 실제로 강제한 범위는
**우리가 넘기는 속성**뿐이었다. 분석 도구를 "속성만 조심하면 되는 것"으로 다룬 것이 원인이다.
앞으로 외부 SDK를 붙일 때는 **최종 네트워크 payload를 직접 캡처해서** 계약을 검증한다.
`tests/e2e/analytics-payload.spec.js`가 그 역할을 상시로 맡는다.

부수적으로, "구현자 환경에서 통과했다"는 것만으로 배포 차단 테스트의 신뢰성을 주장할 수
없다는 것도 확인했다. 외부 의존이 있으면 같은 커밋이 환경에 따라 통과·실패한다.

---

## 7. 리뷰 대응 내역

[리뷰 피드백](./2026-07-20-monetization-stage0-worklog-feedback.md)의 지적을 검증하고 수정한 내용이다.

### P1-1 — 분석 URL을 통한 공유 스냅샷 전송 (실재 확인, 수정 완료)

**검증 방법**: Umami 트래커 스크립트(`cloud.umami.is/script.js`) 소스를 직접 확인했다.

```js
// payload 빌더 — 모든 이벤트에 url·referrer가 자동 포함된다
C = () => ({ website:S, screen:R, language:n, title:c.title, hostname:h, url:Y, referrer:Z, ... })

// URL 정규화 — 해시·쿼리는 옵션을 켰을 때만 제거된다 (기본값: 포함)
B = t => { const e = new URL(t, o.href); return j && (e.search=""), N && (e.hash=""), e.toString() }
//   j = data-exclude-search === "true",  N = data-exclude-hash === "true"
```

**재현**: 가드를 제거한 상태로 통합 테스트를 실행해 실제 전송 본문을 캡처했다.
`url` 필드에 `#s=eyJ2IjoxLCJ0ZWFtIjoiRkMg7ZqM6reAIi...`가 그대로 들어갔고,
디코드하면 **팀명·선수명·팀 지침·개인 지침을 포함한 전체 스냅샷**이 나왔다.
이벤트 사전의 "전체 공유 URL과 토큰은 전송하지 않는다" 계약을 정면으로 위반한다.

**수정** — 3중 방어

1. `data-exclude-hash="true"`, `data-exclude-search="true"`
2. `data-before-send` 가드(`window.__squadMakerBeforeSend`)로 `url`은 pathname까지,
   `referrer`는 origin+pathname까지 축약. 정규화 실패 시 `null`을 반환해 전송을 취소한다.
3. `tests/e2e/analytics-payload.spec.js`가 실제 `/api/send` 본문에
   `s=`·스냅샷 조각·팀명·선수명·지침이 0건임을 상시 검증한다.

**리뷰 권고 중 채택하지 않은 항목**: `data-auto-track="false"`.
Gate A의 "활성 제작자의 10% 이상"과 "완성 세션 200건"에는 방문·세션이라는 **분모**가 필요하다.
자동 추적을 끄면 그 분모를 잃는다. 단일 페이지 앱이라 해시·쿼리를 제거하면 경로(`/index.html`)에
콘텐츠가 남지 않으므로, 위 방어와 함께 쓰면 자동 추적을 유지해도 안전하다. ADR에 근거를 기록했다.

### P1-2 — 스크립트 로드 전 이벤트 유실 (실재 확인, 지적보다 심각, 수정 완료)

**검증**: 리뷰는 "경합에 취약하다"고 봤지만 실제로는 **결정적 유실**이었다.
분석 스크립트는 `defer`로 로드되므로 HTML 파싱이 끝난 뒤 실행된다. 반면 INIT 블록은
파싱 중 실행된다. 따라서 `share_link_opened`가 발생하는 시점에 `window.umami`는
**항상** undefined이고, `_trackedOnce`에는 이미 전송 완료로 표시된다.
즉 공유 링크 열람은 사실상 100% 집계되지 않았을 것이다.

**수정**

- 준비 전 이벤트를 `_analyticsQueue`(상한 50건)에 보관하고, `load`에서 발생 순서대로 전달한다.
- `once` 중복 방지는 큐 삽입 기준으로 동작하므로, 로드 전 5회 호출해도 큐에는 1건만 남는다.
- `error`(차단·오프라인) 시 큐를 비우고 재시도하지 않는다 — 앱 동작에는 영향이 없다.

**검증 테스트**: 스크립트 도착을 1.5초 지연시킨 상태에서
초기 `share_link_opened`가 로드 후 정확히 1회 전달되고, 일반 이벤트는 발생 순서대로 도착하며,
로드 실패 시 페이지 오류 0건에 편집·자동 저장이 정상 동작함을 확인한다.

### P2-1 — 배포 차단 테스트의 외부 CDN 의존 (타당, 수정 완료)

리뷰 환경에서 PNG·GIF 테스트가 타임아웃된 것은 앱 결함이 아니라 CDN 접근 차단 때문이었지만,
**배포 차단 테스트가 네트워크 조건에 좌우된다**는 지적 자체는 타당하다.

- `tests/vendor/`에 html2canvas·gif.js·gif.worker·Umami 스크립트를 고정 버전으로 두고
  Playwright route로 주입한다. **스텁이 아니라 실제 라이브러리**이므로 내보내기 경로는 진짜로 실행된다.
- 그 외 모든 외부 요청은 abort한다. 외부 네트워크가 완전히 끊긴 상태에서 통과해야만
  배포 차단 테스트로서 의미가 있다. (부수 효과로 실행 시간이 46초 → 17초로 줄었다.)
- 실제 CDN 가용성은 `npm run test:cdn`(`playwright.cdn.config.js`)으로 분리했다.
  여기서의 실패는 앱 회귀가 아니라 공급자·네트워크 문제로 읽는다.
- webServer를 `npx http-server` 대신 `node node_modules/http-server/bin/http-server`로 바꾸고
  `reuseExistingServer: false`로 설정했다. npx 래퍼를 거치면 Windows에서 손자 프로세스가
  남고, 재사용된 서버는 Playwright가 종료하지 못한다. 실행 후 LISTENING 소켓 잔존 없음을 확인했다.

### P2-2 — ADR의 동의 요건 단정 (타당, 수정 완료)

"쿠키를 쓰지 않으므로 동의 배너가 불필요하다"는 법적 결론을 확정적으로 쓴 것은 근거가 부족했다.
`법무·설정 검토 후 확정`으로 바꾸고, 검토해야 할 항목(URL·IP 처리, 접속 메타데이터,
미국으로의 데이터 이전)과 산출물(`privacy-data-map.md`)을 명시했다.

### 리뷰 PR 승인 기준 대조

| 기준 | 상태 |
|---|:---:|
| `#s=` 값이 최종 분석 요청에 포함되지 않음 | 충족 |
| 스크립트 로드 전 이벤트가 유실되지 않음 | 충족 |
| 분석 활성·비활성·차단 상태 테스트 통과 | 충족 |
| Guest 회귀 테스트가 외부 네트워크 없이 결정적으로 통과 | 충족 |
| CDN smoke 테스트가 별도 결과로 구분됨 | 충족 |
| 테스트 프로세스와 로컬 서버가 정상 종료됨 | 충족 |
| ADR의 법적 단정 표현이 검토 상태로 보정됨 | 충족 |
| 작업 로그에 독립 재현 결과와 P1 수정 내용을 반영함 | 충족 |
| 워킹 트리 깨끗함 | 충족 |
