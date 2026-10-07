> **이력 문서**: 이 파일의 선택 대기·범위·추천은 당시 기록입니다. 현재는 A가 선택되었고 B/C는 선택되지 않았습니다. 최신 기준은 [상품 기획서](../../product-plan.md)입니다.

# UX 개편 계획과 시안 3종: 작업

- slug: `ux-redesign-20261007` · [분석](ux-redesign-20261007-analysis.md) · [설계](ux-redesign-20261007-design.md)
- orchestrator: Claude (모든 작업 owner는 Claude)
- 모델 배정: 설계·리뷰·통합 검증은 opus, 확정 스펙 구현·테스트는 sonnet, 단순 측정은 haiku. 시안 제작은 디자인 판단이 커서 opus(designer 역할)로 배정했다.

## 이번 단계 (계획과 시안)

| ID | 작업 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| P0 | 저장소 상태·규칙·검토 문서 확인, 공통 데모 상태 작성 | Claude | opus | medium | - | g0 | `docs/ux-redesign-20261007/claude/shared/state.js` | 세 시안에 같은 블록이 들어갔는지 비교 | done |
| P1 | 분석·설계·작업 문서 작성 | Claude | opus | high | P0 | g1 | `docs/ux-redesign-20261007-*.md` | 단계별 문제·범위·의존성·완료 기준 존재 | done |
| C1 | 시안 A 나이트피치 | Claude | opus | high | P0 | g1 | `.../concept-01/index.html` | 렌더링 점검(V1) | done |
| C2 | 시안 B 데이라이트코치 | Claude | opus | high | P0 | g1 | `.../concept-02/index.html` | 렌더링 점검(V1) | done |
| C3 | 시안 C 택틱스스튜디오 | Claude | opus | high | P0 | g1 | `.../concept-03/index.html` | 렌더링 점검(V1) | done |
| V1 | 360×800·1366×768 렌더링, 넘침·가림·대비·포커스·48px 측정, 스크린샷 | Claude | opus | medium | C1, C2, C3 | g2 | `.../screenshots/*.png` | 측정 결과를 비교 페이지와 README에 기록 | done (1차 측정 후 A 2회, B·C 1회 수정 뒤 재측정) |
| D1 | 비교 페이지·README 작성, 아티팩트 게시 | Claude | opus | medium | V1 | g3 | `.../index.html`, `.../README.md` | 아티팩트에서 세 시안이 열리는지 확인 | done |

C1~C3은 서로 다른 파일만 쓰므로 병렬로 실행했다. V1은 세 시안이 모두 끝난 뒤에 같은 브라우저로 한 번에 측정한다(브라우저를 공유하므로 병렬 측정하지 않는다).

## 다음 단계 (사용자 승인 뒤, 지금은 blocked)

| ID | 단계 | 작업 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|---|
| S1-1 | 1 | 인원 변경 보호(확인 조건 확대, 되돌리기) | Claude | sonnet | medium | 승인 | s1 | `index.html`, `tests/` | 설계 1단계 ①~④ | blocked |
| S1-2 | 1 | 초기화 되돌리기 | Claude | sonnet | low | 승인 | s1 | `index.html`, `tests/` | 설계 1단계 ⑤ | blocked |
| S1-3 | 1 | `.sq` 복원 확인·저장·되돌리기 | Claude | sonnet | medium | 승인 | s1 | `index.html`, `tests/` | 설계 1단계 ⑥ | blocked |
| S1-4 | 1 | 저장 실패 경고 | Claude | sonnet | low | 승인 | s1 | `index.html`, `tests/` | 설계 1단계 ⑦ | blocked |
| S1-R | 1 | 1단계 코드 리뷰 | Claude | opus | high | S1-1~4 | s1r | - | 리뷰 결과 문서화 | blocked |
| S2-0 | 2 | 실제 Android 기기에서 탭 선택(R1) 재현 | 사용자 또는 Claude(기기 연결 시) | - | - | 승인 | s2 | 점검 기록 | 기기·OS·브라우저 버전과 결과 | blocked |
| S2-1 | 2 | 이름 정리, 내보내기 성공·실패·취소 피드백, 저장 상태 표시 | Claude | sonnet | medium | S1-R | s2 | `index.html`, `tests/` | 설계 2단계 ③⑤ | blocked |
| S2-2 | 2 | 내보내기·공유 시트, 선택 도구 배치 | Claude | sonnet | high | S1-R, Q1 | s2b | `index.html`, `tests/` | 설계 2단계 ①② | blocked |
| S3-1 | 3 | 선택 테마 적용 | Claude | sonnet | high | S2-2, Q1 | s3 | `index.html`, `tests/` | 설계 3단계 ①~⑤ | blocked |
| S4-1 | 4 | 내보내기 라이브러리 로컬 포함, 오프라인 검증 | Claude | sonnet | medium | S2-1 | s4 | `index.html`, vendor 파일 | 설계 4단계 ① | blocked |
| S4-2 | 4 | Android 기기 점검표 수행 | 사용자 또는 Claude | - | - | S3-1 | s4 | 점검 기록 | 설계 4단계 ②③ | blocked |
| S5-1 | 5 | 광고 자리 예약, 슬롯 구조 검토 | Claude | opus | high | S3-1, Q2, Q6 | s5 | 설계 문서 | 설계 5단계 ①~③ | blocked |

S1-1~S1-4는 모두 `index.html`을 수정하므로 같은 그룹이지만 **순차로** 실행한다(같은 파일 동시 수정 금지). S2-0은 코드 변경이 없어 S1과 병렬로 할 수 있다.
