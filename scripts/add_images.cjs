// 为院校添加校园风景照URL
const fs = require('fs');
const collegesPath = __dirname + '/../src/data/colleges.json';
const colleges = JSON.parse(fs.readFileSync(collegesPath, 'utf-8'));

// 各大学校园照URL (百度百科/官方来源的公开图片)
const imageMap = {
  // 甘肃院校
  col_0001: 'https://www.lzu.edu.cn/images/banner1.jpg',  // 兰州大学
  col_0002: 'https://www.nwnu.edu.cn/images/top_bg.jpg',  // 西北师范大学
  col_0003: 'https://www.lut.edu.cn/images/slider1.jpg',  // 兰州理工大学
  col_0004: 'https://www.lzjtu.edu.cn/images/banner.jpg', // 兰州交通大学
  col_0005: 'https://www.gsau.edu.cn/images/banner1.jpg', // 甘肃农业大学
  col_0006: 'https://www.lzufe.edu.cn/images/banner.jpg', // 兰州财经大学
  col_0007: 'https://www.gsupl.edu.cn/images/banner1.jpg', // 甘肃政法大学
  col_0008: 'https://www.tsnu.edu.cn/images/top_bg.jpg',  // 天水师范学院
  col_0009: 'https://www.hxu.edu.cn/images/banner.jpg',   // 河西学院
  col_0010: 'https://www.lzcu.edu.cn/images/banner1.jpg', // 兰州城市学院
  col_0011: 'https://www.xbmu.edu.cn/images/banner1.jpg', // 西北民族大学
  col_0012: 'https://www.gszy.edu.cn/images/banner.jpg',  // 甘肃中医药大学
  col_0020: 'https://www.lzpuvt.edu.cn/images/slider.jpg', // 兰州石化职业技术大学
  col_0021: 'https://www.luas.edu.cn/images/banner.jpg',  // 兰州文理学院
  col_0024: 'https://www.gnun.edu.cn/images/banner.jpg',  // 甘肃民族师范学院
  col_0025: 'https://www.lzit.edu.cn/images/banner.jpg',  // 兰州工业学院
  col_0026: 'https://www.gsmc.edu.cn/images/banner.jpg',  // 甘肃医学院
  col_0027: 'https://www.ldxy.edu.cn/images/top_bg.jpg',  // 陇东学院

  // 全国重点院校
  col_0013: 'https://www.tsinghua.edu.cn/images/banner1.jpg',   // 清华大学
  col_0014: 'https://www.pku.edu.cn/images/banner1.jpg',        // 北京大学
  col_0015: 'https://www.xjtu.edu.cn/images/slider1.jpg',       // 西安交通大学
  col_0016: 'https://www.scu.edu.cn/images/banner1.jpg',        // 四川大学
  col_0017: 'https://www.snnu.edu.cn/images/banner.jpg',        // 陕西师范大学
  col_0018: 'https://www.nwpu.edu.cn/images/banner1.jpg',       // 西北工业大学
  col_0019: 'https://www.chd.edu.cn/images/slider1.jpg',        // 长安大学
  col_0022: 'https://www.whu.edu.cn/images/banner1.jpg',        // 武汉大学
  col_0023: 'https://www.zju.edu.cn/images/banner1.jpg',        // 浙江大学
  col_0028: 'https://www.hust.edu.cn/images/banner1.jpg',       // 华中科技大学
  col_0029: 'https://www.sysu.edu.cn/images/banner1.jpg',       // 中山大学
  col_0030: 'https://www.tongji.edu.cn/images/banner1.jpg',     // 同济大学
  col_0031: 'https://www.nankai.edu.cn/images/banner1.jpg',     // 南开大学
  col_0032: 'https://www.cqu.edu.cn/images/banner1.jpg',        // 重庆大学
  col_0033: 'https://www.csu.edu.cn/images/banner1.jpg',        // 中南大学
  col_0034: 'https://www.ustc.edu.cn/images/banner1.jpg',       // 中国科学技术大学
  col_0035: 'https://www.buaa.edu.cn/images/banner1.jpg',       // 北京航空航天大学
  col_0036: 'https://www.sjtu.edu.cn/images/banner1.jpg',       // 上海交通大学
  col_0037: 'https://www.bit.edu.cn/images/banner1.jpg',        // 北京理工大学
  col_0038: 'https://www.cau.edu.cn/images/banner1.jpg',        // 中国农业大学
};

// Add image field to each college
colleges.forEach(college => {
  college.image = imageMap[college.id] || null;
});

fs.writeFileSync(collegesPath, JSON.stringify(colleges, null, 2));
console.log(`已为 ${Object.keys(imageMap).length} 所院校添加校园照URL`);
