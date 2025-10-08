import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { SettingsPage } from './pages/SettingsPage';
import './styles/tailwind.css';

// 根据 URL hash 决定渲染哪个页面
const isSettingsPage = window.location.hash === '#/settings';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isSettingsPage ? <SettingsPage /> : <App />}
  </React.StrictMode>
);
