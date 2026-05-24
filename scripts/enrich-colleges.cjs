/**
 * Batch-enrich colleges.json with majors data via DeepSeek API.
 * Usage: node scripts/enrich-colleges.cjs
 *
 * Processes colleges that appear in 普通类 admission records and have
 * sparse majors data. Sends batched requests, maps responses to our
 * major IDs, and writes the enriched data back.
 */
const fs = require('fs');
const https = require('https');

const DEEPSEEK_KEY = 'sk-f506eba81c5c485bb03e76774aedc7ef';
const BATCH_SIZE = 25;

// ---- Load data ----
const colleges = JSON.parse(fs.readFileSync('./src/data/colleges.json', 'utf8'));
const majors = JSON.parse(fs.readFileSync('./src/data/majors.json', 'utf8'));
const admissions = JSON.parse(fs.readFileSync('./src/data/admission_scores.json', 'utf8'));

// ---- Build indexes ----
const majorNameToId = {};
const majorNameLower = {};
majors.forEach(m => {
  majorNameToId[m.name] = m.id;
  majorNameLower[m.name.toLowerCase().replace(/\s/g, '')] = m.id;
  // Also index without parenthetical notes
  const clean = m.name.replace(/[（(].*?[）)]/g, '').trim();
  if (clean !== m.name) {
    majorNameLower[clean.toLowerCase().replace(/\s/g, '')] = m.id;
  }
});

// ---- Find colleges needing enrichment ----
const putongIds = new Set(
  admissions.filter(a => (a._groupName || '').includes('普通类')).map(a => a.collegeId)
);

// Priority scoring: 985/211/双一流/Gansu first
const priorityScore = (c) => {
  let s = 0;
  if (c.level === '985') s += 100;
  else if (c.level === '211') s += 70;
  else if (c.isDoubleFirstClass) s += 50;
  else if (c.level === '省重点') s += 30;
  if (c.province === '甘肃') s += 40;
  return s;
};

const toEnrich = colleges
  .filter(c => putongIds.has(c.id) && (!c.majors || c.majors.length <= 2))
  .sort((a, b) => priorityScore(b) - priorityScore(a));

console.log(`Colleges to enrich: ${toEnrich.length}`);
console.log(`Batches: ${Math.ceil(toEnrich.length / BATCH_SIZE)}\n`);

// ---- API call helper ----
function callDeepSeek(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.3,
      max_tokens: 4000,
    });

    const req = https.request({
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.choices?.[0]?.message?.content || null);
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', (e) => reject(e));
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

// Common aliases for majors not in our dataset
const MAJOR_ALIASES = {
  '哲学': '哲学类',
  '哲学类': '哲学类',
  '中国语言文学': '汉语言文学',
  '中国语言文学类': '汉语言文学',
  '社会学': '社会学类',
  '大气科学': '大气科学类',
  '草业科学': '草业科学类',
  '核工程与核技术': '核工程类',
  '税收学': '财政学',
  '财政学类': '财政学',
  '美术学': '美术学类',
  '音乐学': '音乐学类',
  '体育教育': '体育学类',
  '心理学': '心理学类',
  '地理科学': '地理科学类',
  '生物科学': '生物科学类',
  '化学': '化学类',
  '物理学': '物理学类',
  '数学与应用数学': '数学类',
  '历史学': '历史学类',
  '思想政治教育': '思想政治教育',
  '新闻学': '新闻传播学类',
  '广播电视学': '新闻传播学类',
  '社会学类': '社会学类',
  '政治学与行政学': '政治学类',
};

// ---- Match major name to our ID ----
function matchMajor(name) {
  // Direct match
  if (majorNameToId[name]) return majorNameToId[name];

  // Check aliases
  if (MAJOR_ALIASES[name]) {
    const alias = MAJOR_ALIASES[name];
    if (majorNameToId[alias]) return majorNameToId[alias];
  }

  // Normalized match
  const key = name.toLowerCase().replace(/\s/g, '').replace(/类$/, '');
  if (majorNameLower[key]) return majorNameLower[key];

  // Try stripping trailing qualifiers
  const base = key.replace(/（.*）/, '').replace(/\(.*\)/, '');
  if (majorNameLower[base]) return majorNameLower[base];

  // Fuzzy: check if any known major contains this name or vice versa
  for (const [known, id] of Object.entries(majorNameLower)) {
    if (known.includes(key) || key.includes(known)) {
      return id;
    }
  }

  return null;
}

// ---- Main ----
async function main() {
  let enriched = 0;
  let totalMajorsAdded = 0;

  for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
    const batch = toEnrich.slice(i, i + BATCH_SIZE);
    const batchNames = batch.map((c, j) => `${i + j + 1}. ${c.name}`).join('\n');

    const prompt = `请列出以下每所大学的主要本科专业（每所列出10-15个代表性专业）。只返回JSON格式，不要其他内容。

院校列表：
${batchNames}

返回格式（严格JSON，majorName必须是标准专业名称，不要缩写）：
{
  "北京大学": ["法学", "经济学", "汉语言文学", "历史学", "哲学", "新闻学", "工商管理", "英语", "社会学", "政治学与行政学"],
  ...
}`;

    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toEnrich.length / BATCH_SIZE)}: ${batch.length} colleges...`);

    try {
      const reply = await callDeepSeek([
        { role: 'system', content: '你是中国高等教育专家，精通各高校专业设置。只返回JSON，不要解释。' },
        { role: 'user', content: prompt },
      ]);

      if (!reply) {
        console.log('  (no response, skipping)');
        continue;
      }

      // Parse JSON
      let parsed;
      try {
        const jsonStr = reply.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(jsonStr);
      } catch {
        console.log('  (JSON parse failed, skipping batch)');
        console.log('  Raw:', reply.slice(0, 200));
        continue;
      }

      // Map results back to colleges
      for (const c of batch) {
        const aiMajors = parsed[c.name];
        if (!aiMajors || !Array.isArray(aiMajors)) continue;

        const matchedIds = [];
        for (const name of aiMajors) {
          const id = matchMajor(name);
          if (id) matchedIds.push(id);
        }

        if (matchedIds.length > 0) {
          // Merge with existing majors
          const existing = new Set(c.majors || []);
          matchedIds.forEach(id => existing.add(id));

          // Update the college object in the main array
          const collegeInMain = colleges.find(x => x.id === c.id);
          if (collegeInMain) {
            collegeInMain.majors = [...existing];
          }

          enriched++;
          totalMajorsAdded += matchedIds.length;
        }
      }

      console.log(`  ${batch.length} processed, enriched so far: ${enriched}`);

    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }

    // Rate limit: wait 2s between batches
    if (i + BATCH_SIZE < toEnrich.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Write back
  fs.writeFileSync('./src/data/colleges.json', JSON.stringify(colleges, null, 2), 'utf8');
  console.log(`\nDone! Enriched ${enriched} colleges, added ${totalMajorsAdded} major references.`);
  console.log('colleges.json updated.');

  // Quick stats
  const nowRich = colleges.filter(c => putongIds.has(c.id) && c.majors && c.majors.length > 2).length;
  console.log(`Colleges with 普通类 and >2 majors: ${nowRich} / ${putongIds.size}`);
}

main().catch(console.error);
