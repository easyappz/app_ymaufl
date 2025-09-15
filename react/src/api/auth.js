import instance from './axios';

export async function login(payload) {
  // Expected: { email, password } -> { token, user }
  const res = await instance.post('/api/auth/login', payload);
  return res.data;
}

export async function getMe() {
  const res = await instance.get('/api/auth/me');
  return res.data;
}

export async function register(payload) {
  const res = await instance.post('/api/auth/register', payload);
  return res.data;
}

export async function handshake() {
  const res = await instance.get('/api/auth');
  return res.data;
}
