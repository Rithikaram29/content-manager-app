import { useState, useMemo } from 'react';
import { TopBar } from './TopBar';
import { CategoriesPanel } from './CategoriesPanel';
import { BacklogPanel } from './BacklogPanel';
import { Calendar } from './Calendar';
import { ContentModal } from './ContentModal';
import { useContentData } from '../hooks/useContentData';
import type { ContentItem, ContentItemWithCategory } from '../lib/database.types';

export function Dashboard() {
  const {
    categories,
    contentItems,
    loading,
    error,
    addCategory,
    addContentItem,
    updateContentItem,
    deleteContentItem
  } = useContentData();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<ContentItemWithCategory | null>(null);
  const [showTimelineWarning, setShowTimelineWarning] = useState(false);

  const filteredItems = useMemo(() => {
    if (!selectedCategoryId) return contentItems;
    return contentItems.filter(item => item.category_id === selectedCategoryId);
  }, [contentItems, selectedCategoryId]);

  const backlogItems = useMemo(() => {
    return filteredItems.filter(item => !item.scheduled_date);
  }, [filteredItems]);

  const handleCreateCategory = async (name: string) => {
    await addCategory(name);
  };

  const handleCreateContent = async (data: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>) => {
    await addContentItem(data);
  };

  const handleUpdateContent = async (id: string, data: Partial<ContentItem>) => {
    await updateContentItem(id, data);
  };

  const handleDeleteContent = async (id: string) => {
    await deleteContentItem(id);
  };

  const handleDateDrop = async (date: string, item: ContentItemWithCategory) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduledDate = new Date(date);
    const timelineStart = new Date(scheduledDate);
    timelineStart.setDate(timelineStart.getDate() - item.timeline_days);

    if (timelineStart < today) {
      setShowTimelineWarning(true);
      return;
    }

    await updateContentItem(item.id, { scheduled_date: date });
  };

  const handleBacklogDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem && draggedItem.scheduled_date) {
      updateContentItem(draggedItem.id, { scheduled_date: null });
    }
  };

  const handleItemClick = (item: ContentItemWithCategory) => {
    setEditingItem(item);
    setShowContentModal(true);
  };

  const handleCreateClick = () => {
    setEditingItem(null);
    setShowContentModal(true);
  };

  const handleCloseModal = () => {
    setShowContentModal(false);
    setEditingItem(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Calendar
            items={filteredItems}
            onItemClick={handleItemClick}
            onDateDrop={handleDateDrop}
            onDragStart={setDraggedItem}
          />
        </div>

        <div className="w-80 flex flex-col gap-4 overflow-hidden">
          <CategoriesPanel
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onCreateCategory={handleCreateCategory}
          />

          <div className="flex-1 min-h-0">
            <BacklogPanel
              items={backlogItems}
              onItemClick={handleItemClick}
              onCreateClick={handleCreateClick}
              onDragStart={setDraggedItem}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={handleBacklogDrop}
            />
          </div>
        </div>
      </div>

      {showContentModal && (
        <ContentModal
          item={editingItem || undefined}
          categories={categories}
          onSave={handleCreateContent}
          onUpdate={handleUpdateContent}
          onDelete={handleDeleteContent}
          onClose={handleCloseModal}
        />
      )}

      {showTimelineWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              ⏳ Nice Try
            </h3>
            <p className="text-gray-600 mb-6">
              This content would need work to start before today.<br />
              Let's keep things in the present.
            </p>
            <button
              onClick={() => setShowTimelineWarning(false)}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
