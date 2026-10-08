# PR 정리 분석

orchestrator: Codex. 사용자 요청(2026-10-08): PR을 먼저 정리한 뒤 A 런 라인 브랜딩을 진행한다. 후속 지시 **“다 병합하자”**에 따라 #37, #41~#46을 모두 실제 MERGED 상태로 만든다. 중복 PR을 닫는 것으로 대신하지 않는다. 병합에 필요한 기존 PR 문서 통합·충돌 해결·commit/push·base 조정은 이번 승인 범위이며, 브랜딩 자체는 미커밋 상태까지 진행한다. 사용자 배포 요청 전까지 새 배포·Release 게시를 하지 않는다. 새 서명키·계정·시크릿 설정은 승인 범위 밖이다.

#42~#45의 원래 head는 #46의 실제 ancestor다. #41의 실행계획6개 문서는 별도 branch에만 있으므로 원래 SHA를 merge commit으로 통합한다. #37의 두 세트 과거 시안은 고유 자료이며 런타임을 바꾸지 않는다. 원래 파일·라이선스·branch를 모두 보존하고 현재 선택된 A의 운영 기준과 구 시안의 역할을 문서 인덱스에서 구분한다.

원본 미커밋 광고 작업은 D:/station/.worktrees/squad-maker-preview-release-20261007의 feat/explicit-save-export-ads-20261008에 보존한다. 이번 정리는 별도 D:/station/.worktrees/squad-maker-brand-run-line에서 한다. 로컬 main에는 직접 commit하지 않는다.

자동 승인 검토는 최초 두 배포 workflow 중단을 명시적 공유 설정 승인 부족으로 거부했다. 대상과 영향을 설명한 승인 질문 후 사용자가 “다 병합하자”라고 답했고, 재시도는 자동 승인 검토를 통과했다. Deploy to Vercel(319212590)은 disabled_manually로 확인했다. GitHub 관리형 pages-build-deployment(261656957)는 disable API가 HTTP 422를 반환했다. 공식 Pages API의 build_type을 legacy에서 workflow로 전환하여 main push 게시를 중단했다. 현재 저장소에는 Pages 게시 workflow가 없으며, 원래 URL·source·HTTPS 설정은 보존했다. 전환 전후 공개 HTML SHA256은 모두 2ad965d6bfcaeb3f4325fd0b3ab04ac9d62322a9127553cf4a2169d54539d452이고 status=built다. 실행 중 배포는 없었다. 관리형 workflow의 state=active를 “비활성화 완료”로 보고하지 않는다.

완료 기준: 7개 PR의 state=MERGED와 mergedAt 확인, 원래 head ancestry 및 고유 문서 보존, 통합 runtime이 검증된 c081101/7f1f1과 동일, 신규 배포·Release 없음, 기존 광고 변경 보존. 그 뒤 통합 main 최신에서 feat/brand-run-line을 생성한다.
