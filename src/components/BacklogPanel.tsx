import { Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ContentCard } from './ContentCard';
import type { ContentItemWithCategory } from '../lib/database.types';

interface BacklogPanelProps {
  items: ContentItemWithCategory[];
  onItemClick: (item: ContentItemWithCategory) => void;
  onCreateClick: () => void;
  onDragStart: (item: ContentItemWithCategory) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onTouchDrop?: (item: ContentItemWithCategory) => void;
  allItems?: ContentItemWithCategory[];
}

export function BacklogPanel({
  items,
  onItemClick,
  onCreateClick,
  onDragStart,
  onDragOver,
  onDrop,
  onTouchDrop,
  allItems = []
}: BacklogPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle touch drop events for dropping items back to backlog
  useEffect(() => {
    const handleTouchDropBacklog = (e: CustomEvent<{ itemId: string }>) => {
      const { itemId } = e.detail;
      const item = allItems.find((i) => i.id === itemId);
      if (item && item.scheduled_date && onTouchDrop) {
        onTouchDrop(item);
      }
    };

    const panelEl = panelRef.current;
    if (panelEl) {
      panelEl.addEventListener('touchDropBacklog', handleTouchDropBacklog as EventListener);
    }

    return () => {
      if (panelEl) {
        panelEl.removeEventListener('touchDropBacklog', handleTouchDropBacklog as EventListener);
      }
    };
  }, [allItems, onTouchDrop]);

  return (
    <div
      ref={panelRef}
      data-backlog-drop="true"
      className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900">CONTENT Backlog</h2>
        <button
          onClick={onCreateClick}
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 space-y-1.5 sm:space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-4 sm:py-8 text-gray-500 text-xs sm:text-sm">
            No backlog items
          </div>
        ) : (
          items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('application/json', item.id);
                onDragStart(item);
              }}
              onTouchDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
}
