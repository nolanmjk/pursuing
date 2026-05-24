// Normalize city name to base form for matching
function normalizeCity(name) {
  return (name || '').replace(/市$/, '');
}

const CITY_SET = new Set([
  '兰州', '成都', '西安', '北京', '上海', '重庆', '武汉', '南京', '杭州', '广州',
  '深圳', '天津', '长沙', '青岛', '大连', '苏州', '合肥', '郑州', '济南', '沈阳',
  '哈尔滨', '长春', '昆明', '贵阳', '南宁', '太原', '石家庄', '南昌', '福州',
  '厦门', '呼和浩特', '乌鲁木齐', '银川', '西宁', '拉萨', '海口', '珠海',
  '东莞', '佛山', '宁波', '无锡', '常州', '徐州', '天水', '酒泉',
  '咸阳', '延安', '绵阳', '雅安', '石河子', '桂林', '秦皇岛', '烟台', '威海',
  '温州', '绍兴', '芜湖', '洛阳', '开封', '湘潭', '岳阳', '衡阳',
  '柳州', '遵义', '大理', '丽江', '三亚', '镇江', '扬州',
]);

// Province-name keywords mapped to their major cities
const PROVINCE_KEYWORDS = {
  '江苏': ['南京','苏州','无锡','常州','徐州','南通','扬州','镇江','盐城','泰州','淮安','连云港','宿迁'],
  '浙江': ['杭州','宁波','温州','嘉兴','湖州','绍兴','金华','衢州','舟山','台州','丽水'],
  '广东': ['广州','深圳','珠海','东莞','佛山','中山','惠州','汕头','湛江','肇庆','江门','茂名','清远','揭阳','韶关'],
  '四川': ['成都','绵阳','德阳','宜宾','南充','泸州','乐山','自贡','广元','内江','雅安'],
  '湖北': ['武汉','宜昌','襄阳','荆州','黄石','十堰','黄冈','咸宁','荆门'],
  '湖南': ['长沙','湘潭','衡阳','株洲','岳阳','常德','邵阳','益阳','郴州','永州','怀化'],
  '山东': ['济南','青岛','烟台','威海','潍坊','淄博','济宁','泰安','临沂','日照','德州','聊城','滨州','菏泽'],
  '福建': ['福州','厦门','泉州','漳州','龙岩','三明','南平','莆田','宁德'],
  '安徽': ['合肥','芜湖','蚌埠','马鞍山','安庆','黄山','滁州','阜阳'],
  '河南': ['郑州','洛阳','开封','南阳','新乡','安阳','平顶山','焦作','许昌'],
  '河北': ['石家庄','唐山','保定','廊坊','秦皇岛','邯郸','沧州','张家口'],
  '辽宁': ['沈阳','大连','鞍山','抚顺','本溪','丹东','锦州','营口','盘锦','葫芦岛'],
  '吉林': ['长春','吉林市','延吉','四平','白城'],
  '黑龙江': ['哈尔滨','齐齐哈尔','牡丹江','佳木斯','大庆','伊春','黑河'],
  '陕西': ['西安','咸阳','宝鸡','渭南','延安','汉中','榆林'],
  '甘肃': ['兰州','天水','酒泉','武威','张掖','平凉','庆阳','嘉峪关'],
  '江西': ['南昌','九江','景德镇','赣州','吉安','宜春','上饶','萍乡','新余'],
  '贵州': ['贵阳','遵义','六盘水','毕节','安顺','凯里','都匀'],
  '云南': ['昆明','大理','丽江','曲靖','玉溪','普洱','临沧'],
  '广西': ['南宁','桂林','柳州','北海','梧州','玉林','钦州'],
  '海南': ['海口','三亚','儋州','琼海'],
  '山西': ['太原','大同','阳泉','长治','晋中','运城','临汾'],
  '内蒙古': ['呼和浩特','包头','鄂尔多斯','赤峰','通辽'],
};

// Region keywords that expand to provinces → cities
const REGION_KEYWORDS = {
  '南方': ['江苏','浙江','广东','福建','海南','广西','云南','贵州','四川','重庆','湖北','湖南','江西','安徽','上海'],
  '北方': ['北京','天津','河北','山西','内蒙古','辽宁','吉林','黑龙江','山东','河南','陕西','甘肃','宁夏','青海','新疆'],
  '华东': ['上海','江苏','浙江','安徽','福建','江西','山东'],
  '华南': ['广东','广西','海南'],
  '华中': ['河南','湖北','湖南'],
  '华北': ['北京','天津','河北','山西','内蒙古'],
  '西北': ['陕西','甘肃','青海','宁夏','新疆'],
  '西南': ['四川','重庆','贵州','云南','西藏'],
  '东北': ['辽宁','吉林','黑龙江'],
  '长三角': ['上海','江苏','浙江'],
  '江浙沪': ['上海','江苏','浙江'],
  '珠三角': ['广东'],
  '粤港澳': ['广东'],
  '北上广': ['北京','上海','广东'],
  '北上广深': ['北京','上海','广东','深圳'],
  '江浙': ['江苏','浙江'],
  '川渝': ['四川','重庆'],
};

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

// Helper: extract all cities from a text fragment (direct + province + region)
function extractCitiesFromText(text) {
  const cities = [];
  for (const city of CITY_SET) {
    if (text.includes(city)) cities.push(city);
  }
  for (const [province, provinceCities] of Object.entries(PROVINCE_KEYWORDS)) {
    if (text.includes(province)) {
      for (const city of provinceCities) {
        if (!cities.includes(city)) cities.push(city);
      }
    }
  }
  for (const [region, provinces] of Object.entries(REGION_KEYWORDS)) {
    if (text.includes(region)) {
      for (const province of provinces) {
        const pcities = PROVINCE_KEYWORDS[province];
        if (pcities) {
          for (const city of pcities) {
            if (!cities.includes(city)) cities.push(city);
          }
        } else if (CITY_SET.has(province) && !cities.includes(province)) {
          // 直辖市 or city-level entry (北京, 上海, 天津, 重庆, 深圳 etc.)
          cities.push(province);
        }
      }
    }
  }
  return cities;
}

// Convert Chinese numeral score expression to digits (e.g. "五百八十分" → "580分")
const CN_DIGITS = { 零:0, 一:1, 二:2, 两:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9 };
const CN_SCORE_RE = /([二三四五六七]百)([零一二三四五六七八九]十)?([一二三四五六七八九])?(?=分|左右|约)/g;

function replaceChineseScore(text) {
  return text.replace(CN_SCORE_RE, (_, hundreds, tens, ones) => {
    const h = CN_DIGITS[hundreds.charAt(0)] * 100;
    let t = 0;
    if (tens) {
      t = CN_DIGITS[tens.charAt(0)] * 10;
    } else if (ones && !tens) {
      // "五百八" shorthand: 八 means 八十 when after 百 without explicit 十
      t = CN_DIGITS[ones] * 10;
      return String(h + t);
    }
    const o = ones ? CN_DIGITS[ones] : 0;
    return String(h + t + o);
  });
}

export function parseSentence(input) {
  if (!input || !input.trim()) return { score: null, subject: null, cities: [], safetyCities: [], majors: [], keywords: [] };

  // Preprocess: convert Chinese numerals to Arabic (五百八十分 → 580分)
  const text = replaceChineseScore(input.trim());
  const result = { score: null, subject: null, cities: [], safetyCities: [], majors: [], keywords: [] };

  // Extract score: prefer 3-digit followed by "分" in range 200-750, unless it's part of a range
  const scoreMatches = [...text.matchAll(/(?<!\d)(\d{3})(?!\d)/g)];
  const match = scoreMatches.find(m => {
    const s = parseInt(m[1], 10);
    if (s < 200 || s > 750) return false;
    if (text.charAt(m.index + 3) !== '分') return false;
    // Check if this is the upper bound of a range like "580-600分", prefer lower
    if (text.charAt(m.index - 1) === '-' || text.charAt(m.index - 1) === '~' ||
        text.charAt(m.index - 1) === '到') return false;
    return true;
  }) || scoreMatches.find(m => {
    const s = parseInt(m[1], 10);
    return s >= 200 && s <= 750;
  });
  if (match) result.score = parseInt(match[1], 10);

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

  // Split text: safety clause vs main intent, so "去成都西安" and "保底留甘肃" don't mix
  const safetyMatch = text.match(/(?:保底留|保底在|保底放)([一-龥]+(?:[\s，、]+[一-龥]+)*)/);
  let mainText = text;
  let safetyText = '';

  if (safetyMatch) {
    result.keywords.push('safety_only_cities');
    safetyText = safetyMatch[1];
    mainText = text.replace(/(?:保底留|保底在|保底放)[一-龥\s，、]+/, '');
  }

  // Preferred cities from main intent (excludes safety clause)
  result.cities = extractCitiesFromText(mainText);

  // Safety cities from safety clause
  result.safetyCities = safetyText ? extractCitiesFromText(safetyText) : [];

  // Extract major preferences — match by keyword, then also by major name directly
  for (const [keyword, majorNames] of Object.entries(MAJOR_KEYWORDS)) {
    if (text.includes(keyword)) {
      result.majors.push(...majorNames);
    }
  }
  // Also check if user typed a major name directly (e.g. "法学" not "法律")
  for (const majorNames of Object.values(MAJOR_KEYWORDS)) {
    for (const name of majorNames) {
      if (text.includes(name)) {
        // Add all sibling majors in the same keyword group
        for (const [keyword, names] of Object.entries(MAJOR_KEYWORDS)) {
          if (names.includes(name)) {
            result.majors.push(...names);
            break;
          }
        }
      }
    }
  }
  // Dedup majors
  result.majors = [...new Set(result.majors)];

  // Detect strategy hints
  if (/激进|冒险|冲一冲/.test(text)) result.keywords.push('aggressive');
  if (/保守|稳一稳|保险/.test(text)) result.keywords.push('conservative');
  if (/冲985|冲211|冲双一流|985.*冲|211.*冲/.test(text)) result.keywords.push('prefer_elite');

  return result;
}
