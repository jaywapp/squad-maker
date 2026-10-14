# 병합 후 수동 출시 준비

## 이미 확정한 값

- 정식: `아이엠 헤드코치`, `com.jaywapp.iamheadcoach`, `1.0.0 /1`.
- Preview: `아이엠 헤드코치 Preview`, `com.jaywapp.squadmaker.preview`, 기존 서명 계보·Git 증가 버전 정책.
- Google 관리 Play App Signing+별도 업로드 키 전략, 지원 `blueheart.dev@gmail.com`, 첫 대한민국·한국어, 실제16+ 대상 및 Play16~17/18+ 검토.
- 정식 Play flexible, 사용자 동의 다운로드/최신 저장 확인 뒤 명시 재시작. Preview 외부 APK 자체 업데이트 없음.
- 테스트 광고 기본값, TEEN/PPT OFF/G 및 기존 더 강한 보호 유지. 실제 운영 광고는 계속 차단.

## 검증된 로컬 준비 방법

clean Git source/HEAD를 기록하고 저장소 root에서 다음을 실행한다. 기존 서버를 재사용하거나 종료하지 않는다.

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = 'C:\Users\jaywa\AppData\Local\Android\Sdk'
git rev-parse HEAD
git status --short
npm run test:unit
npm run android:sync
```

Android 디렉터리에서 명시된 flavor tasks를 사용한다.

```powershell
.\gradlew.bat :app:assemblePreviewRelease :app:assembleProductionRelease :app:bundleProductionRelease :app:testPreviewReleaseUnitTest :app:testProductionReleaseUnitTest :app:lintPreviewRelease :app:lintProductionRelease -PsquadAdsMode=test --offline --console=plain
```

출력은 `android/app/build/outputs/apk/preview/release/app-preview-release-unsigned.apk`, `android/app/build/outputs/apk/production/release/app-production-release-unsigned.apk`, `android/app/build/outputs/bundle/productionRelease/app-production-release.aab`다. **unsigned 검증 자료**이며 폰 설치/Play 제출용 서명 파일은 별도 준비해야 한다.

source SHA와 working tree clean, 실제 package/label/version, asset hash 일치, APK/AAB SHA-256과 unsigned/alignment를 확인한다. Preview는 commit count와 SHA가 바뀌므로 이전1102/9e 산출물을 최신 설치 파일로 재명명하지 않는다. 형식/데이터/Preview update compatibility의 실제 폰 검증은 별도이다.

## 실제 출시 전 실행·승인 대기

| 항목 | 현재 상태 | 다음 실행 조건 |
|---|---|---|
| 정식 키/서명 | 전략 확정, 실제 키 생성·연결 미실행 | 별도 승인 후 업로드 키를 로컬 안전 보관하고 signed AAB 검증. 키/비밀번호 출력·Git·공개 업로드 금지 |
| Play 앱 등록/트랙 | 미실행 | 사용자 승인 후 비공개 트랙/계정·기기 준비. 동일 package/서명 계보와 낮은/높은 versionCode의 실제 Play 설치본으로 업데이트 검증 |
| 운영 광고 | 계정 인증·연령/동의 절차·스토어 연결 미완료; production mode 빌드 차단 | 실제 절차/정책 결정과 구현·검증 후 별도 운영 빌드 선택. TFUA 임의 true/false 입력으로 차단 우회 금지 |
| 공개 정책/지원/Data safety | 지원메일/국가/언어/대상 확정, 실제 공개 URL/운영자·양식 미완료 | AdMob 및 Play Core 처리를 실제 구현에 대조. 정책 페이지 공개와 스토어 제출은 별도 승인 |
| app-ads.txt/개발자 사이트 | 실제 연결 미확인 | 광고 계정·사이트/스토어 등록을 대조한 후 승인받아 설정 |
| 제보 | 보강 취소, 기존 API404 미복구 | 이번 준비에서는 원래 구현 유지. 기존 접수 UI 처리·다른 접수 체계는 별도 요청 |
| CI/웹 배포 | repo/workflow 비활성 유지 | 자동화 재개는 별도 요청. 현재 old YAML aggregate `assembleRelease/lintRelease`·옛 산출물 경로를 실제 flavor 경로와 먼저 정비해야 함 |
| 공개 출시/Release/설치 | 미실행 | 검증 완료한 서명 산출물과 실기기 증거를 제시하고 별도 승인 |

폰 확인은 [Play·데이터 체크리스트](play-updates-20261014-device-checklist.md)를 따른다. Preview의 모든 .sq를 백업→앱 삭제 없이 같은 서명 업데이트→저장 데이터 유지 확인, 정식은 별도 package라 .sq 복원→수정·저장→재시작 보존을 따로 확인한다. 실패를 삭제/초기화/강제 다운그레이드로 해결하지 않는다.

Vercel/Supabase 사용을 전제로 새 호스팅·백엔드·정책 URL을 만들지 않았다. 이번 준비는 실제 공개 운영/광고 활성화/Play 심사 완료가 아니다.
