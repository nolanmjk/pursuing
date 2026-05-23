import { useState, useMemo } from 'react';
import { Card, Select, Segmented, Row, Col, Typography, Table, Tag, Empty, Button } from 'antd';
import { AimOutlined, SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import majorsData from '../../data/majors.json';
import admissionData from '../../data/admission_scores.json';
import collegesData from '../../data/colleges.json';
import { useAppContext } from '../../context/AppContext';
import { classifyChoice } from '../../utils/matchAlgorithm';
import { FadeInView } from '../../components/AnimatedPresence';

const levelColors = { '985': 'magenta', '211': 'blue', '双一流': 'geekblue', '省重点': 'orange', '本科': 'green' };
const levelOptions = ['985', '211', '省重点', '本科'];

const categoryColors = {
  '工学': 'blue', '医学': 'red', '法学': 'purple', '文学': 'orange',
  '经济学': 'gold', '管理学': 'cyan', '教育学': 'green', '农学': 'lime',
  '理学': 'geekblue', '艺术学': 'magenta', '历史学': 'volcano',
};

const categoryIcons = {
  '工学': '⚙', '医学': '⚕', '法学': '⚖', '文学': '📖',
  '经济学': '📊', '管理学': '📋', '教育学': '🎓', '农学': '🌾',
  '理学': '🔬', '艺术学': '🎨', '历史学': '📜', '哲学': '💭',
};

export default function MajorMatchPage() {
  const navigate = useNavigate();
  const { userRank, userSubject } = useAppContext();
  const [mode, setMode] = useState('search');
  const [selectedMajorId, setSelectedMajorId] = useState(null);
  const [year, setYear] = useState(null); // null = all years
  const [region, setRegion] = useState('all');
  const [levelFilters, setLevelFilters] = useState([]);
  const [sortBy, setSortBy] = useState('score');
  const [browseCategory, setBrowseCategory] = useState(null);

  const collegeMap = useMemo(() => {
    const map = {};
    collegesData.forEach(c => { map[c.id] = c; });
    return map;
  }, []);

  // Major options grouped by category for Mode A
  const majorOptions = useMemo(() => {
    const grouped = {};
    majorsData.forEach(m => {
      if (!grouped[m.category]) grouped[m.category] = [];
      grouped[m.category].push({ value: m.id, label: `${m.name} (${m.subcategory || ''})` });
    });
    return Object.entries(grouped).map(([cat, opts]) => ({
      label: `${cat} (${opts.length})`,
      options: opts,
    }));
  }, []);

  // Available years from admission data
  const availableYears = useMemo(() => {
    const years = [...new Set(admissionData.map(r => r.year))];
    years.sort((a, b) => b - a);
    return years;
  }, []);

  // Category stats for Mode B
  const categoryStats = useMemo(() => {
    const stats = {};
    majorsData.forEach(m => {
      if (!stats[m.category]) stats[m.category] = { count: 0, majors: [] };
      stats[m.category].count++;
      stats[m.category].majors.push(m);
    });
    return stats;
  }, []);

  const selectedMajor = useMemo(() =>
    majorsData.find(m => m.id === selectedMajorId), [selectedMajorId]);

  // Filter and enrich admission records
  const results = useMemo(() => {
    if (!selectedMajorId) return [];

    let records = admissionData.filter(a => a.majorId === selectedMajorId);

    // Year filter
    if (year != null) {
      records = records.filter(a => a.year === year);
    }

    // Region filter
    if (region !== 'all') {
      records = records.filter(a => {
        const col = collegeMap[a.collegeId];
        if (!col) return false;
        if (region === '省内') return col.province === '甘肃';
        return col.province !== '甘肃';
      });
    }

    // Level filter
    if (levelFilters.length > 0) {
      records = records.filter(a => {
        const col = collegeMap[a.collegeId];
        return col && levelFilters.includes(col.level);
      });
    }

    // Dedup: keep best (lowest minRank) per college+year
    const best = {};
    records.forEach(a => {
      const key = `${a.collegeId}_${a.year}`;
      if (!best[key] || a.minRank < best[key].minRank) {
        best[key] = a;
      }
    });

    // Enrich with college name and zone
    const enriched = Object.values(best).map(a => {
      const col = collegeMap[a.collegeId];
      const zone = userRank ? classifyChoice(userRank, a.minRank) : null;
      return { ...a, college: col, zone };
    });

    // Sort
    enriched.sort((a, b) => {
      if (sortBy === 'score') return a.minScore - b.minScore;
      if (sortBy === 'rank') return a.minRank - b.minRank;
      return (a.college?.name || '').localeCompare(b.college?.name || '');
    });

    return enriched;
  }, [selectedMajorId, year, region, levelFilters, sortBy, userRank, collegeMap]);

  const handleMajorSelect = (id) => {
    setSelectedMajorId(id);
    setMode('search');
  };

  return (
    <div>
      <FadeInView>
        <Typography.Title level={4}><AimOutlined style={{ color: '#327de1', marginRight: 8 }} />按专业选校</Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
          选择目标专业，查看所有开设该专业的院校录取数据
        </Typography.Text>
      </FadeInView>

      <FadeInView delay={0.1}>
        <Card style={{ marginBottom: 20, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Segmented
            value={mode}
            onChange={(v) => { setMode(v); if (v === 'search') setBrowseCategory(null); }}
            options={[
              { value: 'search', label: '按专业搜索' },
              { value: 'browse', label: '按类别浏览' },
            ]}
            style={{ marginBottom: 16, background: 'rgba(255,255,255,0.04)' }}
          />

          {mode === 'search' && (
            <>
              <Row gutter={[12, 12]}>
                <Col xs={24} md={8}>
                  <Select
                    showSearch
                    value={selectedMajorId}
                    onChange={handleMajorSelect}
                    placeholder="搜索专业名称..."
                    style={{ width: '100%' }}
                    filterOption={(input, option) => (option?.label || '').toLowerCase().includes(input.toLowerCase())}
                    options={majorOptions}
                  />
                </Col>
                <Col xs={8} md={3}>
                  <Select value={year} onChange={setYear} style={{ width: '100%' }} placeholder="全部年份" allowClear
                    options={[{ value: null, label: '全部年份' }, ...availableYears.map(y => ({ value: y, label: `${y}年` }))]} />
                </Col>
                <Col xs={8} md={4}>
                  <Segmented value={region} onChange={setRegion}
                    options={[
                      { value: 'all', label: '不限' },
                      { value: '省内', label: '省内' },
                      { value: '省外', label: '省外' },
                    ]}
                    style={{ background: 'rgba(255,255,255,0.04)' }} />
                </Col>
                <Col xs={8} md={4}>
                  <Select mode="multiple" value={levelFilters} onChange={setLevelFilters}
                    placeholder="院校层次" style={{ width: '100%' }} allowClear
                    options={levelOptions.map(l => ({ value: l, label: l }))} />
                </Col>
                <Col xs={8} md={3}>
                  <Select value={sortBy} onChange={setSortBy} style={{ width: '100%' }}
                    options={[
                      { value: 'score', label: '按分数' },
                      { value: 'rank', label: '按位次' },
                      { value: 'name', label: '按院校名' },
                    ]} />
                </Col>
              </Row>
            </>
          )}

          {mode === 'browse' && !browseCategory && (
            <Row gutter={[12, 12]}>
              {Object.entries(categoryStats).map(([cat, { count }]) => (
                <Col xs={12} sm={8} md={6} lg={4} key={cat}>
                  <div
                    onClick={() => setBrowseCategory(cat)}
                    style={{
                      padding: '16px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                      background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)',
                      borderTop: `3px solid ${categoryColors[cat] || '#666'}`,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{categoryIcons[cat] || '📚'}</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: categoryColors[cat] || '#fff' }}>{cat}</div>
                    <div style={{ color: '#555', fontSize: 12, marginTop: 2 }}>{count} 个专业</div>
                  </div>
                </Col>
              ))}
            </Row>
          )}

          {mode === 'browse' && browseCategory && (
            <>
              <Button type="link" onClick={() => setBrowseCategory(null)} style={{ marginBottom: 12, padding: 0 }}>
                &larr; 返回分类
              </Button>
              <Row gutter={[8, 8]}>
                {(categoryStats[browseCategory]?.majors || []).map(m => (
                  <Col xs={24} sm={12} md={8} lg={6} key={m.id}>
                    <div
                      onClick={() => handleMajorSelect(m.id)}
                      style={{
                        padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(50,125,225,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                    >
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{m.name}</div>
                      <div style={{ color: '#555', fontSize: 12, marginTop: 2 }}>
                        {m.subcategory} · {m.degree} · {m.duration}年
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </Card>
      </FadeInView>

      {/* Results */}
      {selectedMajor && (
        <FadeInView delay={0.15}>
          <Card style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              {selectedMajor.name} — 开设院校
            </Typography.Title>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              共找到 <strong>{results.length}</strong> 条记录
              {selectedMajor?.category && <> · {selectedMajor.category} · {selectedMajor.degree}</>}
            </Typography.Text>

            {results.length === 0 ? (
              <Empty description="该专业在所选条件下暂无录取数据" />
            ) : (
              <Table
                dataSource={results}
                rowKey={r => r.id}
                size="small"
                pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['15', '20', '30', '50'] }}
                onRow={(r) => ({
                  onClick: () => navigate(`/colleges/${r.collegeId}`),
                  style: { cursor: 'pointer' },
                })}
                columns={[
                  {
                    title: '院校名称', dataIndex: ['college', 'name'], key: 'name', width: 180,
                    render: (_, r) => (
                      <a onClick={() => navigate(`/colleges/${r.collegeId}`)}>
                        {r.college?.name || r.collegeId}
                      </a>
                    ),
                  },
                  {
                    title: '层次', key: 'level', width: 80,
                    render: (_, r) => (
                      <Tag color={levelColors[r.college?.level] || 'default'} style={{ fontSize: 11 }}>
                        {r.college?.level || '--'}
                      </Tag>
                    ),
                  },
                  {
                    title: '城市', key: 'city', width: 100,
                    render: (_, r) => <span style={{ fontSize: 12, color: '#8890a8' }}><EnvironmentOutlined /> {r.college?.city || '--'}</span>,
                  },
                  {
                    title: '最低分', dataIndex: 'minScore', key: 'score', width: 80, sorter: (a, b) => a.minScore - b.minScore,
                    render: v => <strong style={{ color: '#327de1' }}>{v}</strong>,
                  },
                  {
                    title: '最低位次', dataIndex: 'minRank', key: 'rank', width: 100, sorter: (a, b) => a.minRank - b.minRank,
                    render: v => v?.toLocaleString(),
                  },
                  {
                    title: '年份', dataIndex: 'year', key: 'year', width: 60,
                  },
                  {
                    title: '录取概率', key: 'zone', width: 90,
                    render: (_, r) => r.zone ? (
                      <Tag color={r.zone.color} style={{ fontSize: 11 }}>{r.zone.level}</Tag>
                    ) : (
                      <span style={{ color: '#555', fontSize: 11 }}>--</span>
                    ),
                  },
                ]}
              />
            )}
          </Card>
        </FadeInView>
      )}
    </div>
  );
}
