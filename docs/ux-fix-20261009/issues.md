# squad-maker UX/UI 이슈 통합 목록 (2026-10-09)

- 대상: http://127.0.0.1:4318/index.html (로컬, 익명)
- 원본: `browser.md`(브라우저 실측 UX-B-01~26), `detect.md`(impeccable detector UX-D-01~10)
- 상세(Repro·Evidence·Files)는 원본 샤드에 있다. 이 문서는 정규화·중복 제거·분류 결과다.
- 메인 세션 소스 재확인: UX-B-01/16 원인 `index.html:759` `body > * { width: 100% }` 확인, UX-B-08 전역 Esc 핸들러(`index.html:3789`)에 제보 모달 누락 확인.

## 중복 정리

- UX-D-01 = UX-B-20 (흰 번호 vs #1E88E5/#E53935 대비) → UX-B-20으로 병합, Severity Low→Medium 상향(피치 전체 선수 번호에 해당)
- UX-D-10 (390에서 "기기에 저장됨"이 스쿼드 탭에 93% 가림) → 브라우저 점검에서 겹침이 관찰되지 않음. **미검증, 재현 필요**

## 통합 목록

분류: **S** = 작은 수정(디자인 시스템 안에서 해결) / **C** = 화면 구조 변경, 레포 규칙상 콘셉트 3종 필요

| ID | Sev | 분류 | 요약 |
|---|---|---|---|
| UX-001 (B-01) | High | S | 선수 컨텍스트 메뉴가 화면 폭만큼 늘어나 모바일에서 오른쪽 180px 잘림, 대상 선수 이름 없음 |
| UX-002 (D-02) | High | S | "+ 선수 추가" 실측 대비 1.4~2.5:1 |
| UX-003 (B-05) | Medium | S | 데이터 파괴 확인창: 라임 주 버튼 + 라벨 "변경" + 초기 포커스가 확인 버튼 |
| UX-004 (B-08) | Medium | S | 제보 모달 Esc 미동작, 열자마자 오류 문구 |
| UX-005 (B-07) | Medium | S | "미드필더" 태그 대비 2.11:1 (--faint 토큰 변경 부작용) |
| UX-006 (B-20+D-01) | Medium | S | 선수 번호 흰 글자 대비 3.7/4.2:1 |
| UX-007 (B-10) | Medium | S | 잘못된 .sq 복원 시 결과 줄에 이전 성공 문구 잔존 |
| UX-008 (B-09) | Medium | S | 도움말 문구가 현재 탭·버튼 이름과 불일치 |
| UX-009 (B-04) | Medium | S | 패턴 미리보기 중 단계 배지와 단계 표시 불일치 |
| UX-010 (B-13) | Medium | S | 라임 강조색 규칙 위반(인원 버튼 활성 등) |
| UX-011 (B-03) | Medium | C | 패턴 캔버스 이름 10px(모바일 7.6px), 이름표 없음 — A 체계 미편입 |
| UX-012 (B-11) | Medium | C | 모달 체계 두 벌(A 시트 vs 구형 모달) |
| UX-013 (B-14) | Medium | C | 패턴 화면 GIF 버튼 중복, 버튼 13개 |
| UX-014 (B-15) | Medium | C | 키보드로 선수 이동 불가, 패턴 캔버스 텍스트 대안 없음 |
| UX-015 (B-02) | Medium | C | 모바일 가로에서 피치가 크롬에 밀려 거의 안 보임 |
| UX-016 (B-06) | Medium | C | 1920에서 설정 열이 오히려 좁아져 인원 버튼 줄바꿈 |
| UX-017 (B-12) | Medium | C | 내보내기 이미지 배너 반투명·광택 구 아이콘·줄무늬 누락 |
| UX-018 (D-07) | Medium | C | 1280 첫 화면 한 열이 뷰포트 262% 높이 |
| UX-019 (D-05) | Medium | S | 본문 11.2px |
| UX-020 (B-16) | Low | S | 토스트가 화면 폭 전체 띠 (UX-001과 같은 원인) |
| UX-021 (B-17) | Low | S | color-scheme 미지정 → 다크 화면에 흰 스크롤바 |
| UX-022 (B-18) | Low | S | 인원 버튼 현재값 aria-pressed 없음 |
| UX-023 (B-19) | Low | S | 접근성 이름-표시 글자 불일치, 색상 견본 이름이 16진수 |
| UX-024 (B-21) | Low | S | 모바일 힌트·빈 상태 안내가 실제 동작과 다름 |
| UX-025 (B-22) | Low | S | 이름 12자 초과 무음 절삭, 전체 이름 볼 곳 없음 |
| UX-026 (B-23) | Low | S | 본문 word-break: keep-all 미적용 |
| UX-027 (B-24) | Low | S | 아이콘 체계 혼재(SVG/문자/이모지) |
| UX-028 (B-25) | Low | S | 화면 문구 em dash |
| UX-029 (B-26) | Low | S | 최대 인원 도달 시 비활성 이유 미표시 |
| UX-030 (D-03,04,06,08,09) | Low | S | detector 패턴: 테두리+큰 그림자, 긴 uppercase, width transition, 줄무늬 배경, 390 좌우 12px |
| UX-031 (D-10) | High? | — | 390 "기기에 저장됨" 겹침 — 미검증 |

## Not verified

실기기 터치·카카오 공유, GIF 인코딩 결과, 열람 모드, 스크린리더 실사용, 200% 확대·reduced-motion, 정상 제보 API 상태(로컬에 `/api/feedback` 없음). 모바일은 Chromium 에뮬레이션만 사용.

## Codex 1단계 재검증 (2026-10-09)

위 원본 점검은 작성 당시 기록으로 보존한다. 최신 상세 수치·실패 보완·증거는 [Codex 검증 기록](../ux-fix-20261009-codex-report.md)이다. 기준 source SHA-256 `4944ad97b65b7a0579ea1df754a15664552c91bc97ad632c6becf625730f7c58`, 기존195 회귀와 새18 UX 실행을 모두 통과했다. 실제 휴대폰 결과는 아니다.

| ID | 최신 상태 | 근거 |
|---|---|---|
| UX-001~009 | Resolved | 메뉴10색/target·Enter취소/복원 저장/제보실패·retry·Esc/10색번호 대비·태그7.58~12.01/도움말/재생잠금 회귀·실측 |
| UX-010 | Partial | 인원 활성 초크 완료. 화면별 주 행동은2단계에서 정리 |
| UX-011~014 | Remaining | Q1로 승인된2단계 구현 대기 |
| UX-015~018 | Deferred | 구조 콘셉트3종 실제4뷰포트/PNG/Lighthouse100 검증·제시 완료. 사용자 선택 전 운영 구조 보존 |
| UX-019~026 | Resolved | tiny본문/토스트/다크gutter/pressed/labelprefix/힌트와완료터치선택/이름카운터·title/keep-all 실측·회귀 |
| UX-027~029 | Resolved | 지정문자아이콘SVG/표시·메타emdash/최대인원사유 |
| UX-030 | Partial / Deferred | width transition 제거, detector에서contrast/tiny/layout transition 미검출. border+shadow·uppercase·피치줄무늬는A 기존디자인, 긴설정열은3단계 |
| UX-031 | False positive | detector는 재검출. `기기에 저장됨`은1×1px clip0 aria-live 알림. 실제 `저장됨`칩은390 DPR3에서보이며탭과겹침없음([실측](evidence/codex-20261009/phase1/status-tags.json)) |

정상 제보 POST·실기기·카카오/OS 공유 실사용·스크린리더 실사용·200% 확대는 계속 미검증이다. `.sq` 저장 재시작·읽기전용 데이터 보호·실제 PNG/GIF 인코딩은 자동 회귀에서 검증했지만2단계 캔버스 새 GIF 프레임은 아직 미검증이다.
