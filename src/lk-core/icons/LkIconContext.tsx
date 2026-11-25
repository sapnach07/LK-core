import React, { createContext, useContext } from 'react';

export type LkRemoteSvgTag = 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'polygon' | 'g';

export interface LkRemoteSvgNode {
  tag: LkRemoteSvgTag;
  attributes: Record<string, string>;
  children?: LkRemoteSvgNode[];
}

export interface LkRemoteSvgIcon {
  name: string;
  viewBox: string;
  rootAttributes?: Record<string, string>;
  nodes: LkRemoteSvgNode[];
}

const LkRemoteIconContext = createContext<Record<string, LkRemoteSvgIcon> | null>(null);

export function LkRemoteIconProvider({
  icons,
  children,
}: {
  icons: Record<string, LkRemoteSvgIcon>;
  children: React.ReactNode;
}) {
  return (
    <LkRemoteIconContext.Provider value={icons}>
      {children}
    </LkRemoteIconContext.Provider>
  );
}

export function useLkRemoteIcons(): Record<string, LkRemoteSvgIcon> | null {
  return useContext(LkRemoteIconContext);
}
