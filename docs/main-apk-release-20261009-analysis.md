# main 자동 APK Release 분석

orchestrator: Codex. 사용자 요청: main에 push되면 최신 설치용 APK를 자동 빌드하여 GitHub Releases에 게시한다. 중단된 정리 요청은 취소되었으며 stash/삭제/서버 종료/인계 파일 생성은 실행되지 않았다.

## 시작 상태와 승인 경계

origin/main `aa891870d9bb1649a7d64b507c232534e16cb6dd`(reachable commits71)에서 전용 `feat/main-apk-release-20261009` 작업 트리를 생성한다. 기존 Run Line PR #47은 Draft/head e67e61d, signed APK source a736c498/1002는 기존 트리에 보존한다. 기존 광고 미커밋12개와 브랜딩 트리의3개 로컬 변경을 변경하지 않는다.

GitHub repo signing Secrets/variables는 현재 없음. GITHUB_TOKEN 기본 permission은 read이며 publish job에만 contents:write를 선언한다. 기존 Preview 키는 로컬 사용만 승인되어 있다. 이전 사용자 지시의 "새 서명키·계정·비밀값 설정은 먼저 확인"과 "인증정보를 새로 입력·저장할 필요가 없다면" 조건에 따라 **기존 키/암호의 GitHub Secrets 신규 저장은 승인 전 실행하지 않는다**. 새 키/PAT/계정은 만들지 않는다. workflow와 검증·PR을 먼저 완성해 승인 대상이 구체적이게 한다.

기존 main 병합 금지도 명시적으로 해제되지 않았으므로 자동화 PR의 main 병합·최초 자동 게시를 승인 전 수행하지 않는다. 새 요청은 승인된 main push의 자동 APK 게시 동작을 구현하는 범위다. Vercel/Pages 웹 배포 재개와 휴대폰 설치는 별도이며 변경하지 않는다.

## 범위와 완료 기준

별도 workflow의 main push 이벤트(경로 필터 없음), PR에서는 검증만, full regression·sync/bundle·unsigned build/lint·기존 cert로 sign/verify·체크섬/metadata·draft 업로드/다운로드 검증·최신 main 확인 후 publish를 구현한다. 새 APK의 code는 full Git history commit count와 Preview 기준으로 증가한다. Gradle init finalizeDsl로 CI 버전만 주입하여 app/build.gradle과 PR #47의 버전 변경을 덮지 않는다.

커밋별 immutable Release를 보존하고 `releases/latest/download/squad-maker-latest.apk`를 제공한다. GitHub Latest 링크를 위해 release 자체는 non-prerelease로 게시하지만 APK는 기존 Preview namespace/인증서이며 이름·notes·metadata에 그 사실과 실기기 미검증을 명시한다. 동일 SHA 재시도, 실패·superseded main·누락/잘못된 cert·부분 업로드를 테스트한다.

원격 Sign/Release는 승인된 Secrets 등록과 main 병합 후 실제 실행을 확인해야 운영 완료다. 승인 전에는 local signing smoke(기존 key path 직접 사용, 새 key copy 없음), publish mock, PR의 무서명 CI까지 검증한다. 원격 key/암호나 실제 게시를 이미 검증했다고 주장하지 않는다.
