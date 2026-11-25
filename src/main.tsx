import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider } from '../Auth.Client/context/AuthContext';
import { ToastProvider } from '../ecommerce.client/context/ToastContext';
import { CartProvider } from '../ecommerce.client/context/CartContext';
import { PermissionProvider } from '../ecommerce.client/context/PermissionContext';
import { RouteRenderer } from 'shared-ui/router/RouteRenderer';
import { EcommerceRoutes } from '../ecommerce.client/routes/routes';
import './global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0096C7',
          borderRadius: 8,
          fontSize: 13,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          colorBgBase: '#ffffff',
          colorTextBase: '#1e293b',
          colorBorder: '#e2e8f0',
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <PermissionProvider>
                <React.Suspense
                  fallback={
                    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center font-sans">
                      <div className="text-center space-y-4">
                        <div className="w-10 h-10 border-4 border-[#0096C7] border-t-transparent rounded-full animate-spin mx-auto" />
                        <span className="text-xs text-slate-500 tracking-wider font-medium">
                          Loading Workspace...
                        </span>
                      </div>
                    </div>
                  }
                >
                  <RouteRenderer config={EcommerceRoutes} />
                </React.Suspense>
              </PermissionProvider>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);
