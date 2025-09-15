import React, { useState, useEffect } from 'react';
import { Modal, Select } from 'antd';

const STATUS_OPTIONS = [
  { label: 'new', value: 'new' },
  { label: 'assigned', value: 'assigned' },
  { label: 'picked_up', value: 'picked_up' },
  { label: 'delivered', value: 'delivered' },
  { label: 'canceled', value: 'canceled' },
];

export default function StatusModal({ open, currentStatus, onCancel, onSubmit }) {
  const [status, setStatus] = useState(currentStatus || 'new');

  useEffect(() => {
    setStatus(currentStatus || 'new');
  }, [currentStatus, open]);

  return (
    <Modal
      open={open}
      title="Сменить статус"
      onCancel={onCancel}
      onOk={() => onSubmit(status)}
      okText="Сохранить"
      cancelText="Отмена"
      destroyOnClose
    >
      <Select style={{ width: '100%' }} value={status} options={STATUS_OPTIONS} onChange={setStatus} />
    </Modal>
  );
}
