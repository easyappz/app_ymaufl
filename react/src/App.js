import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import 'antd/dist/reset.css';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { queryClient } from './hooks/query';
import AppRouter from './router';

dayjs.locale('ru');

function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider locale={ruRU}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </QueryClientProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
