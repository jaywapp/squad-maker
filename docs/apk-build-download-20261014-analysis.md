# Android APK 다운로드 경로 분석

2026-10-14, orchestrator=Codex. 사용자는 모바일 원격 접속 중이며 로컬 파일 경로를 받을 수 없어 GitHub 저장소의 `build/` 폴더에 APK를 올리도록 요청했다. 요청한 업로드와 앞선 커밋·푸시·병합 승인에 따라 작업 브랜치와 PR로 main에 반영한다.

## 확인된 조건

- 저장소는 공개 `jaywapp/squad-maker`이며 main 기준은 `37dc0382dff3d706fedd7753ed0785ee4fc4d4c1`이다. `build/`는 아직 없다.
- 기존 APK는 소스 `296741a4bcb58c182de4cdcd615bcf9e617b4491`, versionCode 1093, 7,209,427바이트이며 SHA-256은 `1fe4824d75669e274c4ed7a151d92328eb2f69f57fa87327c1cef42c0c90b7a4`다.
- Android 빌드·lint(오류 0, 경고 5), 네이티브 연동 테스트 42개, 기존 Preview 서명·정렬 검증을 통과한 파일을 그대로 전달한다. 테스트 배너이며 실기기 광고 표시는 미검증이다.
- 자동 검증·배포·APK 릴리스 워크플로 4개는 수동 비활성 상태다. 현재 작업은 이 설정을 유지한다.

## 범위와 완료 기준

`build/squad-maker-latest.apk`, `build/SHA256SUMS.txt`, `build/build-info.json`과 다운로드 안내만 추가한다. 소스 수정·재빌드·키·환경파일 업로드·정식 광고 전환·Play 제출·기존 초안 릴리스 변경은 포함하지 않는다. Git에 올릴 파일의 목록과 해시를 확인하고, main 반영 후 인증 없는 HTTPS 다운로드를 수행해 원본과 바이트 수·해시가 일치해야 완료다.
