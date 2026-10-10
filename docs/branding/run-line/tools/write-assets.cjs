// geometry.json → 운영용 SVG·Android VectorDrawable 생성 (점선·워드마크 아웃라인 완료본)
const fs = require('fs');
const path = require('path');
const g = JSON.parse(fs.readFileSync(path.join(__dirname, 'geometry.json'), 'utf8'));
const out = process.argv[2];
const C = { bg: '#141a16', pitch: '#2b5e3f', chalk: '#e8ede8', lime: '#b8e986' };
const DASH = g.dashPath;                    // 점선 4조각 (stroke-dasharray 없이 그대로 사용)
const HEAD = 'M65.8 20.9L76 25L69.6 33.9';  // 화살촉
const SMALL_RUN = 'M48 62C78 58 38 36 76 25'; // 소형용 실선
const SMALL_HEAD = 'M63.9 20.2L76 25L68.4 35.5';
const WORD = g.wordmark.path;
const write = (rel, text) => { const p = path.join(out, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text.trim() + '\n'); };

const markStd = `<circle cx="33" cy="70" r="11" fill="${C.lime}"/>
  <path d="${DASH}" fill="none" stroke="${C.chalk}" stroke-width="6" stroke-linecap="round"/>
  <path d="${HEAD}" fill="none" stroke="${C.chalk}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
const markSmall = `<circle cx="31" cy="72" r="12" fill="${C.lime}"/>
  <path d="${SMALL_RUN}" fill="none" stroke="${C.chalk}" stroke-width="9" stroke-linecap="round"/>
  <path d="${SMALL_HEAD}" fill="none" stroke="${C.chalk}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;

write('assets/svg/run-line-symbol.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="17 17 67 67" width="67" height="67">
  <!-- Run Line 심볼 표준형 (40px 이상). 점선은 실제 선분 4개로 분해됨 (stroke-dasharray 없음). -->
  ${markStd}
</svg>`);
write('assets/svg/run-line-symbol-small.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="14 14 72 72" width="24" height="24">
  <!-- Run Line 심볼 소형 (16~39px). 점선 대신 굵은 실선, 큰 토큰. -->
  ${markSmall}
</svg>`);
write('assets/svg/logo-horizontal.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 100" width="384" height="100">
  <!-- 가로형 로고 (높이 40px 이상). 워드마크 = Oswald SemiBold 아웃라인 경로(글꼴 불필요), 배경 투명, 어두운 바탕(#141a16) 전용. -->
  <svg x="0" y="0" width="100" height="100" viewBox="17 17 67 67">
  ${markStd}
  </svg>
  <path d="${WORD}" fill="${C.chalk}"/>
</svg>`);
write('assets/svg/logo-header.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 100" width="384" height="100">
  <!-- 앱 좌상단 헤더용 가로형 (표시 높이 24~32px). 소형 실선 심볼 + 워드마크 아웃라인. -->
  <svg x="0" y="0" width="100" height="100" viewBox="14 14 72 72">
  ${markSmall}
  </svg>
  <path d="${WORD}" fill="${C.chalk}"/>
</svg>`);
write('assets/svg/favicon.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <!-- 브라우저 탭 아이콘: 피치 녹색 둥근 사각 + 소형 심볼 -->
  <rect width="32" height="32" rx="7" fill="${C.pitch}"/>
  <svg x="3" y="3" width="26" height="26" viewBox="14 14 72 72">
  ${markSmall}
  </svg>
</svg>`);
const iconMark = (fillLime, stroke) => `<g transform="translate(54 54) scale(0.78) translate(-50.5 -49.5)">
    <circle cx="33" cy="70" r="11" fill="${fillLime}"/>
    <path d="${DASH}" fill="none" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>
    <path d="${HEAD}" fill="none" stroke="${stroke}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
write('assets/svg/icon-foreground.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
  <!-- adaptive icon 전경 (108dp 캔버스, 안전 원 지름 66 안). 배경은 단색 ${C.pitch}. -->
  ${iconMark(C.lime, C.chalk)}
</svg>`);
write('assets/svg/icon-monochrome.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
  <!-- Android 13 테마 아이콘 레이어. 시스템은 알파만 사용. -->
  ${iconMark('#ffffff', '#ffffff')}
</svg>`);
write('assets/svg/icon-store-512.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Play 스토어 512 (풀블리드, 마스크는 스토어가 적용). 108 캔버스를 512로 확대. -->
  <rect width="512" height="512" fill="${C.pitch}"/>
  <g transform="scale(4.7407)">
  ${iconMark(C.lime, C.chalk)}
  </g>
</svg>`);

// Android VectorDrawable: SVG transform(translate 54,54 → scale .78 → translate -50.5,-49.5)을 중첩 group으로 옮긴다.
const CIRCLE = 'M22,70a11,11 0 1,0 22,0a11,11 0 1,0 -22,0';
const vector = (comment, lime, chalk) => `<?xml version="1.0" encoding="utf-8"?>
<!-- ${comment} -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <group android:translateX="54" android:translateY="54">
        <group android:scaleX="0.78" android:scaleY="0.78">
            <group android:translateX="-50.5" android:translateY="-49.5">
                <path android:fillColor="${lime}" android:pathData="${CIRCLE}"/>
                <path android:strokeColor="${chalk}" android:strokeWidth="6" android:strokeLineCap="round"
                    android:pathData="${DASH}"/>
                <path android:strokeColor="${chalk}" android:strokeWidth="6" android:strokeLineCap="round"
                    android:strokeLineJoin="round" android:pathData="${HEAD}"/>
            </group>
        </group>
    </group>
</vector>`;
write('assets/android/res/drawable/ic_launcher_foreground.xml', vector('Run Line adaptive icon foreground. 점선은 선분 4개로 분해(VectorDrawable은 dasharray 미지원).', '#FFB8E986', '#FFE8EDE8'));
write('assets/android/res/drawable/ic_launcher_monochrome.xml', vector('Android 13 테마 아이콘 레이어(알파만 사용).', '#FFFFFFFF', '#FFFFFFFF'));
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
    <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>
</adaptive-icon>`;
write('assets/android/res/mipmap-anydpi-v26/ic_launcher.xml', adaptive);
write('assets/android/res/mipmap-anydpi-v26/ic_launcher_round.xml', adaptive);
write('assets/android/res/values/ic_launcher_background.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#2B5E3F</color>
</resources>`);
write('assets/android/res/values/colors_brand.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- 브랜드 색 (A 나이트피치 / Run Line) -->
    <color name="brand_night">#141A16</color>
    <color name="brand_pitch">#2B5E3F</color>
    <color name="brand_chalk">#E8EDE8</color>
    <color name="brand_lime">#B8E986</color>
    <!-- 시스템 스플래시 배경 = 앱 배경, 웹 인트로와 같은 색이라 전환이 끊기지 않는다 -->
    <color name="splash_background">#141A16</color>
</resources>`);
write('assets/android/res/values/styles.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>

    <!-- Base application theme. -->
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <!-- Customize your theme here. -->
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
        <!-- WebView가 첫 화면을 그리기 전 흰 창이 비치지 않게 앱 배경색으로 칠한다 -->
        <item name="android:windowBackground">@color/brand_night</item>
    </style>


    <!-- 시스템 스플래시: 단색 배경 + 투명 아이콘. 브랜드 모션은 웹 인트로가 이어서 그린다. -->
    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">@color/splash_background</item>
        <item name="windowSplashScreenAnimatedIcon">@android:color/transparent</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
    </style>
</resources>`);
console.log('assets written');
