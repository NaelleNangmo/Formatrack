import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  BookOpen,
  ClipboardCheck,
  Banknote,
  UserX,
  Settings,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import { authService } from '../../services/api';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const menuItems = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Tableau de bord',
    },
    {
      to: '/enregistrement',
      icon: UserPlus,
      label: 'Enregistrement',
    },
    {
      to: '/clients',
      icon: Users,
      label: 'Liste des clients',
    },
    {
      to: '/cours',
      icon: BookOpen,
      label: 'Cours',
    },
    {
      to: '/presences',
      icon: ClipboardCheck,
      label: 'Appel / Présences',
    },
    {
      to: '/finance',
      icon: Banknote,
      label: 'Finance',
    },
    {
      to: '/absences',
      icon: UserX,
      label: 'Absences & Retards',
    },
    {
      to: '/utilisateurs',
      icon: Settings,
      label: 'Utilisateurs',
    },
  ];

  const currentUser = authService.getCurrentUser();

  return (
    <div className="bg-blue-900 text-white w-64 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-8 w-8 text-blue-300" />
          <h1 className="text-xl font-bold">FormaTrack</h1>
        </div>
        <p className="text-blue-300 text-sm mt-1">Gestion de Formation</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info et logout */}
      <div className="p-4 border-t border-blue-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold">
              {currentUser?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium">{currentUser?.username}</p>
            <p className="text-xs text-blue-300">Administrateur</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-blue-200 hover:bg-blue-800 hover:text-white transition-colors duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Se déconnecter</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;