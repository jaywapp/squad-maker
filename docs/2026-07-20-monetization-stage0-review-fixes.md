# 수익화 0단계 리뷰 지적 수정 내역

- 작성일: 2026-07-20
- 대상 리뷰: [수익화 0단계 작업 로그 리뷰 피드백](./2026-07-20-monetization-stage0-worklog-feedback.md)
- 대상 작업: [수익화 0단계 구현 작업 기록](./2026-07-20-monetization-stage0-worklog.md)
- 수정 커밋: `93cdf38` — *fix: close analytics privacy and delivery gaps found in review*
- 수정 전 기준점: `13e14a8`
- 결과: 지적 4건 중 3건 수정 + 1건 근거를 들어 미채택, 테스트 39건 → **51건**

---

## 0. 한눈에 보기

| # | 등급 | 지적 | 검증 결과 | 조치 |
|---|:---:|---|---|---|
| 1 | P1 | 분석 URL에 `#s=` 공유 스냅샷이 실려 나감 | **실재 — 재현 성공** | 3중 방어 + 전송 본문 계약 테스트 |
| 2 | P1 | 스크립트 로드 전 이벤트 유실 | **실재 — 지적보다 심각(결정적 유실)** | 이벤트 큐 + 지연·실패 테스트 |
| 3 | P2 | 배포 차단 테스트가 외부 CDN에 의존 | 타당 | 자산 고정 + 외부 요청 전면 차단, CDN은 별도 smoke |
| 4 | P2 | ADR이 동의 배너 불필요를 단정 | 타당 | "법무·설정 검토 후 확정"으로 보정 |
| — | — | (권고) `data-auto-track="false"` | **미채택** | Gate A 분모 상실 — §1.5에 근거 |

---

## 1. P1-1 — 분석 URL을 통한 공유 스냅샷 전송

### 1.1 무엇이 문제였나

작업 로그에는 이렇게 적혀 있었다.

> 화이트리스트가 개인정보·콘텐츠 미전송을 **구조적으로 강제**한다.

이 문장은 **어댑터가 넘기는 속성에 대해서만** 참이었다. 분석 스크립트가 payload에
스스로 덧붙이는 필드는 `track()`의 통제 밖에 있다.

### 1.2 검증 — Umami 트래커 소스 확인

`https://cloud.umami.is/script.js`를 직접 받아 확인했다.

```js
// payload 빌더 — 모든 이벤트·페이지뷰에 url과 referrer가 자동 포함된다
C = () => ({ website:S, screen:R, language:n, title:c.title,
             hostname:h, url:Y, referrer:Z, tag:E, id:V||void 0 })

// URL 정규화 — 쿼리·해시는 옵션을 켰을 때만 제거된다
B = t => { const e = new URL(t, o.href);
           return j && (e.search=""), N && (e.hash=""), e.toString() }
//   j = (data-exclude-search === "true")   기본값 false
//   N = (data-exclude-hash   === "true")   기본값 false
```

즉 **기본 설정에서 해시는 그대로 전송된다.**

### 1.3 재현 — 실제 전송 본문 캡처

추정으로 끝내지 않기 위해, 가드를 제거한 상태에서 통합 테스트로 `/api/send` 본문을 캡처했다.

```json
{
  "type": "event",
  "payload": {
    "website": "test-website-id",
    "hostname": "127.0.0.1",
    "url": "http://127.0.0.1:4317/index.html#s=eyJ2IjoxLCJ0ZWFtIjoiRkMg7ZqM6reAIiwibW9kZSI6Ijl2OSI...",
    "referrer": "",
    "name": "share_link_opened",
    "data": { "kind": "public" }
  }
}
```

`url`의 base64를 디코드하면 다음이 전부 들어 있다.

- 팀명 `FC 회귀`
- 선수명 `김공격`, `이미드`, `박수비`
- 팀 지침 `라인 간격을 유지한다`
- 개인 지침 `전방 압박 우선`
- 전체 좌표·포메이션·패턴

이벤트 사전의 금지 항목(**전체 공유 URL과 토큰**, **스냅샷 JSON**, **선수·팀 이름**,
**팀/선수 지침**)을 한 번에 위반한다.

### 1.4 수정 — 3중 방어

**① 트래커 설정** (`index.html`)

```js
s.setAttribute('data-exclude-hash', 'true');
s.setAttribute('data-exclude-search', 'true');
s.setAttribute('data-before-send', '__squadMakerBeforeSend');
```

**② 전송 직전 가드** — 설정 누락에 대비한 최종 방어선

```js
window.__squadMakerBeforeSend = function (type, payload) {
  try {
    if (!payload) return payload;
    if (payload.url) {
      // 단일 페이지 앱이므로 pathname만으로 충분하다 (해시·쿼리 제거)
      payload.url = new URL(payload.url, location.href).pathname;
    }
    if (payload.referrer) {
      // 유입 경로 분석에는 출처 사이트까지만 필요하다
      const r = new URL(payload.referrer, location.href);
      payload.referrer = r.origin + r.pathname;
    }
  } catch { return null; } // 정규화에 실패하면 전송하지 않는다
  return payload;
};
```

`referrer`도 함께 처리한 이유: 사용자가 공유 링크 화면에서 다른 곳으로 이동하면
직전 URL(`#s=` 포함)이 referrer가 될 수 있다.

**③ 상시 검증** — `tests/e2e/analytics-payload.spec.js`

어댑터의 `safe` 객체가 아니라 **실제 네트워크 본문**을 검사한다.
`tests/vendor/umami-script.js`(진짜 트래커)를 주입하므로 자동 부가 필드까지 재현된다.

### 1.5 미채택한 권고 — `data-auto-track="false"`

리뷰는 자동 페이지뷰 추적도 끌 것을 권했지만 채택하지 않았다.

- Gate A 조건에는 **"활성 제작자의 10% 이상"** 과 **"완성 세션 200건 이상"** 이 있다.
  둘 다 방문·세션이라는 **분모**를 필요로 한다. 자동 추적을 끄면 그 분모를 잃는다.
- 이 앱은 단일 페이지이므로, 해시·쿼리를 제거하면 남는 경로는 `/index.html` 하나뿐이다.
  콘텐츠가 실릴 자리가 없다.
- 따라서 ①②③과 함께라면 자동 추적을 유지해도 안전하다. 근거는 ADR 0001에 기록했다.

### 1.6 수정 후 전송되는 payload

| 필드 | 값 | 콘텐츠 포함 여부 |
|---|---|:---:|
| `url` | `/index.html` | 없음 |
| `referrer` | 출처 origin + pathname | 없음 |
| `hostname` | 배포 호스트 | 없음 |
| `screen` / `language` | 화면 크기 / 브라우저 언어 | 없음 |
| `title` | 고정 문서 제목 | 없음 |
| `name` + `data` | 사전에 등록된 이벤트·속성만 | 없음 |

---

## 2. P1-2 — 분석 스크립트 로드 전 이벤트 유실

### 2.1 지적보다 심각했던 이유

리뷰는 "경합(race)에 취약하다"고 봤지만, 실제로는 **결정적 유실**이다.

- 분석 스크립트는 `defer`로 로드된다 → HTML 파싱이 **끝난 뒤** 실행된다.
- INIT 블록은 `<script>` 안에 있다 → 파싱 **도중** 실행된다.
- 따라서 `share_link_opened`가 발생하는 시점에 `window.umami`는 **항상** undefined다.

수정 전 코드는 `once` 이벤트를 먼저 발송 완료로 표시한 뒤 호출을 시도했다.

```js
if (opts.once) {
  if (_trackedOnce.has(name)) return;
  _trackedOnce.add(name);      // ← 여기서 이미 '전송됨'으로 기록
}
...
try { window.umami?.track(name, safe); } catch {}  // ← undefined면 조용히 사라짐
```

결과적으로 **공유 링크 열람은 사실상 100% 집계되지 않았을 것이다.** Gate A의
공유 → 열람 퍼널이 통째로 비어 보이는 상태였다.

### 2.2 수정 — 이벤트 큐

```js
const _analyticsQueue = [];
const ANALYTICS_QUEUE_MAX = 50; // 스크립트가 끝내 오지 않아도 메모리가 늘지 않게 상한
let _analyticsReady = false;

// track() 말미
if (_analyticsReady) _deliverEvent(name, safe);
else if (_analyticsQueue.length < ANALYTICS_QUEUE_MAX) _analyticsQueue.push({ name, props: safe });

// initAnalytics()
s.addEventListener('load', () => {
  _analyticsReady = true;
  _analyticsQueue.splice(0).forEach(e => _deliverEvent(e.name, e.props));
});
s.addEventListener('error', () => { _analyticsQueue.length = 0; }); // 재시도 없음
```

동작 규칙:

| 상황 | 동작 |
|---|---|
| 로드 전 이벤트 발생 | 큐에 보관 (상한 50건) |
| 스크립트 로드 완료 | 큐를 **발생 순서대로** 전달 |
| 로드 전 같은 `once` 이벤트 반복 | `_trackedOnce`가 먼저 걸러 큐에 1건만 |
| 로드 실패(차단·오프라인) | 큐 비우고 포기 — 재시도 없음, 앱 무영향 |

---

## 3. P2-1 — 배포 차단 테스트의 외부 CDN 의존

### 3.1 판단

리뷰 환경에서 PNG·GIF 테스트가 타임아웃된 것은 앱 결함이 아니라 CDN 접근 차단 때문이었다.
그러나 **같은 커밋이 네트워크 조건에 따라 통과·실패한다**는 지적 자체는 타당하다.
계획서 §8이 Guest E2E를 배포 차단 테스트로 유지하도록 요구하는 만큼, 결정성이 필요하다.

### 3.2 수정

**고정 자산 주입** — `tests/vendor/`

| 파일 | 원본 | 라이선스 |
|---|---|---|
| `html2canvas.min.js` | `html2canvas.hertzen.com/dist/...` | MIT |
| `gif.js` / `gif.worker.js` | `cdnjs.cloudflare.com/.../0.2.0/...` | MIT |
| `umami-script.js` | `cloud.umami.is/script.js` | MIT |

스텁이 아니라 **실제 라이브러리**를 주입하므로 내보내기 경로는 진짜로 실행된다.

**외부 요청 전면 차단** — `tests/helpers/stub-cdn.js`

```js
await page.route('**/*', route =>
  isLocal(route.request().url()) ? route.continue() : route.abort('blockedbyclient')
);
```

외부 네트워크가 완전히 끊긴 상태에서 통과해야만 배포 차단 테스트로서 의미가 있다.
부수 효과로 Guest 스위트 실행 시간이 **46초 → 17초**로 줄었다.

**CDN 가용성 분리** — `playwright.cdn.config.js` + `npm run test:cdn`

기본 `npm test`에서 제외(`testIgnore`)했다. 여기서의 실패는 앱 회귀가 아니라
공급자·네트워크 문제이므로 결과를 구분해 읽는다.

**서버 수명주기** — `playwright.config.js`

```js
// npx 래퍼를 거치면 Windows에서 손자 프로세스가 남아 종료가 지연된다
command: 'node node_modules/http-server/bin/http-server -p 4317 -c-1 --silent .',
reuseExistingServer: false,  // 재사용한 서버는 Playwright가 종료하지 못한다
```

---

## 4. P2-2 — ADR의 동의 요건 단정

"쿠키를 쓰지 않으므로 동의 배너가 불필요하다"는 **법적 결론**을 확정적으로 기술한 것은
근거가 부족했다. 쿠키 사용 여부만으로 판단할 수 없고, 실제 요청에 포함되는 URL·IP 처리·
접속 메타데이터와 미국으로의 데이터 이전까지 함께 봐야 한다.

- `동의 배너 불필요` → **`법무·설정 검토 후 확정`**
- 검토 산출물을 `docs/privacy-data-map.md`(Task 1.1)로 지정
- 활성화 전에 실제 payload를 캡처해 문서의 수집 항목과 대조하도록 절차를 명시

---

## 5. 추가된 검증

### 5.1 신규 테스트 — `tests/e2e/analytics-payload.spec.js` (6건)

분석이 **활성 상태**일 때 나가는 최종 본문을 검사한다.

| 테스트 | 막는 회귀 |
|---|---|
| `#s=` 뷰어에서도 전송 url에 해시·스냅샷이 없다 | P1-1 재발 |
| 편집·내보내기·공유 이벤트 payload에도 콘텐츠가 없다 | P1-1 재발(이벤트 경로) |
| 로드가 지연돼도 초기 `share_link_opened`가 정확히 1회 전달 | P1-2 재발 |
| 로드 전 같은 once 이벤트 반복 시 큐에 1건만 | 큐 중복 |
| 로드 전 일반 이벤트는 발생 순서대로 전달 | 순서 뒤바뀜 |
| 스크립트 로드 실패가 앱을 망가뜨리지 않는다 | 장애 격리 |

검사 대상 금지 문자열: `s=`, 스냅샷 base64 조각, `FC 회귀`, `김공격`, `이미드`,
`박수비`, `라인 간격을 유지한다`, `전방 압박 우선`.

### 5.2 테스트 결과

| 스위트 | 결과 |
|---|---|
| `npm test` (외부 네트워크 차단) | **51 passed**, 1 skipped (52.0s) |
| `npm run test:cdn` (opt-in) | **4 passed** (3.2s) |
| 종료 후 포트 4317 | LISTENING 소켓 없음 (TIME_WAIT는 정상 잔여) |

수정 전 39건 → 수정 후 51건 (payload 계약 6건 × 2뷰포트 = 12건 증가).

### 5.3 회귀 테스트가 실제로 결함을 잡는지 확인

새 테스트가 통과하는 것만으로는 의미가 없으므로, **가드를 제거한 상태로 실행해
실패하는 것을 먼저 확인**한 뒤 복원했다(§1.3의 캡처가 그 결과물이다).

---

## 6. 변경 파일

```
index.html                              수정: before-send 가드, 이벤트 큐, 트래커 설정
tests/e2e/analytics-payload.spec.js     신규: 최종 전송 본문 계약 (6 tests)
tests/e2e/cdn-smoke.spec.js             신규: CDN 가용성 opt-in (4 tests)
tests/helpers/stub-cdn.js               신규: 자산 주입 + 외부 요청 차단
tests/vendor/                           신규: 고정 버전 CDN 자산 + 출처 문서
tests/e2e/guest-free-regression.spec.js 수정: 고정 자산 사용
playwright.config.js                    수정: CDN smoke 제외, 서버 수명주기
playwright.cdn.config.js                신규: CDN smoke 전용 설정
package.json                            수정: test:cdn 스크립트
docs/adr/0001-analytics-provider.md     수정: 법적 표현 보정, 구현 규칙 확장
docs/analytics-event-dictionary.md      수정: 자동 부가 필드 계약 명시
docs/2026-07-20-monetization-stage0-worklog.md  수정: 두 환경 결과·결함 경고 반영
README.md                               수정: 검증 방법 갱신
```

---

## 7. 리뷰 PR 승인 기준 대조

| 기준 | 상태 |
|---|:---:|
| `#s=` 값이 최종 분석 요청에 포함되지 않음 | 충족 |
| 스크립트 로드 전 이벤트가 유실되지 않음 | 충족 |
| 분석 활성·비활성·차단 상태 테스트 통과 | 충족 |
| Guest 무료 회귀 테스트가 외부 네트워크 없이 결정적으로 통과 | 충족 |
| CDN smoke 테스트가 별도 결과로 구분됨 | 충족 |
| 테스트 프로세스와 로컬 서버가 정상 종료됨 | 충족 |
| ADR의 법적 단정 표현이 검토 상태로 보정됨 | 충족 |
| 작업 로그에 독립 재현 결과와 P1 수정 내용을 반영함 | 충족 |
| 워킹 트리 깨끗함 | 충족 |

---

## 8. 배운 것

> **개인정보 경계는 우리가 부르는 함수에서 끝나지 않는다.**
> 서드파티 스크립트가 스스로 덧붙이는 필드까지 포함해야 전송 계약이 완성된다.

초기 구현은 분석 도구를 "속성만 조심하면 되는 것"으로 다뤘다. 그래서 화이트리스트를
만들어 놓고 "구조적으로 강제한다"고 문서에 적었지만, 정작 가장 민감한 값(`#s=` 스냅샷)은
우리가 넘기지도 않은 필드를 통해 나가고 있었다.

**앞으로 외부 SDK를 붙일 때의 규칙**: 어댑터 단위 검증에서 멈추지 않고,
**최종 네트워크 payload를 캡처해서** 계약을 확인한다. 1단계의 인증·클라우드 API,
2단계의 PG 연동에도 같은 원칙을 적용한다.

부수적으로, "구현자 환경에서 통과했다"는 사실만으로 배포 차단 테스트의 신뢰성을 주장할 수
없다는 것도 확인했다. 외부 의존이 있으면 같은 커밋이 환경에 따라 통과하거나 실패한다.

---

## 9. 다음 단계

측정 활성화 전 남은 작업은 리뷰 §8의 순서를 따른다.

1. ~~Umami URL/hash 전송 차단~~ — 완료
2. ~~이벤트 큐와 로드 지연 테스트~~ — 완료
3. ~~활성 상태 최종 payload 계약 테스트~~ — 완료
4. ~~CDN 의존 분리~~ — 완료
5. ~~서버 종료 지연 해결~~ — 완료
6. ~~ADR 법무 표현·작업 로그 갱신~~ — 완료
7. ~~전체 테스트 재실행~~ — 완료 (51 passed)
8. **코드 리뷰 후 push·PR** ← 사용자 결정 필요
9. **`privacy-data-map.md` 작성 + Umami `websiteId` 설정과 배포**
10. **4주 측정 · 코치 인터뷰 · Gate A 판정**

Gate A 판정 전에는 계획대로 인증·클라우드 DB·결제를 시작하지 않는다.
