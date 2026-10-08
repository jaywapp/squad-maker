# Run Line 설치용 APK 실행 기록

orchestrator: Codex. root만 버전/helper/문서/Git/서명 작업을 소유한다. 독립 Codex reviewer는 helper diff 읽기만 맡는다. APK·키·암호는 reviewer에게 전달하지 않는다. 공유 빌드 산출물·환경 입력 때문에 native 빌드/서명은 순차 실행한다.

| ID | orchestrator | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| APK-01 | Codex | Codex | gpt-6.1-sol | high | 없음 | read | 규칙/Git/이전 public 증거·기존 key 접근 | old cert 일치/키 읽기/신규 저장0 | 완료 |
| APK-02 | Codex | Codex | gpt-6.1-sol | medium | APK-01 | sequential | app/build.gradle, build-preview-apk.ps1 | 1001→1002·artifact version 일치·입력 격리 | 코드·문법 검토 완료, 실제 APK 대기 |
| APK-03 | Codex | Codex | gpt-6.1-sol | high | APK-02 | read | helper diff 읽기 | secret logging/generation/inheritance 없음 | 완료·실제 결함 없음 |
| APK-04 | Codex | Codex | gpt-6.1-sol | medium | APK-03 | sequential | 로컬 .work만·최종 source SHA | clean build/lint/sign/zipalign·old APK metadata 비교 | 대기 |
| APK-05 | Codex | Codex | gpt-6.1-sol | medium | APK-04 | documentation | 인계 문서/T7/PR #47 | APK hash·source·version·cert·manual 단계·Draft/배포중단 | 대기 |
| T7 | Codex | Codex | gpt-6.1-sol | high | 사용자 직접 설치/기기 결과 | held | 향후 기기 증거만 | 실제10항목/기존데이터 비교 | 미검증·이번 세션 설치 금지 |

## 검증 구분

이전 ec4a661의 unit95/desktop105/mobile104+1skip/native/lint0오류8경고는 과거 실행이다. 이번 최종 source의 native 빌드·서명 결과 및 PR CI는 아래 근거와 PR 본문에 별도로 기록한다.

증거 루트 `.work/branding-apk-20261008/`: build-sign.log, previous-preview-public.json, build-verification.json, signature-verify.txt, zipalign-check.txt, apk-badging.txt, lint XML/HTML, checksum, CI JSON. 자격정보 record/키/암호를 저장하거나 복사하지 않는다. Signed APK는 `.work/artifacts/squad-maker-0.1.0-preview.2.apk`에 두며 원격 업로드하지 않는다.

물리 기기 연결0대. 기존 SDK AVD2개는 목록만 조회했고 부팅/추가설치/데이터 삭제를 하지 않았다. 이번 APK 에뮬레이터 검증은 미검증이며 설치가 필요하면 먼저 사용자에게 알린다. 실기기 T7와 데이터 유지도 미검증이다.

## 커밋 전 검토

root와 독립 Codex reviewer가 version 증가·안전한 versionName filename·기존 env 격리·개별 .sq 백업 안내를 검토했다. Critical/High 또는 실제 결함 없음. PowerShell helper/로컬 runner AST 문법 검사 통과. 이 문서의 status는 APK 생성 전 시점이며 이후 실제 source SHA/서명 APK/비교 결과/CI와 완료 상태는 같은 PR #47 본문 및 build-verification.json에 기록한다. 키/암호는 신규 입력·출력·복사·저장하지 않는다.
