# 콘셉트 03: 라인업 매치카드

[실행](index.html) · [로컬 실행](http://127.0.0.1:4320/concept-03/index.html) · [비교 목록](../index.html)

팀명과 42px 포메이션을 매치 보드 머리에 두고 라인업과 편집을 370px 오른쪽 열에 나눈다. 목록에서도 선수를 선택할 수 있다. 가로에서는 목록·지침을 접어 피치와 264px 선수 도구를 남긴다. 390에서는 팀 설정을 펼친다. 선택 토큰 150ms 크기 피드백을 사용하며 reduced-motion에서 제거한다.

대표 결과물은 팀명, 포메이션, 날짜를 피치 위 140px 경기 카드 머리에 모은다. 날짜는 실제 경기 일정이 아닌 공통 예시 날짜 `2026.10.09`다. 팀명·선수명·색상·위치가 PNG에 반영된다.

트레이드오프: 공유할 모양을 편집 중에도 이해하기 좋지만 피치 높이가 머리줄만큼 줄어든다. 큰 화면의 오른쪽 열이 길어질 수 있고 390에서는 도구가 아래에 배치된다. 844×390에서는 피치가 세 방향 중 가장 작다. 데모의 저장·GIF·선수 드래그 한계는 [공통 README](../README.md)를 따른다.

실제 검증: root의 최종 확인에서 4 viewport, 가로 넘침 0, 44px 미만 컨트롤 0, native dialog Esc·포커스 복귀, 대표 PNG 생성이 통과했다. 1920 설정 열은 370px다. 1280에서 피치 아래로 스크롤하는 구성은 허용한다. 앱 콘솔 오류 0, 선택 이름 카운터와 변경한 골키퍼 색상의 SVG·실제 PNG 반영, 가로 하단 이동 후 이름표 경계가 통과했다. 스크린샷은 외부 글꼴을 차단한 시스템 대체 글꼴 렌더다.

가로 844×390에서는 첫 배치의 피치 하단 y=395가 화면을 넘었다. 피치 높이를 9px 줄이고 가로 이동의 하단 경계를 80%로 제한한 뒤 최종 하단 y=386으로 확인했다. 아래 가로 캡처는 보정 후 최종 증거다. 초기 재현은 [첫 검증 기록](../../../ux-fix-20261009/evidence/codex-20261009/concepts/verification.json)으로 보존한다.

실제 화면: [1280](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-03-1280.png), [1920](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-03-1920.png), [390](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-03-390.png), [844×390](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-03-844x390.png), [결과물](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-03-result.png), [다운로드 PNG](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-03-export.png).

[모바일 Lighthouse 13.4.1 보고서](../../../ux-fix-20261009/evidence/codex-20261009/concepts/lighthouse/concept-03.json)의 Accessibility는 100이다.

제한: PNG 선수 이름은 6자 초과이면 앞 5자와 말줄임표로 표시한다. 실제 기기·운영 저장소·공유 앱 실사용·GIF 인코딩·전략 기능은 미검증 또는 데모 범위 밖이다. reduced-motion·글자 확대의 별도 실제 수치는 보고하지 않는다. 사용자 선택 제시는 root가 진행한다.
