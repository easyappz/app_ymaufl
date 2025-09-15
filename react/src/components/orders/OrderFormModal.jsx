import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Space } from 'antd';
import { getCouriers } from '../../api/couriers';

export default function OrderFormModal({ open, title, loading, initialValues, onCancel, onSubmit }) {
  const [form] = Form.useForm();
  const [courierOptions, setCourierOptions] = useState([]);
  const [courierSearch, setCourierSearch] = useState('');
  const [courierLoading, setCourierLoading] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (initialValues) {
        const init = { ...initialValues };
        init.courierId = initialValues?.courier?._id || undefined;
        form.setFieldsValue(init);
        // Preload options if editing with selected courier
        if (initialValues?.courier?._id) {
          setCourierOptions([
            {
              label: initialValues.courier?.user?.fullName || 'Без имени',
              value: initialValues.courier._id,
            },
          ]);
        }
      }
    }
  }, [open, initialValues, form]);

  useEffect(() => {
    let ignore = false;
    async function fetchCouriers() {
      setCourierLoading(true);
      try {
        const data = await getCouriers({ q: courierSearch, limit: 10, page: 1 });
        if (ignore) return;
        const opts = (data?.items || []).map((c) => ({
          label: c?.user?.fullName ? `${c.user.fullName}${c.user.phone ? ` (${c.user.phone})` : ''}` : (c?.user?.phone || c?._id),
          value: c._id,
        }));
        setCourierOptions(opts);
      } catch (e) {
        // ignore, handled globally
      } finally {
        if (!ignore) setCourierLoading(false);
      }
    }
    fetchCouriers();
    return () => {
      ignore = true;
    };
  }, [courierSearch]);

  const onOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (e) {
      // validation error
    }
  };

  const priceFormatter = (value) => {
    if (typeof value !== 'number' && typeof value !== 'string') return '';
    const s = String(value);
    let res = '';
    let cnt = 0;
    for (let i = s.length - 1; i >= 0; i -= 1) {
      res = s[i] + res;
      cnt += 1;
      if (cnt === 3 && i !== 0) {
        res = ' ' + res;
        cnt = 0;
      }
    }
    return res;
  };

  return (
    <Modal
      open={open}
      title={title || 'Заказ'}
      onCancel={onCancel}
      onOk={onOk}
      okText="Сохранить"
      cancelText="Отмена"
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ price: 0 }}>
        <Form.Item label="Номер заказа" name="number" rules={[{ required: true, message: 'Введите номер заказа' }]}>
          <Input placeholder="Напр. ORD-2025-000123" />
        </Form.Item>
        <Form.Item label="Имя клиента" name="customerName" rules={[{ required: true, message: 'Введите имя клиента' }]}>
          <Input placeholder="Введите имя клиента" />
        </Form.Item>
        <Form.Item label="Телефон клиента" name="customerPhone" rules={[{ required: true, message: 'Введите телефон клиента' }]}>
          <Input placeholder="Введите телефон клиента" />
        </Form.Item>
        <Space.Compact style={{ width: '100%' }}>
          <Form.Item label="Откуда" name="addressFrom" style={{ flex: 1 }} rules={[{ required: true, message: 'Укажите адрес отправления' }]}>
            <Input placeholder="Адрес отправления" />
          </Form.Item>
          <Form.Item label="Куда" name="addressTo" style={{ flex: 1, marginLeft: 8 }} rules={[{ required: true, message: 'Укажите адрес доставки' }]}>
            <Input placeholder="Адрес доставки" />
          </Form.Item>
        </Space.Compact>
        <Form.Item label="Цена" name="price" rules={[{ required: true, message: 'Введите цену' }]}>
          <InputNumber style={{ width: '100%' }} min={0} step={1} formatter={priceFormatter} parser={(v) => (v ? v.split(' ').join('') : 0)} />
        </Form.Item>
        <Form.Item label="Курьер (опционально)" name="courierId">
          <Select
            allowClear
            showSearch
            placeholder="Выберите курьера"
            options={courierOptions}
            loading={courierLoading}
            onSearch={setCourierSearch}
            filterOption={false}
          />
        </Form.Item>
        <Form.Item label="Заметки" name="notes">
          <Input.TextArea rows={3} placeholder="Дополнительная информация" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
