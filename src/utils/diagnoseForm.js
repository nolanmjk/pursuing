import collegesData from '../data/colleges.json';

const collegeMap = {};
collegesData.forEach(c => { collegeMap[c.id] = c; });

/**
 * Diagnose a completed volunteer form for common issues.
 * Returns a list of findings with severity: error | warning | info.
 *
 * @param {Array} choices - validated choices with { collegeId, majorId, minRank, zone, groupName }
 * @param {number} userRank - student's provincial rank
 * @param {string} userSubject - '物理类' | '历史类'
 * @returns {{ findings: Array, score: number }}
 */
export function diagnoseForm(choices, userRank, userSubject) {
  if (!userRank || userRank <= 0) {
    return { findings: [{ severity: 'error', title: '缺少位次信息', detail: '请先设置你的全省位次后再进行诊断' }], score: 0 };
  }
  const findings = [];
  const valid = choices.filter(c => c.collegeId && c.majorId && c.minRank > 0);

  if (valid.length === 0) {
    return { findings: [{ severity: 'error', title: '无法诊断', detail: '请先填写至少一个有效的志愿' }], score: 0 };
  }

  // 1. 梯度倒挂：前面的志愿位次比后面的还低（更容易考上）
  let inversions = [];
  for (let i = 1; i < valid.length; i++) {
    const prev = valid[i - 1];
    const curr = valid[i];
    if (prev.minRank && curr.minRank && prev.minRank > curr.minRank + 500) {
      inversions.push({ prevIndex: i, currIndex: i + 1, prevCollege: prev.collegeId, currCollege: curr.collegeId });
    }
  }
  if (inversions.length > 0) {
    findings.push({
      severity: 'warning',
      title: `发现 ${inversions.length} 处梯度倒挂`,
      detail: `第${inversions[0].prevIndex}志愿的录取位次(${valid[inversions[0].prevIndex - 1].minRank?.toLocaleString()})低于第${inversions[0].currIndex}志愿(${valid[inversions[0].currIndex - 1].minRank?.toLocaleString()})，这意味着你更难考上的学校排在了更容易考上的学校前面。`,
      fix: '按录取位次从低到高（从难到易）重新排序：冲刺 → 稳妥 → 保底。',
    });
  }

  // 2. 保底检查：最后一个保底志愿的位次是否足够低
  const safetyChoices = valid.filter(c => c.zone === '保底');
  const rankedSafety = safetyChoices.filter(c => c.minRank > 0).sort((a, b) => b.minRank - a.minRank);
  if (rankedSafety.length === 0) {
    findings.push({
      severity: 'error',
      title: '缺少保底志愿',
      detail: '你的志愿表中没有任何保底志愿。如果冲刺和稳妥志愿都没有录取，你将滑档到下一批次。',
      fix: '建议至少添加4-6个保底志愿，位次比你低30%以上（即最低位次数字比你大30%以上）。',
    });
  } else {
    const bestSafety = rankedSafety[0]; // max rank (easiest to get into)
    const safetyMargin = (bestSafety.minRank - userRank) / userRank;
    if (safetyMargin < 0.15) {
      findings.push({
        severity: 'warning',
        title: '保底不够稳',
        detail: `你最保底的志愿位次是${bestSafety.minRank?.toLocaleString()}，仅比你(${userRank?.toLocaleString()})低${(safetyMargin * 100).toFixed(0)}%。如果今年位次波动较大，可能保不住。`,
        fix: '建议添加位次比你低30%以上的院校作为真正的保底。',
      });
    }
    if (rankedSafety.length < 3) {
      findings.push({
        severity: 'info',
        title: '保底志愿数量偏少',
        detail: `只有${rankedSafety.length}个保底志愿。平行志愿一轮投档，保底不够多的话风险较大。`,
        fix: '建议保底志愿不少于4个。',
      });
    }
  }

  // 3. 集中度检查：同城市/同层次
  const cityCount = {};
  const levelCount = {};
  valid.forEach(c => {
    const college = collegeMap[c.collegeId];
    if (!college) return;
    cityCount[college.city] = (cityCount[college.city] || 0) + 1;
    levelCount[college.level] = (levelCount[college.level] || 0) + 1;
  });

  const dominantCity = Object.entries(cityCount).sort((a, b) => b[1] - a[1])[0];
  if (dominantCity && dominantCity[1] > valid.length * 0.5) {
    findings.push({
      severity: 'info',
      title: `志愿集中在${dominantCity[0]}`,
      detail: `${dominantCity[1]}/${valid.length}个志愿都选在${dominantCity[0]}。同城院校录取位次往往同涨同跌，分散城市可以降低风险。`,
      fix: '考虑增加不同城市的院校，比如成都、西安、武汉、南京等高校集中的城市。',
    });
  }

  // 4. 冲的太多
  const reachCount = valid.filter(c => c.zone === '冲刺').length;
  const totalRatio = reachCount / valid.length;
  if (totalRatio > 0.5) {
    findings.push({
      severity: 'warning',
      title: '冲刺比例过高',
      detail: `${reachCount}/${valid.length}(${(totalRatio * 100).toFixed(0)}%)个志愿都是冲刺。冲刺意味着录取概率较低，冲的太多可能导致前面的志愿全部无效。`,
      fix: '建议冲刺不超过40%，把更多位置留给稳妥和保底。',
    });
  }

  // 5. 普通类调剂风险
  const putongChoices = valid.filter(c => (c.groupName || '').includes('普通类'));
  if (putongChoices.length > 0) {
    const putongNotLast = putongChoices.some(c => c.zone !== '保底');
    if (putongNotLast) {
      findings.push({
        severity: 'info',
        title: '普通类专业组需注意调剂风险',
        detail: `你有${putongChoices.length}个志愿是"普通类"专业组，这些组内包含多个专业。如果分数不够组里的热门专业，可能被调剂到组内冷门专业。`,
        fix: '建议查看每个普通类专业组包含的具体专业方向，确保组内没有你完全不能接受的专业。如果不服从调剂，有退档风险。',
      });
    }
  }

  // 6. 同一院校连排太多
  let sameCollegeStreak = 0;
  let maxStreak = { count: 0, college: null, start: 0 };
  for (let i = 1; i < valid.length; i++) {
    if (valid[i].collegeId === valid[i - 1].collegeId) {
      sameCollegeStreak++;
      if (sameCollegeStreak > maxStreak.count) {
        maxStreak = { count: sameCollegeStreak + 1, college: valid[i].collegeId, start: i - sameCollegeStreak };
      }
    } else {
      sameCollegeStreak = 0;
    }
  }
  if (maxStreak.count >= 3) {
    const college = collegeMap[maxStreak.college];
    findings.push({
      severity: 'info',
      title: `同一院校连续${maxStreak.count}个志愿`,
      detail: `${college?.name || '未知院校'}连续出现${maxStreak.count}次。同一学校的专业组录取位次通常接近，排太多浪费志愿位置。`,
      fix: '每所院校最多填2-3个专业组即可，留出位置给其他院校。',
    });
  }

  // Score: 100 minus deductions
  let score = 100;
  findings.forEach(f => {
    if (f.severity === 'error') score -= 20;
    else if (f.severity === 'warning') score -= 10;
    else score -= 3;
  });
  score = Math.max(0, Math.min(100, score));

  return { findings, score };
}
