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

  const totalCandidates = pools.reach.length + pools.match.length + pools.safety.length;
  const targetPicks = Math.min(TOTAL_PICKS, totalCandidates);

  const scoreLine = score != null ? `- 分数：${score}分` : `- 分数：未提供（位次${rank.toLocaleString()}名）`;

  const header = `你是甘肃高考志愿填报专家"小楷"。请根据以下信息，从候选池中为用户挑选最合适的${targetPicks}个志愿。

**用户情况**：
${scoreLine}
- 全省位次：${rank.toLocaleString()}名
- 科类：${subject}
- 偏好城市：${cityStr}
- 偏好专业：${majorStr}

**候选池**（系统已按位次法预筛选，ratio=院校最低位次/用户位次）：
`;

  const reachStr = formatPool(pools.reach, '【冲刺池】ratio 0.60-0.99', collegeMap, majorMap);
  const matchStr = formatPool(pools.match, '【稳妥池】ratio 1.00-1.49', collegeMap, majorMap);
  const safetyStr = formatPool(pools.safety, '【保底池】ratio 1.50+', collegeMap, majorMap);

  const hasPrefs = preferences.cities?.length > 0 || preferences.majors?.length > 0;
  const prefInstruction = hasPrefs
    ? `\n**极其重要 — 用户偏好必须优先**：用户指定了${cityStr !== '不限' ? `城市偏好「${cityStr}」` : ''}${cityStr !== '不限' && majorStr !== '不限' ? '和' : ''}${majorStr !== '不限' ? `专业偏好「${majorStr}」` : ''}。在候选池中，凡是匹配用户城市或专业偏好的候选，请**优先选中**。即使用户偏好的候选位于保底池而非冲刺池，也请优先选中它们，而不是选一些不相关的冲刺候选。用户想要的是一份贴近他/她需求的真实志愿表，而不是理论上的"好学校"。`
    : '';

  const footer = `**任务**：
从以上三个候选池中，挑选出${targetPicks}个最优志愿。
- 冲刺约${Math.round(targetPicks * 0.33)}个（ratio接近用户位次的优先）
- 稳妥约${Math.round(targetPicks * 0.37)}个（匹配度最高的）
- 保底约${targetPicks - Math.round(targetPicks * 0.33) - Math.round(targetPicks * 0.37)}个（确保有学上的）${prefInstruction}

**重要规则**：
1. 只能从候选池中挑选，不要推荐候选池之外的院校
2. 用户偏好的城市和专业比院校层次更重要 — 匹配偏好优先
3. 冲刺池中ratio过低（<0.50）的学校基本没希望，谨慎选择
4. 保底池确保足够数量，防止滑档${subject === '历史类' ? `\n5. **科类限制（极其重要）**：用户是历史类考生，只能报考文学、法学、经济学、管理学、教育学、历史学、艺术学等文科专业。绝对不要在analysis中推荐或提及任何理工医农专业（如计算机、电子信息、临床医学、物理学等），也不要说"xx大学的工科很好"。如果候选池中有工学/医学/理学/农学专业的条目被误列入，请跳过不选。` : subject === '物理类' ? `\n5. **科类提醒**：用户是物理类考生，可报考绝大多数专业，但部分特殊专业可能要求再选化学/生物，选择时注意专业组标注。` : ''}

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
