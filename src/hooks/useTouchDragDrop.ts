import { useRef, useCallback } from 'react';
import type { ContentItemWithCategory } from '../lib/database.types';

interface UseTouchDragDropProps {
  onDragStart?: (item: ContentItemWithCategory) => void;
  item: ContentItemWithCategory;
}

export function useTouchDragDrop({ onDragStart, item }: UseTouchDragDropProps) {
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragClone = useRef<HTMLElement | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const createDragClone = useCallback((element: HTMLElement, x: number, y: number) => {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.id = 'touch-drag-clone';
    clone.style.position = 'fixed';
    clone.style.left = `${x - 50}px`;
    clone.style.top = `${y - 30}px`;
    clone.style.width = `${element.offsetWidth}px`;
    clone.style.opacity = '0.9';
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    clone.style.transform = 'rotate(3deg) scale(1.05)';
    clone.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
    document.body.appendChild(clone);
    return clone;
  }, []);

  const removeDragClone = useCallback(() => {
    if (dragClone.current) {
      dragClone.current.remove();
      dragClone.current = null;
    }
    // Also remove any orphaned clones
    const existingClone = document.getElementById('touch-drag-clone');
    if (existingClone) {
      existingClone.remove();
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    // Use long press to initiate drag (300ms)
    longPressTimer.current = setTimeout(() => {
      isDragging.current = true;
      const target = e.currentTarget;
      dragClone.current = createDragClone(target, touch.clientX, touch.clientY);

      // Store the dragged item ID in a global variable for drop detection
      (window as any).__touchDragItemId = item.id;
      (window as any).__touchDragItem = item;

      // Add visual feedback to original element
      target.style.opacity = '0.4';

      // Vibrate if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      onDragStart?.(item);
    }, 200);
  }, [createDragClone, item, onDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartPos.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    // If moved significantly before long press, cancel the drag initiation
    if (!isDragging.current && (deltaX > 10 || deltaY > 10)) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      return;
    }

    if (isDragging.current && dragClone.current) {
      e.preventDefault();
      dragClone.current.style.left = `${touch.clientX - 50}px`;
      dragClone.current.style.top = `${touch.clientY - 30}px`;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Restore original element opacity
    e.currentTarget.style.opacity = '1';

    if (isDragging.current) {
      const touch = e.changedTouches[0];

      // Find drop target under touch point
      removeDragClone();

      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);

      // Find calendar cell or backlog panel
      const calendarCell = elementBelow?.closest('[data-calendar-date]');
      const backlogPanel = elementBelow?.closest('[data-backlog-drop]');

      if (calendarCell) {
        const date = calendarCell.getAttribute('data-calendar-date');
        if (date) {
          // Dispatch custom event for calendar drop
          const event = new CustomEvent('touchDrop', {
            detail: { date, itemId: item.id },
            bubbles: true
          });
          calendarCell.dispatchEvent(event);
        }
      } else if (backlogPanel) {
        // Dispatch custom event for backlog drop
        const event = new CustomEvent('touchDropBacklog', {
          detail: { itemId: item.id },
          bubbles: true
        });
        backlogPanel.dispatchEvent(event);
      }

      // Cleanup
      (window as any).__touchDragItemId = null;
      (window as any).__touchDragItem = null;
      isDragging.current = false;
    }

    touchStartPos.current = null;
  }, [item.id, removeDragClone]);

  const handleTouchCancel = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    e.currentTarget.style.opacity = '1';
    removeDragClone();
    isDragging.current = false;
    touchStartPos.current = null;
    (window as any).__touchDragItemId = null;
    (window as any).__touchDragItem = null;
  }, [removeDragClone]);

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
  };
}
