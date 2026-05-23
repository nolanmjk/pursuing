import { useState, useEffect, Suspense } from 'react';
import { Layout, Menu, Typography, Drawer, Button, Spin } from 'antd';
import { HomeOutlined, SearchOutlined, HeartOutlined, RobotOutlined, ThunderboltOutlined, AppstoreOutlined, MenuOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ProvinceSwitcher from './components/ProvinceSwitcher';
import { PageTransition } from './components/AnimatedPresence';
import BackToTop, { ScrollProgress } from './components/BackToTop';
import logoUrl from '/logo.jpg';

const { Header, Content, Footer } = Layout;

const primaryItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/ai-fill', icon: <ThunderboltOutlined />, label: 'AI填志愿' },
  { key: '/score-match', icon: <SearchOutlined />, label: '分数匹配' },
  { key: '/colleges', icon: <HeartOutlined />, label: '院校查询' },
  { key: '/assistant', icon: <RobotOutlined />, label: '小楷助手' },
];

const moreItems = [
  { key: '/rank-conversion', label: '位次换算' },
  { key: '/rank-query', label: '一分一段表' },
  { key: '/major-match', label: '按专业择校' },
  { key: '/college-compare', label: '院校对比' },
  { key: '/major-compare', label: '专业对比' },
  { key: '/simulate', label: '模拟填报' },
  { key: '/assessment', label: '兴趣测评' },
  { key: '/policy', label: '报考指南' },
];

const moreKeys = moreItems.map(i => i.key);

const menuItems = [
  ...primaryItems,
  { key: 'more', icon: <AppstoreOutlined />, label: '更多', children: moreItems },
];

// Flat list for drawer (no submenu)
const allFlatItems = [
  ...primaryItems.map(i => ({ key: i.key, icon: i.icon, label: i.label })),
  { key: 'divider', type: 'divider' },
  ...moreItems.map(i => ({ key: i.key, label: i.label })),
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const currentPath = '/' + location.pathname.split('/')[1];
  const selectedKey = moreKeys.includes(currentPath) ? 'more' : currentPath;

  const handleNav = (key) => {
    navigate(key);
    setDrawerOpen(false);
  };

  const logo = (
    <div onClick={() => { navigate('/'); setDrawerOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}>
      <img src={logoUrl} alt="Pursuing" style={{ width: 36, height: 36, borderRadius: 8 }} />
      <span style={{ color: '#e0e8f0', fontWeight: 700, fontSize: 16, letterSpacing: 1, whiteSpace: 'nowrap' }}>Pursuing</span>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="pursuing-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 20px' }}>
        {mobile ? (
          <>
            <Button type="text" icon={<MenuOutlined style={{ color: '#fff', fontSize: 20 }} />} onClick={() => setDrawerOpen(true)} style={{ flexShrink: 0 }} />
            {logo}
            <Drawer
              title="Pursuing"
              placement="left"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              width={260}
              styles={{ body: { padding: 0 } }}
            >
              <Menu
                mode="inline"
                selectedKeys={[selectedKey === 'more' ? currentPath : selectedKey]}
                defaultOpenKeys={['more']}
                items={[{ key: 'more', icon: <AppstoreOutlined />, label: '更多功能', children: moreItems }, ...primaryItems.map(i => ({ key: i.key, icon: i.icon, label: i.label }))]}
                onClick={({ key }) => { if (key !== 'more') handleNav(key); }}
                style={{ borderInlineEnd: 'none' }}
              />
            </Drawer>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <div style={{ marginRight: 24, marginLeft: -28 }}>{logo}</div>
              <Menu
                theme="dark"
                mode="horizontal"
                selectedKeys={[selectedKey]}
                items={menuItems}
                onClick={({ key }) => navigate(key)}
                style={{ flex: 1, minWidth: 0 }}
              />
            </div>
          </>
        )}
        <ProvinceSwitcher />
      </Header>
      <ScrollProgress />
      <Content className="pursuing-content">
        <PageTransition>
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}><Spin size="large" /></div>}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </Content>
      <BackToTop />
      <Footer className="pursuing-footer">
        <span>Pursuing</span> · 位次换算 · 科学填报 · 追逐梦想 &nbsp;|&nbsp; 数据仅供参考，填报请以官方公布为准
      </Footer>
    </Layout>
  );
}
