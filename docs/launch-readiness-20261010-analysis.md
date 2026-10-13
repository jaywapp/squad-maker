# 정식 출시 준비 분석

오케스트레이터 Codex. 최신 main27a34ca97d5622d69effc46956ed23e9abb5a70a에서 feat/launch-readiness-20261010을 분리했다. PR47 e67e61dadd084cff934c3f3c5e0a811f9b02befb의 승인 Run Line 자산을 파일별 대조하며 이전 브랜치는 통째 병합하지 않는다. 기존 primary .ux-review/, 브랜딩 WT3개 및 광고 WT12개 로컬 변경은 보존한다.

사용자 요청은 검토·수정·검증·커밋·push·Draft PR을 승인한다. main 병합·공개 배포·Play 제출·기기 설치·새 키/계정 설정은 하지 않는다. 첫 출시 광고는 미정이며 제거/운영 전환하지 않는다. 패키지 ID/서명/기존 Preview 버전 규칙을 보존한다.

## 질문과 범위

Run Line은 승인된 시안명이며 PR47에서 앱 이름 변경은 제외했다. 정식 표시 이름을 한 번에 질문했고 답변 대기다. 추천 한국어 이름 스쿼드 메이커/승인 영문 로고 SQUAD MAKER. 이름 의존 변경은 답변까지 보류한다.

승인된 기존 브랜드와 편집 데스크를 보존하는 좁은 통합이므로 신규 3종 디자인 선택을 다시 만들지 않는다. 정적 로컬 편집과 기존 Vercel API를 사용하므로 Supabase 도입/저장 구조 교체는 범위 밖이다. 생성→배치·수정→저장→불러오기→PNG/GIF/.sq·공유, 회전/중단/작은 화면, 버전/브랜딩/Android 제보 연결을 끝까지 확인한다.

## 확인된 결함

- 실제 CDP touchMove 후 touchCancel이 임시 좌표를 revision 증가와 함께 저장하고 undo를 만들지 않는다. 세로·가로 각각 실제 재현했다.
- native WebView 상대 /api/feedback는 https://localhost를 요청한다. 기존 서버는 android platform을 허용하지 않고 localhost CORS는 환경설정에만 의존한다.
- 공개 https://squad-maker.vercel.app/api/feedback GET은404 HTML이며 OPTIONS도 API가 아닌 /404와 일치하고 CORS 헤더가 없다. 운영 배포/성공 접수는 미검증·출시 차단이다.
- APP_VERSION은 beta 1 (2026-07-21) 하드코딩이며 실제 Android 버전과 다르다.

실제 운영 제보를 공개 이슈로 생성하지 않는다. 로컬 handler·mock provider 통합과 운영 서버의 부작용 없는 GET/OPTIONS를 구분한다. 실기기/OS 공유/설치 데이터 보존을 통과로 표시하지 않는다.
추가 실제 관측: 짧은 가로 이름표가 겹치고, 360×640 세로 복귀에서 fixed 선택 도구가 선수 2~5를 가렸으며 두 자릿수 번호의 선택 이름도 잘렸다. 실제 터치·geometry·스크린샷으로 확인 후 좁게 수정했다. 공개 Vercel 웹은 현재 다른 영어 팀 편성 앱이며 전술 viewer가 아니다. 기존 GitHub Pages의 과거 v1 화면은 실제 합성 전술 수신·읽기 전용·두 저장키 sentinel 보존을 통과했으므로 native 공유 수신 base만 그 기존 화면으로 연결했다. 최신 UI/브랜드 및 API를 배포한 결과가 아니다. URL encoding 실패의 거짓 성공도 차단했다.