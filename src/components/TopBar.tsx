import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function TopBar() {
  const { signOut } = useAuth();

  return (
    <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Main Page</h1>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
        </div>
        <button
          onClick={signOut}
          className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
