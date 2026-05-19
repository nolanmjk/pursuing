import { classifyChoice } from './matchAlgorithm';

export function analyzeForm(choices, userRank) {
  if (!userRank || !choices.length) return null;

  const analysis = choices.map((choice, index) => {
    const { level, color } = classifyChoice(userRank, choice.minRank);
    return { ...choice, index: index + 1, level, color };
  });

  const counts = { 冲刺: 0, 稳妥: 0, 保底: 0 };
  analysis.forEach(c => { if (counts[c.level] !== undefined) counts[c.level]++; });

  const warnings = [];
  const total = analysis.length;

  if (counts['冲刺'] === total) {
    warnings.push('所有志愿都是冲刺，落榜风险极大！建议增加稳妥和保底志愿。');
  } else if (counts['冲刺'] > total * 0.6) {
    warnings.push('冲刺志愿过多，建议适当增加稳妥和保底志愿，降低落榜风险。');
  }

  if (counts['保底'] === 0) {
    warnings.push('没有保底志愿！万一稳妥志愿全部录满，将面临滑档风险。');
  } else if (counts['保底'] < total * 0.15) {
    warnings.push('保底志愿偏少，建议至少占总志愿数的15%-20%。');
  }

  if (!warnings.length) {
    warnings.push('志愿梯度设置合理，冲/稳/保比例良好，祝录取顺利！');
  }

  return { choices: analysis, counts, warnings };
}
