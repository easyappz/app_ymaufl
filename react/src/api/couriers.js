import instance from './axios';

// According to server/src/api_schema.yaml
export async function getCouriers(params = {}) {
  const res = await instance.get('/api/couriers', { params });
  return res.data;
}

export async function getCourier(id) {
  const res = await instance.get(`/api/couriers/${id}`);
  return res.data;
}

export async function createCourier(body) {
  const res = await instance.post('/api/couriers', body);
  return res.data;
}

export async function updateCourier(id, body) {
  const res = await instance.put(`/api/couriers/${id}`, body);
  return res.data;
}

export async function deleteCourier(id, options = {}) {
  const params = {};
  if (typeof options.hard === 'boolean') params.hard = options.hard;
  const res = await instance.delete(`/api/couriers/${id}`, { params });
  return res.data;
}
