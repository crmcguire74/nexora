import React from 'react';
import { DiagramType, SequenceParticipantRole } from '../../types/diagram';
import { LibraryItem, NexoraModuleId } from '../../engine/libraries';
import { liftStrokeForDark } from '../../engine/themes';

export const NexoraBrandLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <img
    src="/assets/aistudio/image_db9637f7.png"
    alt="Nexora"
    className={`${className} rounded-lg object-contain shrink-0`}
    draggable={false}
  />
);

/**
 * Exact module icons matching the Nexora brand architecture:
 * Flow (connected squares), Space (house outline), Sequence (opposing arrows), Architect (node hierarchy).
 */
export const NexoraModuleIcon: React.FC<{
  module: NexoraModuleId;
  className?: string;
}> = ({ module, className = 'w-5 h-5' }) => {
  switch (module) {
    case 'flow':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="4" width="7" height="7" rx="1.8" />
          <rect x="13" y="13" width="7" height="7" rx="1.8" />
          <path d="M7.5 11 V15.2 C7.5 16 8.1 16.5 9 16.5 H13" />
        </svg>
      );
    case 'space':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3.5 10.5 L12 3.5 L20.5 10.5" />
          <path d="M5.5 9.2 V19.5 C5.5 20.1 6 20.5 6.6 20.5 H17.4 C18 20.5 18.5 20.1 18.5 19.5 V9.2" />
          <path d="M9.8 20.5 V14.5 C9.8 14 10.2 13.6 10.7 13.6 H13.3 C13.8 13.6 14.2 14 14.2 14.5 V20.5" />
        </svg>
      );
    case 'sequence':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 8 H5 M8.5 4.5 L5 8 L8.5 11.5" />
          <path d="M5 16 H19 M15.5 12.5 L19 16 L15.5 19.5" />
        </svg>
      );
    case 'architect':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="5.5" r="2.5" />
          <circle cx="6" cy="18.5" r="2.5" />
          <circle cx="18" cy="18.5" r="2.5" />
          <path d="M12 8 V12.5 M12 12.5 H6 V16 M12 12.5 H18 V16" />
        </svg>
      );
  }
};

interface DiagramPreviewProps {
  type: DiagramType;
  className?: string;
}

export const DiagramTypeIllustration: React.FC<DiagramPreviewProps> = ({ type, className = 'w-full h-24' }) => {
  switch (type) {
    case 'flowchart':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          <rect x="16" y="34" width="44" height="24" rx="12" className="fill-emerald-50 dark:fill-emerald-950/60 stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="1.5" />
          <path d="M60 46 H84" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.5" />
          <polygon points="108,24 132,46 108,68 84,46" className="fill-amber-50 dark:fill-amber-950/60 stroke-amber-600 dark:stroke-amber-400" strokeWidth="1.5" />
          <path d="M132 46 H156 V26 H166" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.5" />
          <path d="M132 46 H156 V66 H166" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.5" />
          <rect x="166" y="15" width="38" height="22" rx="5" className="fill-teal-50 dark:fill-teal-950/60 stroke-teal-600 dark:stroke-teal-400" strokeWidth="1.5" />
          <rect x="166" y="55" width="38" height="22" rx="5" className="fill-slate-50 dark:fill-slate-800/80 stroke-slate-500 dark:stroke-slate-400" strokeWidth="1.5" />
        </svg>
      );
    case 'architecture':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          <rect x="68" y="10" width="138" height="76" rx="8" className="fill-sky-50/60 dark:fill-sky-950/25 stroke-sky-500/50 dark:stroke-sky-400/50" strokeWidth="1.25" strokeDasharray="4 3" />
          {/* Browser icon */}
          <g transform="translate(18, 32) scale(1.25)">
            <SequenceRoleIconPaths role="browser" color="#38BDF8" strokeWidth={1.6} />
          </g>
          <path d="M52 47 H84" className="stroke-sky-500 dark:stroke-sky-400" strokeWidth="1.5" />
          {/* Microservice cube icon */}
          <g transform="translate(86, 32) scale(1.25)">
            <SequenceRoleIconPaths role="microservice" color="#2DD4BF" strokeWidth={1.6} />
          </g>
          <path d="M118 47 H144 V28 H156" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.25" />
          <path d="M118 47 H144 V66 H156" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.25" />
          {/* Database cylinder icon */}
          <g transform="translate(160, 15) scale(1.08)">
            <SequenceRoleIconPaths role="database" color="#34D399" strokeWidth={1.6} />
          </g>
          {/* Cache bolt icon */}
          <g transform="translate(160, 53) scale(1.08)">
            <SequenceRoleIconPaths role="cache" color="#FBBF24" strokeWidth={1.6} />
          </g>
        </svg>
      );
    case 'sequence':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          {[36, 110, 184].map((cx, i) => (
            <g key={cx}>
              <rect x={cx - 22} y="10" width="44" height="18" rx="4" className={i === 0 ? 'fill-slate-100 dark:fill-slate-800 stroke-slate-500 dark:stroke-slate-400' : i === 1 ? 'fill-sky-50 dark:fill-sky-950/60 stroke-sky-600 dark:stroke-sky-400' : 'fill-teal-50 dark:fill-teal-950/60 stroke-teal-600 dark:stroke-teal-400'} strokeWidth="1.4" />
              <line x1={cx} y1="28" x2={cx} y2="86" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.25" strokeDasharray="3 3" />
            </g>
          ))}
          <rect x="106" y="40" width="8" height="36" rx="2" className="fill-teal-500/20 stroke-teal-600 dark:stroke-teal-400" strokeWidth="1" />
          <line x1="36" y1="44" x2="105" y2="44" className="stroke-sky-600 dark:stroke-sky-400" strokeWidth="1.6" />
          <polygon points="105,44 99,41 99,47" className="fill-sky-600 dark:fill-sky-400" />
          <line x1="114" y1="58" x2="183" y2="58" className="stroke-teal-600 dark:stroke-teal-400" strokeWidth="1.6" />
          <polygon points="183,58 177,55 177,61" className="fill-teal-600 dark:fill-teal-400" />
          <line x1="183" y1="73" x2="114" y2="73" className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="1.4" strokeDasharray="4 2" />
          <polygon points="114,73 120,70 120,76" className="fill-slate-500 dark:fill-slate-400" />
        </svg>
      );
    case 'floorplan':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          <rect x="26" y="14" width="168" height="68" className="fill-amber-50/40 dark:fill-slate-800/50 stroke-slate-700 dark:stroke-slate-300" strokeWidth="3" />
          <line x1="120" y1="14" x2="120" y2="82" className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="2" />
          <path d="M120 42 A18 18 0 0 1 138 60" className="stroke-teal-600 dark:stroke-teal-400" strokeWidth="1.25" strokeDasharray="2 2" />
          <line x1="120" y1="42" x2="120" y2="60" className="stroke-white dark:stroke-[#0C121E]" strokeWidth="3" />
          <line x1="120" y1="60" x2="138" y2="60" className="stroke-teal-600 dark:stroke-teal-400" strokeWidth="1.5" />
          <rect x="44" y="28" width="46" height="22" rx="2" className="fill-slate-200 dark:fill-slate-700 stroke-slate-500" strokeWidth="1" />
          <rect x="142" y="26" width="36" height="40" rx="2" className="fill-teal-100 dark:fill-teal-950/60 stroke-teal-500" strokeWidth="1" />
        </svg>
      );
    case 'network':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          <g transform="translate(20, 34) scale(1.15)">
            <SequenceRoleIconPaths role="cloud" color="#38BDF8" strokeWidth={1.6} />
          </g>
          <g transform="translate(88, 34) scale(1.15)">
            <DiagramObjectIconPaths type="net-firewall" stroke="#F87171" fill="rgba(248,113,113,0.14)" />
          </g>
          <g transform="translate(158, 12) scale(1.1)">
            <DiagramObjectIconPaths type="net-router" stroke="#818CF8" fill="rgba(129,140,248,0.14)" />
          </g>
          <g transform="translate(158, 54) scale(1.1)">
            <DiagramObjectIconPaths type="net-server" stroke="#2DD4BF" fill="rgba(45,212,191,0.14)" />
          </g>
          <line x1="50" y1="48" x2="86" y2="48" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.5" />
          <path d="M118 48 H138 V26 H156" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.5" />
          <path d="M118 48 H138 V68 H156" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.5" />
        </svg>
      );
    case 'erd':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          <rect x="20" y="16" width="66" height="62" rx="5" className="fill-white dark:fill-slate-800/80 stroke-teal-600 dark:stroke-teal-400" strokeWidth="1.5" />
          <rect x="20" y="16" width="66" height="18" rx="4" className="fill-teal-600/15 dark:fill-teal-400/20" />
          <line x1="20" y1="34" x2="86" y2="34" className="stroke-teal-600/40" strokeWidth="1" />
          <line x1="28" y1="46" x2="72" y2="46" className="stroke-slate-400" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="58" x2="62" y2="58" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
          <rect x="134" y="16" width="66" height="62" rx="5" className="fill-white dark:fill-slate-800/80 stroke-sky-600 dark:stroke-sky-400" strokeWidth="1.5" />
          <rect x="134" y="16" width="66" height="18" rx="4" className="fill-sky-600/15 dark:fill-sky-400/20" />
          <line x1="134" y1="34" x2="200" y2="34" className="stroke-sky-600/40" strokeWidth="1" />
          <line x1="142" y1="46" x2="186" y2="46" className="stroke-slate-400" strokeWidth="2" strokeLinecap="round" />
          <line x1="142" y1="58" x2="176" y2="58" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
          <path d="M86 47 H134" className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="1.5" />
          <path d="M126 42 L134 47 L126 52" className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="1.5" />
        </svg>
      );
    case 'orgchart':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          <rect x="82" y="12" width="56" height="22" rx="5" className="fill-slate-800 dark:fill-teal-500/85" />
          <path d="M110 34 V48 M46 48 H174 M46 48 V60 M110 48 V60 M174 48 V60" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.5" />
          <rect x="22" y="60" width="48" height="22" rx="5" className="fill-teal-50 dark:fill-teal-950/60 stroke-teal-600 dark:stroke-teal-400" strokeWidth="1.4" />
          <rect x="86" y="60" width="48" height="22" rx="5" className="fill-sky-50 dark:fill-sky-950/60 stroke-sky-600 dark:stroke-sky-400" strokeWidth="1.4" />
          <rect x="150" y="60" width="48" height="22" rx="5" className="fill-indigo-50 dark:fill-indigo-950/60 stroke-indigo-600 dark:stroke-indigo-400" strokeWidth="1.4" />
        </svg>
      );
    case 'journey':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          {[18, 84, 150].map((x, idx) => (
            <g key={x}>
              <rect x={x} y="14" width="52" height="16" rx="4" className="fill-slate-800 dark:fill-slate-700" />
              <rect x={x} y="42" width="52" height="36" rx="6" className={idx === 2 ? 'fill-emerald-50 dark:fill-emerald-950/50 stroke-emerald-600 dark:stroke-emerald-400' : 'fill-white dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-600'} strokeWidth="1.4" />
            </g>
          ))}
          <path d="M70 60 H84 M136 60 H150" className="stroke-teal-600 dark:stroke-teal-400" strokeWidth="1.5" />
        </svg>
      );
    case 'whiteboard':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          <rect x="26" y="18" width="48" height="44" rx="3" transform="rotate(-3 50 40)" className="fill-amber-100 dark:fill-amber-900/40 stroke-amber-400" strokeWidth="1.25" />
          <rect x="88" y="26" width="48" height="44" rx="3" transform="rotate(2 112 48)" className="fill-sky-100 dark:fill-sky-900/40 stroke-sky-400" strokeWidth="1.25" />
          <rect x="148" y="18" width="48" height="44" rx="3" transform="rotate(-1 172 40)" className="fill-emerald-100 dark:fill-emerald-900/40 stroke-emerald-400" strokeWidth="1.25" />
          <path d="M74 44 C80 44, 82 48, 88 48" className="stroke-slate-400" strokeWidth="1.4" strokeDasharray="3 2" />
        </svg>
      );
  }
};

/**
 * Pure SVG paths (24x24 coordinate space) representing every Sequence Diagram participant role.
 */
export const SequenceRoleIconPaths: React.FC<{
  role: SequenceParticipantRole;
  color: string;
  fill?: string;
  strokeWidth?: number;
}> = ({ role, color, fill = 'none', strokeWidth = 1.75 }) => {
  switch (role) {
    case 'actor':
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5.5" r="3" fill={fill} />
          <line x1="12" y1="8.5" x2="12" y2="15.5" />
          <line x1="6.5" y1="11.5" x2="17.5" y2="11.5" />
          <path d="M8 21 L12 15.5 L16 21" />
        </g>
      );
    case 'user':
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7.5" r="3.6" fill={fill} />
          <path d="M4.8 20 C4.8 15.8 7.8 13.8 12 13.8 C16.2 13.8 19.2 15.8 19.2 20 Z" fill={fill} />
        </g>
      );
    case 'browser':
    case 'web-ui':
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.8" y="4.2" width="18.4" height="15.6" rx="2.6" fill={fill} />
          <line x1="2.8" y1="8.8" x2="21.2" y2="8.8" />
          <circle cx="6" cy="6.5" r="0.8" fill={color} stroke="none" />
          <circle cx="8.6" cy="6.5" r="0.8" fill={color} stroke="none" />
          <path d="M9.5 12.6 L7.3 14.8 L9.5 17 M14.5 12.6 L16.7 14.8 L14.5 17" />
        </g>
      );
    case 'mobile':
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6.5" y="2.4" width="11" height="19.2" rx="2.5" fill={fill} />
          <line x1="10.2" y1="5.2" x2="13.8" y2="5.2" />
          <circle cx="12" cy="18.5" r="1" fill={color} stroke="none" />
        </g>
      );
    case 'api':
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8.2" y="6.5" width="7.6" height="11" rx="1.8" fill={fill} />
          <path d="M2.8 12 H8.2 M15.8 9.2 H21.2 M15.8 14.8 H21.2" />
          <path d="M18.9 7.2 L21.2 9.2 L18.9 11.2 M18.9 12.8 L21.2 14.8 L18.9 16.8" />
        </g>
      );
    case 'microservice':
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.8 L20.2 7.4 V16.6 L12 21.2 L3.8 16.6 V7.4 Z" fill={fill} />
          <path d="M12 12 L20.2 7.4 M12 12 L3.8 7.4 M12 12 V21.2" />
        </g>
      );
    case 'auth':
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.8 L19.4 6 V11.6 C19.4 16.4 16 19.8 12 21.2 C8 19.8 4.6 16.4 4.6 11.6 V6 Z" fill={fill} />
          <circle cx="12" cy="10.6" r="1.6" />
          <path d="M12 12.2 V15.4" />
        </g>
      );
    case 'queue':
    case 'event-bus':
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.8" y="6.4" width="13.2" height="11.2" rx="2.2" fill={fill} />
          <line x1="7.2" y1="6.4" x2="7.2" y2="17.6" />
          <line x1="11.6" y1="6.4" x2="11.6" y2="17.6" />
          <path d="M16 12 H21.2 M18.6 9.4 L21.2 12 L18.6 14.6" />
        </g>
      );
    case 'cache':
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13.6,2.6 5.2,13.1 11.4,13.1 10.4,21.4 18.8,10.9 12.6,10.9" fill={fill} />
        </g>
      );
    case 'database':
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.4 6.2 V17.8 C4.4 19.5 7.8 20.8 12 20.8 C16.2 20.8 19.6 19.5 19.6 17.8 V6.2 Z" fill={fill} />
          <ellipse cx="12" cy="6.2" rx="7.6" ry="2.8" fill={fill} />
          <path d="M4.4 12 C4.4 13.7 7.8 15 12 15 C16.2 15 19.6 13.7 19.6 12" />
        </g>
      );
    case 'cloud':
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.8 18.4 H17.6 C19.8 18.4 21.4 16.7 21.4 14.6 C21.4 12.7 20.1 11.2 18.2 11 C17.6 7.7 14.9 5.4 11.6 5.4 C8.1 5.4 5.3 7.9 5 11.2 C3.5 11.8 2.6 13.2 2.6 14.9 C2.6 16.9 4.3 18.4 6.8 18.4 Z" fill={fill} />
        </g>
      );
    case 'external':
    default:
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10.8" cy="13.2" r="7.4" fill={fill} />
          <ellipse cx="10.8" cy="13.2" rx="3.4" ry="7.4" />
          <line x1="3.6" y1="13.2" x2="18" y2="13.2" />
          <path d="M16 3.8 H20.6 V8.4 M20.6 3.8 L15.4 9" />
        </g>
      );
  }
};

export const SequenceRoleMiniIcon: React.FC<{
  role: SequenceParticipantRole;
  color: string;
  fill?: string;
  className?: string;
}> = ({ role, color, fill = 'none', className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <SequenceRoleIconPaths role={role} color={color} fill={fill} />
  </svg>
);

/**
 * Types that render as pure Icon-First nodes on the canvas (large vector icon silhouette
 * + floating label/subtitle/tech beneath it — NO enclosing rectangle box!).
 */
const ICON_NATIVE_OBJECT_TYPES = new Set<string>([
  // System Architecture
  'arch-user',
  'arch-browser',
  'arch-mobile',
  'arch-cdn',
  'arch-waf',
  'arch-gateway',
  'arch-lb',
  'arch-auth',
  'arch-secrets',
  'arch-api',
  'arch-service',
  'arch-function',
  'arch-worker',
  'arch-ml',
  'arch-monitoring',
  'arch-db',
  'arch-nosql',
  'arch-warehouse',
  'arch-search',
  'arch-cache',
  'arch-queue',
  'arch-storage',
  'arch-external',
  // Network Topology
  'net-internet',
  'net-firewall',
  'net-vpn',
  'net-ids',
  'net-router',
  'net-switch',
  'net-lb',
  'net-ap',
  'net-server',
  'net-dns',
  'net-nas',
  'net-workstation',
  'net-phone',
  'net-printer',
  'net-camera',
  // Flowchart icon-centric triggers
  'cloud-sync',
  'email-notify',
]);

export function isIconNativeObjectType(type: string): boolean {
  return ICON_NATIVE_OBJECT_TYPES.has(type);
}

/**
 * Card, container, or specialty shapes that display an inline crisp vector icon badge inside their node/header.
 */
const INLINE_ICON_OBJECT_TYPES = new Set<string>([
  // Containers
  'arch-container',
  'arch-region',
  'arch-vpc',
  'arch-subnet-pub',
  'arch-subnet-priv',
  'arch-k8s',
  'net-subnet',
  'net-dmz',
  'net-datacenter',
  'org-squad',
  // Flowchart specialty cards
  'approval',
  'loop',
  'error-handler',
  // Org Chart cards
  'org-board',
  'org-exec',
  'org-vp',
  'org-manager',
  'org-member',
  'org-assistant',
  'org-contractor',
  'org-open-role',
  // User Journey cards
  'journey-persona',
  'journey-stage',
  'journey-action',
  'journey-touchpoint',
  'journey-channel-web',
  'journey-channel-support',
  'journey-emotion-high',
  'journey-emotion-low',
  'journey-pain',
  'journey-opportunity',
  'journey-metric',
  // Whiteboard & ERD
  'wb-checklist',
  'wb-callout',
  'erd-index',
]);

export function hasCanvasInlineIcon(type: string): boolean {
  return INLINE_ICON_OBJECT_TYPES.has(type);
}

/**
 * Unified pure-SVG `<g>` artwork (24x24 viewBox) shared 1:1 between the Left Library Panel,
 * Outline tree, and live Interactive SVG Canvas (ensuring exact parity and crisp SVG/PNG exports).
 */
export const DiagramObjectIconPaths: React.FC<{
  type: string;
  stroke: string;
  fill?: string;
  dashed?: boolean;
  strokeWidth?: number;
}> = ({ type, stroke, fill = 'none', dashed = false, strokeWidth = 1.7 }) => {
  switch (type) {
    // --- Architecture ---
    case 'arch-user':
      return <SequenceRoleIconPaths role="user" color={stroke} fill={fill} strokeWidth={strokeWidth} />;
    case 'arch-browser':
      return <SequenceRoleIconPaths role="browser" color={stroke} fill={fill} strokeWidth={strokeWidth} />;
    case 'arch-mobile':
      return <SequenceRoleIconPaths role="mobile" color={stroke} fill={fill} strokeWidth={strokeWidth} />;
    case 'arch-cdn':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" fill={fill} />
          <ellipse cx="12" cy="12" rx="3.4" ry="8" />
          <line x1="4.2" y1="12" x2="19.8" y2="12" />
          <circle cx="5.2" cy="6.2" r="1.3" fill={stroke} stroke="none" />
          <circle cx="18.8" cy="17.8" r="1.3" fill={stroke} stroke="none" />
        </g>
      );
    case 'arch-waf':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.8 L19.5 5.8 V11.5 C19.5 16.2 16 19.6 12 21.2 C8 19.6 4.5 16.2 4.5 11.5 V5.8 Z" fill={fill} />
          <line x1="6.5" y1="10.2" x2="17.5" y2="10.2" strokeWidth={strokeWidth * 0.85} />
          <line x1="7.4" y1="14.2" x2="16.6" y2="14.2" strokeWidth={strokeWidth * 0.85} />
          <line x1="12" y1="6.2" x2="12" y2="18.2" strokeWidth={strokeWidth * 0.85} />
        </g>
      );
    case 'arch-gateway':
      return <SequenceRoleIconPaths role="api" color={stroke} fill={fill} strokeWidth={strokeWidth} />;
    case 'arch-lb':
    case 'net-lb':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5.8" cy="12" r="2.8" fill={fill} />
          <path d="M8.6 12 H12.8 L17.6 6.8 M12.8 12 H18.2 M12.8 12 L17.6 17.2" />
          <circle cx="19" cy="6.4" r="1.8" fill={fill} />
          <circle cx="19.4" cy="12" r="1.8" fill={fill} />
          <circle cx="19" cy="17.6" r="1.8" fill={fill} />
        </g>
      );
    case 'arch-auth':
      return <SequenceRoleIconPaths role="auth" color={stroke} fill={fill} strokeWidth={strokeWidth} />;
    case 'arch-secrets':
    case 'net-vpn':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4.8" y="10.4" width="14.4" height="10" rx="2.4" fill={fill} />
          <path d="M8.2 10.4 V7.4 C8.2 5.1 9.8 3.6 12 3.6 C14.2 3.6 15.8 5.1 15.8 7.4 V10.4" />
          <circle cx="12" cy="14.8" r="1.4" fill={stroke} stroke="none" />
          <path d="M12 16.2 V17.8" />
        </g>
      );
    case 'arch-api':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 5.2 C6.2 5.2 6.2 7.5 6.2 9.6 C6.2 11 4.4 12 4.4 12 C4.4 12 6.2 13 6.2 14.4 C6.2 16.5 6.2 18.8 8.5 18.8" />
          <path d="M15.5 5.2 C17.8 5.2 17.8 7.5 17.8 9.6 C17.8 11 19.6 12 19.6 12 C19.6 12 17.8 13 17.8 14.4 C17.8 16.5 17.8 18.8 15.5 18.8" />
          <circle cx="12" cy="12" r="2.2" fill={fill} />
        </g>
      );
    case 'arch-service':
      return <SequenceRoleIconPaths role="microservice" color={stroke} fill={fill} strokeWidth={strokeWidth} />;
    case 'arch-function':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 4.8 H10.6 L16.8 19.2 H19.6" />
          <path d="M12.2 11.4 L7.2 19.2" />
          <circle cx="17.8" cy="6.2" r="1.8" fill={fill} />
        </g>
      );
    case 'arch-worker':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3.4" fill={fill} />
          <path d="M12 3.2 V5.6 M12 18.4 V20.8 M3.2 12 H5.6 M18.4 12 H20.8 M5.8 5.8 L7.5 7.5 M16.5 16.5 L18.2 18.2 M18.2 5.8 L16.5 7.5 M7.5 16.5 L5.8 18.2" />
          <circle cx="12" cy="12" r="6.4" strokeDasharray="3 2.5" />
        </g>
      );
    case 'arch-ml':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3.2" fill={fill} />
          <circle cx="12" cy="4.4" r="1.6" fill={fill} />
          <circle cx="12" cy="19.6" r="1.6" fill={fill} />
          <circle cx="4.6" cy="8.2" r="1.6" fill={fill} />
          <circle cx="19.4" cy="8.2" r="1.6" fill={fill} />
          <circle cx="4.6" cy="15.8" r="1.6" fill={fill} />
          <circle cx="19.4" cy="15.8" r="1.6" fill={fill} />
          <path d="M12 6 V8.8 M12 15.2 V18 M6.1 9 L9.1 10.6 M14.9 13.4 L17.9 15 M17.9 9 L14.9 10.6 M9.1 13.4 L6.1 15" />
        </g>
      );
    case 'arch-monitoring':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4.5" width="18" height="14.5" rx="2.5" fill={fill} />
          <path d="M5.6 13.5 H8.4 L10.4 9 L13 15.2 L15.2 11.4 L18.4 11.4" />
        </g>
      );
    case 'arch-db':
    case 'database':
      return <SequenceRoleIconPaths role="database" color={stroke} fill={fill} strokeWidth={strokeWidth} />;
    case 'arch-nosql':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3.5 H14.5 L19 8 V20.5 H6 Z" fill={fill} />
          <path d="M14.5 3.5 V8 H19" />
          <path d="M10.2 11.5 C9.2 11.5 9.2 12.6 9.2 13.4 C9.2 14 8.4 14.5 8.4 14.5 C8.4 14.5 9.2 15 9.2 15.6 C9.2 16.4 9.2 17.5 10.2 17.5" strokeWidth={strokeWidth * 0.9} />
          <path d="M14.8 11.5 C15.8 11.5 15.8 12.6 15.8 13.4 C15.8 14 16.6 14.5 16.6 14.5 C16.6 14.5 15.8 15 15.8 15.6 C15.8 16.4 15.8 17.5 14.8 17.5" strokeWidth={strokeWidth * 0.9} />
        </g>
      );
    case 'arch-warehouse':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 9 L12 4 L20.5 9 V19.5 H3.5 Z" fill={fill} />
          <line x1="7.5" y1="12.5" x2="7.5" y2="19.5" />
          <line x1="12" y1="11" x2="12" y2="19.5" />
          <line x1="16.5" y1="12.5" x2="16.5" y2="19.5" />
        </g>
      );
    case 'arch-search':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10.5" cy="10.5" r="6.4" fill={fill} />
          <line x1="15.2" y1="15.2" x2="20.4" y2="20.4" strokeWidth={strokeWidth * 1.15} />
          <path d="M8.2 10.5 H12.8 M10.5 8.2 V12.8" strokeWidth={strokeWidth * 0.85} />
        </g>
      );
    case 'arch-cache':
      return <SequenceRoleIconPaths role="cache" color={stroke} fill={fill} strokeWidth={strokeWidth} />;
    case 'arch-queue':
      return <SequenceRoleIconPaths role="queue" color={stroke} fill={fill} strokeWidth={strokeWidth} />;
    case 'arch-storage':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.8 7 L6.5 18.4 C6.8 19.7 9.1 20.6 12 20.6 C14.9 20.6 17.2 19.7 17.5 18.4 L19.2 7 Z" fill={fill} />
          <ellipse cx="12" cy="7" rx="7.2" ry="2.6" fill={fill} />
          <path d="M7.5 12.8 C9.2 13.7 14.8 13.7 16.5 12.8" strokeWidth={strokeWidth * 0.85} />
        </g>
      );
    case 'arch-external':
      return <SequenceRoleIconPaths role="external" color={stroke} fill={fill} strokeWidth={strokeWidth} />;
    case 'arch-container':
    case 'net-internet':
    case 'cloud-sync':
      return <SequenceRoleIconPaths role="cloud" color={stroke} fill={fill} strokeWidth={strokeWidth} />;
    case 'arch-vpc':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.2" y="4.8" width="17.6" height="14.4" rx="2.8" strokeDasharray="3.2 2.2" fill={fill} />
          <rect x="9.2" y="10.4" width="5.6" height="4.8" rx="1" />
          <path d="M10.4 10.4 V9 C10.4 7.8 13.6 7.8 13.6 9 V10.4" />
        </g>
      );
    case 'arch-k8s':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12,2.8 19.8,7.4 19.8,16.6 12,21.2 4.2,16.6 4.2,7.4" fill={fill} />
          <circle cx="12" cy="12" r="2.6" />
          <path d="M12 5.4 V9.4 M12 14.6 V18.6 M6.4 8.8 L9.7 10.7 M14.3 13.3 L17.6 15.2 M17.6 8.8 L14.3 10.7 M9.7 13.3 L6.4 15.2" />
        </g>
      );

    // --- Network ---
    case 'net-firewall':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.2" y="5" width="17.6" height="14" rx="2.2" fill={fill} />
          <line x1="3.2" y1="9.7" x2="20.8" y2="9.7" />
          <line x1="3.2" y1="14.3" x2="20.8" y2="14.3" />
          <line x1="12" y1="5" x2="12" y2="9.7" />
          <line x1="8.4" y1="9.7" x2="8.4" y2="14.3" />
          <line x1="15.6" y1="9.7" x2="15.6" y2="14.3" />
          <line x1="12" y1="14.3" x2="12" y2="19" />
        </g>
      );
    case 'net-ids':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.8 L19.4 6 V11.6 C19.4 16.4 16 19.8 12 21.2 C8 19.8 4.6 16.4 4.6 11.6 V6 Z" fill={fill} />
          <path d="M8.2 12 C9.4 10 14.6 10 15.8 12 C14.6 14 9.4 14 8.2 12 Z" />
          <circle cx="12" cy="12" r="1.1" fill={stroke} stroke="none" />
        </g>
      );
    case 'net-router':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8.2" fill={fill} />
          <path d="M12 6.8 V17.2 M6.8 12 H17.2 M9.8 9 L12 6.8 L14.2 9 M9.8 15 L12 17.2 L14.2 15" />
        </g>
      );
    case 'net-switch':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.8" y="6.2" width="18.4" height="11.6" rx="2.2" fill={fill} />
          <path d="M6.8 9.8 H17.2 M14.8 7.8 L17.2 9.8 L14.8 11.8 M17.2 14.2 H6.8 M9.2 12.2 L6.8 14.2 L9.2 16.2" />
        </g>
      );
    case 'net-ap':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="17.2" r="1.8" fill={stroke} stroke="none" />
          <path d="M8.4 13.8 A5.2 5.2 0 0 1 15.6 13.8 M5.4 10.6 A9.4 9.4 0 0 1 18.6 10.6 M2.8 7.4 A13 13 0 0 1 21.2 7.4" />
        </g>
      );
    case 'net-server':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.8" y="4.2" width="16.4" height="6.4" rx="1.6" fill={fill} />
          <rect x="3.8" y="13.4" width="16.4" height="6.4" rx="1.6" fill={fill} />
          <circle cx="7.4" cy="7.4" r="1" fill={stroke} stroke="none" />
          <circle cx="7.4" cy="16.6" r="1" fill={stroke} stroke="none" />
          <line x1="11" y1="7.4" x2="16.8" y2="7.4" />
          <line x1="11" y1="16.6" x2="16.8" y2="16.6" />
        </g>
      );
    case 'net-dns':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" fill={fill} />
          <line x1="4.2" y1="12" x2="19.8" y2="12" />
          <ellipse cx="12" cy="12" rx="3.6" ry="8" />
        </g>
      );
    case 'net-nas':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" fill={fill} />
          <line x1="9.2" y1="4.5" x2="9.2" y2="19.5" />
          <line x1="14.8" y1="4.5" x2="14.8" y2="19.5" />
          <circle cx="6.4" cy="16.2" r="0.9" fill={stroke} stroke="none" />
          <circle cx="12" cy="16.2" r="0.9" fill={stroke} stroke="none" />
          <circle cx="17.6" cy="16.2" r="0.9" fill={stroke} stroke="none" />
        </g>
      );
    case 'net-workstation':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.2" y="4.6" width="17.6" height="11.4" rx="2" fill={fill} />
          <path d="M8.6 19.6 H15.4 M12 16 V19.6" />
        </g>
      );
    case 'net-camera':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.2" y="6.8" width="12.8" height="10.4" rx="2.2" fill={fill} />
          <polygon points="16,10 20.8,7.2 20.8,16.8 16,14" fill={fill} />
        </g>
      );
    case 'net-printer':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6.5" y="3.8" width="11" height="5" />
          <rect x="3.2" y="8.8" width="17.6" height="8.2" rx="1.8" fill={fill} />
          <rect x="7" y="13.8" width="10" height="6.2" fill="none" />
        </g>
      );
    case 'net-phone':
      return <SequenceRoleIconPaths role="mobile" color={stroke} fill={fill} strokeWidth={strokeWidth} />;
    case 'net-subnet':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.2" y="4.8" width="17.6" height="14.4" rx="2.6" strokeDasharray="3 2" fill={fill} />
          <circle cx="8.8" cy="12" r="1.6" />
          <circle cx="15.2" cy="12" r="1.6" />
          <line x1="10.4" y1="12" x2="13.6" y2="12" />
        </g>
      );

    // --- Flowchart ---
    case 'start':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.8" y="6.8" width="18.4" height="10.4" rx="5.2" fill={fill} />
        </g>
      );
    case 'end':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.8" y="6.8" width="18.4" height="10.4" rx="5.2" fill={fill} />
          <circle cx="12" cy="12" r="2.2" fill={stroke} stroke="none" />
        </g>
      );
    case 'process':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5.8" width="18" height="12.4" rx="2.6" fill={fill} />
          <line x1="7.5" y1="12" x2="16.5" y2="12" strokeWidth={strokeWidth * 0.85} />
        </g>
      );
    case 'decision':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12,2.8 21.2,12 12,21.2 2.8,12" fill={fill} />
        </g>
      );
    case 'io':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="6.5,5.8 21,5.8 17.5,18.2 3,18.2" fill={fill} />
        </g>
      );
    case 'subprocess':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5.8" width="18" height="12.4" rx="2" fill={fill} />
          <line x1="6.8" y1="5.8" x2="6.8" y2="18.2" strokeWidth={strokeWidth * 0.85} />
          <line x1="17.2" y1="5.8" x2="17.2" y2="18.2" strokeWidth={strokeWidth * 0.85} />
        </g>
      );
    case 'document':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5.2 H20 V16.4 C16.5 14.4 13.5 19.6 4 17.6 Z" fill={fill} />
          <line x1="7.5" y1="9.4" x2="16.5" y2="9.4" strokeWidth={strokeWidth * 0.8} />
          <line x1="7.5" y1="13" x2="13.5" y2="13" strokeWidth={strokeWidth * 0.8} />
        </g>
      );
    case 'multi-doc':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6.2" y="3.8" width="13.6" height="12" rx="1.6" fill={fill} />
          <rect x="4" y="7.2" width="13.6" height="12" rx="1.6" fill={fill} />
          <line x1="7" y1="11.6" x2="14.6" y2="11.6" strokeWidth={strokeWidth * 0.8} />
          <line x1="7" y1="14.8" x2="12" y2="14.8" strokeWidth={strokeWidth * 0.8} />
        </g>
      );
    case 'delay':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6 H13.5 C17.6 6 20.5 8.7 20.5 12 C20.5 15.3 17.6 18 13.5 18 H4 Z" fill={fill} />
        </g>
      );
    case 'manual-op':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3.5,6.5 20.5,6.5 18,17.5 6,17.5" fill={fill} />
        </g>
      );
    case 'approval':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8.2" fill={fill} />
          <path d="M8.2 12.2 L10.8 14.8 L16.2 9.2" />
        </g>
      );
    case 'loop':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.2 6.5 H8.4 C5.8 6.5 4.2 8.1 4.2 10.6 V11.5 M14.6 4 L17.2 6.5 L14.6 9" />
          <path d="M6.8 17.5 H15.6 C18.2 17.5 19.8 15.9 19.8 13.4 V12.5 M9.4 15 L6.8 17.5 L9.4 20" />
        </g>
      );
    case 'merge':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="4,5.8 20,5.8 12,19.2" fill={fill} />
        </g>
      );
    case 'connector-circle':
    case 'wb-dot-vote':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none">
          <circle cx="12" cy="12" r="7.5" fill={fill} />
        </g>
      );
    case 'error-handler':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12,3.4 21,19.2 3,19.2" fill={fill} />
          <line x1="12" y1="9.4" x2="12" y2="13.8" />
          <circle cx="12" cy="16.5" r="0.9" fill={stroke} stroke="none" />
        </g>
      );
    case 'email-notify':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.2" y="5.2" width="17.6" height="13.6" rx="2.2" fill={fill} />
          <path d="M4.2 6.8 L12 13 L19.8 6.8" />
        </g>
      );
    case 'swimlane':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4.8" width="18" height="14.4" rx="2" fill={fill} />
          <line x1="8" y1="4.8" x2="8" y2="19.2" />
          <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="2 2" />
        </g>
      );
    case 'container':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.2" y="4.8" width="17.6" height="14.4" rx="2.5" fill={fill} strokeDasharray={dashed ? '3 2' : undefined} />
          <line x1="3.2" y1="9.4" x2="20.8" y2="9.4" strokeWidth={strokeWidth * 0.75} />
        </g>
      );
    case 'note':
    case 'sticky':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.8 4 H19.2 V15 L14.6 19.6 H4.8 Z" fill={fill} />
          <path d="M14.6 19.6 V15 H19.2" />
        </g>
      );
    case 'text':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth * 1.1} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 6.5 H19 M12 6.5 V18.5 M9 18.5 H15" />
        </g>
      );

    // --- ERD ---
    case 'erd-entity':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.8" y="4.2" width="16.4" height="15.6" rx="2" fill={fill} />
          <line x1="3.8" y1="9.4" x2="20.2" y2="9.4" />
          <line x1="9.4" y1="9.4" x2="9.4" y2="19.8" />
          <line x1="3.8" y1="14.6" x2="20.2" y2="14.6" />
        </g>
      );
    case 'erd-view':
    case 'erd-enum':
    case 'erd-index':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.8" y="4.2" width="16.4" height="15.6" rx="2" fill={fill} strokeDasharray={dashed ? '3 2' : undefined} />
          <line x1="3.8" y1="9.4" x2="20.2" y2="9.4" />
          <line x1="7.4" y1="13.4" x2="16.6" y2="13.4" />
          <line x1="7.4" y1="16.6" x2="13.6" y2="16.6" />
        </g>
      );

    // --- Org Chart ---
    case 'org-exec':
    case 'org-board':
    case 'org-vp':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16.8 L6 7.8 L12 12 L18 7.8 L20 16.8 Z" fill={fill} />
          <line x1="4" y1="20" x2="20" y2="20" />
        </g>
      );
    case 'org-manager':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="2.8" fill={fill} />
          <path d="M7.4 14 C7.4 11.4 9.5 10.4 12 10.4 C14.5 10.4 16.6 11.4 16.6 14" />
          <path d="M5 19.6 H19 M12 14 V19.6" />
        </g>
      );
    case 'org-member':
    case 'org-assistant':
    case 'org-contractor':
    case 'org-open-role':
    case 'journey-persona':
      return <SequenceRoleIconPaths role="user" color={stroke} fill={fill} strokeWidth={strokeWidth} />;

    // --- User Journey ---
    case 'journey-stage':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4.8 V19.4 M5 5.8 H17.4 L14.6 10 L17.4 14.2 H5" fill={fill} />
        </g>
      );
    case 'journey-action':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4 L18.4 11 L12 13.2 L10 19.4 Z" fill={fill} />
        </g>
      );
    case 'journey-touchpoint':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" fill={fill} />
          <circle cx="12" cy="12" r="7.6" strokeDasharray="3 2" />
        </g>
      );
    case 'journey-channel-web':
      return <SequenceRoleIconPaths role="browser" color={stroke} fill={fill} strokeWidth={strokeWidth} />;
    case 'journey-channel-support':
    case 'wb-callout':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6 C4 4.9 4.9 4 6 4 H18 C19.1 4 20 4.9 20 6 V14 C20 15.1 19.1 16 18 16 H10 L6 20 V16 H6 C4.9 16 4 15.1 4 14 Z" fill={fill} />
        </g>
      );
    case 'journey-emotion-high':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" fill={fill} />
          <path d="M8.5 14 C9.5 16 14.5 16 15.5 14" />
          <circle cx="9.2" cy="10" r="0.9" fill={stroke} stroke="none" />
          <circle cx="14.8" cy="10" r="0.9" fill={stroke} stroke="none" />
        </g>
      );
    case 'journey-emotion-low':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" fill={fill} />
          <path d="M8.5 16 C9.5 14 14.5 14 15.5 16" />
          <circle cx="9.2" cy="10" r="0.9" fill={stroke} stroke="none" />
          <circle cx="14.8" cy="10" r="0.9" fill={stroke} stroke="none" />
        </g>
      );
    case 'journey-pain':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3.8 L20.6 19.2 H3.4 Z" fill={fill} />
          <line x1="12" y1="9.8" x2="12" y2="14" />
          <circle cx="12" cy="16.6" r="0.9" fill={stroke} stroke="none" />
        </g>
      );
    case 'journey-opportunity':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3.8 C8.6 3.8 6.4 6.2 6.4 9.2 C6.4 11.4 7.7 13 9.2 14.2 V16.6 H14.8 V14.2 C16.3 13 17.6 11.4 17.6 9.2 C17.6 6.2 15.4 3.8 12 3.8 Z" fill={fill} />
          <line x1="9.4" y1="19.8" x2="14.6" y2="19.8" />
        </g>
      );
    case 'journey-metric':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="19.2" x2="20" y2="19.2" />
          <rect x="6" y="12" width="3" height="7.2" fill={fill} />
          <rect x="10.5" y="8" width="3" height="11.2" fill={fill} />
          <rect x="15" y="4.8" width="3" height="14.4" fill={fill} />
        </g>
      );
    case 'wb-checklist':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" fill={fill} />
          <path d="M7.5 9.5 L9 11 L11.5 8.5 M13.5 9.5 H17 M7.5 14.5 L9 16 L11.5 13.5 M13.5 14.5 H17" />
        </g>
      );
    case 'arch-region':
    case 'arch-subnet-pub':
    case 'arch-subnet-priv':
    case 'net-dmz':
    case 'net-datacenter':
    case 'org-squad':
    case 'wb-kanban-col':
    case 'wb-quadrant':
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.2" y="4.4" width="17.6" height="15.2" rx="2.5" fill={fill} strokeDasharray={dashed ? '3 2' : undefined} />
          <line x1="12" y1="4.4" x2="12" y2="19.6" strokeOpacity="0.45" />
          <line x1="3.2" y1="12" x2="20.8" y2="12" strokeOpacity="0.45" />
        </g>
      );
    default:
      return (
        <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="5.5" width="17" height="13" rx="3" fill={fill} />
        </g>
      );
  }
};

/**
 * Renders a tailored, borderless miniature vector icon for EVERY library element
 * across all 9 diagram generators, matching 1:1 with canvas icon glyphs.
 */
export const LibraryItemMiniIcon: React.FC<{
  item: Pick<LibraryItem, 'id' | 'type' | 'fill' | 'stroke' | 'textColor' | 'dashed' | 'participantRole' | 'floorItemKind'>;
  darkMode?: boolean;
  className?: string;
}> = ({ item, darkMode = false, className = 'w-6 h-6' }) => {
  const rawStroke = item.stroke === 'transparent' ? '#64748B' : item.stroke;
  const stroke = liftStrokeForDark(rawStroke, darkMode);
  const softFill =
    item.fill === 'transparent'
      ? 'none'
      : darkMode
      ? `${stroke}22`
      : item.fill === '#FFFFFF' || item.fill === '#F8FAFC'
      ? `${stroke}16`
      : item.fill;

  // 1. Sequence diagram participants — exact 1:1 icon match with canvas
  if (item.participantRole) {
    return (
      <SequenceRoleMiniIcon
        role={item.participantRole}
        color={stroke}
        fill={`${stroke}1C`}
        className={className}
      />
    );
  }

  // 2. Floor Plan items — architectural plan symbols
  if (item.floorItemKind || item.type.startsWith('fp-')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {item.floorItemKind === 'wall' || item.type === 'fp-wall' ? (
          <>
            <line x1="4" y1="18" x2="20" y2="6" strokeWidth="3.2" />
            <circle cx="4" cy="18" r="2" fill={darkMode ? '#0C121E' : '#FFFFFF'} strokeWidth="1.5" />
            <circle cx="20" cy="6" r="2" fill={darkMode ? '#0C121E' : '#FFFFFF'} strokeWidth="1.5" />
          </>
        ) : item.floorItemKind === 'room-rect' || item.type === 'fp-room' || item.type === 'fp-room-large' ? (
          <>
            <rect x="4" y="5" width="16" height="14" rx="1" fill={softFill} strokeWidth="2" />
            <path d="M8 12 H16 M12 8.5 V15.5" strokeWidth="1.1" strokeDasharray="2 2" />
          </>
        ) : item.floorItemKind === 'door' || item.type === 'fp-door' ? (
          <>
            <line x1="4" y1="19" x2="20" y2="19" strokeWidth="2" />
            <line x1="7" y1="19" x2="7" y2="7" strokeWidth="2" />
            <path d="M7 7 A12 12 0 0 1 19 19" strokeDasharray="2.5 2" strokeWidth="1.4" />
          </>
        ) : item.floorItemKind === 'double-door' || item.type === 'fp-double-door' ? (
          <>
            <line x1="3" y1="18" x2="21" y2="18" strokeWidth="1.8" />
            <line x1="5" y1="18" x2="5" y2="11" strokeWidth="1.8" />
            <line x1="19" y1="18" x2="19" y2="11" strokeWidth="1.8" />
            <path d="M5 11 A7 7 0 0 1 12 18 M19 11 A7 7 0 0 0 12 18" strokeDasharray="2 2" strokeWidth="1.3" />
          </>
        ) : item.floorItemKind === 'sliding-door' || item.type === 'fp-sliding-door' || item.type === 'fp-garage-door' ? (
          <>
            <line x1="3" y1="10" x2="14" y2="10" strokeWidth="2.2" />
            <line x1="10" y1="14" x2="21" y2="14" strokeWidth="2.2" />
            <line x1="3" y1="7.5" x2="3" y2="16.5" strokeWidth="1.4" />
            <line x1="21" y1="7.5" x2="21" y2="16.5" strokeWidth="1.4" />
          </>
        ) : item.floorItemKind === 'window' || item.type === 'fp-window' || item.type === 'fp-wide-window' ? (
          <>
            <rect x="3" y="9" width="18" height="6" fill={softFill} strokeWidth="1.6" />
            <line x1="3" y1="12" x2="21" y2="12" strokeWidth="1.2" />
            <line x1="12" y1="9" x2="12" y2="15" strokeWidth="1.2" />
          </>
        ) : item.type === 'stairs' ? (
          <>
            <rect x="5" y="3.5" width="14" height="17" fill={softFill} />
            <line x1="5" y1="8" x2="19" y2="8" />
            <line x1="5" y1="12" x2="19" y2="12" />
            <line x1="5" y1="16" x2="19" y2="16" />
            <path d="M12 18 V6 M9.5 8.5 L12 6 L14.5 8.5" strokeWidth="1.4" />
          </>
        ) : item.type === 'spiral-stairs' ? (
          <>
            <circle cx="12" cy="12" r="8" fill={softFill} />
            <path d="M12 4 V20 M4 12 H20 M6.4 6.4 L17.6 17.6 M17.6 6.4 L6.4 17.6" strokeWidth="1.1" />
            <circle cx="12" cy="12" r="2" fill={stroke} />
          </>
        ) : item.type === 'elevator' ? (
          <>
            <rect x="4" y="4" width="16" height="16" rx="1.5" fill={softFill} />
            <line x1="4" y1="4" x2="20" y2="20" strokeWidth="1.2" />
            <line x1="20" y1="4" x2="4" y2="20" strokeWidth="1.2" />
          </>
        ) : item.type === 'column' ? (
          <>
            <rect x="6" y="6" width="12" height="12" fill={softFill} strokeWidth="2" />
            <line x1="6" y1="6" x2="18" y2="18" strokeWidth="1.2" />
          </>
        ) : item.type === 'fireplace' ? (
          <>
            <rect x="3.5" y="7" width="17" height="11" rx="1.5" fill={softFill} />
            <path d="M12 15.5 C10 15.5 9.2 14 10.2 12.2 C10.8 11.2 12 10 12 9.5 C12.5 10.6 14.5 11.8 14.2 13.7 C14 14.8 13.2 15.5 12 15.5 Z" />
          </>
        ) : item.type === 'car-sedan' || item.type === 'car-suv' ? (
          <>
            <rect x="6" y="3" width="12" height="18" rx="3.5" fill={softFill} />
            <rect x="8" y="6.5" width="8" height="3.5" rx="1" />
            <rect x="8" y="14" width="8" height="3" rx="1" />
          </>
        ) : item.type === 'ev-charger' || item.type === 'elec-panel' ? (
          <>
            <rect x="5" y="4" width="14" height="16" rx="2" fill={softFill} />
            <polygon points="13,7 9,12.5 12,12.5 11,17 15,11.5 12,11.5" fill={stroke} stroke="none" />
          </>
        ) : item.type === 'bathtub' ? (
          <>
            <rect x="3" y="6.5" width="18" height="11" rx="2" fill={softFill} />
            <rect x="5.5" y="8.5" width="13" height="7" rx="3.5" />
          </>
        ) : item.type === 'shower' ? (
          <>
            <rect x="4" y="4" width="16" height="16" rx="1.5" fill={softFill} />
            <line x1="4" y1="4" x2="20" y2="20" strokeWidth="1.1" />
            <line x1="20" y1="4" x2="4" y2="20" strokeWidth="1.1" />
            <circle cx="12" cy="12" r="2" />
          </>
        ) : item.type === 'toilet' || item.type === 'restroom-stall' ? (
          <>
            <rect x="7" y="4" width="10" height="4.5" rx="1" fill={softFill} />
            <ellipse cx="12" cy="14" rx="4.8" ry="5.5" fill={softFill} />
          </>
        ) : item.type === 'vanity' ? (
          <>
            <rect x="3.5" y="6.5" width="17" height="11" rx="1.5" fill={softFill} />
            <ellipse cx="12" cy="12" rx="4.5" ry="3.2" />
          </>
        ) : item.type === 'stove' || item.type === 'bbq-grill' ? (
          <>
            <rect x="4" y="5" width="16" height="14" rx="1.5" fill={softFill} />
            <circle cx="8.5" cy="9.5" r="2" />
            <circle cx="15.5" cy="9.5" r="2" />
            <circle cx="8.5" cy="14.5" r="2" />
            <circle cx="15.5" cy="14.5" r="2" />
          </>
        ) : item.type === 'fridge' || item.type === 'washer-dryer' ? (
          <>
            <rect x="4.5" y="5" width="15" height="14" rx="1.5" fill={softFill} />
            <line x1="12" y1="5" x2="12" y2="19" />
            <circle cx="8.5" cy="12" r="1.8" />
            <circle cx="15.5" cy="12" r="1.8" />
          </>
        ) : item.type === 'swimming-pool' || item.type === 'hot-tub' ? (
          <>
            <rect x="3" y="5.5" width="18" height="13" rx="3" fill={softFill} />
            <path d="M6.5 10.5 Q9 8.5 11.5 10.5 T17 10.5 M6.5 14.2 Q9 12.2 11.5 14.2 T17 14.2" strokeWidth="1.3" />
          </>
        ) : item.type === 'patio-deck' || item.type === 'pergola' || item.type === 'walkway' || item.type === 'driveway' ? (
          <>
            <rect x="3.5" y="5" width="17" height="14" rx="1.5" fill={softFill} />
            <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" strokeWidth="1.1" />
            <line x1="3.5" y1="14.5" x2="20.5" y2="14.5" strokeWidth="1.1" />
          </>
        ) : item.type === 'tree' || item.type === 'hedge' || item.type === 'garden-bed' ? (
          <>
            <circle cx="12" cy="12" r="7.5" fill={softFill} />
            <circle cx="10" cy="10.5" r="3" strokeWidth="1.1" />
            <circle cx="14" cy="13.5" r="2.6" strokeWidth="1.1" />
          </>
        ) : item.type === 'sectional-sofa' || item.type === 'exec-desk' ? (
          <path d="M4 5 H20 V19 H13 V11.5 H4 Z" fill={softFill} />
        ) : item.type === 'round-table' || item.type === 'cafe-table' ? (
          <>
            <circle cx="12" cy="12" r="6" fill={softFill} />
            <circle cx="12" cy="3.8" r="1.2" />
            <circle cx="12" cy="20.2" r="1.2" />
          </>
        ) : item.type === 'desk' || item.type === 'cubicle' || item.type === 'reception-desk' || item.type === 'workbench' || item.type === 'pos-counter' ? (
          <>
            <rect x="3" y="6" width="18" height="10" rx="1.5" fill={softFill} />
            <rect x="8.5" y="8" width="7" height="3.5" rx="0.8" />
            <circle cx="12" cy="19" r="2" />
          </>
        ) : item.type === 'chair' || item.type === 'armchair' || item.type === 'lounger' ? (
          <>
            <rect x="6" y="7" width="12" height="11" rx="3" fill={softFill} />
            <path d="M7 6 C7 4.5 17 4.5 17 6" strokeWidth="2.2" />
          </>
        ) : item.type === 'conference-table' ? (
          <>
            <rect x="5" y="7" width="14" height="10" rx="4" fill={softFill} />
            <line x1="8" y1="4.5" x2="10.5" y2="4.5" strokeWidth="2" />
            <line x1="13.5" y1="4.5" x2="16" y2="4.5" strokeWidth="2" />
            <line x1="8" y1="19.5" x2="10.5" y2="19.5" strokeWidth="2" />
            <line x1="13.5" y1="19.5" x2="16" y2="19.5" strokeWidth="2" />
          </>
        ) : item.type === 'cabinet' || item.type === 'wardrobe' || item.type === 'bookshelf' || item.type === 'tool-chest' || item.type === 'garage-rack' || item.type === 'retail-shelf' || item.type === 'server-rack' ? (
          <>
            <rect x="4" y="6" width="16" height="12" rx="1.5" fill={softFill} />
            <line x1="12" y1="6" x2="12" y2="18" />
            <circle cx="9.5" cy="12" r="0.8" fill={stroke} />
            <circle cx="14.5" cy="12" r="0.8" fill={stroke} />
          </>
        ) : item.type === 'sofa' ? (
          <>
            <rect x="3" y="8" width="18" height="9" rx="2.5" fill={softFill} />
            <line x1="9" y1="8" x2="9" y2="17" strokeWidth="1.2" />
            <line x1="15" y1="8" x2="15" y2="17" strokeWidth="1.2" />
            <path d="M4 8 V6.5 C4 5.5 20 5.5 20 6.5 V8" />
          </>
        ) : item.type === 'bed' || item.type === 'king-bed' || item.type === 'twin-bed' ? (
          <>
            <rect x="5" y="4" width="14" height="16" rx="2" fill={softFill} />
            <rect x="7" y="6" width="4" height="3" rx="1" />
            <rect x="13" y="6" width="4" height="3" rx="1" />
            <line x1="5" y1="11.5" x2="19" y2="11.5" />
          </>
        ) : item.type === 'dining-table' || item.type === 'coffee-table' || item.type === 'kitchen-island' ? (
          <>
            <rect x="6" y="7" width="12" height="10" rx="1.5" fill={softFill} />
            <circle cx="12" cy="4.2" r="1.3" />
            <circle cx="12" cy="19.8" r="1.3" />
            <circle cx="3.2" cy="12" r="1.3" />
            <circle cx="20.8" cy="12" r="1.3" />
          </>
        ) : item.type === 'kitchen-counter' ? (
          <>
            <rect x="3" y="6" width="18" height="12" rx="1.5" fill={softFill} />
            <rect x="5.5" y="8.5" width="5.5" height="7" rx="1" />
            <circle cx="16.5" cy="10" r="1.4" />
            <circle cx="16.5" cy="14" r="1.4" />
          </>
        ) : item.type === 'plant' ? (
          <>
            <circle cx="12" cy="12" r="7" fill={softFill} />
            <path d="M12 7 V17 M7 12 H17 M8.8 8.8 L15.2 15.2 M15.2 8.8 L8.8 15.2" strokeWidth="1.3" />
          </>
        ) : (
          <>
            <rect x="4" y="6" width="16" height="12" rx="2" fill={softFill} />
            <line x1="7.5" y1="12" x2="16.5" y2="12" strokeWidth="1.4" />
          </>
        )}
      </svg>
    );
  }

  // 3. Unified SVG Icon for Architecture, Network, Flowchart, ERD, Org Chart, Journey, Whiteboard
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <DiagramObjectIconPaths
        type={item.type}
        stroke={stroke}
        fill={softFill}
        dashed={item.dashed}
        strokeWidth={1.7}
      />
    </svg>
  );
};
