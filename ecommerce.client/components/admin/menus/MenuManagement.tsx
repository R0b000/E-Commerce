import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  DollarOutlined,
  StarOutlined,
  HistoryOutlined,
  LockOutlined,
  SearchOutlined,
  FolderOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import { Tag, Switch, Spin, Popconfirm, Select, InputNumber, Breadcrumb, Tooltip } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { MenuItem, PermissionItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppTable,
  AppButton,
  AppInput,
  AppSelect,
  AppModal,
  TableSkeleton,
} from 'shared-components';

const AVAILABLE_ICONS = [
  { label: 'DashboardOutlined (Dashboard)', value: 'DashboardOutlined', icon: <DashboardOutlined /> },
  { label: 'ShoppingOutlined (Products / Cart)', value: 'ShoppingOutlined', icon: <ShoppingOutlined /> },
  { label: 'AppstoreOutlined (Categories / Grid)', value: 'AppstoreOutlined', icon: <AppstoreOutlined /> },
  { label: 'FileTextOutlined (Orders / Invoices)', value: 'FileTextOutlined', icon: <FileTextOutlined /> },
  { label: 'TeamOutlined (Customers / Accounts)', value: 'TeamOutlined', icon: <TeamOutlined /> },
  { label: 'DollarOutlined (Billing / Payments)', value: 'DollarOutlined', icon: <DollarOutlined /> },
  { label: 'StarOutlined (Reviews / Ratings)', value: 'StarOutlined', icon: <StarOutlined /> },
  { label: 'HistoryOutlined (Audit Logs / History)', value: 'HistoryOutlined', icon: <HistoryOutlined /> },
  { label: 'SafetyCertificateOutlined (Roles / RBAC)', value: 'SafetyCertificateOutlined', icon: <SafetyCertificateOutlined /> },
  { label: 'KeyOutlined (Permissions / Access)', value: 'KeyOutlined', icon: <KeyOutlined /> },
  { label: 'LockOutlined (Security / Devices)', value: 'LockOutlined', icon: <LockOutlined /> },
  { label: 'MenuOutlined (Navigation / Menu)', value: 'MenuOutlined', icon: <MenuOutlined /> },
  { label: 'LineChartOutlined (Analytics / Sales)', value: 'LineChartOutlined', icon: <LineChartOutlined /> },
  { label: 'RocketOutlined (Marketing / Promotions)', value: 'RocketOutlined', icon: <RocketOutlined /> },
  { label: 'ShopOutlined (Storefront / Shop)', value: 'ShopOutlined', icon: <ShopOutlined /> },
  { label: 'SettingOutlined (Settings / System)', value: 'SettingOutlined', icon: <SettingOutlined /> },
  { label: 'BellOutlined (Alerts / Notifications)', value: 'BellOutlined', icon: <BellOutlined /> },
  { label: 'TagOutlined (Discounts / Tags)', value: 'TagOutlined', icon: <TagOutlined /> },
  { label: 'FolderOutlined (Directory / Folder)', value: 'FolderOutlined', icon: <FolderOutlined /> },
];

export const MenuManagement: React.FC = () => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [hierarchyFilter, setHierarchyFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPath, setFormPath] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formIcon, setFormIcon] = useState('AppstoreOutlined');
  const [formOrder, setFormOrder] = useState<number>(10);
  const [formRoles, setFormRoles] = useState<string[]>(['admin']);
  const [formPermission, setFormPermission] = useState<string>('');
  const [formBadge, setFormBadge] = useState<string>('');
  const [formActive, setFormActive] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Compute Root Menus and Submenu Hierarchy Tree
  const { hierarchicalList, rootMenusList } = useMemo(() => {
    const roots: MenuItem[] = [];
    const subs: MenuItem[] = [];

    menus.forEach((m) => {
      if (!m.parentId) {
        roots.push(m);
      } else {
        subs.push(m);
      }
    });

    // Sort roots by order
    roots.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Group submenus by parent ID string
    const subMap = new Map<string, MenuItem[]>();
    subs.forEach((sub) => {
      const pId = typeof sub.parentId === 'object' && sub.parentId
        ? (sub.parentId._id || sub.parentId.id || '').toString()
        : (sub.parentId || '').toString();

      if (!subMap.has(pId)) {
        subMap.set(pId, []);
      }
      subMap.get(pId)!.push(sub);
    });

    // Flatten into hierarchical tree: Root followed by its submenus
    const flatTree: Array<{
      menu: MenuItem;
      isSubmenu: boolean;
      parentName?: string;
      parentIdStr?: string;
      subCount?: number;
    }> = [];

    roots.forEach((root) => {
      const rId = (root._id || root.id || '').toString();
      const children = subMap.get(rId) || [];
      children.sort((a, b) => (a.order || 0) - (b.order || 0));

      flatTree.push({
        menu: root,
        isSubmenu: false,
        subCount: children.length,
      });

      children.forEach((child) => {
        flatTree.push({
          menu: child,
          isSubmenu: true,
          parentName: root.name,
          parentIdStr: rId,
        });
      });
    });

    // Include any orphan submenus whose parent is missing
    subs.forEach((sub) => {
      const sId = (sub._id || sub.id || '').toString();
      const alreadyIn = flatTree.some((f) => (f.menu._id || f.menu.id) === sId);
      if (!alreadyIn) {
        const pName =
          typeof sub.parentId === 'object' && sub.parentId ? sub.parentId.name : 'Unknown Parent';
        const pId =
          typeof sub.parentId === 'object' && sub.parentId
            ? (sub.parentId._id || sub.parentId.id || '').toString()
            : (sub.parentId || '').toString();

        flatTree.push({
          menu: sub,
          isSubmenu: true,
          parentName: pName,
          parentIdStr: pId,
        });
      }
    });

    return {
      hierarchicalList: flatTree,
      rootMenusList: roots,
    };
  }, [menus]);

  // Filtered List based on Search & Hierarchy Filter
  const filteredList = useMemo(() => {
    return hierarchicalList.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.menu.name.toLowerCase().includes(q);
        const matchPath = item.menu.path.toLowerCase().includes(q);
        const matchParent = item.parentName?.toLowerCase().includes(q);
        if (!matchName && !matchPath && !matchParent) return false;
      }

      // Hierarchy Filter
      if (hierarchyFilter === 'root') {
        return !item.isSubmenu;
      }
      if (hierarchyFilter === 'sub') {
        return item.isSubmenu;
      }
      if (hierarchyFilter !== 'all') {
        // Specific parent filter
        const selfId = (item.menu._id || item.menu.id || '').toString();
        return selfId === hierarchyFilter || item.parentIdStr === hierarchyFilter;
      }

      return true;
    });
  }, [hierarchicalList, searchQuery, hierarchyFilter]);

  // Open Add Modal (allows pre-setting parent menu for quick "+ Submenu" actions)
  const openAddModal = (presetParentId?: string) => {
    setEditingMenu(null);
    setFormName('');
    setFormPath('/admin/');
    setFormParentId(presetParentId || '');
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
    const pId =
      typeof menu.parentId === 'object' && menu.parentId
        ? (menu.parentId._id || menu.parentId.id || '').toString()
        : (menu.parentId || '').toString();
    setFormParentId(pId);
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
      const payload: any = {
        name: formName,
        path: formPath,
        parentId: formParentId ? formParentId : null,
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
          showToast(`Menu "${formName}" updated successfully`, 'success');
          setIsModalOpen(false);
          loadData();
        }
      } else {
        const res = await ecommerceService.createMenu(payload);
        if (res.success && res.data) {
          showToast(
            formParentId
              ? `Submenu "${formName}" added successfully`
              : `Root menu "${formName}" created successfully`,
            'success'
          );
          setIsModalOpen(false);
          loadData();
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
        loadData();
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

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedItems = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
              title: <span className="text-slate-600 font-medium">Navigation Menus</span>,
            },
          ]}
        />
      </div>

      {/* Main Menu Directory Card with Integrated Header */}
      <div className="bg-white rounded-t-2xl rounded-b-md shadow-xs">
        {/* Table Top Controls & Integrated Header */}
        <div className="px-3 py-3 sm:py-3.5 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white relative z-20 rounded-t-2xl">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Dynamic Menu & Submenu Navigation
              </h3>
              <Tag className="m-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-[#0096C7] border-cyan-200">
                Hierarchical Tree
              </Tag>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Organize top-level menus and nested submenus dynamically. Control visibility by Role or Permission.
            </p>
          </div>

          {/* Action Toolbar on Right: Search, Filter, and Add Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="w-full sm:w-[190px]">
              <AppInput
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder="Search menu or route..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Hierarchy Type Filter */}
            <div className="w-full sm:w-[170px]">
              <AppSelect
                value={hierarchyFilter}
                onChange={(val) => {
                  setHierarchyFilter(val as string);
                  setCurrentPage(1);
                }}
                options={[
                  { label: 'All Menus & Submenus', value: 'all' },
                  { label: 'Root Menus Only', value: 'root' },
                  { label: 'Submenus Only', value: 'sub' },
                  ...rootMenusList.map((r) => ({
                    label: `Submenus of: ${r.name}`,
                    value: (r._id || r.id || '').toString(),
                  })),
                ]}
              />
            </div>

            <AppButton
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openAddModal()}
              style={{ backgroundColor: '#0096C7' }}
            >
              Add New Page
            </AppButton>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-hidden">
          <AppTable>
            <thead>
              <tr>
                <th className="py-2.5 px-6 font-medium text-[12px] w-[100px]">Order</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Menu Name & Icon</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Hierarchy Level</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Route Path</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Required Permission</th>
                <th className="py-2.5 px-4 font-medium text-[12px] text-center">Status</th>
                <th className="py-2.5 px-6 text-right font-medium text-[12px] w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <TableSkeleton columns={7} rows={6} hasAvatar={false} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No navigation menus match your criteria. Click &quot;Add New Page&quot; to create one.
                  </td>
                </tr>
              ) : (
                paginatedItems.map(({ menu: m, isSubmenu, parentName, subCount }) => {
                  const mId = m._id || m.id;
                  const iconObj = AVAILABLE_ICONS.find((i) => i.value === m.icon);

                  return (
                    <tr
                      key={mId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSubmenu ? 'bg-slate-50/30' : 'bg-white font-medium'
                      }`}
                    >
                      {/* Order Number */}
                      <td className="py-3 px-6 font-mono font-bold text-slate-600">
                        {isSubmenu ? (
                          <div className="flex items-center text-slate-400 font-normal">
                            <span className="text-slate-300 font-mono text-sm ml-2 mr-1">└─</span>
                            <span className="text-[11px]">#{m.order}</span>
                          </div>
                        ) : (
                          <span>#{m.order}</span>
                        )}
                      </td>

                      {/* Menu Name & Icon with Hierarchy Indentation */}
                      <td className="py-3 px-4">
                        <div className={`flex items-center gap-2.5 ${isSubmenu ? 'pl-4' : ''}`}>
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-base border shrink-0 ${
                              isSubmenu
                                ? 'bg-purple-50 text-purple-600 border-purple-100'
                                : 'bg-sky-50 text-[#0096C7] border-sky-100'
                            }`}
                          >
                            {iconObj ? iconObj.icon : <AppstoreOutlined />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
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
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {m.icon}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Hierarchy Level / Parent Info */}
                      <td className="py-3 px-4">
                        {isSubmenu ? (
                          <Tag className="m-0 text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border-purple-200 inline-flex items-center gap-1">
                            <BranchesOutlined className="text-[10px]" />
                            <span>Submenu of: <strong>{parentName || 'Root'}</strong></span>
                          </Tag>
                        ) : (
                          <Tag className="m-0 text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border-blue-200 inline-flex items-center gap-1">
                            <FolderOutlined className="text-[10px]" />
                            <span>
                              {subCount && subCount > 0
                                ? `Parent Menu (${subCount} submenus)`
                                : 'Root Menu (Direct link)'}
                            </span>
                          </Tag>
                        )}
                      </td>

                      {/* Route Path */}
                      <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                        {m.path}
                      </td>

                      {/* Required Permission */}
                      <td className="py-3 px-4">
                        {m.requiredPermission ? (
                          <Tag className="m-0 text-[10px] font-mono bg-slate-100 border-slate-200 text-slate-700">
                            {m.requiredPermission}
                          </Tag>
                        ) : (
                          <span className="text-slate-400 italic">None (Role-only)</span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-4 text-center">
                        <Switch
                          size="small"
                          checked={m.isActive !== false}
                          onChange={(checked) => handleToggleStatus(m, checked)}
                        />
                      </td>

                      {/* Action Buttons (Icon-only) */}
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Add Submenu button for Root Menus */}
                          {!isSubmenu && (
                            <Tooltip title={`Add Submenu under "${m.name}"`}>
                              <AppButton
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={() => openAddModal(m._id || m.id)}
                              />
                            </Tooltip>
                          )}

                          <Tooltip title="Edit Page Configuration">
                            <AppButton
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => openEditModal(m)}
                            />
                          </Tooltip>

                          {!m.isSystem && (
                            <Popconfirm
                              title="Delete Page"
                              description={`Delete menu item "${m.name}"?`}
                              onConfirm={() => handleDeleteMenu(m)}
                              okText="Delete"
                              cancelText="Cancel"
                              okButtonProps={{ danger: true }}
                            >
                              <Tooltip title="Delete Page">
                                <AppButton size="small" danger icon={<DeleteOutlined />} />
                              </Tooltip>
                            </Popconfirm>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </AppTable>
        </div>

        {/* Table Footer: Count on Left, Pagination on Right */}
        <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-md flex items-center justify-between text-[11px] shadow-inner select-none">
          {/* Left Side: Count */}
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-medium text-white/90 text-[11px] leading-none">Total Menus:</span>
            <span className="font-bold text-white text-[11px] leading-none">
              {filteredList.length} Items
            </span>
          </div>

          {/* Right Side: Pagination Controls */}
          {filteredList.length > 10 && (
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
                {filteredList.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
                {Math.min(currentPage * pageSize, filteredList.length)} of {filteredList.length}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                  className="w-5 h-5 rounded flex items-center justify-center bg-white/15 hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
                >
                  <LeftOutlined className="text-[8px]" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next page"
                  className="w-5 h-5 rounded flex items-center justify-center bg-white/15 hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
                >
                  <RightOutlined className="text-[8px]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Menu & Submenu Modal */}
      {isModalOpen && (
        <AppModal
          open={isModalOpen}
          title={
            editingMenu
              ? `Edit Navigation Page: ${editingMenu.name}`
              : formParentId
              ? 'Add New Submenu Item'
              : 'Add New Navigation Menu / Page'
          }
          onCancel={() => setIsModalOpen(false)}
          onOk={handleSaveMenu}
          okText={editingMenu ? 'Update Page' : 'Create Page'}
          confirmLoading={submitting}
          width={650}
        >
          <form onSubmit={handleSaveMenu} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Menu / Submenu Name *
                </label>
                <AppInput
                  placeholder="e.g. Invoices, Customer Reviews, Inventory"
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
                  placeholder="e.g. /admin/billing"
                  value={formPath}
                  onChange={(e) => setFormPath(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Parent Menu (Optional - for Submenus)
                </label>
                <Select
                  allowClear
                  placeholder="None (Top-Level Root Menu)"
                  value={formParentId || undefined}
                  onChange={(val) => setFormParentId(val || '')}
                  className="w-full"
                  options={[
                    { label: 'None (Top-Level Root Menu)', value: '' },
                    ...rootMenusList
                      .filter(
                        (r) =>
                          (r._id || r.id) !== (editingMenu?._id || editingMenu?.id)
                      )
                      .map((r) => ({
                        label: `${r.name} (${r.path})`,
                        value: (r._id || r.id || '').toString(),
                      })),
                  ]}
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
                  Pill Badge Tag (Optional)
                </label>
                <AppInput
                  placeholder="e.g. New, Beta, Pro"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
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
