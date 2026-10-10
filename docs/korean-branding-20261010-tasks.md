# 한글 브랜딩·네이밍 작업 계획

orchestrator=Codex, owner=Codex. 조사·통합/리뷰 gpt-6.1-sol/high, 확정 구현/회귀 gpt-6.1-sol/medium을 기본으로 하며 이번 독립 영향/자산 감사는 복잡한 호환성 판단으로 high. 같은 파일은 순차 소유권 반환, Git은 root만 수행.

| ID | 작업 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| N1 | main/PR52/53·로컬 보존 | Codex | gpt-6.1-sol | high | 없음 | inspect | readonly Git | HEAD/status/worktrees | 완료 |
| N2 | 승인 자산·모순 감사 | Codex | gpt-6.1-sol | high | N1 | inspect | docs/branding readonly | final A/원본/폰트/반영표 | 완료 |
| N3 | 네이밍/경로 영향·기술 ID 결정 | Codex | gpt-6.1-sol | high | N1 | inspect | readonly refs/docs | 대응표/보존 경계/질문 | 기술·표시명 답변 대기 |
| N4a | 승인된 한글 웹 UI 적용 | Codex launch_function_audit | gpt-6.1-sol | high | N2 | implement | index.html 단독 | JS/계약 보존·A 스니펫 | 완료·선행 QA16+intro2 통과 |
| N4b | Android 채널 표시 적용 | Codex root | gpt-6.1-sol | medium | N3 | implement | capacitor/strings | 답변·package 불변 | blocked(Preview 답변 필요) |
| N5 | 내부 프로젝트/제품 자산 이름 정리 | Codex | gpt-6.1-sol | medium | N3 | implement | package/scripts/tests/refs/docs | broken refs/호환키 불변 | blocked(답변 필요) |
| N6 | 루트 전환·남은 이름 분류 | Codex | gpt-6.1-sol | high | N3 | docs | docs | 전체치환없음/미확인명시 | 완료·실제이동없음 |
| N7 | 새 화면/전체 회귀/Android/lint | Codex | gpt-6.1-sol | medium | N4a,N4b,N5 | verify | tests/ignored evidence | 최종SHA fresh checks | 대기 |
| N8 | 보고·commit/push·stacked Draft | Codex | gpt-6.1-sol | high | N6,N7 | final | docs/Git/PR | scope/정확SHA/무배포 | 대기 |

main/Release/Play/signAPK/install·root/worktree 이동·forcepush·브랜치 삭제 없음. 광고/계정/키/외부 링크·관련없는 변경 보존. 상표 사용자 참고 결과를 법적 결론으로 바꾸지 않는다.
N4a는 구/새 인트로 JS 동일성·PR52 편집기 보존을 함께 판별하는 복잡한 선택 통합이라 high, 테스트 설계는 작은 화면/글자 확대 회귀 판단으로 high. launch_brand_audit는 지정 tests 3개, launch_feedback_audit는 naming 문서만 소유하며 실행/서버 시작 없이 root에 반환한다.

최종 검증은 commit 후 순차 실행하고 정확 SHA·결과·Draft 상태를 PR 본문 및 .work/korean-branding-20261010/final에 기록한다. N3/N4b/N5는 두 질문의 답변이 없으면 미완료로 남기며, 확정 UI와 검증·문서·Draft를 진행한다. 이 계획 문서가 모든 단계 완료를 뜻하지 않는다.
