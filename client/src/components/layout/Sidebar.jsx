import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/format';
import {
  HomeIcon, BanknotesIcon, ArrowsRightLeftIcon, ChartBarIcon,
  WalletIcon, CreditCardIcon, FlagIcon, PresentationChartLineIcon,
  DocumentChartBarIcon, SunIcon, MoonIcon, ArrowRightOnRectangleIcon,
  Bars3Icon, BuildingOffice2Icon, ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { path: '/',                 label: 'Dashboard',   icon: HomeIcon },
  { path: '/accounts',         label: 'Accounts',    icon: BanknotesIcon },
  { path: '/transactions',     label: 'Transactions',icon: ArrowsRightLeftIcon },
  { path: '/investments',      label: 'Investments', icon: ChartBarIcon },
  { path: '/budget',           label: 'Budget',      icon: WalletIcon },
  { path: '/debts',            label: 'Debts',       icon: CreditCardIcon },
  { path: '/goals',            label: 'Goals',       icon: FlagIcon },
  { path: '/networth',         label: 'Net Worth',   icon: PresentationChartLineIcon },
  { path: '/physical-assets',  label: 'Assets',      icon: BuildingOffice2Icon },
  { path: '/insurance',        label: 'Insurance',   icon: ShieldCheckIcon },
  { path: '/reports',          label: 'Reports',     icon: DocumentChartBarIcon },
];

const NavItem = ({ path, label, icon: Icon, collapsed, onClick }) => (
  <NavLink
    to={path}
    onClick={onClick}
    end={path === '/'}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group',
        isActive
          ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-600/20'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white'
      )
    }
  >
    {({ isActive }) => (
      <>
        <Icon className={cn('w-5 h-5 flex-shrink-0 transition-transform duration-150', !isActive && 'group-hover:scale-110')} />
        {!collapsed && <span className="truncate">{label}</span>}
        {isActive && !collapsed && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
        )}
      </>
    )}
  </NavLink>
);

const UserAvatar = ({ name }) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-xs font-bold">{initials}</span>
    </div>
  );
};

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
      'flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center px-4 py-5 border-b border-gray-100 dark:border-gray-800',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/30 flex-shrink-0">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">WealthTracker</span>
              <p className="text-[10px] text-gray-400 -mt-0.5">Personal Finance</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/30">
            <span className="text-white font-bold text-sm">W</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hidden lg:block transition-colors',
            collapsed && 'hidden'
          )}
        >
          <Bars3Icon className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Menu</p>
        )}
        {navItems.map(item => (
          <NavItem key={item.path} {...item} collapsed={collapsed} onClick={onMobileClose} />
        ))}
      </nav>

      {/* Footer */}
      <div className={cn('px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-1')}>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white w-full transition-colors"
        >
          {theme === 'dark'
            ? <SunIcon className="w-5 h-5 flex-shrink-0 text-amber-400" />
            : <MoonIcon className="w-5 h-5 flex-shrink-0 text-brand-400" />
          }
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <UserAvatar name={user.name} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="absolute left-0 top-0 h-full w-64 z-10 animate-slide-right">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
