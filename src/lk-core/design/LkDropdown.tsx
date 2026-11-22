import React, { useEffect, useRef, useState } from 'react';
import { LkGlassSurface } from '../glass/LkGlass';
import { LkIcon, type LkIconName } from '../icons/LkIcon';
import { LK_FOCUS_RING_CLASS } from '../accessibility/LkAccessibility';

export interface LkMenuItem {
  id: string;
  label: string;
  icon?: LkIconName;
  danger?: boolean;
  onSelect: () => void;
}

export interface LkDropdownProps {
  triggerLabel: string;
  triggerIcon?: LkIconName;
  items: LkMenuItem[];
  align?: 'left' | 'right';
}

export function LkDropdown({
  triggerLabel,
  triggerIcon,
  items,
  align = 'left',
}: LkDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-medium whitespace-nowrap cursor-pointer ${LK_FOCUS_RING_CLASS}`}
        style={{
          backgroundColor: 'var(--lk-surface-solid)',
          borderColor: 'var(--lk-border-strong)',
          color: 'var(--lk-text)',
        }}
      >
        {triggerIcon && <LkIcon name={triggerIcon} size={16} />}
        <span>{triggerLabel}</span>
        <LkIcon name="ChevronDown" size={14} />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-40 mt-2 min-w-[200px] ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          <LkGlassSurface intensity="elevated" rounded="xl" className="p-1.5">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-left cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${LK_FOCUS_RING_CLASS}`}
                style={{
                  color: item.danger ? '#F87171' : 'var(--lk-text)',
                }}
              >
                {item.icon && <LkIcon name={item.icon} size={15} />}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </LkGlassSurface>
        </div>
      )}
    </div>
  );
}
