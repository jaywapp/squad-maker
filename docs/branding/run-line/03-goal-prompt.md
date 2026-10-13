# 03. 작업 시작용 goal 프롬프트

아래 블록을 그대로 복사해 작업 세션(Claude Code `/goal` 또는 Codex)에 붙여 넣는다.
경로·브랜치가 바뀌었으면 `[ ]` 안만 고친다.

```text
목표: squad-maker 앱에 브랜딩 시안 A "런 라인"(앱 아이콘·좌상단 로고·시작 스플래시)을 적용하고,
작업요청서의 완료 기준을 모두 만족한 상태로 커밋 직전까지 만든다.

## 대상
- 레포: [D:\station\repos\squad-maker] (github.com/jaywapp/squad-maker)
- 기준 브랜치: [feat/a-preview-release-20261007] — main에 이미 머지됐으면 main 최신
- 작업 브랜치: feat/brand-run-line (기준 브랜치에서 새로 만든다)
- 작업 패키지: docs/branding/run-line/
  - 이 폴더가 기준 브랜치에 없으면 [design/brand-20261008] 브랜치
    (worktree [D:\station\.worktrees\squad-maker-brand-20261008])에서 폴더째 가져온다.

## 먼저 읽을 것 (이 순서로, 끝까지)
1. AGENTS.md, CLAUDE.md — 레포 규칙
2. docs/branding/run-line/README.md — 개요
3. docs/branding/run-line/01-design-spec.md — 사양(숫자·색·모션의 기준)
4. docs/branding/run-line/02-work-request.md — 작업 절차. 이 문서의 T1~T6을 그대로 수행한다.

## 해야 할 일
0. 레포 규칙대로 docs/brand-run-line-20261008-analysis.md / -design.md / -tasks.md 를 먼저 만든다.
   - analysis: 사용자 선택 "A 런 라인(2026-10-08)", 범위·비범위, 완료 기준(02 문서 §1·§5)
   - design: 02 문서 §2 결정 사항과 이유
   - tasks: 02 문서 §4 작업 표(T1~T7)에 orchestrator/owner/model/effort/depends_on/parallel_group/files/verification/status를 채운다
   - docs/README.md 인덱스에 연결한다.
1. T1 헤더 로고·파비콘, T2 모션 인트로 (index.html, 순차)
2. T3 Android 아이콘 리소스, T4 시스템 스플래시·흰 깜빡임 방지 (순차). T1과 T3은 병렬 가능.
3. T5 스토어 512 PNG는 docs/branding/run-line/assets/preview/icon-store-512.png 위치만 tasks 문서에 기록한다.
4. T6 자동 검증을 포그라운드에서 이 순서로 실행한다(메모리 부족 시 백그라운드 테스트가 강제 종료됨):
   npm run test:unit
   npm run android:bundle
   npx playwright test --project=desktop-1280 --workers=1
   npx playwright test --project=mobile-390 --workers=1
   cd android; .\gradlew.bat :app:assembleRelease :app:lintRelease --console=plain --no-daemon
   + 02 문서 T2-6의 tests/e2e/brand-intro.spec.js 추가
   + .work/android-web/index.html에서 platform-native.js 삽입 위치 확인
5. tasks 문서에 각 작업 상태와 검증 결과(명령, 통과 수, 실패·skip 이유)를 기록한다.

## 꼭 지킬 것
- 에셋은 docs/branding/run-line/assets/ 파일을 그대로 쓴다. SVG 경로·색·시간을 손으로 바꾸지 않는다.
- h1.wordmark 요소와 클래스를 유지한다(회귀 테스트 대상).
- 인트로 스크립트의 data-brand-intro 속성을 지우지 않는다(02 문서 R2).
- res/drawable-v24/ic_launcher_foreground.xml을 반드시 삭제한다(02 문서 R1).
- 리소스를 지우기 전에 git grep으로 다른 참조가 없는지 확인한다. styles.xml은 덮어쓰기 전에 현재 파일과 diff해서
  02 문서가 말한 두 곳 외 차이가 있으면 병합한다.
- 범위 밖 변경 금지: 앱 이름·패키지 ID·버전, OG 이미지, 알림 아이콘, 헤더 외 UI, 의존성 업그레이드.
- index.html·android/를 다른 세션이나 열린 PR이 고치고 있으면 시작하지 말고 보고한다.
- commit·push·PR·merge는 하지 않는다. 사용자가 요청하면 그때 한다.
- 시크릿(서명 키, .env)을 출력·기록하지 않는다. 서명 APK는 만들지 않는다.

## 멈추고 사용자에게 물을 것
- 02 문서 §2 결정을 바꿔야 할 것 같을 때
- 위험 R3(시스템 스플래시가 길게 보임), R4(작은 아이콘이 길 안내 아이콘처럼 보임)에 해당할 때 — 대안을 제시만 하고 적용하지 않는다
- 기존 테스트가 새로 실패하는데 원인이 브랜딩 변경인지 불분명할 때

## 완료 기준
02-work-request.md §5 체크리스트 중 실기기 확인(T7)을 뺀 모든 항목. T7은 확인표를 tasks 문서에 "대기"로 남긴다.

## 마지막 보고 (한국어)
- 바꾼 파일 목록(추가·수정·삭제 구분)
- 실행한 검증 명령과 결과(통과·실패·skip 수)
- 실행하지 못한 것과 이유, 남은 위험
- 사용자가 실기기에서 할 일(T7 표)
- 커밋 메시지 초안(conventional commits, 영어)과 PR 제목·본문 초안
```

## 참고

- 다른 도구로 넘길 때도 프롬프트는 같다. 레포 규칙상 한 작업 트리에서는 Claude와 Codex를 섞지 않는다.
- 결과가 오면 사용자가 실기기 확인(T7)을 하고, 그 결과를 보고 커밋·PR을 요청한다.
