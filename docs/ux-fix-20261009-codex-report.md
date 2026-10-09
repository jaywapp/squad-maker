# UX 개선 Codex 검증 기록

기준: `fix/ux-fix-20261009`, main `c165c0b60737f080cc6c9dced0a90b41b19e2115`. 원본 광고·Run Line 트리와 4317/4318 서버는 보존했다. 이 작업은 웹 개선이며 APK 생성·설치·공개 배포·main 병합은 실행하지 않는다.

## 1단계 최종 기준

운영 `index.html` SHA-256: `4944ad97b65b7a0579ea1df754a15664552c91bc97ad632c6becf625730f7c58`. 단위→웹 번들→데스크톱→모바일을 동일한 동결 코드로 실행했다. 포트 충돌을 피한 ignored 설정은 기존 Playwright 설정의 baseURL/webServer 포트만 4321로 바꾸며, 단일 워커·retries0·테스트 전체를 유지한다.

| 실행 | 결과 | 로컬 전체 로그 |
|---|---|---|
| `npm run test:unit` | 128 통과, 실패0 | `.work/ux-fix-20261009/phase1-final-unit.log` |
| `npm run android:bundle` | 성공, 로컬 export 자산·analytics disabled | `.work/ux-fix-20261009/phase1-final-bundle.log` |
| Playwright desktop-1280, workers1 | 107 통과, 실패0 | `.work/ux-fix-20261009/phase1-final-desktop.log` |
| Playwright mobile-390, workers1 | 106 통과, 실패0, 기존 skip1 | `.work/ux-fix-20261009/phase1-final-mobile.log` |

기존 회귀195개 모두 유지했고 새 UX9개를 두 프로젝트에서18회 검증했다. 기존 skip은 모바일의 전체 패턴 GIF 인코딩 시간 절약이며 데스크톱에서는 실제 인코딩한다. Playwright의 기존 모바일 프로젝트는 Pixel5 DPR2.75다. 별도 UX 재현은 390×844·DPR3·mobile/touch로 실행했다. 실제 휴대폰 검증은 아니다.

새 테스트는 메뉴 위치·10색 견본·대상, Enter 취소·저장 재시작, 제보 준비 실패/재시도/Esc, .sq 오류/취소/복원 저장 재시작, 인원 한도/이름12자/접근성 이름, 재생 단계 잠금, 도움말 초기 포커스, 사용자10색 보존과 번호 대비, 완료한 드래그의 선택을 보호한다.

## 화면·접근성 증거

1280/1366/768/390 화면을 [실측 JSON](ux-fix-20261009/evidence/codex-20261009/phase1/verification.json)에 기록했다. 가로 넘침0, 터치768/390에서 버튼·입력·select의44px 미만0, 탭 전환 헤더 x 이동0, toast 최대560px 이내, export sheet scrollWidth≤clientWidth, 앱 콘솔 오류0이다. 데스크톱의 기존 준비 중 칩3개는31px 높이로 유지되며 모바일의 터치 크기와 구분한다. 캡처는 오프라인 폰트 폴백이며 실제 기기·스크린리더 실사용·200% 확대를 검증했다고 표시하지 않는다.

- [1280 배치](ux-fix-20261009/evidence/codex-20261009/phase1/squad-1280.png), [390 배치](ux-fix-20261009/evidence/codex-20261009/phase1/squad-390.png), [390 복원 오류](ux-fix-20261009/evidence/codex-20261009/phase1/restore-error-390.png).
- [Lighthouse 13.4.1 모바일 HTML](ux-fix-20261009/evidence/codex-20261009/phase1/lighthouse.report.html)·[JSON](ux-fix-20261009/evidence/codex-20261009/phase1/lighthouse.report.json): 390×844×3, Accessibility100, label-content-name-mismatch 통과.
- [저장 상태·역할 대비](ux-fix-20261009/evidence/codex-20261009/phase1/status-tags.json): 실제 저장됨 칩은 탭과 겹치지 않는다. 역할 태그 대비7.58~12.01:1, GK7.73:1. 선수 번호는10색 모두 실제 표시 크기/굵기·대비와 color 데이터 보존을 회귀로 검증했다.
- [detector1280](ux-fix-20261009/evidence/codex-20261009/phase1/detect-1280.json), [detector390](ux-fix-20261009/evidence/codex-20261009/phase1/detect-390.json): 기존 low-contrast-text, text-too-small, layout-property-transition은 검출되지 않았다. 1280은 warning2/advisory3,390은 warning2/advisory4다.

UX-D-10/UX-031의 text-occlusion은 재검출되지만 화면에 보이는 저장 칩의 결함이 아니다. 대상 `#saveStatusText`는 의도적으로1×1px/clip rect0인 `aria-live=polite` 알림이다. 실제 칩 `저장됨`은 보이고 탭과 겹치지 않는다. 알림을 제거하거나 숨김 의미를 바꾸지 않고 detector 오탐으로 기록한다. uppercase와 긴 설정 열은 기존 UI/3단계 범위이며, border+shadow/피치 줄무늬 advisory는 이번 범위에서 A 디자인을 바꾸지 않는다.

## 실패와 보완 이력

최초 desktop103통과/3실패는 최종 결과에 사용하지 않았다. 새 body fixed 제외 조건의 ID 우선순위가 한 줄 헤더를 덮어써 `:where()`로 원래 우선순위를 복구했다. native에서는 gutter를 auto로 유지했다. 트레이 색상 메뉴를 같은 click이 즉시 닫는 경로를 보완했고, 완료한 동일 touch의 실제 이동만 대상 선택에 반영했다. 취소·다른 finger·undo/저장 원본 계약은 유지했다. 영향13개 재검증 후 위 전체 회귀를 새로 실행했다.

독립 정적 리뷰를 진행했고 지적한 드래그 문구/선택 불일치를 보완했다. 기존 테스트는 공유 닫기 SVG 라벨의 선택자2곳, Android bundle allowlist의 baseURL 의존성만 좁게 바꿨다. `app/`, `api/`, Android native·설정·의존성·배포 diff는 없다.

## 2단계 최종 기준 (2026-10-10)

최종 운영 `index.html` SHA-256: `5741074cae5bdb0c3d7c9f865ec24447c32a44f8258245ef8afa11779fc09a5b`. 도움말 제목 계층까지 보완한 뒤 동일한 동결 코드로 아래 전체를 새로 실행했다. 1단계 결과나 제목 보완 전 결과를 최종 코드 결과로 재사용하지 않는다.

| 실행 | 최종 결과 | 로컬 전체 로그 |
|---|---|---|
| `npm run test:unit` | 128 통과, 실패0 | `.work/ux-fix-20261009/final-unit.log` |
| `npm run android:bundle` | 성공 | `.work/ux-fix-20261009/final-bundle.log` |
| Playwright desktop-1280, workers1 | 113 통과, 실패0 | `.work/ux-fix-20261009/final-desktop.log` |
| Playwright mobile-390, workers1 | 112 통과, 실패0, 기존 skip1 | `.work/ux-fix-20261009/final-mobile.log` |

기존195회 + 1단계18회 + 2단계12회 = 225회 통과다. 추가6개 테스트는 자동 저장·전체 스냅샷 undo·재시작,26px 경계의 최근 실제 이동, 입력 방향키 무시, roundRect가 없는 캔버스/DPR 과대 렌더, 단계 방향 요약, 뷰어의 두 저장키 원본 보호·실제 GIF, 더보기 위험 확인/취소/undo, honeypot 제외와 확인창 Tab/Esc 단일 레이어를 검사한다. 원래 분석 이벤트 source·이벤트 수·배치 준비 중 칩3개 기대값을 유지했다.

### 실제 화면·GIF·접근성

- [최종 실측 JSON](ux-fix-20261009/evidence/codex-20261009/phase2/verification.json): 1280/1366/768/390(DPR3 touch), 가로 넘침0·헤더 x 이동0·콘솔0. 터치768/390에서44px 미만 버튼/입력/select0. 기존 데스크톱 준비 중 칩3개는31px다.
- [1280 패턴](ux-fix-20261009/evidence/codex-20261009/phase2/pattern-1280.png), [390 긴 이름](ux-fix-20261009/evidence/codex-20261009/phase2/pattern-390-long-names.png). 기존 경로 hit radius22/논리좌표480×660을 보존하며 시각 토큰만36px 이상으로 보정했다. 패턴 패널 기본 노출 버튼7개, 내보내기 주 행동만 라임이다.
- [실제 GIF](ux-fix-20261009/evidence/codex-20261009/phase2/movement-pattern.gif)와 [첫 프레임](ux-fix-20261009/evidence/codex-20261009/phase2/gif-first-frame.png)·[1.5초 프레임](ux-fix-20261009/evidence/codex-20261009/phase2/gif-mid-frame.png)을 최종 코드에서 생성하고 직접 확인했다. GIF89a,480×660,2,389,880bytes, SHA-256 `9ea8af008d5b9af3f9bb4a5588bef735bcd9a860697a2e4d28f7fb0153ba9b58`. [렌더 계측](ux-fix-20261009/evidence/codex-20261009/phase2/export-verification.json)에서 미리보기 이름 약12px, detached GIF 이름12px·말줄임·GK 옆 이름표·busy 해제/오류0을 확인했다. 저장된 color·이름은 바꾸지 않는다.
- [최종 Lighthouse HTML](ux-fix-20261009/evidence/codex-20261009/phase2/lighthouse.report.html)·[JSON](ux-fix-20261009/evidence/codex-20261009/phase2/lighthouse.report.json): 2026-10-10 KST,390×844×3, Accessibility100, label-content-name-mismatch 통과.
- [최종 detector1280](ux-fix-20261009/evidence/codex-20261009/phase2/detect-1280.json), [390](ux-fix-20261009/evidence/codex-20261009/phase2/detect-390.json): skipped-heading·contrast·tiny text·width transition 미검출. warning2씩, advisory7/8. 잔여 warning은 기존 uppercase/긴 설정 열(1280), uppercase/접근성 전용 저장 알림 오탐(390)이다. 그림자/테두리·피치 줄무늬는 기존 A 디자인 advisory다.

독립 리뷰에서 찾은 숨는 패턴 칩, 캔버스 API 호환, 확인창 Tab 경계를 고친 후 전체 회귀를 다시 실행했다. detector의 새 도움말 heading h2→h4 경고도 h3로 바로잡고 최종 전체/화면/접근성/GIF를 재기록했다. 보완 전 감사 기록은 [pre-heading](ux-fix-20261009/evidence/codex-20261009/phase2/pre-heading/verification.json)에 별도 보존한다. 새 지원 패키지·스토리지/API/native/Release 변경은 없다.

## 웹 QA 인계와 남은 결정

- [검증 코드 웹 QA](http://127.0.0.1:4319/index.html)는 이 PC의 localhost 웹 번들이다. analytics는 disabled이며 공개 서버가 아니다. 기존4318은 Run Line PR47의 별도 코드로 보존했고 이번 QA 주소가 아니다.
- [구조 콘셉트3종](http://127.0.0.1:4320/index.html)과 [검증/한계](ux-concepts/ux-fix-20261009/README.md)를 제시했다. 코드·대표 PNG·네 화면·Lighthouse100 검증은 완료했으며 사용자 선택 전 운영 구조에 반영하지 않는다.
- 빠른 확인: 선수를 눌러 도구/색/이름12자 확인, 방향키8/Shift32와 새로고침·되돌리기, 인원/복원 확인창에서 Enter 취소, .sq 복원 오류와 저장, 패턴2단계 재생/더보기/공통 GIF, 제보 준비 실패·재시도·Esc. `.sq` 실제 개인 데이터는 먼저 백업하고 확인한다.
- Vercel 배포는 `disabled_manually`, main APK Release는 사용자가 이전에 승인한 `active` 설정으로 유지했다. 원격 main은 `c165c0b`이고 이번 작업에서 main/push/공개 배포·APK 생성·설치를 하지 않았다. main 병합은 Q5대로 사용자만 한다.
- 이번 검증은 main 기반 웹 UX다. Run Line PR47과의 통합, APK sync/unsigned/lint/실기기 T7는 이번에 실행하지 않았으며 과거 결과를 새 코드 결과로 표시하지 않는다. 실제 휴대폰·스크린리더·카카오/OS 공유 실사용·200% 확대·정상 제보 POST는 미검증이다.

1·2단계 구현/검증과3단계 콘셉트 제작은 완료했다. Push/Draft PR은 원본 H01/H02의 사용자 확인 후 진행한다. 구조 선택과 PR 확인이 남아 있다.
