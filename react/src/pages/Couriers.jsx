import React, { useMemo, useState } from 'react';
import { Table, Tag, Input, Select, Space, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCouriers } from '../api/couriers';

export default function Couriers() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [isAvailable, setIsAvailable] = useState();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [sorter, setSorter] = useState({ field: 'createdAt', order: 'descend' });

  const params = useMemo(() => {
    const p = { page: pagination.current, limit: pagination.pageSize };
    if (q) p.q = q;
    if (typeof isAvailable === 'boolean') p.isAvailable = isAvailable;
    if (sorter && sorter.field) {
      const map = { createdAt: 'createdAt', rating: 'rating', fullName: 'fullName', city: 'city', isAvailable: 'isAvailable' };
      const sortBy = map[sorter.field] || 'createdAt';
      const sortDir = sorter.order === 'ascend' ? 'asc' : 'desc';
      p.sortBy = sortBy;
      p.sortDir = sortDir;
    }
    return p;
  }, [q, isAvailable, pagination, sorter]);

  const { data, isLoading } = useQuery({
    queryKey: ['couriers', params],
    queryFn: () => getCouriers(params),
    keepPreviousData: true,
  });

  const columns = [
    {
      title: 'Имя',
      dataIndex: ['user', 'fullName'],
      key: 'fullName',
      sorter: true,
      render: (text, record) => (
        <Button type="link" onClick={() => navigate(`/couriers/${record._id}`)}>{text || '—'}</Button>
      ),
    },
    { title: 'Телефон', dataIndex: ['user', 'phone'], key: 'phone' },
    { title: 'Город', dataIndex: 'city', key: 'city', sorter: true },
    {
      title: 'Доступен',
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      sorter: true,
      render: (val) => (val ? <Tag color="green">Да</Tag> : <Tag>Нет</Tag>),
    },
    { title: 'Рейтинг', dataIndex: 'rating', key: 'rating', sorter: true },
    { title: 'Транспорт', dataIndex: 'vehicleType', key: 'vehicleType' },
  ];

  const onChange = (paginationArg, filters, sorterArg) => {
    setPagination({ current: paginationArg.current || 1, pageSize: paginationArg.pageSize || 10 });
    setSorter({ field: sorterArg.field || 'createdAt', order: sorterArg.order || 'descend' });
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Space wrap>
        <Input placeholder="Поиск (имя или телефон)" value={q} onChange={(e) => setQ(e.target.value)} allowClear style={{ width: 280 }} />
        <Select
          placeholder="Доступность"
          value={typeof isAvailable === 'boolean' ? (isAvailable ? 'true' : 'false') : undefined}
          onChange={(val) => setIsAvailable(val === 'true' ? true : val === 'false' ? false : undefined)}
          style={{ width: 160 }}
          allowClear
          options={[{ label: 'Доступен', value: 'true' }, { label: 'Недоступен', value: 'false' }]}
        />
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
