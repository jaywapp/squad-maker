이 문서는 PR 요청 전 적용 단계의 과거 기록이다. 현재 권한·검증·Draft PR·T7는 [최신 실행 기록](brand-run-line-pr-20261008-tasks.md)을 따른다. 아래 검증 수치는 과거 결과다.

# 런 라인 브랜딩 설계

orchestrator: Codex. 사용자 선택과 제공 에셋을 그대로 적용한다. [작업요청 §2](../work/tasks/branding/02-work-request.md)의 아래 결정을 바꾸지 않는다.

| 결정 | 이유와 구현 |
|---|---|
| 시스템 단색 → 웹 모션의 두 단계 | Android 시스템 스플래시에 임의 GIF를 넣을 수 없음. 제공 styles.xml의 launch theme 사용 |
| 시스템 아이콘 투명 | 두 번 나타나는 마크 방지. 대안 R3은 물리 기기 확인 후 사용자 결정 |
| 웹 인트로는 native에서만 | Capacitor.isNativePlatform()로 판단. 공유 링크의 브라우저에는 대기를 추가하지 않음 |
| 최소 1400ms + ready, 최대 6000ms | 제공 snippet의 모션 완료와 SquadMakerContract.ready()를 함께 기다림. reduced motion은 400ms, CSS fade220ms/DOM 제거240ms |
| 워드마크 아웃라인 경로 | 번들에서 원격 글꼴이 제거되어도 글자 형태 유지 |
| 전술 보드 보조 문구 삭제 | 제공 헤더에는 소형 마크와 SQUAD MAKER만 표시 |
| 런처에서도 표준 점선형 | 제공 adaptive/monochrome/legacy 파일 사용. R4 대안 임의 적용 금지 |

## 파일과 실행 흐름

T1에서 제공 favicon link 한 줄과 h1.wordmark 블록을 붙이고 제공 CSS3줄을 A UI 헤더 CSS 뒤에 넣는다. grid-column/justify-self는 유지하고 wm-sub CSS3곳만 제거한다. T2는 전체 제공 intro snippet을 body 바로 뒤에 넣으며 script data-brand-intro를 유지한다. ready 계약·native adapter·원래 app script는 수정하지 않는다.

R2 호환 보완: 제공 intro 주석 안의 `<script>`를 기존 번들러가 오인한다. 번들러의 원래 첫 실제 `<script>` 앞 삽입 의미는 유지하되 HTML 주석 토큰은 그대로 반환하고 건너뛴다. 실제 삽입이 없으면 빌드 오류로 종료한다. 번들 script DOM에서 intro→외부 vendor→native adapter→기존 analytics 초기화→원래 app 순서를 검증한다. 원본 주석·data-brand-intro·모션·assets는 바꾸지 않는다.

T3은 제공 res와 동일 경로로 아이콘 파일을 복사하고 git grep 후 v24 foreground, mipmap foreground PNG5개, 기존 drawable background를 삭제한다. T4는 styles.xml diff를 먼저 확인해 NoActionBar와 Launch 두 블록만 변경한다. splash PNG11개와 빈 qualifier 폴더는 참조 확인 후 제거한다. MainActivity의 plugin 목록을 보존하며 super 이전에 SplashScreen.installSplashScreen(this)를 넣는다. capacitor.config.json에 backgroundColor만 추가한다. android:sync 후 생성 파일은 Git 제외 상태를 유지한다.

T5의 store PNG는 제공 assets/preview/icon-store-512.png를 위치 기록만 한다. 재생성·스토어 업로드를 하지 않는다. T1→T2와 T3→T4는 공유 파일 때문에 순차 처리하며 전체 변경도 root 단독 처리한다. 리뷰만 독립 Codex에게 읽기 전용으로 배정한다.

## 모션과 검증

focal moment는 선수 점→런 라인→화살촉→워드마크 한 번의 부팅 인트로다. 일반 앱 동작·피드백을 추가로 애니메이션하지 않는다. CSS mask/transform/clip-path는 제공 코드에 한정하고 새 라이브러리 없이 적용한다. 탭은 모션만 끝내며 저장소 준비를 기다린다. reduced-motion은 정지 로고 후 종료한다.

E2E는 웹 제거·헤더 접근성/28·32px/360px 겹침 없음, native 최소 시간 및 ready 동시 조건, reduced-motion 1초 내 종료, 탭 후 ready 지연, 6초 안전 종료를 관측한다. 내보내기는 실제 field 영역이며 헤더가 포함되지 않는지 기존 동작과 회귀 테스트로 확인한다. 번들에서는 intro 뒤, 원래 app script 앞에 native adapter와 기존 analytics 초기화가 삽입되는 순서를 검사한다.

T6는 요청된 순서대로 unit→bundle→desktop workers1→mobile workers1→assembleRelease/lintRelease를 포그라운드·순차 실행한다. 앱 서명 설정 없이 unsigned 산출물만 만든다. 시스템 스플래시의 실제 길이·흰 깜빡임·warm start·마스크는 웹 테스트로 판정하지 않고 T7에 대기한다.

## 검증 fixture 보완

reduced-motion은 DOMContentLoaded 시점에 이미 닫힐 수 있으므로 페이지 시작 전 MutationObserver로 정지 animationName과 생존 기간을 기록한다. 1초 내 종료 기준은 유지한다. 크기별 헤더는 해당viewport로 초기로드한 뒤 ready를 기다려 측정한다. 동적390→360에서 baseline도 발생하는 layout viewport370 관측은 별도 진단 결과에 보존하며 운영 UI 변경으로 확대하지 않는다. 사양이나 §2 결정의 변경은 없다.

실행 환경은 Node22.19.0와 공식 [Adoptium API](https://adoptium.net/installation/ci-scripts/)에서 SHA256을 확인한 portable Temurin21.0.12.1+1이다. JDK는 .work/branding/toolchain/에만 저장했고 프로세스별 JAVA_HOME/ANDROID_HOME만 설정한다. 가용 RAM 약1.6GB에 맞춰 Gradle 프로세스 heap768MB/metaspace384MB/workers1을 사용하며 저장소 gradle.properties나 전역 환경은 바꾸지 않는다.


최종 완료: T1~T6의 구현/자동검증을 마쳤다. 전체 desktop105 및 mobile104+기존1skip, unit95, bundle/sync, unsigned release/lint exit0을 확인했고 lint0오류/8경고(제공색미사용3개 포함)를 기록했다. T7 물리확인은 대기, 브랜딩은 미커밋·PR미생성·무배포 상태다. 세부결과/전체파일목록/초안/감사는 tasks 문서를 따른다.
