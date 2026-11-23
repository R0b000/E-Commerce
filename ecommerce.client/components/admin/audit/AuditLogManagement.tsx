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
import { Tag, Spin, Breadcrumb, Dropdown } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { AuditLogItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppTable,
  AppButton,
  AppInput,
  AppSelect,
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

  // Summary Metrics
  const totalLogsCount = filteredLogs.length;
  const successCount = filteredLogs.filter((l) => (l.statusCode || 200) >= 200 && (l.statusCode || 200) < 300).length;
  const securityEventCount = filteredLogs.filter((l) => (l.statusCode || 200) >= 400).length;
  const uniqueUsersCount = new Set(filteredLogs.map((l) => l.userEmail || l.userName).filter(Boolean)).size;

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden font-['Poppins','Inter',sans-serif] space-y-2.5">
      {/* Top Bar: Breadcrumb */}
      <div className="shrink-0">
        <Breadcrumb
          className="text-[11px] leading-none text-slate-500 [&_*]:border-0 font-semibold"
          items={[
            {
              title: (
                <Link to="/admin" className="text-slate-500 hover:text-[#0096C7] transition-colors font-semibold">
                  Admin
                </Link>
              ),
            },
            {
              title: <span className="text-slate-800 font-bold">Audit Logs</span>,
            },
          ]}
        />
      </div>

      {/* Two-Column Responsive Layout: Left Table Directory + Right Summary & Actions (Independent Scroll) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: User Activity & Security Audit Logs Table */}
        <div className="flex-1 min-w-0 h-full bg-white rounded-t-2xl rounded-b-[2px] shadow-xs overflow-hidden flex flex-col">
          {/* Header Toolbar: Title + Search + Action Filter */}
          <div className="pl-0 pr-4 py-3 flex items-center justify-between gap-3 bg-white shrink-0">
            <div className="shrink-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Audit Logs
              </h3>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {/* Search Input */}
              <div className="w-full sm:w-[220px]">
                <AppInput
                  prefix={<SearchOutlined className="text-slate-400" />}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search user, action, IP..."
                  allowClear
                />
              </div>

              {/* Action Filter */}
              <div className="w-[150px] shrink-0">
                <AppSelect
                  value={actionFilter}
                  onChange={(val) => {
                    setActionFilter(val as string);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Actions', value: 'all' },
                    { label: 'User Logins', value: 'USER_LOGIN' },
                    { label: 'Passkey Auth', value: 'FIDO2_PASSKEY_AUTH' },
                    { label: 'Product Events', value: 'CREATE_PRODUCT' },
                    { label: 'Order Updates', value: 'UPDATE_ORDER_STATUS' },
                    { label: 'Reviews', value: 'SUBMIT_REVIEW' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Table Body (Independent Scroll Area) */}
          <div className="flex-1 min-h-0 overflow-y-auto brand-table-scroll">
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

          {/* Table Footer: Matching Brand pagination footer */}
          <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-[2px] flex items-center justify-between text-[11px] shadow-inner select-none shrink-0">
            {/* Left Side: Count */}
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-medium text-white/90 text-[11px] leading-none">Total Logs:</span>
              <span className="font-bold text-white text-[11px] leading-none">
                {filteredLogs.length} Items
              </span>
            </div>

            {/* Right Side: Pagination Controls */}
            {filteredLogs.length > 0 && (
              <div className="flex items-center gap-2.5 leading-none">
                <div className="flex items-center gap-1.5 text-[10px] text-white/95 font-medium leading-none">
                  <span>Items:</span>
                  <Dropdown
                    menu={{
                      items: [
                        { key: '10', label: <span className="font-semibold text-xs text-slate-800">10 / page</span> },
                        { key: '20', label: <span className="font-semibold text-xs text-slate-800">20 / page</span> },
                        { key: '50', label: <span className="font-semibold text-xs text-slate-800">50 / page</span> },
                      ],
                      selectedKeys: [String(pageSize)],
                      onClick: ({ key }) => {
                        setPageSize(Number(key));
                        setCurrentPage(1);
                      },
                    }}
                    trigger={['click']}
                    placement="topRight"
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 active:bg-white/40 border border-white/35 text-white font-bold text-[10px] rounded px-1.5 h-[20px] outline-none cursor-pointer transition-all leading-none"
                      title="Change page size"
                    >
                      <span>{pageSize}</span>
                      <DownOutlined className="text-[7px] text-white/85" />
                    </button>
                  </Dropdown>
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
                    className="!w-5 !h-5 !min-w-0 !min-h-0 p-0 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20 leading-none"
                  >
                    <LeftOutlined className="text-[8px]" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    title="Next page"
                    className="!w-5 !h-5 !min-w-0 !min-h-0 p-0 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20 leading-none"
                  >
                    <RightOutlined className="text-[8px]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Refresh Button + Audit Summary Metrics (Independent Scroll Area) */}
        <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 h-full overflow-y-auto brand-sidebar-scroll space-y-3.5 pr-1">
          {/* Card 1: Refresh Logs */}
          <div className="bg-white rounded-2xl shadow-xs px-4 py-3 flex items-center">
            <button
              type="button"
              onClick={loadLogs}
              className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <SyncOutlined className={`text-xs ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Audit Logs</span>
            </button>
          </div>

          {/* Card 2: Security & Activity Summary (Static Clean View) */}
          <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-xs font-bold text-slate-900">Security Summary</h4>
              <span className="text-[10px] font-bold text-[#0096C7] bg-sky-50 px-2.5 py-0.5 rounded-full">
                Live Audit
              </span>
            </div>

            <div className="space-y-1">
              {/* Metric 1: Total Logs */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Total Events
                  </span>
                  <span className="text-2xl font-black text-slate-900 leading-tight block">
                    {totalLogsCount}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Recorded actions
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0096C7] flex items-center justify-center text-lg shrink-0">
                  <HistoryOutlined />
                </div>
              </div>

              {/* Metric 2: Successful Actions */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Successful Operations
                  </span>
                  <span className="text-2xl font-black text-emerald-600 leading-tight block">
                    {successCount}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    HTTP 2xx responses
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                  <SafetyOutlined />
                </div>
              </div>

              {/* Metric 3: Security & Error Events */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Security / Errors
                  </span>
                  <span className="text-2xl font-black text-rose-600 leading-tight block">
                    {securityEventCount}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    HTTP 4xx / 5xx alerts
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg shrink-0">
                  <KeyOutlined />
                </div>
              </div>

              {/* Metric 4: Unique Operators */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Active Operators
                  </span>
                  <span className="text-2xl font-black text-purple-600 leading-tight block">
                    {uniqueUsersCount}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Distinct accounts
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shrink-0">
                  <GlobalOutlined />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogManagement;
