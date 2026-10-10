# 편집 데스크 운영 적용 작업계획

orchestrator=Codex, owner=Codex. 사용자 선택① 확정(2026-10-10). 기존 PR50과 main 완료 상태를 보존하며 새 branch `codex/editing-desk-20261010`에서 수행한다.

| ID/목표 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|
| D0 선택·기준·세 문서 | Codex root | gpt-6.1-sol | high | 사용자①선택 | setup | docs/editing-desk-20261010-*.md, docs/README.md | main/base·보존·범위/계약 확인 | 완료 |
| R0 좌표/출력 계약·원본구조 검토 | Codex ux_risk_review / ux_concepts | gpt-6.1-sol | high | D0 | readonly-independent | 읽기 전용 | 불변식·projection·파일목록·출력 경계 | 완료 |
| U1 ①구조·수평 입력/렌더·출력헤더 | Codex ux_implementation | gpt-6.1-sol | high | D0,R0 | implementation-sequential | index.html 단독 소유 | 네 viewport·기존 계약·실제PNG/GIF | 완료 |
| T1 의미 있는 신규 회귀 | Codex root | gpt-6.1-sol | high | D0,구현 인터페이스 확인 | tests-independent | tests/e2e/editing-desk-20261010.spec.js | 좌표·전체저장·undo·실제파일·뷰어 | 신규14개 × 두 환경 =28회 전체 회귀 내 통과 |
| R1 독립 diff 리뷰 | Codex ux_risk_review | gpt-6.1-sol | high | U1 | review | 읽기 전용 | mutation·projection·focus·bounds·failure | 최종482817af 독립 리뷰 완료 |
| V1 전체 회귀/웹 bundle | Codex root | gpt-6.1-sol | high | U1,T1,R1 | verification-sequential | .work/ 로그 | unit→bundle→desktop→mobile,workers1 | 최종 unit128 / E2E253 / skip1 / bundle 통과 |
| V2 실제 화면/출력/접근성 | Codex root | gpt-6.1-sol | high | U1,T1 | visual-batch | docs/editing-desk-20261010/evidence | 1280/1920/390/844×390·PNG/GIF·Lighthouse | 최종 네뷰 failures0, 실제 출력/좌표/GIF 프레임·Lighthouse100, 잔여 detector 경고 기록 |
| V3 Android sync/unsigned/lint | Codex root | gpt-6.1-sol | high | U1,R1,V1 | native-verification | ignored Android build/.work 로그 | 기존 JBR21/SDK36/Gradle cache, 서명 없음 | 최종 sync/unsigned/lint 성공,0errors/13warnings |
| H1 결과/이슈/검증자료 | Codex root | gpt-6.1-sol | medium | V1,V2,V3 | handoff | 위3문서,report,이슈상태 | 실제·미검증·경고·새코드SHA | 검증·인계 문서 완료 |
| G1 로컬 checkpoint·검증된Git게시 준비 | Codex root | gpt-6.1-sol | medium | H1 | final | 작업범위 파일/.work PR본문 | 기존git규칙·사용자확인경계 | 실행 자료·PR 본문 준비 완료, 기존 동일 UX 병합 승인에 따라 Git 게시 진행 |

단일 index의 DOM·투영·export 경로가 엮이므로 U1은 한 구현자가 순차 수정한다. root는 같은 index를 동시에 수정하지 않고 테스트/문서/검증을 소유한다. R0/R1은 읽기만 한다. 새 서명키·계정·인증정보·기기 설치·main 직접 커밋·브랜치 삭제·force push는 하지 않는다. push/PR/main 병합은 이번 새 결과가 준비된 뒤 명시적 승인 범위에 따라 처리한다.

## 실제 실행 기록

- 초기 `index.html` SHA-256 `484c36a0b0682651f943d945050b244ec3bfb57d1c804784330ac430971fd5a8`: 신규 desktop 9개 중 5개 통과/4개 실패. 이름표가 다른 선수 원을 가리는 실제 입력 문제와 잘못된 파일명 기대, 마우스 정수 이벤트 좌표 기대, hash-only 뷰어 준비 문제를 구분해 보완했다.
- 독립 리뷰의 미완료 이동 autosave 저장, 숨겨진 live 필드 PNG clone, 파일 목록 focus 3건을 보완했다. 회귀는 실제 파일의 선수 색 픽셀까지 확인하며 넓은 좌표 허용치로 실패를 숨기지 않는다.
- 다음 SHA-256 `ece340961dabe68fe128a5a2649113856ea0ee9f4f75e6a0088dad5677a9dce5`: 신규 11개×desktop/mobile=22개 모두 통과(37.2초). 실제 단일/전체 GIF, 숨겨진 모드 PNG, pending 이동→미완료 touch→회전 취소→reload/undo를 포함한다.
- 같은 코드의 첫 실제 캡처에서 overflow/콘솔/사용자색/이름12px/번호19px/DPR/뷰어/실제 PNG1200×1830·GIF480×732 통과. 일부44px 대상과 인원변경 뒤 가로 live field/wrapper의 배율 불일치는 실패했다. `ignored .work/editing-desk-20261010/evidence/first`는 이 이전 실패 코드의 증거이며 최종 결과로 재사용하지 않는다.
- 후속 독립 리뷰에서 blur/hidden/pagehide 동안 보류 저장 누락·gesture waiter 정체를 확인했다. 해당 lifecycle와 9↔11 전체 피치 치수 회귀 2개를 추가했다. OS 실제 백그라운드/프로세스 종료 데이터 보존은 이 DOM 이벤트 회귀와 구분한다.


## 최종482817af 실행 완료

원본 SHA-256 `482817af0dfebed4f68c640ebfb16eb67c224b2169b1bacde67de4a05c824413`, index blob `69ce8ab8af687eca527aecd6e153bbf6f5e6d054`, test blob `b9c5d8e45ba6942f9124d1691b9f9bfa6b7af545`. 최종 단위128·E2E253(127/126, 기존skip1,7.1분)·sync/bundle·unsigned·lint0errors/13warnings·네뷰 캡처/출력 디코딩·모바일/desktop Lighthouse100을 새로 실행했다. [인계 기록](editing-desk-20261010-report.md)에 경고·실기기 미검증·unsigned 설치 금지·증거·새 게시 승인 경계를 정리했다. 이후 index/test 수정0.
