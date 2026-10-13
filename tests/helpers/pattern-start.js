// Expected additive migration for valid legacy fixtures; keep source fixtures unchanged.
function withPinnedPatternStarts(snapshot) {
  const expected = JSON.parse(JSON.stringify(snapshot));
  expected.pat.forEach(pattern => {
    if (!Object.hasOwn(pattern, 'start')) {
      pattern.start = { squad: expected.squad, pos: JSON.parse(JSON.stringify(expected.squads[expected.squad].pos)) };
    }
  });
  return expected;
}

module.exports = { withPinnedPatternStarts };
