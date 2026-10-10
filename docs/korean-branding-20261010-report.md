# 한글 A안 적용·검증 인계

2026-10-10. PR52의 기능 기반 위에서 승인된 아이엠 헤드코치 A안을 선택 적용했다. 사용자 답변으로 기술 이름 **iam-headcoach**, Android 표시 이름 **아이엠 헤드코치**를 확정했다. 원본 저장소·다른 worktree·광고 변경은 보존한다. 이 문서의 최종 검증 집계·정확한 commit SHA·Draft PR URL은 같은 Draft PR54 본문과 로컬 naming-final 기록에서 확인한다. 아래 선행 QA는 전체 최종 검증을 대신하지 않는다.

## 확정 부분의 변경

- 한글 header/intro A안 아웃라인, title·OG/Twitter·접근성 이름·도움말·진단·메일 제목·현재 README/package description·향후 release 표시 제목을 맞췄다.
- Run Line 마크·아이콘·favicon·native splash·색은 승인안에서도 동일해 그대로 유지했다. 구 브랜치 앱 코드는 가져오지 않았다.
- 320px·웹 rem 200% 확대에서 header와 utility toolbar가 겹친 것을 발견해 420px 이하 세로 모드의 열 크기/버튼 줄바꿈만 수정했다. 로고 높이·경로·가로 편집 데스크는 유지했다.
- 인트로 JS는 기존 코드와 byte 동일. header/intro·허용 표시문구·명시적 반응형 수정 외 기존 편집기/API/저장/공유/광고/버전 코드 보존을 확인한다.
- 원본 150개 문서·시안·리소스를 유지하고 실제 PNG 메타데이터의 문서 오류를 companion 자산 문서에 정정했다. IBM Plex 출처/OFL를 앱 bundle에 포함했다. 원본 TTF 버전/해시는 미확인이다.

원본 목록·해시는 [자산 기록](korean-branding-20261010-assets.md), old→new·남은 이름·전환 조건은 [네이밍 대응표](korean-branding-20261010-naming.md)를 따른다. 승인 자산 원본 경로를 기술 이름에 맞춰 이동하지 않는다. SVG는 앱에서 인라인으로 사용하며 원본과 동일한 SVG6/snippet3을 `assets/branding/iam-headcoach`의 명명된 제품 전달본으로 정리했다. 기존 앱 import/bootstrap와 원본 경로는 유지하고 QA/문서에서 새 경로를 참조한다.

## 확정 이름과 경로

| 항목 | 최종 값·상태 |
|---|---|
| 앱/Android 표시 | 아이엠 헤드코치, Preview 접미사 없음 |
| 내부 npm/lock root | iam-headcoach, 의존성 변경 없음 |
| 제품 전달 파일 | assets/branding/iam-headcoach/iam-headcoach-* |
| 원본/시안 | docs/branding/headcoach 등 기존 경로·내용 유지 |
| 향후 폴더 | D:\station\repos\iam-headcoach라는 이름 확정, 실제 이동 없음 |

명칭 결정은 완료다. 현재 primary와 linked worktree는 이동하지 않았다. Preview 패키지/버전 계보·릴리스 채널·서명·저장키/형식·외부 링크와 광고는 그대로 유지한다. 설치한 앱의 업데이트 결과/실제 런처 라벨은 기기 미검증이며 컴파일 APK의 aapt 라벨을 별도로 확인한다.

## 검증 실행 기준과 증거

이번 코드·tests를 commit한 뒤 아래 명령을 새로 실행한다. 결과는 `.work/korean-branding-20261010/naming-final/`의 stage JSON·logs 및 Draft PR 본문에 실행 SHA와 함께 기록한다. 과거 PR47·PR52 결과를 새 코드의 통과 결과로 쓰지 않는다.

| 검증 | 실행 기준·확인 범위 | 최종 증거 |
|---|---|---|
| 단위 | npm run test:unit, 실제 현재 tests/unit | unit.log / unit.json |
| Android web | npm run android:sync (bundle 포함), 정규 상대 module path 보존 | sync.log / sync.json, .work/android-web |
| desktop/mobile E2E | 새 Chromium config, 단독 port4333, workers1/retries0. 기존 전체 + 한글8시나리오×2 | e2e.log / e2e.json / e2e-report.json / e2e-results |
| unsigned release | full history의 기존 version plan, Gradle offline/no-daemon/workers1 :app:clean :app:assembleRelease | android.log / android.json / release-plan.json, unsigned APK |
| lint | 같은 clean 빌드 :app:lintRelease, 보고서의 실제 경고 집계 | android/app/build/reports/lint-results-release.{xml,html} |
| 자산·계약·링크 | 공급 blob/outline/참조·기존 package/storage/.sq/URL 계약과 변경 whitelist | asset-inventory.json, integration-invariants.json |

첫 단계 14deb708의 과거 선행 QA에서 기본 글자 targeted 46개 통과·확대2개 실패를 관측했고 배치 수정 후 브랜드16개 및 320px intro tap2개가 통과했다. 이 숫자는 최종 전체 E2E의 결과가 아니다. 320px desktop native facade 캡처는 [인트로](korean-branding-20261010/evidence/native-facade-intro-final-320.png)이며 물리 Android 증거가 아니다.

기존 skip1은 guest-free-regression의 전체 GIF 모바일 중복 인코딩 생략이다. 데스크톱에서 해당 GIF를 실제 검증하고 모바일 PNG/GIF의 다른 경로도 기존 회귀로 검증한다. 첫 단계 14deb708의 lint4는 UnusedResources(activity_main/config/package_name/custom_url_scheme)이며 브랜딩 표시명을 바꾸는 목적에서 native scaffold를 임의 제거하지 않는다. PR52 CI에서는 AGP와 appcompat 신버전 알림2개가 더 있어6개였다. 이번 최종 실행의 실제 결과를 별도 집계하고 과거 '8개'를 그대로 재사용하지 않는다. Node NO_COLOR/FORCE_COLOR와 http-server DEP0066는 도구 경고이며 테스트 assertion/Android lint 결과와 구분한다.

## 확인 범위와 실기기 미검증

browser: 320/360/390/1280 header, OS light/dark preference(기존 night UI), 공급 on-light SVG 렌더, 웹 rem200% reflow, portrait→landscape→portrait/reload 보존, native facade의 ready/tap/reduced/warm/6초 상한을 확인한다. 생성/배치/이동/수정/저장/library/SQ 복원·실제 PNG/GIF·공유/터치 취소는 현재 전체 회귀를 실행한다. Browser native facade·viewport 변경은 실제 Android OS, launcher, WebView, 글자 확대를 검증한 것이 아니다.

| 휴대폰 확인 | 기대 결과 | 현재 |
|---|---|---|
| 홈·설정 아이콘 | 승인 Run Line 형태, 마스크/테마 아이콘 잘림 없음·확정 앱 라벨 | 실기기 미검증 |
| 첫 실행 splash·intro | 단색 splash→아이엠 헤드코치→편집, 흰 깜빡임/잘림 없음 | 실기기 미검증 |
| intro 탭·동작 줄이기 | 탭으로 완성 상태, ready 뒤 닫힘·정지/짧은 모션 경로 | 실기기 미검증 |
| 재진입·회전·글자 확대 | warm 복귀 시 intro 반복 없음, 편집·버튼·한글 잘림 없음 | 실기기 미검증 |
| 저장 데이터 | 이전 팀·전술/개수·내용 유지, 터치 취소/재시작·SQ 복원 후 저장 가능 | 실기기 미검증 |

향후 기기 모델/OS/launcher/font scale/후보 metadata를 기록할 위치는 `.work/korean-branding-20261010/t7/<device-os>/`다. 아직 증거가 존재한다는 뜻이 아니다. Android7~11 legacy icon/compat splash·편집/내보내기/OS공유는 사용 가능한 해당 OS 기기 또는 기존 지원 emulator에서 따로 확인해야 한다. SDK24·unsigned 컴파일·브라우저 흉내로 완료 처리하지 않는다. 새 emulator image 설치·앱 삭제/데이터 초기화·서명·설치는 여기서 자동 실행하지 않는다.

## 출시 작업은 별도

- 운영 feedback API는 PR52 조사 시404였다. 로컬/모의 제보 동작 보존과 운영 접수 해결을 구분한다. 정식 web/API host·CORS/Turnstile·실접수 검증은 별도 배포 승인 후 진행한다.
- 개인정보/지원 정책: 운영자·문의·공개 Issue 제보·데이터 처리/보관/삭제·Data safety와 정책 URL은 미확정이다.
- 첫 광고 여부/운영 ID/빈도/동의: 미확정, 현재 테스트 설정 및 별도 광고 WT 보존.
- Play AAB/app signing/upload key/Preview 업데이트 전략·store 표기: 별도 결정. 새 키 생성·키 접근·서명 APK·기기 설치·Play 제출은 하지 않았다.
- GitHub 저장소/배포 프로젝트/도메인 rename, local primary/hub 경로 전환, PR52와 이 브랜치 main 병합은 별도 승인이다. main push 자동 APK Release 경로는 변경하지 않았고 이번 feature/Draft에는 공개 release를 실행하지 않는다.

기존 [출시 체크리스트](launch-readiness-20261010-release-checklist.md)는 이전 이름/관측일을 가진 당시 기록이며 이번 통합의 현재 이름/확정 상태는 이 문서와 네이밍 문서를 따른다. 상표 참고 범위와 라이선스/자산 감사는 법적 사용 적합성 완료 판정이 아니다.
## 최종 검증 추적

첫 단계 commit14deb708의 unit161/desktop165/mobile164+skip1/로컬lint4·CI6은 이력이다. 이름 확정 변경을 commit한 다음 naming-final에서 unit/E2E/bundle/sync/clean unsigned/lint를 다시 실행한다. 각 source/end SHA·집계·APK metadata·CI 결과와 정확한 최종 SHA는 [Draft PR54](https://github.com/jaywapp/squad-maker/pull/54) 본문에 기록한다. 과거 final 디렉터리는 보존한다.
