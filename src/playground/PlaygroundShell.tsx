import React, { useState } from 'react';
import {
  LK_FOCUS_RING_CLASS,
  LkButton,
  LkGlassHeader,
  LkIcon,
  LkLogoMark,
  LkToastRegion,
  exportTokensAsJson,
  useLkCore,
  type LkIconName,
  type PlaygroundSectionId,
} from '../lk-core';
import { OverviewView } from './views/OverviewView';
import { ComponentGalleryView } from './views/ComponentGalleryView';
import { ThemeEditorView } from './views/ThemeEditorView';
import { SettingsCenterView } from './views/SettingsCenterView';
import { GlassLabView } from './views/GlassLabView';
import { MotionLabView } from './views/MotionLabView';
import { IconGalleryView } from './views/IconGalleryView';
import { ResponsivePreviewView } from './views/ResponsivePreviewView';
import { DocumentationView } from './views/DocumentationView';

interface NavEntry {
  id: PlaygroundSectionId;
  icon: LkIconName;
  group: 'foundation' | 'laboratory' | 'system';
}

const NAV_ITEMS: NavEntry[] = [
  { id: 'overview', icon: 'LayoutDashboard', group: 'foundation' },
  { id: 'components', icon: 'Layers', group: 'foundation' },
  { id: 'themes', icon: 'Palette', group: 'foundation' },
  { id: 'glass', icon: 'Wand2', group: 'laboratory' },
  { id: 'motion', icon: 'Zap', group: 'laboratory' },
  { id: 'icons', icon: 'Compass', group: 'laboratory' },
  { id: 'responsive', icon: 'Monitor', group: 'laboratory' },
  { id: 'settings', icon: 'Settings', group: 'system' },
  { id: 'docs', icon: 'FileCode2', group: 'system' },
];

export function PlaygroundShell() {
  const { settings, resolvedTheme, dictionary, updateSettings, notify } = useLkCore();
  const [activeSection, setActiveSection] = useState<PlaygroundSectionId>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSelectSection = (id: PlaygroundSectionId) => {
    setActiveSection(id);
    setMobileNavOpen(false);
  };

  const handleExportTokensDownload = () => {
    const payload = exportTokensAsJson(settings, resolvedTheme);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lk-core-tokens-${resolvedTheme}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify({
      title: 'Tokens exported',
      description: `Downloaded lk-core-tokens-${resolvedTheme}.json`,
      variant: 'success',
    });
  };

  const renderSidebarContent = () => {
    const groups: Array<'foundation' | 'laboratory' | 'system'> = [
      'foundation',
      'laboratory',
      'system',
    ];

    return (
      <div className="flex flex-col h-full justify-between p-4 gap-6">
        <div className="flex flex-col gap-6">
          {/* Brand Lockup */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <LkLogoMark size={30} />
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight whitespace-nowrap" style={{ color: 'var(--lk-text)' }}>
                LK Core 1.0
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--lk-text-muted)' }}>
                {dictionary.brandSubtitle}
              </p>
            </div>
          </div>

          {/* Navigation Groups */}
          <nav aria-label="LK Core Playground sections" className="flex flex-col gap-5">
            {groups.map((groupKey) => {
              const items = NAV_ITEMS.filter((item) => item.group === groupKey);
              return (
                <div key={groupKey} className="flex flex-col gap-1">
                  <p
                    className="px-3 pb-1 text-xs font-medium"
                    style={{ color: 'var(--lk-text-muted)' }}
                  >
                    {dictionary.navGroups[groupKey]}
                  </p>
                  {items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSection(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all cursor-pointer whitespace-nowrap ${LK_FOCUS_RING_CLASS}`}
                        style={{
                          backgroundColor: isActive ? 'var(--lk-accent)' : 'transparent',
                          color: isActive ? 'var(--lk-accent-contrast)' : 'var(--lk-text-secondary)',
                          transitionDuration: 'var(--lk-motion-duration)',
                        }}
                      >
                        <LkIcon name={item.icon} size={17} />
                        <span className="truncate">{dictionary.nav[item.id]}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Quick Theme Switcher Footer */}
        <div className="pt-4 border-t flex items-center justify-between gap-2 px-1" style={{ borderColor: 'var(--lk-border)' }}>
          <span className="text-xs capitalize" style={{ color: 'var(--lk-text-muted)' }}>
            {resolvedTheme} mode
          </span>
          <button
            type="button"
            aria-label={dictionary.actions.toggleTheme}
            onClick={() =>
              updateSettings(
                { themeMode: resolvedTheme === 'dark' ? 'light' : 'dark' },
                `Toggled to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`,
              )
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${LK_FOCUS_RING_CLASS}`}
            style={{
              backgroundColor: 'var(--lk-surface-solid)',
              borderColor: 'var(--lk-border)',
              color: 'var(--lk-text)',
            }}
          >
            <LkIcon name={resolvedTheme === 'dark' ? 'Sun' : 'Moon'} size={14} />
            <span>{resolvedTheme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--lk-bg)', color: 'var(--lk-text)' }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:block w-[260px] shrink-0 border-r sticky top-0 h-screen overflow-y-auto"
        style={{
          backgroundColor: 'var(--lk-bg-elevated)',
          borderColor: 'var(--lk-border)',
        }}
      >
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-sm flex"
          onClick={() => setMobileNavOpen(false)}
        >
          <aside
            className="w-[272px] max-w-[85vw] h-full border-r overflow-y-auto"
            style={{
              backgroundColor: 'var(--lk-bg-elevated)',
              borderColor: 'var(--lk-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end px-4 pt-3">
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileNavOpen(false)}
                className={`p-2 rounded-lg cursor-pointer ${LK_FOCUS_RING_CLASS}`}
                style={{ color: 'var(--lk-text-muted)' }}
              >
                <LkIcon name="X" size={18} />
              </button>
            </div>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <LkGlassHeader className="sticky top-0 z-30 px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileNavOpen(true)}
              className={`lg:hidden p-2 rounded-xl border cursor-pointer ${LK_FOCUS_RING_CLASS}`}
              style={{
                borderColor: 'var(--lk-border)',
                color: 'var(--lk-text)',
              }}
            >
              <LkIcon name="Menu" size={18} />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline whitespace-nowrap" style={{ color: 'var(--lk-text-muted)' }}>
                LK Core
              </span>
              <span className="hidden sm:inline" aria-hidden="true" style={{ color: 'var(--lk-text-muted)' }}>
                /
              </span>
              <span className="font-semibold truncate" style={{ color: 'var(--lk-text)' }}>
                {dictionary.nav[activeSection]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:block">
              <LkButton
                size="sm"
                variant="secondary"
                leftIcon={resolvedTheme === 'dark' ? 'Sun' : 'Moon'}
                onClick={() =>
                  updateSettings(
                    { themeMode: resolvedTheme === 'dark' ? 'light' : 'dark' },
                    `Toggled theme`,
                  )
                }
                aria-label={dictionary.actions.toggleTheme}
              >
                {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
              </LkButton>
            </div>
            <LkButton
              size="sm"
              variant="primary"
              leftIcon="Download"
              onClick={handleExportTokensDownload}
            >
              {dictionary.actions.exportTokens}
            </LkButton>
          </div>
        </LkGlassHeader>

        {/* Viewport Content */}
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-[1280px] w-full mx-auto">
          {activeSection === 'overview' && <OverviewView onNavigate={handleSelectSection} />}
          {activeSection === 'components' && <ComponentGalleryView />}
          {activeSection === 'themes' && <ThemeEditorView />}
          {activeSection === 'settings' && <SettingsCenterView />}
          {activeSection === 'glass' && <GlassLabView />}
          {activeSection === 'motion' && <MotionLabView />}
          {activeSection === 'icons' && <IconGalleryView />}
          {activeSection === 'responsive' && <ResponsivePreviewView />}
          {activeSection === 'docs' && <DocumentationView />}
        </main>
      </div>

      <LkToastRegion />
    </div>
  );
}
