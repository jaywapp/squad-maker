# 첫 출시 별도 체크리스트

확인일: 2026-10-10. 오케스트레이터: Codex. 작업 브랜치: `feat/launch-readiness-20261010`, 기준 main: `27a34ca97d5622d69effc46956ed23e9abb5a70a`.

이 브랜치는 Draft 검토용이며 이번 변경의 공개 배포·Play 제출·기기 설치는 하지 않는다. 이 문서는 출시 전 결정과 검증을 인계하는 체크리스트다. 개인정보처리방침 완성본이나 출시 승인 기록으로 사용하지 않는다. 코드 수정·자동 검증 결과는 [실행 기록](launch-readiness-20261010-tasks.md)을 따른다.

## 현재 근거와 미확정 사항

| 항목 | 코드·문서에서 확인한 사실 | 아직 확정하거나 검증하지 않은 것 |
|---|---|---|
| 앱 식별·버전 | [Gradle](../android/app/build.gradle)과 [Capacitor 설정](../capacitor.config.json)은 `com.jaywapp.squadmaker.preview`. 조사 시 Gradle은 `1001` / `0.1.0-preview.1`이며 Android 표시 이름은 `스쿼드 메이커 Preview` | 정식 표시 이름 질문 답변, Play용 패키지·버전·Preview 전환 방식. 최종 산출물 metadata를 다시 확인 |
| 로컬 저장·백업 | [계약 v2](ui-state-save-export-contract-v2.md)의 팀/전술 보관과 `.sq` 내보내기. [Manifest](../android/app/src/main/AndroidManifest.xml)은 `allowBackup=false`, `fullBackupContent=false` | 실제 설치된 버전·인증서, 설치 전후 모든 저장 데이터 일치. `.sq` 하나가 전체 library metadata 백업이라는 보장은 없음 |
| 제보 데이터 | [API](../api/feedback.js)는 제목·내용·선택 연락처·선택 진단·앱 버전·플랫폼을 GitHub Issue 본문에 구성. IP는 제한에 사용하고 Turnstile 검증의 `remoteip`으로 전달 | 운영 보관·삭제·문의 정책, 사업자·처리 국가·실제 로그/SDK 데이터 흐름. 저장소 public은 GitHub API로 확인하고 제보 창에 공개 고지를 추가함 |
| Android 권한·광고 | 소스 Manifest에 `INTERNET`, 파일 공유용 FileProvider가 있음. Google 샘플 app ID, [SquadAdsPlugin](../android/app/src/main/java/com/jaywapp/squadmaker/preview/SquadAdsPlugin.java)의 샘플 배너 ID·`testOnly=true`·`테스트 광고` 표시 | 최종 병합 Manifest/SDK가 추가한 권한과 실제 데이터 통신, 첫 출시 광고 포함 여부·형식·빈도·연령·지역·동의 방식 |
| 공유·호스팅 | 기존 GitHub Pages의 과거 v1 수신은 실제 합성 전술로 확인. Vercel 웹은 현재 다른 앱이며 최신 전술 viewer가 아님 | 정식 웹/API host 결정·연결·승인된 배포, 최신 Run Line/편집 데스크 공개 수신 확인 |
| 운영 제보 | [분석 기록](launch-readiness-20261010-analysis.md)에 공개 `/api/feedback` GET의 404 HTML, OPTIONS의 404/CORS 미지원 관측 | 운영 배포 후 JSON/CORS 정상 응답, 실제 Android WebView Turnstile의 운영 hostname·토큰 검증·접수 흐름 |

[상품 기획서 §10](product-plan.md#10-광고-개인정보-라이선스와-지원)의 과거 `1차 광고 포함`은 이번 사용자 지시의 `첫 출시 광고 미정`을 확정하는 근거로 쓰지 않는다. 현재 테스트/Preview 설정을 유지하고 운영 광고 전환을 자동 수행하지 않는다.

## 개인정보·제보·지원

- [ ] 운영자 명칭, 개인정보 문의 담당자·연락처, 지원 경로·응답 기준을 사용자가 확정한다. 개발자 계정 소유자나 저장소 작성자 이름을 운영자로 추정하지 않는다.
- [ ] 로컬 전술, 외부 `.sq`/PNG/GIF, 공유 링크, 제보, 광고 SDK, 분석, 서버 로그를 구분한 데이터 흐름 표를 작성한다. 항목·목적·필수/선택·전송 상대·처리 국가·보관·삭제·권리 경로를 실제 동작과 대조한다.
- [ ] API가 선택 연락처와 진단을 GitHub Issue에 넣는다는 사실을 반영해 공개 여부·공개 고지·민감정보 입력 방지·삭제 요청 처리 방식을 결정한다. GitHub API에서 private=false/visibility=public을 확인했고 제보 창에 공개 등록 및 선택 연락처/진단 공개 가능성을 명시했다. 운영 보관·삭제·문의 정책은 여전히 미정이다. 이 확인을 위해 실제 사용자 제보나 공개 이슈를 생성하지 않는다.
- [ ] Turnstile, GitHub, 호스팅, 광고 SDK와 설정 시 활성화되는 분석을 포함해 제3자 데이터 처리와 네트워크를 확인한다. 로컬 중심·테스트 광고라는 이유로 외부 데이터 처리가 없다고 선언하지 않는다. 소스 Manifest만으로 최종 SDK 권한을 확정하지 않는다.
- [ ] 확인된 결정으로 개인정보처리방침을 작성하고 앱 내 접근 경로와 공개 URL을 검증한다. Google Play는 개발자/문의 정보, 데이터 처리·공유, 보관·삭제 등의 설명을 요구하며 앱 내부와 Play Console에서 접근할 수 있어야 한다. 현재 저장소의 제보·진단 안내를 완성된 처리방침으로 대체하지 않는다. [Google Play User Data 정책](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)
- [ ] 실제 수집·공유·보호 동작 및 제3자 SDK를 반영한 Data safety를 작성하고 개인정보처리방침과 대조한다. 제출 트랙의 적용 범위를 제출 시점에 확인하며 Preview 검증만으로 신고 완료를 표시하지 않는다. [Google Play Data safety 안내](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [ ] 대상 연령·지역, 광고/동의 정책, 라이선스 고지와 지원 문구를 별도로 검토한다. 적용 법률·보관 기간·국외 처리 조건은 운영 정보 없이 추정하거나 법적 적합성을 선언하지 않는다.

## 첫 출시 광고

- [ ] 광고 포함 여부, 위치·형식·빈도, 동의·거절·광고 제거 방향을 사용자에게 확인한다.
- [ ] 결정 전 현재 Google 샘플 ID·테스트 배너·Preview 설정을 보존한다. 별도 광고 작업 트리의 미커밋 변경을 이번 브랜치에 합치지 않는다.
- [ ] 운영 광고 전환이 승인되면 별도 작업에서 SDK 데이터 처리·동의·최종 권한·정책을 검증한다. 새 계정/키/운영 ID 설정은 별도 승인 후 진행한다.
- [ ] 테스트 광고에서도 오클릭·회전·작은 화면·TalkBack·백그라운드 복귀를 확인하고, 요청 실패·오프라인·동의 거절이 편집·저장·내보내기를 막지 않는지 검증한다.

## Play 산출물·서명·배포 승인

| 단계 | 확인할 산출물·결정 | 현재 상태 |
|---|---|---|
| 빌드 검증 | unsigned release APK·lint는 컴파일 검증용. unsigned APK는 설치용 서명 APK가 아님 | 최종 실행 결과는 tasks에서 확인 |
| Play용 AAB | 별도 승인된 작업에서 `:app:bundleRelease` 수행, source SHA/패키지/버전/해시 기록 | 이번 체크리스트 작성 중 빌드하지 않음 |
| 설치용 APK | 휴대폰에 설치할 서명 APK의 package/버전/인증서·호환성 확인 | 새 APK 서명·설치 미수행 |
| Play App Signing | app signing key와 upload key의 역할, 기존 Preview와의 업데이트 관계·Play 등록 전략 결정 | 미정. 기존 Preview 서명 기록을 Play 결정으로 간주하지 않음 |
| 제출·공개 | Play 계정/트랙/등록 정보/정책/데이터 신고 검토, 업로드·제출·공개 각각 승인 | 이번 작업에서 수행하지 않음 |

AAB는 직접 기기에 설치하는 APK가 아니다. Gradle의 `bundle<Variant>`로 AAB를 만들고 기기 설치용 APK를 별도로 준비한다. [Android 명령줄 빌드 안내](https://developer.android.com/build/building-cmdline)

Android APK 설치·업데이트에는 서명이 필요하다. Play 배포용 bundle에는 upload key 서명과 Play App Signing 절차가 필요하며, Google이 관리하는 app signing key와 업로드 확인용 key의 역할을 구분한다. 기존 Preview와 다른 패키지나 서명 전략은 데이터 보존 업데이트로 추정하지 않는다. [Android 앱 서명 안내](https://developer.android.com/studio/publish/app-signing.html)

- [ ] 최종 앱 표시 이름과 Preview 접미사, 스토어 패키지 전략을 확정한다. 패키지·키·버전을 자동 변경하지 않는다.
- [ ] 실제 설치 앱과 후보 APK의 package, 버전, 공개 인증서를 비교한다. 충돌·더 높은 설치 버전·불일치가 있으면 중단한다.
- [ ] 기기 설치·로컬 서명·키/계정 준비·Play 제출·공개 배포는 각각 실행 직전 별도 승인을 받는다. 이 문서의 체크박스는 실행 권한을 부여하지 않는다.
- [ ] main 병합과 자동/공개 배포 상태 변경도 이번 Draft 검토 범위와 분리한다.

## 운영 제보 검증

- [ ] 승인된 운영 배포 후 `/api/feedback`의 GET JSON과 Android `https://localhost` origin에 대한 OPTIONS/CORS를 부작용 없는 요청으로 확인한다. 현재 404 관측이 해결되기 전 운영 접수 가능으로 안내하지 않는다.
- [ ] 실제 Android WebView에서 운영 Turnstile hostname 설정, 위젯 표시·토큰 발급·만료·서버 검증을 확인한다. localhost CORS 코드 지원과 모의 Turnstile 통과는 운영 hostname의 검증 근거가 아니다.
- [ ] 실제 접수 검증은 저장소 공개 여부·개인정보 안내·운영 담당 승인 후, 승인된 합성 내용으로 수행한다. 운영자에게 보내거나 이슈를 만드는 행동을 이번 작업에서 자동 실행하지 않는다.
- [ ] 404/non-JSON/네트워크 오류·timeout·검증 실패에서 오류 안내와 입력 보존·재시도를 확인하고, 운영 성공 접수와 모의 provider 통합 결과를 분리해 기록한다.

## 휴대폰 사용자 확인 5개

아래는 향후 백업·서명·설치 승인 이후 사용자가 확인할 간단한 목록이다. 현재 모두 실기기 미검증이다.

- [ ] **홈 아이콘:** 홈·앱 설정에서 Run Line 마크가 보이고 원형/둥근 사각 마스크에서도 잘리지 않는다.
- [ ] **첫 실행:** 프로세스를 종료한 뒤 열면 단색 스플래시 → 인트로 → 편집 화면으로 이어지고 흰 깜빡임이 없다.
- [ ] **인트로 탭:** 모션 중 탭하면 완성 로고로 넘어가고 저장소가 준비된 뒤 편집 화면이 열린다.
- [ ] **재진입:** 다른 앱으로 갔다가 돌아오면 살아 있는 WebView의 인트로가 반복되지 않고 편집 상태가 유지된다.
- [ ] **저장 데이터:** 설치 전 기록한 팀/전술 목록·이름·개수·선택·전술 내용이 모두 남아 있고 재시작 뒤에도 불러올 수 있다.

전체 [T7 확인표](https://github.com/jaywapp/squad-maker/blob/e67e61dadd084cff934c3f3c5e0a811f9b02befb/docs/brand-run-line-pr-20261008-t7.md)의 테마 아이콘·동작 줄이기·헤더·시스템 대기 시간도 함께 기록한다. 기기 모델·Android 버전·런처·후보 APK 해시를 남긴다. Android 7~11의 실제 아이콘·compat 스플래시·편집/저장/공유 runtime은 별도 미검증이다. min SDK 24 설정, 브라우저 모바일 흉내, unsigned 빌드 성공은 그 구간의 실행 증거를 대신하지 않는다.

## T7 상세 확인 절차 — 전 항목 실기기 미검증

공통 기록 위치: 승인된 후보의 `.work/launch-readiness-20261010/t7/<device-os>/`에 `device.json`(모델/OS/런처/해시/버전/공개 인증서), 화면·동영상·관찰 메모를 저장한다. 개인 키·암호·실제 사용자 전술은 증거에 노출하지 않는다. 현재 이 폴더는 향후 증거 위치이며 실제 기기 증거가 있다는 의미가 아니다.

| 항목 | 절차·기대 결과 | 향후 증거 | 현재 상태 |
|---|---|---|---|
| 홈 아이콘 | 기존 데이터 백업·승인된 업데이트 후 런처의 원형/둥근 사각 마스크에서 Run Line 마크와 앱 이름 확인; 잘림 없음 | home-icon.png | 미검증 |
| 테마 아이콘 | 지원하는 OS/런처에서 themed icons 토글; 단색 Run Line 형상 유지. 미지원 기기는 해당 없음으로 별도 기록 | themed-icon-on/off.png, device.json | 미검증 |
| 설정 아이콘 | Android 앱 정보에서 icon/name/package/version 확인; 승인 이름·빌드 metadata 일치 | settings-icon.png | 미검증 |
| 첫 실행 | 앱 프로세스 종료 후 실행; 단색 시스템 스플래시→Run Line 모션→저장 데이터 준비→편집 화면, 흰 깜빡임/중복 없음 | cold-launch.mp4 | 미검증 |
| 인트로 탭 | 인트로 초반 탭; 로고 완성 상태로 모션 종료, ready 전 편집 차단, ready 뒤 전환 | intro-tap.mp4 | 미검증 |
| 동작 줄이기 | OS의 애니메이션/동작 줄이기 설정 적용 후 cold launch; 짧은 fade·정지 로고 경로 확인. 해당 OS에서 media query 매핑도 기록 | reduced-motion.mp4, settings.png | 미검증 |
| 따뜻한 복귀 | 다른 앱으로 전환 후 동일 살아 있는 WebView 복귀; 인트로 반복 없음·편집 유지. OS가 process를 종료한 cold launch는 구분 | warm-resume.mp4 | 미검증 |
| 헤더 | 세로/가로·작은 화면·글자 확대에서 승인 wordmark/버전/목록·도움말 버튼 접근; 겹침/잘림 없음, 도움말 실제 버전 일치 | header-portrait/landscape.png | 미검증 |
| 시스템 스플래시 | Android12+ native splash와 pre12 compat 경로의 단색·테마 전환·대기/인트로 연결 확인; 성공 컴파일을 실행 검증으로 세지 않음 | splash-<os>.mp4 | 미검증 |
| Android7~11 | 이미 사용 가능한 해당 버전 기기/지원 emulator에서 legacy icon·compat splash·생성/이동/수정/저장/재시작/SQ·PNG/GIF/OS공유·제보 오류 관측. 추가 OS image 설치·앱 데이터 삭제는 먼저 알리고 승인 후 수행 | legacy-<os>/results.json, 화면/동영상 | 미검증 |

브라우저 facade의 인트로/reduced-motion/ready/회전 회귀는 위 실기기 항목과 분리해 PR에서 기록한다. 실제 Android emulator runtime 역시 이번에 수행하지 않았다.
## 향후 수동 백업·설치 순서

1. 사용자가 별도로 승인한 후보 APK의 source SHA·해시·package·version·공개 인증서와 설치된 앱의 정보를 먼저 확인한다. 개인 키·암호·실제 alias를 출력하거나 문서에 기록하지 않는다.
2. 기존 앱에서 저장 완료를 확인하고, 팀/전술 목록의 **모든 전술을 각각 `.sq`로 외부 저장**한다. 파일 열기 가능 여부와 이름·개수·선택·내용을 기록한다. `.sq` 하나, PNG/GIF, 링크, Google 자동백업으로 전체 보관 목록 백업을 대체하지 않는다.
3. 백업 위치와 후보 APK 해시를 확인한 뒤 사용자 본인이 승인된 파일을 OS **업데이트**로 설치한다. 이번 작업에서는 APK를 보내거나 설치하지 않는다.
4. 오류·서명 충돌·버전 불일치가 나오면 멈추고 원인을 확인한다. 앱 삭제, 데이터 초기화, uninstall/clear, 강제 downgrade로 우회하지 않으며 자동 rollback을 전제로 하지 않는다.
5. 위 5개와 전체 T7, 설치 전후 데이터 일치를 확인한다. 데이터 복원이나 다른 APK로 재설치가 필요하면 손실 영향을 검토하고 다시 승인을 받는다.

## 완료 기록 기준

각 항목은 결정한 사용자/날짜, 검증한 정확한 source·산출물, 실제 기기/운영 환경과 결과를 근거로 갱신한다. 미정·미검증 상태를 코드 수정이나 과거 APK 결과로 완료 처리하지 않는다. 운영자·개인정보·광고·Play 전략과 운영 제보/실기기 검증이 남아 있으므로 지금은 정식 공개 출시 가능 판정이 아니다.