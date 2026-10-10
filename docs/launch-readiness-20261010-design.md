# 정식 출시 준비 설계

기존 전술 편집기를 사용하는 코치/선수의 Operate 도구로 읽는다. 승인된 Run Line을 최신 편집 데스크에 보존 통합한다. impeccable·web-ux-improve·design-taste-frontend를 사용하되 랜딩 페이지용 구조/새 라이브러리는 도입하지 않는다. DESIGN_VARIANCE=3, MOTION_INTENSITY=3, VISUAL_DENSITY=7. 기존 가독성과 작업 밀도, native reduced-motion·탭·재진입 계약을 유지한다.

## 파일 및 계약

root: index.html, scripts/build-android-web.mjs, capacitor.config.json, 출시 문서. 브랜드 담당: 승인 work/tasks/branding 자산·Android icon/splash/styles/MainActivity. 제보 담당: api/feedback.js, app/platform-native.js, 신규 app/feedback-client.js, 관련 단위 테스트. QA: 신규 tests/e2e/launch-readiness-20261010.spec.js와 ignored QA 증거. 같은 파일 동시 수정 금지.

정식 표시 이름은 답변 뒤 적용한다. 패키지/서명/자동 버전 규칙은 유지한다. 이미 설치된 @capacitor/app의 App.getInfo()를 통해 실제 버전을 얻고 웹 개발본과 native 정보를 구분한다. 오래된 beta 하드코딩을 실제 버전으로 오인시키지 않는다.

canonical 좌표480×660, revision/CAS 저장, .sq 복원 후 별도 저장, 독립 PNG/GIF 출력 장면은 보존한다. 미완료 touchcancel은 시작 snapshot으로 복구하며 완료된 이전 저장만 재개한다. 겹침은 실제 재현하고 선택/전체 이름 접근/내보내기 의미를 보존하여 좁게 수정한다.

제보 client는 웹 same-origin /api/feedback, native 기존 public HTTPS API를 사용한다. 서버는 정확한 native https://localhost origin 및 android platform을 지원하고 기존 설정/스팸 방지/제한을 보존한다. timeout/404/non-JSON/provider 오류를 안전하게 표시하고 입력을 보존한다. 운영 배포는 수행하지 않으며 실제404 차단을 인계한다.

## 검증

실제 Chromium 데스크톱·모바일 UA/touch/DPR/360세로·640가로·회전을 묶어 조사→결함 일괄 수정→한 번에 재확인한다. 실패/새 결함 수정 후 영향 검증은 다시 실행한다. 최종 커밋의 단위·전체 E2E·Android bundle/sync·unsigned release·lint 결과와 증거를 기록한다. 개인정보·광고·Play AAB/서명/스토어 항목은 별도 출시 체크리스트로 남긴다. 시크릿·.env·키를 읽거나 기록하지 않는다.

추가 화면 계약: 짧은 가로는 번호·접근 가능한 전체 이름과 선택 도구를 유지하고, 짧은 세로는 도구를 피치 아래 흐름에 둔다. 이름표는 같은 줄의 선수 간격을 넘지 않으며 선택 도구는 전체 이름을 줄바꿈한다. native 공유는 확인된 기존 Pages v1 수신 경로이고 encoding 실패는 복사/성공 이벤트를 중단한다. 정식 host/API 배포는 별도 결정이다.
