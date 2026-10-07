// Execute the real state functions with UI/save stubs; this is not a browser test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const fixture = require('../fixtures/snapshot-v1.json');

const source = fs.readFileSync(process.argv[2] || 'index.html', 'utf8');
const expectedCollision = process.argv.includes('--expect-collision');
const functions = ['sanitizeRoster', 'sanitizePatterns', 'normalizeSnapshot', 'restoreState', 'addPlayer', 'buildStateSnap']
  .map(name => {
    const match = source.match(new RegExp('(?:^|\\n)function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}'));
    assert.ok(match, 'Missing source function: ' + name);
    return match[0];
  }).join('\n\n');

const sparse = JSON.parse(JSON.stringify(fixture));
sparse.roster = sparse.roster.filter(r => r.id !== 2);
for (const sq of Object.values(sparse.squads)) {
  delete sq.pos['2']; delete sq.pn['2']; sq.pn['3'] = '기존 선수 지침';
}
sparse.pat[0].s[1].m = { '3': { x: 300, y: 300 } };

const env = `
let roster=[],nextId=1,currentMode='9v9',currentSquad='basic',patterns=[],currentPatternIdx=0,currentStepIdx=0;
const squads={basic:{},attack:{},defense:{}};
const FIELD_W=480,FIELD_H=660,BALL_START={x:240,y:330};
const MODES_CONFIG={'9v9':{max:9,formations:{'3-3-2':[],'3-2-3':[],'4-3-1':[]}}};
const SQUAD_META={basic:{},attack:{},defense:{}},SAFE_COLOR_RE=/^#[0-9a-fA-F]{3,8}$/;
const team={value:''},document={getElementById:()=>team};
const renderPlayers=()=>{},renderNotesPanel=()=>{},updateAddPlayerBtn=()=>{},showToast=()=>{},autoSave=()=>{},saveCurrentNotes=()=>{};
const newStep=()=>({moves:{},ball:null}),newPattern=name=>({name,ballStart:{...BALL_START},steps:[newStep()]});
`;
const run = `
restoreState(fixture);
const before=buildStateSnap();
addPlayer();addPlayer();
const after=buildStateSnap();
let reloadError=null;
try {restoreState(JSON.parse(JSON.stringify(after)));}catch(e){reloadError=e.code;}
({before,after,reloadError});
`;
const result = JSON.parse(JSON.stringify(vm.runInNewContext(env + functions + run, { fixture: sparse }, { timeout: 1000 })));
if (expectedCollision) {
  assert.deepEqual(result.after.roster.map(r => r.id), [1,3,2,3]);
  for (const sq of Object.values(result.after.squads)) assert.deepEqual(sq.pos['3'], {x:240,y:330});
  assert.equal(result.reloadError, 'invalid-input');
  console.log('Baseline reproduced: [1,3] -> [1,3,2,3], three positions overwritten, reload rejected.');
} else {
  const ids = result.after.roster.map(r => r.id);
  assert.equal(new Set(ids).size, 4);
  assert.ok(ids.every(id => Number.isSafeInteger(id) && id > 0));
  assert.equal(result.reloadError, null);
  for (const type of ['basic','attack','defense']) {
    assert.deepEqual(result.after.squads[type].pos['3'], result.before.squads[type].pos['3']);
    assert.deepEqual(result.after.squads[type].pn, result.before.squads[type].pn);
  }
  assert.deepEqual(result.after.pat, result.before.pat);
  console.log('Fixed source: consecutive additions preserve unique safe IDs and existing references; re-restore succeeds.');
}
