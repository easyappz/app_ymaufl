import React, { useEffect, useMemo, useState } from 'react';
import { Table, Tag, Input, Select, Space, Button, InputNumber, message, Modal } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCouriers, createCourier, updateCourier, deleteCourier } from '../api/couriers';
import CourierFormModal from '../components/couriers/CourierFormModal';

export default function Couriers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [isAvailable, setIsAvailable] = useState(searchParams.get('isAvailable') === 'true' ? true : searchParams.get('isAvailable') === 'false' ? false : undefined);
  const [ratingFrom, setRatingFrom] = useState(searchParams.get('ratingFrom') ? Number(searchParams.get('ratingFrom')) : undefined);
  const [ratingTo, setRatingTo] = useState(searchParams.get('ratingTo') ? Number(searchParams.get('ratingTo')) : undefined);

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [sorter, setSorter] = useState({ field: 'createdAt', order: 'descend' });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState(null);

  useEffect(() => {
    const newParams = {};
    if (q) newParams.q = q;
    if (city) newParams.city = city;
    if (typeof isAvailable === 'boolean') newParams.isAvailable = String(isAvailable);
    if (typeof ratingFrom === 'number') newParams.ratingFrom = String(ratingFrom);
    if (typeof ratingTo === 'number') newParams.ratingTo = String(ratingTo);
    setSearchParams(newParams);
  }, [q, city, isAvailable, ratingFrom, ratingTo, setSearchParams]);

  const params = useMemo(() => {
    const p = { page: pagination.current, limit: pagination.pageSize };
    if (q) p.q = q;
    if (city) p.city = city;
    if (typeof isAvailable === 'boolean') p.isAvailable = isAvailable;
    if (typeof ratingFrom === 'number') p.ratingFrom = ratingFrom;
    if (typeof ratingTo === 'number') p.ratingTo = ratingTo;
    if (sorter && sorter.field) {
      const map = { createdAt: 'createdAt', rating: 'rating', fullName: 'fullName', city: 'city', isAvailable: 'isAvailable' };
      const sortBy = map[sorter.field] || 'createdAt';
      const sortDir = sorter.order === 'ascend' ? 'asc' : 'desc';
      p.sortBy = sortBy;
      p.sortDir = sortDir;
    }
    return p;
  }, [q, city, isAvailable, ratingFrom, ratingTo, pagination, sorter]);

  const { data, isLoading } = useQuery({
    queryKey: ['couriers', params],
    queryFn: () => getCouriers(params),
    keepPreviousData: true,
  });

  const createMutation = useMutation({
    mutationFn: createCourier,
    onSuccess: async () => {
      message.success('Курьер создан');
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['couriers'] });
    },
    onError: () => message.error('Не удалось создать курьера'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => updateCourier(id, values),
    onSuccess: async () => {
      message.success('Курьер обновлён');
      setEditOpen(false);
      setEditingCourier(null);
      await queryClient.invalidateQueries({ queryKey: ['couriers'] });
    },
    onError: () => message.error('Не удалось обновить курьера'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCourier(id, { hard: false }),
    onSuccess: async () => {
      message.success('Курьер удалён');
      await queryClient.invalidateQueries({ queryKey: ['couriers'] });
    },
    onError: () => message.error('Не удалось удалить курьера'),
  });

  const columns = [
    {
      title: 'ФИО',
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
      title: 'Статус',
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      sorter: true,
      render: (val) => (val ? <Tag color="green">Доступен</Tag> : <Tag>Недоступен</Tag>),
    },
    { title: 'Рейтинг', dataIndex: 'rating', key: 'rating', sorter: true },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => navigate(`/couriers/${record._id}`)}>Просмотр</Button>
          <Button onClick={() => { setEditingCourier(record); setEditOpen(true); }}>Редактировать</Button>
          <Button danger onClick={() => {
            Modal.confirm({
              title: 'Удалить курьера?',
              content: 'Будет выполнено мягкое удаление (деактивация).',
              okText: 'Удалить',
              cancelText: 'Отмена',
              onOk: () => deleteMutation.mutate(record._id),
            });
          }}>Удалить</Button>
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
        <Input placeholder="Поиск (ФИО или телефон)" value={q} onChange={(e) => setQ(e.target.value)} allowClear style={{ width: 280 }} />
        <Input placeholder="Город" value={city} onChange={(e) => setCity(e.target.value)} allowClear style={{ width: 200 }} />
        <Select
          placeholder="Доступность"
          value={typeof isAvailable === 'boolean' ? (isAvailable ? 'true' : 'false') : undefined}
          onChange={(val) => setIsAvailable(val === 'true' ? true : val === 'false' ? false : undefined)}
          style={{ width: 160 }}
          allowClear
          options={[{ label: 'Доступен', value: 'true' }, { label: 'Недоступен', value: 'false' }]}
        />
        <InputNumber placeholder="Рейтинг от" value={ratingFrom} onChange={setRatingFrom} min={0} max={5} step={0.1} />
        <InputNumber placeholder="Рейтинг до" value={ratingTo} onChange={setRatingTo} min={0} max={5} step={0.1} />
        <Button type="primary" onClick={() => setCreateOpen(true)}>Создать курьера</Button>
      </Space>
      <Table
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items || []}
        pagination={{ current: data?.page || pagination.current, pageSize: data?.limit || pagination.pageSize, total: data?.total || 0, showSizeChanger: true }}
        onChange={onChange}
      />

      <CourierFormModal
        open={createOpen}
        title="Создать курьера"
        mode="create"
        loading={createMutation.isLoading}
        onCancel={() => setCreateOpen(false)}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <CourierFormModal
        open={editOpen}
        title="Редактировать курьера"
        mode="edit"
        initialValues={editingCourier}
        loading={updateMutation.isLoading}
        onCancel={() => { setEditOpen(false); setEditingCourier(null); }}
        onSubmit={(values) => {
          const payload = {
            city: values.city,
            isAvailable: values.isAvailable,
            rating: values.rating,
            vehicleType: values.vehicleType,
            notes: values.notes,
            user: {
              fullName: values.fullName,
              phone: values.phone,
              email: values.email,
            },
          };
          updateMutation.mutate({ id: editingCourier._id, values: payload });
        }}
      />
    </Space>
  );
}
