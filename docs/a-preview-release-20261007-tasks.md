# A UI Android preview 실행 기록

orchestrator: Codex. owner: Codex. UI는 Claude 완료 인계를 입력으로 사용한다. 공유 파일 및 메모리 자원 경합으로 구현과 무거운 검증은 순차 실행한다. 읽기 전용 계약 리뷰만 독립 위임한다.

| ID | 작업 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| I-01 | 원본 보존·별도 브랜치·UI merge | Codex | GPT-6 | high | 없음 | sequential | Git | 두 SHA 포함, 원본 clean | 완료 |
| I-02 | 정책 문구·회귀·head CI 설정 | Codex | GPT-6 | high | I-01 | sequential | index.html, tests/e2e, build-preview-apk.ps1, CI | diff/단위/desktop/mobile | 완료 |
| I-03 | native/UI 계약 읽기 리뷰 | Codex | gpt-6.1-sol | high | I-01 | read-review | index, platform-native, plugins | 구체적 위험·근거 | 완료 |
| I-04 | commit·draft PR·exact head CI | Codex | GPT-6 | high | I-02,I-03 | sequential | docs/Git/PR | source head CI | 완료 |
| I-05 | 승인 키 서명·실제 APK 검증 | Codex | GPT-6 | high | I-04 | sequential | .work 로컬 증거 | 패키지/버전/서명·native 흐름 | 진행 |
| I-06 | Release·재다운로드·재설치·인계 | Codex | GPT-6 | high | I-05 | sequential | 공개 자산/문서 | 동일 해시/인증서·재설치 | 대기 |

## 시작 기록

native 21c2b5474e77d97aef827b0d45e311eb585d1164, UI d6c16cefb32500b02c8e975b701b67e216ef9233 원격과 일치. 원본 두 작업 트리 clean. 통합 merge SHA 8c87b7f6477d671233910b0d237e53988b65e263. 기존 키 승인 유지, main 병합 없음. 중단된 106-pass run 및 legacy APK 검증은 최종 합계에 넣지 않는다.

독립 리뷰 완료(8c87b7f): 저장 장치 읽기 실패 복원 안내 및 touchcancel 상태 정리 보완. 기존 디자인 detector 경고 2개(기존 경고 모달 border-left, GIF 진행 폭 transition)는 범위 밖으로 기록. npm 설치 첫 실행은 진행 없이 중단했으며 통과로 합산하지 않는다.

## 통합 코드 검증

- 공식 npm CLI 직접 호출, 잠금파일 npm ci --offline: 148 packages 설치. 의존성/lockfile 변경 없음. npm.cmd 대기 실행은 중단했고 검증 통과에 합산하지 않음.
- 단위 95/95; desktop 96/96; mobile 95 통과 + 기존 전체 패턴 GIF 1 skip. E2E 합계 191 통과/1 skip.
- 새 touch-cancel 회귀 2개는 수정 전 merge head에서 모두 해당 UI assertion으로 실패했고 finally에서 통합 소스를 복원함.
- 저장 장치 읽기 실패 안내/터치 취소 변경 diff 재리뷰: 새 High/Critical 없음.
- Android web bundle 생성 성공, 계약 v2/v:1/library version1, 로컬 export assets, analytics disabled.
- 서명 helper는 동일 Node 번들+Capacitor CLI sync를 직접 호출, PowerShell syntax 검사 성공. 실제 서명 빌드는 CI 후 진행.

I-05 실제 실행: d326f335 CI 2건 성공. 기존 승인 키로 동일 CI APK를 서명하고 전용 AVD에 설치했다. Android Emulator 35.6의 초기 화면 정지/ANR는 공개 진단에서 HWUI 대기로 확인됐고, 원본 SDK 변경 없이 프로젝트 로컬 공식 Emulator 37.2.12로 정상 A UI·테스트 광고 실행을 확인했다. 원본 AVD 데이터는 보존했다. 현재 발견된 짧은 높이 피치 중첩을 최소 수정한 뒤 새 head APK로 최종 검증한다.

짧은 높이 보완 검증: 단위 95/95, 새 360×682/360×640 기하 2개 및 touchcancel 2개 통과. 시작 배율 assertion은 CSS만 적용한 상태에서 두 화면 모두 실패를 재현했다. 최소 수정 후 독립 diff 재리뷰에 새 High/Critical 없음. 새 소스 head의 CI 및 APK 설치를 진행한다.

I-05 native 진단: .sq 복원 후 2회 추가는 ID [1,3,2,4]로 모두 고유하며 빈 ID를 재사용하는 기존 계약을 따른다. 검사기의 [1,3,4,5] 가정은 잘못되어 수정했고 실제 위치·지침·패턴 비교를 진행한다. Android SAF가 .sq.json으로 저장하는 문제를 발견해 SquadDocumentsPlugin.java의 선택기 MIME만 최소 보완하고 새 CI/APK를 검증한다.
