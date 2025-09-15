import instance from './axios';

// According to server/src/api_schema.yaml
export async function getOrders(params = {}) {
  const res = await instance.get('/api/orders', { params });
  return res.data;
}

export async function getOrder(id) {
  const res = await instance.get(`/api/orders/${id}`);
  return res.data;
}

export async function createOrder(body) {
  const res = await instance.post('/api/orders', body);
  return res.data;
}

export async function updateOrder(id, body) {
  const res = await instance.put(`/api/orders/${id}`, body);
  return res.data;
}

export async function assignOrder(id, payload) {
  const res = await instance.post(`/api/orders/${id}/assign`, payload);
  return res.data;
}

export async function changeOrderStatus(id, payload) {
  const res = await instance.post(`/api/orders/${id}/status`, payload);
  return res.data;
}

export async function getOrdersStats(params = {}) {
  const res = await instance.get('/api/orders/stats', { params });
  return res.data;
}
