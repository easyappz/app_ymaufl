import React, { useMemo, useState } from 'react';
import { Row, Col, Card, Statistic, DatePicker, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { getOrdersStats } from '../api/orders';

const { RangePicker } = DatePicker;
const { Title } = Typography;

export default function Home() {
  const [range, setRange] = useState([null, null]);

  const params = useMemo(() => {
    const [from, to] = range;
    const p = {};
    if (from) p.createdFrom = from.toISOString();
    if (to) p.createdTo = to.toISOString();
    return p;
  }, [range]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'stats', params],
    queryFn: () => getOrdersStats(params),
  });

  const byStatus = data?.byStatus || {};
  const byStatusPrice = data?.byStatusPrice || {};

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
          <Card loading={isLoading}><Statistic title="Всего заказов" value={data?.total || 0} /></Card>
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
          <Card loading={isLoading}><Statistic title="Сумма доставленных" value={(byStatusPrice.delivered || 0)} precision={2} suffix="$" /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={isLoading}><Statistic title="Сумма новых" value={(byStatusPrice.new || 0)} precision={2} suffix="$" /></Card>
        </Col>
      </Row>
    </Space>
  );
}
