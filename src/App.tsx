import { useAuth } from './contexts/AuthContext';
import { AuthUI } from './components/AuthUI';
import { Dashboard } from './components/Dashboard';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthUI />;
  }

  return <Dashboard />;
}

export default App;
