# 한글 브랜딩·네이밍 정리 설계

> 이전 PR54 단계의 결정·검증 이력이다. 최신 사용자 지시로 테스트 Android 라벨은 **아이엠 헤드코치 Preview**, 기술명은 **iam-headcoach**, 정식 브랜드는 **아이엠 헤드코치**다. 현재 적용은 [후속 기준](iam-headcoach-preview-20261010-analysis.md)·[대응표](iam-headcoach-preview-20261010-design.md)·[폴더 전환](iam-headcoach-preview-20261010-folder-transition.md)을 따른다. 이 문서의 과거 plain Android 결정과 PR47/상표 선행 조건을 현재 gate로 적용하지 않는다.

디자인 읽기: 축구·풋살 전술을 편집하는 코치용 Operate 도구. 승인된 night pitch/Run Line A안을 보존하고 한글 워드마크만 교체한다. impeccable/design-taste-frontend 보존형 preflight를 적용하며 새 콘셉트·프레임워크·폰트 의존성은 도입하지 않는다. DESIGN_VARIANCE3/MOTION_INTENSITY3/VISUAL_DENSITY7.

## 구현 계약

- 헤더/인트로는 `docs/branding/headcoach/assets/web`의 최종 스니펫을 의미 단위로 삽입한다. XML/SVG path·색·모션을 손으로 재작성하지 않는다. PR52 ready/getAppInfo/제보/공유·storage/좌표/undo/CAS 계약을 유지한다.
- `h1.wordmark`, `svg.wordmark-logo`, `script[data-brand-intro]` selector와 bootstrap 순서는 유지한다. 주석 예제 h1을 운영 태그로 오인하지 않는다.
- 표시 문구는 위치별 변경 목록으로 처리하며 전체 문자열 치환은 하지 않는다. font-license/provenance와 원본 assets는 보존한다.
- 기술 식별자는 사용자 확정 답변에 따라 적용한다. 호환 식별자·원본/과거 문서·외부 URL은 그대로 남겨 분류한다.

## 확정 이름·경로 대응표

| 이전 이름/경로 | 새 이름/경로 | 상태·영향 |
|---|---|---|
| 스쿼드 메이커 웹 표시 | 아이엠 헤드코치 | A안 적용, 기존 헤더·인트로 보존 |
| Android 스쿼드 메이커 Preview | 아이엠 헤드코치 | 사용자 확정, appName/두 표시 문자열만 변경 |
| package.json/lock root squad-maker | iam-headcoach | 사용자 확정, private metadata3곳, 의존성 불변 |
| 제공 SVG/snippet generic 명칭 | assets/branding/iam-headcoach/iam-headcoach-* | 최종 파일의 동일 내용 제품 전달본9개, QA·문서 참조 갱신 |
| docs/branding/headcoach/assets | 원본 경로 보존 | 제작·승인·폰트/라이선스 출처·hash 검증 근거 |
| D:\station\repos\squad-maker | 향후 D:\station\repos\iam-headcoach | 이름 확정, 현재 이동하지 않음·안전 전환 절차 유지 |
| 기존 squad-maker-* worktree/과거 문서 | 기존 경로·이름 보존 | 세션·자료·과거 기록 유지 |
| Android ic_launcher·resource ID | 유지 | 표준 참조·같은 승인 마크 |
| packageID/키/저장키/schema/.sq/globals·events | 유지 | 설치·데이터·UI/native 계약 |
| GitHub/host/domain/공개 APK basename | 유지 | 별도 승인·외부 계약 |

새 제품 파일은 최종 원본의 byte-identical 사본이다. 디자인을 생성하거나 기존 인라인을 외부 img로 바꾸지 않는다. public 앱 동작은 동일하며 명명된 전달본과 테스트에서 검증한 SVG를 후속 작업에 재사용한다. 제품 파일 README가 원본/출처·라이선스·사용 위치를 연결한다.

## 검증·전환

원본자산 해시, 최종이름 참조와 import/link/assets, 320/360/390/1280·회전/글자 확대·light/dark OS emulation, native intro mock/ready·tap·reduced/warm 상태, 전술·저장·복원·실제 PNG/GIF/SQ·공유·touchcancel 회귀를 확인한다. 최종 SHA의 전체 unit/E2E/sync/unsigned/lint를 새로 실행하며 이전 결과를 재사용하지 않는다.

활성 루트 migration은 다음 조건을 먼저 확인: 모든 target 세션/서버 종료 또는 재연결계획, 미커밋/ignored자료 백업, station .gitmodules/gitdir/core.worktree 경로·submodule branch/worktree refs, Codex/Claude saved cwd/자동화, npm/Gradle/local dependency junction. GitHub/domain rename은 분리한다. 실제 이동·hub commit·설정 변경은 이번 작업에서 실행하지 않는다. 구체 실행 절차와 미확인 사항은 영향 조사 후 보완한다.