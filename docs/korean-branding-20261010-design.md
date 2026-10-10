# 한글 브랜딩·네이밍 정리 설계

디자인 읽기: 축구·풋살 전술을 편집하는 코치용 Operate 도구. 승인된 night pitch/Run Line A안을 보존하고 한글 워드마크만 교체한다. impeccable/design-taste-frontend 보존형 preflight를 적용하며 새 콘셉트·프레임워크·폰트 의존성은 도입하지 않는다. DESIGN_VARIANCE3/MOTION_INTENSITY3/VISUAL_DENSITY7.

## 구현 계약

- 헤더/인트로는 `docs/branding/headcoach/assets/web`의 최종 스니펫을 의미 단위로 삽입한다. XML/SVG path·색·모션을 손으로 재작성하지 않는다. PR52 ready/getAppInfo/제보/공유·storage/좌표/undo/CAS 계약을 유지한다.
- `h1.wordmark`, `svg.wordmark-logo`, `script[data-brand-intro]` selector와 bootstrap 순서는 유지한다. 주석 예제 h1을 운영 태그로 오인하지 않는다.
- 표시 문구는 위치별 변경 목록으로 처리하며 전체 문자열 치환은 하지 않는다. font-license/provenance와 원본 assets는 보존한다.
- 기술 식별자는 승인 후 적용한다. 호환 식별자·원본/과거 문서·외부 URL은 그대로 남겨 분류한다.

## 이름·경로 대응표 초안 (미확정은 제안)

| 이전 이름/경로 | 새 이름/경로 | 상태·영향 |
|---|---|---|
| 표시명 스쿼드 메이커 | 아이엠 헤드코치 | A안 확정, UI/title/접근성/진단 |
| Android 스쿼드 메이커 Preview | 아이엠 헤드코치 Preview 또는 아이엠 헤드코치 | 모순 확인, 사용자 결정 대기 |
| package.json·lock root name squad-maker | iam-headcoach(추천) | 미확정, npm metadata/명시적 build test 참조 |
| 승인 헤더/인트로 원본 docs/branding/headcoach/assets | 같은 원본 보존; 제품 참조용 assets/branding/iam-headcoach/ 제안 | 기술 이름 승인 후, 원본 blob/출처 보존 |
| 제품용 logo-header/wordmark/intro generic 참조 | iam-headcoach-header.svg/iam-headcoach-wordmark.svg/iam-headcoach-intro.snippet.html 제안 | 확정 전 생성/교체하지 않음; source와별도 product-copy 역할 필요 여부 감사 |
| D:\station\repos\squad-maker | D:\station\repos\iam-headcoach 제안 | 이번에는 이동하지 않음; hub submodule·saved projects·cwd·worktree·server 영향/전환 절차만 |
| 작업트리 squad-maker-* | 기존 경로 보존 | 진행/과거 세션 연결을 보호; 임의 이동/삭제 없음 |
| docs/branding/run-line·headcoach·work/tasks/branding | 원본/과거 위치 보존 | 승인 provenance·도구·라이선스·역사적 링크 |
| Android ic_launcher 등 표준 resource | 유지 | 마크 디자인 동일, framework 표준명·참조 |
| packageID/storage/schema/.sq/SquadMakerContract·Platform·Ui | 유지 | 업데이트/데이터/공개 UI 연동 계약 |
| jaywapp/squad-maker·외부 공유/제보·squad-maker-latest.apk | 유지 | GitHub/운영/기존 링크; 변경 시 별도 승인 |

## 검증·전환

원본자산 해시, 최종이름 참조와 import/link/assets, 320/360/390/1280·회전/글자 확대·light/dark OS emulation, native intro mock/ready·tap·reduced/warm 상태, 전술·저장·복원·실제 PNG/GIF/SQ·공유·touchcancel 회귀를 확인한다. 최종 SHA의 전체 unit/E2E/sync/unsigned/lint를 새로 실행하며 이전 결과를 재사용하지 않는다.

활성 루트 migration은 다음 조건을 먼저 확인: 모든 target 세션/서버 종료 또는 재연결계획, 미커밋/ignored자료 백업, station .gitmodules/gitdir/core.worktree 경로·submodule branch/worktree refs, Codex/Claude saved cwd/자동화, npm/Gradle/local dependency junction. GitHub/domain rename은 분리한다. 실제 이동·hub commit·설정 변경은 이번 작업에서 실행하지 않는다. 구체 실행 절차와 미확인 사항은 영향 조사 후 보완한다.