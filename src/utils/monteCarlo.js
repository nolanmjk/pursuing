/**
 * Box-Muller transform: generate Gaussian random number
 */
function gaussianRandom(mean = 0, stdDev = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Run a single batch of Monte Carlo simulations on a志愿表.
 * Pure function, no side effects.
 *
 * @param {Array} choices - Array of {index, minRank, collegeId, majorId}
 * @param {number} userRank - User's provincial rank
 * @param {number} numSims - Number of simulations in this batch
 * @param {number} noiseRatio - Standard deviation as ratio of minRank (default 0.08)
 * @returns {{ hitDistribution: number[], missCount: number }}
 */
export function runMonteCarloBatch(choices, userRank, numSims, noiseRatio = 0.08) {
  const n = choices.length;
  const hitDistribution = new Array(n).fill(0);
  let missCount = 0;

  for (let sim = 0; sim < numSims; sim++) {
    let hit = false;
    for (let i = 0; i < n; i++) {
      const noisyRank = choices[i].minRank + gaussianRandom(0, choices[i].minRank * noiseRatio);
      if (noisyRank >= userRank) {
        hitDistribution[i]++;
        hit = true;
        break;
      }
    }
    if (!hit) missCount++;
  }

  return { hitDistribution, missCount };
}

/**
 * Run full Monte Carlo simulation with aggregated results.
 *
 * @returns {{
 *   totalSims: number,
 *   hitDistribution: number[],
 *   missCount: number,
 *   missRate: number,
 *   mostLikelyIndex: number,
 *   mostLikelyRate: number,
 *   perChoiceRisk: Array<{index, hitCount, hitRate, riskLevel}>
 * }}
 */
export function aggregateResults(choices, allBatches) {
  const n = choices.length;
  let totalSims = 0;
  const hitDistribution = new Array(n).fill(0);
  let missCount = 0;

  for (const batch of allBatches) {
    totalSims += batch.hitDistribution.reduce((s, v) => s + v, 0) + batch.missCount;
    for (let i = 0; i < n; i++) {
      hitDistribution[i] += batch.hitDistribution[i];
    }
    missCount += batch.missCount;
  }

  const missRate = missCount / totalSims;
  let mostLikelyIndex = 0;
  for (let i = 1; i < n; i++) {
    if (hitDistribution[i] > hitDistribution[mostLikelyIndex]) mostLikelyIndex = i;
  }

  const perChoiceRisk = choices.map((c, i) => ({
    index: c.index || i + 1,
    collegeId: c.collegeId,
    majorId: c.majorId,
    minRank: c.minRank,
    hitCount: hitDistribution[i],
    hitRate: hitDistribution[i] / totalSims,
    riskLevel: hitDistribution[i] / totalSims > 0.3 ? '高安全' :
               hitDistribution[i] / totalSims > 0.1 ? '中等' : '高风险',
  }));

  return {
    totalSims,
    hitDistribution,
    missCount,
    missRate,
    mostLikelyIndex,
    mostLikelyRate: hitDistribution[mostLikelyIndex] / totalSims,
    perChoiceRisk,
  };
}
