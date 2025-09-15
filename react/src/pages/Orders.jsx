import React, { useEffect, useMemo, useState } from 'react';
import { Table, Tag, Input, Select, Space, DatePicker, Button, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignOrder, changeOrderStatus, createOrder, getOrders, updateOrder } from '../api/orders';
import { getCouriers } from '../api/couriers';
import OrderFormModal from '../components/orders/OrderFormModal';
import AssignCourierModal from '../components/orders/AssignCourierModal';
import StatusModal from '../components/orders/StatusModal';

const { RangePicker } = DatePicker;

const statusColors = {
  new: 'blue',
  assigned: 'gold',
  picked_up: 'purple',
  delivered: 'green',
  canceled: 'red',
};

export default function Orders() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState();
  const [range, setRange] = useState([null, null]);
  const [courierId, setCourierId] = useState();
  const [courierSearch, setCourierSearch] = useState('');
  const [courierOptions, setCourierOptions] = useState([]);

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [sorter, setSorter] = useState({ field: 'createdAt', order: 'descend' });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchCouriers() {
      try {
        const data = await getCouriers({ q: courierSearch, page: 1, limit: 10 });
        if (ignore) return;
        setCourierOptions((data?.items || []).map((c) => ({
          label: c?.user?.fullName ? `${c.user.fullName}${c.user.phone ? ` (${c.user.phone})` : ''}` : (c?.user?.phone || c?._id),
          value: c._id,
        })));
      } catch (e) {
        // handled globally
      }
    }
    fetchCouriers();
    return () => { ignore = true; };
  }, [courierSearch]);

  const params = useMemo(() => {
    const p = { page: pagination.current, limit: pagination.pageSize };
    if (q) p.q = q;
    if (status) p.status = status;
    if (range[0]) p.createdFrom = range[0].toISOString();
    if (range[1]) p.createdTo = range[1].toISOString();
    if (courierId) p.courierId = courierId;
    if (sorter && sorter.field) {
      const map = { createdAt: 'createdAt', price: 'price', status: 'status', number: 'number', customerName: 'customerName' };
      const sortBy = map[sorter.field] || 'createdAt';
      const sortDir = sorter.order === 'ascend' ? 'asc' : 'desc';
      p.sortBy = sortBy;
      p.sortDir = sortDir;
    }
    return p;
  }, [q, status, range, courierId, pagination, sorter]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'list', params],
    queryFn: () => getOrders(params),
    keepPreviousData: true,
  });

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: async () => {
      message.success('Заказ создан');
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => message.error('Не удалось создать заказ'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => updateOrder(id, values),
    onSuccess: async () => {
      message.success('Заказ обновлён');
      setEditOpen(false);
      setEditingOrder(null);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => message.error('Не удалось обновить заказ'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, courierId: cId }) => assignOrder(id, { courierId: cId }),
    onSuccess: async () => {
      message.success('Назначение обновлено');
      setAssignOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => message.error('Не удалось изменить назначение'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status: st }) => changeOrderStatus(id, { status: st }),
    onSuccess: async () => {
      message.success('Статус изменён');
      setStatusOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => message.error('Не удалось изменить статус'),
  });

  const columns = [
    { title: 'Номер', dataIndex: 'number', key: 'number', sorter: true },
    { title: 'Клиент', dataIndex: 'customerName', key: 'customerName', sorter: true },
    { title: 'Телефон', dataIndex: 'customerPhone', key: 'customerPhone' },
    { title: 'Откуда', dataIndex: 'addressFrom', key: 'addressFrom' },
    { title: 'Куда', dataIndex: 'addressTo', key: 'addressTo' },
    { title: 'Цена', dataIndex: 'price', key: 'price', sorter: true },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      sorter: true,
      render: (val) => <Tag color={statusColors[val] || 'default'}>{val}</Tag>,
    },
    { title: 'Курьер', dataIndex: ['courier', 'user', 'fullName'], key: 'courierName' },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => { setEditingOrder(record); setEditOpen(true); }}>Редактировать</Button>
          <Button onClick={() => { setEditingOrder(record); setAssignOpen(true); }}>Назначить</Button>
          <Button onClick={() => { setEditingOrder(record); setStatusOpen(true); }}>Статус</Button>
        </Space>
      ),
    },
  ];

  const onChange = (paginationArg, filters, sorterArg) => {
    setPagination({ current: paginationArg.current || 1, pageSize: paginationArg.pageSize || 10 });
    setSorter({ field: sorterArg.field || 'createdAt', order: sorterArg.order || 'descend' });
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Space wrap>
        <Input placeholder="Поиск (номер или клиент)" value={q} onChange={(e) => setQ(e.target.value)} allowClear style={{ width: 280 }} />
        <Select
          placeholder="Статус"
          value={status}
          style={{ width: 200 }}
          allowClear
          options={[
            { label: 'new', value: 'new' },
            { label: 'assigned', value: 'assigned' },
            { label: 'picked_up', value: 'picked_up' },
            { label: 'delivered', value: 'delivered' },
            { label: 'canceled', value: 'canceled' },
          ]}
          onChange={setStatus}
        />
        <Select
          placeholder="Курьер"
          value={courierId}
          allowClear
          showSearch
          filterOption={false}
          onSearch={setCourierSearch}
          onChange={setCourierId}
          options={courierOptions}
          style={{ width: 280 }}
        />
        <RangePicker value={range} onChange={(vals) => setRange(vals || [null, null])} />
        <Button type="primary" onClick={() => setCreateOpen(true)}>Создать заказ</Button>
      </Space>
      <Table
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items || []}
        pagination={{ current: data?.page || pagination.current, pageSize: data?.limit || pagination.pageSize, total: data?.total || 0, showSizeChanger: true }}
        onChange={onChange}
      />

      <OrderFormModal
        open={createOpen}
        title="Новый заказ"
        loading={createMutation.isLoading}
        onCancel={() => setCreateOpen(false)}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <OrderFormModal
        open={editOpen}
        title="Редактировать заказ"
        initialValues={editingOrder}
        loading={updateMutation.isLoading}
        onCancel={() => { setEditOpen(false); setEditingOrder(null); }}
        onSubmit={(values) => {
          const payload = {
            number: values.number,
            customerName: values.customerName,
            customerPhone: values.customerPhone,
            addressFrom: values.addressFrom,
            addressTo: values.addressTo,
            price: values.price,
            notes: values.notes,
          };
          updateMutation.mutate({ id: editingOrder._id, values: payload });
        }}
      />

      <AssignCourierModal
        open={assignOpen}
        initialCourierId={editingOrder?.courier?._id}
        onCancel={() => { setAssignOpen(false); setEditingOrder(null); }}
        onSubmit={(cId) => assignMutation.mutate({ id: editingOrder._id, courierId: cId })}
      />

      <StatusModal
        open={statusOpen}
        currentStatus={editingOrder?.status}
        onCancel={() => { setStatusOpen(false); setEditingOrder(null); }}
        onSubmit={(st) => statusMutation.mutate({ id: editingOrder._id, status: st })}
      />
    </Space>
  );
}
