# Run Line 휴대폰 검증용 APK 분석

orchestrator: Codex. PR #47 `feat/brand-run-line`, 시작 SHA `ec4a6611c850dadd2ad1039c7c0e651f47758b5d`, main `aa891870d9bb1649a7d64b507c232534e16cb6dd`를 확인했다. [이전 최종 검증](brand-run-line-pr-20261008-tasks.md)은 이전 SHA의 기록으로 유지한다.

## 승인과 확인된 접근

사용자는 인증정보를 새로 입력/저장하지 않고 기존 Preview 키를 안전하게 재사용할 수 있으면 로컬 서명 APK 생성을 승인했다. 이전 승인 로컬 보관 폴더의 기존 record와 PKCS12 키를 읽기 전용으로 사용해 keytool 접근 exit0, PrivateKeyEntry, 이전 Preview 공개 인증서 일치를 확인했다. 상대 keyFile은 해당 보관 폴더 안으로 해석한다. 암호/alias/private key를 출력하거나 복사·새로 저장하지 않는다. 새 키·계정·인증정보 설정은 없다.

## 버전과 범위

이전 Preview는 `com.jaywapp.squadmaker.preview`, `0.1.0-preview.1`/1001, 공개 인증서 SHA256 `d5f7ede86e1020419ccb6a7a97fa3b8072ee6522ac878787641f19d5c33771b6`이다. 새 설치용 업데이트의 식별과 순서를 위해 versionName `0.1.0-preview.2`, versionCode 1002로 증가한다. 동일 버전 로컬 재설치가 불가능하다고 주장하지 않는다. 기존 Preview 번호 체계를 연속 증가시키며 [Android 버전 공식 지침](https://developer.android.com/studio/publish/versioning)을 따른다.

package/name/storage schema/앱 동작/Run Line 자산·웹/UI·광고는 변경하지 않는다. 서명 helper의 고정 preview.1 파일명을 실제 Gradle versionName에서 읽도록 최소 보완해 산출물 이름과 APK 버전이 일치하게 한다. 기존 광고 12개 파일 및 관계없는 PR 정리 문서/생성 파일 변경은 보존·커밋 제외다.

## 완료 기준과 미확인

최종 빌드 source SHA에서 sync/bundle·unsigned release/lint 후 기존 키로 sign하고 서명/zipalign/패키지/버전/인증서·previous APK와의 업데이트 조건을 검증한다. SHA256/파일 위치/버전/공개 인증서/빌드 SHA/수동 백업·설치 절차를 로컬 산출물과 같은 Draft PR에 기록한다. signed APK·서명 자격정보는 Git/PR/Release에 올리지 않는다.

휴대폰 모델/OS/런처/실제 설치 APK는 미확인이다. adb 연결0대. SDK의 기존 AVD 목록은 확인했으나 새 APK 에뮬레이터 설치는 추가 설치에 해당해 실행하지 않는다. 기존 에뮬레이터 결과는 이번 서명 APK의 검증으로 사용하지 않는다. T7 모든 실기기 항목과 이번 APK의 에뮬레이터 실행/업데이트 후 실제 데이터 보존은 미검증이다. 알려진 이전 Preview와의 package/certificate/버전 조건이 맞아도 휴대폰 데이터 보존을 완료로 표시하지 않는다.

서명 불일치·키 접근 실패·설치된 버전이 더 높음·오류가 확인되면 삭제/clear/downgrade로 우회하지 않고 정확한 단계만 알린다. 사용자 직접 설치 외 휴대폰 설치·공개 Release·main 병합·branch 삭제·force push·자동 배포 재개는 금지다.
