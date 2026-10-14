# Google Play 업데이트 작업 계획

orchestrator=Codex. 기존 identity/광고는21파일 검증 사본으로만 재사용하고 원본은 읽기 전용이다. 제보·Vercel·Supabase 준비는 사용자 변경 지시로 취소했다.

| 작업 | owner/model/effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|
| U0 상태/소유권/원본 보존 | Codex/current/high | 없음 | setup | analysis/design/tasks, ignored snapshot | HEAD/owner/hash/Actions | 완료 |
| U1 native flexible/receipt | Codex/gpt-6.1-sol/high | U0, 계약 | native | UpdatesPlugin/Policy/Receipt+2tests, MainActivity/Storage/Gradle dependency | eligibility/cancel/resume/race/gate; SDKcompile/49Java | 완료 |
| U2 제보/API/IssueForms/영속 store | Codex/gpt-6.1-sol/high | U0 | feedback | 신규 제품 파일 없음 | 기존 API/client/UI 원복 | 취소 |
| U3 업데이트 controller | Codex/gpt-6.1-sol/medium | U0/U1 계약 | controller | app/update-controller.js/unit | fake 취소/동시성/receipt/버전/세대 | 구현 완료 |
| U4 저장 barrier/UI/bridge/bundle | Codex/current/high | U1/U3 | integration | index.html/platform-native.js/build script | latest write/readback/last revision/inert | 완료 |
| U5 업데이트 E2E | Codex/gpt-6.1-sol/medium | U4 계약 | e2e | tests/e2e/play-updates-20261014.spec.js | 양 viewport/보존/restart 차단/모달 닫기 | 완료,34/34·최종영향72 |
| U6 읽기 전용 교차 리뷰 | Codex/gpt-6.1-sol/high | U1/U3/U4 | review | 코드 수정 없음 | 잠금 충돌/늦은 SDK 응답/범위 | 완료, High/Medium 수정 확인 |
| U7 fresh 로컬 검증/인계 | Codex/current/high | U1~U6 | verification | unit/Android/E2E/lint/docs | final code/evidence/original hash | 로컬 완료, actual Play/실기기 미검증 |

원본 WT/기존 서버/다른 세션/키는 변경하지 않는다. 동일 파일 수정은 소유권 인계 후에만 진행했다. parallel 구현은 독립 파일이며 계약 확정 후 root가 통합했다. commit/push/PR/merge/Release/배포/Play 업로드/서명·기기 설치는 이번 범위 밖이다.
