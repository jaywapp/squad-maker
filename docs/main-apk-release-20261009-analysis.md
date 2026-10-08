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

## 확인 결과와 남은 제약

구현 SHA b930dbd 및 PR merge source db09bb11에서 새 CI의 실제 sync/bundle·version init·unsigned·lint·unit128/E2E195를 검증했다. 기존 키를 직접 사용한 local signing smoke 및 공개4파일 publisher 계약도 통과했다. [PR48](https://github.com/jaywapp/squad-maker/pull/48)은 Draft이며 최종 문서 변경도 새 workflow PR CI로 확인한다.

기존 모바일 전체패턴 GIF E2E skip1은 인코딩 시간 절약을 위한 desktop-only 조건이다. 데스크톱 전체 GIF 및 모바일 단일 GIF는 PASS이며 모바일 전체 GIF는 미검증이다.

이번 main 기반 lint는 **0 errors/15 warning instances, 8종류**다. 이전 PR47에서 보고한 경고8개와 수를 혼동하지 않는다. 8종은 Gradle 최신버전 권고1, AppCompat 최신버전 권고1, min24에서 drawable-v24 불필요1, UnusedResources7, monochrome 누락2, splash density 크기1·중복1·densityless 위치1이다. 빌드를 차단하지 않지만 테마 아이콘과 스플래시의 시각적 제약이 남는다. PR47의 브랜딩 자산·리소스를 이 자동화 브랜치에서 수정하지 않는다. 의존성 경고는 업데이트 권고이며 무단 upgrade를 하지 않는다. npm ci는 기존 lockfile에서 moderate 취약점4개도 보고했으며 범위 밖의 audit fix/lockfile 변경은 하지 않았다.

원격 Ubuntu signing step의 실제 Secret 전달·키 복원·삭제, draft Release 업로드/다운로드·latest 게시는 승인 전 **미검증**이다. publishing의 실패/재시도/동일code 다른source 경계는 mock unit29개로 검증했으며 실원격 실행으로 표시하지 않는다. 휴대폰 설치와 실기기 T7도 미검증이다.
