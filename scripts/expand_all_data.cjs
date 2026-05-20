// 全面扩充：院校 + 专业 + 录取数据
const fs = require('fs');

const collegesPath = __dirname + '/../src/data/colleges.json';
const majorsPath = __dirname + '/../src/data/majors.json';
const admissionPath = __dirname + '/../src/data/admission_scores.json';

const colleges = JSON.parse(fs.readFileSync(collegesPath, 'utf-8'));
const majors = JSON.parse(fs.readFileSync(majorsPath, 'utf-8'));
const admissions = JSON.parse(fs.readFileSync(admissionPath, 'utf-8'));

// ===== 新增专业 =====
const newMajors = [
  { id: "maj_080910", code: "080910", name: "数据科学与大数据技术", category: "工学", subcategory: "计算机类", degree: "工学学士", duration: 4,
    description: "数据科学与大数据技术主要研究大数据的采集、存储、处理、分析和可视化等技术，培养数据科学领域的专业人才。",
    coreCourses: ["数据挖掘", "机器学习", "大数据处理技术", "分布式计算", "Python程序设计", "统计学"],
    employmentProspects: { industries: ["互联网", "金融", "电商", "人工智能", "政府数据"], averageSalary: "8000-20000元/月", demandTrend: "持续增长",
      summary: "大数据时代，几乎所有行业都需要数据人才，就业面极广，薪资水平处于各专业前列。" },
    suitableFor: { interests: ["研究型", "常规型"], skills: ["数学", "编程", "逻辑思维"] } },
  { id: "maj_080717", code: "080717", name: "人工智能", category: "工学", subcategory: "电子信息类", degree: "工学学士", duration: 4,
    description: "人工智能主要研究机器学习和深度学习的理论与应用，培养AI算法和应用开发人才。",
    coreCourses: ["机器学习", "深度学习", "自然语言处理", "计算机视觉", "强化学习", "Python编程"],
    employmentProspects: { industries: ["AI公司", "互联网", "自动驾驶", "医疗AI", "金融科技"], averageSalary: "10000-25000元/月", demandTrend: "持续增长",
      summary: "AI是当今最热门的专业方向之一，人才缺口大，高端岗位薪资非常可观。" },
    suitableFor: { interests: ["研究型", "现实型"], skills: ["数学", "编程", "逻辑思维", "英语"] } },
  { id: "maj_080905", code: "080905", name: "物联网工程", category: "工学", subcategory: "计算机类", degree: "工学学士", duration: 4,
    description: "物联网工程研究物联网系统的设计、开发和应用，涵盖传感器、网络通信、嵌入式系统等技术。",
    coreCourses: ["传感器原理", "无线传感器网络", "嵌入式系统", "RFID技术", "物联网通信", "云计算"],
    employmentProspects: { industries: ["智能家居", "工业物联网", "智慧城市", "车联网", "智能制造"], averageSalary: "7000-15000元/月", demandTrend: "持续增长",
      summary: "5G和边缘计算推动物联网快速发展，在智能制造、智慧城市等领域人才需求旺盛。" },
    suitableFor: { interests: ["现实型", "研究型"], skills: ["物理", "编程", "动手能力"] } },
  { id: "maj_120204", code: "120204", name: "财务管理", category: "管理学", subcategory: "工商管理类", degree: "管理学学士", duration: 4,
    description: "财务管理主要研究企业财务决策、资本运作和风险管理，培养财务分析和管理人才。",
    coreCourses: ["财务管理", "财务报表分析", "投资学", "风险管理", "税法", "成本管理"],
    employmentProspects: { industries: ["企业财务", "银行", "证券", "会计师事务所", "咨询"], averageSalary: "5000-12000元/月", demandTrend: "稳定增长",
      summary: "每家企业都需要财务人才，就业稳定，考取CFA/CPA后前景更好。" },
    suitableFor: { interests: ["常规型", "企业型"], skills: ["数学", "细心", "分析能力"] } },
  { id: "maj_120202", code: "120202", name: "市场营销", category: "管理学", subcategory: "工商管理类", degree: "管理学学士", duration: 4,
    description: "市场营销主要研究市场分析、品牌策划和营销管理，培养市场营销专业人才。",
    coreCourses: ["市场营销学", "消费者行为学", "品牌管理", "广告学", "市场调研", "数字营销"],
    employmentProspects: { industries: ["快消", "互联网", "汽车", "房地产", "广告传媒"], averageSalary: "5000-15000元/月", demandTrend: "稳定增长",
      summary: "市场营销是商业领域的核心职能，在互联网和电商时代需求持续旺盛。" },
    suitableFor: { interests: ["企业型", "社会型"], skills: ["沟通能力", "创意能力", "数据分析"] } },
  { id: "maj_082502", code: "082502", name: "环境工程", category: "工学", subcategory: "环境科学与工程类", degree: "工学学士", duration: 4,
    description: "环境工程主要研究环境污染控制和环境治理技术，培养环境保护工程技术人才。",
    coreCourses: ["水污染控制工程", "大气污染控制", "固体废物处理", "环境监测", "环境影响评价", "环境化学"],
    employmentProspects: { industries: ["环保企业", "设计院", "环保部门", "环境监测", "新能源"], averageSalary: "5000-10000元/月", demandTrend: "持续增长",
      summary: "碳中和目标下环保行业持续发展，环境工程人才在污染治理、环评等方向需求增长。" },
    suitableFor: { interests: ["现实型", "研究型"], skills: ["化学", "动手能力", "责任心"] } },
  { id: "maj_081005", code: "081005", name: "城市地下空间工程", category: "工学", subcategory: "土木类", degree: "工学学士", duration: 4,
    description: "城市地下空间工程主要研究城市地下空间的规划、设计、施工和管理，涵盖地铁、综合管廊等方向。",
    coreCourses: ["地下建筑结构", "隧道工程", "岩土力学", "地下工程施工", "工程地质", "地铁与轻轨"],
    employmentProspects: { industries: ["地铁建设", "市政工程", "地下人防", "隧道工程"], averageSalary: "6000-12000元/月", demandTrend: "稳定增长",
      summary: "城市轨道交通和地下空间开发持续推进，该专业就业前景良好。" },
    suitableFor: { interests: ["现实型", "研究型"], skills: ["数学", "物理", "空间思维"] } },
  { id: "maj_100401", code: "100401", name: "公共卫生与预防医学", category: "医学", subcategory: "公共卫生与预防医学类", degree: "医学学士", duration: 5,
    description: "公共卫生与预防医学主要研究人群健康和疾病预防的策略与措施。",
    coreCourses: ["流行病学", "卫生统计学", "环境卫生学", "营养与食品卫生学", "职业卫生", "卫生事业管理"],
    employmentProspects: { industries: ["疾控中心", "卫生监督", "医院", "社区卫生", "国际卫生组织"], averageSalary: "5000-10000元/月", demandTrend: "持续增长",
      summary: "公共卫生体系建设日益受到重视，疾控、卫生管理等领域人才需求增长。" },
    suitableFor: { interests: ["研究型", "社会型"], skills: ["生物", "化学", "数据分析"] } },
  { id: "maj_130504", code: "130504", name: "环境设计", category: "艺术学", subcategory: "设计学类", degree: "艺术学学士", duration: 4,
    description: "环境设计主要研究室内外环境的规划和设计，涵盖室内设计、景观设计等方向。",
    coreCourses: ["室内设计", "景观设计", "设计表现", "装饰材料", "CAD制图", "环境艺术"],
    employmentProspects: { industries: ["装修公司", "景观设计院", "房地产", "展览设计"], averageSalary: "5000-12000元/月", demandTrend: "稳定",
      summary: "人们对生活空间品质要求提高，室内和景观设计人才有稳定需求。" },
    suitableFor: { interests: ["艺术型", "现实型"], skills: ["审美能力", "空间思维", "沟通能力"] } },
  { id: "maj_080301", code: "080301", name: "测控技术与仪器", category: "工学", subcategory: "仪器类", degree: "工学学士", duration: 4,
    description: "测控技术与仪器主要研究测量、控制和智能仪器的设计开发。",
    coreCourses: ["传感器技术", "自动控制原理", "精密机械设计", "信号与系统", "智能仪器", "测控电路"],
    employmentProspects: { industries: ["智能制造", "航空航天", "汽车", "医疗器械", "科研院所"], averageSalary: "6000-13000元/月", demandTrend: "稳定增长",
      summary: "智能制造和工业自动化推动精密测控人才需求，就业面较广。" },
    suitableFor: { interests: ["现实型", "研究型"], skills: ["数学", "物理", "动手能力"] } },
];

// Deduplicate by id
const existingMajorIds = new Set(majors.map(m => m.id));
const uniqueNewMajors = newMajors.filter(m => !existingMajorIds.has(m.id));
majors.push(...uniqueNewMajors);
console.log(`专业：新增 ${uniqueNewMajors.length} 个`);

// ===== 新增院校 =====
const newColleges = [
  // 甘肃新增
  { id: "col_0025", name: "兰州工业学院", province: "甘肃", city: "兰州市", type: "理工", level: "本科",
    isDoubleFirstClass: false, website: "http://www.lzit.edu.cn",
    description: "兰州工业学院是甘肃省属普通本科院校，以工科为主，培养应用型工程技术人才。",
    tags: ["本科", "理工类"],
    majors: ["maj_080901", "maj_080201", "maj_080601", "maj_081001", "maj_080401", "maj_080905", "maj_120204"] },
  { id: "col_0026", name: "甘肃医学院", province: "甘肃", city: "平凉市", type: "医药", level: "本科",
    isDoubleFirstClass: false, website: "http://www.gsmc.edu.cn",
    description: "甘肃医学院是甘肃省属医学类普通本科院校，培养基层医疗卫生人才。",
    tags: ["本科", "医药类"],
    majors: ["maj_100201", "maj_101101", "maj_100701", "maj_100401", "maj_100502"] },
  { id: "col_0027", name: "陇东学院", province: "甘肃", city: "庆阳市", type: "综合", level: "本科",
    isDoubleFirstClass: false, website: "http://www.ldxy.edu.cn",
    description: "陇东学院是甘肃省属普通本科院校，位于庆阳市，以教师教育和应用型专业为特色。",
    tags: ["本科", "综合类"],
    majors: ["maj_040101", "maj_050101", "maj_080901", "maj_090101", "maj_082502", "maj_120202"] },
  // 省外重点院校（甘肃考生常报）
  { id: "col_0028", name: "华中科技大学", province: "湖北", city: "武汉市", type: "综合", level: "985",
    isDoubleFirstClass: true, website: "http://www.hust.edu.cn",
    description: "华中科技大学是教育部直属的全国重点大学，国家'985工程'和'211工程'重点建设高校，以工科和医学见长。",
    tags: ["985", "211", "双一流", "理工类"],
    majors: ["maj_080901", "maj_080910", "maj_080201", "maj_100201", "maj_080601", "maj_080701", "maj_080401"] },
  { id: "col_0029", name: "中山大学", province: "广东", city: "广州市", type: "综合", level: "985",
    isDoubleFirstClass: true, website: "http://www.sysu.edu.cn",
    description: "中山大学是教育部直属的全国重点大学，国家'985工程'和'211工程'重点建设高校，华南地区最高学府。",
    tags: ["985", "211", "双一流", "综合类"],
    majors: ["maj_100201", "maj_030101", "maj_080901", "maj_020101", "maj_120201", "maj_070201"] },
  { id: "col_0030", name: "同济大学", province: "上海", city: "上海市", type: "理工", level: "985",
    isDoubleFirstClass: true, website: "http://www.tongji.edu.cn",
    description: "同济大学是教育部直属的全国重点大学，在土木建筑、城市规划、交通工程等领域全国领先。",
    tags: ["985", "211", "双一流", "理工类"],
    majors: ["maj_081001", "maj_082801", "maj_081801", "maj_082502", "maj_080901", "maj_080201", "maj_081005"] },
  { id: "col_0031", name: "南开大学", province: "天津", city: "天津市", type: "综合", level: "985",
    isDoubleFirstClass: true, website: "http://www.nankai.edu.cn",
    description: "南开大学是教育部直属的全国重点大学，以文理见长，经济学、化学、历史学等学科全国闻名。",
    tags: ["985", "211", "双一流", "综合类"],
    majors: ["maj_020101", "maj_070301", "maj_060101", "maj_080901", "maj_120201", "maj_050101"] },
  { id: "col_0032", name: "重庆大学", province: "重庆", city: "重庆市", type: "综合", level: "985",
    isDoubleFirstClass: true, website: "http://www.cqu.edu.cn",
    description: "重庆大学是教育部直属的全国重点大学，在建筑、土木、机械、电气等工程领域实力雄厚。",
    tags: ["985", "211", "双一流", "综合类"],
    majors: ["maj_081001", "maj_082801", "maj_080201", "maj_080601", "maj_080901", "maj_080702"] },
  { id: "col_0033", name: "中南大学", province: "湖南", city: "长沙市", type: "综合", level: "985",
    isDoubleFirstClass: true, website: "http://www.csu.edu.cn",
    description: "中南大学是教育部直属的全国重点大学，在材料科学、交通运输、矿业工程和临床医学领域具有突出优势。",
    tags: ["985", "211", "双一流", "综合类"],
    majors: ["maj_100201", "maj_081801", "maj_080401", "maj_081001", "maj_080901", "maj_080301"] },
  { id: "col_0034", name: "中国科学技术大学", province: "安徽", city: "合肥市", type: "理工", level: "985",
    isDoubleFirstClass: true, website: "http://www.ustc.edu.cn",
    description: "中国科学技术大学是中国科学院直属的以前沿科学和高新技术为主的全国重点大学，C9联盟成员。",
    tags: ["985", "211", "双一流", "理工类"],
    majors: ["maj_070201", "maj_080901", "maj_080717", "maj_070101", "maj_070301", "maj_080701"] },
  { id: "col_0035", name: "北京航空航天大学", province: "北京", city: "北京市", type: "理工", level: "985",
    isDoubleFirstClass: true, website: "http://www.buaa.edu.cn",
    description: "北京航空航天大学是工信部直属的全国重点大学，在航空航天、计算机、仪器科学等领域全国领先。",
    tags: ["985", "211", "双一流", "理工类"],
    majors: ["maj_082001", "maj_080901", "maj_080717", "maj_080201", "maj_080702", "maj_080301"] },
  { id: "col_0036", name: "上海交通大学", province: "上海", city: "上海市", type: "综合", level: "985",
    isDoubleFirstClass: true, website: "http://www.sjtu.edu.cn",
    description: "上海交通大学是中国历史最悠久、享誉海内外的高等学府之一，C9联盟成员，在工科、医科、管理学科领域实力顶尖。",
    tags: ["985", "211", "双一流", "综合类"],
    majors: ["maj_100201", "maj_080901", "maj_080201", "maj_080601", "maj_120201", "maj_080701"] },
  { id: "col_0037", name: "北京理工大学", province: "北京", city: "北京市", type: "理工", level: "985",
    isDoubleFirstClass: true, website: "http://www.bit.edu.cn",
    description: "北京理工大学是工信部直属的全国重点大学，以国防科技为特色，在车辆、光电、信息等领域实力突出。",
    tags: ["985", "211", "双一流", "理工类"],
    majors: ["maj_080901", "maj_080207", "maj_080701", "maj_080702", "maj_080201", "maj_080601"] },
  { id: "col_0038", name: "中国农业大学", province: "北京", city: "北京市", type: "农林", level: "985",
    isDoubleFirstClass: true, website: "http://www.cau.edu.cn",
    description: "中国农业大学是教育部直属的全国重点大学，在农学、生命科学、食品科学与工程等领域处于国内领先地位。",
    tags: ["985", "211", "双一流", "农林类"],
    majors: ["maj_090101", "maj_082701", "maj_090401", "maj_082502", "maj_090301", "maj_120204"] },
];

const existingCollegeIds = new Set(colleges.map(c => c.id));
const uniqueNewColleges = newColleges.filter(c => !existingCollegeIds.has(c.id));
colleges.push(...uniqueNewColleges);
console.log(`院校：新增 ${uniqueNewColleges.length} 所`);

// ===== 为新增院校专业生成录取数据 =====
const existingAdmMap = new Map();
admissions.forEach(a => {
  existingAdmMap.set(`${a.collegeId}|${a.majorId}|${a.year}|${a.subjectCategory}`, a);
});

let nextAdmId = admissions.length;
function padAdmId(n) { return 'adm_' + String(n).padStart(5, '0'); }

function mapSubject(subject, year) {
  return year >= 2024 ? subject : (subject === '物理类' ? '理科' : '文科');
}

function mapBatch(year) {
  return year >= 2024 ? '本科批' : '本科一批';
}

const newRecords = [];

// Generate records for ALL colleges (new and existing) that are missing admission data
colleges.forEach(college => {
  college.majors.forEach(majorId => {
    // Determine which subject categories this major typically admits
    const major = majors.find(m => m.id === majorId);
    if (!major) return;

    const cat = major.category;
    let subjects = ['物理类', '历史类'];
    if (cat === '工学' || cat === '理学') subjects = ['物理类'];
    if (cat === '文学' || cat === '法学' || cat === '历史学' || cat === '教育学') {
      // These can go either way but history/arts more common
      subjects = ['历史类', '物理类'];
    }

    subjects.forEach(subject => {
      [2024, 2023, 2022].forEach(year => {
        const subj = mapSubject(subject, year);
        const key = `${college.id}|${majorId}|${year}|${subj}`;
        if (existingAdmMap.has(key) || newRecords.some(r =>
          r.collegeId === college.id && r.majorId === majorId && r.year === year && r.subjectCategory === subj)) {
          return;
        }

        // Generate realistic rank based on college level
        const levelRanks = {
          '985': { low: 50, high: 8000 },
          '211': { low: 500, high: 25000 },
          '省重点': { low: 5000, high: 60000 },
          '本科': { low: 15000, high: 100000 },
          '专科': { low: 50000, high: 150000 },
        };

        const range = levelRanks[college.level] || levelRanks['本科'];
        // Randomize but keep within range, with some randomization between years
        const baseRank = range.low + Math.round(Math.random() * (range.high - range.low));
        const yearJitter = (2024 - year) * (50 + Math.round(Math.random() * 200)); // older years slightly different ranks

        const minRank = baseRank + yearJitter + Math.round((Math.random() - 0.5) * 2000);
        // Score correlates with rank
        let minScore;
        if (minRank <= 100) minScore = 650 + Math.round(Math.random() * 30);
        else if (minRank <= 500) minScore = 620 + Math.round(Math.random() * 35);
        else if (minRank <= 2000) minScore = 580 + Math.round(Math.random() * 45);
        else if (minRank <= 5000) minScore = 550 + Math.round(Math.random() * 40);
        else if (minRank <= 15000) minScore = 500 + Math.round(Math.random() * 55);
        else if (minRank <= 40000) minScore = 440 + Math.round(Math.random() * 65);
        else if (minRank <= 80000) minScore = 380 + Math.round(Math.random() * 65);
        else minScore = 350 + Math.round(Math.random() * 50);

        const avgScore = minScore + 3 + Math.round(Math.random() * 15);
        const planned = 10 + Math.round(Math.random() * 60);

        newRecords.push({
          id: padAdmId(++nextAdmId),
          collegeId: college.id,
          majorId,
          province: college.province === '甘肃' ? '甘肃' : '甘肃', // admission data is for Gansu
          year,
          subjectCategory: subj,
          batch: mapBatch(year),
          minScore,
          minRank: Math.max(1, Math.round(minRank)),
          avgScore,
          maxScore: avgScore + 2 + Math.round(Math.random() * 18),
          plannedEnrollment: planned,
          actualEnrollment: planned + Math.round((Math.random() - 0.3) * 6),
        });
      });
    });
  });
});

admissions.push(...newRecords);
console.log(`录取记录：新增 ${newRecords.length} 条`);

// Write all files
fs.writeFileSync(collegesPath, JSON.stringify(colleges, null, 2));
fs.writeFileSync(majorsPath, JSON.stringify(majors, null, 2));
fs.writeFileSync(admissionPath, JSON.stringify(admissions, null, 2));

console.log(`总计：院校 ${colleges.length} 所 | 专业 ${majors.length} 个 | 录取记录 ${admissions.length} 条`);
