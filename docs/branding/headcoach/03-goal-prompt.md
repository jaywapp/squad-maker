# 03. 작업 시작용 goal 프롬프트 (Codex)

아래 블록을 그대로 Codex 작업 세션에 붙여 넣는다. 경로·브랜치가 바뀌었으면 `[ ]` 안만 고친다.
**국내 상표 확인과 PR #47 병합이 끝난 뒤에 쓴다.**

```text
목표: squad-maker 앱의 Run Line 브랜딩 이름을 한글 '아이엠 헤드코치'(A안)로 바꾸고,
작업요청서의 완료 기준을 모두 만족한 상태로 커밋 직전까지 만든다.

## 대상
- 레포: [D:\station\repos\squad-maker] (github.com/jaywapp/squad-maker)
- 기준: 최신 main (Run Line PR #47이 병합된 상태여야 한다)
- 작업 브랜치: feat/brand-headcoach (새 작업 트리에서)
- 작업 패키지: docs/branding/headcoach/

## 먼저 확인 (하나라도 아니면 시작하지 말고 보고)
1. 사용자가 국내 상표 확인 결과를 알려 줬는가
2. PR #47이 main에 병합됐는가 (index.html에 <!-- ═══ BRAND INTRO 블록과 svg.wordmark-logo가 있는가)
3. index.html·android·capacitor.config.json을 고치는 다른 열린 PR이나 세션이 없는가

## 먼저 읽을 것 (이 순서로, 끝까지)
1. AGENTS.md — 레포 규칙 (orchestrator=Codex로 선언)
2. docs/branding/headcoach/README.md
3. docs/branding/headcoach/01-design-spec.md
4. docs/branding/headcoach/02-work-request.md — 교체표(§2)와 T1~T6을 그대로 수행
5. docs/branding/run-line/01-design-spec.md — 바뀌지 않는 Run Line 규칙
6. docs/branding/README.md — 브랜딩 자료 전체 안내

## 해야 할 일
0. docs/brand-headcoach-apply-YYYYMMDD-analysis.md / -design.md / -tasks.md 를 먼저 만들고 docs/README.md에 연결한다.
   analysis에는 사용자 선택 A안(2026-10-10), 상표 확인 결과와 날짜, 이 패키지 경로를 적는다.
1. T1 인트로·헤더, T2 문구 (index.html, 순차)
2. T3 appName·strings.xml (T1과 병렬 가능)
3. T4 테스트 기대값 (brand-intro.spec.js, beta-ui.spec.js)
4. T5 자동 검증을 포그라운드에서 순서대로:
   npm run test:unit
   npm run android:bundle
   npx playwright test --project=desktop-1280 --workers=1
   npx playwright test --project=mobile-390 --workers=1
   cd android; .\gradlew.bat :app:assembleRelease :app:lintRelease --console=plain --no-daemon
   + 02 문서 T5 추가 확인 항목
5. tasks 문서에 각 작업 상태와 검증 결과를 기록한다.

## 꼭 지킬 것
- 자산은 docs/branding/headcoach/assets/ 파일을 그대로 쓴다. SVG 경로·색·시간을 손으로 바꾸지 않는다.
- 교체표에 있는 위치만 바꾼다. 패키지 ID, custom_url_scheme, 저장 키(squad-maker-*), 이벤트 이름, .sq 형식, 도메인, 저장소 이름은 바꾸지 않는다.
- 마크·아이콘·파비콘·시스템 스플래시·색은 바꾸지 않는다.
- 스니펫 주석 안의 태그 글자를 기준으로 찾아 바꾸지 않는다(02 문서 R2).
- h1.wordmark, svg.wordmark-logo, <script data-brand-intro> 속성을 유지한다.
- 교체표에 없는 "스쿼드 메이커" 문자열을 발견하면 바꾸지 말고 목록으로 보고한다.
- commit·push·PR·merge는 하지 않는다. main push는 APK 릴리스와 Vercel 배포를 실행한다.
- 시크릿(서명 키, .env)을 출력·기록하지 않는다.

## 멈추고 사용자에게 물을 것
- 선행 조건(상표 확인, PR #47 병합)이 충족되지 않았을 때
- 런처 라벨을 줄여야 할 것 같을 때(기본은 "아이엠 헤드코치 Preview" 전체)
- 기존 테스트가 새로 실패하는데 원인이 이름 변경인지 불분명할 때

## 완료 기준
02-work-request.md §4 체크리스트 중 실기기 확인(T6)을 뺀 모든 항목. T6은 tasks 문서에 "대기"로 남긴다.

## 마지막 보고 (한국어)
- 바꾼 파일 목록과 교체표 번호
- 실행한 검증 명령과 결과(통과·실패·skip 수)
- 실행하지 못한 것과 이유, 남은 위험
- 사용자가 실기기에서 할 일(T6 표)
- 커밋 메시지 초안(conventional commits, 영어)과 PR 제목·본문 초안
```
