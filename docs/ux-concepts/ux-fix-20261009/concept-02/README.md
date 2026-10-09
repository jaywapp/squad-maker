# 콘셉트 02: 피치 스튜디오

[실행](index.html) · [로컬 실행](http://127.0.0.1:4320/concept-02/index.html) · [비교 목록](../index.html)

피치를 중심에 크게 놓고 위·아래 이동을 왼쪽 48px 레일에 모은다. 선택 선수 번호를 44px로 강조하고 나머지 화면 위계는 낮춘다. 데스크톱 인스펙터 320px를 보장하며 가로 모바일에서는 248px다. 390에서는 팀 설정을 필요한 때 펼친다. 레일 hover는 접근을 보여 주는 3px 이동, 설정은 200ms 상태 전환이다. reduced-motion에서 즉시 바뀐다.

대표 결과물은 팀명과 전술 정보를 피치 아래 캡션에 둔다. 최상단 피치 선을 가리지 않으며 캡션까지 포함한 하나의 PNG를 생성한다.

트레이드오프: 피치에 집중하기 좋지만 이동 레일과 이름 편집이 나뉜다. 가로 설정을 펼치면 같은 도구 열을 스크롤하므로 선수 도구가 아래로 밀린다. 390에서 레일이 피치 폭 일부를 사용한다. 결과물을 채팅에서 위쪽만 보면 팀명 캡션이 늦게 보일 수 있다. 데모의 저장·GIF·선수 드래그 한계는 [공통 README](../README.md)를 따른다.

실제 검증: root의 최종 확인에서 4 viewport, 넘침 0, 44px 미만 컨트롤 0, native dialog Esc·포커스 복귀, 대표 PNG 생성이 통과했다. 1920 설정 열은 320px다. 앱 콘솔 오류 0, 선택 이름 카운터와 변경한 골키퍼 색상의 SVG·실제 PNG 반영, 가로 하단 이동 후 이름표 경계가 통과했다. 스크린샷은 외부 글꼴을 차단한 시스템 대체 글꼴 렌더다.

실제 화면: [1280](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-02-1280.png), [1920](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-02-1920.png), [390](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-02-390.png), [844×390](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-02-844x390.png), [결과물](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-02-result.png), [다운로드 PNG](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-02-export.png).

가로 피치 하단은 y=387로 화면 높이 390 안에 있다. [모바일 Lighthouse 13.4.1 보고서](../../../ux-fix-20261009/evidence/codex-20261009/concepts/lighthouse/concept-02.json)의 Accessibility는 100이다. 초기 재현 수치는 [첫 검증 기록](../../../ux-fix-20261009/evidence/codex-20261009/concepts/verification.json)에 보존한다.

제한: PNG 선수 이름은 6자 초과이면 앞 5자와 말줄임표로 표시한다. 실제 기기·운영 저장소·공유 앱 실사용·GIF 인코딩·전략 기능은 미검증 또는 데모 범위 밖이다. reduced-motion·글자 확대의 별도 실제 수치는 보고하지 않는다. 사용자 선택 제시는 root가 진행한다.
