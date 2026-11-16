import React, { useEffect, useState } from 'react';
import {
  HistoryOutlined,
  SyncOutlined,
  SearchOutlined,
  SafetyOutlined,
  LaptopOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  LoginOutlined,
  KeyOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Tag, Spin } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { AuditLogItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppCard,
  AppButton,
  AppInput,
  PageHeader,
} from 'shared-components';

export const AuditLogManagement: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const { showToast } = useToast();

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await ecommerceService.getAuditLogs({
        action: actionFilter !== 'all' ? actionFilter : undefined,
      });
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch {
      showToast('Failed to load user activity audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.userEmail?.toLowerCase().includes(q) ||
      l.userName?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.ipAddress?.toLowerCase().includes(q) ||
      l.endpoint?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="User Activity & Security Audit Logs"
        description="Tamper-evident trail of user actions, login IPs, MAC/device telemetry, and administrative mutations."
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Audit Logs' }]}
        extra={
          <AppButton icon={<SyncOutlined />} onClick={loadLogs}>
            Refresh Logs
          </AppButton>
        }
      />

      {/* Filter and Search Bar */}
      <AppCard>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="w-full md:w-[40vw]">
            <AppInput
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user, IP address, action, or route..."
              allowClear
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { key: 'all', label: 'All Actions', icon: null },
              { key: 'USER_LOGIN', label: 'Logins', icon: <LoginOutlined /> },
              { key: 'FIDO2_PASSKEY_AUTH', label: 'FIDO2 Auth', icon: <KeyOutlined /> },
              { key: 'CREATE_PRODUCT', label: 'Products', icon: <AppstoreOutlined /> },
              { key: 'UPDATE_ORDER_STATUS', label: 'Orders', icon: <ShoppingCartOutlined /> },
              { key: 'SUBMIT_REVIEW', label: 'Reviews', icon: <StarOutlined /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActionFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                  actionFilter === tab.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </AppCard>

      {/* Audit Log Table */}
      <AppCard bodyStyle={{ padding: 0 }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-4">User & Role</th>
                <th className="py-3.5 px-4">Action Performed</th>
                <th className="py-3.5 px-4">Endpoint & Method</th>
                <th className="py-3.5 px-4">Device & IP</th>
                <th className="py-3.5 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                    <Spin />
                    <p className="mt-2 text-xs">Loading audit events...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    No activity logs recorded matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const logId = log._id || log.id;
                  const timeStr = log.createdAt
                    ? new Date(log.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '';
                  const dateStr = log.createdAt
                    ? new Date(log.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '';

                  return (
                    <tr key={logId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-6 whitespace-nowrap text-xs text-slate-500 font-mono">
                        <div>{dateStr}</div>
                        <div className="text-[11px] text-slate-400">{timeStr}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-xs">
                          {log.userName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {log.userEmail}
                        </div>
                        <Tag
                          className="font-bold text-[10px] uppercase px-1.5 py-0.2 mt-0.5 rounded"
                          color={
                            log.userRole === 'admin'
                              ? 'processing'
                              : log.userRole === 'seller'
                              ? 'orange'
                              : 'default'
                          }
                        >
                          {log.userRole}
                        </Tag>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-800 rounded-lg">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        <span className="font-bold text-slate-900 mr-1.5">{log.method}</span>
                        <span className="text-slate-500">{log.endpoint}</span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-600 font-mono">
                        <div className="flex items-center gap-1">
                          <GlobalOutlined className="text-slate-400 shrink-0" />
                          <span>{log.ipAddress || '127.0.0.1'}</span>
                        </div>
                        {log.macOrDevice && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <LaptopOutlined className="shrink-0" />
                            <span className="truncate max-w-[120px]">MAC: {log.macOrDevice}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-6 text-right font-mono">
                        <Tag
                          color={
                            log.statusCode >= 200 && log.statusCode < 300
                              ? 'success'
                              : log.statusCode >= 400
                              ? 'error'
                              : 'default'
                          }
                          className="font-bold text-xs"
                        >
                          {log.statusCode || 200}
                        </Tag>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>
  );
};

export default AuditLogManagement;
