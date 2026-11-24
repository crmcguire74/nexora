import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Pencil, X } from 'lucide-react';
import { NexoraBrandLogo, NexoraModuleIcon } from '../icons/ShapeIcons';
import splashHeroImg from '../../assets/images/nexora_splash_hero_1795496259215.jpg';

interface SplashScreenProps {
  open: boolean;
  developerName: string;
  hideOnNextStartup: boolean;
  onToggleHideOnNextStartup: (hide: boolean) => void;
  onUpdateDeveloperName: (name: string) => void;
  onClose: () => void;
}

const MODULES = [
  {
    id: 'flow' as const,
    name: 'Flow',
    summary: 'Flowcharts, org charts, and user journeys',
  },
  {
    id: 'space' as const,
    name: 'Space',
    summary: 'Architectural floorplans in US & Metric units',
  },
  {
    id: 'sequence' as const,
    name: 'Sequence',
    summary: 'Call flows, lifelines, and protocol timing',
  },
  {
    id: 'architect' as const,
    name: 'Architect',
    summary: 'System topologies, cloud networks, and ERDs',
  },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({
  open,
  developerName,
  hideOnNextStartup,
  onToggleHideOnNextStartup,
  onUpdateDeveloperName,
  onClose,
}) => {
  const [imgError, setImgError] = useState(false);
  const [editingDev, setEditingDev] = useState(false);
  const [devDraft, setDevDraft] = useState(developerName);

  useEffect(() => {
    setDevDraft(developerName);
  }, [developerName]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (editingDev) return;
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, editingDev, onClose]);

  if (!open) return null;

  const commitDeveloperName = () => {
    const trimmed = devDraft.trim();
    if (trimmed) {
      onUpdateDeveloperName(trimmed);
    } else {
      setDevDraft(developerName);
    }
    setEditingDev(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Nexora"
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl bg-[#0A0F18] border border-slate-800/90 shadow-[0_32px_90px_-16px_rgba(0,0,0,0.85)] overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch nx-menu-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-right Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-lg bg-[#0D1422]/85 hover:bg-[#141F32] border border-slate-700/70 text-slate-300 hover:text-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          aria-label="Close splash screen"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Column: Brand Identity, Disciplines, Developer Attribution, Controls */}
        <div className="md:col-span-5 p-7 sm:p-8 flex flex-col justify-between gap-7 border-b md:border-b-0 md:border-r border-slate-800/80 bg-[#0A0F18]">
          {/* Brand Lockup */}
          <div className="space-y-6">
            <div className="flex items-center gap-3.5">
              <NexoraBrandLogo className="w-11 h-11 shrink-0" />
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-bold tracking-tight text-white leading-none">
                  nexora
                </h1>
                <p className="text-xs text-slate-400 mt-1.5 tracking-wide">
                  The Visual Workspace
                </p>
              </div>
            </div>

            <p className="text-[13px] text-slate-300 leading-relaxed">
              Precision vector canvas for engineering architectures, interactive sequence diagrams, process flows, and scaled floorplans.
            </p>

            {/* 4 Disciplines Editorial List */}
            <div className="divide-y divide-slate-800/80 border-y border-slate-800/80">
              {MODULES.map((mod) => (
                <div
                  key={mod.id}
                  className="py-2.5 flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-md bg-[#111927] border border-slate-800 flex items-center justify-center text-teal-400 shrink-0">
                    <NexoraModuleIcon module={mod.id} className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-100 leading-tight">
                      {mod.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {mod.summary}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Primary Action, Startup Checkbox, and Developer Copyright */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold tracking-wide transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F18]"
            >
              <span>Enter Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideOnNextStartup}
                onChange={(e) => onToggleHideOnNextStartup(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-[#0D1422] accent-teal-500 text-teal-500 focus:ring-teal-500 focus:ring-offset-[#0A0F18] cursor-pointer"
              />
              <span>Don&apos;t show this splash screen on next login</span>
            </label>

            {/* Developer Credit & Copyright 2026 */}
            <div className="pt-3.5 border-t border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                {editingDev ? (
                  <form
                    className="flex items-center gap-1.5 flex-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      commitDeveloperName();
                    }}
                  >
                    <input
                      type="text"
                      autoFocus
                      value={devDraft}
                      onChange={(e) => setDevDraft(e.target.value)}
                      onBlur={commitDeveloperName}
                      placeholder="Your name"
                      aria-label="Developer name"
                      className="flex-1 min-w-0 px-2 py-1 rounded bg-[#111927] border border-teal-500/70 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="p-1 rounded bg-teal-600 text-white hover:bg-teal-500"
                      aria-label="Save developer name"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="truncate">
                      Developed by{' '}
                      <span className="text-slate-200 font-medium">{developerName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingDev(true)}
                      className="p-1 rounded text-slate-500 hover:text-teal-400 hover:bg-slate-800/70 transition-colors shrink-0"
                      title="Edit developer name"
                      aria-label="Edit developer name"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
              <div className="text-[11px] text-slate-500 tabular-nums">
                &copy; 2026 {developerName} · Nexora Visual Workspace
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bespoke Architectural & Systems Isometric Showcase */}
        <div
          className="md:col-span-7 relative bg-[#0D131A] min-h-[260px] md:min-h-[500px] flex flex-col justify-end overflow-hidden cursor-pointer group"
          onClick={onClose}
          title="Click to enter Nexora"
        >
          {!imgError ? (
            <img
              src={splashHeroImg}
              alt="Nexora layered isometric architectural floorplan, system topology, and process flow blueprint"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0B1421] via-[#0E1E2B] to-[#081018] flex items-center justify-center p-10">
              <div className="text-center space-y-3">
                <NexoraBrandLogo className="w-16 h-16 mx-auto opacity-90" />
                <div className="text-xs font-medium text-teal-300/80">
                  Flow · Space · Sequence · Architect
                </div>
              </div>
            </div>
          )}

          {/* Subtle bottom contrast scrim for quiet editorial caption */}
          <div className="relative z-10 bg-gradient-to-t from-[#070B12]/95 via-[#070B12]/55 to-transparent px-6 pt-16 pb-5 flex items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-200 tracking-wide">
                Unified Multi-Discipline Canvas
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Flow</span>
                <span aria-hidden="true">·</span>
                <span>Space</span>
                <span aria-hidden="true">·</span>
                <span>Sequence</span>
                <span aria-hidden="true">·</span>
                <span>Architect</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 group-hover:text-teal-300 transition-colors whitespace-nowrap shrink-0">
              Click anywhere to launch
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
