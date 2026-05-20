import rankTable from '../data/rank_table.json';

// Find the cumulative rank for a given score in a given year/subject
export function scoreToRank(score, year, subjectCategory) {
  const relevant = rankTable.filter(
    r => r.year === year && r.subjectCategory === subjectCategory
  ).sort((a, b) => b.score - a.score);

  if (relevant.length === 0) return null;

  for (const row of relevant) {
    if (score >= row.score) {
      return row.cumulativeCount;
    }
  }
  // Score lower than all entries
  return relevant[relevant.length - 1].cumulativeCount;
}

// Find the equivalent score for a given rank in a given year/subject
export function rankToScore(rank, year, subjectCategory) {
  const relevant = rankTable.filter(
    r => r.year === year && r.subjectCategory === subjectCategory
  ).sort((a, b) => b.score - a.score);

  if (relevant.length === 0) return null;

  for (const row of relevant) {
    if (rank <= row.cumulativeCount) {
      return row.score;
    }
  }
  // Rank worse than all entries
  return relevant[relevant.length - 1].score;
}

// Normalize subject category names for cross-year comparison
const normalizeSubject = {
  '物理类': ['物理类', '理科'],
  '历史类': ['历史类', '文科'],
  '理科': ['物理类', '理科'],
  '文科': ['历史类', '文科'],
};

// Compute equivalent scores for past 3 years given current score/rank
export function computeEquivalentScores(currentScore, currentYear, subjectCategory) {
  const rank = scoreToRank(currentScore, currentYear, subjectCategory);
  if (rank === null) return null;

  const pastYears = [currentYear - 1, currentYear - 2, currentYear - 3];
  const equivalents = [];

  for (const year of pastYears) {
    // Try exact subject match first, then fallback to normalized
    let score = rankToScore(rank, year, subjectCategory);
    if (score === null) {
      const mappings = normalizeSubject[subjectCategory] || [subjectCategory];
      for (const alt of mappings) {
        score = rankToScore(rank, year, alt);
        if (score !== null) break;
      }
    }
    if (score !== null) {
      equivalents.push({ year, score, rank });
    }
  }

  const avgScore = equivalents.length > 0
    ? Math.round(equivalents.reduce((s, e) => s + e.score, 0) / equivalents.length)
    : null;

  // Detect trend
  let trend = 'stable';
  if (equivalents.length >= 2) {
    const scores = equivalents.map(e => e.score);
    if (scores.every((s, i) => i === 0 || s > scores[i - 1])) trend = 'rising';
    else if (scores.every((s, i) => i === 0 || s < scores[i - 1])) trend = 'falling';
  }

  return { rank, equivalents, avgScore, trend };
}

// Calculate 冲/稳/保 rank ranges
export function calculateZones(userRank, type = 'moderate') {
  const ratios = {
    moderate: { reach: [0.75, 0.92], match: [0.92, 1.15], safety: [1.15, 1.40] },
    aggressive: { reach: [0.70, 0.90], match: [0.90, 1.12], safety: [1.12, 1.35] },
    conservative: { reach: [0.80, 0.95], match: [0.95, 1.20], safety: [1.20, 1.50] },
  };

  const r = ratios[type] || ratios.moderate;

  return {
    reach: { min: Math.round(userRank * r.reach[0]), max: Math.round(userRank * r.reach[1]) },
    match: { min: Math.round(userRank * r.match[0]), max: Math.round(userRank * r.match[1]) },
    safety: { min: Math.round(userRank * r.safety[0]), max: Math.round(userRank * r.safety[1]) },
  };
}
