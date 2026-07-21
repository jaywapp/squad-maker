# 분석 이벤트 사전

- 기준: [수익화 적용 계획서](./2026-07-20-monetization-implementation-plan.md) §9, Task 0.2
- 도구: Umami Cloud ([ADR 0001](./adr/0001-analytics-provider.md))
- 구현: `index.html`의 `track(name, properties, options)` 어댑터

## 원칙

1. **화이트리스트 강제** — 이 문서에 없는 이벤트 이름·속성 키는 어댑터가 폐기한다.
2. **금지 값** — 다음은 어떤 속성으로도 보내지 않는다:
   선수·팀 이름, 팀/선수 지침, 이메일·결제 식별자, 전체 공유 URL과 토큰(`#s=` 해시 포함),
   스냅샷 JSON, 자유 입력 텍스트 원문.
3. **값 제한** — 속성 값은 문자열로 강제 변환 후 40자로 자른다(실수로 긴 콘텐츠가 섞이는 것 방지).
4. `once: true` 이벤트는 페이지 로드(세션)당 1회만 전송한다.
5. **자동 부가 필드까지 통제** — 화이트리스트는 우리가 넘기는 속성만 통제하고,
   분석 스크립트가 스스로 붙이는 `url`·`referrer`는 통제하지 못한다.
   `#s=` 공유 스냅샷이 URL에 들어 있으므로 전송 직전 가드로 경로만 남긴다.
   상세는 [ADR 0001 구현 규칙](./adr/0001-analytics-provider.md) 참고.
6. **준비 전 이벤트 보존** — 스크립트 로드 전 발생한 이벤트는 큐에 보관했다가
   순서대로 전달한다. 조용히 폐기하지 않는다.

### 전송되는 payload의 전체 모습

어댑터가 넘기는 `name` + 허용 속성 외에, Umami가 다음을 자동으로 덧붙인다.
`url`·`referrer`는 가드로 축약된 값이다.

| 필드 | 값 | 비고 |
|---|---|---|
| `url` | `/index.html` | pathname만 — 해시·쿼리 제거 |
| `referrer` | 출처 origin + pathname | 유입 경로 분석용 |
| `hostname` | 배포 호스트 | |
| `screen` / `language` | 화면 크기 / 브라우저 언어 | |
| `title` | 고정된 문서 제목 | 콘텐츠 아님 |
| `website` | Umami 웹사이트 ID | |

## 0단계 이벤트

| 이벤트 | 발생 시점 | once | 허용 속성 |
|---|---|:---:|---|
| `squad_started` | 앱 초기화 완료 후 **사용자의 첫 편집**(자동 저장 트리거) | ✔ | `mode` (인원제, 예 `9v9`) |
| `squad_completed` | 세션에서 처음으로 **결과물을 만든 시점** — 이미지 저장·GIF·공유 텍스트/링크 생성 중 첫 행동 | ✔ | `mode`, `patterns_used` (`true`/`false`) |
| `image_exported` | PNG 저장 시도 완료 | | `kind` (`png`), `ok` (`true`/`false`) |
| `gif_exported` | GIF 인코딩 완료·다운로드 | | `kind` (`single`/`all`), `ok` |
| `share_link_created` | 공유 모달 열림(`text`) 또는 공유 URL 복사(`public_url`) | | `kind` (`text`/`public_url`) |
| `share_link_opened` | `#s=` 링크로 뷰어 모드 진입 | ✔ | `kind` (`public`) |
| `cloud_save_interest_clicked` | `클라우드에 팀 저장` 설명형 진입점 클릭 | | `source` (진입 위치) |
| `advanced_export_previewed` | `고급 영상 내보내기` 설명형 진입점 클릭 | | `source` |
| `player_briefing_previewed` | `선수별 브리핑` 설명형 진입점 클릭 | | `source` |

`source` 값: `share_toolbar`(스쿼드 모드 공유 도구 옆), `pattern_controls`(패턴 모드 GIF 버튼 옆).

### `squad_started` / `squad_completed` 의미

- `squad_started`: 페이지 로드 직후의 자동 초기화(`initAllSquads`)나 저장본 복원은 제외하고,
  초기화가 끝난 뒤(`_appReady`) 첫 상태 변경 시점에 기록한다. "이번 세션에 실제로 편집을 했다"는 신호.
- `squad_completed`: 스쿼드 작성의 완료를 직접 알 수 없으므로, **결과물 산출 행동**(이미지·GIF·
  공유 생성)을 완료의 대리 지표로 정의한다. 생성 퍼널은 `squad_started → squad_completed`로 읽는다.

## 1단계 이후 예약 이벤트 (미구현)

계획서 §9에 정의된 나머지 이벤트는 해당 단계에서 이 사전에 추가한 뒤 구현한다:
`account_signup_started/completed`, `cloud_save_limit_reached`, `managed_share_limit_reached`,
`paywall_viewed`, `checkout_started`, `subscription_started`, `subscription_cancelled`.

## 검증 방법

- localhost에서 앱을 열면 `console.debug('[analytics]', name, props)`로도 출력된다.
- **어댑터 계약**: `tests/e2e/analytics-events.spec.js` — once 이벤트 중복 금지,
  화이트리스트 밖 속성·미등록 이벤트 폐기, 분석 비활성 시 네트워크 요청 0건.
- **최종 전송 계약**: `tests/e2e/analytics-payload.spec.js` — 실제 Umami 스크립트를 주입해
  `/api/send`로 나가는 본문을 검사한다. `#s=` 해시·팀명·선수명·지침이 0건이어야 하고,
  로드 지연·실패 상황에서 큐 동작과 앱 무영향을 확인한다.
