import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { ContentItemWithCategory, ContentStage } from '../lib/database.types';
import { STAGE_COLORS } from './ContentCard';

interface CalendarProps {
  items: ContentItemWithCategory[];
  onItemClick: (item: ContentItemWithCategory) => void;
  onDateDrop: (date: string, item: ContentItemWithCategory) => void;
  onDragStart: (item: ContentItemWithCategory) => void;
}

const STAGE_TIMELINE_COLORS: Record<ContentStage, string> = {
  Idea: 'bg-gray-300',
  Script: 'bg-blue-300',
  Shooting: 'bg-yellow-300',
  Editing: 'bg-orange-300',
  Scheduled: 'bg-green-300',
  Posted: 'bg-purple-300'
};

export function Calendar({ items, onItemClick, onDateDrop, onDragStart }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const weeks = useMemo(() => {
    const weeksArray = [];
    let week = [];

    for (let i = 0; i < startDay; i++) {
      week.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        weeksArray.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      weeksArray.push(week);
    }

    return weeksArray;
  }, [startDay, daysInMonth]);

  const getDateString = (day: number) => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
  };

  const itemsByDate = useMemo(() => {
    const map = new Map<string, ContentItemWithCategory[]>();
    items.forEach((item) => {
      if (item.scheduled_date) {
        const existing = map.get(item.scheduled_date) || [];
        map.set(item.scheduled_date, [...existing, item]);
      }
    });
    return map;
  }, [items]);

  const getTimelineForDate = (dateStr: string) => {
    const timelines: Array<{ item: ContentItemWithCategory; isStart: boolean }> = [];

    itemsByDate.forEach((dateItems, scheduledDate) => {
      dateItems.forEach((item) => {
        const scheduled = new Date(scheduledDate);
        const current = new Date(dateStr);

        const timelineStart = new Date(scheduled);
        timelineStart.setDate(timelineStart.getDate() - item.timeline_days);

        if (current >= timelineStart && current < scheduled) {
          timelines.push({ item, isStart: false });
        } else if (current.toDateString() === scheduled.toDateString()) {
          timelines.push({ item, isStart: true });
        }
      });
    });

    return timelines;
  };

  const isPastDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return checkDate < today;
  };

  const handleDragOver = (e: React.DragEvent, day: number | null) => {
    e.preventDefault();
    if (day && isPastDate(day)) {
      e.dataTransfer.dropEffect = 'none';
    } else {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent, day: number | null) => {
    e.preventDefault();
    if (!day || isPastDate(day)) return;

    const dateStr = getDateString(day);
    const draggedItemId = e.dataTransfer.getData('application/json');

    if (draggedItemId) {
      const item = items.find((i) => i.id === draggedItemId);
      if (item) {
        onDateDrop(dateStr, item);
      }
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 auto-rows-fr">
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              const dateStr = day ? getDateString(day) : '';
              const dayItems = day ? itemsByDate.get(dateStr) || [] : [];
              const timelines = day ? getTimelineForDate(dateStr) : [];
              const today = new Date();
              const isToday = day &&
                currentDate.getFullYear() === today.getFullYear() &&
                currentDate.getMonth() === today.getMonth() &&
                day === today.getDate();
              const isPast = day && isPastDate(day);

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`min-h-[120px] border border-gray-200 rounded-lg p-2 ${
                    !day ? 'bg-gray-50' : isPast ? 'bg-gray-100 opacity-60' : isToday ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'
                  }`}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium text-gray-900 mb-2">{day}</div>

                      <div className="space-y-1">
                        {timelines.map(({ item }, idx) => (
                          <div
                            key={`timeline-${item.id}-${idx}`}
                            className={`h-2 rounded ${STAGE_TIMELINE_COLORS[item.stage]}`}
                            title={`${item.name} - ${item.stage}`}
                          />
                        ))}

                        {dayItems.map((item) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('application/json', item.id);
                              onDragStart(item);
                            }}
                            onClick={() => onItemClick(item)}
                            className={`text-xs p-2 rounded cursor-pointer ${
                              STAGE_COLORS[item.stage].split(' ')[0]
                            } border border-gray-300`}
                          >
                            <div className="font-medium truncate">{item.name}</div>
                            <div className="text-gray-600">{item.social}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
