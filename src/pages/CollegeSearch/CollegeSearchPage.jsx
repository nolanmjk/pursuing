import { useState, useMemo } from 'react';
import { Input, Select, Card, Row, Col, Typography, Tag, Empty, Button } from 'antd';
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import collegesData from '../../data/colleges.json';
import { useAppContext } from '../../context/AppContext';
import { FadeInView } from '../../components/AnimatedPresence';

const PAGE_SIZE = 48; // 8 cols × 6 rows

const levelColors = { '985': 'magenta', '211': 'blue', '双一流': 'geekblue', '省重点': 'orange', '本科': 'green', '专科': 'default' };

function campusThumbBg(level) {
  const gradients = {
    '985': 'linear-gradient(135deg, #00194b, #1a3d7c)',
    '211': 'linear-gradient(135deg, #00194b, #2e5aa8)',
    '省重点': 'linear-gradient(135deg, #0d2640, #1f5480)',
    '本科': 'linear-gradient(135deg, #162840, #325580)',
    '专科': 'linear-gradient(135deg, #2D2D2D, #505050)',
  };
  return gradients[level] || gradients['本科'];
}

export default function CollegeSearchPage() {
  const navigate = useNavigate();
  const { addHistory, toggleFavorite, isFavorited } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    return collegesData.filter(c => {
      if (search && !c.name.includes(search)) return false;
      if (filterType !== 'all' && c.type !== filterType) return false;
      if (filterLevel !== 'all' && c.level !== filterLevel) return false;
      return true;
    });
  }, [search, filterType, filterLevel]);

  // Reset page when filters change
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div>
      <FadeInView><Typography.Title level={4}>院校专业查询</Typography.Title></FadeInView>
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 12]}>
          <Col xs={24} md={8}>
            <Input prefix={<SearchOutlined />} placeholder="搜索院校名称" value={search} onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} allowClear />
          </Col>
          <Col xs={12} md={6}>
            <Select value={filterType} onChange={handleFilterChange(setFilterType)} style={{ width: '100%' }} options={[
              { value: 'all', label: '全部类型' }, { value: '综合', label: '综合' }, { value: '理工', label: '理工' },
              { value: '师范', label: '师范' }, { value: '农林', label: '农林' }, { value: '医药', label: '医药' },
              { value: '财经', label: '财经' }, { value: '政法', label: '政法' }, { value: '民族', label: '民族' },
            ]} />
          </Col>
          <Col xs={12} md={6}>
            <Select value={filterLevel} onChange={handleFilterChange(setFilterLevel)} style={{ width: '100%' }} options={[
              { value: 'all', label: '全部层次' }, { value: '985', label: '985' }, { value: '211', label: '211' },
              { value: '省重点', label: '省重点' }, { value: '本科', label: '本科' },
            ]} />
          </Col>
        </Row>
      </Card>

      {filtered.length === 0 ? <Empty description="没有找到匹配的院校" /> : (
        <>
        <Row gutter={[16, 16]}>
          {visible.map(c => {
            const bg = campusThumbBg(c.level);
            const accent = levelColors[c.level] === 'magenta' ? '#faaf32' :
                           levelColors[c.level] === 'blue' ? '#327de1' :
                           levelColors[c.level] === 'geekblue' ? '#4b96e1' :
                           levelColors[c.level] === 'orange' ? '#52C41A' : '#4b96e1';
            return (
            <Col xs={24} sm={12} md={8} lg={6} key={c.id}>
              <Card
                hoverable
                onClick={() => { addHistory({ id: c.id, type: 'college', name: c.name }); navigate(`/colleges/${c.id}`); }}
                style={{ borderRadius: 12, overflow: 'hidden', height: '100%', border: 'none' }}
                styles={{ body: { padding: 0 } }}
              >
                {/* Full gradient background card */}
                <div style={{
                  background: bg,
                  padding: '20px 16px 16px',
                  minHeight: 220,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}>
                  {/* Dot pattern overlay */}
                  <div style={{
                    position: 'absolute', inset: 0, opacity: 0.08,
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
                    backgroundSize: '20px 20px', pointerEvents: 'none',
                  }} />

                  {/* Level badge */}
                  <div style={{
                    position: 'absolute', top: 10, right: 10, zIndex: 1,
                    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                    color: '#fff', padding: '2px 10px', borderRadius: 4,
                    fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)',
                  }}>
                    {c.level}
                  </div>

                  {/* Name + English */}
                  <Typography.Title level={5} style={{ color: '#fff', margin: '0 0 2px', fontSize: 16, position: 'relative', zIndex: 1 }}>
                    {c.name}
                  </Typography.Title>
                  {c.englishName && (
                    <div style={{
                      fontSize: 11, fontWeight: 500, letterSpacing: '0.03em',
                      background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0.6))`,
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text', marginBottom: 8, position: 'relative', zIndex: 1,
                    }}>
                      {c.englishName}
                    </div>
                  )}

                  {/* Description */}
                  <Typography.Paragraph
                    style={{
                      color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6,
                      marginBottom: 12, flex: 1, position: 'relative', zIndex: 1,
                    }}
                    ellipsis={{ rows: 3 }}
                  >
                    {c.description}
                  </Typography.Paragraph>

                  {/* Tags */}
                  <div style={{ marginBottom: 8, position: 'relative', zIndex: 1 }}>
                    {(c.tags || []).slice(0, 3).map(t => (
                      <Tag key={t} style={{
                        color: 'rgba(255,255,255,0.85)', fontSize: 11, padding: '0 6px',
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                      }}>{t}</Tag>
                    ))}
                  </div>

                  {/* Bottom row: city + type + favorite */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                      <EnvironmentOutlined /> {c.city} · {c.type} · {c.majors?.length || 0}专业
                    </span>
                    <span onClick={e => { e.stopPropagation(); toggleFavorite({ id: c.id, type: 'college', name: c.name }); }}>
                      {isFavorited(c.id, 'college') ? (
                        <span style={{ color: accent, fontSize: 14, cursor: 'pointer' }}>★</span>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer' }}>☆</span>
                      )}
                    </span>
                  </div>
                </div>
              </Card>
            </Col>
          )})}
        </Row>
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              显示 {visibleCount} / {filtered.length} 所院校
            </Typography.Text>
            <Button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>加载更多</Button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
