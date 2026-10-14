# 승인된 청소년 광고 보호 후속 분석

2026-10-14. orchestrator=Codex. 기존 production-identity 워크트리/미커밋 변경 위에서 진행한다.

사용자는 개인화 광고 OFF·최대 G·청소년 보호 설정 적용에 “응 그렇게 해”로 승인했다. 구현 범위는 GMA25.5.0의 TEEN baseline, PPT DISABLED, MAX_AD_CONTENT_RATING_G이며 더 강한 CHILD/under-age 신호를 유지한다. 별도 NPA=1, 생년월일/연령대 수집, UMP underAge=false 일괄 확정, 운영 광고 활성화는 승인되지 않았다.

현재 코드의 TFUA false 전달은 기존 true를 덮어쓸 수 있다. 이를 보호를 낮추지 않는 설정으로 바꾸고 실제 SDK 객체를 사용하는 Java 테스트로 검증한다. UMP/연령 판단은 미확정이다. 16+ 타깃·대한민국 첫 출시를 실제 모든 이용자의 연령/지역 확인으로 취급하지 않는다.

정식 identity는 승인값을 유지한다. Preview 패키지/서명 계보/저장·SQ 형식/광고 위치/공통10분/실패 시 내보내기는 변경하지 않는다. 기존 unsigned 산출물 네 개를 `.work/production-identity-20261014/artifacts/`에 원래 SHA256과 대조해 보존한 뒤 새 산출물을 만든다.

원격 Git 변경, CI/배포, 키 생성·서명·기기 설치·운영 광고 호출은 금지한다. 완료 기준은 보호 우선순위, 미확정 운영 광고 차단, 테스트 광고의 기존 동의 흐름 보존, 양 채널 unsigned APK/AAB·lint·unit과 실물 ID/서명 검사다.
