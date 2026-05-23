const CITY_SET = new Set([
  '兰州', '成都', '西安', '北京', '上海', '重庆', '武汉', '南京', '杭州', '广州',
  '深圳', '天津', '长沙', '青岛', '大连', '苏州', '合肥', '郑州', '济南', '沈阳',
  '哈尔滨', '长春', '昆明', '贵阳', '南宁', '太原', '石家庄', '南昌', '福州',
  '厦门', '呼和浩特', '乌鲁木齐', '银川', '西宁', '拉萨', '海口', '珠海',
  '东莞', '佛山', '宁波', '无锡', '常州', '徐州', '兰州', '天水', '酒泉',
]);

const MAJOR_KEYWORDS = {
  '计算机': ['计算机科学与技术', '软件工程', '网络工程', '信息安全', '物联网工程', '数字媒体技术', '智能科学与技术', '数据科学与大数据技术'],
  '软件': ['软件工程'],
  '医学': ['临床医学', '口腔医学', '基础医学', '预防医学', '中医学', '药学', '护理学', '医学影像学', '麻醉学', '儿科学', '眼视光医学'],
  '临床': ['临床医学'],
  '学医': ['临床医学', '口腔医学', '基础医学', '预防医学', '中医学', '麻醉学', '医学影像学'],
  '读医': ['临床医学', '口腔医学', '基础医学', '预防医学'],
  '医生': ['临床医学', '口腔医学', '麻醉学', '儿科学'],
  '电子': ['电子信息工程', '电子科学与技术', '通信工程', '微电子科学与工程', '光电信息科学与工程', '集成电路设计与集成系统'],
  '电气': ['电气工程及其自动化'],
  '机械': ['机械工程', '机械设计制造及其自动化', '机械电子工程', '车辆工程'],
  '土木': ['土木工程', '建筑环境与能源应用工程', '给排水科学与工程'],
  '建筑': ['建筑学', '城乡规划', '风景园林'],
  '金融': ['金融学', '金融工程', '保险学', '投资学'],
  '经济': ['经济学', '经济统计学', '国际经济与贸易'],
  '会计': ['会计学', '财务管理', '审计学'],
  '法律': ['法学', '知识产权'],
  '师范': ['教育学', '学前教育', '小学教育', '汉语言文学', '数学与应用数学', '英语', '物理学', '化学', '生物科学', '历史学', '地理科学'],
  '英语': ['英语', '翻译', '商务英语'],
  '新闻': ['新闻学', '传播学', '广播电视学', '广告学', '网络与新媒体'],
  '自动化': ['自动化', '机器人工程'],
  '人工智能': ['人工智能'],
  '数学': ['数学与应用数学', '信息与计算科学'],
  '物理': ['物理学', '应用物理学'],
  '化学': ['化学', '应用化学'],
  '生物': ['生物科学', '生物技术', '生物工程'],
  '材料': ['材料科学与工程', '材料物理', '材料化学', '高分子材料与工程'],
  '环境': ['环境工程', '环境科学'],
  '管理': ['工商管理', '人力资源管理', '市场营销', '物流管理', '行政管理'],
};

const SUBJECT_KEYWORDS = {
  '物理类': ['物理类', '理科', '物理', '理工', '物化', '物生', '物地', '物政'],
  '历史类': ['历史类', '文科', '历史', '史政', '史地', '史化', '史生'],
};

export function parseSentence(input) {
  if (!input || !input.trim()) return { score: null, subject: null, cities: [], majors: [], keywords: [] };

  const text = input.trim();
  const result = { score: null, subject: null, cities: [], majors: [], keywords: [] };

  // Extract score (3-digit number 200-750)
  const scoreMatch = text.match(/(\d{3})/);
  if (scoreMatch) {
    const s = parseInt(scoreMatch[1], 10);
    if (s >= 200 && s <= 750) result.score = s;
  }

  // Extract rank: "位次5000" or "排名8000" or "8000名" or "全省5000"
  const rankMatch = text.match(/(?:位次|排名|全省)\s*(\d{2,7})|(\d{2,7})\s*名/);
  if (rankMatch) {
    const r = parseInt(rankMatch[1] || rankMatch[2], 10);
    if (r >= 1 && r <= 200000) result.rank = r;
  }

  // Extract subject
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) {
      result.subject = subject;
      break;
    }
  }

  // Extract cities
  for (const city of CITY_SET) {
    if (text.includes(city)) result.cities.push(city);
  }

  // Detect "保底留X" pattern → cities used only for safety
  if (/(?:保底留|保底在|保底放)([一-龥]+)/.test(text)) {
    result.keywords.push('safety_only_cities');
  }

  // Extract major preferences
  for (const [keyword, majorNames] of Object.entries(MAJOR_KEYWORDS)) {
    if (text.includes(keyword)) {
      result.majors.push(...majorNames);
    }
  }
  // Dedup majors
  result.majors = [...new Set(result.majors)];

  // Detect strategy hints
  if (/激进|冒险|冲一冲/.test(text)) result.keywords.push('aggressive');
  if (/保守|稳一稳|保险/.test(text)) result.keywords.push('conservative');

  return result;
}
