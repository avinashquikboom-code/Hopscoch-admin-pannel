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
  actions,
  children,
  onRefresh,
  showClock = false,
}: PageHeaderProps) {
  const displayTitle1 = titlePart1 || title || '';
  const displaySubtitle = subtitle || description || '';
  const displayActions = actions || children;
  const [time, setTime] = useState('--:--:--');
  const [greeting, setGreeting] = useState(titlePart1 || '');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (titlePart1) {
      setGreeting(titlePart1);
      return;
    }

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
  }, [titlePart1, showClock]);

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

  const finalTitlePart2 = titlePart2 || (!titlePart1 ? 'Administrator' : '');

  return (
    <div className="w-full bg-card/60 backdrop-blur-md border border-border/30 rounded-xl p-6 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-[#14b8a6]/5 blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* Left Column: Badge, Title & Subtitle */}
      <div className="flex-1 space-y-3 z-10">
        {/* Command Center Badge */}
        <div className="inline-flex items-center gap-2 bg-[#14b8a6]/10 border border-[#14b8a6]/20 px-3.5 py-1 rounded-full text-foreground/80 font-bold uppercase tracking-wider text-[10px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14b8a6] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14b8a6]"></span>
          </span>
          {badgeText}
        </div>

        {/* Dynamic Title / Custom Module Title */}
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
          {greeting}
          {finalTitlePart2 && (
            <>
              {titlePart1 ? ' ' : ', '}<span className="text-[#14b8a6]">{finalTitlePart2}</span>
            </>
          )}
        </h1>

        {/* Subtitle description */}
        {displaySubtitle && (
          <p className="text-muted-foreground text-sm font-light leading-relaxed max-w-3xl">
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
          <div className="flex items-center bg-card border border-border/40 shadow-sm rounded-xl py-2 px-4 gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Clock className="h-3 w-3 text-[#14b8a6]" />
                System Clock
              </span>
              <span className="text-2xl font-black font-mono tracking-wider text-foreground select-none">
                {time}
              </span>
            </div>
            <button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/20 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#14b8a6]/30 disabled:opacity-50"
              title="Refresh dashboard data"
            >
              <RotateCw className={`h-4.5 w-4.5 ${isRefreshing ? 'animate-spin text-[#14b8a6]' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
