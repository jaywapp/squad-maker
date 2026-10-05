# ui-redesign 2차 시안

1차 시안(`../ui-redesign/`) 반려 후 피드백(색감·폰트·완성도, 모바일 우선)을 반영한 2차 시안.

- concept-01 매치데이 (모던 스포츠 앱) — https://claude.ai/artifact/UHCJSMZ39ekJAqa5HkJgHv
- concept-02 프레스티지 (프리미엄 다크) — https://claude.ai/artifact/2Szb1nNCYWnyyv7V3WvzVN
- concept-03 플레인 (미니멀 라이트) — https://claude.ai/artifact/Nfmi6xa29mHnFsHxbfGUSj

각 `index.html`은 브라우저로 바로 열 수 있다(`shared/pretendard-subset.woff2` 참조). `src.html`을 고친 뒤에는 `/*@CORE@*/`에 `shared/core.js`를, `/*@FONT@*/`에 Pretendard `@font-face`를 넣어 `index.html`을 다시 만든다. 폰트 라이선스는 `shared/FONT-LICENSE.md`.
