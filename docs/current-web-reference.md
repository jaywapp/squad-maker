# 현재 웹앱 구현 참고

- 기준: main `e5877ddf198aaf54082d535a8c1894c346984973`
- [최신 제품 계획](product-plan.md)과 구현 상태를 구분한다. Android·다중 파일 슬롯·광고·실제 결제는 이 문서의 구현 완료 목록에 없다.
- 운영 소스: [index.html](../index.html), [제보 함수](../api/feedback.js), [배포 워크플로](../.github/workflows/deploy-vercel.yml), [Vercel 설정](../vercel.json)

## 기능과 데이터

단일 HTML/CSS/JavaScript 웹앱이다. 기본/공격/수비 스쿼드와 공통 명단, 5~11인제 포메이션, 팀·선수 지침, 다단계 선수/공 패턴과 재생·GIF, PNG, 매치 전략, URL 공유·읽기 전용 뷰어, .sq 저장·불러오기, LocalStorage 자동저장이 있다.

현 저장은 마지막 작업 하나를 `squad-maker-v1`에 보관하며 snapshot `v:1`을 쓴다. 여러 팀 프로젝트·전술 파일 보관과 구매 슬롯은 목표 구조다. 공유 URL `#s=` 열람은 로컬 데이터를 보존하고 명시적 가져오기만 저장한다. 불러오기·인원 변경·초기화의 안전 문제는 [독립 검토](2026-10-07-ux-ui-independent-review.md)와 [재현 계획](product-plan.md#11-우선-재현보호-계획)을 따른다.

## 실행과 검증 참고

`index.html`을 브라우저에서 열거나 저장소를 정적 서버로 제공한다. 이미지/GIF 등 일부 라이브러리·글꼴이 CDN을 사용하므로 현재 운영 오프라인 보장을 주장하지 않는다.

```bash
npm install
npx playwright install chromium
npm test
npm run test:cdn
```

`npm test`는 API 단위·웹 Playwright 회귀 검증을 수행한다. CDN smoke는 외부 공급자 가용성 확인이다. fixture와 tests/vendor 고정 라이브러리의 라이선스/원본은 보존한다. [vendor 안내](../tests/vendor/README.md), [snapshot v:1 fixture](../tests/fixtures/snapshot-v1.json)

## 운영 문서

[분석 이벤트 사전](analytics-event-dictionary.md), [분석 ADR](adr/0001-analytics-provider.md), [실행 안정성 기록](runtime-resilience-20260909-tasks.md), [워크스페이스 설정 기록](workspace-environment-setup-tasks.md)을 읽는다. 과거 beta 준비 문서의 GitHub Pages·CI 부재·가격·가입 가설은 당시의 기록이며 현재 운영 지시가 아니다.

현 Vercel 배포는 main push의 Actions 경로이며 피드백 중계가 있다. 이번 문서 PR은 main push·배포·설정·키 변경을 하지 않는다. 운영 환경 값과 시크릿은 문서에 기록하지 않는다. 최신 정책 및 실제 환경은 운영 작업 착수 때 별도 확인한다.
