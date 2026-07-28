'use client';

import { useEffect, useState } from 'react';
import { Clock, RotateCw } from 'lucide-react';

interface PageHeaderProps {
  badgeText?: string;
  titlePart1?: string;
  titlePart2?: string;
  title?: string;
  description?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  onRefresh?: () => void;
  showClock?: boolean;
}

export function PageHeader({
  badgeText = 'ACTIVE PLATFORM COMMAND CENTER',
  titlePart1,
  titlePart2,
  title,
  description,
  subtitle,
  icon,
  actions,
  children,
  onRefresh,
  showClock = false,
}: PageHeaderProps) {
  const displaySubtitle = subtitle || description || '';
  const displayActions = actions || children;
  const [time, setTime] = useState('--:--:--');
  const [greeting, setGreeting] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hours = now.getHours();
      if (hours < 12) {
        setGreeting('Good Morning');
      } else if (hours < 17) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
    };

    updateGreeting();
    if (!showClock) return;

    const timer = setInterval(updateGreeting, 60000);
    return () => clearInterval(timer);
  }, [showClock]);

  useEffect(() => {
    if (!showClock) return;

    const updateTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setTime(`${hh}:${mm}:${ss}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [showClock]);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Determine Title Part 1 and Part 2 for consistent 2-tone header coloring across admin panel
  let part1 = '';
  let part2 = '';

  if (titlePart1 || titlePart2) {
    part1 = titlePart1 || '';
    part2 = titlePart2 || '';
  } else if (title) {
    const trimmed = title.trim();
    const spaceIndex = trimmed.lastIndexOf(' ');
    if (spaceIndex > 0) {
      part1 = trimmed.slice(0, spaceIndex);
      part2 = trimmed.slice(spaceIndex + 1);
    } else {
      part1 = trimmed;
      part2 = '';
    }
  } else {
    part1 = greeting || 'Welcome';
    part2 = 'Administrator';
  }

  return (
    <div className="w-full bg-card/70 backdrop-blur-xl border border-border/40 rounded-2xl p-6 sm:p-7 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* Left Column: Badge, Title & Subtitle */}
      <div className="flex-1 space-y-3 z-10">
        {/* Command Center Badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full text-foreground/90 font-bold uppercase tracking-wider text-[10px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          {badgeText}
        </div>

        {/* Dynamic Title with Icon & Consistent 2-Tone Color */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight flex items-center flex-wrap gap-3">
          {icon && <span className="text-primary shrink-0">{icon}</span>}
          <span>
            {part1}
            {part2 && (
              <>
                {' '}
                <span className="bg-gradient-to-r from-primary via-teal-500 to-emerald-500 bg-clip-text text-transparent font-extrabold">
                  {part2}
                </span>
              </>
            )}
          </span>
        </h1>

        {/* Subtitle description */}
        {displaySubtitle && (
          <p className="text-muted-foreground text-sm font-normal leading-relaxed max-w-3xl">
            {displaySubtitle}
          </p>
        )}
      </div>

      {/* Right Column: Clock & Optional Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:self-center z-10 shrink-0">
        {/* Page specific action buttons slot */}
        {displayActions && <div className="flex items-center gap-2 w-full sm:w-auto">{displayActions}</div>}

        {/* System Clock Widget */}
        {showClock && (
          <div className="flex items-center bg-card/80 border border-border/40 shadow-sm rounded-xl py-2 px-4 gap-4 w-full sm:w-auto justify-between sm:justify-start backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Clock className="h-3 w-3 text-primary" />
                System Clock
              </span>
              <span className="text-2xl font-black font-mono tracking-wider text-foreground select-none">
                {time}
              </span>
            </div>
            <button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/20 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
              title="Refresh dashboard data"
            >
              <RotateCw className={`h-4.5 w-4.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

