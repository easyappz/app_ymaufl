import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from '../pages/Login';
import Home from '../pages/Home';
import Couriers from '../pages/Couriers';
import CourierProfile from '../pages/CourierProfile';
import Orders from '../pages/Orders';
import AppLayout from '../components/Layout/AppLayout';

function hasToken() {
  const token = localStorage.getItem('token');
  return Boolean(token);
}

export function ProtectedRoute({ children }) {
  if (!hasToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="/" element={<Home />} />
        <Route path="/couriers" element={<Couriers />} />
        <Route path="/couriers/:id" element={<CourierProfile />} />
        <Route path="/orders" element={<Orders />} />
      </Route>

      <Route path="*" element={<Navigate to={hasToken() ? '/' : '/login'} replace />} />
    </Routes>
  );
}
