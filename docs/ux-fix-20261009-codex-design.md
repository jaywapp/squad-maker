# UX 개선 Codex 실행 설계

orchestrator: Codex. [원본 상세 설계](ux-fix-20261009-design.md), [A 운영 UI](a-ui-20261007-design.md)를 구현 계약으로 사용한다. 앱은 아마추어 축구 전술 편집용 Operate 화면이며 NightPitch 차콜 그린·초크 선택·라임 주 행동을 보존한다. taste 스킬의 landing/portfolio 기본값·새 프레임워크/패키지 제안은 이 기존 dense product UI에 적용하지 않는다.

## 소유권과 순서

한 구현 세션이 index.html 및 필요한 기존 테스트 기대값만 소유한다. phase1 완료 후 root의 리뷰/검증/로컬 커밋을 기다렸다가 phase2를 진행한다. root는 새 regression/evidence runner, 계획/이슈 상태·실행 기록·Git 및 server를 소유한다. 콘셉트 담당은 `docs/ux-concepts/ux-fix-20261009/`만 소유하며 index/tests/계획을 편집하지 않는다. 독립 사전 리뷰는 읽기만 한다. shared 서버·브라우저 실행은 root가 순차 관리한다.

## phase1·2 보완 판단

원본 F/P2 설계를 따른다. 번호 대비는 굵기만으로 통과를 가정하지 않고 피치 축소를 반영한 실제 크기·foreground/background 대비를 측정한다. 사용자 선수 색은 데이터로 보존한다. 패턴 화면의 반지름/이름 크기는 시각 렌더만 보정하고 경로 hit test/저장 데이터는 바꾸지 않는다. detached GIF canvas의 CSS clientWidth가0인 경우도 처리한다. 진행률 transform 전환은 값·aria·기존 export 실패 경계를 유지한다. 새 키보드 이동은 기존 mutation/save/undo 경로를 재사용하며 입력·모달에 전역 방향키를 적용하지 않는다.

## 콘셉트

세 콘셉트 모두 같은 자료와 A 토큰으로 가로844×390, 1920 설정 열, 결과물 헤더 분리를 다룬다. 방향은 2열/3열 편집, 몰입 피치+레일/시트, 라인업 매치카드로 실질적으로 구분한다. 정적 SVG/CSS 피치와 작업 가능한 컨트롤/내보내기 샘플을 사용하며 장식 이미지 생성이나 dependency 추가가 필요하지 않다. 모바일390·가로844×390·desktop1280/1920에서 확인한다. 프로토타입은 데이터 저장 계약·실제 백업 파일 형식을 구현했다고 표시하지 않는다. 사용자 선택 전에는 이 구조를 index.html에 옮기지 않는다.

## 검증과 증거

새 baseline은 `.work/ux-fix-20261009/{baseline,phase1,phase2}/`에 SHA·명령·exit·테스트 수와 bundle hash로 기록한다. 정규 UX 증거는 `docs/ux-fix-20261009/evidence/codex-20261009/`에 기존 파일을 덮지 않고 저장한다. 실제 오류·미검증·detector 오탐을 구분한다. 로컬 preview는 public web bundle/prototype만 localhost 별도 포트에서 제공하여 repo/키/.env를 노출하지 않는다. 기존4318 서버를 종료·변경하지 않는다.
