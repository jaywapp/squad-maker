# Android APK 공개 다운로드 설계

검증한 Preview APK를 저장소 루트의 `build/`에 복사한다. 기존 산출물 이름과 메타데이터 계약을 보존하고 일반 Git 바이너리로 추적한다. APK 자체의 재빌드나 변경은 하지 않는다.

## 다운로드

- [휴대폰에서 APK 받기](https://github.com/jaywapp/squad-maker/raw/refs/heads/main/build/squad-maker-latest.apk)
- [build 폴더](https://github.com/jaywapp/squad-maker/tree/main/build)
- [체크섬](../build/SHA256SUMS.txt) · [빌드 정보](../build/build-info.json)

이 APK는 Android 7.0 이상에서 사용하는 아이엠 헤드코치 Preview 1093이며 Google 테스트 배너가 포함되어 있다. 설치 전 전술을 `.sq`로 백업한 뒤 기존 앱에 업데이트 설치한다. 서명이나 버전 오류가 나면 앱 삭제·데이터 초기화·강제 다운그레이드 없이 오류를 확인한다. 실제 휴대폰 설치·자료 유지·광고 표시는 아직 미검증이다.

## 전달과 검증

로컬 해시 비교 → 허용된 파일만 stage → Conventional Commit → push → PR → 검토·병합 → 익명 HTTPS 재다운로드·SHA-256 비교 순으로 진행한다. 공개 빌드 정보에는 소스·버전·공개 인증서 digest만 포함되며 서명키·비밀번호·환경파일은 포함하지 않는다.

현재 7.2MB 파일 1개를 사용자가 요청한 폴더에 직접 보관한다. 과거 APK를 여러 개 복제하거나 새 자동 업로드 워크플로를 만들지 않는다. 게시 커밋과 APK 내부 소스 SHA는 다르며 `build-info.json`의 기존 소스 SHA를 유지한다.
