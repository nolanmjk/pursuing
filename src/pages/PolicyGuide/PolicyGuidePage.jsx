import { useState } from 'react';
import { Card, Typography, Table, Tabs, Timeline, Alert, Tag, Row, Col, Statistic, Collapse } from 'antd';
import {
  ReadOutlined, RiseOutlined, SafetyOutlined, ProfileOutlined,
  BulbOutlined, WarningOutlined, CheckCircleOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FadeInView, CountUp } from '../../components/AnimatedPresence';
import cutoffLines from '../../data/cutoff_lines.json';

export default function PolicyGuidePage() {
  const [selectedSubject, setSelectedSubject] = useState('物理类');

  // Prepare cutoff line chart data — derived dynamically from available data
  const availableYears = [...new Set(cutoffLines.map(c => c.year))].sort((a, b) => a - b);
  const latestYear = availableYears[availableYears.length - 1];

  const chartData = (() => {
    return availableYears.map(year => {
      const entry = cutoffLines.find(c => c.year === year);
      const row = { year: `${year}年` };
      if (entry) {
        entry.batches.forEach(b => {
          const key = `${b.name}-${b.subject}`;
          row[key] = b.score;
        });
      }
      return row;
    });
  })();

  const subjectCutoffKeys = selectedSubject === '物理类'
    ? ['本科批-物理类', '特殊类型招生-物理类']
    : ['本科批-历史类', '特殊类型招生-历史类'];

  const lineColors = ['#ff4d4f', '#fa8c16'];

  // Dynamic Y-axis domain based on actual data range
  const allScores = chartData.flatMap(d => subjectCutoffKeys.map(k => d[k]).filter(Boolean));
  const yMin = allScores.length > 0 ? Math.max(0, Math.min(...allScores) - 30) : 0;
  const yMax = allScores.length > 0 ? Math.min(750, Math.max(...allScores) + 30) : 750;

  // Current cutoff data — uses latest available year
  const currentYearData = cutoffLines.find(c => c.year === latestYear);
  const currentCutoffs = currentYearData
    ? currentYearData.batches.filter(b => b.subject === selectedSubject || b.subject === (selectedSubject === '物理类' ? '理科' : '文科'))
    : [];

  const tabItems = [
    {
      key: 'basics',
      label: <span><ReadOutlined /> 填报规则</span>,
      children: (
        <div>
          <Typography.Title level={5}>甘肃省高考志愿填报基本规则</Typography.Title>

          <Collapse style={{ marginTop: 16, background: 'rgba(255,255,255,0.02)' }}
            items={[
              {
                key: '1',
                label: <span style={{ fontWeight: 500 }}>新高考模式：3+1+2</span>,
                children: (
                  <div style={{ color: '#8890a8', lineHeight: 2 }}>
                    <p>甘肃省自<strong style={{ color: '#fff' }}>2024年起</strong>实行新高考"3+1+2"模式：</p>
                    <p><strong style={{ color: '#fff' }}>"3"</strong> — 语文、数学、外语（全国统一命题），每科150分</p>
                    <p><strong style={{ color: '#fff' }}>"1"</strong> — 物理或历史中选择1门（省级命题），100分，原始分计入</p>
                    <p><strong style={{ color: '#fff' }}>"2"</strong> — 化学、生物、地理、政治中选择2门（省级命题），每科100分，等级赋分计入</p>
                    <p>总分 <strong style={{ color: '#327de1' }}>750分</strong></p>
                  </div>
                ),
              },
              {
                key: '2',
                label: <span style={{ fontWeight: 500 }}>平行志愿投档规则</span>,
                children: (
                  <div style={{ color: '#8890a8', lineHeight: 2 }}>
                    <p><strong style={{ color: '#ff4d4f' }}>核心原则：分数优先、遵循志愿、一轮投档</strong></p>
                    <p>1. <strong style={{ color: '#fff' }}>分数优先</strong>：所有考生按分数（位次）从高到低排序，高分考生优先投档</p>
                    <p>2. <strong style={{ color: '#fff' }}>遵循志愿</strong>：轮到某考生时，按其填报的志愿顺序依次检索，第一个符合条件的志愿即投档</p>
                    <p>3. <strong style={{ color: '#fff' }}>一轮投档</strong>：每位考生只有一次投档机会，一旦投档成功，后续志愿全部失效。如果被退档，只能等征集志愿或下一批次</p>
                    <Alert
                      type="warning"
                      showIcon
                      style={{ marginTop: 12 }}
                      message="关键提醒：退档后不能参加本批次后续志愿投档！填志愿时必须确认自己满足院校的所有录取条件（体检、单科成绩等）"
                    />
                  </div>
                ),
              },
              {
                key: '3',
                label: <span style={{ fontWeight: 500 }}>批次设置与志愿数量</span>,
                children: (
                  <Table
                    dataSource={[
                      { batch: '本科批', choices: 45, majorsPer: 6, note: '所有本科院校在此批次招生' },
                      { batch: '高职(专科)批', choices: 45, majorsPer: 6, note: '专科院校招生' },
                      { batch: '提前批A段', choices: 1, majorsPer: 6, note: '军校、公安、公费师范生等' },
                      { batch: '提前批B段', choices: 1, majorsPer: 6, note: '国家专项计划' },
                      { batch: '提前批C段', choices: 1, majorsPer: 6, note: '地方专项计划' },
                    ]}
                    columns={[
                      { title: '批次', dataIndex: 'batch', key: 'batch', width: 150 },
                      { title: '志愿数', dataIndex: 'choices', key: 'choices', width: 80 },
                      { title: '每志愿专业数', dataIndex: 'majorsPer', key: 'majorsPer', width: 110 },
                      { title: '说明', dataIndex: 'note', key: 'note' },
                    ]}
                    pagination={false}
                    size="small"
                    rowKey="batch"
                  />
                ),
              },
              {
                key: '4',
                label: <span style={{ fontWeight: 500 }}>院校专业组投档方式</span>,
                children: (
                  <div style={{ color: '#8890a8', lineHeight: 2 }}>
                    <p>甘肃省采用<strong style={{ color: '#fff' }}>"院校专业组"</strong>方式投档：</p>
                    <p>• 一所院校可设置多个"院校专业组"（如"物理+化学组"、"物理+不限组"）</p>
                    <p>• 每个"院校专业组"就是一个独立的志愿单位</p>
                    <p>• 同一院校的不同专业组，分数线可以不同</p>
                    <p>• 考生在填报时选择的是"某大学的某个专业组"，然后在组内选专业</p>
                  </div>
                ),
              },
            ]} />
        </div>
      ),
    },
    {
      key: 'cutoff',
      label: <span><RiseOutlined /> 省控线</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#8890a8' }}>科类：</span>
            {['物理类', '历史类'].map(s => (
              <Tag key={s} color={selectedSubject === s ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedSubject(s)}>
                {s}
              </Tag>
            ))}
          </div>

          {/* Current year stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {currentCutoffs.map((b, i) => (
              <Col xs={12} sm={8} md={6} key={i}>
                <FadeInView delay={i * 0.08}>
                  <div style={{
                    borderRadius: 10, padding: '16px 20px',
                    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                    borderLeft: `3px solid ${b.name.includes('特殊') ? '#fa8c16' : b.name.includes('高职') ? '#999' : '#1677ff'}`,
                  }}>
                    <div style={{ fontSize: 12, color: '#556', marginBottom: 4 }}>{latestYear}年 · {b.name}</div>
                    <Statistic value={b.score}
                      formatter={v => <CountUp value={v} suffix="分" style={{ fontSize: 28, color: '#fff', fontWeight: 700 }} />} />
                  </div>
                </FadeInView>
              </Col>
            ))}
          </Row>

          {/* Trend chart */}
          <Card style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            title="历年省控线趋势">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="year" stroke="#556" />
                <YAxis stroke="#556" domain={[yMin, yMax]} />
                <Tooltip contentStyle={{ background: '#141824', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                <Legend />
                {subjectCutoffKeys.slice(0, 4).map((key, i) => {
                  if (!chartData.some(d => d[key] !== undefined)) return null;
                  const label = key.split('-')[0];
                  return <Line key={key} type="monotone" dataKey={key} name={label}
                    stroke={lineColors[i]} strokeWidth={2} dot={{ r: 4 }} connectNulls />;
                })}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Historical table */}
          <Card style={{ marginTop: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            title="历年省控线一览表">
            <Table
              dataSource={cutoffLines}
              rowKey="year"
              pagination={false}
              size="small"
              columns={[
                { title: '年份', dataIndex: 'year', width: 60 },
                ...selectedSubject === '物理类'
                  ? [
                      { title: '本科批(物理)', render: (_, r) => r.batches.find(b => b.subject === '物理类' && b.name === '本科批')?.score || '-' },
                      { title: '特殊类型(物理)', render: (_, r) => r.batches.find(b => b.subject === '物理类' && b.name === '特殊类型招生')?.score || '-' },
                    ]
                  : [
                      { title: '本科批(历史)', render: (_, r) => r.batches.find(b => b.subject === '历史类' && b.name === '本科批')?.score || '-' },
                      { title: '特殊类型(历史)', render: (_, r) => r.batches.find(b => b.subject === '历史类' && b.name === '特殊类型招生')?.score || '-' },
                    ],
                { title: '高职(专科)', render: (_, r) => r.batches.find(b => b.name === '高职(专科)批')?.score || '-' },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'tips',
      label: <span><BulbOutlined /> 填报策略</span>,
      children: (
        <div>
          <Typography.Title level={5}>冲稳保实战策略</Typography.Title>

          <Timeline style={{ marginTop: 24 }}
            items={[
              {
                color: 'red',
                children: (
                  <div>
                    <Typography.Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>冲刺（前20-30%）</Typography.Text>
                    <ul style={{ color: '#8890a8', marginTop: 8, lineHeight: 2 }}>
                      <li>选择往年录取位次<strong style={{ color: '#fff' }}>高于或接近</strong>你位次的院校</li>
                      <li>适合冲击名校或热门专业，博"大小年"机会</li>
                      <li>每个冲刺志愿应该是你"跳一跳够得到"的</li>
                      <li>不推荐超过总数1/3，避免全冲滑档</li>
                    </ul>
                  </div>
                ),
              },
              {
                color: 'orange',
                children: (
                  <div>
                    <Typography.Text strong style={{ color: '#fa8c16', fontSize: 16 }}>稳妥（中间40-50%）</Typography.Text>
                    <ul style={{ color: '#8890a8', marginTop: 8, lineHeight: 2 }}>
                      <li>选择往年录取位次<strong style={{ color: '#fff' }}>与你相近</strong>的院校</li>
                      <li>这是你最可能被录取的区间，要认真挑选</li>
                      <li>院校和专业都要满意，因为大概率会去</li>
                    </ul>
                  </div>
                ),
              },
              {
                color: 'green',
                children: (
                  <div>
                    <Typography.Text strong style={{ color: '#52c41a', fontSize: 16 }}>保底（后20-30%）</Typography.Text>
                    <ul style={{ color: '#8890a8', marginTop: 8, lineHeight: 2 }}>
                      <li>选择往年录取位次<strong style={{ color: '#fff' }}>明显低于</strong>你位次的院校（至少低30%）</li>
                      <li>确保即使发挥失常也能被录取</li>
                      <li>最后一个志愿（铁底）位次至少低50%，确保"有学上"</li>
                      <li><strong style={{ color: '#ff4d4f' }}>不能假保底！</strong>位次差不多的学校不能当保底</li>
                    </ul>
                  </div>
                ),
              },
            ]} />
        </div>
      ),
    },
    {
      key: 'remedy',
      label: <span><SafetyOutlined /> 征集志愿</span>,
      children: (
        <div>
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message="什么是征集志愿？"
            description={'当某批次录取结束后，部分院校没有完成招生计划（有剩余名额），省教育考试院会公布这些空缺计划，组织未被录取的考生重新填报志愿。这是一次“补录”机会。'}
            style={{ marginBottom: 16 }}
          />

          <Collapse
            style={{ background: 'rgba(255,255,255,0.02)' }}
            items={[
              {
                key: '1',
                label: '什么时候有征集志愿？',
                children: (
                  <div style={{ color: '#8890a8', lineHeight: 2 }}>
                    <p>每个批次录取结束后，如果院校未完成招生计划，省教育考试院会发布征集志愿通知。一般时间安排：</p>
                    <p>• 本科提前批征集：7月中旬</p>
                    <p>• 本科批征集：7月下旬</p>
                    <p>• 高职(专科)批征集：8月中下旬</p>
                  </div>
                ),
              },
              {
                key: '2',
                label: '征集志愿和正常录取有什么区别？',
                children: (
                  <div style={{ color: '#8890a8', lineHeight: 2 }}>
                    <p>1. <strong style={{ color: '#fff' }}>名额更少</strong>：只有未录满的院校才有征集名额</p>
                    <p>2. <strong style={{ color: '#ff4d4f' }}>分数可能更高</strong>：征集的竞争有时更激烈，分数不降反升</p>
                    <p>3. <strong style={{ color: '#fa8c16' }}>选择有限</strong>：热门院校和专业通常已录满，征集志愿中好选择不多</p>
                    <p>4. <strong style={{ color: '#fff' }}>是最后机会</strong>：错过本批次征集，只能等下一批次（如本科→专科）</p>
                  </div>
                ),
              },
              {
                key: '3',
                label: '如何避免走到征集志愿？',
                children: (
                  <div style={{ color: '#8890a8', lineHeight: 2 }}>
                    <p>• <strong style={{ color: '#52c41a' }}>科学设置梯度</strong>：严格按照冲稳保比例填报，确保有保底院校</p>
                    <p>• <strong style={{ color: '#52c41a' }}>服从专业调剂</strong>：如果不想退档，建议勾选"服从调剂"（但要确认调剂范围）</p>
                    <p>• <strong style={{ color: '#52c41a' }}>核查录取条件</strong>：确认自己满足院校的体检、单科分数等要求，避免因条件不符被退档</p>
                    <p>• <strong style={{ color: '#52c41a' }}>不要全部冲刺</strong>：保底院校是安全网，必须认真选择</p>
                  </div>
                ),
              },
            ]} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>
        <InfoCircleOutlined style={{ color: '#1677ff', marginRight: 8 }} />甘肃省报考政策指南
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        了解甘肃新高考规则、历年省控线、冲稳保策略，科学填报不踩坑
      </Typography.Text>

      <Tabs items={tabItems} tabBarStyle={{ marginBottom: 16 }} />
    </div>
  );
}
