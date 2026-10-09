'use strict';
(() => {
  const concept = document.body.dataset.concept;
  const players = [
    {id:1,name:'골키퍼',role:'GK',x:50,y:88},
    {id:2,name:'수비1',role:'DF',x:22,y:70},
    {id:3,name:'수비2',role:'DF',x:50,y:70},
    {id:4,name:'수비3',role:'DF',x:78,y:70},
    {id:5,name:'미드1',role:'MF',x:22,y:43},
    {id:6,name:'미드2',role:'MF',x:50,y:43},
    {id:7,name:'미드3',role:'MF',x:78,y:43},
    {id:8,name:'공격1',role:'FW',x:50,y:17}
  ].map(player => ({...player,lx:100-player.y,ly:player.x}));
  let selectedId = 7;
  let state = '기본';
  let teamName = '기본 팀';
  const pitch = document.querySelector('.pitch');
  const status = document.querySelector('.tool-status');
  const dialog = document.querySelector('#resultDialog');
  const preview = document.querySelector('#resultPreview');
  const exportStatus = document.querySelector('#exportStatus');
  const paths = {
    up:'<path d="M12 19V5m-5 5 5-5 5 5"/>',
    down:'<path d="M12 5v14m-5-5 5 5 5-5"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>'
  };
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + paths[el.dataset.icon] + '</svg>'; });
  const lines = '<rect x="25" y="25" width="430" height="610"/><path d="M25 330h430"/><circle cx="240" cy="330" r="65"/><circle cx="240" cy="330" r="3" fill="currentColor"/><path d="M130 25v105h220V25M185 25v40h110V25M130 635V530h220v105M185 635v-40h110v40"/>';
  pitch.innerHTML = '<svg class="pitch-lines vertical-lines" viewBox="0 0 480 660" aria-hidden="true">' + lines + '</svg><svg class="pitch-lines horizontal-lines" viewBox="0 0 660 480" aria-hidden="true"><g transform="translate(660 0) rotate(90)">' + lines + '</g></svg>';
  players.forEach(player => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'player' + (player.id === 1 ? ' gk' : '');
    button.dataset.player = String(player.id);
    button.style.cssText = `--px:${player.x}%;--py:${player.y}%;--lx:${player.lx}%;--ly:${player.ly}%`;
    button.innerHTML = `<span class="circle">${player.id}</span><span class="name">${player.name}</span>`;
    button.setAttribute('aria-label', `${player.id} ${player.name}, 선수 선택`);
    button.addEventListener('click', () => selectPlayer(player.id));
    button.addEventListener('keydown', event => {
      const directions = {ArrowUp:[0,-2],ArrowDown:[0,2],ArrowLeft:[-2,0],ArrowRight:[2,0]};
      if (!directions[event.key]) return;
      event.preventDefault();
      selectPlayer(player.id, false);
      movePlayer(...directions[event.key]);
    });
    pitch.appendChild(button);
  });
  document.querySelectorAll('.lineup').forEach(list => {
    players.forEach(player => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.player = String(player.id);
      button.innerHTML = `<b>${player.id}</b><span>${player.name}</span><small>${player.role}</small>`;
      button.addEventListener('click', () => selectPlayer(player.id));
      list.appendChild(button);
    });
  });
  function selectPlayer(id, announce = true) {
    selectedId = id;
    const player = players.find(item => item.id === id);
    document.querySelectorAll('[data-player]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.player) === id)));
    document.querySelectorAll('[data-selected-name]').forEach(el => { el.textContent = player.name; });
    document.querySelectorAll('[data-selected-number]').forEach(el => { el.textContent = String(id); });
    document.querySelector('#playerName').value = player.name;
    document.querySelector('#nameCount').textContent = `${player.name.length}/12`;
    if (announce) status.textContent = `${player.name} 선택. ${state} 배치를 편집합니다.`;
  }
  function movePlayer(dx, dy) {
    const player = players.find(item => item.id === selectedId);
    const wide = matchMedia('(orientation:landscape) and (max-height:600px)').matches;
    const xKey = wide ? 'lx' : 'x';
    const yKey = wide ? 'ly' : 'y';
    player[xKey] = Math.max(10, Math.min(90, player[xKey] + dx));
    player[yKey] = Math.max(12, Math.min(wide ? 80 : 88, player[yKey] + dy));
    if (wide) { player.x = player.ly; player.y = 100 - player.lx; }
    else { player.lx = 100 - player.y; player.ly = player.x; }
    const button = pitch.querySelector(`[data-player="${selectedId}"]`);
    button.style.setProperty('--px', player.x + '%');
    button.style.setProperty('--py', player.y + '%');
    button.style.setProperty('--lx', player.lx + '%');
    button.style.setProperty('--ly', player.ly + '%');
    status.textContent = `${player.name}, 왼쪽에서 ${player[xKey]}%, 위에서 ${player[yKey]}%`;
  }
  document.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => movePlayer(0, Number(button.dataset.move))));
  document.querySelector('#playerName').addEventListener('input', event => {
    const player = players.find(item => item.id === selectedId);
    player.name = event.target.value.trim() || '선수';
    document.querySelectorAll(`[data-player="${selectedId}"]`).forEach(button => {
      const name = button.querySelector('.name') || button.querySelector('span');
      name.textContent = player.name;
      if (button.classList.contains('player')) button.setAttribute('aria-label', `${player.id} ${player.name}, 선수 선택`);
    });
    document.querySelectorAll('[data-selected-name]').forEach(el => { el.textContent = player.name; });
    document.querySelector('#nameCount').textContent = `${event.target.value.length}/12`;
  });
  document.querySelector('#teamName').addEventListener('input', event => {
    teamName = event.target.value.trim() || '기본 팀';
    document.querySelectorAll('[data-team-name]').forEach(el => { el.textContent = teamName; });
  });
  document.querySelectorAll('[data-state]').forEach(button => button.addEventListener('click', () => {
    state = button.dataset.state;
    document.querySelectorAll('[data-state]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.state === state)));
    document.querySelectorAll('[data-state-name]').forEach(el => { el.textContent = state; });
    status.textContent = `${state} 배치로 전환했습니다.`;
  }));
  document.querySelector('#playerColor').addEventListener('click', () => {
    const circle = pitch.querySelector(`[data-player="${selectedId}"] .circle`);
    const defaultColor = selectedId === 1 ? '#f0b429' : '#e8ede8';
    circle.style.backgroundColor = circle.style.backgroundColor === 'rgb(133, 184, 228)' ? defaultColor : '#85b8e4';
    status.textContent = `${players.find(player => player.id === selectedId).name} 색상을 변경했습니다.`;
  });
  document.querySelectorAll('[data-settings]').forEach(button => button.addEventListener('click', () => {
    const open = document.body.classList.toggle('settings-open');
    button.setAttribute('aria-expanded', String(open));
    if (open) document.querySelector('#teamName').focus();
  }));
  function escapeXml(text) { return text.replace(/[<>&"']/g, character => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[character])); }
  function resultSvg() {
    const headerBottom = concept === '02';
    const card = concept === '03';
    const headerHeight = card ? 140 : 104;
    const fieldY = headerBottom ? 24 : headerHeight + 24;
    const fieldHeight = 660;
    const totalHeight = fieldHeight + headerHeight + 48;
    const headerY = headerBottom ? fieldHeight + 36 : 0;
    const field = `<g transform="translate(80 ${fieldY})"><rect width="480" height="660" fill="#2b5e3f" rx="12"/><g stroke="#afc9b9" stroke-width="2" fill="none">${lines}</g>${players.map(player => `<g transform="translate(${player.x*4.8} ${player.y*6.6})"><circle r="22" fill="${getComputedStyle(pitch.querySelector(`[data-player="${player.id}"] .circle`)).backgroundColor}" stroke="#141a16" stroke-width="2"/><text y="7" text-anchor="middle" fill="#141a16" font-family="Oswald, Bahnschrift, Arial Narrow, sans-serif" font-size="23" font-weight="700">${player.id}</text><rect x="${player.id===1?30:-52}" y="${player.id===1?-14:27}" width="104" height="25" rx="12" fill="#15251b"/><text x="${player.id===1?82:0}" y="${player.id===1?4:45}" text-anchor="middle" fill="#e8ede8" font-size="15">${escapeXml(player.name.length > 6 ? player.name.slice(0,5) + '…' : player.name)}</text></g>`).join('')}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="${totalHeight}" viewBox="0 0 640 ${totalHeight}"><rect width="640" height="${totalHeight}" fill="#141a16"/><g font-family="IBM Plex Sans KR, Noto Sans KR, Malgun Gothic, sans-serif"><rect x="0" y="${headerY}" width="640" height="${headerHeight}" fill="#1c241e"/><text x="32" y="${headerY+40}" font-size="${teamName.length > 18 ? 22 : 30}" font-weight="700" fill="#e8ede8">${escapeXml(teamName)}</text><text x="32" y="${headerY+72}" font-size="17" fill="#c4cdc5">기본 전술 · 8vs8 · 3-3-1 · ${state}</text>${card?`<text x="32" y="${headerY+111}" font-size="17" fill="#c4cdc5">2026.10.09 / 라인업</text>`:''}${field}</g></svg>`;
  }
  function showResult() {
    exportStatus.textContent = '';
    preview.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(resultSvg());
    dialog.showModal();
  }
  document.querySelectorAll('[data-result]').forEach(button => button.addEventListener('click', showResult));
  document.querySelector('#closeResult').addEventListener('click', () => dialog.close());
  document.querySelector('#downloadPng').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    exportStatus.dataset.tone = 'neutral';
    exportStatus.textContent = 'PNG를 만드는 중';
    try {
      await preview.decode();
      const canvas = document.createElement('canvas');
      canvas.width = preview.naturalWidth;
      canvas.height = preview.naturalHeight;
      canvas.getContext('2d').drawImage(preview, 0, 0);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('empty-png');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `squad-concept-${concept}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      exportStatus.textContent = 'PNG 다운로드를 요청했습니다.';
    } catch (error) {
      exportStatus.dataset.tone = 'error';
      exportStatus.textContent = 'PNG를 만들지 못했습니다. 결과물 보기를 다시 열어 시도하세요.';
    } finally { button.disabled = false; }
  });
  selectPlayer(selectedId, false);
})();
