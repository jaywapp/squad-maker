# 정식 식별자 적용 설계

2026-10-14. orchestrator=Codex. 이미 승인된 식별자만 적용한다.

`scripts/production-build-config.gradle`의 `approvedProductionIdentity`에 승인된 applicationId/versionCode/versionName을 기록한다. 기존 production flavor가 이 값을 사용하므로 앱 구조·데이터 형식·namespace는 변경하지 않는다. Preview는 `com.jaywapp.squadmaker.preview`, 기존 이름·서명 계보·1002+전체 커밋 수 버전을 유지한다. 정식 버전은 독립 계보로 1부터 시작한다.

productionRelease도 기본 광고는 Google 샘플이다. 운영 ID는 기존 source map에 유지하고 production 모드의 명시적인 연령 설정 요구는 그대로 둔다. 이번에는 운영 모드에 연령 값을 주지 않아 차단됨을 확인하며 실제 운영 ID가 든 APK/AAB는 만들지 않는다. 운영 광고 보호안 구현은 별도 결정 이후다.

release signingConfig를 추가하지 않는다. APK는 apksigner 검증 실패의 원인이 서명 부재임을 확인하고, AAB는 ZIP의 JAR 서명 항목과 jarsigner 결과로 unsigned를 확인한다. APK manifest/resources/DEX와 AAB manifest/resources/DEX를 읽어 실제 포함된 식별자와 광고 ID를 검사한다. Gradle 구성·생성 필드 검사만으로 실제 패키지 검증을 대신하지 않는다.

기존 node_modules는 동일한 lockfile을 확인한 뒤 새 워크트리로 복사해 독립 생성물을 사용한다. Android Studio JBR21, 캐시된 Gradle8.14.3, 기존 SDK36을 사용한다. dependency 다운로드·SDK 설치·키 생성은 하지 않는다. 로컬 빌드는 오프라인으로 시도하며 불가 시 정확한 차단 사유를 기록한다.

Preview와 정식 앱은 저장소가 다르며 자동 데이터 이전은 없다. 기존 `.sq` 내보내기·복원 계약/회귀는 PR #57 그대로다. 이번 변경은 저장·UI·네이티브 광고 동작을 변경하지 않으므로 전체 브라우저 E2E 반복보다 실제 Android 패키지와 정책/Java 검증에 집중한다.
