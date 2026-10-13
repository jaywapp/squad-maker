# 정식 출시 준비 작업 계획

orchestrator=Codex. 모든 owner=Codex/model=gpt-6.1-sol/effort=high. 사용자 최신 지시가 전체 구현을 Codex에 맡겼으며 기존 승인 브랜드·편집 데스크를 보존한다. 파일 소유권은 순차 반환했다. Git은 root만 수행한다.

| ID | 작업 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| L1 | 최신 main/PR·기존 변경 보존 | Codex | gpt-6.1-sol | high | 없음 | inspect | Git·문서 | SHA/PR/WT변경 | 완료 |
| L2 | Run Line 파일별 대조 | Codex | gpt-6.1-sol | high | L1 | inspect | 읽기 전용 | 승인 원본bytes/blob | 완료 |
| L3 | 제보·버전 조사 | Codex | gpt-6.1-sol | high | L1 | inspect | 읽기 전용 | 실제404·handler | 완료 |
| L4 | 기능 QA 조사 | Codex | gpt-6.1-sol | high | L1 | inspect | 읽기 전용 | touchCancel 실제 재현 | 완료 |
| L5 | 선택 자산·native 통합 | Codex | gpt-6.1-sol | high | L2 | implementation | branding, Android res/MainActivity | 원본·리소스/Java 컴파일 | 완료 |
| L6 | 브랜드·버전·화면/취소 오류 | Codex | gpt-6.1-sol | high | L2,L4 | implementation | index/buildscript/capconfig | 실제 회귀/독립 리뷰 | 독립 구현 완료·정식 이름 대기 |
| L7 | 제보 client/server/native | Codex | gpt-6.1-sol | high | L3 | implementation | API/app/관련 unit | URL/CORS/timeout/provider/초안 | 완료·운영404 별도 차단 |
| L8 | 새 회귀·공유·실제 화면 | Codex | gpt-6.1-sol | high | L4,L6,L7 | implementation | launch E2E·ignored QA | 터치·왕복·작은 화면·실제 Pages수신 | 최종 결과는 PR |
| L9 | 최종 커밋 검증 | Codex | gpt-6.1-sol | high | L5,L6,L7,L8 | final | ignored logs/PR | 단위/전체E2E/sync/unsigned/lint | 커밋 뒤 실행·PR에 결과 |
| L10 | 출시 항목·T7·Draft PR | Codex | gpt-6.1-sol | high | L9 | final | docs/PR | scope/증거/무배포 | 문서 완료·최종 PR에 상태 |

[최종 인계](launch-readiness-20261010-report.md)·[별도 출시 체크리스트](launch-readiness-20261010-release-checklist.md)를 따른다. L9 결과는 최종 branch SHA에서 새로 실행해 PR 본문 및 `.work/launch-readiness-20261010/final/`에 남긴다. 문서의 미래 실행 계획을 검증 통과로 해석하지 않는다.

main 병합·공개 배포·Play 제출·기기 설치·새 키/계정 설정 금지. 별도 광고 미커밋 변경·원본 브랜치·기존 서버 보존. force push/브랜치 삭제 없음. T7는 미검증이다.