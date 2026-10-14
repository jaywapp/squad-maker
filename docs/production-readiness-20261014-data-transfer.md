# Preview에서 정식 앱으로 자료 이전

2026-10-14. 기준 HEAD `b6b0420f24d4b998a5e986fa0a5aaabfb1b0cbca`. orchestrator/owner=Codex. Preview1097 패키지 `com.jaywapp.squadmaker.preview`와 기존 SQ v1 및 저장 키를 유지한다. 정식 패키지의 최종 결정은 별도 승인 사항이다. 이 문서는 코드 감사·자동 회귀 및 실기기에서 해야 할 백업 절차를 구분한다.

## 실제 백업 범위

`index.html`의 `saveSquadFile()`은 현재 열려 있는 전술의 `buildStateSnap()` 하나를 JSON으로 내보낸다. **SQ 하나가 라이브러리 전체 백업은 아니다.** 저장 기본 파일명은 보드의 팀 이름(`snapshot.team`) + `.sq`이며, 라이브러리의 전술 보관 이름과 다를 수 있다. 같은 보드 팀 이름을 쓰는 전술은 파일명도 같으므로 별도 폴더·파일명과 목차로 구별해야 한다.

| SQ v1 필드 | 포함되는 자료 |
|---|---|
| `v`, `team`, `mode`, `squad` | 형식 버전 1, 보드 팀 이름, 경기 모드, 선택한 기본/공격/수비 스쿼드 |
| `roster` | 선수 ID, 이름, 색상 |
| `squads.basic/attack/defense` | 각 포메이션 `f`, 선수 좌표 `pos`, 팀 지침 `tn`, 선수 지침 `pn` |
| `pat` | 모든 전술 패턴의 이름 `n`, 출발 스쿼드/좌표 `start`, 공 시작점 `bs`, 모든 단계의 선수 이동 `s[].m` 및 공 이동 `s[].b` |

좌표는 내보낼 때 정수 반올림된다. 가져올 때 기존 `normalizeSnapshot()` 검증·정규화를 거치며, 구형 v1 패턴은 기존 출발 위치 보완 규칙을 따른다. `.sq` 형식, 저장 키 `squad-maker-v1` 및 `squad-maker-library-v1`, 라이브러리 `version:1`은 변경하지 않았다.

SQ에 포함되지 않는 항목:

- 다른 보관 전술의 스냅샷과 라이브러리 전체 목록.
- 라이브러리 팀 그룹 이름, 전술 보관 이름, 그룹 연결, 팀/파일 ID, 작성·수정 시각, 파일 및 문서 revision, `activeFileId`, 삭제 되돌리기·복구용 메타데이터. 보드의 `team`과 패턴 이름은 포함되지만 위 보관 이름은 별개다.
- 설정 화면 및 화면 표시 상태, intro/테마, 선택 선수·열린 모달·현재 패턴/단계, 광고 동의·개인정보 선택, 내보내기 공통 10분 간격, 광고 상태, 세션의 undo 기록. 이 목록은 SQ에서 제외됨을 의미하며, 각 항목이 별도 영구 저장된다고 주장하지 않는다.

## 기존 자료를 보존하는 절차

1. Preview의 팀 그룹과 그 안의 모든 보관 전술을 목록으로 적는다. 예: `Weekend club / Pressing → weekend-pressing.sq`. 보드 이름과 보관 이름을 따로 적는다.
2. 각 보관 전술을 실제로 열어 SQ로 내보낸다. 한 파일 안에는 해당 보드의 세 스쿼드와 모든 패턴/단계가 함께 들어 있다. 세 스쿼드를 각각 따로 내보낼 필요는 없다. 다른 보관 전술은 각각 별도 SQ가 필요하다.
3. 파일을 앱 밖의 Documents·Download 등 사용자 보관 위치에 저장하고, 필요하면 사용자가 선택한 별도 백업 위치에 복사한다. 저장·공유 취소는 백업 완료가 아니다. 파일 존재와 목차의 전술 개수, 파일 내용의 이름/선수/지침/패턴을 확인한다. 앱의 내부 임시 공유 파일만을 유일한 백업으로 삼지 않는다.
4. 정식 앱에서 팀 그룹 및 전술 보관 이름을 목차에 따라 만든다. 해당 전술을 연 상태에서 대응하는 SQ를 가져온다. 가져오기는 현재 보드를 교체하며 확인 후 즉시 저장한다. 동일한 전술 하나에 여러 SQ를 연속 가져오면 이전 복원본을 교체하므로, 다음 파일마다 별도 보관 전술을 먼저 만든다.
5. 선수 이름·색상, 세 스쿼드의 배치/지침, 모든 패턴/이동/공/출발 위치를 원본과 대조한다. 팀 그룹·보관 이름은 SQ가 자동 복원하지 않으므로 목차와 대조한다. ID/시각/revision은 새 앱에서 새로 생성되는 값이다.
6. 복원 전술을 수정하고 저장 완료를 확인한 후 정식 앱을 재시작한다. 각 보관 전술을 다시 열어 수정본 보존을 확인한다. 검증이 끝나도 Preview와 외부 백업을 보존한다.

앱 삭제·저장소 초기화는 이전 방법으로 사용하지 않는다. 별도 패키지의 저장소는 직접 공유되지 않으며 앱 안의 기존 저장 자료만으로 정식 앱 이전이 완료되지 않는다. 외부 SQ 파일에는 사용자가 입력한 선수 이름·지침이 들어 있으므로 백업 위치와 공유 대상은 사용자가 선택한다.

## 자동 회귀와 증거

신규 `tests/e2e/production-data-transfer-20261014.spec.js`의 검증 범위:

- 기존 앱 계약으로 두 팀 그룹·세 전술을 만들고 각각 실제 브라우저 다운로드를 실행한다. Playwright 산출물 폴더에 SQ 세 파일과 별도 `backup-index.json`을 저장하고 JSON을 원본 스냅샷과 완전히 비교한다.
- 독립된 브라우저 context의 초기 저장 두 키가 비었음을 앱 부팅 전 확인한다. 외부 파일만으로 가져오고, 별도 목차의 팀/전술 보관 이름은 기존 명령으로 직접 재구성한다. 이 목차는 테스트 산출물이며 앱의 새 백업 형식이나 자동 metadata import 기능이 아니다.
- 세 전술 각각을 수정하고 `retry-save` 후 페이지 reload로 재시작을 모의한다. 복원한 파일 선택·스냅샷·보관 이름/팀 연결과 다른 전술로 왕복한 수정본을 확인한다. 원본 context의 저장 두 키는 변경되지 않는다.
- 잘못된 JSON/버전 및 복원 확인 취소가 메모리, 양 저장 키, 선택 선수, 선택 전술, reload 후 스냅샷을 보호함을 검증한다.
- 자동 native facade에서 광고 실패와 문서 저장 취소를 모의하고, 두 번 연속 export 후 busy 해제·양 저장 키·현재 보드/전술 보존을 검증한다.

새 테스트는 `node --check tests/e2e/production-data-transfer-20261014.spec.js` 통과. 브라우저 실행은 root가 의존성 및 **이번 작업 전용 포트**를 준비한 뒤 수행한다. 기본 `playwright.config.js`는 4317을 사용하므로 이번 검증에는 직접 사용하지 않는다. root가 만든 전용 config를 `<isolated-config>`에 지정한다:

```text
node node_modules/@playwright/test/cli.js test --config=<isolated-config> tests/e2e/production-data-transfer-20261014.spec.js --project=desktop-1280 --project=mobile-390
```

보완 회귀는 같은 격리 config에서 실행한다:

```text
node node_modules/@playwright/test/cli.js test --config=<isolated-config> tests/e2e/local-library.spec.js tests/e2e/data-safety.spec.js tests/e2e/coach-fixes-20261013.spec.js tests/e2e/editing-desk-20261010.spec.js tests/e2e/touch-cancel.spec.js
```

`editing-desk`의 회전 테스트는 viewport 방향 변화와 저장 양키/스냅샷 보존, 보이는 축 기준 키보드 이동을 검증한다. `touch-cancel`은 합성 touchcancel·다른 손가락 종료에 의한 지연 메뉴/선수 변경 방지를 검증한다. `local-library`/`data-safety`는 저장 실패·복원 검증·undo·보관 이름과 파일 왕복을 보완한다. 신규 테스트가 이 기존 검증을 대체하지 않는다. 실행 결과는 root의 최종 검증 기록을 참조한다.

**모든 실기기 항목은 미검증이다(all physical unverified).** 독립 browser context는 별도 Android applicationId/네이티브 저장소를 실제 실행하지 않는다. reload는 Android 프로세스 종료·cold launch 검증이 아니다. native facade와 합성 touch 이벤트는 자동 모의다. Android Documents/SAF 선택·파일 권한·실제 공유 대상·Activity 복귀/회전·앱 재실행·동시 설치·실제 UMP/광고·파일 저장/복원과 취소는 서명·기기 설치 승인 뒤 별도로 검증해야 한다. Preview1097의 과거 검증 결과를 이번 성공으로 사용하지 않는다.

## 정책 작성용 읽기 전용 코드 감사

이 절은 법률/스토어 적합성 판단이 아니라 실제 코드의 데이터 흐름 근거다. 외부 운영 API·광고·분석 서비스는 호출하지 않았다.

- 전술은 로컬 저장되며 SQ/공유 URL에 사용자가 입력한 이름·지침·움직임이 포함될 수 있다. 공유 URL의 `#s=` 스냅샷은 수신자에게 전달되는 자료다.
- `app/feedback-client.js`는 native에서 `https://squad-maker.vercel.app/api/feedback`, web에서 같은 origin의 `/api/feedback`을 사용한다. `api/feedback.js`는 제보 내용·버전·플랫폼, 사용자가 제공한 연락처, 동의한 진단 정보를 GitHub `jaywapp/squad-maker` issue로 전달한다. 코드만으로 저장소 공개 범위·보관 기간·계정 연결 상태를 확정하지 않는다.
- 제보 API는 요청 IP를 메모리 rate limit에 사용하고 Cloudflare Turnstile 검증에 `remoteip` 및 사용자 응답 token을 전송한다. 제보 UI는 Cloudflare 외부 스크립트를 사용한다. 따라서 광고 외의 제보 전송/제3자 처리도 개인정보 고지와 Data safety 실제 운영 판단에 포함해야 한다.
- `index.html`의 Umami는 `SQUAD_MAKER_ANALYTICS_ID`가 비어 있으면 로드/전송을 하지 않는다. 활성화되면 이벤트 속성 allowlist, 해시·query 제거, referrer 경로 정규화가 적용된다. 실제 운영 ID주입/기본 방문 추적/제3자 수집 여부는 최종 빌드와 운영 설정을 별도로 확인한다.
- web은 Google Fonts 및 html2canvas/gif.js CDN 경로를 사용한다. Android 번들 여부와 외부 요청 차단은 별도 번들 회귀로 확인한다. `tests/vendor/README.md`에는 html2canvas/gif.js/Umami MIT 표가 있으나 이는 테스트 자산 안내다. 사용자 제공용 제3자 라이선스 종합 고지와 Google Fonts 등 최종 포함 자산의 라이선스는 별도 완성해야 한다.
- 지원 이메일, 개인정보처리방침·개발자 사이트 URL, 대상 연령·국가 및 운영 제보 API의 배포/접수/보관·삭제 절차는 이 감사만으로 검증되지 않는다. UMP·AdMob SDK가 추가/변경된 최종 native 버전의 실제 수집·공유 항목도 root의 출시 체크리스트에서 확인한다.
