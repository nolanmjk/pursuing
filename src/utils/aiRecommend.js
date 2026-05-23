import { aiChat } from './aiChat';

const MAX_PER_POOL = 25; // candidates per pool sent to AI
const TOTAL_PICKS = 45;

function formatPool(entries, poolName, collegeMap, majorMap) {
  if (!entries.length) return `${poolName}：无候选\n`;
  const lines = entries.slice(0, MAX_PER_POOL).map((e, i) => {
    const college = collegeMap[e.collegeId]?.name || e.collegeId;
    const major = majorMap[e.majorId]?.name || e.majorId;
    const city = collegeMap[e.collegeId]?.city || '-';
    return `  ${i + 1}. ${college} - ${major} - ${city} - 最低位次${e.minRank?.toLocaleString() || '?'}名`;
  });
  return `${poolName}（共${entries.length}个候选，展示前${lines.length}个）：\n${lines.join('\n')}\n`;
}

function buildPrompt(userContext, pools, preferences, collegeMap, majorMap) {
  const { score, rank, subject } = userContext;
  const cityStr = preferences.cities?.length > 0 ? preferences.cities.join('、') : '不限';
  const majorStr = preferences.majors?.length > 0 ? [...new Set(preferences.majors)].slice(0, 8).join('、') : '不限';

  const header = `你是甘肃高考志愿填报专家"小楷"。请根据以下信息，从候选池中为用户挑选最合适的${TOTAL_PICKS}个志愿。

**用户情况**：
- 分数：${score}分
- 全省位次：${rank.toLocaleString()}名
- 科类：${subject}
- 偏好城市：${cityStr}
- 偏好专业：${majorStr}

**候选池**（系统已按位次法预筛选，ratio=院校最低位次/用户位次）：
`;

  const reachStr = formatPool(pools.reach, '【冲刺池】ratio 0.60-0.99', collegeMap, majorMap);
  const matchStr = formatPool(pools.match, '【稳妥池】ratio 1.00-1.49', collegeMap, majorMap);
  const safetyStr = formatPool(pools.safety, '【保底池】ratio 1.50+', collegeMap, majorMap);

  const footer = `**任务**：
从以上三个候选池中，综合考虑院校层次、专业实力、城市发展、用户偏好，挑选出${TOTAL_PICKS}个最优志愿。
- 冲刺约15个（ratio接近用户位次的优先，跳一跳够得着的）
- 稳妥约17个（匹配度最高的）
- 保底约13个（确保有学上的，优先用户偏好城市）

**重要规则**：
1. 只能从候选池中挑选，不要推荐候选池之外的院校
2. 优先用户偏好的城市和专业，但也要适当保留不同梯度的备选
3. 冲刺池中ratio过低（<0.50）的学校基本没希望，谨慎选择
4. 保底池确保足够数量，防止滑档

请严格按以下JSON格式返回（不要包含markdown代码块标记）：
{
  "reach": [3, 7, 12, ...],
  "match": [2, 5, 8, ...],
  "safety": [1, 4, 9, ...],
  "analysis": "你的整体分析和报考策略建议（200字以内）"
}`;

  return header + '\n' + reachStr + '\n' + matchStr + '\n' + safetyStr + '\n' + footer;
}

function parseResponse(content, pools) {
  if (!content) return null;

  // Try to extract JSON from response (AI might wrap in markdown code blocks)
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) jsonStr = jsonMatch[1];
  else {
    // Try to find { ... } block
    const braceMatch = content.match(/\{[\s\S]*\}/);
    if (braceMatch) jsonStr = braceMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr.trim());
    const { reach = [], match = [], safety = [], analysis = '' } = parsed;

    // Map indices back to actual pool entries (indices are 1-based)
    const mapIndices = (indices, pool) =>
      indices.map(i => pool[i - 1]).filter(Boolean);

    const reachPicks = mapIndices(reach, pools.reach);
    const matchPicks = mapIndices(match, pools.match);
    const safetyPicks = mapIndices(safety, pools.safety);

    if (reachPicks.length === 0 && matchPicks.length === 0 && safetyPicks.length === 0) {
      return null; // AI returned empty picks
    }

    return { reachPicks, matchPicks, safetyPicks, analysis };
  } catch {
    return null;
  }
}

/**
 * Ask AI to curate recommendations from algorithm-generated candidate pools.
 * Returns structured picks + analysis, or null if AI is unavailable.
 *
 * @param {Object} userContext - { score, rank, subject }
 * @param {Object} pools - { reach: [], match: [], safety: [] }
 * @param {Object} preferences - { cities: [], majors: [] }
 * @param {Object} collegeMap - college id → { name, city, ... }
 * @param {Object} majorMap - major id → { name, ... }
 * @returns {Promise<{reachPicks:[], matchPicks:[], safetyPicks:[], analysis:string}|null>}
 */
export async function aiRecommend({ userContext, pools, preferences, collegeMap, majorMap }) {
  // Skip AI when candidate pools are too small — algorithm fallback is more reliable
  const totalCandidates = pools.reach.length + pools.match.length + pools.safety.length;
  if (totalCandidates < 20) return null;

  const prompt = buildPrompt(userContext, pools, preferences, collegeMap, majorMap);

  const reply = await aiChat(
    [{ role: 'user', content: prompt }],
    { max_tokens: 4000 },
  );

  if (!reply) return null;

  return parseResponse(reply, pools);
}
