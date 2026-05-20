// 生成甘肃一分一段表数据（模拟真实分布）
const fs = require('fs');

function generateRankTable(year, subjectCategory, totalExaminees, meanScore, stdDev) {
  const data = [];
  // 从750到200分，每隔一定分数生成数据
  for (let score = 750; score >= 200; score--) {
    // 用正态分布估算该分数段人数
    const z = (score - meanScore) / stdDev;
    const density = Math.exp(-0.5 * z * z) / (stdDev * Math.sqrt(2 * Math.PI));
    let segmentCount = Math.round(density * totalExaminees * 0.8);

    // 高分段更稀疏，中低分段更密集
    if (score >= 680) segmentCount = Math.round(segmentCount * 0.15);
    else if (score >= 650) segmentCount = Math.round(segmentCount * 0.4);
    else if (score >= 600) segmentCount = Math.round(segmentCount * 0.7);

    segmentCount = Math.max(0, segmentCount);

    // 计算累计人数
    if (data.length === 0) {
      data.push({ score, segmentCount, cumulativeCount: segmentCount });
    } else {
      const prev = data[data.length - 1];
      data.push({ score, segmentCount, cumulativeCount: prev.cumulativeCount + segmentCount });
    }
  }

  // 只保存关键分数点（每5分），尾端每10分
  const filtered = data.filter(d => {
    if (d.score >= 650) return true;  // 650以上每分都存
    if (d.score >= 500) return d.score % 5 === 0;
    return d.score % 10 === 0;
  });

  return filtered.map(d => ({
    year,
    subjectCategory,
    score: d.score,
    segmentCount: d.segmentCount,
    cumulativeCount: d.cumulativeCount,
  }));
}

const tables = [
  // 2024物理类 ~13万考生 新高考第一年，均分~420
  ...generateRankTable(2024, '物理类', 132000, 415, 85),
  // 2024历史类 ~8万考生
  ...generateRankTable(2024, '历史类', 81000, 420, 75),
  // 2023理科 ~11.5万考生
  ...generateRankTable(2023, '理科', 115000, 408, 82),
  // 2023文科 ~7.5万考生
  ...generateRankTable(2023, '文科', 76000, 412, 72),
  // 2022理科 ~11万
  ...generateRankTable(2022, '理科', 110000, 400, 80),
  // 2022文科 ~7.2万
  ...generateRankTable(2022, '文科', 73000, 405, 70),
  // 2025物理类 ~13.5万 (最新一届)
  ...generateRankTable(2025, '物理类', 136000, 418, 86),
  // 2025历史类 ~8.2万
  ...generateRankTable(2025, '历史类', 83000, 422, 76),
];

fs.writeFileSync(
  __dirname + '/../src/data/rank_table.json',
  JSON.stringify(tables, null, 2)
);

console.log(`生成完成：${tables.length} 条一分一段表记录`);
