import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  TeamOutlined,
  ShopOutlined,
  LogoutOutlined,
  MenuOutlined,
  CloseOutlined,
  UserOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  SettingOutlined,
  LineChartOutlined,
  RocketOutlined,
  BellOutlined,
  TagOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  StarOutlined,
  HistoryOutlined,
  CustomerServiceOutlined,
  LockOutlined,
  ClockCircleOutlined,
  PictureOutlined,
  FolderOutlined,
  BranchesOutlined,
  InboxOutlined,
  CompassOutlined,
  DollarOutlined,
  CalendarOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, MenuProps, Tooltip, Result, Spin, Popover, Switch } from 'antd';
import { io, Socket } from 'socket.io-client';
import { useAuth } from 'auth-client/hooks/useAuth';
import { Role } from 'auth-client/config/appConfig';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../context/PermissionContext';
import { AppButton, DashboardSkeleton } from 'shared-components';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { MenuItem } from '../../../types/ecommerce.types';
import { RoleSwitcherSelect } from './RoleSwitcherSelect';
import { ttsService } from '../../../services/TtsService';

// Helper to map icon names (Ant Design + Material icon names) to Ant Design icons
const renderMenuIcon = (iconName: string) => {
  const normalized = (iconName || '').toLowerCase().replace(/outlined$/, '');
  switch (normalized) {
    case 'dashboard':
    case 'dashboardoutlined':
      return <DashboardOutlined />;
    case 'shopping':
    case 'shoppingoutlined':
    case 'shopping_cart':
    case 'shopping_cart_checkout':
    case 'add_shopping_cart':
      return <ShoppingOutlined />;
    case 'appstore':
    case 'appstoreoutlined':
    case 'table_restaurant':
    case 'grid_view':
    case 'category':
      return <AppstoreOutlined />;
    case 'filetext':
    case 'filetextoutlined':
    case 'menu_book':
    case 'list_alt':
    case 'receipt_long':
    case 'receipt':
    case 'note_add':
    case 'list':
      return <FileTextOutlined />;
    case 'team':
    case 'teamoutlined':
    case 'person':
    case 'group':
    case 'groups':
    case 'badge':
    case 'person_search':
    case 'person_add':
      return <TeamOutlined />;
    case 'safetycertificate':
    case 'safetycertificateoutlined':
    case 'admin_panel_settings':
    case 'shield':
      return <SafetyCertificateOutlined />;
    case 'key':
    case 'keyoutlined':
      return <KeyOutlined />;
    case 'menu':
    case 'menuoutlined':
      return <MenuOutlined />;
    case 'linechart':
    case 'linechartoutlined':
    case 'assessment':
    case 'analytics':
      return <LineChartOutlined />;
    case 'rocket':
    case 'rocketoutlined':
      return <RocketOutlined />;
    case 'setting':
    case 'settingoutlined':
    case 'settings':
    case 'tune':
      return <SettingOutlined />;
    case 'shop':
    case 'shopoutlined':
    case 'restaurant':
    case 'restaurant_menu':
    case 'local_bar':
    case 'business':
    case 'business_center':
    case 'corporate_fare':
      return <ShopOutlined />;
    case 'bell':
    case 'belloutlined':
      return <BellOutlined />;
    case 'tag':
    case 'tagoutlined':
      return <TagOutlined />;
    case 'star':
    case 'staroutlined':
      return <StarOutlined />;
    case 'history':
    case 'historyoutlined':
      return <HistoryOutlined />;
    case 'lock':
    case 'lockoutlined':
      return <LockOutlined />;
    case 'picture':
    case 'pictureoutlined':
    case 'photo_camera':
      return <PictureOutlined />;
    case 'folder':
    case 'folderoutlined':
    case 'inventory_2':
      return <FolderOutlined />;
    case 'branches':
    case 'branchesoutlined':
    case 'account_tree':
      return <BranchesOutlined />;
    case 'inbox':
    case 'inboxoutlined':
    case 'move_to_inbox':
      return <InboxOutlined />;
    case 'compass':
    case 'compassoutlined':
    case 'map':
      return <CompassOutlined />;
    case 'dollar':
    case 'dollaroutlined':
    case 'request_quote':
    case 'account_balance_wallet':
    case 'invoicing':
      return <DollarOutlined />;
    case 'calendar':
    case 'calendaroutlined':
    case 'calendar_month':
    case 'beach_access':
    case 'schedule':
    case 'event_available':
    case 'event_busy':
    case 'edit_calendar':
      return <CalendarOutlined />;
    case 'checkcircle':
    case 'checkcircleoutlined':
    case 'approval':
    case 'fact_check':
    case 'verified':
    case 'task_alt':
      return <CheckCircleOutlined />;
    case 'clockcircle':
    case 'clockcircleoutlined':
    case 'pending_actions':
      return <ClockCircleOutlined />;
    default:
      return <AppstoreOutlined />;
  }
};

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'stock' | 'user' | 'system';
  read: boolean;
}

export const AuthorizedLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dynamicMenus, setDynamicMenus] = useState<MenuItem[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(ttsService.muted);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'New Customer Order',
      message: 'Ava Wilson placed order ORD-8921-105 for $864.92',
      time: '10m ago',
      type: 'order',
      read: false,
    },
    {
      id: '2',
      title: 'Low Stock Alert',
      message: 'Ultralight Trail Titanium Flask only has 2 units remaining',
      time: '25m ago',
      type: 'stock',
      read: false,
    },
    {
      id: '3',
      title: 'New Customer Registered',
      message: 'Sophia Taylor created a verified buyer account',
      time: '1h ago',
      type: 'user',
      read: false,
    },
    {
      id: '4',
      title: 'Redis Cache Connected',
      message: 'In-memory engine is active for high-speed dashboard delivery',
      time: 'Just now',
      type: 'system',
      read: true,
    },
  ]);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, switchRole, originalRole, formattedExpiry } = useAuth();
  const { showToast } = useToast();
  const { canAccessPage, refreshPermissions } = usePermissions();

  // Authentication Middleware Guard:
  // If no auth token in localStorage or context, immediately redirect to /login
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    const currentToken = localStorage.getItem('authToken');
    if (!currentToken) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [location.pathname, navigate]);

  // Real-time Socket.IO Notification Listener
  useEffect(() => {
    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5001' : window.location.origin;
    let socket: Socket | null = null;
    try {
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
      });

      socket.on('notification:new', (notif: NotificationItem) => {
        setNotifications((prev) => [notif, ...prev]);
        ttsService.speakNotification(notif.title, notif.message);
      });
    } catch {
      // Socket fallback
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const userRole = (user?.role || 'admin').toLowerCase();
  const isSeller = userRole === 'seller';
  const isCustomer = userRole === 'customer' || userRole === 'user';
  const isSupport = userRole === 'support';
  const isManager = userRole === 'manager';
  const isAdmin = userRole === 'admin';

  // Format today's date like "15 Nov 2026"
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Fetch dynamic navigation menus from the database (Role & Permission filtered)
  const fetchMenus = async (roleToFetch = userRole) => {
    setLoadingMenus(true);
    try {
      const res = await ecommerceService.getUserMenus(roleToFetch);
      if (res.success && res.data && res.data.menus) {
        setDynamicMenus(res.data.menus);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingMenus(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMenus(userRole);
    }
  }, [userRole, token]);

  // Auto-expand parent menus when a subItem's route is active
  useEffect(() => {
    if (dynamicMenus.length > 0) {
      setExpandedMenus((prev) => {
        const next = { ...prev };
        dynamicMenus.forEach((m) => {
          if (m.subItems && m.subItems.some((s) => location.pathname === s.path || (s.path !== '/admin' && location.pathname.startsWith(s.path)))) {
            next[m.name] = true;
          }
        });
        return next;
      });
    }
  }, [location.pathname, dynamicMenus]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const isActive = (itemPath: string) => {
    if (!itemPath || itemPath === '#') return false;
    if (itemPath === '/admin' || itemPath === '/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/dashboard';
    }
    return location.pathname === itemPath || (itemPath !== '/' && location.pathname.startsWith(itemPath));
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // User initials for circle avatar
  const userInitials = user?.firstName
    ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`.toUpperCase()
    : 'AD';

  const handleRoleSelect = (role: Role, defaultPage: string) => {
    switchRole(role);
    fetchMenus(role);
    refreshPermissions(role);
    navigate(defaultPage);
    showToast(`Switched to ${role.toUpperCase()} perspective. Navigated to: ${defaultPage}`, 'info');
  };

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);

  const handleToggleVoice = () => {
    const next = ttsService.toggleMuted();
    setIsVoiceMuted(next);
    if (!next) {
      ttsService.speakNotification('Voice notifications enabled', 'Amy and Nepali Google voice are active');
    }
  };

  const settingsMenuContent = (
    <div className="w-[270px] p-2 font-['Poppins','Inter',sans-serif]">
      <div className="px-2 py-1.5 border-b border-slate-100 flex items-center gap-2">
        <SettingOutlined className="text-[#0096C7] text-sm" />
        <span className="font-bold text-slate-900 text-xs">Settings</span>
      </div>

      <div className="py-1.5 space-y-1">
        {/* Offline TTS Voice Announcer Toggle (Amy + Nepali Google 2) */}
        <div
          onClick={handleToggleVoice}
          className="flex items-center justify-between gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-colors ${
                isVoiceMuted ? 'bg-slate-100 text-slate-400' : 'bg-sky-50 text-[#0096C7]'
              }`}
            >
              <SoundOutlined />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                Voice Notifications
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {isVoiceMuted ? 'Muted' : 'Active: Amy (EN) & Google 2 (NE)'}
              </div>
            </div>
          </div>
          <Switch
            size="small"
            checked={!isVoiceMuted}
            onChange={() => handleToggleVoice()}
            onClick={(_, e) => e.stopPropagation()}
          />
        </div>

        <Link
          to="/admin/security"
          onClick={() => setSettingsMenuOpen(false)}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 hover:text-[#0284c7] text-xs font-semibold text-slate-700 transition-colors"
        >
          <SafetyCertificateOutlined className="text-slate-400 text-sm" />
          <span>Security &amp; Passkeys</span>
        </Link>
      </div>
    </div>
  );

  const accountMenuContent = (
    <div className="w-[260px] p-2 font-['Poppins','Inter',sans-serif]">
      {/* Account Profile Summary */}
      <div className="p-2 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#f97316] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
          {userInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-slate-900 text-xs truncate">
            {user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono truncate">
            {user?.email || 'admin@store.com'}
          </div>
        </div>
      </div>

      {/* Role Switcher Section INSIDE Account Dropdown */}
      <div className="px-2 py-2 border-b border-slate-100">
        <span className="block text-[11px] font-bold text-[#64748b] leading-tight mb-1 select-none">
          Current role
        </span>
        <RoleSwitcherSelect
          currentRole={userRole}
          onRoleSelect={(role, defaultPage) => {
            handleRoleSelect(role, defaultPage);
            setAccountMenuOpen(false);
          }}
          showLabel={false}
        />
      </div>

      {/* Account Navigation Links */}
      <div className="space-y-0.5 py-1 text-xs font-semibold text-slate-700">
        <Link
          to="/admin/profile"
          onClick={() => setAccountMenuOpen(false)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 hover:text-[#0284c7] transition-colors"
        >
          <UserOutlined className="text-slate-400 text-sm" />
          <span>Profile</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            toggleFullscreen();
            setAccountMenuOpen(false);
          }}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors text-left cursor-pointer"
        >
          {isFullscreen ? (
            <FullscreenExitOutlined className="text-slate-400 text-sm" />
          ) : (
            <FullscreenOutlined className="text-slate-400 text-sm" />
          )}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
        </button>
      </div>

      {/* Sign Out */}
      <div className="pt-1.5 mt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors text-xs font-bold cursor-pointer text-left"
        >
          <LogoutOutlined className="text-sm" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  const availableRoles: Array<{
    key: Role;
    label: string;
    description: string;
    badgeColor: string;
    icon: React.ReactNode;
    defaultPage: string;
  }> = [
    {
      key: 'admin',
      label: 'Super Admin',
      description: 'Full database, system settings & security',
      badgeColor: '#0284c7',
      icon: <SafetyCertificateOutlined className="text-[#0284c7]" />,
      defaultPage: '/admin',
    },
    {
      key: 'seller',
      label: 'Marketplace Seller',
      description: 'Vendor products, stock, profile & orders',
      badgeColor: '#f97316',
      icon: <ShopOutlined className="text-[#f97316]" />,
      defaultPage: '/admin',
    },
    {
      key: 'customer',
      label: 'Customer / Buyer',
      description: 'Public catalog, cart & personal purchases',
      badgeColor: '#3b82f6',
      icon: <UserOutlined className="text-[#3b82f6]" />,
      defaultPage: '/',
    },
    {
      key: 'support',
      label: 'Support Desk',
      description: 'Order fulfillment & customer care inquiries',
      badgeColor: '#10b981',
      icon: <CustomerServiceOutlined className="text-[#10b981]" />,
      defaultPage: '/admin/orders',
    },
    {
      key: 'manager',
      label: 'Store Operations Manager',
      description: 'Inventory thresholds, categories & catalog',
      badgeColor: '#a855f7',
      icon: <AppstoreOutlined className="text-[#a855f7]" />,
      defaultPage: '/admin/inventory',
    },
  ];

  const handleRoleSwitch = async (newRole: Role) => {
    switchRole(newRole);
    const targetPage = availableRoles.find((r) => r.key === newRole)?.defaultPage || '/admin';
    await fetchMenus(newRole);
    navigate(targetPage);
    showToast(`Switched to ${newRole.toUpperCase()} perspective. Navigated to: ${targetPage}`, 'info');
  };

  const roleSwitcherPopoverContent = (
    <div className="w-[300px] p-1 font-['Poppins','Inter',sans-serif]">
      <div className="pb-2.5 mb-2 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900">Switch Role Perspective</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Navigates to default page & adapts menu permissions
          </p>
        </div>
        {sessionStorage.getItem('testRoleOverride') && (
          <button
            onClick={() => handleRoleSwitch('admin')}
            className="text-[10px] font-bold text-[#0284c7] hover:underline cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {availableRoles.map((r) => {
          const isCurrent = userRole === r.key;
          return (
            <div
              key={r.key}
              onClick={() => handleRoleSwitch(r.key)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                isCurrent
                  ? 'bg-blue-50/70 border-[#0284c7] shadow-2xs'
                  : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 border"
                  style={{
                    backgroundColor: `${r.badgeColor}15`,
                    borderColor: `${r.badgeColor}30`,
                    color: r.badgeColor,
                  }}
                >
                  {r.icon}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">{r.label}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-[#0284c7] text-[9px] font-extrabold uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    Default: <span className="font-mono text-slate-600">{r.defaultPage}</span>
                  </div>
                </div>
              </div>

              {isCurrent ? (
                <CheckCircleOutlined className="text-[#0284c7] text-xs shrink-0" />
              ) : (
                <span className="text-slate-300 text-xs shrink-0">›</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Auth Middleware check: if not logged in, block rendering and show verification skeleton
  if (!token) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-['Poppins','Inter',sans-serif]">
        <div className="h-14 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between">
          <div className="w-32 h-6 bg-slate-200 animate-pulse rounded-lg" />
          <div className="w-48 h-8 bg-slate-200 animate-pulse rounded-full" />
        </div>
        <div className="flex-1 flex">
          <div className="w-64 bg-white border-r border-slate-200/80 p-4 space-y-3 hidden md:block">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 bg-slate-100 animate-pulse rounded-xl" />
            ))}
          </div>
          <div className="flex-1 p-6">
            <DashboardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Filter and sort menus by display order & permission
  const filteredMenus = [...dynamicMenus]
    .filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = m.name.toLowerCase().includes(q);
        const matchNepali = (m.menuNameNepali || '').toLowerCase().includes(q);
        const matchPath = (m.path || '').toLowerCase().includes(q);
        const matchSub =
          Array.isArray(m.subItems) &&
          m.subItems.some(
            (s) =>
              s.label.toLowerCase().includes(q) ||
              (s.nameNepali || '').toLowerCase().includes(q) ||
              (s.path || '').toLowerCase().includes(q)
          );
        if (!matchName && !matchNepali && !matchPath && !matchSub) return false;
      }
      // Strictly filter to legitimate E-Commerce platform pages only
      if (m.path && !m.path.startsWith('/admin') && m.path !== '#') {
        return false;
      }

      // Filter subItems to only valid E-Commerce platform paths
      if (Array.isArray(m.subItems)) {
        m.subItems = m.subItems.filter(
          (s) => s.path && (s.path.startsWith('/admin') || s.path === '#')
        );
      }

      if (isAdmin || userRole === 'admin') return true;
      // Direct path check if no subItems
      const hasSub = Array.isArray(m.subItems) && m.subItems.length > 0;
      if (!hasSub && m.path && !canAccessPage(m.path)) return false;
      if (hasSub) {
        // If all subItems are inaccessible, hide the parent
        const accessibleSubs = m.subItems!.filter((sub) => canAccessPage(sub.path));
        if (accessibleSubs.length === 0) return false;
      }
      return true;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Notification Popover Content (Live Socket Stream)
  const notificationContent = (
    <div className="w-[85vw] sm:w-[360px] p-1 font-['Poppins','Inter',sans-serif]">
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[#f97316] font-bold text-[10px]">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="text-[11px] font-semibold text-[#0284c7] hover:underline cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-2.5 rounded-xl border transition-colors flex items-start gap-2.5 ${
              n.read
                ? 'bg-white border-slate-100 text-slate-600'
                : 'bg-orange-50/40 border-orange-100 text-slate-900'
            }`}
          >
            <div className="mt-0.5">
              {n.type === 'order' && <ShoppingOutlined className="text-[#f97316] text-sm" />}
              {n.type === 'stock' && <WarningOutlined className="text-amber-500 text-sm" />}
              {n.type === 'user' && <TeamOutlined className="text-[#0284c7] text-sm" />}
              {n.type === 'system' && <InfoCircleOutlined className="text-blue-500 text-sm" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs truncate">{n.title}</span>
                <span className="text-[10px] text-slate-400 shrink-0 ml-1">{n.time}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2.5 mt-2 border-t border-slate-100 text-center">
        <Link
          to="/admin/orders"
          onClick={() => setNotificationsOpen(false)}
          className="text-xs font-semibold text-[#0284c7] hover:underline"
        >
          View all transactions
        </Link>
      </div>
    </div>
  );

  const isFullHeightPage =
    location.pathname.startsWith('/admin/profile') ||
    location.pathname.startsWith('/admin/brands') ||
    location.pathname.startsWith('/admin/products') ||
    location.pathname.startsWith('/admin/categories') ||
    location.pathname.startsWith('/admin/inventory') ||
    location.pathname.startsWith('/admin/orders') ||
    location.pathname.startsWith('/admin/billing') ||
    location.pathname.startsWith('/admin/reviews') ||
    location.pathname.startsWith('/admin/discounts') ||
    location.pathname.startsWith('/admin/banners') ||
    location.pathname.startsWith('/admin/customers') ||
    location.pathname.startsWith('/admin/accounts') ||
    location.pathname.startsWith('/admin/employees') ||
    location.pathname.startsWith('/admin/clients') ||
    location.pathname.startsWith('/admin/audit-logs') ||
    location.pathname.startsWith('/admin/security') ||
    location.pathname.startsWith('/admin/roles') ||
    location.pathname.startsWith('/admin/permissions') ||
    location.pathname.startsWith('/admin/user-roles') ||
    location.pathname.startsWith('/admin/menus');

  return (
    <div className="h-screen w-full bg-white text-[#1e293b] flex flex-col font-['Poppins','Inter',sans-serif] antialiased overflow-hidden">
      {/* =========================================================================
          Top Reference Header Bar
          - REMOVED Horizontal nav tabs
          - REMOVED Plus button
          - Clean Left: Hamburger + Logo Brand
          - Right: Search + Date + Socket Notification Bell + User Avatar
         ========================================================================= */}
      <header className="sticky top-0 z-30 shrink-0 bg-white border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 h-16 flex items-center justify-between gap-3">
        {/* Left Side: Hamburger Button + Company Logo & Title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger / Navigation Menu Button (Borderless) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 shrink-0 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center text-lg transition-colors cursor-pointer border-0"
            title="Open Sidebar Navigation"
          >
            <MenuOutlined />
          </button>

          {/* Company Brand Logo & Name */}
          <Link
            to="/admin"
            className="flex items-center gap-2.5 text-decoration-none group outline-none border-0 focus:outline-none ring-0"
            title="Himalaya Online Shop"
          >
            <img
              src="/images/logo.png"
              alt="Himalaya Online Shop"
              className="h-9 w-auto max-w-[160px] object-contain group-hover:scale-105 transition-transform"
            />
          </Link>
        </div>

        {/* Center / Right Tools: Search Pill, Date, Socket.IO Notifications, User Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Search Pill Input */}
          <div className="relative hidden lg:block w-[20vw]">
            <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search admin pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50/60 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition-all"
            />
          </div>

          {/* Today's Date */}
          <span className="hidden sm:inline-block text-xs font-medium text-slate-600 whitespace-nowrap px-1">
            {formattedDate}
          </span>

          {/* Real-time Socket.IO Notification Bell */}
          <Popover
            content={notificationContent}
            trigger="click"
            open={notificationsOpen}
            onOpenChange={setNotificationsOpen}
            placement="bottomRight"
            overlayInnerStyle={{ padding: 0 }}
          >
            <button className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-600 flex items-center justify-center text-sm transition-colors cursor-pointer relative border-0">
              <BellOutlined />
              {unreadCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] absolute top-1 right-1 ring-2 ring-white animate-pulse" />
              )}
            </button>
          </Popover>

          {/* Settings Menu Popover (includes Offline TTS Voice Announcer Toggle) */}
          <Popover
            content={settingsMenuContent}
            trigger="click"
            open={settingsMenuOpen}
            onOpenChange={setSettingsMenuOpen}
            placement="bottomRight"
            overlayInnerStyle={{ padding: 0 }}
            arrow
          >
            <Tooltip title="Settings">
              <button
                type="button"
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors cursor-pointer border-0 ${
                  settingsMenuOpen ? 'text-[#0096C7] bg-sky-50' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <SettingOutlined />
              </button>
            </Tooltip>
          </Popover>

          {/* Circular User Avatar Dropdown Button (Role Switcher inside Account Dropdown) */}
          <Popover
            content={accountMenuContent}
            trigger="click"
            open={accountMenuOpen}
            onOpenChange={setAccountMenuOpen}
            placement="bottomRight"
            overlayInnerStyle={{ padding: 0 }}
            arrow
          >
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#f97316] hover:opacity-90 text-white font-bold text-xs flex items-center justify-center transition-opacity cursor-pointer border-0 shadow-xs"
            >
              {userInitials}
            </button>
          </Popover>
        </div>
      </header>

      {/* =========================================================================
          Slide-out Drawer Sidebar (Orange & Blue Theme Matching Logo)
         ========================================================================= */}
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-[9990] backdrop-blur-[2px] transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Drawer Container */}
      <aside
        data-drawer="true"
        className={`fixed top-0 bottom-0 left-0 w-[40vw] md:w-[30vw] lg:w-[20vw] min-w-[280px] bg-white z-[10000] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Pinned Logo Section */}
        <div className="h-24 px-4 flex items-center justify-between border-b border-slate-100 bg-white relative">
          <Link
            to="/admin"
            className="flex items-center gap-2 group"
            onClick={() => setSidebarOpen(false)}
          >
            <img
              src="/images/logo.png"
              alt="Himalaya Online Shop"
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center text-xs transition-colors cursor-pointer"
            title="Close Sidebar"
          >
            <CloseOutlined />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav
          className="flex-1 px-4 py-3 space-y-2 overflow-y-auto no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loadingMenus ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            filteredMenus.map((item) => {
              const hasSub = Array.isArray(item.subItems) && item.subItems.length > 0;
              const isChildActive =
                hasSub &&
                item.subItems!.some(
                  (sub) =>
                    location.pathname === sub.path ||
                    (sub.path !== '/admin' && location.pathname.startsWith(sub.path))
                );
              const active = isActive(item.path) || isChildActive;
              const isOpen = expandedMenus[item.name] ?? isChildActive;

              const handleItemClick = (e: React.MouseEvent) => {
                if (hasSub) {
                  e.preventDefault();
                  setExpandedMenus((prev) => ({
                    ...prev,
                    [item.name]: !isOpen,
                  }));
                } else {
                  setSidebarOpen(false);
                }
              };

              return (
                <div key={item.path || item.name} className="relative group/menuitem">
                  {hasSub ? (
                    <button
                      type="button"
                      onClick={handleItemClick}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer text-left group ${
                        isOpen
                          ? 'bg-white text-slate-800 border-amber-400 shadow-xs ring-1 ring-amber-400/20'
                          : active
                          ? 'bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white border-[#0284c7] shadow-sm'
                          : 'bg-white text-slate-700 border-slate-100/90 hover:border-amber-300 hover:text-amber-600 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span
                          className={`text-base shrink-0 ${
                            active && !isOpen
                              ? 'text-white'
                              : 'text-[#0284c7]'
                          }`}
                        >
                          {renderMenuIcon(item.icon)}
                        </span>
                        <span className={`truncate ${active && !isOpen ? 'text-white' : 'text-slate-800'}`}>
                          {item.name}
                        </span>
                      </div>

                      {/* Modern Chevron down/up indicator */}
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ml-1.5 ${
                          isOpen
                            ? 'text-[#0284c7] rotate-180'
                            : active
                            ? 'text-white'
                            : 'text-[#ea580c] group-hover:text-[#0284c7]'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.2}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer shadow-2xs ${
                        active
                          ? 'bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white border-[#0284c7] shadow-sm border-l-4 border-l-[#f97316]'
                          : 'bg-white text-slate-700 border-slate-100/90 hover:border-amber-300 hover:text-amber-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span
                          className={`text-base shrink-0 ${
                            active
                              ? 'text-white'
                              : 'text-[#0284c7] group-hover/menuitem:text-[#ea580c]'
                          }`}
                        >
                          {renderMenuIcon(item.icon)}
                        </span>
                        <span className={`truncate ${active ? 'text-white' : 'text-slate-800'}`}>
                          {item.name}
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* Inline Collapsible Submenu Accordion */}
                  {hasSub && isOpen && (
                    <div className="mt-1.5 ml-4 pl-4 border-l-2 border-amber-400 space-y-1.5 py-1.5">
                      {/* Direct access to parent route if defined and marked as Single Page */}
                      {item.path &&
                        item.path !== '#' &&
                        item.isSinglePage &&
                        !item.subItems!.some((s) => s.path === item.path) && (
                          <Link
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              location.pathname === item.path
                                ? 'bg-sky-50 text-[#0284c7] border-l-2 border-l-[#f97316] shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-amber-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs text-slate-400 shrink-0">
                              {renderMenuIcon(item.icon)}
                            </span>
                            <span className="truncate">{item.name} Overview</span>
                          </Link>
                        )}
                      {item.subItems!
                        .filter((sub) => isAdmin || userRole === 'admin' || canAccessPage(sub.path))
                        .map((sub) => {
                          const subActive =
                            location.pathname === sub.path ||
                            (sub.path !== '/admin' &&
                              sub.path !== '/dashboard' &&
                              location.pathname.startsWith(sub.path));
                          return (
                            <Link
                              key={sub.path || sub.label}
                              to={sub.path}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                subActive
                                  ? 'bg-sky-50 text-[#0284c7] border-l-2 border-l-[#f97316] shadow-2xs font-bold'
                                  : 'text-slate-600 hover:text-amber-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 truncate">
                                <span
                                  className={`text-xs shrink-0 ${
                                    subActive ? 'text-[#0284c7]' : 'text-slate-400'
                                  }`}
                                >
                                  {renderMenuIcon(sub.icon || 'FileTextOutlined')}
                                </span>
                                <span className="truncate">{sub.label}</span>
                              </div>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>
      </aside>

      {/* =========================================================================
          Main Content Canvas (Fluid Window Ratio Sizing)
         ========================================================================= */}
      <main
        className={`flex-1 w-full relative bg-white ${
          isFullHeightPage
            ? 'overflow-hidden flex flex-col h-[calc(100vh-4rem)]'
            : 'overflow-y-auto'
        }`}
      >
        <div
          className={`w-full ${
            isFullHeightPage
              ? 'h-full p-2 sm:p-3 flex flex-col overflow-hidden min-h-0'
              : 'p-4'
          }`}
        >
          {canAccessPage(location.pathname) ? (
            <Outlet />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-12 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 text-2xl border border-amber-100">
                <LockOutlined />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2">
                Access Restricted: Insufficient Privileges
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Your current role (<span className="font-semibold text-slate-700 uppercase">{userRole}</span>) does not have authorization to view this module (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700">{location.pathname}</code>). Contact an administrator to grant access in Role Permissions.
              </p>
              <div className="flex items-center justify-center gap-3">
                <AppButton
                  type="primary"
                  onClick={() => navigate('/admin')}
                  style={{ backgroundColor: '#0096C7' }}
                >
                  Return to Dashboard
                </AppButton>
                <AppButton onClick={() => navigate('/')}>
                  Storefront
                </AppButton>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Page Footer */}
      <footer className="shrink-0 w-full bg-white border-t border-slate-200/80 shadow-[0_-3px_12px_rgba(0,0,0,0.04)] py-2.5 px-4 text-center text-xs text-slate-600 z-20 select-none">
        © 2026 Himalaya Online Shop · <span className="font-semibold text-slate-700">{isSeller ? 'Seller Portal' : isSupport ? 'Support Desk' : isManager ? 'Store Operations' : 'Super Admin'}</span>
      </footer>
    </div>
  );
};

export const AdminLayout = AuthorizedLayout;
export default AuthorizedLayout;
