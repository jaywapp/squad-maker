# PR 정리 설계

1. 원래 PR head/base/checks와 git ancestry를 대조한다. #41 docs6개와 #37 고유 prototypes는 원래 SHA를 통합한다.
2. Deploy to Vercel을 disabled_manually로 유지하고, Pages는 build_type=workflow로 main 자동 게시를 중단한다. Pages 게시 workflow를 추가하지 않는다. 원래 설정은 legacy, source main:/, HTTPS=true, cname=null이다. 사용자의 추후 배포 지시 전까지 복원하거나 배포하지 않는다. Android 회귀 CI는 유지한다.
3. #46 작업 branch에서 #41을 --no-ff merge한 뒤 #37도 --no-ff merge한다. README 충돌은 최신 A 진입점과 두 과거 시안의 링크를 모두 보존한다. 오래된 계획에는 실행 현황을 추가하되 본래 로드맵을 삭제하지 않는다. 코드 변경은 없다.
4. #43/#44/#45/#46의 base를 main으로 맞추고 모든 PR을 ready로 전환한다. 최종 head에 7개 원래 SHA가 모두 ancestor인지 확인한다. #46을 GitHub merge commit으로 main에 병합한다. squash/rebase는 원래 SHA 도달성을 바꾸므로 이번 전체 병합에 사용하지 않는다. GitHub의 간접 병합으로 나머지 PR도 실제 MERGED인지 조회하고, 미반영 PR이 있으면 닫지 않고 개별 병합한다. branch는 삭제하지 않는다.
5. 최종 main runtime diff=0, 문서·원본 시안 보존, 7개 mergedAt, 신규 배포 없음, 기존 광고 tree 보존을 검증한다. 로컬 main은 fast-forward만 하고 새 브랜딩 branch를 만든다.

GitHub 공식 근거: [PR 병합과 간접 병합](https://docs.github.com/en/pull-requests/reference/pull-request-merges), [Pages build_type API](https://docs.github.com/en/rest/pages/pages#update-information-about-a-github-pages-site), [Pages 게시 방식](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

원격/로컬 변경은 root 단독 소유이며 독립 Codex reviewer는 읽기 전용으로 head 보존·순서를 확인한다. 무거운 검증은 순차 실행한다. 이번 docs-only 통합은 이미 성공한 c081101의 Android/회귀 CI 증거와 runtime 동일성으로 확인한다. 브랜딩 변경 뒤에는 별도 계획의 전체 검증을 실행한다.
