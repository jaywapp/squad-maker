# impeccable detector 스캔 결과 (detect)

- 대상: http://127.0.0.1:4318/index.html (기존 실행 중인 로컬 서버, 기동·종료하지 않음)
- 뷰포트: 1280x800, 390x844
- 원본 JSON: `evidence/detect-1280.json` (18건), `evidence/detect-390.json` (20건)
- 실행 메모: 두 실행 모두 exit code 2였으나 stderr는 비어 있고 JSON이 정상 출력됨. detector가 자체 의존성으로 puppeteer를 해석했으므로 추가 설치는 하지 않았다. stderr 파일은 `evidence/detect-*.stderr.txt`(빈 파일).
- 주의: detector JSON에는 셀렉터·줄 번호가 없다(`line`은 전부 0). 아래 Component는 detector가 실제로 제공한 값만 적었고, 나머지는 "셀렉터 미제공"으로 표기했다.
- 정규화: detector의 `warning` → Medium/High, `advisory` → Low로 매핑했다. 같은 룰이 여러 요소에서 반복된 경우 한 이슈로 묶었다. 개수는 1280/390 순서로 적는다.

## 요약

- 고유 이슈 10건 (1280 고유 룰 8종 중 일부, 390 전용 2건 포함)
- Severity 분포: High 3 / Medium 2 / Low 5 / Critical 0

---

### UX-D-01
- Severity: High
- Category: Accessibility
- Page: /index.html
- Role: anonymous
- Component(셀렉터): 셀렉터 미제공 (흰색 텍스트 요소, detector 출력에 셀렉터 없음)
- Problem: 흰색(#ffffff) 텍스트가 배경 #1e88e5 위에서 대비 3.7:1로 WCAG AA 본문 기준 4.5:1에 미달. 같은 룰이 #e53935 배경에서도 4.2:1로 미달. 1280은 #1e88e5 8건 + #e53935 1건, 390은 #1e88e5 8건 + #e53935 1건.
- Evidence: `evidence/detect-1280.json` [0]~[8]; `evidence/detect-390.json` [0]~[8]
- Repro: 1280x800 및 390x844에서 `node "~/.claude/skills/impeccable/scripts/detect.mjs" http://127.0.0.1:4318/index.html --json --viewport <WxH>` 실행
- Impact: 저시력 사용자와 밝은 환경에서 버튼·라벨 텍스트를 읽기 어렵다.
- Recommendation: 배경 색을 어둡게 조정해 본문 4.5:1, 큰 텍스트 3:1 이상을 맞추거나 텍스트 색을 조정한다. 조정 후 detector를 재실행해 확인한다.
- Files: 
- Status: Open

### UX-D-02
- Severity: High
- Category: Accessibility
- Page: /index.html
- Role: anonymous
- Component(셀렉터): 셀렉터 미제공 ("+ 선수 추가" 텍스트, detector snippet 기준)
- Problem: "+ 선수 추가" 텍스트가 opacity 스택 적용 상태에서 픽셀 대비 중앙값 2.4:1(1280) / 2.5:1(390), 최저 1.4:1로 측정됨. 기준 4.5:1 미달.
- Evidence: `evidence/detect-1280.json` [17]; `evidence/detect-390.json` [19]
- Repro: 1280x800, 390x844 각각 detector 실행 (위 명령 동일)
- Impact: 추가 버튼 또는 액션 문구가 거의 보이지 않아 기능을 발견하기 어렵다.
- Recommendation: 해당 요소의 opacity를 제거하거나 비활성 상태와 활성 상태를 구분하는 방식을 바꿔 대비를 4.5:1 이상으로 맞춘다.
- Files: 
- Status: Open

### UX-D-03
- Severity: Low
- Category: Visual
- Page: /index.html
- Role: anonymous
- Component(셀렉터): 셀렉터 미제공 (1px 테두리 + 넓은 그림자 요소, detector가 "gpt-thin-border-wide-shadow" 룰로 advisory 표기)
- Problem: 1px 테두리에 24px 또는 40px 그림자를 조합한 카드·패널 스타일이 detector의 slop 패턴으로 분류됨. 1280은 2건(24px 1건, 40px 1건), 390은 3건(24px 2건, 40px 1건).
- Evidence: `evidence/detect-1280.json` [9], [11]; `evidence/detect-390.json` [10], [11], [13]
- Repro: 1280x800, 390x844 각각 detector 실행
- Impact: 시각적 완성도 평가 항목에서 감점 요인이 될 수 있다. 사용성에 직접 영향은 없다.
- Recommendation: 그림자를 줄이거나 테두리와 배경 대비로 구분하는 방식으로 정리한다. 디자인 의도가 있다면 보류 가능.
- Files: 
- Status: Open

### UX-D-04
- Severity: Low
- Category: UX
- Page: /index.html
- Role: anonymous
- Component(셀렉터): 셀렉터 미제공 (본문 텍스트 34자, text-transform: uppercase)
- Problem: 34자 분량의 본문 텍스트에 uppercase가 적용되어 있음. 길이가 길어 가독성이 떨어진다.
- Evidence: `evidence/detect-1280.json` [10]; `evidence/detect-390.json` [12]
- Repro: 1280x800, 390x844 각각 detector 실행
- Impact: 긴 대문자 문장은 단어 형태 인식이 느려 읽기 부담이 커진다.
- Recommendation: 짧은 라벨에만 uppercase를 적용하고 본문은 일반 대소문자로 바꾼다.
- Files: 
- Status: Open

### UX-D-05
- Severity: Medium
- Category: Accessibility
- Page: /index.html
- Role: anonymous
- Component(셀렉터): 셀렉터 미제공 (본문 텍스트 11.2px)
- Problem: 본문 텍스트 크기가 11.2px로 작다.
- Evidence: `evidence/detect-1280.json` [12]; `evidence/detect-390.json` [14]
- Repro: 1280x800, 390x844 각각 detector 실행
- Impact: 모바일과 저시력 사용자가 읽기 어렵다.
- Recommendation: 본문 최소 크기를 14px 이상으로 올린다(라벨 등 보조 텍스트 예외는 명시적으로 구분).
- Files: 
- Status: Open

### UX-D-06
- Severity: Low
- Category: Performance
- Page: /index.html
- Role: anonymous
- Component(셀렉터): 셀렉터 미제공 (transition: width 적용 요소 2곳)
- Problem: width를 transition으로 애니메이션하고 있어 레이아웃 재계산이 발생한다.
- Evidence: `evidence/detect-1280.json` [13], [15]; `evidence/detect-390.json` [15], [17]
- Repro: 1280x800, 390x844 각각 detector 실행
- Impact: 애니메이션 중 프레임 드롭 가능성. 요소 수가 적어 영향은 작다.
- Recommendation: transform(scaleX 등) 기반 애니메이션으로 바꾸거나 transition 대상을 최소화한다.
- Files: 
- Status: Open

### UX-D-07
- Severity: Medium
- Category: UX
- Page: /index.html
- Role: anonymous
- Component(셀렉터): 셀렉터 미제공 (`div.layout`, detector 기재)
- Problem: 첫 화면에서 한 열(column)이 뷰포트 높이의 262%까지 늘어나고, 형제 열은 82%에 맞춰진다. 첫 화면 fold가 섹션 깊숙이 위치한다. 1280x800에서만 검출되었다.
- Evidence: `evidence/detect-1280.json` [14]
- Repro: 1280x800에서 detector 실행 (390x844에서는 검출되지 않음)
- Impact: 첫 화면에서 주요 콘텐츠와 행동 유도 요소가 보이지 않을 수 있다.
- Recommendation: 두 열의 높이를 맞추거나 긴 열을 스크롤 영역으로 분리해, 첫 화면에서 핵심 요소가 보이도록 배치를 조정한다.
- Files: 
- Status: Open

### UX-D-08
- Severity: Low
- Category: Visual
- Page: /index.html
- Role: anonymous
- Component(셀렉터): 셀렉터 미제공 (repeating-gradient 장식 배경)
- Problem: 반복 줄무늬 repeating-gradient 장식 배경이 사용되어 detector slop 패턴으로 분류됨.
- Evidence: `evidence/detect-1280.json` [16]; `evidence/detect-390.json` [18]
- Repro: 1280x800, 390x844 각각 detector 실행
- Impact: 시각적 노이즈. 기능 영향 없음.
- Recommendation: 장식 목적이 약하면 제거하거나 단색으로 정리한다.
- Files: 
- Status: Open

### UX-D-09
- Severity: Low
- Category: Responsive
- Page: /index.html
- Role: anonymous
- Component(셀렉터): 셀렉터 미제공 (`<p>`, 41자 본문)
- Problem: 390x844에서 `<p>` 본문이 좌우 12px 여백만 남기고 뷰포트 가장자리까지 붙는다. 프로젝트 기준 16px 좌우 여백에 미달한다. 390x844에서만 검출되었다.
- Evidence: `evidence/detect-390.json` [9]
- Repro: 390x844에서 detector 실행 (1280x800에서는 검출되지 않음)
- Impact: 모바일에서 본문 좌우 여백이 좁아 읽기 불편하다.
- Recommendation: 모바일 컨테이너에 좌우 16px 패딩을 준다.
- Files: 
- Status: Open

### UX-D-10
- Severity: High
- Category: Responsive
- Page: /index.html
- Role: anonymous
- Component(셀렉터): `button.squad-tab` (detector 기재; 가려지는 텍스트 span "기기에 저장됨")
- Problem: span "기기에 저장됨"이 `button.squad-tab`과 겹쳐 93%가 가려진다. 390x844에서만 검출되었다.
- Evidence: `evidence/detect-390.json` [16]
- Repro: 390x844에서 detector 실행 (1280x800에서는 검출되지 않음)
- Impact: 모바일에서 저장 상태 안내 문구를 읽을 수 없다. 사용자가 데이터 저장 여부를 확인하지 못할 수 있다.
- Recommendation: 탭 버튼 영역과 안내 문구의 레이아웃을 분리하거나, 좁은 폭에서 안내 문구가 줄바꿈되거나 다른 위치로 이동하도록 조정한다.
- Files: 
- Status: Open
