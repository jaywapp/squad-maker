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

1280/1366/768/390 화면을 [실측 JSON](ux-fix-20261009/evidence/codex-20261009/phase1/verification.json)에 기록했다. 가로 넘침0, 버튼·입력·select의44px 미만0, 탭 전환 헤더 x 이동0, toast 최대560px 이내, export sheet scrollWidth≤clientWidth, 앱 콘솔 오류0이다. 캡처는 오프라인 폰트 폴백이며 실제 기기·스크린리더 실사용·200% 확대를 검증했다고 표시하지 않는다.

- [1280 배치](ux-fix-20261009/evidence/codex-20261009/phase1/squad-1280.png), [390 배치](ux-fix-20261009/evidence/codex-20261009/phase1/squad-390.png), [390 복원 오류](ux-fix-20261009/evidence/codex-20261009/phase1/restore-error-390.png).
- [Lighthouse 13.4.1 모바일 HTML](ux-fix-20261009/evidence/codex-20261009/phase1/lighthouse.report.html)·[JSON](ux-fix-20261009/evidence/codex-20261009/phase1/lighthouse.report.json): 390×844×3, Accessibility100, label-content-name-mismatch 통과.
- [저장 상태·역할 대비](ux-fix-20261009/evidence/codex-20261009/phase1/status-tags.json): 실제 저장됨 칩은 탭과 겹치지 않는다. 역할 태그 대비7.58~12.01:1, GK7.73:1. 선수 번호는10색 모두 실제 표시 크기/굵기·대비와 color 데이터 보존을 회귀로 검증했다.
- [detector1280](ux-fix-20261009/evidence/codex-20261009/phase1/detect-1280.json), [detector390](ux-fix-20261009/evidence/codex-20261009/phase1/detect-390.json): 기존 low-contrast-text, text-too-small, layout-property-transition은 검출되지 않았다. 1280은 warning2/advisory3,390은 warning2/advisory4다.

UX-D-10/UX-031의 text-occlusion은 재검출되지만 화면에 보이는 저장 칩의 결함이 아니다. 대상 `#saveStatusText`는 의도적으로1×1px/clip rect0인 `aria-live=polite` 알림이다. 실제 칩 `저장됨`은 보이고 탭과 겹치지 않는다. 알림을 제거하거나 숨김 의미를 바꾸지 않고 detector 오탐으로 기록한다. uppercase와 긴 설정 열은 기존 UI/3단계 범위이며, border+shadow/피치 줄무늬 advisory는 이번 범위에서 A 디자인을 바꾸지 않는다.

## 실패와 보완 이력

최초 desktop103통과/3실패는 최종 결과에 사용하지 않았다. 새 body fixed 제외 조건의 ID 우선순위가 한 줄 헤더를 덮어써 `:where()`로 원래 우선순위를 복구했다. native에서는 gutter를 auto로 유지했다. 트레이 색상 메뉴를 같은 click이 즉시 닫는 경로를 보완했고, 완료한 동일 touch의 실제 이동만 대상 선택에 반영했다. 취소·다른 finger·undo/저장 원본 계약은 유지했다. 영향13개 재검증 후 위 전체 회귀를 새로 실행했다.

독립 정적 리뷰를 진행했고 지적한 드래그 문구/선택 불일치를 보완했다. 기존 테스트는 공유 닫기 SVG 라벨의 선택자2곳, Android bundle allowlist의 baseURL 의존성만 좁게 바꿨다. `app/`, `api/`, Android native·설정·의존성·배포 diff는 없다.

## 남은 작업

2단계 P2-01~04는 이 동결 checkpoint 이후 진행한다. 구조 콘셉트3종은 별도 [갤러리/검증](ux-concepts/ux-fix-20261009/README.md)로 제시했고 선택 대기다. 사용자 선택 전에 3단계 구조를 운영 HTML에 반영하지 않는다. Push/PR은 원본 H01/H02의 사용자 확인 후 진행하며 main 병합은 사용자가 한다.
