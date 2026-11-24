import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  label: string;
  description?: string;
  shortcut?: string;
  side?: 'top' | 'bottom';
  delayMs?: number;
  disabled?: boolean;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}

export const Tooltip: React.FC<TooltipProps> = ({
  label,
  description,
  shortcut,
  side = 'bottom',
  delayMs = 140,
  disabled = false,
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number; placement: 'top' | 'bottom' }>({
    x: 0,
    y: 0,
    placement: side,
  });
  const timerRef = useRef<number | null>(null);
  const triggerElRef = useRef<HTMLElement | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  const computePosition = useCallback(
    (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gap = 8;

      let placement = side;
      if (side === 'bottom' && rect.bottom + 84 > vh) {
        placement = 'top';
      } else if (side === 'top' && rect.top - 84 < 0) {
        placement = 'bottom';
      }

      const rawX = rect.left + rect.width / 2;
      const clampedX = Math.max(116, Math.min(vw - 116, rawX));
      const y = placement === 'bottom' ? rect.bottom + gap : rect.top - gap;

      setCoords({ x: clampedX, y, placement });
    },
    [side]
  );

  const scheduleShow = useCallback(
    (el: HTMLElement) => {
      if (disabled) return;
      triggerElRef.current = el;
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        if (!triggerElRef.current) return;
        computePosition(triggerElRef.current);
        setVisible(true);
      }, delayMs);
    },
    [clearTimer, computePosition, delayMs, disabled]
  );

  useEffect(() => {
    if (!visible) return;
    const handleDismiss = () => hide();
    window.addEventListener('scroll', handleDismiss, true);
    window.addEventListener('resize', handleDismiss);
    return () => {
      window.removeEventListener('scroll', handleDismiss, true);
      window.removeEventListener('resize', handleDismiss);
    };
  }, [visible, hide]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const childProps = children.props;

  const cloned = React.cloneElement(children, {
    title: undefined,
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseEnter?.(e);
      scheduleShow(e.currentTarget);
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseLeave?.(e);
      hide();
    },
    onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseDown?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      childProps.onFocus?.(e);
      scheduleShow(e.currentTarget);
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      childProps.onBlur?.(e);
      hide();
    },
  });

  return (
    <>
      {cloned}
      {visible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            style={{
              left: coords.x,
              top: coords.y,
              transform:
                coords.placement === 'bottom'
                  ? 'translate(-50%, 0)'
                  : 'translate(-50%, -100%)',
            }}
            className="pointer-events-none fixed z-[140] max-w-[230px] rounded-lg bg-[#0B1220] dark:bg-[#10192B] text-slate-100 border border-slate-700/90 shadow-xl shadow-black/35 px-2.5 py-2 text-left nx-menu-enter"
          >
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-[11.5px] font-semibold text-white leading-tight whitespace-nowrap">
                {label}
              </span>
              {shortcut && (
                <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800/95 text-teal-300 border border-slate-700/80 leading-none shrink-0">
                  {shortcut}
                </kbd>
              )}
            </div>
            {description && (
              <p className="mt-1 text-[10.5px] leading-snug text-slate-300">
                {description}
              </p>
            )}
          </div>,
          document.body
        )}
    </>
  );
};
