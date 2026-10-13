# iam-headcoach 폴더 이동 작업계획

orchestrator=Codex, owner=Codex. 안전 감사·Git 판단·통합 리뷰는 고성능 Codex 모델과 high effort, 확정 문서 반영·명령 검증은 medium을 사용한다. 백업·이동·문서/PR 쓰기는 root만 수행한다. 읽기 감사 두 작업만 병렬이며 공유 Git mutation과 PC 부하가 큰 검증은 순차 실행한다.

| ID | 목표 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| M1 | 규칙·최신 문서·fresh Git/경로 확인 | Codex root | gpt-6.1-sol | high | 없음 | inspect | readonly rules/metadata/docs | source/목적지·실제 HEAD·기존 staged 경계 | 초기 확인 완료·전체 파일/metadata baseline 수집은 안전 중단 후 취소·미완료 |
| M2 | 설치 버전 공식 Git 제약 확인 | Codex reference reviewer | gpt-6.1-sol | high | M1 | audit | readonly Git official docs | submodule mv/primary 제한/부분 실패 | 완료·root 공식 매뉴얼 대조 |
| M3 | 세션·IDE·터미널·서버·빌드 사용 감사 | Codex process auditor | gpt-6.1-sol | high | M1 | audit | readonly process/app metadata | 실제 cwd/소유자·미저장/정상 종료 | 감사 완료·안전 게이트 blocked |
| M4 | 로컬 백업 권한·Git 제외·복구 검증 | Codex root | gpt-6.1-sol | high | M3 | backup | 별도 안전 로컬 backup/manifest | tracked/untracked/ignored 및 Git metadata | 미실행·blocked |
| M5 | Git mv dry-run·단일 이동 | Codex root | gpt-6.1-sol | high | M2,M3,M4 | move | primary path/hub target index/.gitmodules/config | baseline 보존·목적지 충돌 없음 | 미실행·blocked |
| M6 | 새 primary와 linked 11 자료·연결 검증 | Codex root | gpt-6.1-sol | high | M5 | preserve | readonly new primary/all linked | HEAD/branch/remote/index/gitlink/metadata·파일 비교 | 미실행·blocked |
| M7 | 새 위치 회귀·Android·참조·서버/연결 | Codex root | gpt-6.1-sol | medium | M6 | verify | 새 cwd generated ignored evidence | unit/전체 E2E/bundle/sync/unsigned/lint/화면·MCP/IDE | 미실행·blocked |
| M8 | 기록·범위 리뷰·같은 Draft54 갱신 | Codex root/reviewer | gpt-6.1-sol | high | M2,M3 및 실제 결과 | finish | 본 migration docs/docs index·필수 path delta | diff/링크·Draft/base/일반 push | 문서 리뷰 완료·Git/PR 상태 기록 처리 중; migration 완료와 구별 |

긴 명령은 기존 session ID를 기다리고 재실행하지 않는다. 안전 중단 시 M4~M7은 미실행/blocked로 유지하며 과거 c93 CI를 새 위치 성공으로 표시하지 않는다. [결과·복구](iam-headcoach-migration-20261011-report.md)에 실제 단계별 상태를 남긴다.
