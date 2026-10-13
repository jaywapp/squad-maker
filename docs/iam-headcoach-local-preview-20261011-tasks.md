# 아이엠 헤드코치 로컬 Preview 작업계획

orchestrator=Codex, owner=Codex. 확정 문서·빌드 준비는 gpt-6.1-sol/medium, 기존 키·설치/업데이트 호환성 리뷰는 high다. 같은 기존 WT/PR54에서 진행하며 독립 문서 작성과 root의 공개 metadata 점검만 병렬, 빌드·서명·검증·Git 작업은 root가 순차 수행한다.

| ID | 목표 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|---|
| L1 | 범위·WT/HEAD·기존 변경 보존 | Codex root | gpt-6.1-sol | medium | 없음 | inspect | readonly metadata | c93 시작 기준·migration 문서/README 보존 | 완료·root 및 문서 읽기 확인 |
| L2 | 기존 키·baseline 공개 metadata 호환성 | Codex root | gpt-6.1-sol | high | L1 | inspect | ignored key/public cert/baseline | 인증서 d5 일치·baseline package/code1085/hash·폰 설치본 미확인 | 완료·root 보고, 새 APK 검증 아님 |
| L3 | 분석·설계·계획·사용자 설치 안내 | Codex brand_names | gpt-6.1-sol | medium | L1 | docs | iam-headcoach-local-preview-20261011-* 4개 | 링크·승인 경계·예상값/미검증 구분 | 완료·root 검토 대기 |
| L4 | 문서 통합·최종 build source 고정 | Codex root | gpt-6.1-sol | medium | L2,L3 | integrate | 지정 4문서·docs index/root Git | 다른 migration 변경 부분 stage 보존·final SHA 기록 | 대기 |
| L5 | 새 unit·bundle/sync·version plan | Codex root | gpt-6.1-sol | medium | L4 | verify | ignored final/generated bundle | 동일 final generation·source SHA·full-history plan | 대기 |
| L6 | 새 unsigned Android·lint | Codex root | gpt-6.1-sol | medium | L5 | verify | ignored final/build outputs | 실제 exit·경고/오류·aapt package/version/label | 대기 |
| L7 | 기존 Preview 키 sign·verify·zipalign | Codex root | gpt-6.1-sol | high | L2,L6 | verify | ignored final/signed APK | cert equality·apksigner·alignment·actual hash·version/SDK | 대기 |
| L8 | 로컬 APK 전달·PR54 generation 기록 | Codex root | gpt-6.1-sol | medium | L7 | finish | ignored final/PR54 | 새 actual SHA/version/hash/cert·기존 CI와 구분·미설치/미배포 | 대기 |
| T7 | 사용자 기기 업데이트·데이터/화면 관찰 | Codex root | gpt-6.1-sol | medium | L8 | deferred | install-guide 참고·사용자 제공 증거 | 앱 밖 백업→삭제 없이 업데이트→데이터·SQ·재시작 | 미실행·사용자 수행/증거 대기, 이 작업의 설치 권한 없음 |

L2 완료는 root가 확인한 기존 키·baseline 비교 결과만 뜻한다. L5~L8 실제 결과는 `.work/iam-headcoach-local-preview-20261011/final`과 PR54의 final generation 기록으로 판별한다. code1091은 추정이며 최종 plan/실제 APK를 읽기 전 확정하지 않는다. 이전 CI success와 취소된 local E2E/Android를 새 로컬 완료로 재사용하지 않는다.

문서 담당은 이 4파일만 작성하고 docs/README·migration 문서·source·자산·라이선스·Git·빌드·서명·키를 수정/실행하지 않는다. root가 문서 인덱스 연결을 맡으며 기존 migration 행을 보존한다. 폴더 이동·세션/server4317/4318/4319 변경·실기기 설치·삭제·초기화·강제 downgrade·공개 Release·Play·main merge는 금지한다.
