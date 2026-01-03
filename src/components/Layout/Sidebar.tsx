import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  Car, 
  User, 
  Settings, 
  LogOut, 
  Users, 
  BarChart3, 
  FileText, 
  Shield, 
  CreditCard, 
  Clock,
  Share2
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  currentView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentView, onViewChange }) => {
  const { user, logout } = useAuth();

  const riderMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'book-ride', label: 'Book Ride', icon: Car },
    { id: 'ride-sharing', label: 'Ride Sharing', icon: Share2 },
    { id: 'ride-history', label: 'Ride History', icon: Clock },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const driverMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'go-online', label: 'Go Online', icon: Car },
    { id: 'ride-requests', label: 'Ride Requests', icon: Clock },
    { id: 'ride-sharing', label: 'Ride Sharing', icon: Share2 },
    { id: 'earnings', label: 'Earnings', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'rides', label: 'Rides', icon: Car },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'verification', label: 'Verification', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getMenuItems = () => {
    switch (user?.role) {
      case 'driver':
        return driverMenuItems;
      case 'admin':
        return adminMenuItems;
      default:
        return riderMenuItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => {}}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 h-full bg-white shadow-lg border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-auto
        w-64
      `}>
        <nav className="p-4 space-y-2 h-full overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;