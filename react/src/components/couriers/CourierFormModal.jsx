import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, InputNumber } from 'antd';

const VEHICLE_OPTIONS = [
  { label: 'car', value: 'car' },
  { label: 'bike', value: 'bike' },
  { label: 'foot', value: 'foot' },
  { label: 'scooter', value: 'scooter' },
  { label: 'other', value: 'other' },
];

export default function CourierFormModal({ open, title, loading, mode = 'create', initialValues, onCancel, onSubmit }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (initialValues) {
        const init = { ...initialValues };
        init.fullName = initialValues?.user?.fullName || initialValues?.fullName;
        init.phone = initialValues?.user?.phone || initialValues?.phone;
        init.email = initialValues?.user?.email || initialValues?.email;
        form.setFieldsValue(init);
      }
    }
  }, [open, initialValues, form]);

  const onOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (e) {
      // validation error
    }
  };

  return (
    <Modal
      open={open}
      title={title || (mode === 'create' ? 'Создать курьера' : 'Редактировать курьера')}
      onCancel={onCancel}
      onOk={onOk}
      okText="Сохранить"
      cancelText="Отмена"
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item label="ФИО" name="fullName" rules={mode === 'create' ? [{ required: true, message: 'Введите ФИО' }] : []}>
          <Input placeholder="Введите ФИО" />
        </Form.Item>
        <Form.Item label="Телефон" name="phone" rules={mode === 'create' ? [{ required: true, message: 'Введите телефон' }] : []}>
          <Input placeholder="Введите телефон" />
        </Form.Item>
        <Form.Item label="Email" name="email">
          <Input placeholder="Введите email" />
        </Form.Item>
        <Form.Item label="Город" name="city">
          <Input placeholder="Город" />
        </Form.Item>
        <Form.Item label="Доступен" name="isAvailable" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
        <Form.Item label="Рейтинг" name="rating">
          <InputNumber min={0} max={5} step={0.1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Транспорт" name="vehicleType">
          <Select allowClear options={VEHICLE_OPTIONS} placeholder="Выберите транспорт" />
        </Form.Item>
        <Form.Item label="Заметки" name="notes">
          <Input.TextArea rows={3} placeholder="Комментарий" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
