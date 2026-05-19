import { useState, useMemo } from 'react';
import { Input, Select, Card, Row, Col, Typography, Tag, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import collegesData from '../../data/colleges.json';
import majorsData from '../../data/majors.json';
import { useAppContext } from '../../context/AppContext';

const levelColors = { '985': 'magenta', '211': 'blue', '双一流': 'geekblue', '省重点': 'orange', '本科': 'green', '专科': 'default' };

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
            <Col xs={24} sm={12} md={8} key={c.id}>
              <Card hoverable onClick={() => { addHistory({ id: c.id, type: 'college', name: c.name }); navigate(`/colleges/${c.id}`); }}
                extra={isFavorited(c.id, 'college') ? <a onClick={e => { e.stopPropagation(); toggleFavorite({ id: c.id, type: 'college', name: c.name }); }}>★ 已收藏</a> : <a onClick={e => { e.stopPropagation(); toggleFavorite({ id: c.id, type: 'college', name: c.name }); }}>☆ 收藏</a>}>
                <Typography.Title level={5}>{c.name}</Typography.Title>
                <div style={{ marginBottom: 8 }}>
                  {c.tags.map(t => <Tag key={t} color={levelColors[t] || 'default'}>{t}</Tag>)}
                </div>
                <Typography.Text type="secondary">{c.city} | {c.type} | {c.majors.length}个专业</Typography.Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
