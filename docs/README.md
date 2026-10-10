# 스쿼드 메이커 문서 안내

**최신 기준은 [상세 상품 기획서](product-plan.md)입니다.** 사용자 선택은 A — 피치 중심 코치형입니다. 제품 방향과 현재 웹 구현을 구분하며, 상품의 미정 수량·가격을 임의로 확정하지 않습니다.

| 읽을 목적 | 문서 |
|---|---|
| 사용자·문제·단계별 기능·화면·슬롯·출시 기준 | [상세 상품 기획서](product-plan.md) |
| A의 실제 원본 캡처와 아직 반영되지 않은 개선 | [A 자료](design-a/README.md) |
| 요청·권한·근거·이번 문서 작업 범위 | [분석](squad-product-20261007-analysis.md) |
| 정보 구조·저장/이전·UI 인계·구매 계약 제안 | [설계](squad-product-20261007-design.md) |
| 작업 ID·Claude UI/Codex 기능 역할·세션 인계·APK 전달·완료 기준 | [실행 로드맵과 작업계획](squad-product-20261007-tasks.md) |
| 운영 웹의 기능·실행·테스트·운영 참고 | [현재 웹 구현 참고](current-web-reference.md) |
| P0-01~03 데이터 보호·C-01 구현과 검증 | [분석](data-safety-ui-contract-20261007-analysis.md), [설계](data-safety-ui-contract-20261007-design.md), [실행 기록](data-safety-ui-contract-20261007-tasks.md) |
| 선수 ID 충돌 재현·연속 추가·저장 회귀 | [분석](player-id-safety-20261007-analysis.md), [설계](player-id-safety-20261007-design.md), [검증](player-id-safety-20261007-tasks.md) |
| Claude A UI가 사용할 상태·저장·내보내기 계약 v1 | [UI 계약](ui-state-save-export-contract-v1.md) |
| 로컬 보관·Android preview 상태 및 검증 | [분석](a-android-preview-20261007-analysis.md), [설계](a-android-preview-20261007-design.md), [실행](a-android-preview-20261007-tasks.md) |
| 현재 C-03·native 저장/내보내기 계약 v2 | [UI 계약 v2](ui-state-save-export-contract-v2.md), [Claude 요청문](a-android-preview-20261007-claude-request.md), [Android 결정](android-preview-architecture.md) |
| 문서 전수 분류·이동·참조 검증 결과 | [정리 기록](documentation-audit.md) |
| A UI 통합 APK 및 Release 검증 | [분석](a-preview-release-20261007-analysis.md), [설계](a-preview-release-20261007-design.md), [실행](a-preview-release-20261007-tasks.md) |
| 2026-10-08 전체 PR 병합·자동 배포 중단·기존 작업 보존 | [분석](pr-cleanup-20261008-analysis.md), [설계](pr-cleanup-20261008-design.md), [실행](pr-cleanup-20261008-tasks.md) |
| main push 자동 서명 APK와 GitHub Release 준비 | [분석](main-apk-release-20261009-analysis.md), [설계](main-apk-release-20261009-design.md), [작업계획](main-apk-release-20261009-tasks.md) |
| 2026-10-09 UX/UI 점검 결과와 개선 작업 지시서(1단계 작은 수정 → 2단계 패턴 화면 → 3단계 콘셉트 3종) | [분석](ux-fix-20261009-analysis.md), [설계](ux-fix-20261009-design.md), [작업 지시서](ux-fix-20261009-tasks.md) |
| 2026-10-09 UX 개선 Codex 전체 인계와 실행 기록 | [분석](ux-fix-20261009-codex-analysis.md), [설계](ux-fix-20261009-codex-design.md), [작업계획](ux-fix-20261009-codex-tasks.md), [검증 기록](ux-fix-20261009-codex-report.md) |
| 2026-10-10 사용자 확정① 편집 데스크 운영 적용 | [분석](editing-desk-20261010-analysis.md), [설계](editing-desk-20261010-design.md), [작업계획](editing-desk-20261010-tasks.md), [검증·인계](editing-desk-20261010-report.md) |

## 유지하는 근거와 운영 참고

- 2026-10-03 이전 UI 시안(PR #37): [분석](ui-redesign-analysis.md), [설계](ui-redesign-design.md), [작업](ui-redesign-tasks.md), [1차 시안](ux-concepts/ui-redesign/README.md), [2차 시안](ux-concepts/ui-redesign-v2/README.md). 고유 원본·폰트 라이선스를 보존한 과거 비교 자료이며 현재 선택된 A 운영 기준은 위의 최신 계약과 통합 실행 문서를 따른다.
- [2026-10-07 독립 UX 검토 원본](2026-10-07-ux-ui-independent-review.md): 원본 환경의 관찰·추정. 새로운 Android 검증 결과가 아니다.
- [분석 이벤트 사전](analytics-event-dictionary.md), [분석 ADR 0001](adr/0001-analytics-provider.md): 현재 웹 구현 참고. 과거 가격·가입 가설은 최신 상품 기준에서 제외.
- 성능·안정성 이력: [분석](runtime-resilience-20260909-analysis.md), [설계](runtime-resilience-20260909-design.md), [작업·검증](runtime-resilience-20260909-tasks.md).
- 워크스페이스 설정 이력: [분석](workspace-environment-setup-analysis.md), [설계](workspace-environment-setup-design.md), [작업](workspace-environment-setup-tasks.md).
- A 운영 UI(U-02/U-03, Claude): [분석](a-ui-20261007-analysis.md), [설계](a-ui-20261007-design.md), [작업·검증](a-ui-20261007-tasks.md), [Codex 인계](a-ui-20261007-handoff.md). 화면 검증은 Chromium 에뮬레이션이며 실제 Android 검증이 아니다.
- [보관 문서·선택되지 않은 B/C·이전 비교안](archive/README.md). 과거 “선택 대기”, 구독·가격·GitHub Pages·CI 부재 언급은 당시 기록이다.

## 작성 규칙

저장소 [AGENTS](../AGENTS.md)와 [CLAUDE](../CLAUDE.md)를 우선합니다. 분석·설계·작업의 역할을 나누고 확정/제안/미정/현 구현을 표기합니다. 실제 UX 구현 전에는 요구된 디자인 스킬·pre-flight와 사용자 선택 기록을 확인합니다. UI·시각·반응형·접근성은 Claude 담당으로 확정했습니다. 실제 구현은 작업계획의 계약·파일 소유권을 기준으로 도구별 별도 실행 트리에서 진행합니다. 현재 문서 작업은 운영 UI를 구현하지 않습니다.

문서의 진입점은 이 파일 하나로 유지합니다. 새 내용은 여기서 연결하고 오래된 계획은 archive로 분류합니다. 원본 증거·라이선스·지침·운영 설정을 임의로 삭제하지 않습니다. 시크릿·토큰·키·.env 값은 문서에 남기지 않습니다.
