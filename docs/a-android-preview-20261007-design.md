# A 통합과 Android preview: 설계

- [분석](a-android-preview-20261007-analysis.md), [실행](a-android-preview-20261007-tasks.md), [Claude 요청문](a-android-preview-20261007-claude-request.md).
- 사용자 지속 목표를 이 범위의 실행 승인으로 적용한다. 미정 제품·서명/보안 결정은 임의로 확정하지 않는다.

## 순서와 소유권

PR43 source/회귀 검토 → C-02 최소 기능 모듈과 순차 인계 → C-03 container/목록/삭제 재사용/이전 → Claude A UI → 기능 통합 → Android adapter·오프라인 bundle·테스트 광고 → APK 설치 검증 → Release 다운로드 대조.

Codex는 `app/local-library.js`, 보관/native 테스트·Android/build/scripts, 인계 전 index.html의 기능 연결을 맡는다. Claude는 우선 `docs/ux-concepts/a-integration-20261007/`만 쓰고, C-03 검증 SHA 인계 후 별도 실행 트리에서 UI를 맡는다. 같은 index.html을 동시에 수정하지 않는다.

## 로컬 보관 경계

별도 버전 container에 팀·파일·현재 파일을 보관한다. 전술 파일 내부는 현 v:1 payload를 유지한다. 초기 이전은 원문 키를 삭제하지 않고 container를 검증 저장한 뒤 완료 표시한다. 수정/자동저장은 현재 파일 revision 갱신만 하고 파일 수를 증가시키지 않는다. 삭제 후 슬롯을 즉시 재사용하며 취소/실패에서는 원본과 카운터가 변하지 않는다.

한도 policy는 주입한다. preview 기본값은 제한 없음, full 상태/삭제 재사용은 명시적 test policy로 검사한다. 미확정 무료량을 코드 기본값으로 확정하지 않는다. 파일/팀 ID는 충돌 없는 opaque ID, 선수 ID는 PR43 규칙을 유지한다.

## Android 판단과 제약

Capacitor8 + 자체 AtomicFile/SAF/test-ad plugin을 선택했다. 제한된 native WebView는 bridge/lifecycle 부담, RN/Flutter 재작성은 기존 회귀 및 렌더러 재사용 손실 때문에 제외했다. [결정 근거](android-preview-architecture.md)와 [계약 v2](ui-state-save-export-contract-v2.md)를 따른다. Android asset bundle은 export 라이브러리와 원문 MIT notice를 포함하며 웹 CDN/분석 요청에 의존하지 않는다. 기존 앱의 ID/키/secret/서버/자동 업데이트를 복사하지 않는다.

서명 승인 전에는 프로젝트와 unsigned 빌드까지 준비한다. 새 자격 증명을 묵시적으로 만드는 debug build는 실행하지 않는다. 승인 후 전용 test 서명 APK를 동일 파일로 설치·검증한다. Release에는 APK, SHA-256, package/version/build SHA, 서명 종류와 포함/미포함 범위, 설치·업데이트/로컬 백업 안내를 제공한다. 게시 자산을 바꿔치기하지 않는다.

## Native 내보내기 복원 경계

SAF 본문은 cache staging 후 작은 token으로 넘기고 worker에서 provider로 스트리밍한다. 긴 복원 팀명이 파일명/공유 제목 메타데이터로 Activity 상태나 Intent 한도를 키우지 않도록160자로 제한한다. 본문 bytes는 자르지 않는다. 같은 source의 단위 회귀와 unsigned build/lint로 재확인했다.
