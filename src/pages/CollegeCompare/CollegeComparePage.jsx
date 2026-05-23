import { useState, useMemo } from 'react';
import { Card, Select, Row, Col, Typography, Table, Tag, Statistic, Empty, Button, Segmented, Dropdown, message } from 'antd';
import {
  SwapOutlined, BankOutlined, EnvironmentOutlined, TrophyOutlined,
  BookOutlined, RiseOutlined, DeleteOutlined, StarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import collegesData from '../../data/colleges.json';
import admissionData from '../../data/admission_scores.json';
import majorsData from '../../data/majors.json';
import { useAppContext } from '../../context/AppContext';
import { classifyChoice } from '../../utils/matchAlgorithm';
import { FadeInView } from '../../components/AnimatedPresence';

const levelColors = { '985': 'magenta', '211': 'blue', '双一流': 'geekblue', '省重点': 'orange', '本科': 'green' };

export default function CollegeComparePage() {
  const navigate = useNavigate();
  const { userRank, userSubject, favorites } = useAppContext();
  const [selectedIds, setSelectedIds] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('全部');

  const collegeOptions = useMemo(() => {
    const collegeMap = {};
    collegesData.forEach(c => { collegeMap[c.id] = c; });
    const ids = [...new Set(admissionData.map(a => a.collegeId))];
    return collegesData.filter(c => ids.includes(c.id)).map(c => ({
      value: c.id,
      label: `${c.name} (${c.level})`,
    }));
  }, []);

  const selectedColleges = useMemo(() =>
    selectedIds.map(id => collegesData.find(c => c.id === id)).filter(Boolean),
  [selectedIds]);

  // Get latest admission stats for each college
  const collegeStats = useMemo(() => {
    return selectedColleges.map(college => {
      const allRecords = admissionData.filter(a => a.collegeId === college.id);
      const records = subjectFilter === '全部' ? allRecords : allRecords.filter(a => {
        if (a.subjectCategory === subjectFilter) return true;
        if (subjectFilter === '物理类' && a.subjectCategory === '理科') return true;
        if (subjectFilter === '历史类' && a.subjectCategory === '文科') return true;
        return false;
      });
      const latestYear = records.length > 0 ? Math.max(...records.map(r => r.year)) : null;
      const latestRecords = records.filter(r => r.year === latestYear);
      const avgMinScore = latestRecords.length > 0
        ? Math.round(latestRecords.reduce((s, r) => s + r.minScore, 0) / latestRecords.length) : '-';
      const minRank = latestRecords.length > 0
        ? Math.min(...latestRecords.map(r => r.minRank)) : '-';
      const collegeMajors = majorsData.filter(m => college.majors?.includes(m.id));
      const zone = (userRank != null && minRank !== '-')
        ? classifyChoice(userRank, minRank)
        : null;
      return { college, avgMinScore, minRank, recordCount: records.length, collegeMajors, latestYear, zone };
    });
  }, [selectedColleges, subjectFilter, userRank]);

  // Comparison columns
  const count = selectedColleges.length;

  if (count === 0) {
    return (
      <div>
        <Typography.Title level={4}><SwapOutlined style={{ color: '#327de1', marginRight: 8 }} />院校对比</Typography.Title>
        <Card style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Select
            mode="multiple"
            value={selectedIds}
            onChange={setSelectedIds}
            placeholder="搜索并选择2-4所院校进行对比..."
            style={{ width: '100%' }}
            maxCount={4}
            showSearch
            filterOption={(input, option) => (option?.label || '').includes(input)}
            options={collegeOptions}
          />
          <Empty description="选择院校开始对比" style={{ marginTop: 40 }} />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          <SwapOutlined style={{ color: '#327de1', marginRight: 8 }} />院校对比
        </Typography.Title>
        <Select
          mode="multiple"
          value={selectedIds}
          onChange={setSelectedIds}
          placeholder="添加院校..."
          style={{ width: 400 }}
          maxCount={4}
          showSearch
          filterOption={(input, option) => (option?.label || '').includes(input)}
          options={collegeOptions.filter(o => !selectedIds.includes(o.value))}
        />
        <Dropdown
          menu={{
            items: favorites
              .filter(f => f.type === 'college' && !selectedIds.includes(f.id))
              .slice(0, 10)
              .map(f => ({
                key: f.id,
                label: f.name,
                onClick: () => {
                  if (selectedIds.length >= 4) { message.warning('最多对比4所院校'); return; }
                  setSelectedIds(prev => [...prev, f.id]);
                },
              })),
          }}
          disabled={favorites.filter(f => f.type === 'college' && !selectedIds.includes(f.id)).length === 0}
        >
          <Button icon={<StarOutlined />}>从收藏添加</Button>
        </Dropdown>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Segmented
          value={subjectFilter}
          onChange={setSubjectFilter}
          options={[
            { value: '全部', label: '全部' },
            { value: '物理类', label: '物理类' },
            { value: '历史类', label: '历史类' },
          ]}
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />
      </div>

      {/* Header cards */}
      <FadeInView>
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {collegeStats.map(({ college, avgMinScore, minRank, latestYear, zone }) => {
          const accent = levelColors[college.level] === 'magenta' ? '#faaf32' :
            levelColors[college.level] === 'blue' ? '#327de1' :
            levelColors[college.level] === 'geekblue' ? '#4b96e1' :
            levelColors[college.level] === 'orange' ? '#52C41A' : '#4b96e1';
          return (
            <Col xs={24} sm={12} md={6} key={college.id}>
              <div style={{
                borderRadius: 12, overflow: 'hidden',
                background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)',
                height: '100%', cursor: 'pointer',
              }} onClick={() => navigate(`/colleges/${college.id}`)}>
                <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Typography.Title level={5} style={{ margin: 0, fontSize: 15 }}>
                    {college.name}
                  </Typography.Title>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <Tag color={levelColors[college.level]} style={{ fontSize: 11 }}>{college.level}</Tag>
                    <Tag style={{ fontSize: 11 }}>{college.type}</Tag>
                  </div>
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.15)' }}>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Statistic title="最新最低分" value={avgMinScore} valueStyle={{ fontSize: 18, color: accent }} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="最低位次" value={minRank === '-' ? '-' : minRank} valueStyle={{ fontSize: 18, color: '#fff' }} />
                    </Col>
                  </Row>
                  <div style={{ fontSize: 11, color: '#556', marginTop: 4 }}>{latestYear}年 · {college.city}</div>
                  {zone && (
                    <Tag color={zone.color} style={{ fontSize: 11, marginTop: 4 }}>{zone.level}</Tag>
                  )}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
      </FadeInView>

      {/* Comparison rows */}
      <FadeInView delay={0.15}>
      <Card style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Table
          dataSource={[
            { key: 'location', label: '所在地', icon: <EnvironmentOutlined />,
              data: collegeStats.map(({ college }) => college.city) },
            { key: 'level', label: '层次', icon: <TrophyOutlined />,
              data: collegeStats.map(({ college }) => ({ text: college.level, color: levelColors[college.level] })) },
            { key: 'type', label: '类型', icon: <BankOutlined />,
              data: collegeStats.map(({ college }) => college.type) },
            { key: 'doubleFirst', label: '双一流',
              data: collegeStats.map(({ college }) => college.isDoubleFirstClass ? '是' : '否') },
            { key: 'majors', label: '开设专业数', icon: <BookOutlined />,
              data: collegeStats.map(({ college }) => college.majors?.length || 0) },
            { key: 'latestScore', label: '最新最低分', icon: <RiseOutlined />,
              data: collegeStats.map(({ avgMinScore }) => avgMinScore),
              highlight: true },
            { key: 'minRank', label: '最低位次',
              data: collegeStats.map(({ minRank }) => minRank),
              highlight: true },
            { key: 'zoneLabel', label: '匹配定位', icon: <TrophyOutlined />,
              data: collegeStats.map(({ zone }) => zone ? { text: zone.level, color: zone.color } : { text: '--', color: 'default' }) },
            { key: 'recordCount', label: '录取记录数',
              data: collegeStats.map(({ recordCount }) => recordCount) },
          ]}
          pagination={false}
          size="small"
          columns={[
            { title: '对比项', dataIndex: 'label', key: 'label', width: 120, fixed: 'left',
              render: (text, r) => <span style={{ fontWeight: 500 }}>{r.icon} {text}</span> },
            ...collegeStats.map(({ college }, i) => ({
              title: (
                <span>
                  {college.name}
                  <Button type="text" size="small" danger icon={<DeleteOutlined />}
                    onClick={e => { e.stopPropagation(); setSelectedIds(prev => prev.filter(id => id !== college.id)); }}
                    style={{ marginLeft: 4 }} />
                </span>
              ),
              key: `col_${i}`,
              render: (_, row) => {
                const val = row.data[i];
                if (!val) return '-';
                if (row.highlight) {
                  return <strong style={{ color: '#327de1', fontSize: 15 }}>{val}</strong>;
                }
                if (val.color) {
                  return <Tag color={val.color} style={{ fontSize: 12 }}>{val.text}</Tag>;
                }
                return <span style={{ fontSize: 13 }}>{val}</span>;
              },
            })),
          ]}
        />
      </Card>
      </FadeInView>

      {/* Major comparison */}
      {collegeStats.length >= 2 && (
        <FadeInView delay={0.25}>
        <Card title="共同开设专业" style={{ marginTop: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {(() => {
            const allMajorIds = new Set();
            collegeStats.forEach(({ college }) => {
              college.majors?.forEach(id => allMajorIds.add(id));
            });
            const commonMajors = [];
            allMajorIds.forEach(mid => {
              const count = collegeStats.filter(({ college }) => college.majors?.includes(mid)).length;
              if (count >= 2) {
                const major = majorsData.find(m => m.id === mid);
                if (major) commonMajors.push({ major, colleges: collegeStats.filter(({ college }) => college.majors?.includes(mid)).map(s => s.college.name) });
              }
            });
            if (commonMajors.length === 0) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有共同专业" />;
            return (
              <Row gutter={[8, 8]}>
                {commonMajors.map(({ major, colleges }) => (
                  <Col xs={24} sm={12} md={8} key={major.id}>
                    <a onClick={() => navigate(`/majors/${major.id}`)}
                      style={{ display: 'block', padding: '10px 14px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{major.name}</div>
                      <div style={{ color: '#8890a8', fontSize: 12, marginTop: 4 }}>{major.category} · {major.degree}</div>
                      <div style={{ marginTop: 4 }}>
                        {colleges.map(name => <Tag key={name} style={{ fontSize: 10 }}>{name}</Tag>)}
                      </div>
                    </a>
                  </Col>
                ))}
              </Row>
            );
          })()}
        </Card>
        </FadeInView>
      )}
    </div>
  );
}
