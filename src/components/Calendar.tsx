import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  const calendarRef = useRef<HTMLDivElement>(null);

  // Handle touch drop events
  useEffect(() => {
    const handleTouchDrop = (e: CustomEvent<{ date: string; itemId: string }>) => {
      const { date, itemId } = e.detail;
      const item = items.find((i) => i.id === itemId);
      if (item) {
        // Check if it's a past date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dropDate = new Date(date);
        if (dropDate >= today) {
          onDateDrop(date, item);
        }
      }
    };

    const calendarEl = calendarRef.current;
    if (calendarEl) {
      calendarEl.addEventListener('touchDrop', handleTouchDrop as EventListener);
    }

    return () => {
      if (calendarEl) {
        calendarEl.removeEventListener('touchDrop', handleTouchDrop as EventListener);
      }
    };
  }, [items, onDateDrop]);

  // Touch handlers for calendar items
  const touchStartRef = useRef<{ x: number; y: number; item: ContentItemWithCategory } | null>(null);
  const isDraggingRef = useRef(false);
  const dragCloneRef = useRef<HTMLElement | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const createDragClone = useCallback((element: HTMLElement, x: number, y: number) => {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.id = 'touch-drag-clone';
    clone.style.position = 'fixed';
    clone.style.left = `${x - 40}px`;
    clone.style.top = `${y - 20}px`;
    clone.style.width = `${Math.max(element.offsetWidth, 80)}px`;
    clone.style.opacity = '0.9';
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    clone.style.transform = 'rotate(3deg) scale(1.05)';
    clone.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
    document.body.appendChild(clone);
    return clone;
  }, []);

  const removeDragClone = useCallback(() => {
    if (dragCloneRef.current) {
      dragCloneRef.current.remove();
      dragCloneRef.current = null;
    }
    const existingClone = document.getElementById('touch-drag-clone');
    if (existingClone) existingClone.remove();
  }, []);

  const handleItemTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>, item: ContentItemWithCategory) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, item };

    longPressTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      const target = e.currentTarget;
      dragCloneRef.current = createDragClone(target, touch.clientX, touch.clientY);
      target.style.opacity = '0.4';
      if (navigator.vibrate) navigator.vibrate(50);
      onDragStart(item);
    }, 200);
  }, [createDragClone, onDragStart]);

  const handleItemTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    if (!isDraggingRef.current && (deltaX > 10 || deltaY > 10)) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      return;
    }

    if (isDraggingRef.current && dragCloneRef.current) {
      e.preventDefault();
      dragCloneRef.current.style.left = `${touch.clientX - 40}px`;
      dragCloneRef.current.style.top = `${touch.clientY - 20}px`;
    }
  }, []);

  const handleItemTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    e.currentTarget.style.opacity = '1';

    if (isDraggingRef.current && touchStartRef.current) {
      const touch = e.changedTouches[0];
      removeDragClone();

      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const calendarCell = elementBelow?.closest('[data-calendar-date]');
      const backlogPanel = elementBelow?.closest('[data-backlog-drop]');

      if (calendarCell) {
        const date = calendarCell.getAttribute('data-calendar-date');
        if (date) {
          const event = new CustomEvent('touchDrop', {
            detail: { date, itemId: touchStartRef.current.item.id },
            bubbles: true
          });
          calendarCell.dispatchEvent(event);
        }
      } else if (backlogPanel) {
        const event = new CustomEvent('touchDropBacklog', {
          detail: { itemId: touchStartRef.current.item.id },
          bubbles: true
        });
        backlogPanel.dispatchEvent(event);
      }

      isDraggingRef.current = false;
    }
    touchStartRef.current = null;
  }, [removeDragClone]);

  const handleItemTouchCancel = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    e.currentTarget.style.opacity = '1';
    removeDragClone();
    isDraggingRef.current = false;
    touchStartRef.current = null;
  }, [removeDragClone]);

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
    <div ref={calendarRef} className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm sm:text-lg font-semibold text-gray-900">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-2 sm:p-4 overflow-auto">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2 min-w-[500px]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-600 py-1 sm:py-2">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr min-w-[500px]">
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
                  data-calendar-date={day ? dateStr : undefined}
                  className={`min-h-[80px] sm:min-h-[120px] border border-gray-200 rounded sm:rounded-lg p-1 sm:p-2 ${
                    !day ? 'bg-gray-50' : isPast ? 'bg-gray-100 opacity-60' : isToday ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'
                  }`}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  {day && (
                    <>
                      <div className="text-xs sm:text-sm font-medium text-gray-900 mb-1 sm:mb-2">{day}</div>

                      <div className="space-y-0.5 sm:space-y-1">
                        {timelines.map(({ item }, idx) => (
                          <div
                            key={`timeline-${item.id}-${idx}`}
                            className={`h-1.5 sm:h-2 rounded ${STAGE_TIMELINE_COLORS[item.stage]}`}
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
                            onTouchStart={(e) => handleItemTouchStart(e, item)}
                            onTouchMove={handleItemTouchMove}
                            onTouchEnd={handleItemTouchEnd}
                            onTouchCancel={handleItemTouchCancel}
                            onClick={() => onItemClick(item)}
                            className={`text-[10px] sm:text-xs p-1 sm:p-2 rounded cursor-pointer touch-manipulation select-none ${
                              STAGE_COLORS[item.stage].split(' ')[0]
                            } border border-gray-300`}
                          >
                            <div className="font-medium truncate">{item.name}</div>
                            <div className="text-gray-600 hidden sm:block">{item.social}</div>
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
