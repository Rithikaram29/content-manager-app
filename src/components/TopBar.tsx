import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function TopBar() {
  const { signOut } = useAuth();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Main Page</h1>

      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-6 h-6 text-gray-600" />
        </div>
        <button
          onClick={signOut}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
