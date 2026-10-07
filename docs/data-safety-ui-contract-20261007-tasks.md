# 데이터 보호와 UI 계약: 실행 기록

- orchestrator/owner: Codex. 모델 지정은 이 세션과 지원되는 Codex 하위 에이전트 기준이며 Claude 실행 트리와 혼합하지 않는다.
- branch: `fix/data-safety-ui-contract-20261007`, baseline: `565366114d4b10a6bc7928c24754910cadd97e15`.
- UI 담당 Claude와 같은 파일 편집 금지. P0/C-01 완료 뒤에도 운영 UI 착수는 로드맵 C-02/C-03 게이트에 따른다.

| ID | orchestrator / owner | model / effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|
| P0-01 | Codex / Codex | root GPT-6 / high | 사용자 착수 지시 | safety-read | tests/e2e/data-safety.spec.js, 기존 fixture 읽기 | 기준 소스 결함 재현, 취소/재시작 기준 고정 | 완료 |
| review-contract | Codex / Codex | gpt-6.1-sol / high | 기준 소스 | safety-read | 소스/문서 읽기 전용, tests/e2e/ui-contract.spec.js 독점 작성 | 보호 영향·입력 실패·계약 독립 검토 | 완료 |
| P0-02 | Codex / Codex | root GPT-6 / high | P0-01 | safety-write | index.html, 회귀 테스트 | 확인·취소·undo·즉시 저장·실패 보존 | 완료 |
| P0-03 | Codex / Codex | root GPT-6 / high | P0-02 | safety-verify | tests/e2e, 실행 기록 | 전체 웹 회귀, v:1/.sq/#s=, PNG/GIF | 완료 |
| C-01 | Codex / Codex | root GPT-6 / high | P0-03 | contract | index.html 최소 adapter, 계약·fixture·테스트 | 상태·revision·저장/내보내기 결과 매핑 | 완료 |
| delivery | Codex / Codex | root GPT-6 / medium | C-01, review-contract | delivery | 실행 문서, docs/README.md | commit·push·draft PR·SHA 대조 | 완료 |

읽기 전용 검토만 독립 병렬이다. 보호 구현·회귀·계약은 같은 상태와 파일을 사용하고 순차 의존하므로 직접 순차 실행한다. 선택 이유는 손실·호환성 위험으로 high, 게시 작업은 medium이다.

root의 세부 모델 ID/실제 sampling effort는 실행 환경에 공개되지 않았으므로 추정하지 않는다. 위 root effort는 작업별 요구 추론 수준이다. 하위 에이전트는 지원 모델 `gpt-6.1-sol`, `high`로 명시적으로 실행했다. adapter 의미를 먼저 고정한 뒤 별도 파일의 계약 테스트 작성만 root 소스 구현과 병렬 진행하고, 부모가 테스트 내용을 확인한 다음 함께 실행했다.

## 검증 기록

- `npm ci`: 기존 lockfile 의존성 설치 완료. lockfile 변경 없음.
- 기준 재현: `node node_modules/@playwright/test/cli.js test tests/e2e/data-safety.spec.js --project=desktop-1280 --workers=1 --timeout=20000`, 보호 9개 예상 실패. 라벨 선택자를 `5vs5`로 바로잡은 후 실제 보호 누락/undo 부재/복원 저장 누락을 검출했다.
- 보호 구현 첫 확인: 동일 초기 9개 모두 통과. pagehide flush 도입 때문에 준비 helper는 초기 저장을 완료한 뒤 fixture를 한 번 seed하도록 수정했다.
- 독립 검토 보강 뒤 `npm test`: API **7 passed**, 웹 **145 passed / 1 skipped**, 종료 코드 0 (1280×800 / 390×844). skip은 기존 설정의 모바일 전체 패턴 GIF이며 desktop에서 실제 전체 GIF 통과. 일반 PNG/단일 GIF는 두 환경 모두 통과. 외부 요청은 고정 vendor로 대체/차단했다.
- 최종 화면 확인에서 모바일 편집 스크롤 중 오류가 화면 밖으로 이동함을 확인하여 **오류/blocked 상태만 sticky**로 보완했다. `node node_modules/@playwright/test/cli.js test tests/e2e/ui-contract.spec.js --workers=1`: **28 passed**, 종료 코드 0. 오류·retry viewport 노출과 가로 넘침 없음까지 두 환경에서 통과. 이 마지막 UI 변경 이후에는 영향받는 계약 회귀만 재실행했다.
- 마지막 계약 검토에서 시작 저장소 읽기 실패와 URL 인코딩 실패 사유를 문자열 계약으로 맞추고 Result 생성 전에 snapshot revision을 관측하게 했다. 같은 계약 명령 **32 passed**, 종료 코드 0. 이 공통 경계 변경 이후 최종 소스의 `npm test` 전체를 다시 실행한다.
- **최종 소스 전체 검증:** `npm test`, API **7 passed**, 웹 **151 passed / 1 skipped**, 종료 코드 0. 마지막 오류 안내·공통 결과 매핑·읽기 실패·URL 실패를 포함한 152개 웹 테스트다. 이후 소스·테스트는 변경하지 않고 게시 기록만 갱신한다.
- 인라인 script를 `vm.Script`로 파싱: 통과. `git diff --check`: 통과.
- 새 실행 문서·계약·문서 인덱스의 내부 파일 참조 **30건**, 깨진 경로 0건.
- 1280/390px 확인·저장 오류 화면을 한 번에 렌더링하고 최종 오류 화면을 두 환경에서 재확인: 모두 가로 넘침 false. 표본 데이터만 사용했다. 출력은 무시되는 `test-results/contract-*.png`이며 게시하지 않는다. 회귀 서버가 이미 종료된 재확인 시도는 연결 실패였고 별도 임시 서버를 띄워 재확인·종료했다.
- Impeccable detector: 기존 CSS line 344의 3px 경고 경계와 line 523의 width transition 경고 2개. 변경 hunk 밖의 기존 UI이며 A 담당 범위를 침범해 수정하지 않는다.
- 원본 checkout: main `5653661`, 변경 없음. 기존 fixture/vendor, AGENTS/CLAUDE, package/lockfile, A 자료 diff 없음.

## 인계와 남은 단계

- 검증한 기능 SHA: `0b14a1c73081ed8e9a07054a2f71fabf8c231f16`. 전용 브랜치를 push하고 [Draft PR #42](https://github.com/jaywapp/squad-maker/pull/42)를 생성했다. 이 게시 기록의 후속 커밋은 문서만 바꾸며 소스·테스트는 해당 기능 SHA와 동일하다. 최종 인계는 PR head SHA를 사용하고 원격 branch와 직접 대조한다.
- 계약: [UI 상태·저장·내보내기 v1](ui-state-save-export-contract-v1.md), `tests/fixtures/ui-contract-v1.json`, 기존 `tests/fixtures/snapshot-v1.json`.
- 다음: C-02 파일 경계 또는 순차 인계 정리, C-03/Q1/Q2/Q9 로컬 보관 결정과 구현. 이 완료만으로 U-02 운영 `index.html` 편집을 시작하지 않는다. U-01 fixture 화면 탐색은 Claude 고유 경로에서 가능.
- A UI·통합 뒤 T-01/Q6 기술 선택, Android 저장/공유·실기기 확인, 새 서명 설정 확인, 같은 검증 APK·SHA-256·버전·기준 commit·설치 안내의 GitHub Releases 게시가 후속이다. 이번에는 APK·서명·계정·비밀값을 만들지 않았다.
