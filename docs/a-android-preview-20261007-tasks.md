# A 통합·APK 공급 실행 기록

- orchestrator/owner: Codex. branch `feat/a-android-preview-20261007`, baseline `d7996738db3388c9022ce3c8ae0cf77fd7bbb628`.
- Claude UI는 별도 실행 트리로 검증 SHA·소유권·계약을 인계한다. root의 정확한 모델 ID는 노출되지 않아 GPT-6으로 표기한다.

| ID | orchestrator/owner | model / effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|
| baseline | Codex/Codex | root GPT-6 / high | 현재 상태 | baseline | PR43 source/tests | [1,3]·삭제·안전 정수·회귀 재실행 | 완료 |
| T-01 | Codex/Codex | gpt-6.1-sol / high | SDK·코드 | independent-read | 공식 자료·코드 읽기 | 대안/오프라인·native/save/share/ads·서명 | 완료: Capacitor8 선택 |
| C-02/03 module | Codex/Codex | gpt-6.1-sol / high | baseline | data-module | app/local-library.js, unit/local-library.test.js | 이전·CAS/rollback·삭제·명시복구·빈 목록 | 완료: 50/50 |
| C-02/03 integration | Codex/Codex | root GPT-6 / high | module | sequential-core | index.html, 계약/fixture | async 저장·모듈 연결·v1 교환 유지·목록 선택 보존 | 완료 |
| C-03 E2E | Codex/Codex | gpt-6.1-sol / high + root 회귀 보완 | integration | independent-test | e2e/local-library.spec.js | 팀/파일·재시작·슬롯·실패·readonly·revision | 완료: 최종 관련56/56 |
| native review | Codex/Codex | gpt-6.1-sol / high | native 코드 | independent-read | 읽기 전용 | Bundle 크기·UI thread·마지막 저장·AtomicFile read | 4건 보완 완료 |
| native JS boundary | Codex/Codex | gpt-6.1-sol / high | native 보완 | independent-test | unit/platform-native.test.js | back·bytes·취소/오류·CAS·광고 facade | 완료: 36/36 |
| A-01/02 | Codex/Codex | root GPT-6 / high | T-01·계약 | native | Android, app/platform-native.js, bundle/scripts | unsigned assembleRelease·lint·로컬 export 실제 생성 | 구현/빌드 완료, OS 설치 검증 대기 |
| R-02 preview | Codex/Codex | root GPT-6 / high | native | test-ads | SquadAdsPlugin, sample manifest ID | 별도 영역·test SDK·오프라인 | 연결 구현 완료, 광고 실동작·비간섭 검증 대기 |
| Claude handoff | Codex/Codex | root GPT-6 / medium | C-03 SHA | handoff | 요청문·계약 v2 | 지원 대상·직접 전달 여부 구분 | 요청문 준비, 직접 전달 미실행 |
| UI acceptance | Codex/Codex | root GPT-6 / high | Claude U-01~03 | integrate | UI 최종 SHA·기능 통합 | A·좁은 화면·선택·내보내기 | Claude 완료 SHA 대기 |
| A-03/04 | Codex/Codex | root GPT-6 / high | UI/native·서명 승인 | apk | APK·checksum·설치/릴리즈 증거 | 동일 APK 설치·Release 재다운로드 | 서명 승인/UI 대기, 미완료 |

공유 source·저장·UI 파일은 순차 실행했다. 독립 모듈/읽기 리뷰/별도 테스트 파일만 병렬 위임했다. Android 서명 스크립트는 승인된 기존 입력 없으면 중단하고 키를 자동 생성하지 않는다.

## 현재 검증

- 원본 main clean/PR40 상태와 기존 변경 보존. PR43은 PR42 ancestor 포함, 중복 적용 없음.
- PR43 CI 37576625976 success/정확한 head 확인. baseline 재실행 API7+web161 passed/1skip.
- 통합 전체 `npm test`: 단위93/93, 웹185 passed / 기존 mobile 전체 GIF 1skip(총186). 외부 web 요청을 차단하고 Android 오프라인 bundle 실제 PNG/GIF 생성도 두 viewport 통과.
- 이후 다른 파일 삭제·undo 시 현재 선택을 유지하는 회귀를 추가했다. 최종 관련 재검증(local-library + ui-contract, 두 viewport)은 56/56 통과했다.
- native JS mock 테스트와 브라우저 fake adapter는 OS/SAF/광고 검증으로 주장하지 않는다.
- unsigned `:app:assembleRelease :app:lintRelease` 성공. package `com.jaywapp.squadmaker.preview`, versionCode1001/versionName0.1.0-preview.1, min24/target36. 최종 lint0errors/15warnings; ManifestOrder 및 Android12 데이터 추출 규칙을 보완했다. 라이브러리 업데이트 권고/템플릿 unused/icon 경고를 무단 의존성 업그레이드로 숨기지 않는다.
- 새 키 생성·서명·APK 설치·실기기·Release 게시/재다운로드는 실행하지 않았다. ADB 연결 기기는 없음. 다른 앱의 키·ID·계정/비밀값을 사용하지 않았다.
- UI 전용 session 도구 확인은 실패했으며 Claude에게 직접 보냈다고 보고하지 않는다. 사용자 붙여넣기 및 UI 완료 SHA 응답 대기.

## 다음 진행 조건

1. C-03 검증 SHA/계약을 Claude에 인계. Claude 별도 checkout/branch의 U-02/U-03 진행 동안 Codex는 index.html/UI 자산 편집을 멈춘다.
2. 사용자의 전용 preview 키 생성 승인 또는 기존 승인된 전용 키 입력. 비밀값은 출력·커밋·GitHub secret에 등록하지 않는다.
3. 합친 최종 UI/native 코드에서 전체 회귀 및 같은 signed APK의 emulator 설치·재시작·오프라인·SAF/공유 취소·광고 비간섭 확인.
4. GitHub Releases에 동일 APK/checksum/서명 종류·빌드 SHA·제한을 게시하고 다시 내려받아 해시/설치 확인. phone 결과는 emulator와 분리 기록.

## C-03 구현 SHA와 UI 파일 동결

구현/관련 회귀 SHA: `bc1e76a0de598ec651a717438086c42014f36ef7`. snapshot v1을 유지한 계약 v2. 전체93단위/185웹+1skip 후 선택 보존 변경의 관련56/56도 통과했다. 최종 CI는 PR head에서 별도로 확인한다.

현재 Codex는 index.html/UI 자산 편집을 멈췄다. Claude는 원격 전용 브랜치의 최신 commit에서 별도 checkout/branch를 만들고 U-02/U-03을 진행할 수 있다. app/local-library.js·app/platform-native.js·Android·package/lockfile·기능 회귀 테스트는 Codex 소유다. 직접 세션 전달은 여전히 미실행이며 준비된 요청문으로 인계한다.
