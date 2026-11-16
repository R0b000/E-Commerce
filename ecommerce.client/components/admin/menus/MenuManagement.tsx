import React, { useEffect, useState } from 'react';
import {
  MenuOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  SettingOutlined,
  LineChartOutlined,
  RocketOutlined,
  BellOutlined,
  ShopOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { Tag, Switch, Spin, Popconfirm, Select, InputNumber } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { MenuItem, PermissionItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppCard,
  AppButton,
  AppInput,
  AppModal,
  PageHeader,
  TableSkeleton,
} from 'shared-components';

const AVAILABLE_ICONS = [
  { label: 'DashboardOutlined (Dashboard)', value: 'DashboardOutlined', icon: <DashboardOutlined /> },
  { label: 'ShoppingOutlined (Products / Cart)', value: 'ShoppingOutlined', icon: <ShoppingOutlined /> },
  { label: 'AppstoreOutlined (Categories / Grid)', value: 'AppstoreOutlined', icon: <AppstoreOutlined /> },
  { label: 'FileTextOutlined (Orders / Invoices)', value: 'FileTextOutlined', icon: <FileTextOutlined /> },
  { label: 'TeamOutlined (Customers / Users)', value: 'TeamOutlined', icon: <TeamOutlined /> },
  { label: 'SafetyCertificateOutlined (Roles / Security)', value: 'SafetyCertificateOutlined', icon: <SafetyCertificateOutlined /> },
  { label: 'KeyOutlined (Permissions / Access)', value: 'KeyOutlined', icon: <KeyOutlined /> },
  { label: 'MenuOutlined (Navigation / Menu)', value: 'MenuOutlined', icon: <MenuOutlined /> },
  { label: 'LineChartOutlined (Analytics / Sales)', value: 'LineChartOutlined', icon: <LineChartOutlined /> },
  { label: 'RocketOutlined (Marketing / Promotions)', value: 'RocketOutlined', icon: <RocketOutlined /> },
  { label: 'ShopOutlined (Storefront / Shop)', value: 'ShopOutlined', icon: <ShopOutlined /> },
  { label: 'SettingOutlined (Settings / System)', value: 'SettingOutlined', icon: <SettingOutlined /> },
  { label: 'BellOutlined (Alerts / Notifications)', value: 'BellOutlined', icon: <BellOutlined /> },
  { label: 'TagOutlined (Discounts / Tags)', value: 'TagOutlined', icon: <TagOutlined /> },
];

export const MenuManagement: React.FC = () => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPath, setFormPath] = useState('');
  const [formIcon, setFormIcon] = useState('AppstoreOutlined');
  const [formOrder, setFormOrder] = useState<number>(10);
  const [formRoles, setFormRoles] = useState<string[]>(['admin']);
  const [formPermission, setFormPermission] = useState<string>('');
  const [formBadge, setFormBadge] = useState<string>('');
  const [formActive, setFormActive] = useState(true);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [menusRes, permsRes] = await Promise.all([
        ecommerceService.getAllMenus(),
        ecommerceService.getPermissions(),
      ]);

      if (menusRes.success && menusRes.data) {
        setMenus(menusRes.data);
      }
      if (permsRes.success && permsRes.data) {
        setPermissions(permsRes.data);
      }
    } catch {
      showToast('Failed to load navigation menus', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingMenu(null);
    setFormName('');
    setFormPath('/admin/');
    setFormIcon('AppstoreOutlined');
    setFormOrder(menus.length + 1);
    setFormRoles(['admin']);
    setFormPermission('');
    setFormBadge('');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (menu: MenuItem) => {
    setEditingMenu(menu);
    setFormName(menu.name);
    setFormPath(menu.path);
    setFormIcon(menu.icon || 'AppstoreOutlined');
    setFormOrder(menu.order || 0);
    setFormRoles(menu.roles || ['admin']);
    setFormPermission(menu.requiredPermission || '');
    setFormBadge(menu.badgeText || '');
    setFormActive(menu.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPath) {
      showToast('Name and Route Path are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName,
        path: formPath,
        icon: formIcon,
        order: Number(formOrder),
        roles: formRoles,
        requiredPermission: formPermission,
        badgeText: formBadge,
        isActive: formActive,
      };

      if (editingMenu) {
        const menuId = editingMenu._id || editingMenu.id || '';
        const res = await ecommerceService.updateMenu(menuId, payload);
        if (res.success) {
          showToast(`Menu "${formName}" updated`, 'success');
          setMenus((prev) =>
            prev.map((m) => ((m._id || m.id) === menuId ? { ...m, ...payload } : m))
          );
          setIsModalOpen(false);
        }
      } else {
        const res = await ecommerceService.createMenu(payload);
        if (res.success && res.data) {
          showToast(`New page "${formName}" added to navigation`, 'success');
          setMenus((prev) => [...prev, res.data]);
          setIsModalOpen(false);
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to save menu', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMenu = async (menu: MenuItem) => {
    const menuId = menu._id || menu.id || '';
    try {
      const res = await ecommerceService.deleteMenu(menuId);
      if (res.success) {
        showToast(`Menu "${menu.name}" deleted`, 'success');
        setMenus((prev) => prev.filter((m) => (m._id || m.id) !== menuId));
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to delete menu', 'error');
    }
  };

  const handleToggleStatus = async (menu: MenuItem, active: boolean) => {
    const menuId = menu._id || menu.id || '';
    try {
      const res = await ecommerceService.updateMenu(menuId, { isActive: active });
      if (res.success) {
        setMenus((prev) =>
          prev.map((m) => ((m._id || m.id) === menuId ? { ...m, isActive: active } : m))
        );
        showToast(`Menu ${active ? 'activated' : 'deactivated'}`, 'success');
      }
    } catch {
      showToast('Failed to change status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dynamic Menu & Page Addition"
        description="Add, arrange, and control navigation pages dynamically without hardcoding. Grant page access by Role or Permission."
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Menus' }]}
        extra={
          <div className="flex items-center gap-3">
            <AppButton icon={<SyncOutlined />} onClick={loadData}>
              Sync
            </AppButton>
            <AppButton
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
              style={{ backgroundColor: '#0096C7' }}
            >
              Add New Menu Page
            </AppButton>
          </div>
        }
      />

      <AppCard bodyStyle={{ padding: 0 }}>
        <div className="app-table-scroll overflow-x-auto">
          <table className="app-table w-full text-left">
            <thead>
              <tr>
                <th className="py-2.5 px-6 font-medium text-[12px]">Order</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Menu Name & Icon</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Route Path</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Required Permission</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Status</th>
                <th className="py-2.5 px-6 text-right font-medium text-[12px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <TableSkeleton columns={6} rows={5} hasAvatar={false} />
              ) : menus.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No dynamic navigation menus found. Click "Add New Menu Page" to create one.
                  </td>
                </tr>
              ) : (
                menus.map((m) => {
                  const mId = m._id || m.id;
                  const iconObj = AVAILABLE_ICONS.find((i) => i.value === m.icon);

                  return (
                    <tr key={mId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-600">
                        #{m.order}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0096C7] flex items-center justify-center text-base border border-sky-100">
                            {iconObj ? iconObj.icon : <AppstoreOutlined />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{m.name}</span>
                              {m.badgeText && (
                                <Tag className="m-0 text-[10px] font-bold px-1.5 py-0 rounded bg-indigo-50 text-indigo-700 border-indigo-200">
                                  {m.badgeText}
                                </Tag>
                              )}
                              {m.isSystem && (
                                <Tag className="m-0 text-[9px] px-1 py-0 rounded bg-slate-100 text-slate-500 border-slate-200">
                                  Core
                                </Tag>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{m.icon}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                        {m.path}
                      </td>

                      <td className="py-3.5 px-4">
                        {m.requiredPermission ? (
                          <Tag className="m-0 text-[10px] font-mono bg-slate-100 border-slate-200 text-slate-700">
                            {m.requiredPermission}
                          </Tag>
                        ) : (
                          <span className="text-slate-400 italic">None (Role-only)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Switch
                          size="small"
                          checked={m.isActive !== false}
                          onChange={(checked) => handleToggleStatus(m, checked)}
                        />
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <AppButton
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditModal(m)}
                          >
                            Edit
                          </AppButton>

                          {!m.isSystem && (
                            <Popconfirm
                              title="Delete Page"
                              description={`Delete menu page "${m.name}"?`}
                              onConfirm={() => handleDeleteMenu(m)}
                              okText="Delete"
                              cancelText="Cancel"
                              okButtonProps={{ danger: true }}
                            >
                              <AppButton size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Paginator matching /admin/permissions */}
        <div className="paginator">
          <span>{menus.length} Items</span>
          <div className="flex items-center gap-1.5">
            <span className="pagination-text px-1">
              Page 1 of 1
            </span>
          </div>
        </div>
      </AppCard>

      {/* Add / Edit Menu Page Modal */}
      {isModalOpen && (
        <AppModal
          open={isModalOpen}
          title={editingMenu ? `Edit Navigation Page: ${editingMenu.name}` : 'Add New Dynamic Navigation Page'}
          onCancel={() => setIsModalOpen(false)}
          onOk={handleSaveMenu}
          okText={editingMenu ? 'Update Page' : 'Create Page'}
          confirmLoading={submitting}
          width={650}
        >
          <form onSubmit={handleSaveMenu} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Menu / Page Name *
                </label>
                <AppInput
                  placeholder="e.g. Analytics, Marketing, Invoices"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Route Path *
                </label>
                <AppInput
                  placeholder="e.g. /admin/analytics"
                  value={formPath}
                  onChange={(e) => setFormPath(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Navigation Icon
                </label>
                <Select
                  value={formIcon}
                  onChange={(val) => setFormIcon(val)}
                  className="w-full"
                  options={AVAILABLE_ICONS.map((i) => ({
                    value: i.value,
                    label: (
                      <div className="flex items-center gap-2">
                        <span>{i.icon}</span>
                        <span>{i.value}</span>
                      </div>
                    ),
                  }))}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Display Order Position
                </label>
                <InputNumber
                  min={1}
                  max={99}
                  value={formOrder}
                  onChange={(val) => setFormOrder(val || 1)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Required Permission Code (Optional)
                </label>
                <Select
                  showSearch
                  allowClear
                  placeholder="e.g. pages:dashboard"
                  value={formPermission || undefined}
                  onChange={(val) => setFormPermission(val || '')}
                  className="w-full"
                  options={[
                    { label: 'None (Allowed strictly by Role)', value: '' },
                    ...permissions.map((p) => ({
                      label: `${p.name} (${p.code})`,
                      value: p.code,
                    })),
                  ]}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Pill Badge Tag (Optional)
                </label>
                <AppInput
                  placeholder="e.g. New, Beta, Pro"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch checked={formActive} onChange={setFormActive} />
              <span className="font-semibold text-slate-700">
                Menu Item is Active (Visible in navigation)
              </span>
            </div>
          </form>
        </AppModal>
      )}
    </div>
  );
};

export default MenuManagement;
