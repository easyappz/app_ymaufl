import React, { useMemo } from 'react';
import { Layout, Menu, Button, Avatar, Typography } from 'antd';
import { HomeOutlined, TeamOutlined, ProfileOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith('/couriers')) return '/couriers';
    if (location.pathname.startsWith('/orders')) return '/orders';
    return '/';
  }, [location.pathname]);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={64}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 16 }}>
          Easyappz
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]}
          items={[
            { key: '/', icon: <HomeOutlined />, label: <Link to="/">Главная</Link> },
            { key: '/couriers', icon: <TeamOutlined />, label: <Link to="/couriers">Курьеры</Link> },
            { key: '/orders', icon: <ProfileOutlined />, label: <Link to="/orders">Заказы</Link> },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar icon={<UserOutlined />} />
            <Text strong>{user?.fullName || user?.name || 'Пользователь'}</Text>
            <Button type="text" icon={<LogoutOutlined />} onClick={onLogout}>Выход</Button>
          </div>
        </Header>
        <Content style={{ padding: 16 }}>
          <div style={{ background: '#fff', padding: 16, minHeight: 'calc(100vh - 56px - 32px)' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
