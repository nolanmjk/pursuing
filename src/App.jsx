import { Layout, Menu, Typography } from 'antd';
import { HomeOutlined, SearchOutlined, FormOutlined, ExperimentOutlined, HeartOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ProvinceSwitcher from './components/ProvinceSwitcher';

const { Header, Content, Footer } = Layout;

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/score-match', icon: <SearchOutlined />, label: '分数匹配' },
  { key: '/colleges', icon: <HeartOutlined />, label: '院校专业' },
  { key: '/simulate', icon: <FormOutlined />, label: '模拟填报' },
  { key: '/assessment', icon: <ExperimentOutlined />, label: '兴趣测评' },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedKey = '/' + location.pathname.split('/')[1];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
            高考志愿助手
          </Typography.Title>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>
        <ProvinceSwitcher />
      </Header>
      <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center', color: '#999' }}>
        高考志愿助手 - 数据仅供参考，填报请以官方公布为准
      </Footer>
    </Layout>
  );
}
