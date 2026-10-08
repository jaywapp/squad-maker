# 과거 적용 기록 안내

이 문서는 최종 PR 요청 전 미커밋 단계의 기록이다. 현재 권한·최종 SHA 검증·Draft PR·T7는 [최신 기록](brand-run-line-pr-20261008-tasks.md)을 따른다. 아래 수치는 이전 실행 결과이며 새 코드의 검증 근거로 재사용하지 않는다.

# 런 라인 브랜딩 분석

orchestrator: Codex. **사용자 선택: A 런 라인(2026-10-08).** [사양](../work/tasks/branding/01-design-spec.md)과 [작업요청 §1·§5](../work/tasks/branding/02-work-request.md)이 적용·완료 기준이다. 자산 원본은 design/brand-20261008의 a80e43db4aa71b12de014bc92e7b4ed13b8d4a95, 복사 원본 작업 트리는 D:/station/.worktrees/squad-maker-brand-20261008이다.

## 현재 상태와 승인

- PR #37, #41~#46은 모두 실제 MERGED이며 main=aa891870d9bb1649a7d64b507c232534e16cb6dd다. 브랜딩 branch는 feat/brand-run-line, 작업 트리는 D:/station/.worktrees/squad-maker-brand-run-line이다. 앱 runtime은 기존 검증된 c081101/7f1f1과 동일하다.
- index.html·Android를 변경하던 열린 PR은 0개다. Claude UI 원본 작업 트리는 깨끗하며 기존 Codex 광고 작업은 별도 트리에 미커밋 상태로 보존한다. 해당 작업은 현재 편집하지 않는다. 이번 파일은 root 단독 소유, 독립 Codex 리뷰어는 읽기 전용이다.
- 사용자 배포 지시 전까지 배포를 하지 않는다. Vercel 자동 배포는 disabled_manually, Pages는 workflow 방식이며 게시 workflow가 없다. 이번 브랜딩은 commit/push/PR/merge·서명 APK 제작 없이 검증 완료 상태까지 진행한다.
- 저장소 AGENTS/CLAUDE와 패키지 README→01→02를 읽었다. impeccable·design-taste-frontend를 적용하며 기존 단일 페이지 전술 앱의 헤더·부팅 영역만 바꾸는 보존 모드다. 시안 선택이 확정되어 신규 콘셉트·이미지·디자인 시스템을 만들지 않는다. Supabase 연동이 없는 로컬 앱으로 백엔드 변경은 없다.

## 범위와 완료 기준

W1 헤더 SVG(h1.wordmark 유지), W2 파비콘, W3 네이티브 시작 인트로, A1 적응형·단색·레거시 Android 아이콘, A2 시스템 단색 스플래시, A3 창·WebView 배경 night, S1 제공된 512 PNG 위치 기록을 수행한다. assets/**의 경로·색·타이밍은 수정하거나 재생성하지 않는다. 제공 스니펫의 기존 주석도 그대로 보존한다.

앱 이름·패키지·버전, OG 이미지, 알림 아이콘, 헤더 외 UI·동작, 의존성, 새 서명키·계정·비밀값은 범위 밖이다. 별도 광고 변경도 합치지 않는다.

완료는 웹 인트로 없음, 네이티브 최소 1400ms와 ready 동시 충족·탭 건너뛰기·동작 줄이기·최대 대기 보호, 아이콘 잔재 제거, night 배경 설정, 단위/데스크톱/모바일/unsigned Android·lint 통과, 문서·패키지 상태 갱신이다. 물리 기기의 흰 깜빡임·아이콘 마스크·warm start는 T7 대기로 명시한다. 요청의 커밋 금지에 따라 README 상태는 적용 완료(미커밋·PR 미생성)로 기재하고 PR 번호를 만들지 않는다.

## UI 사전 점검과 위험

현재 색은 night #141A16, pitch #2B5E3F, chalk #E8EDE8, lime #B8E986, muted #8FA096이다. 기존 정보 구조·그리드·저장/내보내기·접근성·SEO를 유지한다. 기존 헤더는 글자+전술 보드 보조 문구이고 favicon은 축구공이다. 로고만 사용자 승인된 아웃라인 SVG로 교체한다. DESIGN_VARIANCE=3, MOTION_INTENSITY=2(일반 앱), VISUAL_DENSITY=7: 기존 운영 UI의 밀도와 조작 중심 구성을 보존하며 시작 순간만 제공된 1.4초 모션을 쓴다. 마케팅 hero·카드·사진·신규 폰트 관련 스킬 항목은 이번 앱 범위에 적용하지 않는다.

R1 v24 아이콘 우선 선택 잔재, R2 인트로 script 속성/번들 삽입 위치, R5 내보내기 영역의 헤더 포함 여부, R6 ready 지연의 안전 종료를 검사한다. §2 결정을 바꿔야 하거나 R3 단색 시스템 스플래시가 1초 이상 보이는 문제, R4 작은 아이콘의 길 안내 유사성, 원인 불명 기존 회귀 실패가 확인되면 임의 변경하지 않고 사용자에게 보고한다. 새 시크릿 설정은 하지 않는다.

독립 검토로 R2의 실제 통합 장애를 확인했다. 제공 intro 주석에 정확한 `<script>` 문자열이 있어 기존 문자열 첫 치환이 native adapter를 주석 안에 넣는다. assets를 수정하지 않고 scripts/build-android-web.mjs의 삽입 경계만 HTML 주석을 건너뛰는 실제 script 태그로 좁힌다. 이는 §2의 어떤 제품 결정도 바꾸지 않는 필수 호환 보완이다. 현재 내보내기는 #field만 캡처하므로 헤더가 포함되지 않는다(R5).

## 검증 과정에서 확인한 범위

데스크톱 전체105개 중 기존98개와 새6개가 통과했고, reduced-motion 새1개는 400ms 종료 뒤 DOM 가시성을 검사한 fixture 오류였다. 제품을 바꾸지 않고 사전 MutationObserver가 animationName·표시/종료 시간을 기록하게 보완한 뒤 새7개가 모두 통과했다.

모바일 전체105개는 기존97개·새6개 통과, 기존 전체패턴GIF1skip, 새헤더1개 실패였다. 390→360 동적 변경에서 document.scrollWidth370을 관측했으나 baseline HEAD와 현재 모두 동일했고 실제 넘치는 요소는 없었다. 각360px 초기로드에서는 둘 다 scrollWidth360이며 헤더 우측도 viewport 안이었다. 요구된 크기별 초기 배치를 확인하도록 각viewport에서 새로드하는 fixture로 바꿨고 헤더 desktop/mobile2개를 재검증해 모두 통과했다. 이 결과는 동적 크기변경 전체 UI의 개선을 주장하지 않는다. 제품 UI·기하·색·타이밍은 수정하지 않았다.

새 실패의 원인은 두 경우 모두 새 테스트 관측 조건으로 확인했고 기존 회귀195개에는 실패가 없었다. 최종 고유 케이스는 desktop105/mobile104 통과와 기존 mobile1skip이며 미해결 새 실패0이다. 전체패턴GIF skip은 원래 인코딩 시간 절약 때문에 desktop에서만 확인하는 조건이다. 실제PNG/GIF·SQ와 저장·복원 회귀는 그대로 통과했다.


최종 완료: T1~T6의 구현/자동검증을 마쳤다. 전체 desktop105 및 mobile104+기존1skip, unit95, bundle/sync, unsigned release/lint exit0을 확인했고 lint0오류/8경고(제공색미사용3개 포함)를 기록했다. T7 물리확인은 대기, 브랜딩은 미커밋·PR미생성·무배포 상태다. 세부결과/전체파일목록/초안/감사는 tasks 문서를 따른다.
