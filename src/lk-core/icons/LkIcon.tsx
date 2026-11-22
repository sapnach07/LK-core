import React from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowRight,
  Bell,
  BellOff,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Compass,
  Copy,
  Cpu,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  Filter,
  Folder,
  Globe,
  HardDrive,
  Heart,
  Home,
  Info,
  Layers,
  LayoutDashboard,
  Lock,
  Menu,
  Monitor,
  Moon,
  Palette,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sliders,
  Smartphone,
  Sparkles,
  Sun,
  Tablet,
  Terminal,
  Trash2,
  Type,
  Upload,
  User,
  Wand2,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export function LkLogoMark({
  size = 28,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        fill="var(--lk-surface-solid)"
        stroke="var(--lk-accent)"
        strokeWidth="1.75"
      />
      <path
        d="M10 9.5V22.5H15.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 9.5V22.5M22.5 9.5L17.5 16L22.5 22.5"
        stroke="var(--lk-accent)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const LK_ICON_REGISTRY = {
  LayoutDashboard,
  Layers,
  Palette,
  Settings,
  Sliders,
  Zap,
  Compass,
  Monitor,
  Tablet,
  Smartphone,
  FileCode2,
  Code2,
  Terminal,
  Cpu,
  HardDrive,
  Shield,
  Lock,
  Bell,
  BellOff,
  Globe,
  Type,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Search,
  Filter,
  Plus,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Play,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Home,
  User,
  Folder,
  Archive,
  Bookmark,
  Heart,
  Activity,
  Wand2,
  Sparkles,
} as const satisfies Record<string, LucideIcon>;

export type LkIconName = keyof typeof LK_ICON_REGISTRY;

export interface LkIconMeta {
  name: LkIconName;
  category: 'Navigation' | 'System' | 'Design' | 'Feedback' | 'Devices';
}

export const LK_ICON_CATALOG: LkIconMeta[] = [
  { name: 'LayoutDashboard', category: 'Navigation' },
  { name: 'Home', category: 'Navigation' },
  { name: 'Compass', category: 'Navigation' },
  { name: 'Menu', category: 'Navigation' },
  { name: 'ArrowRight', category: 'Navigation' },
  { name: 'ChevronRight', category: 'Navigation' },
  { name: 'ChevronDown', category: 'Navigation' },
  { name: 'Search', category: 'Navigation' },
  { name: 'Filter', category: 'Navigation' },
  { name: 'Layers', category: 'Design' },
  { name: 'Palette', category: 'Design' },
  { name: 'Sliders', category: 'Design' },
  { name: 'Type', category: 'Design' },
  { name: 'Wand2', category: 'Design' },
  { name: 'Sun', category: 'Design' },
  { name: 'Moon', category: 'Design' },
  { name: 'Eye', category: 'Design' },
  { name: 'EyeOff', category: 'Design' },
  { name: 'Settings', category: 'System' },
  { name: 'Shield', category: 'System' },
  { name: 'Lock', category: 'System' },
  { name: 'HardDrive', category: 'System' },
  { name: 'Cpu', category: 'System' },
  { name: 'Terminal', category: 'System' },
  { name: 'Code2', category: 'System' },
  { name: 'FileCode2', category: 'System' },
  { name: 'Globe', category: 'System' },
  { name: 'User', category: 'System' },
  { name: 'Folder', category: 'System' },
  { name: 'Archive', category: 'System' },
  { name: 'Bell', category: 'Feedback' },
  { name: 'BellOff', category: 'Feedback' },
  { name: 'Check', category: 'Feedback' },
  { name: 'CheckCircle2', category: 'Feedback' },
  { name: 'AlertTriangle', category: 'Feedback' },
  { name: 'AlertCircle', category: 'Feedback' },
  { name: 'Info', category: 'Feedback' },
  { name: 'Zap', category: 'Feedback' },
  { name: 'Activity', category: 'Feedback' },
  { name: 'Copy', category: 'System' },
  { name: 'Download', category: 'System' },
  { name: 'Upload', category: 'System' },
  { name: 'RefreshCw', category: 'System' },
  { name: 'Trash2', category: 'System' },
  { name: 'Plus', category: 'System' },
  { name: 'Play', category: 'System' },
  { name: 'X', category: 'System' },
  { name: 'Bookmark', category: 'Feedback' },
  { name: 'Heart', category: 'Feedback' },
  { name: 'Monitor', category: 'Devices' },
  { name: 'Tablet', category: 'Devices' },
  { name: 'Smartphone', category: 'Devices' },
];

export interface LkIconProps {
  name: LkIconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  accent?: boolean;
}

export function LkIcon({
  name,
  size = 18,
  strokeWidth = 1.75,
  className = '',
  accent = false,
}: LkIconProps) {
  const IconComponent = LK_ICON_REGISTRY[name];
  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      className={className}
      style={accent ? { color: 'var(--lk-accent)' } : undefined}
    />
  );
}
