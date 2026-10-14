# 아이엠 헤드코치

16세 이상 축구·풋살 선수와 성인 동호인·코치를 위한 전술 편집 도구입니다. 선수 배치와 지침을 작성하고 움직임 패턴을 이미지·GIF·공유 링크로 전달합니다. 정식 첫 배포는 대한민국·한국어를 기준으로 준비하며 공개 지원 이메일은 **blueheart.dev@gmail.com**입니다. Play 타겟 연령은 16~17세와 18세 이상을 기준으로 검토하되 실제 콘텐츠 등급·출시 승인과 구분합니다.

[기존 웹 공유 뷰어](https://jaywapp.github.io/squad-maker/) · **[최신 문서 안내](docs/README.md)**

**[Android Preview APK 다운로드](https://github.com/jaywapp/squad-maker/raw/refs/heads/main/build/squad-maker-latest.apk)** · [설치 안내·빌드 정보](docs/apk-build-download-20261014-design.md). Google 테스트 배너와 GIF·단톡방 텍스트·.sq 내보내기 전면 광고가 포함된 versionCode 1097입니다.

공개 GitHub Pages는 과거 v1 전술 수신 화면입니다. 이번 Run Line·편집 데스크·한글 브랜딩 변경은 아직 배포되지 않았습니다. 기존 Vercel 주소는 현재 이 저장소의 전술 앱을 제공하지 않으며 제보 API도 404입니다. [정식 출시 준비와 남은 결정](docs/launch-readiness-20261010-report.md)을 확인하세요.

승인된 **아이엠 헤드코치 A안**은 기존 Run Line 마크·아이콘·색을 보존하고 한글 워드마크를 적용합니다. 원본과 교체 지침은 [브랜딩 인계](docs/branding/README.md), 최신 코드 적용·네이밍·검증 기록은 [이번 작업 분석](docs/korean-branding-20261010-analysis.md)을 확인하세요. 기술 이름은 `iam-headcoach`, 테스트 Android 표시 이름은 **아이엠 헤드코치 Preview**, 정식 브랜드는 **아이엠 헤드코치**입니다. 최신 [Preview 네이밍·폴더 전환 기준](docs/iam-headcoach-preview-20261010-analysis.md)을 따릅니다. [제품용 이름 자산](assets/branding/iam-headcoach/README.md)과 안전 전환 절차를 구분하며 활성 폴더는 유지합니다.

## 제품 방향과 구현 상태

사용자가 **A — 피치 중심 코치형**을 선택했습니다. Android 첫 출시의 상세 기획과 미정 결정은 [상품 기획서](docs/product-plan.md)에 있습니다. 1차는 로그인 없이 편집·기기 저장·이미지/GIF 저장과 공유, 광고를 포함합니다. Preview에는 Google 테스트 배너와 [내보내기 전면 광고](docs/export-interstitial-20261014-design.md)를 적용합니다. 정식 공개 광고 ID와 UMP 연결은 로컬 준비했으며 청소년 보호 정책·공개 방침·계정 심사·운영 활성화는 별도로 검증해야 합니다. 무료 슬롯은 동시에 보관하는 재사용 가능한 공간이고 삭제하면 다시 쓰며, 수정·자동저장은 차감하지 않습니다. 추가 슬롯은 단건 결제로 영구 확장하는 방향입니다. 수량·가격·슬롯 단위·결제 시점은 아직 미정입니다.

현재 저장소에는 HTML/CSS/JavaScript 편집기, 다중 팀/전술 로컬 보관, Capacitor Android Preview와 테스트 배너·전면 광고가 구현되어 있습니다. 이번 로컬 작업은 [정식/Preview 빌드 분리·운영 광고/UMP·데이터 이전 준비](docs/production-readiness-20261014-analysis.md)이며 정식 패키지·출시 정책 결정과 계정 심사가 남아 있습니다. 결제·클라우드 보관·정식 Play 출시는 미완료입니다. [현재 웹 구현·실행·검증 참고](docs/current-web-reference.md), [A 원본과 예정 개선](docs/design-a/README.md)을 구분해서 읽어 주세요.

## 현재 웹 주요 기능

- 5~11인제 포메이션, 기본·공격·수비 스쿼드, 선수 배치·이름·색상·지침
- 선수와 공의 다단계 움직임 패턴, 미리보기, 단일/전체 패턴 GIF
- PNG 이미지, 전술 텍스트, 매치 전략, .sq 편집 원본 백업
- URL 스냅샷 공유와 비회원 읽기 전용 뷰어
- 웹 LocalStorage와 Android native 저장소에 마지막 작업·팀/전술 보관 자동저장

인원 변경·초기화 보호와 `.sq` 복원 후 명시적 저장은 [구현 기록](docs/data-safety-ui-contract-20261007-tasks.md), 로컬 보관·저장·내보내기는 [계약 v2](docs/ui-state-save-export-contract-v2.md)를 따릅니다. 실기기 업데이트 후 데이터 유지는 별도 미검증입니다.

## 개발·문서 규칙

[AGENTS.md](AGENTS.md)와 [CLAUDE.md](CLAUDE.md)를 먼저 읽습니다. 문서는 한국어, 커밋은 Conventional Commits를 사용합니다. 작업 브랜치와 PR을 거치며 main 병합·배포는 별도 요청에 따릅니다.

과거 수익화 가설·비교안·완료 작업은 [보관 이력](docs/archive/README.md)에 있습니다. 원본 리뷰·테스트 증거·시안 캡처와 Git 이력을 보존합니다.
