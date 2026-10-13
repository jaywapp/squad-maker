# 코치 사용성 점검 이슈

수정 전 기준은 `fd87986`이다. 모든 항목을 후속 작업에서 수정하고 검증했다([완료 보고](fixes.md)). 아래 Repro·Problem·파일 위치는 원래 오류 기록이다. Severity High는 P1, Medium은 P2에 해당한다. 데스크톱 실조작과 Chromium 모바일 에뮬레이션을 구분한다.

## UX-001 생성 지침서와 감독 입력의 불일치

- Severity: High / Category: UX / Status: Fixed and verified
- Page: `/` 매치 전략 / Role: 코치 / Viewport: 데스크톱, 390×844 모바일 에뮬레이션
- Component: `generateManual()` / Files: `index.html:4141`, `:4169`, `:4260`
- Repro: 11인제 4-3-3 → 기본 팀 지침에 ‘공을 빼앗으면 즉시 오른쪽 윙으로 길게 연결’ → 선수 지침 작성 → 매치 전략 → 전술 지침서 생성.
- Problem: 팀·개인 지침은 포함되지 않고 ‘안전한 패스로 점유 유지’ 등 좌표 비율 기반 문구가 생성된다.
- Impact: 코치가 의도한 전술과 다른 지시가 선수에게 전달된다.
- Recommendation: 코치 입력을 원문 우선 반영하고 자동 문장은 검토 가능한 제안으로 구분한다.
- Evidence: `evidence/mobile-probes.json`의 `strategy`, `evidence/strategy-coach-note-omission-390.png`. 주 세션 UI에서도 재현.

## UX-002 패턴 출발 배치가 다른 탭 선택으로 변경

- Severity: High / Category: UX / Status: Fixed and verified
- Page: `/` 배치·움직임 패턴 / Role: 코치 / Viewport: 데스크톱 약 1264×712
- Component: `newPattern()`, `positionsAfter()` / Files: `index.html:2120`, `:3379`, `:2105`
- Repro: 기본 4-3-3 → 움직임 패턴에서 오른쪽 풀백(5번) 전진 경로 작성 → 배치 → 수비(3-5-2) → 같은 움직임 패턴 확인.
- Problem: 패턴 목적지는 그대로지만 5번의 출발점이 왼쪽으로 바뀌어 대각선 횡단 경로가 된다. 패턴 화면에는 출발 스쿼드 선택 맥락이 보이지 않는다.
- Impact: 코치가 만든 오버래핑 장면이 다른 움직임으로 해석된다.
- Recommendation: 패턴의 출발 위치·스쿼드 소속을 명시적으로 저장한다. 의도적으로 현재 배치에 적용하는 기능은 별도 행동으로 제공한다.
- Evidence: `evidence/pattern-basic-desktop.png`, `evidence/pattern-defense-desktop.png`, 주 세션 UI 드래그 재현.

## UX-003 손상된 공유 링크가 편집기로 진입

- Severity: High / Category: Error / Status: Fixed and verified
- Page: `/#s=broken` / Role: 팀원 / Viewport: 데스크톱, 390×844 모바일 에뮬레이션
- Component: `loadFromURL()`, 시작 분기 / Files: `index.html:4505`, `:5481`
- Repro: 이 기기에 테스트 전술이 저장된 상태 → `#s=broken` 링크 열기.
- Problem: 공유 데이터 해석에 실패해도 오류 안내 없이 기존 전술의 편집 화면을 연다. 기존 데이터 삭제는 확인되지 않았으며, 여기서 지적하는 것은 잘못된 진입 상태다.
- Impact: 수신자가 자신의 과거 전술을 공유받은 전술로 오인할 수 있다.
- Recommendation: 공유 매개변수 유무와 복원 성공 여부를 구분하고, 실패 시 재전송 요청·내 전술로 돌아가기 선택지를 제공한다.
- Evidence: `evidence/mobile-probes.json`의 `malformedRecipient`, `evidence/broken-share-recipient-390.png`. 주 세션에서도 확인.

## UX-004 일시정지에서 장면을 유지하지 않음

- Severity: Medium / Category: UX / Status: Fixed and verified
- Page: `/` 움직임 패턴 / Role: 코치·팀원 / Viewport: 데스크톱
- Component: `startAnimation()`, `stopAnimation()` / Files: `index.html:3909`, `:3918`
- Repro: 선수·공의 두 단계 이동 작성 → 미리보기 → 일시정지.
- Problem: 움직이던 위치를 유지하지 않고 편집 단계의 시작 상태를 다시 그린다. 다시 미리보기를 누르면 첫 단계에서 시작한다.
- Impact: 특정 순간을 짚어 설명하고 그 자리에서 이어 보여 주기 어렵다.
- Recommendation: 정지 시 재생 단계·진행률을 보존하고 재시작과 이어 재생을 분리한다.
- Evidence: 주 세션 UI에서 2단계 패턴 정지 후 시작점 복귀를 관찰. `stopAnimation()`의 `renderPatternFrame(0)`, `startAnimation()`의 `animStep = 0`으로 원인 확인. 별도 시간축 영상은 미수집.

## UX-005 공유 링크가 보고 있던 패턴 장면을 열지 않음

- Severity: Medium / Category: UX / Status: Fixed and verified
- Page: `/` 공유 → `/#s=...` / Role: 코치·팀원 / Viewport: 390×844 모바일 에뮬레이션
- Component: 공유 스냅샷·복원 / Files: `index.html:1722`, `:4785`, `:4961`
- Repro: 움직임 패턴의 2단계에서 공유 링크 생성 → 별도 수신 브라우저에서 열기.
- Problem: ‘동일한 화면’ 안내와 달리 배치 탭으로 열리고 패턴·단계 선택은 초기화된다. 패턴 데이터 자체의 소실은 아니다.
- Impact: 선수는 감독이 지목한 장면을 다시 찾아야 한다.
- Recommendation: 공유 진입 화면·패턴·단계를 스냅샷에 포함하거나 ‘전술 전체 공유’로 명확히 설명한다.
- Evidence: `evidence/mobile-probes.json`의 `patternSource`와 `patternRecipient`, `evidence/pattern-recipient-390.png`.

## UX-006 복사 실패 후 링크 선택 경로 오류

- Severity: Medium / Category: Error / Status: Fixed and verified
- Page: `/` 단톡방 공유 텍스트 대화상자 / Role: 코치 / Viewport: 390×844 모바일 에뮬레이션
- Component: 공유 URL 상자·복사 실패 처리 / Files: `index.html:1724`, `:4514`
- Repro: 클립보드 쓰기를 거부하도록 격리 브라우저 구성 → 링크 복사 → 안내에 따라 링크 상자 클릭.
- Problem: DIV에 대한 `focus()`와 `selectAll`로 모달 전체가 선택되며, 클릭 시 `this.select is not a function` 오류가 난다.
- Impact: 브라우저 권한 문제를 만난 코치가 링크를 수동으로 복사하기도 어렵다.
- Recommendation: 읽기 전용 입력란으로 링크를 제공하고 링크 문자열만 선택하는 동작을 구현한다.
- Evidence: `evidence/mobile-probes.json`의 `clipboardFallback`, 재현 스크립트 `evidence/mobile-probes.cjs`.
