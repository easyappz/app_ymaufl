import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values);
      message.success('Успешный вход');
      navigate('/', { replace: true });
    } catch (e) {
      message.error('Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: 16 }}>
      <Card style={{ width: 380 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>Вход в систему</Title>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ email: '', password: '' }}>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Введите email' }]}> 
            <Input prefix={<MailOutlined />} placeholder="Введите email" autoComplete="email" />
          </Form.Item>
          <Form.Item label="Пароль" name="password" rules={[{ required: true, message: 'Введите пароль' }]}> 
            <Input.Password prefix={<LockOutlined />} placeholder="Введите пароль" autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>Войти</Button>
          </Form.Item>
          <Text type="secondary">Демо-интерфейс Easyappz</Text>
        </Form>
      </Card>
    </div>
  );
}
