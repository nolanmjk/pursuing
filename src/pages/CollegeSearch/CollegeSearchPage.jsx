import { useState, useMemo } from 'react';
import { Input, Select, Card, Row, Col, Typography, Tag, Empty } from 'antd';
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import collegesData from '../../data/colleges.json';
import { useAppContext } from '../../context/AppContext';

const levelColors = { '985': 'magenta', '211': 'blue', '双一流': 'geekblue', '省重点': 'orange', '本科': 'green', '专科': 'default' };

function campusThumbBg(level) {
  const gradients = {
    '985': 'linear-gradient(135deg, #0F2027, #2C5364)',
    '211': 'linear-gradient(135deg, #1A1A3E, #4A6FA5)',
    '省重点': 'linear-gradient(135deg, #0F1F14, #2D6A4F)',
    '本科': 'linear-gradient(135deg, #1A1A2E, #4A4A8A)',
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

  const filtered = useMemo(() => {
    return collegesData.filter(c => {
      if (search && !c.name.includes(search)) return false;
      if (filterType !== 'all' && c.type !== filterType) return false;
      if (filterLevel !== 'all' && c.level !== filterLevel) return false;
      return true;
    });
  }, [search, filterType, filterLevel]);

  return (
    <div>
      <Typography.Title level={4}>院校专业查询</Typography.Title>
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 12]}>
          <Col xs={24} md={8}>
            <Input prefix={<SearchOutlined />} placeholder="搜索院校名称" value={search} onChange={e => setSearch(e.target.value)} allowClear />
          </Col>
          <Col xs={12} md={6}>
            <Select value={filterType} onChange={setFilterType} style={{ width: '100%' }} options={[
              { value: 'all', label: '全部类型' }, { value: '综合', label: '综合' }, { value: '理工', label: '理工' },
              { value: '师范', label: '师范' }, { value: '农林', label: '农林' }, { value: '医药', label: '医药' },
              { value: '财经', label: '财经' }, { value: '政法', label: '政法' }, { value: '民族', label: '民族' },
            ]} />
          </Col>
          <Col xs={12} md={6}>
            <Select value={filterLevel} onChange={setFilterLevel} style={{ width: '100%' }} options={[
              { value: 'all', label: '全部层次' }, { value: '985', label: '985' }, { value: '211', label: '211' },
              { value: '省重点', label: '省重点' }, { value: '本科', label: '本科' },
            ]} />
          </Col>
        </Row>
      </Card>

      {filtered.length === 0 ? <Empty description="没有找到匹配的院校" /> : (
        <Row gutter={[16, 16]}>
          {filtered.map(c => (
            <Col xs={24} sm={12} md={8} lg={6} key={c.id}>
              <Card
                hoverable
                onClick={() => { addHistory({ id: c.id, type: 'college', name: c.name }); navigate(`/colleges/${c.id}`); }}
                style={{ borderRadius: 10, overflow: 'hidden', height: '100%' }}
                cover={
                  <div style={{
                    height: 120,
                    background: c.thumbImage
                      ? `url(${c.thumbImage}) center/cover no-repeat`
                      : c.image
                        ? `url(${c.image}) center/cover no-repeat, ${campusThumbBg(c.level)}`
                        : campusThumbBg(c.level),
                    position: 'relative',
                  }}>
                    {/* Level badge */}
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(4px)',
                      color: '#fff',
                      padding: '2px 10px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}>
                      {c.level}
                    </div>
                    {/* City */}
                    <div style={{
                      position: 'absolute',
                      bottom: 10,
                      left: 10,
                      color: 'rgba(255,255,255,0.75)',
                      fontSize: 12,
                    }}>
                      <EnvironmentOutlined /> {c.city}
                    </div>
                  </div>
                }
                bodyStyle={{ padding: '12px 16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <Typography.Title level={5} style={{ margin: 0, fontSize: 15 }}>{c.name}</Typography.Title>
                </div>
                <div style={{ marginBottom: 4 }}>
                  {c.tags.slice(0, 3).map(t => <Tag key={t} color={levelColors[t] || 'default'} style={{ fontSize: 11, padding: '0 6px' }}>{t}</Tag>)}
                </div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {c.type} · {c.majors.length}个专业
                </Typography.Text>
                <div style={{ marginTop: 6 }}>
                  {isFavorited(c.id, 'college') ? (
                    <a onClick={e => { e.stopPropagation(); toggleFavorite({ id: c.id, type: 'college', name: c.name }); }}
                      style={{ fontSize: 13, color: '#00C8E0' }}>★ 已收藏</a>
                  ) : (
                    <a onClick={e => { e.stopPropagation(); toggleFavorite({ id: c.id, type: 'college', name: c.name }); }}
                      style={{ fontSize: 13 }}>☆ 收藏</a>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
