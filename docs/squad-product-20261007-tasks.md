# A 기획·문서 정리와 후속 작업 계획

- slug: `squad-product-20261007` · orchestrator: Codex
- [분석](squad-product-20261007-analysis.md) · [설계](squad-product-20261007-design.md) · [상품 기획](product-plan.md)
- 모든 owner/orchestrator는 Codex. 모델은 현재 Codex 세션 계열 `gpt-6`로 기록하며 별도 모델 전환을 요청하지 않았다.
- 문서 설계·리뷰는 high, 정리·게시 작업은 medium 기준. 제품 구현은 승인된 이번 범위에 없으므로 blocked다.

## 이번 문서 작업

| ID | 작업 | orchestrator | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|---|
| W0 | 지침·main·전체 트리·기존 변경 확인 | Codex | Codex | gpt-6 | high | - | w0 | 원격 전체 읽기 | main 기준점 동일·truncated=false. 로컬 status는 sandbox 오류 기록 | done (로컬 확인 blocked) |
| W1 | 독립 근거 검토 | Codex | Codex | gpt-6 | high | W0 | w1 | 원본 리뷰·A·운영 소스 읽기 | 관찰/추정·모바일·PNG 정정 대조 | done |
| W2 | 상세 기획·분석·설계·미정 목록 | Codex | Codex | gpt-6 | high | W0 | w1 | product-plan.md, squad-product-20261007-*.md | 사용자 확정·제안·미정·현 구현 구분 | done |
| W3 | 전수 분류·A/B/C·과거 계획 이동·진입점 통합 | Codex | Codex | gpt-6 | medium | W1,W2 | w2 | README.md, docs/README.md, docs/design-a, docs/archive, documentation-audit.md | 이동 매핑·원본 캡처 보존 | done |
| W4 | 전체 내부 링크·이미지·보호 경로 검증 | Codex | Codex | gpt-6 | high | W3 | w3 | 문서·HTML 참조 읽기 | 정적 참조·앵커 검사, 보호 경로 blob 비교 | done |
| W5 | 전용 브랜치·커밋·원격 게시·Draft PR | Codex | Codex | gpt-6 | medium | W4 | w4 | 문서 전용 변경 | main lease 확인, 원격 tree/compare·Draft 상태 | done (최종 원격 확인 기록은 PR 참조) |

W1은 read-only 하위 에이전트, W2는 부모의 문서 작성으로 병렬 진행했다. W3 이후는 같은 문서 링크·Git 트리를 공유하므로 순차 진행한다. 로컬 실행은 시스템 설정·권한 우회 없이 차단으로 기록하고 GitHub 커넥터를 사용했다.

## 후속 제품 구현: 단계별 의존성

아래는 착수 전 계획이다. 파일은 예상 범위이며 프레임워크 결정 뒤 다시 좁힌다. 무료량·확장량·가격·슬롯 단위·결제 시점·Android 기술 결정은 [상품 기획 결정 목록](product-plan.md#14-사용자-결정-목록)에 있다.

| ID | 단계/작업 | orchestrator | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|---|
| P0 | D1~D3 최신 코드에서 재현·원본 fixture 보존 | Codex | Codex | gpt-6 | high | 별도 구현 요청 | p0 | tests, 재현 기록 | 이름/배치/패턴 각각·초기화·.sq 재시작 | blocked |
| P1 | 인원 변경·초기화·.sq 확인/undo/즉시 저장 | Codex | Codex | gpt-6 | high | P0 | p1 | index.html, tests | 진행/취소/되돌리기/재시작·저장 오류 | blocked |
| P2 | Android 기술 후보 실험 | Codex | Codex | gpt-6 | high | 별도 구현 요청 | p0 | 격리 실험·ADR | 저장·OS 공유·오프라인·SDK·접근성 비교 | blocked |
| P3 | 로컬 팀/파일 저장 계약·이전 | Codex | Codex | gpt-6 | high | P1,P2,Q1,Q2,Q9 | p2 | 저장 계층, fixture, 이전 테스트 | v:1 읽기·원본 보존·원자적 카운터 | blocked |
| P4 | A 피치/라벨/파일 목록/공유 동선 | Codex | Codex | gpt-6 | high | P1,P3,Q8 | p3 | UI·시안·회귀 | 재생 잘림·상태/이름 동기화·목록 복귀 | blocked |
| P5 | Android 파일/공유/오프라인·실기기 | Codex | Codex | gpt-6 | high | P2,P4 | p4 | 앱 패키징·실기기 기록 | 탭/드래그/키보드/재시작·PNG/GIF 정상/오류/취소 | blocked |
| P6 | 광고·데이터 흐름·라이선스·지원 | Codex | Codex | gpt-6 | high | P4,Q7,Q11 | p4 | SDK·정책·고지 문서 | 테스트 광고·통신 실측·오클릭·지원 장애 | blocked |
| P7 | 단건 슬롯 구매·복원 | Codex | Codex | gpt-6 | high | P3,P5,Q1~Q6,Q9 | p5 | 결제/권한·복원 테스트 | 보류/취소/중복/재설치/환불·로컬 데이터와 구분 | blocked |
| P8 | 1차 출시 게이트·스토어 자료 | Codex | Codex | gpt-6 | high | P5,P6,P7(도입 시),Q11 | p6 | 출시 증거·스토어 자산 | 기획 12장 전항목·미정 해소·실기기 증거 | blocked |
| P9 | 2차 팀 공간·광고 제거 설계 | Codex | Codex | gpt-6 | high | P3,P8,Q10 | p7 | 별도 analysis/design/tasks | 권한·공유·이전·수익 방식 결정 | blocked |

P1의 각 손실 수정은 같은 index.html과 복구 상태를 쓰므로 순차 구현한다. P2는 격리 실험이면 P0/P1과 병렬 가능하다. P5/P6는 SDK·앱 설정 공유 여부를 확인해 독립 파일만 병렬로 배정한다. 결제 도입 시점이 미정이므로 P7을 무조건 1차 필수 완료로 간주하지 않는다. 후속 작업 착수 때 실제 실행 모델·담당·files·상태를 갱신한다.

## 검증·게시 기록

이번 작업의 정적 검사·원격 비교 결과와 제한은 [문서 정리 기록](documentation-audit.md)에 남긴다. 앱 테스트·실기기 검증은 실행하지 않았으며 기존 테스트 결과를 이번 실행 결과로 재사용하지 않았다. main 병합·배포는 수행하지 않는다.
