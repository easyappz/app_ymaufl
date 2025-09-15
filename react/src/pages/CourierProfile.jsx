import React, { useMemo, useState } from 'react';
import { Descriptions, Tag, Space, Typography, Card, Tabs, Form, Input, Switch, InputNumber, Select, Button, Table } from 'antd';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCourier, updateCourier } from '../api/couriers';
import { getOrders, getOrdersStats } from '../api/orders';

const { Title } = Typography;

const statusColors = {
  new: 'blue',
  assigned: 'gold',
  picked_up: 'purple',
  delivered: 'green',
  canceled: 'red',
};

export default function CourierProfile() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [sorter, setSorter] = useState({ field: 'createdAt', order: 'descend' });

  const { data: courier, isLoading } = useQuery({ queryKey: ['couriers', id], queryFn: () => getCourier(id) });

  const params = useMemo(() => {
    const p = { courierId: id, page: pagination.current, limit: pagination.pageSize };
    if (statusFilter) p.status = statusFilter;
    if (sorter && sorter.field) {
      const map = { createdAt: 'createdAt', price: 'price', status: 'status', number: 'number', customerName: 'customerName' };
      const sortBy = map[sorter.field] || 'createdAt';
      const sortDir = sorter.order === 'ascend' ? 'asc' : 'desc';
      p.sortBy = sortBy; p.sortDir = sortDir;
    }
    return p;
  }, [id, statusFilter, pagination, sorter]);

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'byCourier', params],
    queryFn: () => getOrders(params),
    keepPreviousData: true,
  });

  const { data: statsData } = useQuery({
    queryKey: ['orders', 'stats', 'courier', id],
    queryFn: () => getOrdersStats({ courierId: id }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ cid, body }) => updateCourier(cid, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['couriers', id] });
    },
  });

  const onFinish = (values) => {
    const payload = {
      city: values.city,
      isAvailable: values.isAvailable,
      rating: values.rating,
      vehicleType: values.vehicleType,
      notes: values.notes,
      user: { fullName: values.fullName, phone: values.phone, email: values.email },
    };
    updateMutation.mutate({ cid: id, body: payload });
  };

  const orderColumns = [
    { title: 'Номер', dataIndex: 'number', key: 'number', sorter: true },
    { title: 'Клиент', dataIndex: 'customerName', key: 'customerName', sorter: true },
    { title: 'Цена', dataIndex: 'price', key: 'price', sorter: true },
    { title: 'Статус', dataIndex: 'status', key: 'status', sorter: true, render: (val) => <Tag color={statusColors[val] || 'default'}>{val}</Tag> },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Title level={4} style={{ margin: 0 }}>Профиль курьера</Title>
      <Tabs
        items={[
          {
            key: 'profile',
            label: 'Профиль',
            children: (
              <Card loading={isLoading}>
                <Form
                  layout="vertical"
                  initialValues={{
                    fullName: courier?.user?.fullName,
                    phone: courier?.user?.phone,
                    email: courier?.user?.email,
                    city: courier?.city,
                    isAvailable: courier?.isAvailable,
                    rating: courier?.rating,
                    vehicleType: courier?.vehicleType,
                    notes: courier?.notes,
                  }}
                  onFinish={onFinish}
                >
                  <Form.Item label="ФИО" name="fullName"><Input /></Form.Item>
                  <Form.Item label="Телефон" name="phone"><Input /></Form.Item>
                  <Form.Item label="Email" name="email"><Input /></Form.Item>
                  <Form.Item label="Город" name="city"><Input /></Form.Item>
                  <Form.Item label="Доступность" name="isAvailable" valuePropName="checked"><Switch /></Form.Item>
                  <Form.Item label="Рейтинг" name="rating"><InputNumber min={0} max={5} step={0.1} style={{ width: '100%' }} /></Form.Item>
                  <Form.Item label="Транспорт" name="vehicleType"><Select allowClear options={[
                    { label: 'car', value: 'car' },
                    { label: 'bike', value: 'bike' },
                    { label: 'foot', value: 'foot' },
                    { label: 'scooter', value: 'scooter' },
                    { label: 'other', value: 'other' },
                  ]} /></Form.Item>
                  <Form.Item label="Заметки" name="notes"><Input.TextArea rows={3} /></Form.Item>
                  <Button type="primary" htmlType="submit" loading={updateMutation.isLoading}>Сохранить</Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'orders',
            label: 'Заказы курьера',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Space>
                  <Select
                    placeholder="Статус"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    allowClear
                    options={[
                      { label: 'new', value: 'new' },
                      { label: 'assigned', value: 'assigned' },
                      { label: 'picked_up', value: 'picked_up' },
                      { label: 'delivered', value: 'delivered' },
                      { label: 'canceled', value: 'canceled' },
                    ]}
                    style={{ width: 220 }}
                  />
                </Space>
                <Table
                  rowKey="_id"
                  loading={ordersLoading}
                  columns={orderColumns}
                  dataSource={ordersData?.items || []}
                  pagination={{ current: ordersData?.page || pagination.current, pageSize: ordersData?.limit || pagination.pageSize, total: ordersData?.total || 0, showSizeChanger: true }}
                  onChange={(p, f, s) => { setPagination({ current: p.current || 1, pageSize: p.pageSize || 10 }); setSorter({ field: s.field || 'createdAt', order: s.order || 'descend' }); }}
                />
              </Space>
            ),
          },
          {
            key: 'stats',
            label: 'Статистика',
            children: (
              <Card>
                <Descriptions bordered size="middle" column={1}>
                  <Descriptions.Item label="Всего заказов">{statsData?.total || 0}</Descriptions.Item>
                  <Descriptions.Item label="Новые">{statsData?.byStatus?.new || 0}</Descriptions.Item>
                  <Descriptions.Item label="Назначены">{statsData?.byStatus?.assigned || 0}</Descriptions.Item>
                  <Descriptions.Item label="Забраны">{statsData?.byStatus?.picked_up || 0}</Descriptions.Item>
                  <Descriptions.Item label="Доставлены">{statsData?.byStatus?.delivered || 0}</Descriptions.Item>
                  <Descriptions.Item label="Отменены">{statsData?.byStatus?.canceled || 0}</Descriptions.Item>
                </Descriptions>
              </Card>
            ),
          },
        ]}
      />
    </Space>
  );
}
