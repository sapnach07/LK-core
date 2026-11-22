import React, { useMemo, useState } from 'react';
import {
  LK_ICON_CATALOG,
  LkCard,
  LkIcon,
  LkInput,
  LkSegmentedControl,
  LkSlider,
  useLkCore,
  type LkIconMeta,
  type LkIconName,
} from '../../lk-core';

export function IconGalleryView() {
  const { notify } = useLkCore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | LkIconMeta['category']>('All');
  const [iconSize, setIconSize] = useState(20);
  const [strokeWidth, setStrokeWidth] = useState(1.75);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LK_ICON_CATALOG.filter((item) => {
      const matchesCat = category === 'All' || item.category === category;
      const matchesSearch = !q || item.name.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [query, category]);

  const handleCopyIconSnippet = async (name: LkIconName) => {
    const snippet = `<LkIcon name="${name}" size={${iconSize}} strokeWidth={${strokeWidth}} />`;
    try {
      await navigator.clipboard.writeText(snippet);
      notify({
        title: `Copied ${name}`,
        description: snippet,
        variant: 'success',
      });
    } catch {
      notify({
        title: name,
        description: snippet,
        variant: 'info',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--lk-text)' }}>
          LK Icon System
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--lk-text-secondary)' }}>
          Standardized stroke weights, optical sizing, and click-to-copy TSX usage across all LK apps.
        </p>
      </div>

      <LkCard>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-4">
            <LkInput
              label="Search Icons"
              leftIcon="Search"
              placeholder="e.g. Shield, Palette, Bell..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="lg:col-span-4">
            <LkSlider
              label="Icon Size"
              min={14}
              max={32}
              step={2}
              unit="px"
              value={iconSize}
              onChange={setIconSize}
            />
          </div>
          <div className="lg:col-span-4">
            <LkSlider
              label="Stroke Weight"
              min={1.25}
              max={2.5}
              step={0.25}
              value={strokeWidth}
              onChange={setStrokeWidth}
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t overflow-x-auto" style={{ borderColor: 'var(--lk-border)' }}>
          <LkSegmentedControl
            ariaLabel="Filter icons by category"
            value={category}
            onChange={setCategory}
            options={[
              { value: 'All', label: 'All' },
              { value: 'Navigation', label: 'Navigation' },
              { value: 'Design', label: 'Design' },
              { value: 'System', label: 'System' },
              { value: 'Feedback', label: 'Feedback' },
              { value: 'Devices', label: 'Devices' },
            ]}
          />
        </div>
      </LkCard>

      {filtered.length === 0 ? (
        <LkCard>
          <p className="text-sm text-center py-6" style={{ color: 'var(--lk-text-muted)' }}>
            No icons match &ldquo;{query}&rdquo;. Clear the search filter to view all icons.
          </p>
        </LkCard>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filtered.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => handleCopyIconSnippet(item.name)}
              aria-label={`Copy ${item.name} icon snippet`}
              className="flex flex-col items-center justify-center gap-2.5 p-3.5 rounded-2xl border transition-all hover:brightness-110 cursor-pointer lk-focus-ring"
              style={{
                backgroundColor: 'var(--lk-surface)',
                borderColor: 'var(--lk-border)',
              }}
            >
              <LkIcon name={item.name} size={iconSize} strokeWidth={strokeWidth} />
              <span
                className="text-[11px] font-mono truncate max-w-full"
                style={{ color: 'var(--lk-text-secondary)' }}
              >
                {item.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
