# 콘셉트 01: 편집 데스크

[실행](index.html) · [로컬 실행](http://127.0.0.1:4320/concept-01/index.html) · [비교 목록](../index.html)

선수와 도구가 항상 같은 자리에 있는 편집 화면이다. 1920에서는 목록 220px, 피치 유동 열, 설정 340px의 3열이며 1280에서는 목록을 접어 2열로 바뀐다. 가로 844×390에서는 피치와 276px 선택 도구를 나란히 둔다. 숫자는 목록에서 작게, 본문 위계는 촘촘하게 유지하며 모션은 즉시 상태 교체다.

대표 결과물은 팀명·전술·인원·포메이션·상태를 피치 위 불투명 띠에 놓는다. 피치는 헤더보다 24px 아래에서 시작한다. 팀명과 선수명 수정이 PNG에 반영된다.

트레이드오프: 큰 화면에서 찾기 쉬운 대신 편집기 크롬이 가장 많다. 390 세로에서는 선택 도구가 피치 아래에 있어 스크롤이 필요하다. 가로에서는 팀 설정과 전체 지침을 접고 도구 열 내부 스크롤을 허용한다. 데모의 저장·GIF·선수 드래그 한계는 [공통 README](../README.md)를 따른다.

실제 검증: root의 최종 확인에서 4 viewport, 넘침 0, 44px 미만 컨트롤 0, native dialog Esc·포커스 복귀, 대표 PNG 생성이 통과했다. 1920 설정 열은 340px다. 앱 콘솔 오류 0, 선택 이름 카운터와 변경한 골키퍼 색상의 SVG·실제 PNG 반영, 가로 하단 이동 후 이름표 경계가 통과했다. 스크린샷은 외부 글꼴을 차단한 시스템 대체 글꼴 렌더다.

실제 화면: [1280](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-01-1280.png), [1920](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-01-1920.png), [390](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-01-390.png), [844×390](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-01-844x390.png), [결과물](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-01-result.png), [다운로드 PNG](../../../ux-fix-20261009/evidence/codex-20261009/concepts/confirmation/concept-01-export.png).

가로 피치 하단은 y=385로 화면 높이 390 안에 있다. [모바일 Lighthouse 13.4.1 보고서](../../../ux-fix-20261009/evidence/codex-20261009/concepts/lighthouse/concept-01.json)의 Accessibility는 100이다. 초기 재현 수치는 [첫 검증 기록](../../../ux-fix-20261009/evidence/codex-20261009/concepts/verification.json)에 보존한다.

제한: PNG 선수 이름은 6자 초과이면 앞 5자와 말줄임표로 표시한다. 실제 기기·운영 저장소·공유 앱 실사용·GIF 인코딩·전략 기능은 미검증 또는 데모 범위 밖이다. reduced-motion·글자 확대의 별도 실제 수치는 보고하지 않는다. 사용자 선택 제시는 root가 진행한다.
