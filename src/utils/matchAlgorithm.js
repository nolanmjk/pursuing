// Ratio thresholds by strategy: [reach lower, reach upper, match upper]
// reach: minRank is 0.60x–0.99x of userRank (student needs to out-perform)
// match: minRank is 1.00x–1.49x of userRank (student is in range)
// safety: minRank is 1.50x+ of userRank (student is well above)
// ratio < 0.60: gap too large, excluded from all pools (matches classifyChoice threshold)
const REACH_MIN = 0.60;
const STRATEGY_RATIOS = {
  moderate:     { reachMax: 0.99, matchMax: 1.49 },
  aggressive:   { reachMax: 1.04, matchMax: 1.39 },  // push reach higher, tighten safety
  conservative: { reachMax: 0.94, matchMax: 1.59 },  // pull reach lower, widen safety
};

const MAX_PER_BUCKET = 40;

function probabilityLabel(ratio) {
  if (ratio >= 1.50) return '很高';
  if (ratio >= 1.10) return '较高';
  if (ratio >= 0.85) return '中等';
  if (ratio >= 0.60) return '较低';
  return '很低';
}

export function matchColleges(userRank, admissionData, strategyType = 'moderate') {
  const { reachMax, matchMax } = STRATEGY_RATIOS[strategyType] || STRATEGY_RATIOS.moderate;

  // Deduplicate: same college+major → keep most recent year, then lowest minRank
  const grouped = {};
  for (const entry of admissionData) {
    const key = `${entry.collegeId}_${entry.majorId}_${entry._groupCode || ''}`;
    if (!grouped[key] || entry.year > grouped[key].year ||
        (entry.year === grouped[key].year && entry.minRank < grouped[key].minRank)) {
      grouped[key] = entry;
    }
  }

  const unique = Object.values(grouped);

  // Classify by ratio against user's rank — the standard 位次法 approach
  const reach = [];
  const match = [];
  const safety = [];

  for (const entry of unique) {
    const ratio = entry.minRank / userRank;
    const result = { ...entry, matchRatio: ratio, probability: probabilityLabel(ratio) };

    if (ratio < REACH_MIN) continue; // gap too large, skip entirely
    if (ratio <= reachMax) {
      reach.push(result);
    } else if (ratio <= matchMax) {
      match.push(result);
    } else {
      safety.push(result);
    }
  }

  // Sort: proximity to user rank (closest first within each group)
  const byProximity = (a, b) => Math.abs(a.matchRatio - 1) - Math.abs(b.matchRatio - 1);
  reach.sort(byProximity);
  match.sort(byProximity);
  safety.sort(byProximity);

  return {
    reach: reach.slice(0, MAX_PER_BUCKET),
    match: match.slice(0, MAX_PER_BUCKET),
    safety: safety.slice(0, MAX_PER_BUCKET),
  };
}

export function classifyChoice(userRank, entryMinRank) {
  const ratio = entryMinRank / userRank;
  if (ratio >= 1.50) return { level: '保底', color: 'green' };
  if (ratio >= 1.00) return { level: '稳妥', color: 'orange' };
  if (ratio >= 0.60) return { level: '冲刺', color: 'red' };
  return { level: '差距较大', color: 'default' };
}
