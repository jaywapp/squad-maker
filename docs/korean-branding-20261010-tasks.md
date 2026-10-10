# 한글 브랜딩·네이밍 작업 계획

> 이전 PR54 단계의 결정·검증 이력이다. 최신 사용자 지시로 테스트 Android 라벨은 **아이엠 헤드코치 Preview**, 기술명은 **iam-headcoach**, 정식 브랜드는 **아이엠 헤드코치**다. 현재 적용은 [후속 기준](iam-headcoach-preview-20261010-analysis.md)·[대응표](iam-headcoach-preview-20261010-design.md)·[폴더 전환](iam-headcoach-preview-20261010-folder-transition.md)을 따른다. 이 문서의 과거 plain Android 결정과 PR47/상표 선행 조건을 현재 gate로 적용하지 않는다.

orchestrator=Codex, owner=Codex. 조사·통합/리뷰 gpt-6.1-sol/high, 확정 구현/회귀 gpt-6.1-sol/medium을 기본으로 하며 이번 독립 영향/자산 감사는 복잡한 호환성 판단으로 high. 같은 파일은 순차 소유권 반환, Git은 root만 수행.

| ID | 작업 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| N1 | main/PR52/53·로컬 보존 | Codex | gpt-6.1-sol | high | 없음 | inspect | readonly Git | HEAD/status/worktrees | 완료 |
| N2 | 승인 자산·모순 감사 | Codex | gpt-6.1-sol | high | N1 | inspect | docs/branding readonly | final A/원본/폰트/반영표 | 완료 |
| N3 | 네이밍/경로 영향·기술 ID 결정 | Codex | gpt-6.1-sol | high | N1 | inspect | readonly refs/docs | 대응표/보존 경계/질문 | 완료·iam-headcoach/표시명 plain 확정 |
| N4a | 승인된 한글 웹 UI 적용 | Codex launch_function_audit | gpt-6.1-sol | high | N2 | implement | index.html 단독 | JS/계약 보존·A 스니펫 | 완료·선행 QA16+intro2 통과 |
| N4b | Android 채널 표시 적용 | Codex root | gpt-6.1-sol | medium | N3 | implement | capacitor/strings | 답변·package 불변 | 완료·user 답변 적용 |
| N5 | 내부 프로젝트/제품 자산 이름 정리 | Codex | gpt-6.1-sol | medium | N3 | implement | package/scripts/tests/refs/docs | broken refs/호환키 불변 | 완료·metadata/제품 파일명 적용 |
| N6 | 루트 전환·남은 이름 분류 | Codex | gpt-6.1-sol | high | N3 | docs | docs | 전체치환없음/미확인명시 | 완료·실제이동없음 |
| N7 | 새 화면/전체 회귀/Android/lint | Codex | gpt-6.1-sol | medium | N4a,N4b,N5 | verify | tests/ignored evidence | 최종SHA fresh checks | 대기 |
| N8 | 보고·commit/push·stacked Draft | Codex | gpt-6.1-sol | high | N6,N7 | final | docs/Git/PR | scope/정확SHA/무배포 | Draft54 생성 완료·명칭 후속 검증/갱신 진행 |

main/Release/Play/signAPK/install·root/worktree 이동·forcepush·브랜치 삭제 없음. 광고/계정/키/외부 링크·관련없는 변경 보존. 상표 사용자 참고 결과를 법적 결론으로 바꾸지 않는다.
N4a는 구/새 인트로 JS 동일성·PR52 편집기 보존을 함께 판별하는 복잡한 선택 통합이라 high, 테스트 설계는 작은 화면/글자 확대 회귀 판단으로 high. launch_brand_audit는 지정 tests 3개, launch_feedback_audit는 naming 문서만 소유하며 실행/서버 시작 없이 root에 반환한다.

최종 검증은 commit 후 순차 실행하고 정확 SHA·결과·Draft 상태를 PR 본문 및 ignored 증거 디렉터리에 기록한다. 2026-10-10 답변으로 N3 차단을 해소했다. 이번 새 이름 적용 결과는 naming-final에 분리하고 이전 final은 이력으로 보존한다.

## 확정 이름 후속 단계

| ID | 작업 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| N9 | npm/Android 확정 이름·현재 문서 반영 | Codex root | gpt-6.1-sol | medium | N3 | naming | package/lock/capacitor/strings/통합 docs | 허용 metadata·호환 값 불변 | 완료·정적 계약 검증/독립 리뷰 통과 |
| N10 | 승인 제품 파일명·QA 자산 참조 | Codex brand_names | gpt-6.1-sol | medium | N3 | naming | assets/branding/iam-headcoach, tests/e2e/korean-branding-20261010.spec.js | 원본9개 hash·경로·구문 | 완료·원본9개 동일/README29링크/구문 통과 |
| N11 | 최종 범위 리뷰 | Codex readonly reviewer | gpt-6.1-sol | high | N9,N10 | review | readonly delta | 이름·소유권·원본/공개 계약 | 완료·독립 읽기 리뷰 findings0 |
| N12 | commit 후 전체 fresh 검증·Draft54 갱신 | Codex root | gpt-6.1-sol | medium | N11 | verify | ignored naming-final/Git/PR | 새SHA unit/E2E/sync/unsigned/lint/CI | 최종 commit 후 순차 실행·완료 집계는 PR54/ignored 기록 |

원본·공개 계약을 제외한 기술 이름 결정은 완료다. 구현은 medium이며 source hash/호환성 범위를 함께 비교하는 최종 리뷰만 high. N9/N10은 다른 파일만 수정, root는 agent 완료 전 그 파일을 수정하지 않는다. 빌드/E2E는 PC 리소스를 위해 순차 실행한다.
