/* squad-maker UX concept shared core — same data and behavior for all 3 concepts.
   Coordinates: x 0..100 (left→right), y 0..100 (opponent goal top → own goal bottom). */
const SM = (() => {
  const TEAM = { name: 'FC 한강 유나이티드', mode: '9vs9' };
  const MODES = ['5vs5', '6vs6', '7vs7', '8vs8', '9vs9', '10vs10', '11vs11'];
  const FORMATIONS = ['3-3-2', '3-2-3', '4-3-1', '2-4-2', '3-4-1'];
  const PLAYERS = [
    { id: 1, num: 1,  name: '김도윤', role: 'GK', color: '#e0583c' },
    { id: 2, num: 2,  name: '박지훈', role: 'DF', color: '#2f6fd6' },
    { id: 3, num: 4,  name: '이서준', role: 'DF', color: '#2f6fd6' },
    { id: 4, num: 5,  name: '최민재', role: 'DF', color: '#2f6fd6' },
    { id: 5, num: 7,  name: '정우진', role: 'MF', color: '#2f6fd6' },
    { id: 6, num: 6,  name: '강하늘', role: 'MF', color: '#2f6fd6' },
    { id: 7, num: 8,  name: '윤시우', role: 'MF', color: '#2f6fd6' },
    { id: 8, num: 11, name: '한결',   role: 'FW', color: '#e8b730' },
    { id: 9, num: 9,  name: '오태양', role: 'FW', color: '#e8b730' },
  ];
  const SQUAD_LABEL = { basic: '기본', attack: '공격', defense: '수비' };

  function layout(formation) {
    const rows = formation.split('-').map(Number);
    const pos = { 1: { x: 50, y: 92 } };
    let id = 2;
    rows.forEach((n, r) => {
      const y = rows.length === 1 ? 50 : 74 - (r * (74 - 22)) / (rows.length - 1);
      for (let i = 0; i < n; i++) {
        const x = n === 1 ? 50 : 16 + (i * 68) / (n - 1);
        pos[id++] = { x: Math.round(x), y: Math.round(y) };
      }
    });
    return pos;
  }
  function roleFor(formation, id) {
    if (id === 1) return 'GK';
    const rows = formation.split('-').map(Number);
    let c = 2;
    for (let r = 0; r < rows.length; r++) {
      if (id < c + rows[r]) return r === 0 ? 'DF' : r === rows.length - 1 ? 'FW' : 'MF';
      c += rows[r];
    }
    return 'MF';
  }

  const squads = {
    basic:   { formation: '3-3-2', pos: layout('3-3-2'),
               teamNote: '라인 간격 15m 유지. 볼을 잃으면 5초 즉시 압박, 실패하면 3-3-2 블록으로 복귀.',
               notes: { 1: '골킥은 짧게, 2번·5번 쪽으로 시작', 6: '빌드업 때 센터백 사이로 내려와 3-1 형태 만들기', 8: '상대 센터백 뒷공간 침투, 오프사이드 라인 계속 확인' } },
    attack:  { formation: '3-2-3', pos: layout('3-2-3'),
               teamNote: '측면 폭을 최대로. 크로스는 니어·파 포스트에 한 명씩.',
               notes: { 2: '왼쪽 오버래핑 적극 가담', 9: '파 포스트 쇄도' } },
    defense: { formation: '4-3-1', pos: layout('4-3-1'),
               teamNote: '하프라인 아래 블록. 중앙 차단 우선, 측면은 허용.',
               notes: { 6: '상대 10번 전담 마크' } },
  };

  const pattern = {
    name: '왼쪽 측면 오버래핑',
    start: { ...layout('3-3-2') },
    startBall: 6,
    steps: [
      { label: '6 → 7 횡패스, 2번 전진', moves: { 2: { x: 10, y: 50 }, 5: { x: 22, y: 40 } }, ball: 5 },
      { label: '7 → 2 스루패스, 11번 니어 침투', moves: { 2: { x: 9, y: 26 }, 8: { x: 34, y: 14 }, 5: { x: 30, y: 34 } }, ball: 2 },
      { label: '2번 컷백 크로스, 9번 파 포스트', moves: { 9: { x: 62, y: 12 }, 8: { x: 40, y: 10 } }, ball: 9 },
    ],
  };
  function patternKeyframes() {
    const frames = [{ pos: { ...pattern.start }, ball: pattern.startBall }];
    pattern.steps.forEach((s) => {
      const prev = frames[frames.length - 1];
      frames.push({ pos: { ...prev.pos, ...s.moves }, ball: s.ball });
    });
    return frames;
  }
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  /* frame(step, t): positions while animating from keyframe step → step+1 */
  function frame(step, t) {
    const k = patternKeyframes();
    const a = k[step], b = k[Math.min(step + 1, k.length - 1)];
    const e = ease(Math.max(0, Math.min(1, t)));
    const pos = {};
    for (const id in a.pos) pos[id] = { x: a.pos[id].x + (b.pos[id].x - a.pos[id].x) * e, y: a.pos[id].y + (b.pos[id].y - a.pos[id].y) * e };
    const ba = a.pos[a.ball], bb = b.pos[b.ball];
    const ball = { x: ba.x + (bb.x - ba.x) * e + 2.4, y: ba.y + (bb.y - ba.y) * e - 2.4 };
    return { pos, ball };
  }
  /* arrows for step index s (0-based step being edited): run arrows + pass arrow */
  function arrows(s) {
    const k = patternKeyframes();
    const a = k[s], b = k[s + 1];
    if (!b) return [];
    const out = [];
    for (const id in pattern.steps[s].moves) out.push({ kind: 'run', id: +id, from: a.pos[id], to: b.pos[id] });
    if (a.ball !== b.ball) out.push({ kind: 'pass', from: a.pos[a.ball], to: b.pos[b.ball] });
    return out;
  }


  const ICONS = {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>', chevL: '<path d="m15 18-6-6 6-6"/>', chevD: '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M5 12h14M12 5v14"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    shirt: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
    undo: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>', pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    sparkle: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  };
  const icon = (n, size = 20, sw = 2) => `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  const match = { opponent: '강서 FC', date: '10월 12일 (일) 09:00', venue: '잠실 보조구장', memo: '상대는 4-4 라인 수비가 강함. 측면 오버래핑으로 수적 우위를 만든다.' };

  function shareText(sq) {
    const s = squads[sq];
    const lines = [`[${TEAM.name}] ${SQUAD_LABEL[sq]} 스쿼드 · ${TEAM.mode} · ${s.formation}`, `vs ${match.opponent} · ${match.date}`, '', `■ 팀 지침`, s.teamNote, '', '■ 선수별'];
    PLAYERS.forEach((p) => { if (s.notes[p.id]) lines.push(`${p.num} ${p.name}: ${s.notes[p.id]}`); });
    return lines.join('\n');
  }

  /* Pointer drag inside a container. map(clientX, clientY) → {x,y} in 0..100 coords. */
  function draggable(el, map, { onMove, onEnd, onTap } = {}) {
    let start = null, moved = false;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY }; moved = false;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!start) return;
      if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 4) return;
      moved = true; el.classList.add('dragging');
      const p = map(e.clientX, e.clientY);
      onMove && onMove({ x: Math.max(3, Math.min(97, p.x)), y: Math.max(3, Math.min(97, p.y)) });
    });
    const end = () => {
      if (!start) return;
      el.classList.remove('dragging');
      if (moved) onEnd && onEnd(); else onTap && onTap();
      start = null;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap && onTap(); } });
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  }
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return { icon, TEAM, MODES, FORMATIONS, PLAYERS, SQUAD_LABEL, squads, layout, roleFor, pattern, patternKeyframes, frame, arrows, match, shareText, draggable, copy, reduced };
})();
