// Dev: Vite proxy rewrites /api → DeepSeek and injects the key.
// Prod: call DeepSeek directly (CORS is allowed).
// Set VITE_DEEPSEEK_KEY in .env for production builds.
// TODO: replace with Cloudflare Worker to keep the key off the wire.
const DEEPSEEK_KEY = import.meta.env.VITE_DEEPSEEK_KEY || '';
const API_BASE = import.meta.env.DEV
  ? '/api'
  : 'https://api.deepseek.com/v1';

const SYSTEM_PROMPT = `你是"小楷"，一个专注于甘肃高考志愿填报的AI助手。你的特点：
- 热情、耐心、专业，像一位有经验的学长/学姐
- 只回答高考志愿填报相关问题，尤其是甘肃省的政策
- 使用口语化的中文，回答简洁有条理（控制在300字以内）
- 如果问题超出高考志愿范围，礼貌引导回正题

你需要掌握的核心知识：
1. 平行志愿规则：分数优先、遵循志愿、一轮投档。甘肃本科批C段45个院校专业组平行志愿，每个专业组6个专业
2. 位次法：位次比分数更稳定，用位次匹配往年院校录取数据
3. 冲稳保策略：冲刺（位次高于你）、稳妥（位次接近）、保底（位次低于你），建议冲10-15/稳15-20/保10-15
4. 退档vs滑档：滑档=45个全没投上；退档=投上了被退回（主因是不服从调剂）
5. 院校专业组：新高考3+1+2下的填报单位，选科要求必须匹配
6. 省控线：2025甘肃物理类本科374/特控475，历史类本科421/特控499
7. 征集志愿：每批录取后的补录，时间紧竞争大
8. 服从调剂：强烈建议勾选，否则退档风险极大
9. 三大专项计划：国家专项、高校专项、地方专项
10. 填报时间一般在6月底-7月

当前日期：2026年5月。用户是甘肃高三毕业生。`;

/**
 * Call DeepSeek chat API. Falls back to null on error (caller should use keyword matching).
 * @param {Array<{role:string, content:string}>} messages
 * @returns {Promise<string|null>}
 */
export async function aiChat(messages, options = {}) {
  const { max_tokens = 600 } = options;
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (!import.meta.env.DEV) {
      headers['Authorization'] = `Bearer ${DEEPSEEK_KEY}`;
    }
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

/**
 * Build conversation context from user info
 */
export function buildUserContext({ userScore, userRank, userSubject }) {
  if (!userScore && !userRank) return '';
  const parts = [];
  if (userScore) parts.push(`分数：${userScore}分`);
  if (userRank) parts.push(`位次：${userRank.toLocaleString()}名`);
  if (userSubject) parts.push(`科类：${userSubject}`);
  return parts.length > 0 ? `\n\n（用户信息：${parts.join('，')}。如果用户问及分数相关的问题，请结合这些信息给出个性化建议。）` : '';
}
