import { useState } from 'react';
import {
  Card, Tabs, Typography, Tag, Table, Timeline, Collapse,
  Alert, Row, Col, Space, Descriptions, Button,
} from 'antd';
import {
  SecurityScanOutlined, RocketOutlined, ReadOutlined,
  MedicineBoxOutlined, GlobalOutlined, FlagOutlined,
  ClockCircleOutlined, CheckCircleOutlined, WarningOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { FadeInView } from '../../components/AnimatedPresence';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const { Panel } = Collapse;

// --- Verified data from Gansu Education Examination Authority 2025 ---

const militarySchools = [
  { name: '国防科技大学', location: '长沙', level: '985', note: '军中清华，计算机/航天顶尖' },
  { name: '陆军工程大学', location: '南京', level: '重点军校', note: '陆军主战兵种指挥与技术' },
  { name: '陆军步兵学院', location: '南昌', level: '重点军校', note: '步兵指挥军官培养' },
  { name: '陆军装甲兵学院', location: '北京', level: '重点军校', note: '装甲部队指挥与技术' },
  { name: '陆军炮兵防空兵学院', location: '合肥', level: '重点军校', note: '炮兵/防空兵指挥' },
  { name: '陆军特种作战学院', location: '广州', level: '重点军校', note: '特种部队指挥人才培养' },
  { name: '陆军防化学院', location: '北京', level: '重点军校', note: '核生化防护专业' },
  { name: '海军工程大学', location: '武汉', level: '重点军校', note: '海军装备技术核心' },
  { name: '海军大连舰艇学院', location: '大连', level: '重点军校', note: '海军舰艇指挥军官' },
  { name: '海军潜艇学院', location: '青岛', level: '重点军校', note: '潜艇部队人才培养' },
  { name: '海军航空大学', location: '烟台', level: '重点军校', note: '海军航空兵人才培养' },
  { name: '空军工程大学', location: '西安', level: '重点军校', note: '空军装备技术核心' },
  { name: '空军航空大学', location: '长春', level: '重点军校', note: '飞行员培养主阵地' },
  { name: '空军预警学院', location: '武汉', level: '重点军校', note: '雷达预警指挥人才' },
  { name: '火箭军工程大学', location: '西安', level: '重点军校', note: '战略导弹部队核心' },
  { name: '航天工程大学', location: '北京', level: '重点军校', note: '航天测控与指挥' },
  { name: '信息工程大学', location: '郑州', level: '重点军校', note: '信息安全/密码学' },
  { name: '武警工程大学', location: '西安', level: '重点军校', note: '武警部队装备与技术' },
  { name: '武警警官学院', location: '成都', level: '重点军校', note: '武警内卫指挥' },
  { name: '武警特种警察学院', location: '北京', level: '重点军校', note: '反恐特战人才' },
  { name: '武警海警学院', location: '宁波', level: '重点军校', note: '海上维权执法' },
];

const policeSchools = [
  { name: '中国人民公安大学', location: '北京', level: '双一流', note: '公安系统最高学府' },
  { name: '中国人民警察大学', location: '廊坊', level: '公安部直属', note: '边防/消防/警卫转制' },
  { name: '中国刑事警察学院', location: '沈阳', level: '公安部直属', note: '刑事侦查/技术王牌' },
  { name: '郑州警察学院', location: '郑州', level: '公安部直属', note: '铁路公安为主' },
  { name: '南京警察学院', location: '南京', level: '公安部直属', note: '森林/食药环公安' },
  { name: '甘肃警察学院', location: '兰州', level: '省属本科', note: '甘肃公安系统主要来源' },
  { name: '新疆警察学院', location: '乌鲁木齐', level: '省属本科', note: '含维语方向定向' },
  { name: '西藏警官高等专科学校', location: '拉萨', level: '专科', note: '甘肃考生可报，专科提前批' },
];

const normalUniversities = [
  { name: '北京师范大学', location: '北京', level: '985', note: '师范类顶尖，公费师范生覆盖全国' },
  { name: '华东师范大学', location: '上海', level: '985', note: '面向中西部培养教师' },
  { name: '东北师范大学', location: '长春', level: '211', note: '东北地区教师培养重镇' },
  { name: '华中师范大学', location: '武汉', level: '211', note: '教育部直属，公费师范生规模大' },
  { name: '陕西师范大学', location: '西安', level: '211', note: '西北地区教师培养核心' },
  { name: '西南大学', location: '重庆', level: '211', note: '由原西南师范大学合并' },
];

const gansuProvincialNormal = [
  { name: '西北师范大学', location: '兰州', note: '甘肃省师范教育龙头' },
  { name: '天水师范学院', location: '天水', note: '陇东南地区教师来源' },
  { name: '陇东学院', location: '庆阳', note: '陇东地区教师培养' },
  { name: '河西学院', location: '张掖', note: '河西走廊教师培养' },
  { name: '甘肃民族师范学院', location: '合作', note: '民族地区双语教师' },
];

const earlyBatchSchedule = [
  { date: '6月16日-27日', event: '公安院校政治考察', type: 'action' },
  { date: '6月25日', event: '高考成绩公布', type: 'milestone' },
  { date: '6月26日-7月1日', event: '第一次志愿填报（含提前批）', type: 'action' },
  { date: '7月1日18:00', event: '公安院校入围资格线公布', type: 'milestone' },
  { date: '7月2日-5日', event: '公安院校面试/体检/体测（甘肃警察学院魏家庄校区）', type: 'action' },
  { date: '7月8日', event: '公安院校测评结果查询', type: 'milestone' },
  { date: '7月中旬', event: '提前批A段录取', type: 'milestone' },
  { date: '7月12日-13日', event: '提前批A段征集志愿', type: 'action' },
  { date: '7月下旬', event: '提前批B段（专项计划）录取', type: 'milestone' },
];

export default function EarlyBatchPage() {
  const navigate = useNavigate();

  const renderSchoolTable = (data, batch) => (
    <Table
      dataSource={data}
      rowKey="name"
      size="small"
      pagination={false}
      columns={[
        { title: '院校', dataIndex: 'name', key: 'name', width: 200 },
        { title: '所在地', dataIndex: 'location', key: 'location', width: 100 },
        {
          title: '层次', dataIndex: 'level', key: 'level', width: 100,
          render: v => {
            const color = v === '985' ? 'red' : v === '211' ? 'orange' : v === '双一流' ? 'purple' : v.includes('专科') ? 'default' : 'blue';
            return <Tag color={color}>{v}</Tag>;
          },
        },
        { title: '特点', dataIndex: 'note', key: 'note' },
      ]}
    />
  );

  return (
    <div>
      <FadeInView>
        <Typography.Title level={4}>提前批报考指南</Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          军校、警校、公费师范生……提前批不是"不报白不报"，了解清楚再决定
        </Typography.Text>
      </FadeInView>

      <Tabs
        defaultActiveKey="overview"
        items={[
          // ====== Overview ======
          {
            key: 'overview',
            label: <span><FlagOutlined /> 批次概览</span>,
            children: (
              <FadeInView>
                <Card style={{ borderRadius: 12, marginBottom: 16 }}>
                  <Typography.Title level={5}>甘肃省提前批录取批次设置（2025年）</Typography.Title>
                  <Table
                    dataSource={[
                      { segment: '本科提前批A段', choices: '30个院校专业组', mode: '平行志愿', content: '军校、公安（武警）类、消防救援、公费师范生、招飞、航海、小语种、综合评价录取等', note: '军校和警校只能选其一，不可混报' },
                      { segment: '本科提前批B段', choices: '1个院校专业组', mode: '顺序志愿', content: '国家专项计划、高校专项计划', note: '需提前通过资格审核' },
                      { segment: '本科提前批C段', choices: '1个院校专业组', mode: '顺序志愿', content: '地方专项计划、省属公费师范生、免费医学定向、定向西藏等', note: '' },
                      { segment: '高职(专科)提前批D段', choices: '1个院校专业组', mode: '顺序志愿', content: '公安（武警）类专科、定向培养军士、农村订单定向医学生专科', note: '西藏警官高等专科学校在此批次' },
                      { segment: '高职(专科)提前批E段', choices: '1个院校专业组', mode: '顺序志愿', content: '省属公费师范生（专科层次）', note: '' },
                    ]}
                    rowKey="segment"
                    size="small"
                    pagination={false}
                    columns={[
                      { title: '批次', dataIndex: 'segment', key: 'segment', width: 150 },
                      { title: '志愿数', dataIndex: 'choices', key: 'choices', width: 140 },
                      { title: '投档模式', dataIndex: 'mode', key: 'mode', width: 80 },
                      { title: '涵盖类型', dataIndex: 'content', key: 'content' },
                      { title: '注意事项', dataIndex: 'note', key: 'note', render: v => v ? <Typography.Text type="warning" style={{ fontSize: 12 }}>{v}</Typography.Text> : null },
                    ]}
                  />

                  <Alert
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                    message="提前批录取后，不能再参加普通批次录取"
                    description="如果你在提前批被录取，后续本科批C段志愿自动作废。如果你对常规批次的院校更感兴趣，请谨慎填报提前批。但如果提前批未被录取，不影响后续批次的正常录取。"
                  />
                </Card>

                <Card style={{ borderRadius: 12 }} title="提前批时间轴（2025年甘肃省）">
                  <Timeline
                    items={earlyBatchSchedule.map(item => ({
                      color: item.type === 'milestone' ? 'blue' : 'green',
                      children: (
                        <div>
                          <Typography.Text strong>{item.date}</Typography.Text>
                          <span style={{ marginLeft: 12 }}>{item.event}</span>
                        </div>
                      ),
                    }))}
                  />
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginTop: 12 }}
                    message="军校具体安排以甘肃省军区/省征兵办公告为准，公安院校以省公安厅公告为准。以上时间为2025年参考，每年可能微调。"
                  />
                </Card>
              </FadeInView>
            ),
          },

          // ====== Military Schools ======
          {
            key: 'military',
            label: <span><RocketOutlined /> 军校</span>,
            children: (
              <FadeInView>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={14}>
                    <Card style={{ borderRadius: 12 }} title="27所军队院校简介（在甘肃招生）">
                      {renderSchoolTable(militarySchools)}
                    </Card>
                  </Col>
                  <Col xs={24} lg={10}>
                    <Card style={{ borderRadius: 12, marginBottom: 16 }} title="军校报考基本条件">
                      <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="年龄">17-20周岁（截至当年8月31日），未婚</Descriptions.Item>
                        <Descriptions.Item label="学历">普通高中应届、往届毕业生</Descriptions.Item>
                        <Descriptions.Item label="身高">男性≥162cm，女性≥158cm（部分专业≥160cm）</Descriptions.Item>
                        <Descriptions.Item label="视力">裸眼视力≥4.5（部分专业≥4.9），矫正视力≥4.9，矫正度数≤600度</Descriptions.Item>
                        <Descriptions.Item label="政治考核">由县（市、区）人民武装部会同公安部门组织实施</Descriptions.Item>
                        <Descriptions.Item label="军检">包括面试、体格检查、心理检测，一般安排在7月初</Descriptions.Item>
                        <Descriptions.Item label="入学">取得军籍+学籍，免学费+住宿费，每月发放津贴</Descriptions.Item>
                        <Descriptions.Item label="毕业">授予少尉军衔，全军统一分配，一般需服役8年以上</Descriptions.Item>
                      </Descriptions>
                      <Alert
                        type="warning"
                        showIcon
                        style={{ marginTop: 12 }}
                        message={'军校是"入学即入伍"，毕业后由军队统一分配工作。如果不能接受分配地点的不确定性，需慎重考虑。'}
                      />
                    </Card>

                    <Card style={{ borderRadius: 12 }} title="选科要求">
                      <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="指挥类专业">首选物理，再选不限（一般）；部分专业要求政治</Descriptions.Item>
                        <Descriptions.Item label="非指挥类（技术类）">首选物理，再选化学（多数）；部分专业要求物+化</Descriptions.Item>
                        <Descriptions.Item label="文科/历史类">少数院校招历史类考生（国际关系、外语等方向）</Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
              </FadeInView>
            ),
          },

          // ====== Police Schools ======
          {
            key: 'police',
            label: <span><SecurityScanOutlined /> 警校</span>,
            children: (
              <FadeInView>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={14}>
                    <Card style={{ borderRadius: 12 }} title="8所在甘肃招生的公安院校">
                      {renderSchoolTable(policeSchools)}
                    </Card>
                  </Col>
                  <Col xs={24} lg={10}>
                    <Card style={{ borderRadius: 12, marginBottom: 16 }} title="警校报考流程（2025年甘肃）">
                      <Timeline
                        items={[
                          { color: 'blue', children: <div><Typography.Text strong>6月16日-27日</Typography.Text><br />登录甘肃省教育考试院平台填报信息并打印《政治考察表》，前往户籍所在地公安派出所接受考察</div> },
                          { color: 'blue', children: <div><Typography.Text strong>7月1日18:00</Typography.Text><br />省教育考试院和省公安厅公布入围名单（按不低于招生计划1:3比例）</div> },
                          { color: 'green', children: <div><Typography.Text strong>7月2日-5日</Typography.Text><br />面试、体检、体能测评（地点：甘肃警察学院魏家庄校区，皋兰县北辰南路1717号）<br />需携带：身份证、户口簿、准考证、毕业证、体检表、密封完好的《政治考察表》</div> },
                          { color: 'blue', children: <div><Typography.Text strong>7月8日</Typography.Text><br />登录甘肃省公安院校招生平台查询测评结果</div> },
                          { color: 'green', children: <div><Typography.Text strong>7月中旬</Typography.Text><br />录取</div> },
                        ]}
                      />
                    </Card>

                    <Card style={{ borderRadius: 12, marginBottom: 16 }} title="体能测评项目与标准">
                      <Table
                        dataSource={[
                          { item: '50米跑', male: '≤9.2秒', female: '≤10.4秒' },
                          { item: '立定跳远', male: '≥2.05米', female: '≥1.50米' },
                          { item: '1000米跑（男）/ 800米跑（女）', male: '≤4分35秒', female: '≤4分36秒' },
                          { item: '引体向上（男）/ 仰卧起坐（女）', male: '≥9次/分钟', female: '≥25次/分钟' },
                        ]}
                        rowKey="item"
                        size="small"
                        pagination={false}
                        columns={[
                          { title: '项目', dataIndex: 'item', key: 'item' },
                          { title: '男生标准', dataIndex: 'male', key: 'male' },
                          { title: '女生标准', dataIndex: 'female', key: 'female' },
                        ]}
                      />
                      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                        4项全部合格方可录取。以上为参考标准，具体以当年公告为准。
                      </Typography.Text>
                    </Card>

                    <Card style={{ borderRadius: 12 }} title="警校与军校的关键区别">
                      <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="身份">警校生不是军人，不入伍。毕业需通过公安联考进入公安系统。</Descriptions.Item>
                        <Descriptions.Item label="就业">公安院校公安专业毕业生参加面向公安院校的招警考试（入警率通常85%以上），通过后成为正式人民警察。</Descriptions.Item>
                        <Descriptions.Item label="费用">警校生需缴学费+住宿费（军校免学费）。</Descriptions.Item>
                        <Descriptions.Item label="管理">半军事化管理，比普通高校严格，但比军校灵活。</Descriptions.Item>
                        <Descriptions.Item label="选科">公安学类专业要求选考政治！公安技术类专业要求物理。</Descriptions.Item>
                      </Descriptions>
                      <Alert
                        type="info"
                        showIcon
                        style={{ marginTop: 12 }}
                        message="入警率是关键"
                        description="公安院校公安专业毕业生的入警率通常在85%-95%，就业稳定且待遇有保障。但需注意：公安专业≠一定能当警察，必须通过公安联考。"
                      />
                    </Card>
                  </Col>
                </Row>
              </FadeInView>
            ),
          },

          // ====== 公费师范生 ======
          {
            key: 'teacher',
            label: <span><ReadOutlined /> 公费师范生</span>,
            children: (
              <FadeInView>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={14}>
                    <Card style={{ borderRadius: 12 }} title="部属公费师范生（6所教育部直属师范院校）">
                      {renderSchoolTable(normalUniversities)}
                      <Descriptions column={1} size="small" bordered style={{ marginTop: 16 }}>
                        <Descriptions.Item label="待遇">免学费、免住宿费，每月发放生活补助（约600元/月）</Descriptions.Item>
                        <Descriptions.Item label="义务">毕业后回生源所在省（甘肃）中小学任教不少于6年</Descriptions.Item>
                        <Descriptions.Item label="编制">毕业后到岗即给予教师编制</Descriptions.Item>
                        <Descriptions.Item label="分配">一般在省内双向选择，可到市（州）及以上城市任教</Descriptions.Item>
                        <Descriptions.Item label="违约">须退还教育费用+违约金，记入诚信档案</Descriptions.Item>
                        <Descriptions.Item label="深造">服务期内可读非全日制教育硕士，不可脱产读全日制</Descriptions.Item>
                      </Descriptions>
                    </Card>

                    <Card style={{ borderRadius: 12, marginTop: 16 }} title="省属公费师范生（甘肃省属院校）">
                      {renderSchoolTable(gansuProvincialNormal.map(s => ({ ...s, level: '省属', location: s.location, note: s.note })))}
                      <Descriptions column={1} size="small" bordered style={{ marginTop: 16 }}>
                        <Descriptions.Item label="待遇">免学费+免住宿费</Descriptions.Item>
                        <Descriptions.Item label="义务">毕业后到定向县区中小学任教不少于6年</Descriptions.Item>
                        <Descriptions.Item label="分配">定向到具体县（市、区），一般在农村或基层学校</Descriptions.Item>
                        <Descriptions.Item label="优势">录取分数线相对较低，适合分数一般但想当老师的学生</Descriptions.Item>
                        <Descriptions.Item label="风险">定向地区可能偏远，6年服务期内不能调动到非定向地区</Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                  <Col xs={24} lg={10}>
                    <Card style={{ borderRadius: 12, marginBottom: 16 }} title="公费师范生：适合谁？">
                      <Collapse ghost>
                        <Panel header="适合报考的情况" key="1">
                          <ul>
                            <li>有教育热情，真正想当老师</li>
                            <li>家庭经济条件一般，希望减轻经济负担</li>
                            <li>追求稳定工作+编制</li>
                            <li>愿意在甘肃长期发展</li>
                            <li>分数能达到目标院校水平（部属师范通常需550+）</li>
                          </ul>
                        </Panel>
                        <Panel header="不适合报考的情况" key="2">
                          <ul>
                            <li>想考研深造（全日制）或出国留学</li>
                            <li>对教师职业没有热情</li>
                            <li>不想被6年服务期束缚</li>
                            <li>强烈想去省外发展</li>
                            <li>分数远超目标院校，有更好的普通批选择</li>
                          </ul>
                        </Panel>
                      </Collapse>
                    </Card>

                    <Card style={{ borderRadius: 12 }} title="部属 vs 省属 对比">
                      <Table
                        dataSource={[
                          { aspect: '承担院校', national: '6所部属师范大学', provincial: '省属师范院校' },
                          { aspect: '就业地点', national: '一般在市（州）及以上城市', provincial: '定向到具体县区，多在农村' },
                          { aspect: '编制', national: '有编制', provincial: '有编制' },
                          { aspect: '录取分数', national: '较高（一般550+）', provincial: '相对较低' },
                          { aspect: '深造机会', national: '可读非全日制硕士', provincial: '受限较多' },
                          { aspect: '违约成本', national: '退费+违约金+诚信档案', provincial: '退费+违约金' },
                        ]}
                        rowKey="aspect"
                        size="small"
                        pagination={false}
                        columns={[
                          { title: '对比维度', dataIndex: 'aspect', key: 'aspect', width: 100 },
                          { title: '部属公费师范生', dataIndex: 'national', key: 'national' },
                          { title: '省属公费师范生', dataIndex: 'provincial', key: 'provincial' },
                        ]}
                      />
                    </Card>
                  </Col>
                </Row>
              </FadeInView>
            ),
          },

          // ====== Other Types ======
          {
            key: 'other',
            label: <span><GlobalOutlined /> 其他特殊类型</span>,
            children: (
              <FadeInView>
                <Row gutter={[16, 16]}>
                  {[
                    {
                      icon: <RocketOutlined />,
                      title: '招飞（空军/海军/民航）',
                      content: '空军航空大学、海军航空大学及中国民航飞行学院等在提前批招收飞行员。需通过严格的体格检查（视力C字表≥0.8，身高165-185cm等）和心理选拔。一般在高三第一学期就开始报名选拔。',
                      warning: '体检标准极高，淘汰率超过90%。错过初选时间将无法补报。',
                    },
                    {
                      icon: <GlobalOutlined />,
                      title: '航海类',
                      content: '大连海事大学、上海海事大学、集美大学等招收航海技术、轮机工程等专业。毕业后主要从事远洋运输、港口管理等工作。对身体条件有要求（视力、身高、无色盲等）。',
                      warning: '航海类专业工作环境特殊，海上工作时间长，报考前需了解职业特点。',
                    },
                    {
                      icon: <ReadOutlined />,
                      title: '小语种/综合评价录取',
                      content: '部分高校（如北京外国语大学、上海外国语大学）在提前批通过综合评价方式录取小语种专业。需要参加学校组织的校考或面试，高考成绩+校考成绩综合排名录取。',
                      warning: '需提前关注各校综合评价招生简章，报名时间往往在4-5月。',
                    },
                    {
                      icon: <MedicineBoxOutlined />,
                      title: '免费医学定向',
                      content: '甘肃中医药大学等承担农村订单定向医学生免费培养。免学费+免住宿费+生活补助，毕业后到乡镇卫生院服务6年（含3年住院医师规范化培训）。',
                      warning: '服务地点为乡镇卫生院，服务期内不能考研（全日制）或调动。',
                    },
                  ].map(item => (
                    <Col xs={24} md={12} key={item.title}>
                      <Card style={{ borderRadius: 12, height: '100%' }}>
                        <Space align="start">
                          <span style={{ fontSize: 24 }}>{item.icon}</span>
                          <div>
                            <Typography.Title level={5}>{item.title}</Typography.Title>
                            <Typography.Paragraph>{item.content}</Typography.Paragraph>
                            {item.warning && (
                              <Alert type="warning" message={item.warning} showIcon style={{ fontSize: 12 }} />
                            )}
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </FadeInView>
            ),
          },

          // ====== FAQ ======
          {
            key: 'faq',
            label: <span><QuestionCircleOutlined /> 常见问题</span>,
            children: (
              <FadeInView>
                <Card style={{ borderRadius: 12 }}>
                  <Collapse>
                    <Panel header="提前批没被录取，会影响普通批吗？" key="1">
                      <Typography.Paragraph>
                        不会。提前批录取在普通批之前进行。如果你在提前批被投档但未被录取（退档），或根本没有填报提前批，不影响后续本科批C段的正常投档录取。
                      </Typography.Paragraph>
                      <Typography.Text type="warning">
                        但如果你在提前批被录取了，后续所有批次志愿自动作废。所以不要在提前批填报你并不想去的学校。
                      </Typography.Text>
                    </Panel>

                    <Panel header="军校和警校可以同时报吗？" key="2">
                      <Typography.Paragraph>
                        在甘肃省2025年的政策下，本科提前批A段实行平行志愿（30个院校专业组），军校和警校都在此段。从志愿填报角度看可以同时填报，但以下问题需要考虑：
                      </Typography.Paragraph>
                      <ul>
                        <li>军校的政治考核由武装部组织，警校的政治考察由公安局组织——流程不同，时间可能冲突</li>
                        <li>军校的军检和警校的体测时间可能重叠</li>
                        <li>两者的选拔标准和培养模式完全不同，建议选定一个方向集中准备</li>
                      </ul>
                    </Panel>

                    <Panel header="公费师范生毕业必须回甘肃吗？可以考研吗？" key="3">
                      <Typography.Paragraph>
                        部属公费师范生原则上回生源所在省（甘肃）任教，但可以在省内双向选择就业单位。省属公费师范生则定向到具体县区。
                      </Typography.Paragraph>
                      <Typography.Paragraph>
                        服务期内不能报考全日制研究生，但可以攻读非全日制教育硕士。服务期满后不再受限。
                      </Typography.Paragraph>
                      <Typography.Text type="secondary">
                        如果毕业后想直接读全日制研，不要选择公费师范生路径。
                      </Typography.Text>
                    </Panel>

                    <Panel header="专项计划和提前批是什么关系？" key="4">
                      <Typography.Paragraph>
                        国家专项和高校专项在本科提前批B段录取，地方专项在本科批C段录取。
                        你可以在提前批A段（军校/警校/公费师范生）、B段（国家专项/高校专项）、C段（地方专项/免费医学定向）都填报志愿，
                        但录取顺序是A段→B段→C段，一旦被前面批次录取，后面批次不再投档。
                      </Typography.Paragraph>
                    </Panel>

                    <Panel header="体检/体测/政审不通过怎么办？" key="5">
                      <Typography.Paragraph>
                        任何一项不合格，提前批的军校/警校志愿自动失效。但这不影响你在普通批次（本科批C段）的正常录取。
                        所以即使提前批走不通，也要认真填报普通批次志愿。
                      </Typography.Paragraph>
                    </Panel>
                  </Collapse>
                </Card>
              </FadeInView>
            ),
          },
        ]}
      />
    </div>
  );
}
