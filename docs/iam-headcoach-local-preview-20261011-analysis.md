# 아이엠 헤드코치 로컬 Preview APK 준비 분석

2026-10-11, orchestrator=Codex, owner=Codex. 문서 담당 model=gpt-6.1-sol/medium, 키·업데이트 호환성 리뷰는 gpt-6.1-sol/high다. 사용자는 PR54의 기존 작업 트리에서 기존 Preview 키를 재사용해 로컬 설치용 서명 APK를 준비하도록 승인했다. 이번 승인은 APK 준비이며 실제 기기 설치·공개 게시 승인이 아니다. 이미 확정된 브랜드·코드·기존 키 사용 방식으로 진행하므로 추가 승인 gate를 만들지 않는다.

## 기준과 현재 근거

- 시작 작업 트리: `D:\station\.worktrees\squad-maker-korean-branding-20261010`, 브랜치 `feat/korean-branding-20261010`, HEAD `c93ac560b65dd2aaaaa0743d15da941e03854314`. 기존 PR54를 이어 사용한다.
- 기술명 `iam-headcoach`, Android 표시명 `아이엠 헤드코치 Preview`, 정식 브랜드·웹 표시 `아이엠 헤드코치`는 [확정 대응표](iam-headcoach-preview-20261010-design.md)를 따른다. 새 UI·폰트·색·마크를 만들지 않는다.
- root가 기존 방식으로 Preview 키를 열고 공개 인증서 digest를 확인했다고 보고했다. 기존 키의 인증서 SHA-256은 `d5f7ede86e1020419ccb6a7a97fa3b8072ee6522ac878787641f19d5c33771b6`이며 기대값과 일치한다. 새 키·인증 설정을 만들지 않았다. 문서 담당은 키·credential 원문을 읽거나 서명하지 않았다.
- root가 확인한 비교 기준은 공개 Release `apk-1085-27a34ca97d56`의 로컬 사본이다. package `com.jaywapp.squadmaker.preview`, versionCode `1085`, versionName `0.1.0-preview.1.main.83.27a34ca9`, minSDK24/targetSDK36, 인증서 digest 위 기대값, v2/v3 서명 확인. APK SHA-256은 `811970e2440e29115671c933cb2e84047e220a084a3e572a7cb620e6fcc7b379`이다. 이 비교 기준의 source `27a34ca9`는 현재 코드를 검증한 결과가 아니다.
- 휴대폰에 실제 설치된 package·version·인증서와 데이터 상태는 **미확인**이다. 공개 최신 APK와 사용자의 설치본이 같다고 가정하지 않는다.

## 승인 범위와 보존 경계

root는 최종 문서 commit 뒤 해당 SHA에서 새 unit·bundle/sync·unsigned Android·lint를 실행하고 기존 Preview 키로 sign·verify·zipalign을 확인한다. 패키지·서명 계보·저장키/schema/CAS/undo·`.sq` 형식·공개 globals/events·공유/API 주소·광고를 변경하지 않는다. 기존 인증서는 설치 호환성 점검의 한 근거이며 실기기 업데이트 성공을 대신하지 않는다.

폴더 이동, 현재 세션 및 기존 서버4317/4318/4319 변경, 실제 기기 설치·삭제·초기화, 강제 downgrade, 공개 Release·Play 배포·main merge는 하지 않는다. 다른 작업이 추가한 `docs/README.md` migration 행과 `iam-headcoach-migration-20261011-*` 네 문서는 보존하고 본 문서 담당이 수정하지 않는다.

## 새 검증과 이전 증거의 구분

이전 PR54 검증은 head `c93ac560`과 CI 실제 checkout `eafb7885`의 source tree 동일성에 근거한 별도 CI 결과다. 이전 로컬 E2E는 desktop52 pass 관측 후 취소·전체 미완료, 로컬 Android도 취소·미완료였다. 그 결과를 새 로컬 빌드 성공으로 전환하지 않는다. baseline1085·이전 CI·새 로컬 final generation은 각각 분리해 기록한다.

새 versionCode는 `ci-apk-version.gradle`과 APK metadata plan의 full-history 계산 및 실제 APK 검사로 확인한다. **1091은 예상값일 뿐 최종 값이 아니다.** 문서 commit 수·빌드 source에 따라 달라질 수 있으며 APK에서 읽기 전 확정하지 않는다. baseline1085보다 증가하는지 확인하되, 미확인 휴대폰 설치본보다 증가했다고 선언하지 않는다.

## 산출물과 완료 기준

이 [분석](iam-headcoach-local-preview-20261011-analysis.md), [설계](iam-headcoach-local-preview-20261011-design.md), [작업계획](iam-headcoach-local-preview-20261011-tasks.md), [설치 안내](iam-headcoach-local-preview-20261011-install-guide.md)를 먼저 고정한다. 최종 build SHA·실제 version·APK hash·인증서·서명/정렬·검사 결과는 ignored `.work/iam-headcoach-local-preview-20261011/final`과 PR54 본문에 generation별로 기록한다. 자기 commit SHA를 문서에 다시 쓰기 위한 반복 commit을 만들지 않는다.

준비 완료는 새 final source의 실제 검사·기존 인증서 일치·package/label/min/target/version·서명·정렬·산출물 hash를 확인하고 로컬 전달 파일을 제시하는 것이다. 설치·데이터 유지·T7 통과는 별도이며 전부 미검증 상태다. backup 후 앱 삭제 없이 업데이트하고 오류 시 원본 자료를 유지하는 절차를 전달한다.
