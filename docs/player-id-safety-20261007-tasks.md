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
| ID-02 수정·회귀 | Codex / 현재 설정 / high | ID-01 / write | index.html, tests/e2e/player-id-safety.spec.js | 희소/삭제/빈/높은 ID·연속 추가·저장/reload | in progress |
| ID-03 CI 검증 | Codex / 현재 설정 / high | ID-02 / verify | .github/workflows/player-id-safety.yml | baseline 결함 검출, API/전체 웹 회귀 | pending |
| ID-04 게시·인계 기록 | Codex / 현재 설정 / medium | ID-R,ID-03 / publish | 이 실행 문서·PR | 원격 head·보호 파일 blob 대조·Draft PR | pending |

동일 index.html과 검증 branch를 쓰는 변경은 순차 실행한다. 읽기 전용 독립 검토와 APK 참조 조사는 분리된 Codex 하위 에이전트로 진행한다.

## 실제 실행과 한계

- 새 로컬 shell: 명령 생성 전 sandbox 초기화 오류. 테스트/빌드가 실행됐다고 주장하지 않는다.
- 격리 실제 소스 함수: IDs [1,3,2,3], 기존 3번의 세 위치를 (240,330)으로 덮음, 재복원 invalid-input 재현.
- 브라우저/전체 회귀: 새 feature branch의 배포 없는 GitHub Actions에서 검증 예정. 결과 확인 전 통과 표시하지 않는다.
- 기존 PR42의 API 7 / 웹 151 / skip 1은 이전 세션 기록이며 이번 수정 검증 결과가 아니다.

## UI·APK 후속 게이트

C-01 계약 v1은 보존하며 C-02는 순차 인계 원칙을 따른다. C-03은 Q1 슬롯 단위/Q2 무료량/Q9 첫 출시 복구·백업 결정이 남아 있다. 지정 Claude 터미널의 실제 대상/경로도 확인 전이며 임의 메시지/키 입력은 하지 않는다. U-01의 고유 mock 경로와 운영 index.html 착수를 구분한다.

Android 정식 Q6·실제 패키징/저장/공유/설치 검증·승인된 전용 서명·Release 자산 해시 대조는 미완료다. 다른 앱의 키/ID를 재사용하지 않는다. A-04 사용자 설치용 APK의 최종 공급 목표와 기존 게시 승인은 유지한다.
