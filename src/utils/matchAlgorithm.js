export function matchColleges(userRank, admissionData, options = {}) {
  const {
    reachLower = 0.75,
    reachUpper = 0.99,
    matchLower = 1.00,
    matchUpper = 1.20,
    safetyLower = 1.20,
  } = options;

  const results = { reach: [], match: [], safety: [] };

  for (const entry of admissionData) {
    // minRank / userRank: >1 means school easier than user level, <1 means harder
    const ratio = entry.minRank / userRank;

    if (ratio <= reachUpper) {
      results.reach.push({ ...entry, matchRatio: ratio, probability: estimateProbability(ratio) });
    } else if (ratio <= matchUpper) {
      results.match.push({ ...entry, matchRatio: ratio, probability: estimateProbability(ratio) });
    } else {
      results.safety.push({ ...entry, matchRatio: ratio, probability: estimateProbability(ratio) });
    }
  }

  results.reach.sort((a, b) => b.minRank - a.minRank);
  results.match.sort((a, b) => b.minRank - a.minRank);
  results.safety.sort((a, b) => b.minRank - a.minRank);

  return results;
}

function estimateProbability(ratio) {
  if (ratio >= 1.2) return '很高';
  if (ratio >= 1.05) return '较高';
  if (ratio >= 0.95) return '中等';
  if (ratio >= 0.85) return '较低';
  return '很低';
}

export function classifyChoice(userRank, entryMinRank) {
  const ratio = entryMinRank / userRank;
  if (ratio >= 1.20) return { level: '保底', color: 'green' };
  if (ratio >= 1.00) return { level: '稳妥', color: 'orange' };
  if (ratio > 0) return { level: '冲刺', color: 'red' };
  return { level: '差距较大', color: 'default' };
}
