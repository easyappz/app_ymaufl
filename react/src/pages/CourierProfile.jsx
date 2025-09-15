import React from 'react';
import { Descriptions, Tag, Space, Typography, Card } from 'antd';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCourier } from '../api/couriers';

const { Title } = Typography;

export default function CourierProfile() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['couriers', id], queryFn: () => getCourier(id) });

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Title level={4} style={{ margin: 0 }}>Профиль курьера</Title>
      <Card loading={isLoading}>
        <Descriptions bordered size="middle" column={1}>
          <Descriptions.Item label="Имя">{data?.user?.fullName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Телефон">{data?.user?.phone || '—'}</Descriptions.Item>
          <Descriptions.Item label="Email">{data?.user?.email || '—'}</Descriptions.Item>
          <Descriptions.Item label="Город">{data?.city || '—'}</Descriptions.Item>
          <Descriptions.Item label="Доступность">{data?.isAvailable ? <Tag color="green">Доступен</Tag> : <Tag>Недоступен</Tag>}</Descriptions.Item>
          <Descriptions.Item label="Рейтинг">{data?.rating ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Транспорт">{data?.vehicleType || '—'}</Descriptions.Item>
          <Descriptions.Item label="Заметки">{data?.notes || '—'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}
