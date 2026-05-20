import { Layout, Menu, Typography } from 'antd';
import { HomeOutlined, SearchOutlined, FormOutlined, ExperimentOutlined, HeartOutlined, TrophyOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ProvinceSwitcher from './components/ProvinceSwitcher';

const { Header, Content, Footer } = Layout;

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/rank-conversion', icon: <TrophyOutlined />, label: '位次换算' },
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
      <Header className="pursuing-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <span className="pursuing-logo" onClick={() => navigate('/')}>Pursuing</span>
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
      <Content className="pursuing-content">
        <Outlet />
      </Content>
      <Footer className="pursuing-footer">
        <span>Pursuing</span> · 位次换算 · 科学填报 · 追逐梦想 &nbsp;|&nbsp; 数据仅供参考，填报请以官方公布为准
      </Footer>
    </Layout>
  );
}
