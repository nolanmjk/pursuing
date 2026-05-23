import { Layout, Menu, Typography } from 'antd';
import { HomeOutlined, SearchOutlined, FormOutlined, ExperimentOutlined, HeartOutlined, TrophyOutlined, SwapOutlined, ReadOutlined, BarChartOutlined, AimOutlined, RobotOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ProvinceSwitcher from './components/ProvinceSwitcher';
import { PageTransition } from './components/AnimatedPresence';
import BackToTop, { ScrollProgress } from './components/BackToTop';
import logoUrl from '/logo.jpg';

const { Header, Content, Footer } = Layout;

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/rank-conversion', icon: <TrophyOutlined />, label: '位次换算' },
  { key: '/score-match', icon: <SearchOutlined />, label: '分数匹配' },
  { key: '/colleges', icon: <HeartOutlined />, label: '院校专业' },
  { key: '/rank-query', icon: <BarChartOutlined />, label: '一分一段' },
  { key: '/major-match', icon: <AimOutlined />, label: '按专业选校' },
  { key: '/assistant', icon: <RobotOutlined />, label: '小楷' },
  { key: '/ai-fill', icon: <ThunderboltOutlined />, label: 'AI填志愿' },
  { key: '/college-compare', icon: <SwapOutlined />, label: '对比' },
  { key: '/simulate', icon: <FormOutlined />, label: '模拟填报' },
  { key: '/assessment', icon: <ExperimentOutlined />, label: '测评' },
  { key: '/policy', icon: <ReadOutlined />, label: '政策' },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedKey = '/' + location.pathname.split('/')[1];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="pursuing-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <img src={logoUrl} alt="Pursuing" style={{ width: 50, height: 50, cursor: 'pointer', flexShrink: 0, marginRight: 28, marginLeft: -35, borderRadius: 10 }} onClick={() => navigate('/')} />
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
      <ScrollProgress />
      <Content className="pursuing-content">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </Content>
      <BackToTop />
      <Footer className="pursuing-footer">
        <span>Pursuing</span> · 位次换算 · 科学填报 · 追逐梦想 &nbsp;|&nbsp; 数据仅供参考，填报请以官方公布为准
      </Footer>
    </Layout>
  );
}
