# 아이엠 헤드코치 로컬 Preview APK 준비 설계

orchestrator=Codex, owner=Codex, model=gpt-6.1-sol/medium. [분석](iam-headcoach-local-preview-20261011-analysis.md)의 승인 범위로 기존 빌드·서명 도구를 사용한다. 키·설치 호환성 판단은 root의 high 리뷰가 담당한다.

## 처리 흐름과 책임

문서·범위를 고정하고 root가 final 문서 commit을 만든다. 그 SHA와 full-history 상태를 기록한 뒤 unit→Android web bundle/sync→metadata version plan→unsigned build/lint→기존 Preview 키 sign→서명·인증서·APK identity·zipalign 검사→로컬 파일 전달 순서로 진행한다. 빌드 검사는 root가 순차 실행하며 문서 담당은 실행하지 않는다. 기존 서버·앱 코드·CI·원격 정책을 바꾸지 않는다.

| 계약 | 기대값·검사 방법 |
|---|---|
| 앱 이름 | 실제 APK label이 `아이엠 헤드코치 Preview`; source strings뿐 아니라 aapt 결과로 확인 |
| 설치 ID | `com.jaywapp.squadmaker.preview`; applicationId/namespace/scheme 보존 |
| 서명 | 기존 Preview 인증서 SHA-256 `d5f7ede86e1020419ccb6a7a97fa3b8072ee6522ac878787641f19d5c33771b6`와 최종 signed APK 인증서 비교; 새 키 생성 없음 |
| versionCode/name | full-history metadata plan과 실제 APK 값을 대조. 1091 추정값을 확정값으로 사용하지 않음 |
| 비교 기준 | 공개 baseline1085보다 code 증가 확인. 실제 휴대폰 설치 version은 미확인이라 별도 확인 필요 |
| SDK·정렬·서명 검증 | min24/target36, 최종 signed APK의 zipalign 및 apksigner verify 결과 기록; 기존 v2/v3와 업데이트 계보 확인 |
| 저장·공유·광고 | 기존 데이터/schema/`.sq`/공유 주소/광고 설정 보존; 설치 후 데이터 유지까지 자동 통과로 선언하지 않음 |
| 산출물 | 최종 signed 파일의 실제 경로·bytes·SHA-256 및 build SHA/generation을 함께 기록 |

## 증거 구조

ignored `.work/iam-headcoach-local-preview-20261011/final`에 새 stage log/metadata와 APK를 둔다. 각 stage는 source SHA·시작/끝 SHA·명령·실제 상태·종료코드·시각·log를 기록하고, final generation에는 version plan, 실제 APK identity, 서명 검증·인증서 public digest, 정렬 결과·APK hash를 연결한다. 비밀 값·credential 원문·private key를 출력/문서/PR/외부에 포함하지 않는다. 인증서 public digest와 APK hash는 비교용 공개 metadata다.

문서 commit 이후 새 빌드 결과를 같은 tracked 문서에 자기 SHA와 함께 다시 commit하지 않는다. generation 결과는 ignored 증거와 PR54 본문에서 갱신한다. source 작업표는 준비 계획이며 실제 완료를 증명하는 stage 결과와 구분한다. 실패·취소·미실행은 그대로 남기며 이전 baseline나 c93/CI eafb 결과로 대체하지 않는다.

## 설치와 데이터 보존의 경계

[설치 안내](iam-headcoach-local-preview-20261011-install-guide.md)는 사용자 확인 절차다. 이 작업에서 실제 설치를 실행하지 않는다. 모든 팀/전술과 기존 `.sq`를 앱 밖·PC로 백업한 뒤 앱을 삭제하지 않고 APK를 업데이트한다. 설치 오류가 나면 삭제/초기화/강제 downgrade 없이 중단하고 APK identity·서명·설치본 version을 비교한다.

기존 test 서명 APK 준비는 정식 Play signing key 전략이나 production 출시 승인과 다르다. 기존 key를 쓰더라도 실제 기기에 더 높은 version 또는 다른 인증서의 APK가 설치돼 있으면 업데이트를 보장할 수 없다. 이 미확인을 없애려고 임의로 설치본을 제거하지 않는다. T7의 이름/아이콘·splash/intro·tap·reduced motion/warm·rotation/font scale·기존 데이터 항목은 기대결과와 실제 증거를 분리한다.
