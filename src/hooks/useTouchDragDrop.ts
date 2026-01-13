import { useRef, useCallback } from 'react';
import type { ContentItemWithCategory } from '../lib/database.types';

interface UseTouchDragDropProps {
  onDragStart?: (item: ContentItemWithCategory) => void;
  item: ContentItemWithCategory;
}

// Global state for touch drag
interface TouchDragState {
  itemId: string | null;
  item: ContentItemWithCategory | null;
}

declare global {
  interface Window {
    __touchDragState?: TouchDragState;
  }
}

export function useTouchDragDrop({ onDragStart, item }: UseTouchDragDropProps) {
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragClone = useRef<HTMLElement | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalElement = useRef<HTMLElement | null>(null);
  const didDrag = useRef(false);

  const createDragClone = useCallback((element: HTMLElement, x: number, y: number) => {
    // Remove any existing clone first
    const existingClone = document.getElementById('touch-drag-clone');
    if (existingClone) existingClone.remove();

    const clone = element.cloneNode(true) as HTMLElement;
    clone.id = 'touch-drag-clone';
    clone.style.cssText = `
      position: fixed;
      left: ${x - 50}px;
      top: ${y - 30}px;
      width: ${Math.max(element.offsetWidth, 120)}px;
      opacity: 0.9;
      z-index: 9999;
      pointer-events: none;
      transform: rotate(3deg) scale(1.05);
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      background: white;
      border-radius: 8px;
    `;
    document.body.appendChild(clone);
    return clone;
  }, []);

  const removeDragClone = useCallback(() => {
    if (dragClone.current) {
      dragClone.current.remove();
      dragClone.current = null;
    }
    const existingClone = document.getElementById('touch-drag-clone');
    if (existingClone) existingClone.remove();
  }, []);

  const cleanup = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (originalElement.current) {
      originalElement.current.style.opacity = '1';
      originalElement.current = null;
    }
    removeDragClone();
    document.body.classList.remove('dragging');
    isDragging.current = false;
    touchStartPos.current = null;
    window.__touchDragState = { itemId: null, item: null };
  }, [removeDragClone]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const target = e.currentTarget;

    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    originalElement.current = target;
    didDrag.current = false;

    // Long press to initiate drag
    longPressTimer.current = setTimeout(() => {
      if (!originalElement.current) return;

      isDragging.current = true;
      didDrag.current = true;
      dragClone.current = createDragClone(originalElement.current, touch.clientX, touch.clientY);

      // Store drag state globally
      window.__touchDragState = { itemId: item.id, item };

      // Visual feedback
      originalElement.current.style.opacity = '0.4';
      document.body.classList.add('dragging');

      // Vibrate if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      onDragStart?.(item);
    }, 250);
  }, [createDragClone, item, onDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartPos.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    // If moved significantly before long press, cancel drag initiation
    if (!isDragging.current && (deltaX > 10 || deltaY > 10)) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      return;
    }

    if (isDragging.current && dragClone.current) {
      e.preventDefault();
      e.stopPropagation();
      dragClone.current.style.left = `${touch.clientX - 50}px`;
      dragClone.current.style.top = `${touch.clientY - 30}px`;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isDragging.current) {
      e.preventDefault();
      e.stopPropagation();

      const touch = e.changedTouches[0];

      // Remove clone before finding element below
      removeDragClone();

      // Find drop target
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const calendarCell = elementBelow?.closest('[data-calendar-date]');
      const backlogPanel = elementBelow?.closest('[data-backlog-drop]');

      if (calendarCell) {
        const date = calendarCell.getAttribute('data-calendar-date');
        if (date) {
          const event = new CustomEvent('touchDrop', {
            detail: { date, itemId: item.id },
            bubbles: true
          });
          calendarCell.dispatchEvent(event);
        }
      } else if (backlogPanel) {
        const event = new CustomEvent('touchDropBacklog', {
          detail: { itemId: item.id },
          bubbles: true
        });
        backlogPanel.dispatchEvent(event);
      }
    }

    // Restore original element
    if (originalElement.current) {
      originalElement.current.style.opacity = '1';
      originalElement.current = null;
    }

    document.body.classList.remove('dragging');
    isDragging.current = false;
    touchStartPos.current = null;
    window.__touchDragState = { itemId: null, item: null };
  }, [item.id, removeDragClone]);

  const handleTouchCancel = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Prevent click if we just dragged
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (didDrag.current) {
      e.preventDefault();
      e.stopPropagation();
      didDrag.current = false;
    }
  }, []);

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
    handleClick,
    isDragging: isDragging.current,
  };
}
