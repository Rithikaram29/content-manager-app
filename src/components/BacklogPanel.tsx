import { Plus } from 'lucide-react';
import { ContentCard } from './ContentCard';
import type { ContentItemWithCategory } from '../lib/database.types';

interface BacklogPanelProps {
  items: ContentItemWithCategory[];
  onItemClick: (item: ContentItemWithCategory) => void;
  onCreateClick: () => void;
  onDragStart: (item: ContentItemWithCategory) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export function BacklogPanel({
  items,
  onItemClick,
  onCreateClick,
  onDragStart,
  onDragOver,
  onDrop
}: BacklogPanelProps) {
  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">CONTENT Backlog</h2>
        <button
          onClick={onCreateClick}
          className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
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
            />
          ))
        )}
      </div>
    </div>
  );
}
