import React from 'react';
import { DiagramType, SequenceParticipantRole } from '../../types/diagram';
import { LibraryItem, NexoraModuleId } from '../../engine/libraries';

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
          <rect x="16" y="34" width="44" height="24" rx="12" className="fill-emerald-50 dark:fill-emerald-950/60 stroke-emerald-600" strokeWidth="1.5" />
          <path d="M60 46 H84" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.5" />
          <polygon points="108,24 132,46 108,68 84,46" className="fill-amber-50 dark:fill-amber-950/60 stroke-amber-600" strokeWidth="1.5" />
          <path d="M132 46 H156 V26 H166" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.5" />
          <path d="M132 46 H156 V66 H166" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.5" />
          <rect x="166" y="15" width="38" height="22" rx="5" className="fill-blue-50 dark:fill-blue-950/60 stroke-blue-600" strokeWidth="1.5" />
          <rect x="166" y="55" width="38" height="22" rx="5" className="fill-slate-50 dark:fill-slate-800 stroke-slate-500" strokeWidth="1.5" />
        </svg>
      );
    case 'architecture':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          <rect x="74" y="10" width="132" height="76" rx="8" className="fill-sky-50/70 dark:fill-sky-950/30 stroke-sky-500/60" strokeWidth="1.25" strokeDasharray="4 3" />
          <rect x="14" y="34" width="42" height="28" rx="5" className="fill-blue-50 dark:fill-blue-950/60 stroke-blue-600" strokeWidth="1.5" />
          <path d="M56 48 H88" className="stroke-blue-600" strokeWidth="1.5" />
          <rect x="88" y="34" width="44" height="28" rx="5" className="fill-white dark:fill-slate-800 stroke-sky-600" strokeWidth="1.5" />
          <path d="M132 48 H152 V28 H160" className="stroke-slate-400" strokeWidth="1.25" />
          <path d="M132 48 H152 V68 H160" className="stroke-slate-400" strokeWidth="1.25" />
          <rect x="160" y="17" width="34" height="22" rx="4" className="fill-white dark:fill-slate-800 stroke-teal-600" strokeWidth="1.5" />
          <rect x="160" y="57" width="34" height="22" rx="4" className="fill-amber-50 dark:fill-amber-950/50 stroke-amber-600" strokeWidth="1.5" />
        </svg>
      );
    case 'sequence':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          {[36, 110, 184].map((cx, i) => (
            <g key={cx}>
              <rect x={cx - 22} y="10" width="44" height="18" rx="4" className={i === 0 ? 'fill-slate-100 dark:fill-slate-800 stroke-slate-500' : i === 1 ? 'fill-blue-50 dark:fill-blue-950/60 stroke-blue-600' : 'fill-teal-50 dark:fill-teal-950/60 stroke-teal-600'} strokeWidth="1.4" />
              <line x1={cx} y1="28" x2={cx} y2="86" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="1.25" strokeDasharray="3 3" />
            </g>
          ))}
          <rect x="106" y="40" width="8" height="36" rx="2" className="fill-blue-500/20 stroke-blue-600" strokeWidth="1" />
          <line x1="36" y1="44" x2="105" y2="44" className="stroke-blue-600" strokeWidth="1.6" />
          <polygon points="105,44 99,41 99,47" className="fill-blue-600" />
          <line x1="114" y1="58" x2="183" y2="58" className="stroke-teal-600" strokeWidth="1.6" />
          <polygon points="183,58 177,55 177,61" className="fill-teal-600" />
          <line x1="183" y1="73" x2="114" y2="73" className="stroke-slate-500" strokeWidth="1.4" strokeDasharray="4 2" />
          <polygon points="114,73 120,70 120,76" className="fill-slate-500" />
        </svg>
      );
    case 'floorplan':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          <rect x="26" y="14" width="168" height="68" className="fill-amber-50/40 dark:fill-slate-800/60 stroke-slate-700 dark:stroke-slate-300" strokeWidth="3" />
          <line x1="120" y1="14" x2="120" y2="82" className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="2" />
          <path d="M120 42 A18 18 0 0 1 138 60" className="stroke-blue-600" strokeWidth="1.25" strokeDasharray="2 2" />
          <line x1="120" y1="42" x2="120" y2="60" className="stroke-white dark:stroke-slate-900" strokeWidth="3" />
          <line x1="120" y1="60" x2="138" y2="60" className="stroke-blue-600" strokeWidth="1.5" />
          <rect x="44" y="28" width="46" height="22" rx="2" className="fill-slate-200 dark:fill-slate-700 stroke-slate-500" strokeWidth="1" />
          <rect x="142" y="26" width="36" height="40" rx="2" className="fill-blue-100 dark:fill-blue-950/60 stroke-blue-500" strokeWidth="1" />
        </svg>
      );
    case 'network':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          <rect x="20" y="34" width="38" height="26" rx="5" className="fill-sky-50 dark:fill-sky-950/60 stroke-sky-600" strokeWidth="1.5" />
          <rect x="86" y="34" width="40" height="26" rx="5" className="fill-red-50 dark:fill-red-950/60 stroke-red-600" strokeWidth="1.5" />
          <rect x="158" y="14" width="40" height="24" rx="5" className="fill-white dark:fill-slate-800 stroke-indigo-600" strokeWidth="1.5" />
          <rect x="158" y="56" width="40" height="24" rx="5" className="fill-white dark:fill-slate-800 stroke-teal-600" strokeWidth="1.5" />
          <line x1="58" y1="47" x2="86" y2="47" className="stroke-slate-500" strokeWidth="1.5" />
          <path d="M126 47 H142 V26 H158" className="stroke-slate-500" strokeWidth="1.5" />
          <path d="M126 47 H142 V68 H158" className="stroke-slate-500" strokeWidth="1.5" />
        </svg>
      );
    case 'erd':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          <rect x="20" y="16" width="66" height="62" rx="5" className="fill-white dark:fill-slate-800 stroke-teal-600" strokeWidth="1.5" />
          <rect x="20" y="16" width="66" height="18" rx="4" className="fill-teal-600/15" />
          <line x1="20" y1="34" x2="86" y2="34" className="stroke-teal-600/40" strokeWidth="1" />
          <line x1="28" y1="46" x2="72" y2="46" className="stroke-slate-400" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="58" x2="62" y2="58" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
          <rect x="134" y="16" width="66" height="62" rx="5" className="fill-white dark:fill-slate-800 stroke-blue-600" strokeWidth="1.5" />
          <rect x="134" y="16" width="66" height="18" rx="4" className="fill-blue-600/15" />
          <line x1="134" y1="34" x2="200" y2="34" className="stroke-blue-600/40" strokeWidth="1" />
          <line x1="142" y1="46" x2="186" y2="46" className="stroke-slate-400" strokeWidth="2" strokeLinecap="round" />
          <line x1="142" y1="58" x2="176" y2="58" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
          <path d="M86 47 H134" className="stroke-slate-500" strokeWidth="1.5" />
          <path d="M126 42 L134 47 L126 52" className="stroke-slate-500" strokeWidth="1.5" />
        </svg>
      );
    case 'orgchart':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          <rect x="82" y="12" width="56" height="22" rx="5" className="fill-slate-800 dark:fill-slate-200" />
          <path d="M110 34 V48 M46 48 H174 M46 48 V60 M110 48 V60 M174 48 V60" className="stroke-slate-400" strokeWidth="1.5" />
          <rect x="22" y="60" width="48" height="22" rx="5" className="fill-blue-50 dark:fill-blue-950/60 stroke-blue-600" strokeWidth="1.4" />
          <rect x="86" y="60" width="48" height="22" rx="5" className="fill-blue-50 dark:fill-blue-950/60 stroke-blue-600" strokeWidth="1.4" />
          <rect x="150" y="60" width="48" height="22" rx="5" className="fill-blue-50 dark:fill-blue-950/60 stroke-blue-600" strokeWidth="1.4" />
        </svg>
      );
    case 'journey':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          {[18, 84, 150].map((x, idx) => (
            <g key={x}>
              <rect x={x} y="14" width="52" height="16" rx="4" className="fill-slate-800 dark:fill-slate-200" />
              <rect x={x} y="42" width="52" height="36" rx="6" className={idx === 2 ? 'fill-emerald-50 dark:fill-emerald-950/50 stroke-emerald-600' : 'fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600'} strokeWidth="1.4" />
            </g>
          ))}
          <path d="M70 60 H84 M136 60 H150" className="stroke-blue-600" strokeWidth="1.5" />
        </svg>
      );
    case 'whiteboard':
      return (
        <svg viewBox="0 0 220 96" className={className} fill="none" aria-hidden="true">
          <rect x="26" y="18" width="48" height="44" rx="3" transform="rotate(-3 50 40)" className="fill-amber-100 dark:fill-amber-900/50 stroke-amber-400" strokeWidth="1.25" />
          <rect x="88" y="26" width="48" height="44" rx="3" transform="rotate(2 112 48)" className="fill-sky-100 dark:fill-sky-900/50 stroke-sky-400" strokeWidth="1.25" />
          <rect x="148" y="18" width="48" height="44" rx="3" transform="rotate(-1 172 40)" className="fill-emerald-100 dark:fill-emerald-900/50 stroke-emerald-400" strokeWidth="1.25" />
          <path d="M74 44 C80 44, 82 48, 88 48" className="stroke-slate-400" strokeWidth="1.4" strokeDasharray="3 2" />
        </svg>
      );
  }
};

/**
 * Pure SVG paths (24x24 coordinate space) representing every Sequence Diagram participant role.
 * Rendered directly inside SVG canvas nodes (preserving crisp vector exports) and UI mini-icons.
 */
export const SequenceRoleIconPaths: React.FC<{
  role: SequenceParticipantRole;
  color: string;
  strokeWidth?: number;
}> = ({ role, color, strokeWidth = 1.85 }) => {
  switch (role) {
    case 'actor':
      // Classic UML Stick Actor
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5.5" r="3" />
          <line x1="12" y1="8.5" x2="12" y2="15.5" />
          <line x1="6.5" y1="11.5" x2="17.5" y2="11.5" />
          <path d="M8 21 L12 15.5 L16 21" />
        </g>
      );
    case 'user':
      // Modern User Persona bust
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7.5" r="3.5" />
          <path d="M5 20 C5 16 8 14 12 14 C16 14 19 16 19 20" />
        </g>
      );
    case 'browser':
    case 'web-ui':
      // Web Browser window with chrome bar
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <circle cx="6.2" cy="6.8" r="0.7" fill={color} stroke="none" />
          <circle cx="8.8" cy="6.8" r="0.7" fill={color} stroke="none" />
          <path d="M9.5 13 L7.5 15 L9.5 17 M14.5 13 L16.5 15 L14.5 17" />
        </g>
      );
    case 'mobile':
      // Smartphone client
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
          <line x1="10.5" y1="5.2" x2="13.5" y2="5.2" />
          <circle cx="12" cy="18.5" r="0.9" fill={color} stroke="none" />
        </g>
      );
    case 'api':
      // API Gateway routing node
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8.5" y="7" width="7" height="10" rx="1.5" />
          <path d="M3 12 H8.5 M15.5 9.5 H21 M15.5 14.5 H21" />
          <path d="M18.8 7.5 L21 9.5 L18.8 11.5 M18.8 12.5 L21 14.5 L18.8 16.5" />
        </g>
      );
    case 'microservice':
      // 3D Service Cube
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5 Z" />
          <path d="M12 12 L20 7.5 M12 12 L4 7.5 M12 12 V21" />
        </g>
      );
    case 'auth':
      // Identity / Security Shield with Lock
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3 L19 6 V11.5 C19 16.2 15.8 19.6 12 21 C8.2 19.6 5 16.2 5 11.5 V6 Z" />
          <circle cx="12" cy="10.5" r="1.5" />
          <path d="M12 12 V15" />
        </g>
      );
    case 'queue':
    case 'event-bus':
      // Message Queue / Streaming Event Bus
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6.5" width="13" height="11" rx="2" />
          <line x1="7.3" y1="6.5" x2="7.3" y2="17.5" />
          <line x1="11.6" y1="6.5" x2="11.6" y2="17.5" />
          <path d="M16 12 H21 M18.5 9.5 L21 12 L18.5 14.5" />
        </g>
      );
    case 'cache':
      // High-speed In-Memory Cache bolt
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13.5,2.8 5.5,13 11.5,13 10.5,21.2 18.5,11 12.5,11" />
        </g>
      );
    case 'database':
      // Relational Database Cylinder
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="6" rx="7.5" ry="2.8" />
          <path d="M4.5 6 V18 C4.5 19.6 7.8 20.8 12 20.8 C16.2 20.8 19.5 19.6 19.5 18 V6" />
          <path d="M4.5 12 C4.5 13.6 7.8 14.8 12 14.8 C16.2 14.8 19.5 13.6 19.5 12" />
        </g>
      );
    case 'cloud':
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 18 H17.5 C19.7 18 21.2 16.4 21.2 14.4 C21.2 12.6 19.9 11.1 18.1 10.9 C17.5 7.7 14.8 5.5 11.6 5.5 C8.2 5.5 5.5 8 5.2 11.2 C3.7 11.7 2.8 13.1 2.8 14.7 C2.8 16.6 4.4 18 7 18 Z" />
        </g>
      );
    case 'external':
    default:
      // External 3rd-party Globe / System
      return (
        <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="13" r="7.5" />
          <ellipse cx="11" cy="13" rx="3.4" ry="7.5" />
          <line x1="3.8" y1="13" x2="18.2" y2="13" />
          <path d="M16 4 H20.5 V8.5 M20.5 4 L15.5 9" />
        </g>
      );
  }
};

export const SequenceRoleMiniIcon: React.FC<{
  role: SequenceParticipantRole;
  color: string;
  className?: string;
}> = ({ role, color, className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <SequenceRoleIconPaths role={role} color={color} />
  </svg>
);

/**
 * Renders a tailored, recognizable miniature vector icon for EVERY library element
 * across all 9 diagram generators (Flowchart, Architecture, Sequence, Floor Plan,
 * Network, ERD, Org Chart, User Journey, Whiteboard).
 */
export const LibraryItemMiniIcon: React.FC<{
  item: Pick<LibraryItem, 'id' | 'type' | 'fill' | 'stroke' | 'textColor' | 'dashed' | 'participantRole' | 'floorItemKind'>;
  className?: string;
}> = ({ item, className = 'w-4 h-4' }) => {
  const stroke = item.stroke === 'transparent' ? '#475569' : item.stroke;
  const fill = item.fill === 'transparent' ? 'none' : item.fill;

  // 1. Sequence diagram participants — exact 1:1 icon match with canvas
  if (item.participantRole) {
    return <SequenceRoleMiniIcon role={item.participantRole} color={stroke} className={className} />;
  }

  // 2. Floor Plan items — architectural plan symbols
  if (item.floorItemKind || item.type.startsWith('fp-')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {item.floorItemKind === 'wall' || item.type === 'fp-wall' ? (
          <>
            <line x1="4" y1="18" x2="20" y2="6" strokeWidth="3.5" />
            <circle cx="4" cy="18" r="2" fill="#FFFFFF" strokeWidth="1.5" />
            <circle cx="20" cy="6" r="2" fill="#FFFFFF" strokeWidth="1.5" />
          </>
        ) : item.floorItemKind === 'room-rect' || item.type === 'fp-room' ? (
          <>
            <rect x="4" y="5" width="16" height="14" rx="1" fill={fill} strokeWidth="2.2" />
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
            <rect x="3" y="9" width="18" height="6" fill={fill} strokeWidth="1.6" />
            <line x1="3" y1="12" x2="21" y2="12" strokeWidth="1.2" />
            <line x1="12" y1="9" x2="12" y2="15" strokeWidth="1.2" />
          </>
        ) : item.type === 'stairs' ? (
          <>
            <rect x="5" y="3.5" width="14" height="17" fill={fill} />
            <line x1="5" y1="8" x2="19" y2="8" />
            <line x1="5" y1="12" x2="19" y2="12" />
            <line x1="5" y1="16" x2="19" y2="16" />
            <path d="M12 18 V6 M9.5 8.5 L12 6 L14.5 8.5" strokeWidth="1.4" />
          </>
        ) : item.type === 'spiral-stairs' ? (
          <>
            <circle cx="12" cy="12" r="8" fill={fill} />
            <path d="M12 4 V20 M4 12 H20 M6.4 6.4 L17.6 17.6 M17.6 6.4 L6.4 17.6" strokeWidth="1.1" />
            <circle cx="12" cy="12" r="2" fill={stroke} />
          </>
        ) : item.type === 'elevator' ? (
          <>
            <rect x="4" y="4" width="16" height="16" rx="1.5" fill={fill} />
            <line x1="4" y1="4" x2="20" y2="20" strokeWidth="1.2" />
            <line x1="20" y1="4" x2="4" y2="20" strokeWidth="1.2" />
          </>
        ) : item.type === 'column' ? (
          <>
            <rect x="6" y="6" width="12" height="12" fill={fill} strokeWidth="2" />
            <line x1="6" y1="6" x2="18" y2="18" stroke="#FFFFFF" strokeWidth="1.2" />
          </>
        ) : item.type === 'fireplace' ? (
          <>
            <rect x="3.5" y="7" width="17" height="11" rx="1.5" fill={fill} />
            <path d="M12 15.5 C10 15.5 9.2 14 10.2 12.2 C10.8 11.2 12 10 12 9.5 C12.5 10.6 14.5 11.8 14.2 13.7 C14 14.8 13.2 15.5 12 15.5 Z" />
          </>
        ) : item.type === 'car-sedan' || item.type === 'car-suv' ? (
          <>
            <rect x="6" y="3" width="12" height="18" rx="3.5" fill={fill} />
            <rect x="8" y="6.5" width="8" height="3.5" rx="1" />
            <rect x="8" y="14" width="8" height="3" rx="1" />
          </>
        ) : item.type === 'ev-charger' || item.type === 'elec-panel' ? (
          <>
            <rect x="5" y="4" width="14" height="16" rx="2" fill={fill} />
            <polygon points="13,7 9,12.5 12,12.5 11,17 15,11.5 12,11.5" fill={stroke} stroke="none" />
          </>
        ) : item.type === 'bathtub' ? (
          <>
            <rect x="3" y="6.5" width="18" height="11" rx="2" fill={fill} />
            <rect x="5.5" y="8.5" width="13" height="7" rx="3.5" />
          </>
        ) : item.type === 'shower' ? (
          <>
            <rect x="4" y="4" width="16" height="16" rx="1.5" fill={fill} />
            <line x1="4" y1="4" x2="20" y2="20" strokeWidth="1.1" />
            <line x1="20" y1="4" x2="4" y2="20" strokeWidth="1.1" />
            <circle cx="12" cy="12" r="2" />
          </>
        ) : item.type === 'toilet' || item.type === 'restroom-stall' ? (
          <>
            <rect x="7" y="4" width="10" height="4.5" rx="1" fill={fill} />
            <ellipse cx="12" cy="14" rx="4.8" ry="5.5" fill={fill} />
          </>
        ) : item.type === 'vanity' ? (
          <>
            <rect x="3.5" y="6.5" width="17" height="11" rx="1.5" fill={fill} />
            <ellipse cx="12" cy="12" rx="4.5" ry="3.2" />
          </>
        ) : item.type === 'stove' || item.type === 'bbq-grill' ? (
          <>
            <rect x="4" y="5" width="16" height="14" rx="1.5" fill={fill} />
            <circle cx="8.5" cy="9.5" r="2" />
            <circle cx="15.5" cy="9.5" r="2" />
            <circle cx="8.5" cy="14.5" r="2" />
            <circle cx="15.5" cy="14.5" r="2" />
          </>
        ) : item.type === 'fridge' || item.type === 'washer-dryer' ? (
          <>
            <rect x="4.5" y="5" width="15" height="14" rx="1.5" fill={fill} />
            <line x1="12" y1="5" x2="12" y2="19" />
            <circle cx="8.5" cy="12" r="1.8" />
            <circle cx="15.5" cy="12" r="1.8" />
          </>
        ) : item.type === 'swimming-pool' || item.type === 'hot-tub' ? (
          <>
            <rect x="3" y="5.5" width="18" height="13" rx="3" fill={fill} />
            <path d="M6.5 10.5 Q9 8.5 11.5 10.5 T17 10.5 M6.5 14.2 Q9 12.2 11.5 14.2 T17 14.2" strokeWidth="1.3" />
          </>
        ) : item.type === 'patio-deck' || item.type === 'pergola' || item.type === 'walkway' || item.type === 'driveway' ? (
          <>
            <rect x="3.5" y="5" width="17" height="14" rx="1.5" fill={fill} />
            <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" strokeWidth="1.1" />
            <line x1="3.5" y1="14.5" x2="20.5" y2="14.5" strokeWidth="1.1" />
          </>
        ) : item.type === 'tree' || item.type === 'hedge' || item.type === 'garden-bed' ? (
          <>
            <circle cx="12" cy="12" r="7.5" fill={fill} />
            <circle cx="10" cy="10.5" r="3" strokeWidth="1.1" />
            <circle cx="14" cy="13.5" r="2.6" strokeWidth="1.1" />
          </>
        ) : item.type === 'sectional-sofa' || item.type === 'exec-desk' ? (
          <>
            <path d="M4 5 H20 V19 H13 V11.5 H4 Z" fill={fill} />
          </>
        ) : item.type === 'round-table' || item.type === 'cafe-table' ? (
          <>
            <circle cx="12" cy="12" r="6" fill={fill} />
            <circle cx="12" cy="3.8" r="1.2" />
            <circle cx="12" cy="20.2" r="1.2" />
          </>
        ) : item.type === 'desk' || item.type === 'cubicle' || item.type === 'reception-desk' || item.type === 'workbench' || item.type === 'pos-counter' ? (
          <>
            <rect x="3" y="6" width="18" height="10" rx="1.5" fill={fill} />
            <rect x="8.5" y="8" width="7" height="3.5" rx="0.8" />
            <circle cx="12" cy="19" r="2" />
          </>
        ) : item.type === 'chair' || item.type === 'armchair' || item.type === 'lounger' ? (
          <>
            <rect x="6" y="7" width="12" height="11" rx="3" fill={fill} />
            <path d="M7 6 C7 4.5 17 4.5 17 6" strokeWidth="2.2" />
          </>
        ) : item.type === 'conference-table' ? (
          <>
            <rect x="5" y="7" width="14" height="10" rx="4" fill={fill} />
            <line x1="8" y1="4.5" x2="10.5" y2="4.5" strokeWidth="2" />
            <line x1="13.5" y1="4.5" x2="16" y2="4.5" strokeWidth="2" />
            <line x1="8" y1="19.5" x2="10.5" y2="19.5" strokeWidth="2" />
            <line x1="13.5" y1="19.5" x2="16" y2="19.5" strokeWidth="2" />
          </>
        ) : item.type === 'cabinet' || item.type === 'wardrobe' || item.type === 'bookshelf' || item.type === 'tool-chest' || item.type === 'garage-rack' || item.type === 'retail-shelf' || item.type === 'server-rack' ? (
          <>
            <rect x="4" y="6" width="16" height="12" rx="1.5" fill={fill} />
            <line x1="12" y1="6" x2="12" y2="18" />
            <circle cx="9.5" cy="12" r="0.8" fill={stroke} />
            <circle cx="14.5" cy="12" r="0.8" fill={stroke} />
          </>
        ) : item.type === 'sofa' ? (
          <>
            <rect x="3" y="8" width="18" height="9" rx="2.5" fill={fill} />
            <line x1="9" y1="8" x2="9" y2="17" strokeWidth="1.2" />
            <line x1="15" y1="8" x2="15" y2="17" strokeWidth="1.2" />
            <path d="M4 8 V6.5 C4 5.5 20 5.5 20 6.5 V8" />
          </>
        ) : item.type === 'bed' || item.type === 'king-bed' || item.type === 'twin-bed' ? (
          <>
            <rect x="5" y="4" width="14" height="16" rx="2" fill={fill} />
            <rect x="7" y="6" width="4" height="3" rx="1" />
            <rect x="13" y="6" width="4" height="3" rx="1" />
            <line x1="5" y1="11.5" x2="19" y2="11.5" />
          </>
        ) : item.type === 'dining-table' || item.type === 'coffee-table' || item.type === 'kitchen-island' ? (
          <>
            <rect x="6" y="7" width="12" height="10" rx="1.5" fill={fill} />
            <circle cx="12" cy="4.2" r="1.3" />
            <circle cx="12" cy="19.8" r="1.3" />
            <circle cx="3.2" cy="12" r="1.3" />
            <circle cx="20.8" cy="12" r="1.3" />
          </>
        ) : item.type === 'kitchen-counter' ? (
          <>
            <rect x="3" y="6" width="18" height="12" rx="1.5" fill={fill} />
            <rect x="5.5" y="8.5" width="5.5" height="7" rx="1" />
            <circle cx="16.5" cy="10" r="1.4" />
            <circle cx="16.5" cy="14" r="1.4" />
          </>
        ) : item.type === 'plant' ? (
          <>
            <circle cx="12" cy="12" r="7" fill={fill} />
            <path d="M12 7 V17 M7 12 H17 M8.8 8.8 L15.2 15.2 M15.2 8.8 L8.8 15.2" strokeWidth="1.3" />
          </>
        ) : (
          <>
            <rect x="4" y="6" width="16" height="12" rx="2" fill={fill} />
            <line x1="7.5" y1="12" x2="16.5" y2="12" strokeWidth="1.4" />
          </>
        )}
      </svg>
    );
  }

  // 3. Architecture, Flowchart, Network, ERD, Org Chart, Journey, Whiteboard
  switch (item.type) {
    // Flowchart
    case 'start':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="3" y="7" width="18" height="10" rx="5" fill={fill} stroke={stroke} strokeWidth="1.8" />
        </svg>
      );
    case 'process':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="2.5" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <line x1="7.5" y1="12" x2="16.5" y2="12" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'decision':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <polygon points="12,3 21,12 12,21 3,12" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'io':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <polygon points="6.5,6 21,6 17.5,18 3,18" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'subprocess':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="2" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <line x1="6.8" y1="6" x2="6.8" y2="18" stroke={stroke} strokeWidth="1.4" />
          <line x1="17.2" y1="6" x2="17.2" y2="18" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
    case 'document':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M4 5.5 H20 V16.5 C16.5 14.5 13.5 19.5 4 17.5 Z" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <line x1="7.5" y1="9.5" x2="16.5" y2="9.5" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
          <line x1="7.5" y1="13" x2="13.5" y2="13" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'database':
    case 'arch-db':
      return <SequenceRoleMiniIcon role="database" color={stroke} className={className} />;
    case 'delay':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M4 6 H13.5 C17.6 6 20.5 8.7 20.5 12 C20.5 15.3 17.6 18 13.5 18 H4 Z" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'swimlane':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" fill={fill} stroke={stroke} strokeWidth="1.7" />
          <line x1="8" y1="5" x2="8" y2="19" stroke={stroke} strokeWidth="1.5" />
          <line x1="3" y1="12" x2="21" y2="12" stroke={stroke} strokeWidth="1.3" strokeDasharray="2 2" />
        </svg>
      );
    case 'container':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" fill={fill} stroke={stroke} strokeWidth="1.7" strokeDasharray={item.dashed ? '3 2' : undefined} />
          <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );
    case 'note':
    case 'sticky':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M5 4 H19 V15 L14.5 19.5 H5 Z" fill={fill} stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M14.5 19.5 V15 H19" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'text':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 6.5 H19 M12 6.5 V18.5 M9 18.5 H15" />
        </svg>
      );

    // Architecture
    case 'arch-user':
      return <SequenceRoleMiniIcon role="user" color={stroke} className={className} />;
    case 'arch-browser':
      return <SequenceRoleMiniIcon role="browser" color={stroke} className={className} />;
    case 'arch-mobile':
      return <SequenceRoleMiniIcon role="mobile" color={stroke} className={className} />;
    case 'arch-cdn':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <ellipse cx="12" cy="12" rx="3.5" ry="8" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      );
    case 'arch-gateway':
      return <SequenceRoleMiniIcon role="api" color={stroke} className={className} />;
    case 'arch-lb':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="6" cy="12" r="2.5" />
          <path d="M8.5 12 H13 L18 7 M13 12 H19 M13 12 L18 17" />
          <circle cx="19" cy="7" r="1.4" fill={stroke} stroke="none" />
          <circle cx="19.5" cy="12" r="1.4" fill={stroke} stroke="none" />
          <circle cx="19" cy="17" r="1.4" fill={stroke} stroke="none" />
        </svg>
      );
    case 'arch-api':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 6 C6 6 6 8 6 10 C6 11.2 4.5 12 4.5 12 C4.5 12 6 12.8 6 14 C6 16 6 18 8 18" />
          <path d="M16 6 C18 6 18 8 18 10 C18 11.2 19.5 12 19.5 12 C19.5 12 18 12.8 18 14 C18 16 18 18 16 18" />
          <circle cx="12" cy="12" r="1.2" fill={stroke} stroke="none" />
        </svg>
      );
    case 'arch-service':
      return <SequenceRoleMiniIcon role="microservice" color={stroke} className={className} />;
    case 'arch-function':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 5 H10.5 L16.5 19 H19 M12.2 11.5 L7.5 19" />
        </svg>
      );
    case 'arch-auth':
      return <SequenceRoleMiniIcon role="auth" color={stroke} className={className} />;
    case 'arch-cache':
      return <SequenceRoleMiniIcon role="cache" color={stroke} className={className} />;
    case 'arch-queue':
      return <SequenceRoleMiniIcon role="queue" color={stroke} className={className} />;
    case 'arch-storage':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 7 L6.5 18.5 C6.7 19.6 9 20.5 12 20.5 C15 20.5 17.3 19.6 17.5 18.5 L19 7" />
          <ellipse cx="12" cy="7" rx="7" ry="2.5" />
        </svg>
      );
    case 'arch-external':
      return <SequenceRoleMiniIcon role="external" color={stroke} className={className} />;
    case 'arch-container':
      return <SequenceRoleMiniIcon role="cloud" color={stroke} className={className} />;
    case 'arch-vpc':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" strokeDasharray="3 2" />
          <rect x="9.5" y="10.5" width="5" height="4.5" rx="1" />
          <path d="M10.5 10.5 V9.2 C10.5 8.2 13.5 8.2 13.5 9.2 V10.5" />
        </svg>
      );
    case 'arch-k8s':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="12,3 19.5,7.5 19.5,16.5 12,21 4.5,16.5 4.5,7.5" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 5.5 V9.5 M12 14.5 V18.5 M6.5 9 L9.8 10.8 M14.2 13.2 L17.5 15 M17.5 9 L14.2 10.8 M9.8 13.2 L6.5 15" />
        </svg>
      );

    // Network
    case 'net-internet':
      return <SequenceRoleMiniIcon role="cloud" color={stroke} className={className} />;
    case 'net-firewall':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="14" rx="2" fill={fill} />
          <line x1="3.5" y1="9.7" x2="20.5" y2="9.7" />
          <line x1="3.5" y1="14.3" x2="20.5" y2="14.3" />
          <line x1="12" y1="5" x2="12" y2="9.7" />
          <line x1="8.5" y1="9.7" x2="8.5" y2="14.3" />
          <line x1="15.5" y1="9.7" x2="15.5" y2="14.3" />
          <line x1="12" y1="14.3" x2="12" y2="19" />
        </svg>
      );
    case 'net-router':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill={fill} />
          <path d="M12 7.5 V16.5 M7.5 12 H16.5 M10 9.5 L12 7.5 L14 9.5 M10 14.5 L12 16.5 L14 14.5" />
        </svg>
      );
    case 'net-switch':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="6.5" width="18" height="11" rx="2" fill={fill} />
          <path d="M7 10 H17 M14.8 8 L17 10 L14.8 12 M17 14 H7 M9.2 12 L7 14 L9.2 16" />
        </svg>
      );
    case 'net-ap':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="17" r="1.6" fill={stroke} stroke="none" />
          <path d="M8.5 13.8 A5 5 0 0 1 15.5 13.8 M5.5 10.8 A9 9 0 0 1 18.5 10.8 M3.2 7.8 A12.5 12.5 0 0 1 20.8 7.8" />
        </svg>
      );
    case 'net-server':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="4.5" width="16" height="6" rx="1.5" fill={fill} />
          <rect x="4" y="13.5" width="16" height="6" rx="1.5" fill={fill} />
          <circle cx="7.5" cy="7.5" r="0.9" fill={stroke} stroke="none" />
          <circle cx="7.5" cy="16.5" r="0.9" fill={stroke} stroke="none" />
          <line x1="11" y1="7.5" x2="16.5" y2="7.5" />
          <line x1="11" y1="16.5" x2="16.5" y2="16.5" />
        </svg>
      );
    case 'net-workstation':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="11" rx="2" fill={fill} />
          <path d="M9 19.5 H15 M12 16 V19.5" />
        </svg>
      );
    case 'net-subnet':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" strokeDasharray="3 2" fill={fill} />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <line x1="10.5" y1="12" x2="13.5" y2="12" />
        </svg>
      );

    // ERD
    case 'erd-entity':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="4.5" width="16" height="15" rx="2" fill={fill} />
          <line x1="4" y1="9.5" x2="20" y2="9.5" />
          <line x1="9.5" y1="9.5" x2="9.5" y2="19.5" />
          <line x1="4" y1="14.5" x2="20" y2="14.5" />
        </svg>
      );

    // Org Chart
    case 'org-exec':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={item.fill === '#1E293B' ? '#F8FAFC' : stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 17 L6 8 L12 12 L18 8 L20 17 Z" />
          <line x1="4" y1="20" x2="20" y2="20" />
        </svg>
      );
    case 'org-manager':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="7" r="2.8" />
          <path d="M7.5 14 C7.5 11.5 9.5 10.5 12 10.5 C14.5 10.5 16.5 11.5 16.5 14" />
          <path d="M5 19.5 H19 M12 14 V19.5" />
        </svg>
      );
    case 'org-member':
      return <SequenceRoleMiniIcon role="user" color={stroke} className={className} />;

    // User Journey
    case 'journey-stage':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={item.fill === '#1E293B' ? '#FFFFFF' : stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 5 V19 M5 6 H17 L14.5 10 L17 14 H5" />
        </svg>
      );
    case 'journey-action':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 4 L18 11 L12 13 L10 19 Z" fill={fill} />
        </svg>
      );
    case 'journey-touchpoint':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="7.5" strokeDasharray="3 2" />
        </svg>
      );
    case 'journey-pain':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4 L20.5 19 H3.5 Z" fill={fill} />
          <line x1="12" y1="10" x2="12" y2="14" />
          <circle cx="12" cy="16.5" r="0.8" fill={stroke} stroke="none" />
        </svg>
      );
    case 'journey-opportunity':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4 C8.7 4 6.5 6.4 6.5 9.3 C6.5 11.4 7.7 13 9.2 14.2 V16.5 H14.8 V14.2 C16.3 13 17.5 11.4 17.5 9.3 C17.5 6.4 15.3 4 12 4 Z" fill={fill} />
          <line x1="9.5" y1="19.5" x2="14.5" y2="19.5" />
        </svg>
      );

    case 'end':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="3" y="7" width="18" height="10" rx="5" fill={fill} stroke={stroke} strokeWidth="2.1" />
          <circle cx="12" cy="12" r="2.2" fill={stroke} />
        </svg>
      );
    case 'manual-op':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <polygon points="3.5,6.5 20.5,6.5 18,17.5 6,17.5" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'approval':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" fill={fill} />
          <path d="M8.5 12.2 L11 14.7 L16 9.5" />
        </svg>
      );
    case 'loop':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 6.5 H8.5 C6 6.5 4.5 8 4.5 10.5 V11.5 M14.5 4 L17 6.5 L14.5 9" />
          <path d="M7 17.5 H15.5 C18 17.5 19.5 16 19.5 13.5 V12.5 M9.5 15 L7 17.5 L9.5 20" />
        </svg>
      );
    case 'merge':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <polygon points="4,6 20,6 12,19" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'connector-circle':
    case 'wb-dot-vote':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="7.5" fill={fill} stroke={stroke} strokeWidth="1.8" />
        </svg>
      );
    case 'error-handler':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="12,3.5 21,19 3,19" fill={fill} />
          <line x1="12" y1="9.5" x2="12" y2="13.5" />
          <circle cx="12" cy="16.2" r="0.8" fill={stroke} stroke="none" />
        </svg>
      );
    case 'multi-doc':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="6" y="4" width="13.5" height="12" rx="1.5" fill={fill} />
          <rect x="4" y="7" width="13.5" height="12" rx="1.5" fill={fill} />
          <line x1="7" y1="11.5" x2="14.5" y2="11.5" />
          <line x1="7" y1="14.8" x2="12" y2="14.8" />
        </svg>
      );
    case 'cloud-sync':
      return <SequenceRoleMiniIcon role="cloud" color={stroke} className={className} />;
    case 'email-notify':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" fill={fill} />
          <path d="M4.5 7 L12 13 L19.5 7" />
        </svg>
      );
    case 'arch-waf':
    case 'net-ids':
      return <SequenceRoleMiniIcon role="auth" color={stroke} className={className} />;
    case 'arch-secrets':
    case 'net-vpn':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="10.5" width="14" height="9.5" rx="2" fill={fill} />
          <path d="M8.5 10.5 V7.5 C8.5 5.3 10 4 12 4 C14 4 15.5 5.3 15.5 7.5 V10.5" />
          <circle cx="12" cy="15" r="1.2" fill={stroke} stroke="none" />
        </svg>
      );
    case 'arch-ml':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" fill={fill} />
          <path d="M12 3.5 V9 M12 15 V20.5 M3.5 12 H9 M15 12 H20.5 M6 6 L9.8 9.8 M14.2 14.2 L18 18 M18 6 L14.2 9.8 M9.8 14.2 L6 18" />
        </svg>
      );
    case 'arch-monitoring':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="14" rx="2" fill={fill} />
          <path d="M6.5 14 L9.5 11 L12 13.5 L15 9.5 L17.5 12" />
        </svg>
      );
    case 'arch-search':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6" fill={fill} />
          <line x1="15" y1="15" x2="20" y2="20" />
        </svg>
      );
    case 'arch-nosql':
    case 'arch-warehouse':
    case 'net-nas':
      return <SequenceRoleMiniIcon role="database" color={stroke} className={className} />;
    case 'arch-worker':
      return <SequenceRoleMiniIcon role="microservice" color={stroke} className={className} />;
    case 'arch-region':
    case 'arch-subnet-pub':
    case 'arch-subnet-priv':
    case 'net-dmz':
    case 'net-datacenter':
    case 'org-squad':
    case 'wb-kanban-col':
    case 'wb-quadrant':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" fill={fill} strokeDasharray={item.dashed ? '3 2' : undefined} />
          <line x1="12" y1="4.5" x2="12" y2="19.5" strokeOpacity="0.45" />
          <line x1="3.5" y1="12" x2="20.5" y2="12" strokeOpacity="0.45" />
        </svg>
      );
    case 'net-lb':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="6" cy="12" r="2.5" />
          <path d="M8.5 12 H13 L18 7 M13 12 H19 M13 12 L18 17" />
        </svg>
      );
    case 'net-dns':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill={fill} />
          <line x1="4" y1="12" x2="20" y2="12" />
          <ellipse cx="12" cy="12" rx="3.5" ry="8" />
        </svg>
      );
    case 'net-camera':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="7" width="12.5" height="10" rx="2" fill={fill} />
          <polygon points="16,10 20.5,7.5 20.5,16.5 16,14" />
        </svg>
      );
    case 'net-printer':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="6.5" y="4" width="11" height="5" />
          <rect x="3.5" y="9" width="17" height="8" rx="1.5" fill={fill} />
          <rect x="7" y="14" width="10" height="6" fill="#FFFFFF" />
        </svg>
      );
    case 'net-phone':
      return <SequenceRoleMiniIcon role="mobile" color={stroke} className={className} />;
    case 'erd-view':
    case 'erd-enum':
    case 'erd-index':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="4.5" width="16" height="15" rx="2" fill={fill} strokeDasharray={item.dashed ? '3 2' : undefined} />
          <line x1="4" y1="9.5" x2="20" y2="9.5" />
          <line x1="7.5" y1="13.5" x2="16.5" y2="13.5" />
          <line x1="7.5" y1="16.5" x2="13.5" y2="16.5" />
        </svg>
      );
    case 'org-board':
    case 'org-vp':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={item.fill === '#0F172A' ? '#5EEAD4' : stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 17 L6 8 L12 12 L18 8 L20 17 Z" />
          <line x1="4" y1="20" x2="20" y2="20" />
        </svg>
      );
    case 'org-assistant':
    case 'org-contractor':
    case 'org-open-role':
    case 'journey-persona':
      return <SequenceRoleMiniIcon role="user" color={stroke} className={className} />;
    case 'journey-channel-web':
      return <SequenceRoleMiniIcon role="browser" color={stroke} className={className} />;
    case 'journey-channel-support':
    case 'wb-callout':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6 C4 5 5 4 6 4 H18 C19 4 20 5 20 6 V14 C20 15 19 16 18 16 H10 L6 20 V16 H6 C5 16 4 15 4 14 Z" fill={fill} />
        </svg>
      );
    case 'journey-emotion-high':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill={fill} />
          <path d="M8.5 14 C9.5 16 14.5 16 15.5 14" />
          <circle cx="9.2" cy="10" r="0.8" fill={stroke} stroke="none" />
          <circle cx="14.8" cy="10" r="0.8" fill={stroke} stroke="none" />
        </svg>
      );
    case 'journey-emotion-low':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill={fill} />
          <path d="M8.5 16 C9.5 14 14.5 14 15.5 16" />
          <circle cx="9.2" cy="10" r="0.8" fill={stroke} stroke="none" />
          <circle cx="14.8" cy="10" r="0.8" fill={stroke} stroke="none" />
        </svg>
      );
    case 'journey-metric':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="4" y1="19" x2="20" y2="19" />
          <rect x="6" y="12" width="3" height="7" fill={fill} />
          <rect x="10.5" y="8" width="3" height="11" fill={fill} />
          <rect x="15" y="5" width="3" height="14" fill={fill} />
        </svg>
      );
    case 'wb-checklist':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" fill={fill} />
          <path d="M7.5 9.5 L9 11 L11.5 8.5 M13.5 9.5 H17 M7.5 14.5 L9 16 L11.5 13.5 M13.5 14.5 H17" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="4" y="6" width="16" height="12" rx="3" fill={fill} stroke={stroke} strokeWidth="1.8" />
        </svg>
      );
  }
};
