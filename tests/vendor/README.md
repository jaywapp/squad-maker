# 테스트용 고정 외부 자산

앱은 이 라이브러리들을 CDN에서 로드하지만, **배포 차단 회귀 테스트가 외부 네트워크에
의존하면 안 되므로** 동일 버전을 여기에 고정해 두고 Playwright route 인터셉트로 주입한다.
실제 CDN 연결 자체는 별도 opt-in smoke 테스트(`tests/e2e/cdn-smoke.spec.js`)에서 확인한다.

| 파일 | 원본 | 라이선스 |
|---|---|---|
| `html2canvas.min.js` | `https://html2canvas.hertzen.com/dist/html2canvas.min.js` | MIT |
| `gif.js` | `https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js` | MIT |
| `gif.worker.js` | `https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js` | MIT |
| `umami-script.js` | `https://cloud.umami.is/script.js` | MIT |

- 받은 날짜: 2026-07-20
- 실제 라이브러리 코드를 그대로 실행하므로 스텁이 아니다 — 내보내기 경로는 진짜로 검증된다.
- `umami-script.js`는 분석 payload 계약 테스트에서 **실제 전송 본문**을 검증하는 데 쓴다.
- `index.html`의 CDN URL이나 버전을 바꾸면 이 파일들도 함께 갱신한다.
