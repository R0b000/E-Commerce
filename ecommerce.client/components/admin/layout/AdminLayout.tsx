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
} from '@ant-design/icons';
import { Avatar, Dropdown, MenuProps, Tooltip, Result, Spin, Popover } from 'antd';
import { io, Socket } from 'socket.io-client';
import { useAuth } from 'auth-client/hooks/useAuth';
import { Role } from 'auth-client/config/appConfig';
import { useToast } from '../../../context/ToastContext';
import { AppButton } from 'shared-components/AppButton';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { MenuItem } from '../../../types/ecommerce.types';
import { RoleSwitcherSelect } from './RoleSwitcherSelect';

// Helper to map icon names to Ant Design icons
const renderMenuIcon = (iconName: string) => {
  switch (iconName) {
    case 'DashboardOutlined':
      return <DashboardOutlined />;
    case 'ShoppingOutlined':
      return <ShoppingOutlined />;
    case 'AppstoreOutlined':
      return <AppstoreOutlined />;
    case 'FileTextOutlined':
      return <FileTextOutlined />;
    case 'TeamOutlined':
      return <TeamOutlined />;
    case 'SafetyCertificateOutlined':
      return <SafetyCertificateOutlined />;
    case 'KeyOutlined':
      return <KeyOutlined />;
    case 'MenuOutlined':
      return <MenuOutlined />;
    case 'LineChartOutlined':
      return <LineChartOutlined />;
    case 'RocketOutlined':
      return <RocketOutlined />;
    case 'SettingOutlined':
      return <SettingOutlined />;
    case 'ShopOutlined':
      return <ShopOutlined />;
    case 'BellOutlined':
      return <BellOutlined />;
    case 'TagOutlined':
      return <TagOutlined />;
    case 'StarOutlined':
      return <StarOutlined />;
    case 'HistoryOutlined':
      return <HistoryOutlined />;
    case 'LockOutlined':
      return <LockOutlined />;
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

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dynamicMenus, setDynamicMenus] = useState<MenuItem[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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
  const { user, logout, switchRole, originalRole } = useAuth();
  const { showToast } = useToast();

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
    if (itemPath === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(itemPath);
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
    navigate(defaultPage);
    showToast(`Switched to ${role.toUpperCase()} perspective. Navigated to: ${defaultPage}`, 'info');
  };

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const accountMenuContent = (
    <div className="w-[280px] p-1 font-['Poppins','Inter',sans-serif]">
      {/* Account Profile Summary */}
      <div className="p-2.5 pb-3 border-b border-slate-100 flex items-center gap-3">
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
          <div className="mt-1">
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                isSeller
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : isSupport
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : isManager
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : isCustomer
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-blue-100 text-[#0284c7] border border-blue-200'
              }`}
            >
              {isSeller
                ? 'Seller Account'
                : isSupport
                ? 'Support Specialist'
                : isManager
                ? 'Store Manager'
                : isCustomer
                ? 'Customer Account'
                : 'Super Admin'}
            </span>
          </div>
        </div>
      </div>

      {/* Role Switcher Section INSIDE Account Dropdown */}
      <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 rounded-xl my-2">
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
          to="/admin/inventory"
          onClick={() => setAccountMenuOpen(false)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <AppstoreOutlined className="text-slate-400 text-sm" />
          <span>Stock & Inventory</span>
        </Link>
        <Link
          to="/admin/seller-profile"
          onClick={() => setAccountMenuOpen(false)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ShopOutlined className="text-slate-400 text-sm" />
          <span>Seller & Vendor Profile</span>
        </Link>
        <Link
          to="/admin/security"
          onClick={() => setAccountMenuOpen(false)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <LockOutlined className="text-slate-400 text-sm" />
          <span>Security & Passkeys</span>
        </Link>
        <Link
          to="/"
          onClick={() => setAccountMenuOpen(false)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ShopOutlined className="text-slate-400 text-sm" />
          <span>Customer Store</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            toggleFullscreen();
            setAccountMenuOpen(false);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left cursor-pointer"
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
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors text-xs font-bold cursor-pointer text-left"
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

  // Auth Middleware check: if not logged in, block rendering and show verification
  if (!token) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex flex-col items-center justify-center space-y-3 font-['Poppins','Inter',sans-serif]">
        <Spin size="large" />
        <p className="text-xs font-semibold text-slate-500">Checking authentication token...</p>
      </div>
    );
  }

  // Filter menus for search if needed
  const filteredMenus = dynamicMenus.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9] text-[#1e293b] flex flex-col font-['Poppins','Inter',sans-serif] antialiased">
      {/* =========================================================================
          Top Reference Header Bar
          - REMOVED Horizontal nav tabs
          - REMOVED Plus button
          - Clean Left: Hamburger + Logo Brand
          - Right: Search + Date + Socket Notification Bell + User Avatar
         ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-[2.5vw] h-16 flex items-center justify-between gap-3">
        {/* Left Side: Hamburger Button + Company Logo & Title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 shrink-0 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center text-lg transition-colors cursor-pointer shadow-2xs hover:border-[#f97316]/50"
            title="Open Sidebar Navigation"
          >
            <MenuOutlined />
          </button>

          {/* Company Brand Logo & Name */}
          <Link
            to="/admin"
            className="flex items-center gap-2.5 text-decoration-none group"
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
          >
            <button className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center text-sm transition-colors cursor-pointer relative shadow-2xs hover:border-[#f97316]/60">
              <BellOutlined />
              {unreadCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] absolute top-1 right-1 ring-2 ring-white animate-pulse" />
              )}
            </button>
          </Popover>

          {/* Circular User Avatar Dropdown Button (Role Switcher inside Account Dropdown) */}
          <Popover
            content={accountMenuContent}
            trigger="click"
            open={accountMenuOpen}
            onOpenChange={setAccountMenuOpen}
            placement="bottomRight"
            arrow
          >
            <button
              type="button"
              className="w-8 h-8 rounded-full border border-slate-300 bg-gradient-to-tr from-[#0284c7] to-[#f97316] hover:opacity-90 text-white font-bold text-xs flex items-center justify-center transition-opacity cursor-pointer shadow-2xs"
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
          className="fixed inset-0 bg-slate-900/35 z-40 backdrop-blur-[1px] transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Drawer Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-[260px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
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
        <nav className="flex-1 px-3 py-3 space-y-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {loadingMenus ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Spin size="small" />
              <p className="mt-2 text-[11px]">Loading navigation...</p>
            </div>
          ) : (
            filteredMenus.map((item) => {
              const active = isActive(item.path);
              const hasSub = item.subItems && item.subItems.length > 0;

              return (
                <div key={item.path} className="relative group/menuitem">
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer shadow-2xs ${
                      active
                        ? 'bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white border-[#0284c7] shadow-sm border-l-4 border-l-[#f97316]'
                        : 'bg-white text-slate-700 border-slate-100/90 hover:border-orange-200 hover:text-[#f97316] hover:shadow-xs hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`text-base ${active ? 'text-white' : 'text-[#0284c7] group-hover/menuitem:text-[#f97316]'}`}>
                        {renderMenuIcon(item.icon)}
                      </span>
                      <span className={`truncate ${active ? 'text-white' : 'text-slate-800'}`}>
                        {item.name}
                      </span>
                    </div>

                    <span className={`text-xs font-bold ${active ? 'text-[#f97316]' : 'text-slate-400'}`}>
                      ›
                    </span>
                  </Link>

                  {/* Floating Submenu Flyout */}
                  {hasSub && (
                    <div className="hidden group-hover/menuitem:flex flex-col absolute left-full top-0 ml-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-60">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                        {item.name}
                      </div>
                      {item.subItems!.map((sub) => (
                        <Link
                          key={sub.label}
                          to={sub.path}
                          onClick={() => setSidebarOpen(false)}
                          className="px-3 py-2 rounded-md text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-[#f97316] transition-colors"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Customer Storefront Link */}
          <div className="pt-2">
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-slate-100/90 text-slate-700 hover:border-blue-200 hover:shadow-xs transition-all text-xs font-semibold shadow-2xs group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base text-[#0284c7]">
                  <ShopOutlined />
                </span>
                <span className="text-slate-800">Customer Store</span>
              </div>
              <span className="text-xs font-bold text-slate-400 group-hover:text-[#0284c7]">›</span>
            </Link>
          </div>
        </nav>

        {/* Footer info in Drawer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-[11px] font-medium text-slate-500">
            {isSeller ? 'Seller Portal' : isSupport ? 'Support Desk' : isManager ? 'Store Operations' : 'Super Admin'}
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-600 p-1 text-xs transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogoutOutlined />
          </button>
        </div>
      </aside>

      {/* =========================================================================
          Main Content Canvas (Fluid Window Ratio Sizing)
         ========================================================================= */}
      {sessionStorage.getItem('testRoleOverride') && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-b border-orange-200 px-6 py-2 flex items-center justify-between text-xs z-20">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse" />
            <span>
              Currently testing in <strong>{userRole.toUpperCase()}</strong> POV — navigation and privileges are dynamically scoped.
            </span>
          </div>
          <button
            onClick={() => switchRole('admin')}
            className="font-bold text-[#0284c7] hover:underline cursor-pointer text-xs"
          >
            ↺ Restore Super Admin
          </button>
        </div>
      )}
      <main className="flex-1 w-full">
        <div className="w-full px-[3.5vw] py-6">
          <Outlet />
        </div>
      </main>

      {/* Page Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200/60 bg-transparent">
        © 2026 Himalaya Online Shop · {isSeller ? 'Seller Portal' : isSupport ? 'Support Desk' : isManager ? 'Store Operations' : 'Super Admin'}
      </footer>
    </div>
  );
};

export default AdminLayout;
