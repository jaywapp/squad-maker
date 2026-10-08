# Run Line 최종 검토와 Draft PR 분석

orchestrator: Codex. 2026-10-08의 최종 검토 요청을 기준으로 한다. [기존 적용 기록](brand-run-line-20261008-tasks.md)의 검증은 과거 미커밋 작업 트리 결과이며 이번 최종 커밋의 검증으로 재사용하지 않는다.

## 확인한 상태와 범위

- `git fetch origin` 후 main/origin/main/작업 HEAD는 `aa891870d9bb1649a7d64b507c232534e16cb6dd`. 브랜치 `feat/brand-run-line`, 해당 head의 기존 PR 없음.
- 제공 패키지 원본은 `design/brand-20261008`의 `a80e43db4aa71b12de014bc92e7b4ed13b8d4a95`. Run Line T1~T6와 관련 검토·T7 준비 문서만 포함한다. 새 디자인·자산 재생성·의존성 변경은 없다.
- 기존 광고 작업은 `squad-maker-preview-release-20261007`의 `feat/explicit-save-export-ads-20261008`에 미커밋 상태로 보존한다. 해당 트리를 편집하지 않는다.
- 브랜딩 트리의 기존 `docs/pr-cleanup-20261008-tasks.md` 변경은 관계없는 작업이라 커밋에서 제외하고 그대로 남긴다. sync 생성 Gradle 파일 2개는 정규화한 내용 diff가 없으며 PR에서 제외한다.
- 이번 사용자는 commit/push/main 대상 Draft PR을 명시적으로 승인했다. main 병합·브랜치 삭제·force push·서명 APK·실기기 설치·공개 배포는 금지했다. 신규 키·계정·인증정보를 만들거나 출력하지 않는다.
- Vercel workflow `319212590`은 `disabled_manually`. Pages는 `build_type=workflow`, 게시 workflow는 저장소에 없고 기존 사이트는 `built`. 관리형 Pages workflow 자체의 state는 active이므로 이를 disabled라고 보고하지 않는다. 기존 검증 CI는 유지한다.

## T7 부족한 정보와 질문

`adb devices -l` 결과 연결 기기 없음. 모델·Android OS·런처·기존 설치 출처·설치 인증서·실기기 데이터 보존은 **미확인/미검증**이다.

기존 Release 공개 검증 기록의 package는 `com.jaywapp.squadmaker.preview`, versionCode `1001`, versionName `0.1.0-preview.1`, RSA3072 인증서 SHA256 `d5f7ede86e1020419ccb6a7a97fa3b8072ee6522ac878787641f19d5c33771b6`, v2/v3 서명이다. 이는 물리 기기의 설치 앱과 동일하다는 증거가 아니다. 개인 키·인증정보는 조회하지 않았다.

질문은 한 번에 제출했다: 사용할 기기/OS/런처/설치 출처, 향후 기존 Preview 키 재사용 방식, 향후 백업과 호환성 확인 후 데이터 보존 업데이트 방식. 답변은 대기다. 답변이 있어도 이번 턴에서는 서명·설치하지 않으며 향후 명시적 T7 실행 지시가 필요하다. 답변 대기는 브랜딩 검토·자동 검증·Draft PR을 막지 않는다.

## 완료 기준

제공 자산과 T1~T6 diff를 직접/독립 검토하고 필요한 수정 후 새 검증을 실행한다. 최종 커밋 SHA에서 다시 unit·desktop/mobile E2E·Android bundle/sync·unsigned release·lint를 실행하고 로그에 SHA/명령/종료 코드를 남긴다. 기존 skip 1개 및 lint 경고 8개를 원인·영향과 함께 기록한다. T7는 [별도 체크리스트](brand-run-line-pr-20261008-t7.md)의 모든 실기기 항목을 미검증으로 표시한다. 최종 결과와 SHA는 Draft PR 본문에 기록한다.
