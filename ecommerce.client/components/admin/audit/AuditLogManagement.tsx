import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  LeftOutlined,
  RightOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { Tag, Spin, Breadcrumb } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { AuditLogItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppCard,
  AppTable,
  AppButton,
  AppInput,
  PageHeader,
  TableSkeleton,
} from 'shared-components';

export const AuditLogManagement: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full font-['Poppins','Inter',sans-serif]">
      {/* Breadcrumb Navigation */}
      <div className="px-2 flex items-center gap-1.5 text-[11px] leading-none text-slate-400 mb-0 pb-0">
        <Breadcrumb
          className="text-[11px] leading-none text-slate-400 [&_*]:border-0"
          items={[
            {
              title: (
                <Link to="/admin" className="text-slate-400 hover:text-[#0096C7] transition-colors">
                  Admin
                </Link>
              ),
            },
            {
              title: <span className="text-slate-600 font-medium">Audit Logs</span>,
            },
          ]}
        />
      </div>

      {/* Main Audit Logs Card with Integrated Header */}
      <div className="bg-white rounded-t-2xl rounded-b-md shadow-xs">
        {/* Table Top Controls & Integrated Header (relative z-20 so dropdown floats cleanly over table) */}
        <div className="px-2 py-3 sm:py-3.5 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white relative z-20 rounded-t-2xl">
          <div className="flex flex-col min-w-0">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              User Activity & Security Audit Logs
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Tamper-evident trail of user actions, login IPs, MAC/device telemetry, and administrative mutations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="w-full sm:w-[220px] shrink-0">
              <AppInput
                prefix={<SearchOutlined className="text-slate-400" />}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search logs..."
                allowClear
              />
            </div>

            {/* Action Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { key: 'all', label: 'All', icon: null },
                { key: 'USER_LOGIN', label: 'Logins', icon: <LoginOutlined /> },
                { key: 'FIDO2_PASSKEY_AUTH', label: 'FIDO2', icon: <KeyOutlined /> },
                { key: 'CREATE_PRODUCT', label: 'Products', icon: <AppstoreOutlined /> },
                { key: 'UPDATE_ORDER_STATUS', label: 'Orders', icon: <ShoppingCartOutlined /> },
                { key: 'SUBMIT_REVIEW', label: 'Reviews', icon: <StarOutlined /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActionFilter(tab.key);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1 ${
                    actionFilter === tab.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Log Table Wrapper */}
        <div className="overflow-hidden">
          <AppTable>
            <thead>
              <tr>
                <th className="py-2.5 px-6 font-medium text-[12px]">Timestamp</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">User & Role</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Action Performed</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Endpoint & Method</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Device & IP</th>
                <th className="py-2.5 px-6 text-right font-medium text-[12px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <TableSkeleton columns={6} rows={6} hasAvatar={false} />
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    No activity logs recorded matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
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
          </AppTable>
        </div>

        {/* Table Footer: Count on Left, Pagination on Right (Matching Header Height ~30px & Subtle Roundness rounded-b-md) */}
        <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-md flex items-center justify-between text-[11px] shadow-inner select-none">
          {/* Left Side: Count */}
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-medium text-white/90 text-[11px] leading-none">Total Logs:</span>
            <span className="font-bold text-white text-[11px] leading-none">
              {filteredLogs.length} Items
            </span>
          </div>

          {/* Right Side: Pagination Controls (Rendered ONLY if filteredLogs > 10) */}
          {filteredLogs.length > 10 && (
            <div className="flex items-center gap-2.5 leading-none">
              <div className="flex items-center gap-1 text-[10px] text-white/95 font-medium leading-none">
                <span>Rows:</span>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="appearance-none bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-[10px] rounded pl-1.5 pr-4 py-0 outline-none cursor-pointer transition-colors focus:ring-1 focus:ring-white h-[20px] leading-none"
                  >
                    <option value={10} className="bg-slate-800 text-white">10</option>
                    <option value={20} className="bg-slate-800 text-white">20</option>
                    <option value={50} className="bg-slate-800 text-white">50</option>
                    <option value={100} className="bg-slate-800 text-white">100</option>
                  </select>
                  <DownOutlined className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[7px] text-white/80" />
                </div>
              </div>

              <span className="text-[10px] text-white/95 font-medium whitespace-nowrap leading-none">
                {filteredLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                  className="w-5 h-5 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20"
                >
                  <LeftOutlined className="text-[8px]" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next page"
                  className="w-5 h-5 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20"
                >
                  <RightOutlined className="text-[8px]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogManagement;
