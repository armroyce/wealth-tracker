import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/format';
import {
  HomeIcon, BanknotesIcon, ArrowsRightLeftIcon, ChartBarIcon,
  WalletIcon, CreditCardIcon, FlagIcon, PresentationChartLineIcon,
  DocumentChartBarIcon, SunIcon, MoonIcon, ArrowRightOnRectangleIcon,
  Bars3Icon, XMarkIcon, UserCircleIcon, BuildingOffice2Icon, ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { path: '/',            label: 'Dashboard',    icon: HomeIcon },
  { path: '/accounts',   label: 'Accounts',     icon: BanknotesIcon },
  { path: '/transactions',label:'Transactions', icon: ArrowsRightLeftIcon },
  { path: '/investments', label: 'Investments',  icon: ChartBarIcon },
  { path: '/budget',      label: 'Budget',       icon: WalletIcon },
  { path: '/debts',       label: 'Debts',        icon: CreditCardIcon },
  { path: '/goals',       label: 'Goals',        icon: FlagIcon },
  { path: '/networth',        label: 'Net Worth',    icon: PresentationChartLineIcon },
  { path: '/physical-assets', label: 'Assets',       icon: BuildingOffice2Icon },
  { path: '/insurance',       label: 'Insurance',    icon: ShieldCheckIcon },
  { path: '/reports',         label: 'Reports',      icon: DocumentChartBarIcon },
];

const NavItem = ({ path, label, icon: Icon, collapsed, onClick }) => (
  <NavLink
    to={path}
    onClick={onClick}
    end={path === '/'}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
        isActive
          ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
      )
    }
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
    {!collapsed && <span>{label}</span>}
  </NavLink>
);

const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const content = (
    <div className={cn(
      'flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-200',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100 dark:border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">WealthTracker</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hidden lg:block"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavItem key={item.path} {...item} collapsed={collapsed} onClick={onMobileClose} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white w-full transition-colors"
        >
          {theme === 'dark'
            ? <SunIcon className="w-5 h-5 flex-shrink-0" />
            : <MoonIcon className="w-5 h-5 flex-shrink-0" />
          }
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2">
            <UserCircleIcon className="w-8 h-8 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex h-screen sticky top-0 flex-shrink-0">
        {content}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <div className="absolute left-0 top-0 h-full w-64 z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
