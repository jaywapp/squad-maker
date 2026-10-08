# Android preview 구성 판단

이번 실행 목표는 코드에 적합한 Android 구성을 판단하도록 승인했다. 앞선 계획에서 Capacitor가 확정된 것으로 간주하지 않고 독립 비교 후 **Capacitor 8 + 작은 자체 native plugin**을 preview 구성으로 채택한다. 정식 슬롯·가격·운영 광고 정책은 별개다.

| 후보 | 근거 |
|---|---|
| Capacitor8 | 기존 A HTML/vanilla JS, v:1와 export 회귀를 재사용. native 수명주기·FileProvider 공유를 공식 plugin으로 연결하고 원자 저장/SAF만 작은 자체 plugin으로 구현 가능 |
| native WebViewAssetLoader | Android 전용 대안으로 유효하나 bridge 보안·수명주기·파일 선택·공유를 자체 유지해야 함 |
| RN/Flutter 재작성 | 현재 데이터 보호·피치/패턴/GIF·A UI를 다시 구현해야 하므로 APK 목표에 필요한 범위보다 변경 비용이 큼 |

관련 공식 자료: [Capacitor8](https://capacitorjs.com/docs/updating/8-0), [로컬 WebView 자산](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content), [RN](https://reactnative.dev/docs/intro-react-native-components), [Flutter](https://docs.flutter.dev/learn).

고정 npm: core/android/cli 8.5.2, app 8.1.2, share 8.0.3, esbuild 0.28.2. API36·JBR21 환경을 사용하고 실제 생성 template·빌드 결과를 검증한다. Ionic/React·팀 서버·Preferences에 전술 원본을 도입하지 않는다.

전술 container/호환 mirror는 자체 native 저장 plugin의 [AtomicFile](https://developer.android.com/reference/android/util/AtomicFile)로 한 store를 완료·재읽기 검증한다. CAS와 직렬 writer로 충돌을 표시한다. 외부 결과물은 [SAF](https://developer.android.com/training/data-storage/shared/documents-files) 쓰기 완료와 사용자 취소를 구분하고, 공유는 선택 시트 종료까지만 확인 가능하다. 수신자 전달을 보장하지 않는다.

Android web bundle은 원격 server URL을 사용하지 않고 검증된 html2canvas/GIF/worker를 앱에 묶는다. 웹 원본 CDN 동작과 분리하며 analytics는 preview에서 비활성화한다. native SDK에는 전술 데이터를 전달하지 않는다.

광고에는 [Google 공식 demo 식별자](https://developers.google.com/admob/android/test-ads)만 사용한다. 일반 앱/다른 앱 광고 ID를 재사용하지 않는다. 운영 식별자·상품·동의/대상 지역 정책이 없어 상용 수익화 완료가 아니다.

서명키 승인을 받기 전에는 debug 빌드가 자동 키를 생성하지 않게 하고 unsigned release compile/build만 진행한다. 승인 후 전용 preview 키로 동일 APK를 설치·검증한다. 개인 키/비밀번호는 git와 로그·공개 문서에 남기지 않는다.
