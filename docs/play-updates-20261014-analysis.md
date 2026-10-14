# Google Play 업데이트 준비 분석

2026-10-14. orchestrator=Codex. 현재 범위는 로컬 구현·검증·문서화다. commit/push/PR/merge/배포/스토어/키/기기 설치는 승인되지 않았다.

후속: 사용자가 같은 날 commit/push/merge/배포 준비를 승인했다. 위 문장은 최초 로컬 단계의 범위이며, 현재 Git 작업은 [후속 승인·계획](play-updates-merge-prep-20261014-analysis.md)을 따른다. 실제 배포/키·서명/제출/설치는 계속 별도 단계다.

## 기준·소유권·보존

- 확인한 main/PR57 merge: `9e41887532f59606d87924346dcbc4957446a098`.
- 정식 identity 원본: `D:\station\.worktrees\iam-headcoach-production-identity-20261014`, `feat/production-identity-20261014`, HEAD9e418875. Codex 완료 문서와 미커밋 identity/광고 보호 변경이 있다. 원본 활성 세션과 경로의 연관은 미확인이라 원본을 수정하거나 빌드하지 않는다.
- 작업 사본: `D:\station\.worktrees\iam-headcoach-updates-feedback-20261014`, `feat/updates-feedback-20261014`. 처음 요청 범위의 이름은 작업 경로·브랜치에만 남긴다. 사본은 main9e 기반이며 원본 code/docs21파일을 해시가 일치하는 검증 사본으로 재사용했다. 키/환경/빌드 산출물은 복사하지 않았다. 목록은 `.work/updates-feedback-20261014/identity-snapshot.json`이다.
- 재사용한 identity: `com.jaywapp.iamheadcoach`, versionCode1, versionName1.0.0. Preview 기존 package·버전 증가 규칙·서명 계보·저장키/.sq 형식을 유지한다. TEEN/PPT OFF/G 및 더 강한 CHILD 보호와 운영 광고 차단 게이트를 유지한다.
- 기본 저장소의 main27a34ca9/기존 `.ux-review`와 서버4317~4319는 그대로 둔다. 자체 E2E는4327만 사용한다. GitHub Actions/자동 배포를 켜지 않는다.

## 사용자 변경 지시

최초 업데이트와 제보 보강 요청 뒤 사용자가 **“아니다 제보기능 하지마”**, **“Vercel supabase 사용 불가”**라고 범위를 변경했다. 제보 기능 보강/API 복구/Issue Forms/영속 저장소/두 플랫폼 설정 준비를 취소했다. 이번에 추가했던 제보 UI·client 변경을 걷어내고 기존 구현을 보존했다. 새 schema/store/SQL/forms/플랫폼 설정 파일은 없다. 앞서 제시한 영속 저장소/Vercel 정보 질문은 철회하며 답변이 필요하지 않다.

앞선 읽기 전용 조사에서는 공개 제보 URL의 GET404/HTML을 확인했으나 실제 운영 접수나 복구를 수행하지 않았다. 이번 업데이트 완료 범위와 별개인 기존 상태다.

## 확정된 업데이트 요구사항

- 정식 Android 앱에서 Google Play의 flexible만 사용한다. Play 사용자 설정에 따른 자동 업데이트와 앱의 안내/사용자 동의 다운로드를 구분한다. 자동 설치를 강제·보장하지 않는다.
- `com.jaywapp.iamheadcoach` + release + Play 설치 출처에서만 SDK를 사용한다. Preview/web/debug는 Play 요청0이다.
- 새 버전 안내 → 다운로드 동의 → 다운로드 진행/복귀 → 저장 확인 후 사용자 선택 재시작. immediate는 구현하지 않는다.
- 취소/닫기는 같은 버전 자동 알림을 억제하고 수동 확인으로 다시 시도한다. 오프라인/실패/진행 상태와 늦은 callback을 처리한다. 자동 `completeUpdate`는 없다.
- 최신 snapshot/revision/active file 저장 및 native write/readback 영수증이 검증되어야 설치 재시작한다. drag/경로 입력/재생/export/mutation/readOnly/no active file에서는 차단한다. 데이터 삭제나 초기화로 해결하지 않는다.
- Preview 링크는 기존 GitHub Releases 정보 페이지까지만 제공한다. 신규 APK의 검증된 다운로드·버전 비교는 이번에 수행하지 않았으며 외부 APK 자체 업데이트는 없다.

## 검증 기준·미확인 사항

fresh JS unit, desktop/mobile E2E, Android bundle/sync, 두 채널 unsigned release·정식 AAB·lint를 검증한다. 로컬 fake와 순수 정책 unit은 실제 Play/Activity/실기기 성공으로 보고하지 않는다. 실제 Play 검증은 같은 package·서명, 더 높은 versionCode의 Play 배포 빌드와 테스트 계정/기기가 필요하며 별도 승인 대기다. 기존 키 접근/Play App Signing/업로드 키 확정은 이번에 진행하지 않는다.
