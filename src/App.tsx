import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import RiderDashboard from './components/Dashboard/RiderDashboard';
import DriverDashboard from './components/Dashboard/DriverDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import BookRide from './components/Features/BookRide';
import Profile from './components/Features/Profile';
import RideSharing from './components/Features/RideSharing';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">The application encountered an error. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                <pre className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  console.log('AppContent rendering...'); // Debug log
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  console.log('Current user:', user); // Debug log

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderDashboard = () => {
    switch (user?.role) {
      case 'rider':
        return <RiderDashboard onNavigate={(view) => setCurrentView(view)} />;
      case 'driver':
        return <DriverDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <RiderDashboard onNavigate={(view) => setCurrentView(view)} />;
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'book-ride':
        return <BookRide />;
      case 'ride-sharing':
        return <RideSharing />;
      case 'profile':
        return <Profile />;
      case 'go-online':
        return <DriverDashboard />;
      case 'ride-requests':
        return <DriverDashboard />;
      case 'earnings':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Earnings Dashboard</h2>
            <p className="text-gray-600">Earnings tracking feature coming soon...</p>
          </div>
        );
      case 'ride-history':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ride History</h2>
            <p className="text-gray-600">Detailed ride history feature coming soon...</p>
          </div>
        );
      case 'payments':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Management</h2>
            <p className="text-gray-600">Payment integration coming in Phase 2...</p>
          </div>
        );
      case 'users':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Management</h2>
            <p className="text-gray-600">User management dashboard coming soon...</p>
          </div>
        );
      case 'rides':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ride Management</h2>
            <p className="text-gray-600">Ride management dashboard coming soon...</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics Dashboard</h2>
            <p className="text-gray-600">Analytics and reporting features coming soon...</p>
          </div>
        );
      case 'reports':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports & Disputes</h2>
            <p className="text-gray-600">Dispute management system coming soon...</p>
          </div>
        );
      case 'verification':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Driver Verification</h2>
            <p className="text-gray-600">Driver verification system coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
            <p className="text-gray-600">Settings panel coming soon...</p>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  if (!user) {
    return authMode === 'login' ? (
      <LoginForm onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuToggle={toggleSidebar} isMenuOpen={isSidebarOpen} />
      
      <div className="flex pt-16">
        <Sidebar 
          isOpen={isSidebarOpen} 
          currentView={currentView}
          onViewChange={(view) => {
            setCurrentView(view);
            setIsSidebarOpen(false); // Close sidebar on mobile after selection
          }}
        />
        
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {renderCurrentView()}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  console.log('App component rendering...'); // Debug log
  
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;