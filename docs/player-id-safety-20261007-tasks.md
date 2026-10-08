# 선수 ID 충돌 보호 — 작업과 검증

- orchestrator: Codex · owner: Codex
- model: 현재 설정 Codex 모델 사용, 정확한 런타임 식별자 조회 불가. effort는 아래 작업 배정 기준이며 실제 런타임 설정을 새로 변경했다는 뜻이 아니다.
- 기준 head: `0d71b540a1a2be1c2cddd25364575725dc66d31d`; 원본 PR42 보존.
- branch: `fix/player-id-safety-20261007`
- [분석](player-id-safety-20261007-analysis.md) · [설계](player-id-safety-20261007-design.md)

| ID | owner / model / effort | depends_on / parallel_group | files | verification | status |
|---|---|---|---|---|---|
| ID-01 상태·규칙·재현 | Codex / 현재 설정 / high | - / read | 원격 지침·PR·index 읽기 | 정확 head, [1,3] 실제 함수 두 번 추가와 재복원 거절 | done (격리 함수 실행) |
| ID-R 독립 검토 | Codex / 상속 모델 / high | ID-01 / read-review | 지침·소스·테스트 읽기만 | ID·삭제 참조·safe integer 경계 | done (읽기 전용 독립 재현·검토) |
| ID-02 수정·회귀 | Codex / 현재 설정 / high | ID-01 / write | index.html, tests/e2e/player-id-safety.spec.js | 희소/삭제/빈/높은 ID·연속 추가·저장/reload | done |
| ID-03 CI 검증 | Codex / 현재 설정 / high | ID-02 / verify | .github/workflows/player-id-safety.yml | baseline 결함 검출, API/전체 웹 회귀 | done (원격 CI) |
| ID-04 게시·인계 기록 | Codex / 현재 설정 / medium | ID-R,ID-03 / publish | 이 실행 문서·PR | 원격 head·보호 파일 blob 대조·Draft PR | done (PR43, 최종 CI 재확인) |

동일 index.html과 검증 branch를 쓰는 변경은 순차 실행한다. 읽기 전용 독립 검토와 APK 참조 조사는 분리된 Codex 하위 에이전트로 진행한다.

## 실제 실행과 한계

- 새 로컬 shell: 명령 생성 전 sandbox 초기화 오류. 테스트/빌드가 실행됐다고 주장하지 않는다.
- 격리 실제 소스 함수: IDs [1,3,2,3], 기존 3번의 세 위치를 (240,330)으로 덮음, 재복원 invalid-input 재현.
- 브라우저/전체 회귀: [CI #37576252366](https://github.com/jaywapp/squad-maker/actions/runs/37576252366) success. 원본 소스 재현·원본 브라우저 중복 assertion 실패 확인 후 수정본 `npm test`: API **7 passed**, 웹 **161 passed / 1 skipped**. desktop 1280×800 / mobile 390×844 Chromium, Android 실기기 검증 아님.
- 기능 검증 SHA: `aafc5efa0f9e033576ae98b63fcc718c06d596c1`. 신규 5개 테스트를 두 viewport에서 모두 통과. 기존 모바일 전체 패턴 GIF만 skip.
- 원격 파일 8개를 작성 내용과 다시 대조, 보호 파일 91개의 blob SHA 동일, 문서 내부 경로 34개 정상. 독립 Codex가 실제 소스 함수를 다시 재현·검토하여 차단 결함 없음 확인.
- 후속 검증 기록은 문서와 CI checkout 깊이만 변경한다. 동일 소스/테스트임을 blob SHA로 확인하고 최종 head CI도 확인한다. baseline 조회가 후속 커밋 수에 의존하지 않도록 전체 Git 이력을 가져온다.
- 결과 PR: [Draft PR43](https://github.com/jaywapp/squad-maker/pull/43), base는 PR42 branch. 원본 PR42/PR41/main 미병합. 최종 head/CI 링크는 PR 본문에서 확인한다.
- 기존 PR42의 API 7 / 웹 151 / skip 1은 이전 세션 기록이며 이번 수정 검증 결과가 아니다.

## UI·APK 후속 게이트

C-01 계약 v1은 보존하며 C-02는 순차 인계 원칙을 따른다. C-03은 Q1 슬롯 단위/Q2 무료량/Q9 첫 출시 복구·백업 결정이 남아 있다. 지정 Claude 터미널의 실제 대상/경로도 확인 전이며 임의 메시지/키 입력은 하지 않는다. U-01의 고유 mock 경로와 운영 index.html 착수를 구분한다.

Android 정식 Q6·실제 패키징/저장/공유/설치 검증·승인된 전용 서명·Release 자산 해시 대조는 미완료다. 다른 앱의 키/ID를 재사용하지 않는다. A-04 사용자 설치용 APK의 최종 공급 목표와 기존 게시 승인은 유지한다.

## 인계 준비 (아직 전송하지 않음)

- UI는 Claude 별도 트리에서 맡으며 Codex의 runtime 계약 버전 1과 현 v:1 snapshot을 유지한다.
- 지정 세션이 확인되면 U-01은 Claude 고유 경로에서 fixture를 사용한 A 화면 탐색이 가능하다. 원본 A prototype/6 PNG와 index.html은 이 단계에서 덮지 않는다.
- 운영 U-02/U-03에는 C-03 완료·검증 SHA와 해당 Q 결정, index.html 독점 편집 기간이 필요하다. 현재 이를 완료 상태로 표시하지 않는다.
- APK 참조 조사: 독립 Codex 하위 에이전트 읽기 전용 완료. 부모가 참고 workflow의 서명 검사/설치/패키징/Draft 자산 검증 순서를 다시 확인했다. [설계의 APK 준비](player-id-safety-20261007-design.md#apk-후속-전달-준비-미빌드)를 참조한다.
