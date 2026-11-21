import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MenuOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
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
  SaveOutlined,
  CloseOutlined,
  CalendarOutlined,
  InboxOutlined,
  CompassOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { Tag, Switch, Popconfirm, Select, Breadcrumb, Tooltip } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { MenuItem, PermissionItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppTable,
  AppButton,
  AppInput,
  AppSelect,
  TableSkeleton,
} from 'shared-components';

export const AVAILABLE_ICONS = [
  { label: 'dashboard', value: 'dashboard', icon: <DashboardOutlined /> },
  { label: 'menu', value: 'menu', icon: <MenuOutlined /> },
  { label: 'admin_panel_settings', value: 'admin_panel_settings', icon: <SafetyCertificateOutlined /> },
  { label: 'table_restaurant', value: 'table_restaurant', icon: <AppstoreOutlined /> },
  { label: 'category', value: 'category', icon: <AppstoreOutlined /> },
  { label: 'inventory_2', value: 'inventory_2', icon: <FolderOutlined /> },
  { label: 'menu_book', value: 'menu_book', icon: <FileTextOutlined /> },
  { label: 'shield', value: 'shield', icon: <SafetyCertificateOutlined /> },
  { label: 'receipt_long', value: 'receipt_long', icon: <FileTextOutlined /> },
  { label: 'add_shopping_cart', value: 'add_shopping_cart', icon: <ShoppingOutlined /> },
  { label: 'list_alt', value: 'list_alt', icon: <FileTextOutlined /> },
  { label: 'request_quote', value: 'request_quote', icon: <DollarOutlined /> },
  { label: 'shopping_cart', value: 'shopping_cart', icon: <ShoppingOutlined /> },
  { label: 'shopping_cart_checkout', value: 'shopping_cart_checkout', icon: <ShoppingOutlined /> },
  { label: 'person', value: 'person', icon: <TeamOutlined /> },
  { label: 'group', value: 'group', icon: <TeamOutlined /> },
  { label: 'groups', value: 'groups', icon: <TeamOutlined /> },
  { label: 'settings', value: 'settings', icon: <SettingOutlined /> },
  { label: 'tune', value: 'tune', icon: <SettingOutlined /> },
  { label: 'business', value: 'business', icon: <ShopOutlined /> },
  { label: 'business_center', value: 'business_center', icon: <ShopOutlined /> },
  { label: 'account_tree', value: 'account_tree', icon: <BranchesOutlined /> },
  { label: 'badge', value: 'badge', icon: <TeamOutlined /> },
  { label: 'beach_access', value: 'beach_access', icon: <CalendarOutlined /> },
  { label: 'calendar_month', value: 'calendar_month', icon: <CalendarOutlined /> },
  { label: 'list', value: 'list', icon: <FileTextOutlined /> },
  { label: 'move_to_inbox', value: 'move_to_inbox', icon: <InboxOutlined /> },
  { label: 'receipt', value: 'receipt', icon: <DollarOutlined /> },
  { label: 'restaurant', value: 'restaurant', icon: <ShopOutlined /> },
  { label: 'restaurant_menu', value: 'restaurant_menu', icon: <ShopOutlined /> },
  { label: 'grid_view', value: 'grid_view', icon: <AppstoreOutlined /> },
  { label: 'map', value: 'map', icon: <CompassOutlined /> },
  { label: 'schedule', value: 'schedule', icon: <CalendarOutlined /> },
  { label: 'event_available', value: 'event_available', icon: <CalendarOutlined /> },
  { label: 'note_add', value: 'note_add', icon: <FileTextOutlined /> },
  { label: 'approval', value: 'approval', icon: <CheckCircleOutlined /> },
  { label: 'person_search', value: 'person_search', icon: <TeamOutlined /> },
  { label: 'person_add', value: 'person_add', icon: <TeamOutlined /> },
  { label: 'event_busy', value: 'event_busy', icon: <CalendarOutlined /> },
  { label: 'account_balance_wallet', value: 'account_balance_wallet', icon: <DollarOutlined /> },
  { label: 'fact_check', value: 'fact_check', icon: <CheckCircleOutlined /> },
  { label: 'edit_calendar', value: 'edit_calendar', icon: <CalendarOutlined /> },
  { label: 'verified', value: 'verified', icon: <CheckCircleOutlined /> },
  { label: 'pending_actions', value: 'pending_actions', icon: <ClockCircleOutlined /> },
  { label: 'assessment', value: 'assessment', icon: <LineChartOutlined /> },
  { label: 'local_bar', value: 'local_bar', icon: <ShopOutlined /> },
  { label: 'photo_camera', value: 'photo_camera', icon: <PictureOutlined /> },
  { label: 'analytics', value: 'analytics', icon: <LineChartOutlined /> },
  { label: 'task_alt', value: 'task_alt', icon: <CheckCircleOutlined /> },
  { label: 'KeyOutlined', value: 'KeyOutlined', icon: <KeyOutlined /> },
  { label: 'LockOutlined', value: 'LockOutlined', icon: <LockOutlined /> },
  { label: 'RocketOutlined', value: 'RocketOutlined', icon: <RocketOutlined /> },
  { label: 'TagOutlined', value: 'TagOutlined', icon: <TagOutlined /> },
  { label: 'StarOutlined', value: 'StarOutlined', icon: <StarOutlined /> },
  { label: 'BellOutlined', value: 'BellOutlined', icon: <BellOutlined /> },
  { label: 'HistoryOutlined', value: 'HistoryOutlined', icon: <HistoryOutlined /> },
];

export const getMenuIconElement = (iconName: string) => {
  const match = AVAILABLE_ICONS.find(
    (i) => i.value.toLowerCase() === (iconName || '').toLowerCase()
  );
  if (match) return match.icon;
  return <AppstoreOutlined />;
};

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

  // Form Fields (Exact match to User's SQL and Form Screenshot)
  const [formName, setFormName] = useState('');
  const [formNameNepali, setFormNameNepali] = useState('');
  const [formPath, setFormPath] = useState('');
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIcon, setFormIcon] = useState('dashboard');
  const [formPrimary, setFormPrimary] = useState(false);
  const [formSinglePage, setFormSinglePage] = useState(false);
  const [formIsNotParent, setFormIsNotParent] = useState(true);
  const [formParentId, setFormParentId] = useState<string>('');
  const [formIsNotChild, setFormIsNotChild] = useState(true);
  const [formChildId, setFormChildId] = useState<string>('');
  const [formRoles, setFormRoles] = useState<string[]>(['admin']);
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

  // Compute Root Menus and Submenu Hierarchy Tree supporting both numeric MenuId and Mongo ObjectId
  const { hierarchicalList, rootMenusList } = useMemo(() => {
    const idToMenu = new Map<string, MenuItem>();
    menus.forEach((m) => {
      idToMenu.set((m._id || m.id || '').toString(), m);
      if (m.menuId !== undefined && m.menuId !== null) {
        idToMenu.set(String(m.menuId), m);
      }
    });

    const roots: MenuItem[] = [];
    const subs: MenuItem[] = [];

    menus.forEach((m) => {
      const hasParent =
        m.parentId !== null &&
        m.parentId !== undefined &&
        m.parentId !== '' &&
        m.parentId !== 'none';
      if (!hasParent) {
        roots.push(m);
      } else {
        subs.push(m);
      }
    });

    // Sort roots by order
    roots.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Group submenus by parent ID
    const subMap = new Map<string, MenuItem[]>();
    subs.forEach((sub) => {
      let pId = '';
      if (typeof sub.parentId === 'object' && sub.parentId) {
        pId = (sub.parentId._id || sub.parentId.id || sub.parentId.menuId || '').toString();
      } else {
        pId = (sub.parentId || '').toString();
      }

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
      const rMenuId = root.menuId !== undefined && root.menuId !== null ? String(root.menuId) : '';
      
      const children = [
        ...(subMap.get(rId) || []),
        ...(rMenuId && rMenuId !== rId ? (subMap.get(rMenuId) || []) : []),
      ];

      // Remove duplicates
      const uniqueChildren = Array.from(new Set(children.map((c) => c._id || c.id)))
        .map((id) => children.find((c) => (c._id || c.id) === id)!);

      uniqueChildren.sort((a, b) => (a.order || 0) - (b.order || 0));

      flatTree.push({
        menu: root,
        isSubmenu: false,
        subCount: uniqueChildren.length,
      });

      uniqueChildren.forEach((child) => {
        flatTree.push({
          menu: child,
          isSubmenu: true,
          parentName: root.name,
          parentIdStr: rMenuId || rId,
        });
      });
    });

    // Include any orphan submenus
    subs.forEach((sub) => {
      const sId = (sub._id || sub.id || '').toString();
      const alreadyIn = flatTree.some((f) => (f.menu._id || f.menu.id) === sId);
      if (!alreadyIn) {
        let pId = '';
        if (typeof sub.parentId === 'object' && sub.parentId) {
          pId = (sub.parentId._id || sub.parentId.id || sub.parentId.menuId || '').toString();
        } else {
          pId = (sub.parentId || '').toString();
        }
        const parentObj = idToMenu.get(pId);
        const pName = parentObj ? parentObj.name : `Parent #${pId}`;

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
        const matchNepali = (item.menu.menuNameNepali || '').toLowerCase().includes(q);
        const matchPath = item.menu.path.toLowerCase().includes(q);
        const matchParent = item.parentName?.toLowerCase().includes(q);
        const matchId = String(item.menu.menuId || '').includes(q);
        if (!matchName && !matchNepali && !matchPath && !matchParent && !matchId) return false;
      }

      // Hierarchy Filter
      if (hierarchyFilter === 'root') {
        return !item.isSubmenu;
      }
      if (hierarchyFilter === 'sub') {
        return item.isSubmenu;
      }
      if (hierarchyFilter === 'primary') {
        return Boolean(item.menu.isPrimary);
      }
      if (hierarchyFilter === 'single') {
        return Boolean(item.menu.isSinglePage);
      }
      if (hierarchyFilter !== 'all') {
        const selfId = (item.menu._id || item.menu.id || '').toString();
        const selfMenuId = String(item.menu.menuId || '');
        return (
          selfId === hierarchyFilter ||
          selfMenuId === hierarchyFilter ||
          item.parentIdStr === hierarchyFilter
        );
      }

      return true;
    });
  }, [hierarchicalList, searchQuery, hierarchyFilter]);

  // Open Add Modal
  const openAddModal = (presetParentId?: string) => {
    setEditingMenu(null);
    setFormName('');
    setFormNameNepali('');
    setFormPath('/auth/');
    const nextOrder = menus.length > 0 ? Math.max(...menus.map((m) => m.order || 0)) + 1 : 1;
    setFormOrder(nextOrder);
    setFormIcon('dashboard');
    setFormPrimary(false);
    setFormSinglePage(false);
    setFormIsNotParent(presetParentId ? true : false);
    setFormParentId(presetParentId || '');
    setFormIsNotChild(true);
    setFormChildId('');
    setFormRoles(['admin']);
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (menu: MenuItem) => {
    setEditingMenu(menu);
    setFormName(menu.name);
    setFormNameNepali(menu.menuNameNepali || '');
    setFormPath(menu.path);
    const pId =
      typeof menu.parentId === 'object' && menu.parentId
        ? (menu.parentId._id || menu.parentId.id || menu.parentId.menuId || '').toString()
        : menu.parentId !== null && menu.parentId !== undefined
        ? String(menu.parentId)
        : '';
    setFormParentId(pId);
    setFormIsNotParent(menu.isNotParent !== undefined ? menu.isNotParent : Boolean(pId));
    const cId =
      typeof menu.childId === 'object' && menu.childId
        ? (menu.childId._id || menu.childId.id || menu.childId.menuId || '').toString()
        : menu.childId !== null && menu.childId !== undefined
        ? String(menu.childId)
        : '';
    setFormChildId(cId);
    setFormIsNotChild(menu.isNotChild !== undefined ? menu.isNotChild : Boolean(cId));
    setFormIcon(menu.icon || 'dashboard');
    setFormOrder(menu.order || 0);
    setFormPrimary(Boolean(menu.isPrimary));
    setFormSinglePage(Boolean(menu.isSinglePage));
    setFormRoles(menu.roles || ['admin']);
    setFormActive(menu.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPath.trim()) {
      showToast('Menu name and Path are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: formName.trim(),
        menuNameNepali: formNameNepali.trim(),
        path: formPath.trim(),
        parentId: formIsNotParent && formParentId ? formParentId : null,
        childId: formIsNotChild && formChildId ? formChildId : null,
        icon: formIcon,
        order: Number(formOrder) || 0,
        isPrimary: Boolean(formPrimary),
        isSinglePage: Boolean(formSinglePage),
        isNotParent: Boolean(formIsNotParent),
        isNotChild: Boolean(formIsNotChild),
        isChild: Boolean(formIsNotParent && formParentId),
        roles: formRoles,
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
          showToast(`Menu "${formName}" created successfully`, 'success');
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
      <div className="px-2 flex items-center gap-1.5 text-[11px] leading-none text-slate-400 mb-2">
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
              title: <span className="text-slate-600 font-medium">Menu Setup</span>,
            },
          ]}
        />
      </div>

      {/* Main Menu Directory Card */}
      <div className="bg-white rounded-t-2xl rounded-b-md shadow-xs border border-slate-200/80">
        {/* Table Top Controls */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white relative z-20 rounded-t-2xl">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Menu Setup & Hierarchy
              </h3>
              <Tag className="m-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-[#0096C7] border-cyan-200">
                Menu Management
              </Tag>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Configure parent menus, submenus, paths, icons, order, and single page settings.
            </p>
          </div>

          {/* Action Toolbar on Right */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="w-full sm:w-[200px]">
              <AppInput
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder="Search menu or path..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Hierarchy Type Filter */}
            <div className="w-full sm:w-[180px]">
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
                  { label: 'Primary Menus Only', value: 'primary' },
                  { label: 'Single Page Only', value: 'single' },
                  ...rootMenusList.map((r) => ({
                    label: `Submenus of: ${r.name}`,
                    value: (r.menuId !== null && r.menuId !== undefined ? r.menuId : (r._id || r.id || '')).toString(),
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
              Add Menu
            </AppButton>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <AppTable>
            <thead>
              <tr>
                <th className="py-2.5 px-4 font-medium text-[12px] w-[80px]">Menu ID</th>
                <th className="py-2.5 px-4 font-medium text-[12px] w-[70px]">Order</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Menu Name (EN & Nepali)</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Path</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Hierarchy / Parent</th>
                <th className="py-2.5 px-4 font-medium text-[12px] text-center">Settings</th>
                <th className="py-2.5 px-4 font-medium text-[12px] text-center w-[80px]">Status</th>
                <th className="py-2.5 px-6 text-right font-medium text-[12px] w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <TableSkeleton columns={8} rows={8} hasAvatar={false} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No menus found matching your criteria. Click &quot;Add Menu&quot; to create one.
                  </td>
                </tr>
              ) : (
                paginatedItems.map(({ menu: m, isSubmenu, parentName, subCount }) => {
                  const mId = m._id || m.id;

                  return (
                    <tr
                      key={mId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSubmenu ? 'bg-slate-50/30' : 'bg-white font-medium'
                      }`}
                    >
                      {/* Menu ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        <Tag className="m-0 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border-slate-200">
                          #{m.menuId !== null && m.menuId !== undefined ? m.menuId : m._id.slice(-4)}
                        </Tag>
                      </td>

                      {/* Order */}
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {isSubmenu ? (
                          <div className="flex items-center text-slate-400">
                            <span className="text-slate-300 font-mono text-sm mr-1">└─</span>
                            <span>{m.order}</span>
                          </div>
                        ) : (
                          <span className="font-semibold">{m.order}</span>
                        )}
                      </td>

                      {/* Menu Name & Nepali Name & Icon */}
                      <td className="py-3 px-4">
                        <div className={`flex items-center gap-2.5 ${isSubmenu ? 'pl-3' : ''}`}>
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-base border shrink-0 ${
                              isSubmenu
                                ? 'bg-purple-50 text-purple-600 border-purple-100'
                                : 'bg-sky-50 text-[#0096C7] border-sky-100'
                            }`}
                          >
                            {getMenuIconElement(m.icon)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              <span>{m.name}</span>
                              {m.menuNameNepali && (
                                <span className="text-[11px] text-slate-500 font-normal">
                                  ({m.menuNameNepali})
                                </span>
                              )}
                              {m.isPrimary && (
                                <Tag className="m-0 text-[9px] font-bold px-1 py-0 rounded bg-amber-50 text-amber-700 border-amber-200">
                                  Primary
                                </Tag>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              icon: {m.icon}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Route Path */}
                      <td className="py-3 px-4 font-mono text-slate-700">
                        <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                          {m.path}
                        </span>
                      </td>

                      {/* Hierarchy Level */}
                      <td className="py-3 px-4">
                        {isSubmenu ? (
                          <Tag className="m-0 text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border-purple-200 inline-flex items-center gap-1">
                            <BranchesOutlined className="text-[10px]" />
                            <span>
                              Submenu of: <strong>{parentName || 'Parent'}</strong>
                            </span>
                          </Tag>
                        ) : (
                          <Tag className="m-0 text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border-blue-200 inline-flex items-center gap-1">
                            <FolderOutlined className="text-[10px]" />
                            <span>
                              {subCount && subCount > 0
                                ? `Parent (${subCount} submenus)`
                                : 'Parent Menu'}
                            </span>
                          </Tag>
                        )}
                      </td>

                      {/* Settings Flags */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {m.isSinglePage ? (
                            <Tag className="m-0 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                              Single Page
                            </Tag>
                          ) : (
                            <Tag className="m-0 text-[10px] bg-slate-50 text-slate-500 border-slate-200">
                              Group
                            </Tag>
                          )}
                        </div>
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-4 text-center">
                        <Switch
                          size="small"
                          checked={m.isActive !== false}
                          onChange={(checked) => handleToggleStatus(m, checked)}
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isSubmenu && (
                            <Tooltip title={`Add Submenu under "${m.name}"`}>
                              <AppButton
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                  const parentVal =
                                    m.menuId !== null && m.menuId !== undefined
                                      ? String(m.menuId)
                                      : (m._id || m.id || '').toString();
                                  openAddModal(parentVal);
                                }}
                              />
                            </Tooltip>
                          )}

                          <Tooltip title="Edit Menu">
                            <AppButton
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => openEditModal(m)}
                            />
                          </Tooltip>

                          {!m.isSystem && (
                            <Popconfirm
                              title="Delete Menu"
                              description={`Delete menu item "${m.name}"?`}
                              onConfirm={() => handleDeleteMenu(m)}
                              okText="Delete"
                              cancelText="Cancel"
                              okButtonProps={{ danger: true }}
                            >
                              <Tooltip title="Delete Menu">
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

        {/* Table Footer */}
        <div className="px-6 h-[32px] min-h-[32px] bg-[#0096C7] text-white rounded-b-md flex items-center justify-between text-[11px] shadow-inner select-none">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-medium text-white/90 text-[11px] leading-none">Total Menus:</span>
            <span className="font-bold text-white text-[11px] leading-none">
              {filteredList.length} Items
            </span>
          </div>

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

      {/* Add / Edit Menu Modal matching User's Exact Design */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-[#0096C7] tracking-tight">Menu</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#E63946] hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
              >
                <CloseOutlined className="text-sm stroke-2" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveMenu} className="p-6 space-y-6">
              {/* Row 1: Menu name | Menu name Nepali | Path */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Menu name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter menu name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#0096C7] focus:ring-1 focus:ring-[#0096C7] outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Menu name Nepali
                  </label>
                  <input
                    type="text"
                    placeholder="Optional Nepali name"
                    value={formNameNepali}
                    onChange={(e) => setFormNameNepali(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#0096C7] focus:ring-1 focus:ring-[#0096C7] outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Path
                  </label>
                  <input
                    type="text"
                    placeholder="/auth/example"
                    value={formPath}
                    onChange={(e) => setFormPath(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#0096C7] focus:ring-1 focus:ring-[#0096C7] outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Row 2: Menu order | Menu icon | Primary menu */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Menu order
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 68"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#0096C7] focus:ring-1 focus:ring-[#0096C7] outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Menu icon
                  </label>
                  <Select
                    value={formIcon || undefined}
                    onChange={(val) => setFormIcon(val)}
                    placeholder="Select an icon"
                    className="w-full h-[38px] [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-slate-300"
                    showSearch
                    optionFilterProp="filterValue"
                    options={AVAILABLE_ICONS.map((i) => ({
                      filterValue: `${i.label} ${i.value}`,
                      label: (
                        <span className="flex items-center gap-2">
                          <span className="text-[#0096C7]">{i.icon}</span>
                          <span className="font-mono text-xs">{i.label}</span>
                        </span>
                      ),
                      value: i.value,
                    }))}
                  />
                </div>

                <div className="pb-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formPrimary}
                      onChange={(e) => setFormPrimary(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0096C7] border-slate-300 focus:ring-[#0096C7] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-800">Primary menu</span>
                  </label>
                </div>
              </div>

              {/* Row 3: Single page | Is Not Parent? & Parent menu | Is Not Child? & Child menu */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Single page */}
                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formSinglePage}
                      onChange={(e) => setFormSinglePage(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0096C7] border-slate-300 focus:ring-[#0096C7] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-800">Single page</span>
                  </label>
                </div>

                {/* Is Not Parent? and Parent menu */}
                <div className="space-y-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formIsNotParent}
                      onChange={(e) => {
                        setFormIsNotParent(e.target.checked);
                        if (!e.target.checked) setFormParentId('');
                      }}
                      className="w-4 h-4 rounded text-[#0096C7] border-slate-300 focus:ring-[#0096C7] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-800">Is Not Parent?</span>
                  </label>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Parent menu
                    </label>
                    <Select
                      disabled={!formIsNotParent}
                      value={formParentId || undefined}
                      onChange={(val) => setFormParentId(val || '')}
                      placeholder="Select parent"
                      allowClear
                      className="w-full h-[38px] [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-slate-300"
                      showSearch
                      optionFilterProp="filterValue"
                      options={[
                        { filterValue: 'none root', label: 'None (Root Menu)', value: '' },
                        ...rootMenusList
                          .filter(
                            (r) =>
                              (r._id || r.id) !== (editingMenu?._id || editingMenu?.id)
                          )
                          .map((r) => {
                            const valStr = (r.menuId !== null && r.menuId !== undefined
                              ? r.menuId
                              : r._id || r.id || ''
                            ).toString();
                            return {
                              filterValue: `${r.name} ${r.path} ${valStr}`,
                              label: `${r.menuId ? `[#${r.menuId}] ` : ''}${r.name} (${r.path})`,
                              value: valStr,
                            };
                          }),
                      ]}
                    />
                  </div>
                </div>

                {/* Is Not Child? and Child menu */}
                <div className="space-y-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formIsNotChild}
                      onChange={(e) => {
                        setFormIsNotChild(e.target.checked);
                        if (!e.target.checked) setFormChildId('');
                      }}
                      className="w-4 h-4 rounded text-[#0096C7] border-slate-300 focus:ring-[#0096C7] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-800">Is Not Child?</span>
                  </label>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Child menu
                    </label>
                    <Select
                      disabled={!formIsNotChild}
                      value={formChildId || undefined}
                      onChange={(val) => setFormChildId(val || '')}
                      placeholder="Select child"
                      allowClear
                      className="w-full h-[38px] [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-slate-300"
                      showSearch
                      optionFilterProp="filterValue"
                      options={[
                        { filterValue: 'none', label: 'None', value: '' },
                        ...menus
                          .filter(
                            (m) =>
                              (m._id || m.id) !== (editingMenu?._id || editingMenu?.id)
                          )
                          .map((m) => {
                            const valStr = (m.menuId !== null && m.menuId !== undefined
                              ? m.menuId
                              : m._id || m.id || ''
                            ).toString();
                            return {
                              filterValue: `${m.name} ${m.path} ${valStr}`,
                              label: `${m.menuId ? `[#${m.menuId}] ` : ''}${m.name} (${m.path})`,
                              value: valStr,
                            };
                          }),
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#0096C7] hover:bg-[#0077B6] text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <SaveOutlined className="text-base" />
                  <span>{submitting ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default MenuManagement;
