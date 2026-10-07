# 스쿼드 메이커 문서 안내

**최신 기준은 [상세 상품 기획서](product-plan.md)입니다.** 사용자 선택은 A — 피치 중심 코치형입니다. 제품 방향과 현재 웹 구현을 구분하며, 미정 수량·가격·기술을 확정하지 않습니다.

| 읽을 목적 | 문서 |
|---|---|
| 사용자·문제·단계별 기능·화면·슬롯·출시 기준 | [상세 상품 기획서](product-plan.md) |
| A의 실제 원본 캡처와 아직 반영되지 않은 개선 | [A 자료](design-a/README.md) |
| 요청·권한·근거·이번 문서 작업 범위 | [분석](squad-product-20261007-analysis.md) |
| 정보 구조·저장/이전·UI 인계·구매 계약 제안 | [설계](squad-product-20261007-design.md) |
| 작업 ID·Claude UI/Codex 기능 역할·인계·결정 게이트·완료 기준 | [실행 로드맵과 작업계획](squad-product-20261007-tasks.md) |
| 운영 웹의 기능·실행·테스트·운영 참고 | [현재 웹 구현 참고](current-web-reference.md) |
| 문서 전수 분류·이동·참조 검증 결과 | [정리 기록](documentation-audit.md) |

## 유지하는 근거와 운영 참고

- [2026-10-07 독립 UX 검토 원본](2026-10-07-ux-ui-independent-review.md): 원본 환경의 관찰·추정. 새로운 Android 검증 결과가 아니다.
- [분석 이벤트 사전](analytics-event-dictionary.md), [분석 ADR 0001](adr/0001-analytics-provider.md): 현재 웹 구현 참고. 과거 가격·가입 가설은 최신 상품 기준에서 제외.
- 성능·안정성 이력: [분석](runtime-resilience-20260909-analysis.md), [설계](runtime-resilience-20260909-design.md), [작업·검증](runtime-resilience-20260909-tasks.md).
- 워크스페이스 설정 이력: [분석](workspace-environment-setup-analysis.md), [설계](workspace-environment-setup-design.md), [작업](workspace-environment-setup-tasks.md).
- [보관 문서·선택되지 않은 B/C·이전 비교안](archive/README.md). 과거 “선택 대기”, 구독·가격·GitHub Pages·CI 부재 언급은 당시 기록이다.

## 작성 규칙

저장소 [AGENTS](../AGENTS.md)와 [CLAUDE](../CLAUDE.md)를 우선합니다. 분석·설계·작업의 역할을 나누고 확정/제안/미정/현 구현을 표기합니다. 실제 UX 구현 전에는 요구된 디자인 스킬·pre-flight와 사용자 선택 기록을 확인합니다. UI·시각·반응형·접근성은 Claude 담당으로 확정했습니다. 실제 구현은 작업계획의 계약·파일 소유권을 기준으로 도구별 별도 실행 트리에서 진행합니다. 현재 문서 작업은 운영 UI를 구현하지 않습니다.

문서의 진입점은 이 파일 하나로 유지합니다. 새 내용은 여기서 연결하고 오래된 계획은 archive로 분류합니다. 원본 증거·라이선스·지침·운영 설정을 임의로 삭제하지 않습니다. 시크릿·토큰·키·.env 값은 문서에 남기지 않습니다.
