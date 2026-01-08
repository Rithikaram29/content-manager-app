import type { ContentItemWithCategory, ContentStage } from '../lib/database.types';

interface ContentCardProps {
  item: ContentItemWithCategory;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

const STAGE_COLORS: Record<ContentStage, string> = {
  Idea: 'bg-gray-100 text-gray-700',
  Script: 'bg-blue-100 text-blue-700',
  Shooting: 'bg-yellow-100 text-yellow-700',
  Editing: 'bg-orange-100 text-orange-700',
  Scheduled: 'bg-green-100 text-green-700',
  Posted: 'bg-purple-100 text-purple-700'
};

const SOCIAL_COLORS = {
  IG: 'bg-pink-100 text-pink-700',
  YT: 'bg-red-100 text-red-700',
  Podcast: 'bg-indigo-100 text-indigo-700',
  Shorts: 'bg-teal-100 text-teal-700'
};

export function ContentCard({ item, onClick, draggable = false, onDragStart }: ContentCardProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      <h3 className="font-medium text-gray-900 mb-2 truncate">{item.name}</h3>

      <div className="flex flex-wrap gap-2 mb-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${STAGE_COLORS[item.stage]}`}>
          {item.stage}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${SOCIAL_COLORS[item.social]}`}>
          {item.social}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="truncate">{item.category.name}</span>
        <span className="ml-2 whitespace-nowrap">{item.timeline_days}d</span>
      </div>
    </div>
  );
}

export { STAGE_COLORS };
