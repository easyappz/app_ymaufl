import React, { useMemo, useState } from 'react';
import { Table, Tag, Input, Select, Space, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../api/orders';

const { RangePicker } = DatePicker;

const statusColors = {
  new: 'blue',
  assigned: 'gold',
  picked_up: 'purple',
  delivered: 'green',
  canceled: 'red',
};

export default function Orders() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState();
  const [range, setRange] = useState([null, null]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [sorter, setSorter] = useState({ field: 'createdAt', order: 'descend' });

  const params = useMemo(() => {
    const p = { page: pagination.current, limit: pagination.pageSize };
    if (q) p.q = q;
    if (status) p.status = status;
    if (range[0]) p.createdFrom = range[0].toISOString();
    if (range[1]) p.createdTo = range[1].toISOString();
    if (sorter && sorter.field) {
      const map = { createdAt: 'createdAt', price: 'price', status: 'status', number: 'number', customerName: 'customerName' };
      const sortBy = map[sorter.field] || 'createdAt';
      const sortDir = sorter.order === 'ascend' ? 'asc' : 'desc';
      p.sortBy = sortBy;
      p.sortDir = sortDir;
    }
    return p;
  }, [q, status, range, pagination, sorter]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'list', params],
    queryFn: () => getOrders(params),
    keepPreviousData: true,
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
        <RangePicker value={range} onChange={(vals) => setRange(vals || [null, null])} />
      </Space>
      <Table
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items || []}
        pagination={{ current: data?.page || pagination.current, pageSize: data?.limit || pagination.pageSize, total: data?.total || 0, showSizeChanger: true }}
        onChange={onChange}
      />
    </Space>
  );
}
