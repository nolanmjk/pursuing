import { useState, useMemo } from 'react';
import { Card, Select, Row, Col, Typography, Table, Tag, Empty, Descriptions, Statistic } from 'antd';
import {
  SwapOutlined, BookOutlined, TrophyOutlined, DollarOutlined,
  RiseOutlined, TeamOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import majorsData from '../../data/majors.json';
import admissionData from '../../data/admission_scores.json';
import collegesData from '../../data/colleges.json';
import { FadeInView } from '../../components/AnimatedPresence';

const categoryColors = {
  '工学': 'blue', '医学': 'red', '法学': 'purple', '文学': 'orange',
  '经济学': 'gold', '管理学': 'cyan', '教育学': 'green', '农学': 'lime',
  '理学': 'geekblue', '艺术学': 'magenta', '历史学': 'volcano',
};

export default function MajorComparePage() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);

  const majorOptions = useMemo(() =>
    majorsData.map(m => ({ value: m.id, label: `${m.name} (${m.category})` })),
  []);

  const selectedMajors = useMemo(() =>
    selectedIds.map(id => majorsData.find(m => m.id === id)).filter(Boolean),
  [selectedIds]);

  // Get colleges offering each major
  const majorCollegeInfo = useMemo(() => {
    return selectedMajors.map(major => {
      const collegeIds = [...new Set(admissionData
        .filter(a => a.majorId === major.id)
        .map(a => a.collegeId))];
      const colleges = collegeIds.map(id => collegesData.find(c => c.id === id)).filter(Boolean);
      const latestRecords = (() => {
        const records = admissionData.filter(a => a.majorId === major.id);
        const latestYear = Math.max(...records.map(r => r.year), 0);
        return records.filter(r => r.year === latestYear);
      })();
      const avgScore = latestRecords.length > 0
        ? Math.round(latestRecords.reduce((s, r) => s + r.minScore, 0) / latestRecords.length) : '-';
      const scoreRange = latestRecords.length > 0
        ? `${Math.min(...latestRecords.map(r => r.minScore))} - ${Math.max(...latestRecords.map(r => r.minScore))}`
        : '-';
      return { major, colleges, collegeCount: colleges.length, avgScore, scoreRange, latestRecords };
    });
  }, [selectedMajors]);

  if (selectedMajors.length === 0) {
    return (
      <div>
        <Typography.Title level={4}><SwapOutlined style={{ color: '#4b96e1', marginRight: 8 }} />专业对比</Typography.Title>
        <Card style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Select
            mode="multiple"
            value={selectedIds}
            onChange={setSelectedIds}
            placeholder="搜索并选择2-4个专业进行对比..."
            style={{ width: '100%' }}
            maxCount={4}
            showSearch
            filterOption={(input, option) => (option?.label || '').includes(input)}
            options={majorOptions}
          />
          <Empty description="选择专业开始对比" style={{ marginTop: 40 }} />
        </Card>
      </div>
    );
  }

  const count = selectedMajors.length;
  const gridSpan = Math.floor(24 / Math.min(count, 3));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          <SwapOutlined style={{ color: '#4b96e1', marginRight: 8 }} />专业对比
        </Typography.Title>
        <Select
          mode="multiple"
          value={selectedIds}
          onChange={setSelectedIds}
          placeholder="添加专业..."
          style={{ width: 400 }}
          maxCount={4}
          showSearch
          filterOption={(input, option) => (option?.label || '').includes(input)}
          options={majorOptions.filter(o => !selectedIds.includes(o.value))}
        />
      </div>

      {/* Header cards */}
      <FadeInView>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {majorCollegeInfo.map(({ major, collegeCount, avgScore, scoreRange }) => (
          <Col xs={24} sm={12} md={8} lg={gridSpan} key={major.id}>
            <div style={{
              borderRadius: 12, padding: '16px 20px',
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
              borderTop: `3px solid ${categoryColors[major.category] || '#666'}`,
              height: '100%',
            }}>
              <Typography.Title level={5} style={{ margin: 0, cursor: 'pointer', fontSize: 16 }}
                onClick={() => navigate(`/majors/${major.id}`)}>
                {major.name}
              </Typography.Title>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <Tag color={categoryColors[major.category]}>{major.category}</Tag>
                <Tag>{major.degree}</Tag>
                <Tag>{major.duration}年制</Tag>
              </div>
              <Row gutter={8} style={{ marginTop: 12 }}>
                <Col span={12}>
                  <Statistic title="招生院校" value={collegeCount} suffix="所" valueStyle={{ fontSize: 20, color: '#4b96e1' }} />
                </Col>
                <Col span={12}>
                  <Statistic title="平均最低分" value={avgScore} valueStyle={{ fontSize: 20, color: '#327de1' }} />
                </Col>
              </Row>
            </div>
          </Col>
        ))}
      </Row>
      </FadeInView>

      {/* Detailed comparison */}
      <FadeInView delay={0.15}>
      <Row gutter={[16, 16]}>
        {/* Basic info table */}
        <Col span={24}>
          <Card title="基本信息对比" style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Table
              dataSource={[
                { key: 'code', label: '专业代码', data: majorCollegeInfo.map(({ major }) => major.code) },
                { key: 'category', label: '学科门类', data: majorCollegeInfo.map(({ major }) => ({ text: major.category, color: categoryColors[major.category] })) },
                { key: 'subcategory', label: '专业类', data: majorCollegeInfo.map(({ major }) => major.subcategory) },
                { key: 'degree', label: '授予学位', data: majorCollegeInfo.map(({ major }) => major.degree) },
                { key: 'duration', label: '学制', data: majorCollegeInfo.map(({ major }) => `${major.duration}年`) },
                { key: 'colleges', label: '省内招生院校', data: majorCollegeInfo.map(({ collegeCount }) => `${collegeCount}所`) },
                { key: 'avgScore', label: '平均最低分', data: majorCollegeInfo.map(({ avgScore }) => avgScore), highlight: true },
                { key: 'scoreRange', label: '分数区间', data: majorCollegeInfo.map(({ scoreRange }) => scoreRange) },
              ]}
              pagination={false}
              size="small"
              columns={[
                { title: '对比项', dataIndex: 'label', width: 130 },
                ...majorCollegeInfo.map(({ major }, i) => ({
                  title: major.name,
                  key: `col_${i}`,
                  render: (_, row) => {
                    const val = row.data[i];
                    if (!val) return '-';
                    if (row.highlight) return <strong style={{ color: '#327de1' }}>{val}</strong>;
                    if (val.color) return <Tag color={val.color}>{val.text}</Tag>;
                    return val;
                  },
                })),
              ]}
            />
          </Card>
        </Col>

        {/* Employment comparison */}
        <Col span={24}>
          <Card title={<span><DollarOutlined /> 就业前景对比</span>} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Row gutter={[16, 16]}>
              {majorCollegeInfo.map(({ major }) => {
                const emp = major.employmentProspects;
                if (!emp) return null;
                return (
                  <Col xs={24} sm={12} md={8} lg={gridSpan} key={major.id}>
                    <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Typography.Text strong style={{ color: categoryColors[major.category] }}>{major.name}</Typography.Text>
                      <div style={{ marginTop: 8, color: '#8890a8', fontSize: 13, lineHeight: 2 }}>
                        <div><TeamOutlined /> 热门行业：{emp.industries?.slice(0, 3).join('、')}</div>
                        <div><DollarOutlined /> 薪资水平：{emp.averageSalary}</div>
                        <div><RiseOutlined /> 需求趋势：{emp.demandTrend}</div>
                        <div style={{ marginTop: 4 }}>
                          {emp.careerPaths?.slice(0, 3).map(p => <Tag key={p} style={{ fontSize: 10, marginBottom: 4 }}>{p}</Tag>)}
                        </div>
                        <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ color: '#667', fontSize: 12, marginTop: 6 }}>
                          {emp.summary}
                        </Typography.Paragraph>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>

        {/* Suitable for comparison */}
        <Col span={24}>
          <Card title="适合人群对比" style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Row gutter={[16, 16]}>
              {majorCollegeInfo.map(({ major }) => {
                const sf = major.suitableFor;
                if (!sf) return null;
                return (
                  <Col xs={24} sm={12} md={8} lg={gridSpan} key={major.id}>
                    <div style={{ padding: '12px 16px' }}>
                      <Typography.Text strong>{major.name}</Typography.Text>
                      <div style={{ marginTop: 8, color: '#8890a8', fontSize: 13 }}>
                        <div>兴趣类型：{sf.interests?.map(i => <Tag key={i} color="purple" style={{ fontSize: 10 }}>{i}</Tag>)}</div>
                        <div style={{ marginTop: 6 }}>所需能力：{sf.skills?.map(s => <Tag key={s} style={{ fontSize: 10 }}>{s}</Tag>)}</div>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
      </Row>
      </FadeInView>
    </div>
  );
}
