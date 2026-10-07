# 선수 ID 충돌 보호 — 분석

- slug: `player-id-safety-20261007` · orchestrator: Codex
- 사용자 승인 범위: 새 세션에서 PR42를 이어서 실제 ID 충돌 재현·수정·회귀 검증·별도 Draft PR 제시. main 병합은 별도 승인 대상.
- 기준: PR42 Draft head `0d71b540a1a2be1c2cddd25364575725dc66d31d`, PR41 Draft 계획 head `00cbd682eac459bada89d4d38a2578760f24bc52`.
- [설계](player-id-safety-20261007-design.md) · [실행/검증](player-id-safety-20261007-tasks.md) · [계약 v1](ui-state-save-export-contract-v1.md)

## 재현 근거

원격 head의 실제 `restoreState/addPlayer/buildStateSnap/normalizeSnapshot/sanitizeRoster/sanitizePatterns` 함수를 격리된 JavaScript 환경에서 실행했다. UI 렌더·자동저장 호출만 mock이며 브라우저 실행 증거와 구분한다.

정상 v:1 명단 [1,3]과 세 상태의 기존 3번 위치를 복원한 뒤 연속 두 번 추가하면 [1,3,2,3]이 된다. 3번의 basic (240,510), attack (320,510), defense (240,510)가 모두 (240,330)으로 덮인다. 생성된 저장 JSON을 다시 restoreState에 전달하면 `invalid-input`으로 거절된다. 첫 빈 ID를 찾은 restoreState와 검증 없이 증가하는 addPlayer의 조합이다.

기존 MAX_SAFE_INTEGER 테스트는 한 번만 추가하여 이 중간 빈 ID 사례를 놓친다. 선수 삭제는 세 상태의 위치·개별 지침·모든 패턴 단계의 해당 경로를 지운다.

## 실행 상태와 보존

새 환경의 정상 shell 호출은 명령 생성 전에 `helper_sandbox_lock_failed / SetNamedSecurityInfoW 5`로 실패했다. 샌드박스/권한 우회나 시스템 설정 변경은 하지 않는다. 기존 Codex는 조회 당시 idle이다. 로컬 checkout/worktree의 현재 변경·프로세스와 지정 Claude 터미널 대상은 확인하지 못했다. 공유 로컬 파일과 PR42 branch를 수정하지 않고 정확한 원격 head에서 별도 `fix/player-id-safety-20261007` branch를 만든다.

원격 트리에는 .agents/skills가 없으며 로컬 연관 스킬은 shell 차단으로 읽지 못했다. AGENTS.md·CLAUDE.md·README·main product-plan·PR41 상세 계획·PR42 계약을 읽었다. 이번 기능 수정에는 운영 UI 변경이 없으므로 UI 전용 디자인 pre-flight는 적용 단계가 아니다.

## 범위와 완료 기준

- 추가 시 매번 명단 전체의 사용 ID를 확인한다. 새 ID는 양의 안전한 정수이고 기존 ID/이름/색상/배치/지침/패턴을 변경하지 않는다.
- 빈/희소/삭제 후 명단·높은 ID·인원 한도, 두 번 이상 연속 추가, 즉시 저장/재읽기/reload를 검증한다.
- v:1 형식·계약 v1·A 원본·기존 fixture/vendor·배포 workflow·SDK/비밀값은 보존한다.
- 새로운 CI는 이 기능 브랜치 push에서 테스트만 실행하며 production environment/secret/배포는 사용하지 않는다.
- C-03의 팀/파일 보관·슬롯 카운터는 Q1/Q2/Q9가 미정이므로 이번 수정으로 완료 표시하지 않는다. Android 프레임워크/서명도 임의 확정하지 않는다.

수정 요구와 범위는 사용자가 이미 승인했으므로 반복 승인을 요구하지 않는다. Claude 대상 확인 후에도 운영 index.html 인계는 C-02/C-03 및 검증 head 조건을 충족해야 한다. APK는 빌드·설치·서명·체크섬 검증 및 실제 Release 게시 전까지 미제공 상태다.

## 검증 결과

[GitHub Actions #37576252366](https://github.com/jaywapp/squad-maker/actions/runs/37576252366)에서 기준 브라우저의 중복 ID assertion 실패를 확인하고, 수정본은 API 7 / 웹 161 passed / 1 skipped를 통과했다. 5개 신규 회귀를 두 viewport에서 모두 통과했다. 기존 모바일 전체 GIF skip은 유지했다. 검증한 소스/테스트 SHA는 `aafc5efa0f9e033576ae98b63fcc718c06d596c1`이다. 실제 Android·OS 공유·설치 검증은 실행하지 않았다.
