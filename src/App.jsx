import { AuthProvider, useAuth } from './AuthContext';
import { FinanceProvider } from './FinanceContext';
import AuthPage from './Authpage';
import Dashboard from './Dashboard';
import OfflineBanner from './OfflineBanner';

function AppInner() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #2a2a3d', borderTopColor: '#7c6bff', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );
  if (!user) return <AuthPage />;
  return (
    <FinanceProvider>
      <Dashboard />
    </FinanceProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <OfflineBanner />
      <AppInner />
    </AuthProvider>
  );
}
