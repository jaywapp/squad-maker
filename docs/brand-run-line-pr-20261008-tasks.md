# Run Line 최종 검토 실행 기록

orchestrator: Codex. 공급 자산/기존 브랜딩만 범위. root 단독 편집·Git, 독립 reviewer는 읽기 전용. 테스트와 Gradle은 메모리 및 공유 산출물 때문에 순차 실행한다.

| ID | orchestrator | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| F-01 | Codex | Codex | gpt-6.1-sol | high | 없음 | audit | 규칙/Git/PR/workflow 읽기 | remote main·광고 변경 보존·기존 PR·중단 상태 | 완료 |
| F-02 | Codex | Codex | gpt-6.1-sol | high | F-01 | audit | 공급 assets/code/test 읽기 | 별도 reviewer와 root diff 확인 | 완료 |
| F-03 | Codex | Codex | gpt-6.1-sol | medium | F-01 | documentation | 이 문서 4개·index·기존 브랜딩 문서/패키지 README | T7 절차/기대/증거·미검증·질문 일괄 | 완료·답변 대기 |
| F-04 | Codex | Codex | gpt-6.1-sol | medium | F-02,F-03 | sequential | 범위 내 브랜딩 파일 | 새 candidate unit/E2E/sync/bundle/unsigned/lint | 완료 |
| F-05 | Codex | Codex | gpt-6.1-sol | high | F-04 | sequential | 범위 내 staged diff/Git | Conventional Commit·최종 SHA의 전체 검증 | 대기 |
| F-06 | Codex | Codex | gpt-6.1-sol | medium | F-05 | sequential | 원격 작업 branch/Draft PR | main 대상 Draft·정상 push·자동 배포 중단 유지 | 대기 |
| T7 | Codex | Codex | gpt-6.1-sol | high | F-06,향후 사용자 실행 승인 | blocked | 향후 서명/기기 증거만 | 별도 체크리스트 10개 | 미검증·이번 실행 금지 |

## 이번 새 검증 결과

candidate와 final 결과를 구분한다. 이전 `.work/branding/` 기록은 이전 검증이며 최종 SHA의 근거로 사용하지 않는다. 이번 로그는 `.work/branding-final-review-20261008/{candidate,final}/`에 둔다. 최종 commit/tree와 실행 시간/명령/exit는 `final/verification.json` 및 Draft PR 본문에 기록한다.

이번 candidate 실행: unit95/0실패/0skip, desktop105/0실패/0skip(162.590초), mobile104/0실패/기존1skip(165.100초), Android sync/bundle exit0, unsigned assembleRelease/lintRelease exit0(3분53초, 34실행/170up-to-date). 이는 커밋 전 현재 작업 트리의 새 실행이다. candidate lint task/report는 캐시를 사용했으므로 최종 SHA에서는 :app:clean 이후 빌드·lint 보고서를 다시 생성한다. 최종 SHA의 결과는 final/verification.json과 PR 본문을 따른다. 이전 .work/branding/ 결과를 최신 검증으로 사용하지 않는다.

독립 리뷰와 root가 현재 diff를 새로 확인했으며 Critical/High 또는 실제 결함 없음. 공급 header/favicon/intro 일치, 41개 assets·17개 적용 res 동일, 18개 잔재 제거, 실제 script 주석 건너뛰기/adapter 한 번 삽입/ready 순서, splash 및 E2E 계약을 검토했다. 리뷰어는 빌드·테스트·수정·Git 작업을 수행하지 않았다. 제품 코드 추가 수정은 없다.

## skip와 lint 원인·영향

기존 mobile skip 1개는 `tests/e2e/guest-free-regression.spec.js`의 전체패턴 GIF 테스트가 `desktop-1280`만 실행하도록 한 조건이다(인코딩 시간 절약). desktop은 해당 케이스를 실행하고 mobile의 개별 GIF/PNG/SQ 회귀는 별도 수행한다. mobile에서 전체패턴 GIF 한 케이스는 검증되지 않으며 이를 통과라고 세지 않는다.

확인한 release lint 보고서는 0오류/8경고다. 최종 SHA의 clean 실행에서 동일 목록인지 다시 확인한다. 경고를 숨기거나 suppress하지 않았다.

| 원인 | 위치 | 영향과 처리 |
|---|---|---|
| GradleDependency: appcompat 1.7.1→1.8.0 알림(1) | android/app/build.gradle:35 | 새 버전 안내, 빌드 차단 아님. 이번 범위 밖 업그레이드 보류 |
| UnusedResources: activity_main(1) | res/layout/activity_main.xml:2 | 정적 참조 미검출, 기존 리소스 보존 |
| UnusedResources: brand_pitch/chalk/lime(3) | res/values/colors_brand.xml:5~7 | 제공 자산의 새 색 선언 3개가 직접 참조되지 않음. 사양 동일성을 위해 보존, 런처/웹 색 적용은 별도 리소스/inline 값 사용 |
| UnusedResources: config(1) | res/xml/config.xml:2 | Capacitor sync 생성 리소스, 생성 계약 보존 |
| UnusedResources: package_name/custom_url_scheme(2) | res/values/strings.xml:5~6 | 기존 문자열 정적 참조 미검출, 이름·ID/기존 계약 보존 |

요청의 기존 경고8개는 이전 브랜딩 작업 트리의 8개이며, 그중 미사용 색3개는 이번 공급 자산 추가로 생긴 경고다. 나머지5개는 수정하지 않은 파일의 알림이다. 원래 main에 동일한 경고8개가 있었다고 주장하지 않는다. flatDir 설정 경고2개와 Playwright NO_COLOR/FORCE_COLOR·http-server DEP0066 안내도 남아 있다.

## 제외 및 보존

기존 `docs/pr-cleanup-20261008-tasks.md` 로컬 변경은 커밋 제외·보존. sync 생성 Gradle 2파일은 정규화한 내용 diff0이어서 제외. 광고 트리와 원본 design/UI/native 브랜치는 변경하지 않는다. 서명 APK·실기기 설치·공개 배포·main 병합·branch 삭제·force push를 하지 않는다.
