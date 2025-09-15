import React, { useMemo, useState } from 'react';
import { Row, Col, Card, Statistic, DatePicker, Space, Typography, Button, Input, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrdersStats, createOrder } from '../api/orders';
import { getCouriers } from '../api/couriers';
import OrderFormModal from '../components/orders/OrderFormModal';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;
const { Title } = Typography;

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [range, setRange] = useState([null, null]);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const params = useMemo(() => {
    const [from, to] = range;
    const p = {};
    if (from) p.createdFrom = from.toISOString();
    if (to) p.createdTo = to.toISOString();
    return p;
  }, [range]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['orders', 'stats', params],
    queryFn: () => getOrdersStats(params),
  });

  const { data: availableCouriers } = useQuery({
    queryKey: ['couriers', 'availableCount'],
    queryFn: async () => {
      const res = await getCouriers({ isAvailable: true, page: 1, limit: 1 });
      return res?.total || 0;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: async () => {
      message.success('Заказ создан');
      setOrderModalOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['orders', 'stats'] }),
      ]);
    },
    onError: () => message.error('Не удалось создать заказ'),
  });

  const handleCreateOrder = (values) => {
    createOrderMutation.mutate(values);
  };

  const byStatus = stats?.byStatus || {};
  const byStatusPrice = stats?.byStatusPrice || {};

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Title level={3} style={{ margin: 0 }}>Общая статистика</Title>
      <RangePicker
        value={range}
        onChange={(vals) => setRange(vals || [null, null])}
        style={{ width: '100%', maxWidth: 420 }}
        allowClear
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={isLoading}><Statistic title="Всего заказов" value={stats?.total || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={isLoading}><Statistic title="Новые" value={byStatus.new || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={isLoading}><Statistic title="Назначены" value={byStatus.assigned || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={isLoading}><Statistic title="Доставлены" value={byStatus.delivered || 0} /></Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={isLoading}><Statistic title="Выкуплено" value={byStatus.picked_up || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={isLoading}><Statistic title="Отменено" value={byStatus.canceled || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={isLoading}><Statistic title="Сумма доставленных" value={(byStatusPrice.delivered || 0)} precision={2} suffix="₽" /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Активных курьеров" value={availableCouriers || 0} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Быстрые действия" actions={[]}>
            <Space>
              <Button type="primary" onClick={() => setOrderModalOpen(true)}>Создать заказ</Button>
              <Input.Search
                placeholder="Найти курьера по имени/телефону"
                onSearch={(v) => {
                  const val = v || '';
                  navigate(`/couriers?q=${encodeURIComponent(val)}`);
                }}
                style={{ width: 320 }}
                allowClear
              />
              <Button onClick={() => navigate('/orders')}>К заказам</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <OrderFormModal
        open={orderModalOpen}
        title="Новый заказ"
        loading={createOrderMutation.isLoading}
        onCancel={() => setOrderModalOpen(false)}
        onSubmit={handleCreateOrder}
      />
    </Space>
  );
}
