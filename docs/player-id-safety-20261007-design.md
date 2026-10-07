# 선수 ID 충돌 보호 — 설계

- orchestrator: Codex · [분석](player-id-safety-20261007-analysis.md) · [실행](player-id-safety-20261007-tasks.md)
- 현 v:1의 선수 ID는 양의 안전한 정수이며 위치·지침·패턴 경로의 키다.

## 최소 변경

공유 nextId 카운터를 없앤다. addPlayer가 인원 한도를 확인한 뒤 현재 roster ID 집합을 만든다. 1부터 집합에 없는 최소 양의 정수를 찾아 새 선수에 부여한다. 다음 추가에서도 다시 계산하므로 희소 복원이나 삭제에 영향받지 않는다.

정상 roster는 현재 모드 최대 11명 이하이며 추가 전에는 그보다 적다. 따라서 새 값은 작고 안전한 정수다. 외부에서 허용된 MAX_SAFE_INTEGER ID에도 +1을 하지 않는다. initAllSquads와 restoreState의 카운터 초기화도 제거하여 ID 할당 경로를 하나로 둔다.

세 상태의 새 ID 위치에만 기본값을 넣는다. 기존 선수와 패턴을 재번호화하지 않는다. 삭제된 ID 재사용은 기존 ctxRemove의 세 상태/패턴 참조 정리 계약을 회귀로 확인한다.

## 검증 설계

1. 실제 소스 함수로 [1,3] 복원→2회 추가→3번 세 위치 손실·중복 ID·재복원 거절을 baseline에서 확인한다. UI와 저장 호출을 mock한 격리 실행이라고 명시한다.
2. Playwright에서 실제 .sq 가져오기 확인→연속 추가→남은 선수/색상/세 위치·팀/선수 지침·다단계/공 패턴 비교→localStorage 재읽기→reload 전후 동일성을 확인한다.
3. 삭제 후 희소 명단을 저장·reload한 뒤 연속 추가한다. 삭제 참조가 다시 새 선수에 붙지 않고 남은 선수 데이터가 보존되는지 확인한다.
4. 빈 명단·MAX_SAFE_INTEGER와 1을 함께 포함한 명단·인원 한도를 확인한다. ID 고유성·양의 안전 정수와 normalizeSnapshot 허용을 함께 검사한다.
5. 새 테스트가 baseline에서 정확한 중복 실패를 검출하고 수정 후에는 통과하는지 CI에서 확인한다. 전체 npm test도 실행한다. 기존 모바일 전체 GIF skip은 변경하지 않는다.

CI는 현재 저장소의 Node 22·npm ci·고정 vendor·Playwright 설정을 따른다. 검증 환경은 Ubuntu GitHub Actions의 Chromium desktop/mobile 에뮬레이션이며 실제 Android 증거가 아니다. 동일 feature branch에만 테스트 workflow를 추가한다.

## 인터페이스와 소유권

SquadMakerContract v1과 v:1/.sq/#s= 인터페이스는 변하지 않는다. 새 팀/파일/슬롯/native adapter는 포함하지 않는다. Codex는 별도 branch의 index.html과 새 회귀 파일, 이 문서만 쓴다. 독립 Codex 리뷰는 읽기 전용이고 공유 로컬 파일이나 원본 PR42를 쓰지 않는다. Claude 운영 UI 인계는 별도 실행 트리와 최종 검증 SHA에서 순차로 한다.

## APK 후속 전달 준비 (미빌드)

[참고 Android workflow](https://github.com/jaywapp/gyungchung-mobile/blob/fa176d2b44b9d6604a39807e22b1fff20a8ead10/.github/workflows/android-release.yml#L100)의 서명 검사→동일 APK 설치→해시 패키징→Draft 자산 검증→공개 순서를 확인했다. [원격 자산 검사](https://github.com/jaywapp/gyungchung-mobile/blob/fa176d2b44b9d6604a39807e22b1fff20a8ead10/scripts/verify-public-release.mjs)는 APK/manifest/체크섬 일치와 Draft 상태를 요구한다. 해당 앱의 ID·키·토큰·Expo 스택·업데이트 서버는 복사하지 않는다.

현재 Squad Maker main/PR42 트리에 Android 앱·Gradle·APK workflow가 없고 조회 당시 Releases도 0개다. 정상 지원 실행 경로로 T-01 후보를 만들어 파일 저장/복원·OS 공유·오프라인·접근성을 시험해야 한다. PR41 A-04는 Q6 정식 채택 전 제한된 후보 APK도 허용하므로 Q6 미정 하나만으로 초기 APK를 차단하지 않는다.

초기 후보도 P0-03·T-01 검증, 전용 앱 식별자·서명 경로, 동일 APK의 설치/오프라인 저장/재시작·서명·해시 확인이 필요하다. 기본 Release 후보는 squad-maker 자체다. 현재는 그 증거와 빌드가 없으며, 새 서명 자격 증명·영구 권한 설정은 목적/보관/복구 책임이 구체화된 뒤 승인을 받는다.
