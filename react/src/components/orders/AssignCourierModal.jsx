import React, { useEffect, useState } from 'react';
import { Modal, Select, Button, Space } from 'antd';
import { getCouriers } from '../../api/couriers';

export default function AssignCourierModal({ open, onCancel, onSubmit, initialCourierId }) {
  const [courierOptions, setCourierOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [value, setValue] = useState(initialCourierId || undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(initialCourierId || undefined);
  }, [initialCourierId]);

  useEffect(() => {
    let ignore = false;
    async function fetch() {
      setLoading(true);
      try {
        const data = await getCouriers({ q: search, isAvailable: true, page: 1, limit: 10 });
        if (ignore) return;
        setCourierOptions((data?.items || []).map((c) => ({
          label: c?.user?.fullName ? `${c.user.fullName}${c.user.phone ? ` (${c.user.phone})` : ''}` : (c?.user?.phone || c?._id),
          value: c._id,
        })));
      } catch (e) {
        // handled globally
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetch();
    return () => { ignore = true; };
  }, [search]);

  return (
    <Modal
      open={open}
      title="Назначить курьера"
      onCancel={onCancel}
      onOk={() => onSubmit(value)}
      okText="Сохранить"
      cancelText="Отмена"
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Select
          allowClear
          showSearch
          placeholder="Выберите курьера"
          value={value}
          onChange={setValue}
          options={courierOptions}
          loading={loading}
          onSearch={setSearch}
          filterOption={false}
        />
        <Button danger onClick={() => onSubmit(null)}>Снять назначение</Button>
      </Space>
    </Modal>
  );
}
