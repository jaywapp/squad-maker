# 내보내기 전면 광고 작업

orchestrator=Codex. 기존 세션 승인의 테스트 광고와 APK build 폴더 전달을 이어간다. Android 플러그인과 웹 연동/테스트는 별도 파일 소유권으로 병렬 수행하고 통합·빌드·서명·Git은 root가 순차 수행한다.

| ID | 작업 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| A1 | 요구사항·현재 경로·정책 확인 | Codex root | gpt-6.1-sol | high | 없음 | plan | 문서 3개 | 사용자 요청·공식 문서·호환 계약 | 완료 |
| A2 | 전면 광고 사전 로드·표시·간격·Java 테스트 | Codex native_ads | gpt-6.1-sol | high | A1 | implement | SquadAdsPlugin.java, ExportAdPolicy.java, 해당 Java 테스트 | SDK 수명주기 정적 검토·Junit·컴파일 | 완료 |
| A3 | export facade·생성 경계·안내·단위 테스트 | Codex root | gpt-6.1-sol | high | A1 | implement | index.html, app/platform-native.js, tests/unit/platform-native.test.js | 오류 통과·중복 방지·기존 경로 유지 | 완료 |
| A4 | native facade E2E 작성 | Codex export_qa | gpt-6.1-sol | high | A1 | implement | tests/e2e/export-interstitial-20261014.spec.js | GIF/SQ/text·실패·중복·비대상 | 완료 |
| A5 | 통합 검증·리뷰 | Codex root, export_review | gpt-6.1-sol | high | A2,A3,A4 | verify | 위 파일·검증 기록 | unit/E2E/Java/Android/lint·기존 화면 확인 | 완료 |
| A6 | 서명 APK·build 전달·PR | Codex root | gpt-6.1-sol | high | A5 | release | build/*, README·docs | source/서명/hash·익명 다운로드 | 진행 중 |

## 검증 결과

- `npm.cmd run test:unit`: 165개 통과. 광고 facade 단위 테스트 포함.
- 신규 `export-interstitial-20261014.spec.js`: desktop 1280/mobile 390에서 26개 통과. 인접 공유·코치·내보내기 회귀 18개도 통과.
- Playwright는 `.work/export-interstitial.playwright.config.js`의 격리 포트 4397을 사용했다. 샌드박스 내 localhost 접근 실패 후 동일 범위의 권한 확장 실행이 통과했다.
- `npm.cmd run android:sync` 통과. 생성된 Capacitor 설정의 로컬 의존성 경로는 원래 저장소 상대 경로를 유지했다.
- `:app:compileReleaseJavaWithJavac :app:testReleaseUnitTest :app:lintRelease`: 성공. Java 정책 테스트 7개와 기존 예제 1개 통과. lint 0 errors, 기존 5 warnings.
- 별도 읽기 전용 코드 리뷰에서 수정이 필요한 결함 없음. 루트도 JS diff·Java 정책/콜백·모바일/데스크톱 캡처를 직접 확인했다.
- impeccable detector는 기존 경고 테두리 1건만 보고했다. 이번 안내 문구는 기존 패널 안에서 줄바꿈하며 가로 넘침이 없다.
- `adb devices -l`에 연결 기기가 없다. 실제 SDK 표시·닫기·Activity 복귀·앱 재시작 후 간격 유지의 기기 실행 검증은 미실행이다. 브라우저는 native facade이고 GIF 경계 검증의 encoder는 fixture를 사용한다.
