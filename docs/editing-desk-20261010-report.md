# 편집 데스크 검증·인계 기록

## 결과와 기준

사용자가 선택한 ① 편집 데스크를 운영 코드에 적용했다. 1920에서는 실제 보관 전술/선수 목록·피치·설정을 나란히 배치하고, 1280은 피치/설정 2열, 390은 기존 세로 흐름, 844×390은 수평 피치와 선택 도구를 유지한다. 선택 구조 외 광고·native/API·의존성·workflow는 바꾸지 않았다.

브랜치 `codex/editing-desk-20261010`, 기준 main/HEAD `0e46f1ff418e0bb8e1ffad84074c4b344873935d`. 검증은 이 HEAD 위의 미커밋 소스에서 수행했다. 이후 Git 게시 상태와 commit/blob 연결은 PR 실행 기록에서 확인한다. 기존 PR50과 Release1083은 이전 코드의 완료 이력이며 이번 결과가 아니다.

최종 `index.html` SHA-256: `482817af0dfebed4f68c640ebfb16eb67c224b2169b1bacde67de4a05c824413`.

- index Git blob: `69ce8ab8af687eca527aecd6e153bbf6f5e6d054`
- 새 테스트 Git blob: `b9c5d8e45ba6942f9124d1691b9f9bfa6b7af545`
- QA/Android bundle/unsigned APK 내부 HTML SHA-256: `32f2c7c7d32d3608f59dda4fdd42f0aa0b60fd2028c77d491026e26870ddd822`

소스와 번들 해시는 local vendor·analytics disabled 처리가 있어 서로 다르다. [최종 캡처](editing-desk-20261010/evidence/confirmation/verification.json)는 네 viewport에서 동일한 번들 응답 해시와 소스 시작/종료 동일성을 기록한다. Git 게시 후에는 위 index/test blob과 최종 commit을 연결해 확인해야 한다.

## 상태·저장·출력 계약

기존 계약 v2, snapshot/library v1, ID/색상/이름, 저장 좌표480×660, undo/CAS·복원·뷰어 원본 보호를 유지한다. 수평 표시만 `(660−y,x)`로 투영하며 역변환으로 mouse/touch/keyboard/패턴 입력을 처리한다. 회전만으로 저장 데이터를 변경하지 않는다.

완료된 이동의 자동 저장은 새 미완료 드래그 중 보류한다. 회전 또는 blur/hidden/pagehide에서는 시작점으로 복구하고 저장 waiter를 해제한 뒤 완료된 변경을 기존 저장 경로로 반영한다. DOM 이벤트 회귀는 OS가 프로세스를 강제 종료하는 상황의 보장을 뜻하지 않는다.

PNG는 live 필드의 크기·선택·표시 상태를 건드리지 않는 별도 장면을 만든다. circle 중심은 논리 좌표와 같고 이름 길이에 좌우되지 않는다. 출력은 항상 세로480×660 피치 위에72px 헤더를 추가한다. PNG1200×1830, GIF480×732. 팀명·포메이션 또는 패턴/단계는 헤더에 두며 기존 파일명·MIME·busy/error/cancel·native 전달 경로를 유지한다. GIF 단계당39프레임(31×60ms+8×120ms)을 유지한다.

## 최종 실행

| 검사 | 실제 실행 기준 | 결과 |
|---|---|---|
| 단위 | 최종482817af, `npm run test:unit` | 128 pass, skip0 |
| 전체 E2E | 최종482817af+새 테스트 blob, 전용4323 config, workers1/retries0 | desktop127/mobile126=253 pass, 기존 skip1, 7.1분 |
| Android bundle/sync | 최종482817af, `npm run android:sync` | 성공 |
| unsigned/lint | 기존 JBR21.0.6/SDK36/Gradle8.14.3 cache, `--offline --no-daemon --max-workers=1 :app:assembleRelease :app:lintRelease` | 성공, lint0 errors/13 warnings |
| 화면/출력 | Chromium 실제1280×800/1920×1080/390×844(DPR3)/844×390(DPR3) | 검사 failures0, 콘솔/overflow/44px/배율·색·폰트·DPR·뷰어 통과 |
| 접근성 | Lighthouse13.4.1, 모바일390×844×3 / desktop1920×1080×1 | 각각100, label-content-name-mismatch 포함 실패 항목0 |
| 출력 독립 디코딩 | Pillow로 실제 PNG/GIF 확인 | PNG9명 중심±1.5 출력px, GIF78프레임·delay·크기 통과 |
| 정적 교차 검토 | 최신 원본 hash 직접 확인, 동시 index 수정 없음 | 추가 필수 데이터/저장/출력/호환성 결함 미발견 |

전체 E2E의 신규14개는 실제 목록·접근성이름/포커스, 회전 저장 bytes, 화면축 방향키/undo, 실제 mouse/CDP touch, pending-save 취소/reload, lifecycle waiter, 9↔11 피치 크기, 패턴 좌표, PNG 헤더/실제 중심/숨김 모드/실패·busy, 실제 단일·전체 GIF, 뷰어 두 저장키 보호를 확인한다. Android 오프라인 번들 내보내기도 기존 전체 회귀에 포함된다.

기존 skip1은 `guest-free-regression.spec.js`의 모바일 전체 패턴 GIF 사례다. 인코딩 시간 절약을 위해 해당 기존 사례를 desktop에서만 실행한다. 이번 신규 실제 single/all GIF 사례는 desktop/mobile 모두 실행하므로 모바일 전체 GIF가 모두 미검증인 것은 아니다. 기존 skip 조건을 숨기거나 제거하지 않았다.

최종 로그는 ignored `.work/editing-desk-20261010/{final-unit.log,final-e2e-accessible.log,final-bundle.log,final-android-sync.log,final-android-build.log,confirmation-visual.log,lighthouse-390.log,lighthouse-1920.log,final-export-details.log}`다. 초기 실패·이전 소스 결과는 `ignored .work/editing-desk-20261010/evidence/first`, `ignored .work/editing-desk-20261010/evidence/pre-accessible-name`과 이전 로그에 별도로 보존했다. 이전 결과를 최종 코드의 검증으로 대체하지 않았다.

## 경고와 제약

이번 실제 lint13개: UnusedResources7, MonochromeLauncherIcon2, IconDipSize1, IconDuplicatesConfig1, IconLocation1, ObsoleteSdkInt1. 기본 템플릿의 미사용 자원·아이콘 구성 경고와 min24에서 불필요한 drawable-v24 구분이다. 이번 웹 변경으로 해결하거나 추가한 native 문제가 아니다. 이전 PR47의8개는 다른 기준이며 현재 수치로 재사용하지 않는다.

기준 main 계열의15개와 비교하면 AndroidGradlePluginVersion1/GradleDependency1이 이번 offline 보고서에 없다. 원인은 미확인이고 해결·업그레이드 완료로 보고하지 않는다. 온라인 CI에서는 다시 나올 수 있다. 의존성/키/계정 변경으로 경고를 숨기지 않았다. `npm ci`의 기존 deprecated 패키지와 moderate 취약점4개 안내도 의존성 변경 없이 기록한다.

Impeccable detector는 exit2로 디자인 경고를 반환했다. uppercase 짧은 운영 라벨, desktop의 스크롤 가능한 긴 설정 열, 기존 테두리/그림자·피치 줄무늬 advisory를 유지했다. 모바일 저장 상태의 `기기에 저장됨` 상세와 가로 wordmark는 의도된 시각 숨김이며 `저장됨` 표시/접근성 안내를 유지한다. **가로 밀집 배치의 일부 선수 이름표는 실제 이웃 원과 겹치는 잔여 제약**이 있다. 번호는 표시하고 원의 입력을 가리지 않으며 선택 도구에서 전체 이름을 확인할 수 있다. 이를 detector 전체 통과로 보고하지 않는다. 보정 배치 이후 선택적 디자인 수정은 늘리지 않았다.

실제 휴대폰·TalkBack·OS 공유·설치 데이터 보존·Android7~11 WebView 실행은 **미검증**이다. Chromium 모바일 emulation/CDP touch를 실기기나 Android emulator 검증으로 부르지 않는다. minSdk24 및 unsigned 빌드 성공만으로 해당 OS의 runtime 호환성을 확정하지 않는다.

## APK와 T7

로컬 산출물 `android/app/build/outputs/apk/release/app-release-unsigned.apk`: 7,328,482bytes, SHA-256 `cee500ffac67c808858b531ba7e3a8b228736cbcd7b2384fe91e31a1b32c6def`. package `com.jaywapp.squadmaker.preview`, 기본 template versionCode1001/versionName0.1.0-preview.1, min24/target36. 서명 부재를 확인했다. **설치용 APK가 아니며 기존 Preview1083의 데이터 보존 업데이트 대상으로 안내하지 않는다.** 서명·설치·새 키·인증정보 작업은 수행하지 않았다.

main APK 자동 Release workflow는 active, Vercel workflow는 disabled_manually 상태로 보존했다. 새 main 병합이 승인되면 기존 pipeline의 버전 증가·기존 서명·재다운로드 검증을 거쳐 설치용 APK를 별도로 확인해야 한다.

| T7 항목 | 사용자가 할 절차와 기대 결과 | 현재 상태/증거 위치 |
|---|---|---|
| 홈/테마/설정 아이콘 | 서명 업데이트 후 런처·테마·앱 정보에서 아이콘 잘림/배경을 확인 | 미검증, 향후 `evidence/t7/` |
| 첫 실행/시스템 스플래시 | 백업 후 첫 진입을 녹화해 빈 화면·중복 splash·잘림이 없는지 확인 | 미검증, 향후 `evidence/t7/first-launch.mp4` |
| 인트로 탭/동작 줄이기 | OS 동작 줄이기 각각 on/off에서 탭으로 편집기에 정상 진입 | 미검증, 향후 `evidence/t7/intro-*.mp4` |
| 따뜻한 복귀/헤더 | 앱 전환 후 복귀 시 반복 intro·헤더 잘림이 없고 가로/세로 조작 가능 | 미검증, 향후 `evidence/t7/reentry-*.mp4` |
| 기존 저장 데이터 | 직접 `.sq` 백업 후 기존 앱을 삭제하지 않고 업데이트; 팀·전술·색·배치·지침을 비교 | 미검증, 향후 개인정보 제외 비교 기록 |
| Android7~11 | API24~30 기기 또는 이미 허용된 emulator에서 첫 실행·회전·복원/저장·PNG/GIF 수행; OS와 WebView 버전을 같이 기록 | 미검증, 추가 설치/AVD/데이터 삭제 필요 시 먼저 확인 |

사용자 우선 확인은 홈 아이콘, 첫 실행 splash/intro, intro 탭, 재진입, 기존 저장 데이터 유지다. 사용할 실제 기기/OS/WebView 버전은 미확인. 설치용 파일이 준비되기 전 기기에 설치하거나 앱 데이터를 지우지 않는다.

## 보존과 게시 준비

기존 primary/광고/Run Line/UX worktree와4317~4320 서버를 보존했다. 이번 전용 QA 서버4322는 loopback의 Android web bundle을 제공한다. `.work`의 도구/로그/unsigned APK/node_modules는 로컬 자료이며 커밋하지 않는다. cap sync의 생성 설정2개는 줄끝만 달라 보일 수 있으나 Git blob은 HEAD와 같고 내용 diff0이다.

필요한 새 Git 게시 범위는 이번 index·회귀·문서·최종 증거다. main 직접 커밋·force push·브랜치 삭제는 없다. 앞선 동일 UX 작업의 병합 요청과 이번 선택을 근거로 commit/blob 연결을 확인하고 main 대상 Draft PR을 만든 뒤 CI를 확인하여 병합한다. 이 기록의 미검증 기기 항목과 잔여 이름표 제약을 PR에서도 유지한다.


중간 원본 캡처/측정과 중복 Lighthouse HTML은 ignored `.work/editing-desk-20261010/evidence/`에 그대로 보존했다. 최종 confirmation JSON·실제 PNG/GIF·분리 프레임·화면만 Git 게시 자료로 포함하며 데이터 해석을 바꾸지 않았다.
