# UI/UX 리디자인 — 작업

- orchestrator: Claude

| id | 작업 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| T1 | 현 UI·UX 점검 문서 확인, 스크린샷 | Claude | opus | medium | — | A | — | 1280/390 스크린샷 | done |
| T2 | 공통 코어 작성 | Claude | opus | medium | T1 | A | `docs/ux-concepts/ui-redesign/shared/core.js` | 3개 시안에서 동작 | done |
| T3 | 시안 01 자석 전술판 | Claude | opus | high | T2 | B | `concept-01/*` | 스크린샷·넘침·콘솔 | done |
| T4 | 시안 02 매치데이 중계 | Claude | opus | high | T2 | B | `concept-02/*` | 스크린샷·넘침·콘솔 | done |
| T5 | 시안 03 전술 워크스페이스 | Claude | opus | high | T2 | B | `concept-03/*` | 스크린샷·넘침·콘솔 | done |
| T6 | 아티팩트 게시 | Claude | opus | low | T3–T5 | C | — | 링크 확인 | done |
| T7 | 1차 시안 피드백 기록 | Claude | opus | low | T6 | D | `ui-redesign-*.md` | 사용자 답변 | done (전부 반려) |
| T7a | 2차 시안 3종(모던 스포츠·프리미엄 다크·미니멀 라이트) 제작·게시 | Claude | opus | high | T7 | D | `ux-concepts/ui-redesign-v2/*` | 390/1280 스크린샷·넘침·콘솔 | done |
| T7b | 2차 시안 선택·피드백 기록 | Claude | opus | low | T7a | D | `ui-redesign-*.md` | 사용자 답변 | blocked |
| T8 | 운영 `index.html` 반영 계획 확정 | Claude | opus | high | T7b | E | `ui-redesign-design.md` | 사용자 확인 | blocked |

비고: T3–T5는 같은 공통 코어를 공유하지만 파일이 분리되어 병렬 가능하다. 이번에는 사용자가 서브에이전트 사용을 요청하지 않아 부모 세션에서 순차 작성했다.
