# T7 Run Line 실기기 검증 체크리스트

2026-10-08 현재 실제 연결 Android 기기 없음. **아래 10개 모두 미검증**이며 향후 절차다. Chromium의 Capacitor mock과 APK 리소스 검사는 실기기 확인을 대신하지 않는다. 후속 사용자 지시로 기존 키의 로컬 서명 APK만 준비한다. 최신 버전·파일·비교 결과와 사용자 직접 설치 절차는 [APK 실행 기록](brand-run-line-apk-20261008-tasks.md)과 [백업·설치 안내](brand-run-line-apk-20261008-install.md)를 따른다.

## 실행 전 조건

| 조건 | 현재 확인 | 향후 확인/진행 조건 |
|---|---|---|
| 기기/OS/런처 | 미확인, adb 연결 0대 | 모델·Android 버전/API·런처·테마 아이콘 지원·화면 크기 기록 |
| 서명 방식 | 기존 키 접근/이전 인증서 일치 확인·후속 로컬 서명 승인 | 실제 서명 APK 결과는 최신 APK 기록 참조. 휴대폰 설치는 사용자 직접 진행, 키·비밀값 출력/생성 금지 |
| 서명 호환 | 실기기 설치 앱 인증서 미확인 | 설치 앱 APK의 공개 인증서 SHA256을 검증 대상과 비교; 불일치이면 중단 |
| 앱 버전 | 새 source package com.jaywapp.squadmaker.preview, code1002/name0.1.0-preview.2, 이전Preview1001 | 기존 설치 versionCode 확인; 더 높은 버전이면 downgrade하지 않고 결정 요청 |
| 데이터 유지 | 실기기 미검증 | 합성 선수/전술 fixture와 기존 보관함 수·선택·저장 상태를 기록/백업 후 업데이트 전후 비교; 개인정보는 공유 증거에서 제외 |
| 설치/배포 권한 | 로컬 서명 APK만 승인. 이 세션의 휴대폰/AVD 설치·공개 배포 금지 | 사용자 직접 백업·설치·결과 기록. 추가 에뮬레이터 설치/데이터 삭제는 먼저 알리고 진행하지 않음. 공개 배포와 main 병합은 별도 승인 |

기존 공개 인증서 SHA256: `d5f7ede86e1020419ccb6a7a97fa3b8072ee6522ac878787641f19d5c33771b6`. 이는 [이전 Release 기록](a-preview-release-20261007-tasks.md)의 값으로, 현재 실기기 호환성이 확인됐다는 뜻은 아니다.

향후 설치는 호환 인증서·버전과 백업을 확인한 뒤 앱 삭제 없이 업데이트한다. `adb install -r`은 [공식 문서](https://developer.android.com/tools/adb)의 데이터 유지 재설치 옵션이나, 이 앱의 실제 데이터 보존은 설치 전후 별도 비교한다. uninstall/clear/downgrade 옵션은 사용하지 않는다. 서명 불일치 시 삭제 설치로 우회하지 않는다.

## 증거 경로와 기록 규칙

향후 증거 루트: `.work/t7-brand-run-line/<기기별별칭>/<YYYYMMDD-HHMMSS>/`. 기기 serial·계정·선수 개인정보 대신 별칭과 합성 fixture를 사용한다. `environment.json`에 검증 SHA/APK SHA256/공개 인증서/모델/OS/API/런처/versionCode, `results.md`에 실제·기대·판정·담당·시간·증거 상대 경로를 기록한다. 원본 설치 APK/백업은 Git/PR에 올리지 않는다. 공유할 이미지와 로그는 개인정보·시크릿을 제거한다. 실패/미실행을 통과로 바꾸지 않는다.

| 항목 | 향후 확인 절차 | 기대 결과 | 증거(위 루트 상대 경로) | 현재 상태 |
|---|---|---|---|---|
| 홈 아이콘 | 승인된 업데이트 후 홈에 아이콘을 배치. 실제 지원 원형/둥근 사각 마스크에서 48dp 및 보통 크기를 확인. 런처 캐시가 의심돼도 앱 데이터 삭제 금지 | pitch 바탕·lime 점·chalk 점선/화살촉, 잘림/Capacitor 기본 그림 없음 | `01-home.png`, `01-mask-notes.md` | **미검증** |
| 테마 아이콘 | Android13+/지원 런처에서 테마 아이콘 켜고/끄기, 배경화면 색 변경 후 비교 | OS 색상의 단색 Run Line 모양 유지. 미지원 OS/런처는 N/A 이유를 실제 기록 | `02-themed-on.png`, `02-themed-off.png` | **미검증** |
| 설정 아이콘 | 설정 > 앱 > 스쿼드 메이커 Preview에서 아이콘 확인 | 동일 Run Line, 앱 이름 유지 | `03-settings.png` | **미검증** |
| 첫 실행 | 프로세스 종료 후 실행을 외부 카메라 또는 화면 녹화로 최소 3회 기록. 데이터 clear 금지 | night 시스템 화면→1.4초 모션→앱. 흰 프레임/멈춤 없음, 앱 ready 뒤 종료, 최대6초 보호 | `04-cold-start.mp4`, `04-frame-times.csv` | **미검증** |
| 인트로 탭 | cold start에서 로고 진행 중 탭. 저장소 ready가 늦은 상황은 안전한 테스트 fixture로 별도 관측 | 완성 로고로 즉시 전환, 앱 ready 전에는 overlay 유지 후 종료 | `05-tap.mp4`, `05-notes.md` | **미검증** |
| 동작 줄이기 | 기기 설정의 접근성 애니메이션 제거(또는 OS 제공 동작 줄이기) 켠 뒤 cold start. WebView matchMedia 전달 여부 기록. 개발자 애니메이션 배율0만으로 reduce 전달을 가정하지 않음 | prefers-reduced-motion=reduce가 전달되면 정지 로고, 약400ms 이후 ready에 따라 종료; 전달 안 되면 실패/제약 기록 | `06-reduce-setting.png`, `06-reduced.mp4`, `06-media-notes.md` | **미검증** |
| 따뜻한 복귀 | 앱 정상 진입→홈/다른 앱→복귀 3회. 프로세스/WebView가 유지된 복귀와 OS가 종료한 cold restart를 구분 | WebView가 살아 있으면 intro 재생 없음, 선택·선수·보관 상태 유지 | `07-warm-resume.mp4`, `07-state-before-after.md` | **미검증** |
| 헤더 | 작은 폭(360/390 상당)/큰 화면에서 SVG 선명도·상단 버튼·텍스트 배율을 확인 | outline wordmark가 시스템 글꼴로 바뀌지 않음, 로고28/32 CSSpx·버튼 겹침 없음 | `08-header-portrait.png`, `08-header-wide.png`, `08-scale-notes.md` | **미검증** |
| 시스템 스플래시 | cold start 녹화에서 시작·WebView intro 첫 프레임까지 프레임 시간을 추출, Android12+와 compat를 분리 | night 단색/투명 아이콘. 단색1초 초과 시 R3 검토 대상으로 기록하고 대안 적용은 사용자 결정 | `09-system-splash.mp4`, `09-duration.csv` | **미검증** |
| Android7~11 | 실제 기기 또는 별도 승인된 API24/25·26~29·30 AVD에서 동일 서명APK를 확인. API24/25 legacyPNG,26~30 adaptive/default vector, compat 스플래시/시작/탭/reduce/header/warm을 반복. 가상 기기 결과는 실기기와 분리 | 이전 기본 아이콘 없이 정상, night compat 화면, crash 없음. 테스트한 API만 통과로 기재; 없는 API는 미검증 유지 | `10-api-<n>/environment.json`, `10-api-<n>/results.md`, `10-api-<n>/launch.mp4` | **미검증** |

## 실제 자동 검증과 향후 물리 검증의 경계

실제 자동 검증은 최종 SHA의 [실행 기록](brand-run-line-pr-20261008-tasks.md)과 PR 본문을 따른다. browser 검증은 header/web 제거/native mock의 최소시간·ready·tap·reduce·6초/번들 script 순서까지, unsigned APK 검사는 compiled resource/색/서명 없음까지다. 런처 마스크·OS 테마·흰 프레임·실제 motion 설정 전달·warm process 수명·API별 실행은 위 표에 남아 있다.
