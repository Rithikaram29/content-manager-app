import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { Category } from '../lib/database.types';

interface CategoriesPanelProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onCreateCategory: (name: string) => Promise<void>;
}

export function CategoriesPanel({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCreateCategory
}: CategoriesPanelProps) {
  const [showModal, setShowModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setLoading(true);
    setError('');

    try {
      await onCreateCategory(categoryName.trim());
      setCategoryName('');
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">CAT</h2>
          <button
            onClick={() => setShowModal(true)}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="p-1.5 sm:p-2 space-y-0.5 sm:space-y-1 max-h-32 sm:max-h-48 overflow-y-auto">
          <button
            onClick={() => onSelectCategory(null)}
            className={`w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm ${
              selectedCategoryId === null
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm ${
                selectedCategoryId === category.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Create Category</h3>

            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  id="categoryName"
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setCategoryName('');
                    setError('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
