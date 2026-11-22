import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  PrinterOutlined,
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  CreditCardOutlined,
  LeftOutlined,
  RightOutlined,
  DownOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { Tag, Spin, Breadcrumb, Popconfirm } from 'antd';
import { useAuth } from 'auth-client/hooks/useAuth';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { BillingRecord, BillingStats } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppTable,
  AppButton,
  AppInput,
  AppModal,
  TableSkeleton,
} from 'shared-components';

export const BillingManagement: React.FC = () => {
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<BillingRecord[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalInvoices, setTotalInvoices] = useState(0);

  // View / Print Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<BillingRecord | null>(null);

  // Create Invoice Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newAddressStreet, setNewAddressStreet] = useState('');
  const [newAddressCity, setNewAddressCity] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('credit_card');
  const [newPaymentStatus, setNewPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [newNotes, setNewNotes] = useState('');
  const [newItems, setNewItems] = useState([
    { name: '', description: '', quantity: 1, unitPrice: 0 },
  ]);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const [billsRes, statsRes] = await Promise.all([
        ecommerceService.getBillings({
          search: searchQuery || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page: currentPage,
          limit: pageSize,
        }),
        ecommerceService.getBillingStats(),
      ]);

      if (billsRes && billsRes.success && billsRes.data) {
        setInvoices(billsRes.data.invoices || []);
        setTotalInvoices(billsRes.data.total || 0);
      }
      if (statsRes && statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch {
      showToast('Failed to load billing records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, [searchQuery, statusFilter, currentPage, pageSize]);

  // Mark invoice as paid
  const handleMarkAsPaid = async (inv: BillingRecord) => {
    const invId = inv._id || inv.id;
    if (!invId) return;

    try {
      const res = await ecommerceService.updateBillingStatus(invId, {
        paymentStatus: 'paid',
      });
      if (res.success) {
        showToast(`Invoice ${inv.invoiceNumber} marked as paid`, 'success');
        loadBillingData();
        if (selectedInvoice && (selectedInvoice._id === invId || selectedInvoice.id === invId)) {
          setSelectedInvoice({ ...selectedInvoice, paymentStatus: 'paid', paidAt: new Date().toISOString() });
        }
      } else {
        showToast(res.messages?.[0] || 'Failed to update invoice', 'error');
      }
    } catch {
      showToast('Error updating invoice payment status', 'error');
    }
  };

  // Instant Gateway Payment for Invoices (Khalti & eSewa)
  const handleKhaltiInvoicePay = async (inv: BillingRecord) => {
    try {
      showToast('Initiating Khalti payment for invoice...', 'info');
      const targetId = (inv.order || inv._id || inv.id || '') as string;
      const res = await ecommerceService.initiateKhalti({
        orderId: targetId,
        amount: inv.totalAmount,
        customerInfo: { name: inv.customer?.name, email: inv.customer?.email },
        returnUrl: `${window.location.origin}/payment/verify/khalti?orderId=${targetId}`,
        websiteUrl: window.location.origin,
      });
      if (res.success && res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        showToast(res.messages?.[0] || 'Khalti payment initiation failed', 'error');
      }
    } catch {
      showToast('Failed to initiate Khalti payment', 'error');
    }
  };

  const handleEsewaInvoicePay = async (inv: BillingRecord) => {
    try {
      showToast('Initiating eSewa payment for invoice...', 'info');
      const targetId = (inv.order || inv._id || inv.id || '') as string;
      const res = await ecommerceService.initiateEsewa({
        orderId: targetId,
        amount: inv.totalAmount,
        taxAmount: inv.taxAmount,
        returnUrl: `${window.location.origin}/payment/verify/esewa?orderId=${targetId}`,
      });
      if (res.success && res.data?.formFields) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = res.data.gatewayUrl;
        Object.entries(res.data.formFields).forEach(([key, val]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = val as string;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      } else {
        showToast(res.messages?.[0] || 'eSewa payment initiation failed', 'error');
      }
    } catch {
      showToast('Failed to initiate eSewa payment', 'error');
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (inv: BillingRecord) => {
    const invId = inv._id || inv.id;
    if (!invId) return;

    try {
      const res = await ecommerceService.deleteBilling(invId);
      if (res.success) {
        showToast(`Invoice ${inv.invoiceNumber} voided`, 'success');
        loadBillingData();
      } else {
        showToast(res.messages?.[0] || 'Failed to delete invoice', 'error');
      }
    } catch {
      showToast('Error deleting invoice', 'error');
    }
  };

  // Handle Create Invoice Submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerEmail.trim()) {
      showToast('Customer name and email are required', 'error');
      return;
    }

    const validItems = newItems.filter((it) => it.name.trim() && it.unitPrice > 0);
    if (validItems.length === 0) {
      showToast('Please add at least one line item with a name and positive price', 'error');
      return;
    }

    setCreatingInvoice(true);
    try {
      const res = await ecommerceService.createBilling({
        customer: {
          name: newCustomerName.trim(),
          email: newCustomerEmail.trim(),
          phone: newCustomerPhone.trim(),
        },
        billingAddress: {
          street: newAddressStreet.trim() || 'Himalayan Trade Hub',
          city: newAddressCity.trim() || 'Kathmandu',
          country: 'Nepal',
        },
        items: validItems,
        taxRate: 13,
        paymentMethod: newPaymentMethod,
        paymentStatus: newPaymentStatus,
        notes: newNotes.trim(),
      });

      if (res.success) {
        showToast('Billing invoice generated successfully', 'success');
        setIsCreateModalOpen(false);
        resetCreateForm();
        loadBillingData();
      } else {
        showToast(res.messages?.[0] || 'Failed to create invoice', 'error');
      }
    } catch {
      showToast('Error generating commercial invoice', 'error');
    } finally {
      setCreatingInvoice(false);
    }
  };

  const resetCreateForm = () => {
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewCustomerPhone('');
    setNewAddressStreet('');
    setNewAddressCity('');
    setNewPaymentMethod('credit_card');
    setNewPaymentStatus('paid');
    setNewNotes('');
    setNewItems([{ name: '', description: '', quantity: 1, unitPrice: 0 }]);
  };

  const totalPages = Math.max(1, Math.ceil(totalInvoices / pageSize));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Tag color="success" className="font-bold text-[10px] uppercase rounded-full">Paid</Tag>;
      case 'pending':
        return <Tag color="warning" className="font-bold text-[10px] uppercase rounded-full">Pending</Tag>;
      case 'overdue':
        return <Tag color="error" className="font-bold text-[10px] uppercase rounded-full">Overdue</Tag>;
      case 'refunded':
        return <Tag color="volcano" className="font-bold text-[10px] uppercase rounded-full">Refunded</Tag>;
      default:
        return <Tag color="default" className="font-bold text-[10px] uppercase rounded-full">{status}</Tag>;
    }
  };

  const printInvoice = () => {
    window.print();
  };

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
                  {isSeller ? 'Seller' : 'Admin'}
                </Link>
              ),
            },
            {
              title: <span className="text-slate-600 font-medium">Billing & Invoices</span>,
            },
          ]}
        />
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-2">
        {/* Card 1: Gross Billed */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Billed
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              ${stats ? stats.totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Across {stats ? stats.totalInvoices : 0} commercial bills
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center text-lg font-bold">
            <DollarOutlined />
          </div>
        </div>

        {/* Card 2: Settled / Paid */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Settled Revenue
            </div>
            <div className="text-lg font-bold text-emerald-600 mt-0.5">
              ${stats ? stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              {stats ? stats.paidCount : 0} Paid transactions
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
            <CheckCircleOutlined />
          </div>
        </div>

        {/* Card 3: Outstanding Receivables */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Outstanding
            </div>
            <div className="text-lg font-bold text-amber-600 mt-0.5">
              ${stats ? (stats.pendingAmount + stats.overdueAmount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <div className="text-[10px] text-amber-600 font-medium mt-0.5">
              {stats ? (stats.pendingCount + stats.overdueCount) : 0} Pending & Overdue
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
            <ClockCircleOutlined />
          </div>
        </div>

        {/* Card 4: Tax / VAT Handled */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              VAT / Tax Collected
            </div>
            <div className="text-lg font-bold text-purple-600 mt-0.5">
              ${stats ? stats.totalTaxCollected.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <div className="text-[10px] text-purple-600 font-medium mt-0.5">
              13% Standard National Tax
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-bold">
            <SafetyCertificateOutlined />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-t-2xl rounded-b-md shadow-xs">
        {/* Top Controls Strip */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-t-2xl">
          <div className="flex flex-col min-w-0">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Commercial Invoices & Billing
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Search invoice, order, customer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0096c7] focus:bg-white transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { key: 'all', label: 'All' },
                { key: 'paid', label: 'Paid' },
                { key: 'pending', label: 'Pending' },
                { key: 'overdue', label: 'Overdue' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === tab.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AppButton
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
              style={{ backgroundColor: '#0096C7' }}
              size="small"
            >
              Create Invoice
            </AppButton>
          </div>
        </div>

        {/* Main Invoices Table */}
        <div className="overflow-hidden">
          <AppTable>
            <thead>
              <tr>
                <th className="py-2.5 px-6 font-medium text-[12px]">Invoice #</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Order Ref</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Customer</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Issue Date</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Payment Method</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Total Amount</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Status</th>
                <th className="py-2.5 px-6 text-right font-medium text-[12px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <TableSkeleton columns={8} rows={6} hasAvatar={true} />
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileTextOutlined className="text-3xl text-slate-300 mb-2 block mx-auto" />
                    <span className="font-semibold text-slate-700 block">No billing records found</span>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Invoices will be automatically compiled as customer orders are placed or created manually.
                    </span>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const invId = inv._id || inv.id;
                  const isPaid = inv.paymentStatus === 'paid';

                  return (
                    <tr
                      key={invId}
                      className="hover:bg-slate-50/70 transition-colors group cursor-default"
                    >
                      {/* Invoice # */}
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileTextOutlined className="text-[#0096C7] text-sm" />
                          <span
                            onClick={() => setSelectedInvoice(inv)}
                            className="font-mono font-bold text-slate-900 hover:text-[#0096c7] cursor-pointer hover:underline text-xs"
                          >
                            {inv.invoiceNumber}
                          </span>
                        </div>
                      </td>

                      {/* Order Ref */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {inv.orderNumber ? (
                          <Link to="/admin/orders" className="text-[#0096c7] hover:underline">
                            {inv.orderNumber}
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">Direct Bill</span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {inv.customer?.name?.[0] || 'C'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">{inv.customer?.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{inv.customer?.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                        <div>{inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString() : 'N/A'}</div>
                        <div className="text-[9px] text-slate-400">Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Immediate'}</div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono capitalize">
                          {inv.paymentMethod === 'bank_transfer' ? <BankOutlined /> : <CreditCardOutlined />}
                          <span>{inv.paymentMethod?.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Financials Total */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">
                          ${inv.totalAmount?.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          (VAT 13%: ${inv.taxAmount?.toFixed(2) || '0.00'})
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(inv.paymentStatus)}
                      </td>

                      {/* Actions: Icon-Only Buttons */}
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Invoice Receipt Modal */}
                          <AppButton
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => setSelectedInvoice(inv)}
                            title="View & Print Invoice"
                          />

                          {/* Quick Mark Paid if not yet paid */}
                          {!isPaid && (
                            <Popconfirm
                              title="Mark Invoice as Paid"
                              description={`Confirm payment settlement of $${inv.totalAmount?.toFixed(2)} for ${inv.invoiceNumber}?`}
                              onConfirm={() => handleMarkAsPaid(inv)}
                              okText="Confirm Paid"
                              cancelText="Cancel"
                            >
                              <AppButton
                                size="small"
                                icon={<CheckCircleOutlined className="text-emerald-600" />}
                                title="Mark as Paid"
                              />
                            </Popconfirm>
                          )}

                          {/* Delete / Void Invoice */}
                          <Popconfirm
                            title="Void Invoice"
                            description={`Are you sure you want to delete invoice "${inv.invoiceNumber}"?`}
                            onConfirm={() => handleDeleteInvoice(inv)}
                            okText="Yes, Void"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <AppButton
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              title="Void Invoice"
                            />
                          </Popconfirm>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </AppTable>
        </div>

        {/* Signature Cyan Footer */}
        <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-md flex items-center justify-between text-[11px] shadow-inner select-none">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-medium text-white/90 text-[11px] leading-none">Total Invoices:</span>
            <span className="font-bold text-white text-[11px] leading-none">
              {totalInvoices} Records
            </span>
          </div>

          {totalInvoices > 10 && (
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
                  </select>
                  <DownOutlined className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[7px] text-white/80" />
                </div>
              </div>

              <span className="text-[10px] text-white/95 font-medium whitespace-nowrap leading-none">
                {totalInvoices > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, totalInvoices)} of {totalInvoices}
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

      {/* =========================================================================
          MODAL 1: VIEW & PRINT COMMERCIAL INVOICE RECEIPT
         ========================================================================= */}
      {selectedInvoice && (
        <AppModal
          open={!!selectedInvoice}
          title={
            <div className="flex items-center justify-between pr-6">
              <span className="text-base font-bold text-slate-900">Commercial Tax Invoice</span>
              {getStatusBadge(selectedInvoice.paymentStatus)}
            </div>
          }
          onCancel={() => setSelectedInvoice(null)}
          onOk={printInvoice}
          okText="Print / Save PDF"
          width={720}
        >
          <div className="p-2 space-y-5 text-xs text-slate-800 font-sans print:p-0">
            {/* Invoice Printable Brand Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0096c7] text-white flex items-center justify-center font-bold text-base">
                    H
                  </div>
                  <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                    Himalaya Online Marketplace
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Fair-trade Handcrafts & Organic Botanicals Ltd.
                </div>
                <div className="text-[10px] text-slate-400">
                  Durbar Marg, Ward 1, Kathmandu, Nepal · VAT ID: 60124890
                </div>
              </div>

              <div className="text-right sm:self-start">
                <div className="text-lg font-black text-slate-900 font-mono">
                  {selectedInvoice.invoiceNumber}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Issued: <strong>{new Date(selectedInvoice.issuedDate).toLocaleDateString()}</strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  Due: <strong>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</strong>
                </div>
                {selectedInvoice.orderNumber && (
                  <div className="text-[10px] font-mono text-[#0096c7] mt-0.5">
                    Order Ref: #{selectedInvoice.orderNumber}
                  </div>
                )}
              </div>
            </div>

            {/* Billed To & Payment Details Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Billed To (Customer)
                </div>
                <div className="font-bold text-xs text-slate-900">{selectedInvoice.customer?.name}</div>
                <div className="text-slate-600 font-mono text-[11px]">{selectedInvoice.customer?.email}</div>
                {selectedInvoice.customer?.phone && (
                  <div className="text-slate-500 text-[11px]">{selectedInvoice.customer.phone}</div>
                )}
                <div className="text-slate-600 text-[11px] mt-1">
                  {selectedInvoice.billingAddress?.street}, {selectedInvoice.billingAddress?.city}, {selectedInvoice.billingAddress?.country}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Payment & Settlement Details
                </div>
                <div className="flex items-center gap-1.5 capitalize font-semibold text-slate-800">
                  <CreditCardOutlined className="text-[#0096c7]" />
                  <span>{selectedInvoice.paymentMethod?.replace('_', ' ')}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Payment Status:{' '}
                  <strong className={selectedInvoice.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>
                    {selectedInvoice.paymentStatus?.toUpperCase()}
                  </strong>
                </div>
                {selectedInvoice.paidAt && (
                  <div className="text-[10px] text-emerald-600">
                    Paid on {new Date(selectedInvoice.paidAt).toLocaleString()}
                  </div>
                )}
                {selectedInvoice.notes && (
                  <div className="text-[10px] text-slate-400 italic mt-1">
                    Note: "{selectedInvoice.notes}"
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedInvoice.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        {item.description && (
                          <div className="text-[10px] text-slate-400">{item.description}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono">${item.unitPrice?.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                        ${item.total?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation Breakdown */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">${selectedInvoice.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Standard VAT (13%):</span>
                  <span className="font-mono font-semibold">${selectedInvoice.taxAmount?.toFixed(2)}</span>
                </div>
                {selectedInvoice.shippingAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping & Handling:</span>
                    <span className="font-mono font-semibold">${selectedInvoice.shippingAmount?.toFixed(2)}</span>
                  </div>
                )}
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Applied:</span>
                    <span className="font-mono font-semibold">-${selectedInvoice.discountAmount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-[#0096C7]">${selectedInvoice.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1 text-slate-500">
                  <span>Balance Due:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedInvoice.paymentStatus === 'paid' ? '$0.00 (Settled)' : `$${selectedInvoice.totalAmount?.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Instant Self-Payment via Khalti or eSewa */}
            {selectedInvoice.paymentStatus !== 'paid' && (
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border">
                <div>
                  <div className="text-xs font-bold text-slate-800">Settle Invoice Online:</div>
                  <div className="text-[10px] text-slate-500">Pay directly using Khalti or eSewa wallet</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleKhaltiInvoicePay(selectedInvoice)}
                    className="px-3 py-1.5 rounded-lg bg-[#5c2d91] hover:bg-[#482373] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white text-[#5c2d91] flex items-center justify-center text-[9px] font-bold">K</span>
                    <span>Pay with Khalti</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEsewaInvoicePay(selectedInvoice)}
                    className="px-3 py-1.5 rounded-lg bg-[#60bb46] hover:bg-[#4fa037] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white text-[#60bb46] flex items-center justify-center text-[9px] font-bold">e</span>
                    <span>Pay with eSewa</span>
                  </button>
                </div>
              </div>
            )}

            {/* Official Tax Stamp and Authenticity Notice */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>This is an official computer-generated tax invoice. No signature required.</span>
              <span className="font-mono">Verification: FIDO2-{selectedInvoice.invoiceNumber}</span>
            </div>
          </div>
        </AppModal>
      )}

      {/* =========================================================================
          MODAL 2: CREATE MANUAL COMMERCIAL INVOICE
         ========================================================================= */}
      {isCreateModalOpen && (
        <AppModal
          open={isCreateModalOpen}
          title="Create New Commercial Billing Invoice"
          onCancel={() => setIsCreateModalOpen(false)}
          onOk={handleCreateSubmit}
          okText="Generate Invoice"
          confirmLoading={creatingInvoice}
          width={650}
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            {/* Customer Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pasang Lhamu"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 outline-none focus:border-[#0096c7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Customer Email *
                </label>
                <input
                  type="email"
                  placeholder="e.g. pasang@sherpa.com"
                  required
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 outline-none focus:border-[#0096c7]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+977 980-0000000"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 outline-none focus:border-[#0096c7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 outline-none focus:border-[#0096c7] cursor-pointer"
                >
                  <option value="credit_card">Credit / Debit Card</option>
                  <option value="stripe">Stripe Gateway</option>
                  <option value="paypal">PayPal Express</option>
                  <option value="cash_on_delivery">Cash on Delivery</option>
                  <option value="bank_transfer">Direct Bank Transfer</option>
                  <option value="esewa">eSewa Mobile Wallet</option>
                  <option value="khalti">Khalti Pay</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Payment Status
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 outline-none focus:border-[#0096c7] cursor-pointer"
                >
                  <option value="paid">Paid & Settled</option>
                  <option value="pending">Pending Settlement</option>
                </select>
              </div>
            </div>

            {/* Line Items Section */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase text-[11px]">
                  Bill Line Items
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setNewItems([...newItems, { name: '', description: '', quantity: 1, unitPrice: 0 }])
                  }
                  className="text-xs text-[#0096c7] font-semibold hover:underline cursor-pointer"
                >
                  + Add Line Item
                </button>
              </div>

              {newItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Product / Service Name"
                    required
                    value={item.name}
                    onChange={(e) => {
                      const updated = [...newItems];
                      updated[idx].name = e.target.value;
                      setNewItems(updated);
                    }}
                    className="flex-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 outline-none focus:border-[#0096c7]"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    required
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...newItems];
                      updated[idx].quantity = parseInt(e.target.value) || 1;
                      setNewItems(updated);
                    }}
                    className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center font-mono outline-none focus:border-[#0096c7]"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Rate"
                      required
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...newItems];
                        updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                        setNewItems(updated);
                      }}
                      className="w-full pl-5 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-[#0096c7]"
                    />
                  </div>
                  {newItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <DeleteOutlined />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Invoice Notes
              </label>
              <textarea
                rows={2}
                placeholder="Additional payment terms, order remarks, or delivery notes..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 outline-none focus:border-[#0096c7] resize-none"
              />
            </div>
          </form>
        </AppModal>
      )}
    </div>
  );
};

export default BillingManagement;
