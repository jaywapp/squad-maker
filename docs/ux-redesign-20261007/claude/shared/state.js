/* SQUAD-DEMO-STATE v1 (canonical). Paste verbatim into each concept between the BEGIN/END markers.
   Coordinate system matches production: pitch 480 x 660, own goal at the bottom (y=660). Demo data only. */
const DEMO_STATE = {
  team: '우리 FC',
  mode: '9v9',
  formation: '3-3-2',
  roster: [
    { id: 1, num: 1,  name: '김도윤', role: 'GK', color: '#E53935' },
    { id: 2, num: 2,  name: '박태수', role: 'DF', color: '#1E88E5' },
    { id: 3, num: 3,  name: '이준호', role: 'DF', color: '#1E88E5' },
    { id: 4, num: 4,  name: '최민재', role: 'DF', color: '#1E88E5' },
    { id: 5, num: 5,  name: '정하람', role: 'MF', color: '#1E88E5' },
    { id: 6, num: 6,  name: '한서준', role: 'MF', color: '#1E88E5' },
    { id: 7, num: 7,  name: '오태민', role: 'MF', color: '#1E88E5' },
    { id: 8, num: 8,  name: '윤재현', role: 'FW', color: '#1E88E5' },
    { id: 9, num: 9,  name: '강현우', role: 'FW', color: '#1E88E5' }
  ],
  positions: {
    1: { x: 240, y: 616 },
    2: { x: 130, y: 510 }, 3: { x: 240, y: 520 }, 4: { x: 350, y: 510 },
    5: { x: 120, y: 385 }, 6: { x: 240, y: 400 }, 7: { x: 360, y: 385 },
    8: { x: 175, y: 240 }, 9: { x: 305, y: 240 }
  },
  ball: { x: 240, y: 400 },
  tactics: [
    {
      id: 't1', name: '오른쪽 전환 침투', updated: '방금 전',
      steps: [
        { label: '6번이 오른쪽으로 전환 패스', moves: { 7: { x: 400, y: 300 } }, ball: { from: 6, to: 7 } },
        { label: '7번 크로스, 9번 니어 침투', moves: { 9: { x: 290, y: 120 }, 8: { x: 200, y: 150 } }, ball: { from: 7, to: 9 } },
        { label: '수비 라인 전진', moves: { 2: { x: 140, y: 440 }, 3: { x: 240, y: 450 }, 4: { x: 340, y: 440 } }, ball: null }
      ]
    },
    {
      id: 't2', name: '왼쪽 오버래핑', updated: '어제',
      steps: [
        { label: '5번 전진, 2번 오버래핑', moves: { 5: { x: 110, y: 280 }, 2: { x: 70, y: 330 } }, ball: { from: 6, to: 5 } },
        { label: '2번 컷백', moves: { 2: { x: 80, y: 150 } }, ball: { from: 5, to: 2 } }
      ]
    },
    {
      id: 't3', name: '전방 압박 3-3-2', updated: '3일 전',
      steps: [
        { label: '투톱 상대 센터백 압박', moves: { 8: { x: 190, y: 160 }, 9: { x: 290, y: 160 } }, ball: null }
      ]
    }
  ],
  squads: ['기본', '공격', '수비'],
  slots: { used: 3, free: 3 } /* demo value; real free-slot count is undecided */
};
