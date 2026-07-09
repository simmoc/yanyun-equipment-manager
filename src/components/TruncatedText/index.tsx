'use client';

import { useEffect, useRef, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type TruncatedTextProps = {
  children: string;
  className?: string;
  contentClassName?: string;
};

export function TruncatedText({ children, className = '', contentClassName }: TruncatedTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const checkTruncation = () => {
      setIsTruncated(
        element.scrollWidth > element.clientWidth ||
        element.scrollHeight > element.clientHeight
      );
    };

    checkTruncation();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', checkTruncation);
      return () => window.removeEventListener('resize', checkTruncation);
    }

    const observer = new ResizeObserver(checkTruncation);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children]);

  const text = (
    <span ref={textRef} className={`block min-w-0 truncate ${className}`}>
      {children}
    </span>
  );

  if (!isTruncated) return text;

  return (
    <TooltipProvider delayDuration={180}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="block w-full min-w-0 max-w-full cursor-help text-left"
            onClick={() => setOpen((current) => !current)}
            onBlur={() => setOpen(false)}
          >
            {text}
          </button>
        </TooltipTrigger>
        <TooltipContent className={contentClassName ?? 'max-w-[260px] break-words text-xs leading-relaxed'}>
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
