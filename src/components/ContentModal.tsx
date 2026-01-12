import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Category, ContentItem, ContentStage, SocialPlatform } from '../lib/database.types';

interface ContentModalProps {
  item?: ContentItem;
  categories: Category[];
  onSave: (data: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate?: (id: string, data: Partial<ContentItem>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}

const STAGES: ContentStage[] = ['Idea', 'Script', 'Shooting', 'Editing', 'Scheduled', 'Posted'];
const PLATFORMS: SocialPlatform[] = ['IG', 'YT', 'Podcast', 'Shorts'];

export function ContentModal({ item, categories, onSave, onUpdate, onDelete, onClose }: ContentModalProps) {
  const [name, setName] = useState(item?.name || '');
  const [categoryId, setCategoryId] = useState(item?.category_id || '');
  const [rawFileUrls, setRawFileUrls] = useState<string[]>(item?.raw_file_urls || ['']);
  const [inspoUrls, setInspoUrls] = useState<string[]>(item?.inspo_urls || ['']);
  const [finalUrl, setFinalUrl] = useState(item?.final_url || '');
  const [stage, setStage] = useState<ContentStage>(item?.stage || 'Idea');
  const [social, setSocial] = useState<SocialPlatform>(item?.social || 'IG');
  const [timelineDays, setTimelineDays] = useState(item?.timeline_days || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;

    setLoading(true);
    setError('');

    try {
      const data = {
        name: name.trim(),
        category_id: categoryId,
        raw_file_urls: rawFileUrls.filter(url => url.trim()),
        inspo_urls: inspoUrls.filter(url => url.trim()),
        final_url: finalUrl.trim() || null,
        stage,
        social,
        timeline_days: timelineDays,
        scheduled_date: item?.scheduled_date || null
      };

      if (item && onUpdate) {
        await onUpdate(item.id, data);
      } else {
        await onSave(data);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !onDelete) return;

    setLoading(true);
    try {
      await onDelete(item.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete content');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            {item ? 'Edit Content' : 'Create Content'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raw Files URLs
            </label>
            <div className="space-y-2">
              {rawFileUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...rawFileUrls];
                      newUrls[index] = e.target.value;
                      setRawFileUrls(newUrls);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://drive.google.com/..."
                  />
                  {rawFileUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRawFileUrls(rawFileUrls.filter((_, i) => i !== index))}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setRawFileUrls([...rawFileUrls, ''])}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add more URL
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inspo URLs
            </label>
            <div className="space-y-2">
              {inspoUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...inspoUrls];
                      newUrls[index] = e.target.value;
                      setInspoUrls(newUrls);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                  {inspoUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setInspoUrls(inspoUrls.filter((_, i) => i !== index))}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setInspoUrls([...inspoUrls, ''])}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add more URL
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="finalUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Final Post URL
            </label>
            <input
              id="finalUrl"
              type="url"
              value={finalUrl}
              onChange={(e) => setFinalUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
                Stage
              </label>
              <select
                id="stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as ContentStage)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="social" className="block text-sm font-medium text-gray-700 mb-1">
                Social
              </label>
              <select
                id="social"
                value={social}
                onChange={(e) => setSocial(e.target.value as SocialPlatform)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="timelineDays" className="block text-sm font-medium text-gray-700 mb-1">
              Timeline Days
            </label>
            <input
              id="timelineDays"
              type="number"
              min="1"
              value={timelineDays}
              onChange={(e) => setTimelineDays(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between pt-3 sm:pt-4">
            <div>
              {item && onDelete && (
                <>
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 w-full sm:w-auto"
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 w-full sm:w-auto"
                    >
                      Confirm Delete
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : item ? 'Save changes' : 'Add content'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
