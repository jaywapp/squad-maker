# 커밋·병합·배포 준비 작업표

orchestrator=Codex. 원본 identity/다른 세션은 보존한다. Git 실행은 root만 맡는다.

| 작업 | owner/model/effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|
| R0 상태·권한·원본 보존 | Codex/current/high | 없음 | setup | analysis/design/tasks | main/PR/hash/Actions/Pages/branches | 완료 |
| R1 cold-start metadata 회귀 보정 | Codex/gpt-6.1-sol/high | R0 | native | FlexibleUpdatePolicy/UpdatesPlugin/test | lifecycle/version0/listener/stale query/Java | 완료,Java53/53 |
| R2 공개 diff·보안 리뷰 | Codex/gpt-6.1-sol/high | R0/R1 | review | 읽기 전용 | 승인 범위/키 부재/제보 원복/원본hash | 완료,남은 확정Medium이상 없음 |
| R3 수동 release 준비 감사 | Codex/gpt-6.1-sol/high | R0 | release | 읽기 전용 | 정확 task/광고 gate/키·Play 대기 | 완료 |
| G1 source·문서2 commit | Codex/current/high | R1/R2 | git | 승인 identity21 및 update/doc files | staged whitelist/diff/clean tree | 진행 |
| G2 최종 feature source 로컬 검증 | Codex/current/high | G1 | verification | .work evidence | unit/E2E/Android/metadata | 대기 |
| G3 push/Draft PR/일반 merge | Codex/current/high | G2 | git | remote branch/PR/main | matching head/base/CI disabled/no deploy | 대기 |
| G4 merge source 산출물/인계 | Codex/current/high | G3 | verification | local unsigned artifacts/checklist | merge SHA/clean/new Preview metadata/hash | 대기 |

새 자격증명/키/서명/기기 설치/공개 Release/스토어 업로드/Vercel/Supabase 설정을 수행하지 않는다. 기존43xx서버/원본index를 변경하지 않는다. `.work` 증거와 APK/AAB는 Git stage 대상에서 제외한다.
