# iam-headcoach Preview 후속 작업계획

orchestrator=Codex, owner=Codex. 명칭/문서 구현은 gpt-6.1-sol/medium, Git/submodule 전환·계약 리뷰는 high. 기존 기술명·A UI/자산이 확정되어 새 디자인 선택은 필요 없다.

| ID | 목표 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| P1 | 최신 main/PR52/54·로컬 지침/보존 확인 | Codex root | gpt-6.1-sol | medium | 없음 | inspect | readonly Git/docs | 상태·기준 SHA·중복 PR 없음 | 완료 |
| P2 | 선행 이름/경로 대응표·채널 설계 | Codex root | gpt-6.1-sol | medium | P1 | plan | 본 analysis/design/tasks | 명시 사용자 결정/보존 경계 | 완료 |
| P3 | Preview 라벨3곳·현재 안내 반영 | Codex root | gpt-6.1-sol | medium | P2 | implement | capacitor/strings/README/docs index·통합 docs | metadata whitelist·채널 ref·링크 | 완료·표시값/164링크/범위 리뷰 통과 |
| P4 | 옛 이름/경로·현재 문서·참조 분류 | Codex naming auditor | gpt-6.1-sol | medium | P2 | audit | readonly source + name-audit.md 단독 | 필요한 현재 변경/보존 이유·missing assets | 완료·원본9 동일/README30링크/QA3ref |
| P5 | 폴더·세션/서버/WT/Git 연결 감사/전환 절차 | Codex folder auditor | gpt-6.1-sol | high | P2 | audit | readonly metadata + folder-transition.md 단독 | 실제 이동가능성·재개/재검증 절차·미확인 | 완료·전환 문서/actual 이동 미실행 |
| P6 | 결과 통합·독립 범위 리뷰 | Codex root/reviewer | gpt-6.1-sol | high | P3,P4,P5 | review | readonly delta/current docs | 원본/코드/ID·data/ads·hub/roots 보존 | 완료·독립 리뷰 findings0 |
| P7 | commit 후 새 full 검증 | Codex root | gpt-6.1-sol | medium | P6 | verify | ignored .work/iam-headcoach-preview-20261010/final | SHA시작/끝·unit/E2E/sync/unsigned/lint/label | 최종 commit 후 순차 실행·완료 기록은 PR54/stage JSON |
| P8 | push·같은 Draft54 update·CI 결과/인계 | Codex root | gpt-6.1-sol | medium | P7 | finish | Git/PR/ignored evidence | exactHEAD/Draft/ReleaseSKIPPED/결과 | fresh 검증 후 같은 Draft54 갱신 |

P4/P5는 다른 단일 파일만 작성하고 원본 docs/branding·제품 자산·current docs는 root만 소유한다. readonly 검색과 metadata 감사는 병렬, 빌드/E2E는 PC 리소스 때문에 workers1/retries0로 순차 실행한다. root는 agents 소유 파일을 완료 전 수정하지 않으며 Git/PR 쓰기는 root만 한다. 모든 실제 결과·최종 SHA·완료 상태는 commit 후 PR54 및 새 ignored stage JSON에 기록한다. source 작업표는 commit 시점의 계획이며 이전 완료 결과를 새 검사로 치환하지 않는다.
