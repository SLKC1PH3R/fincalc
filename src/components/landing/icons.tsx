'use client';

import * as React from 'react';

export type IconProps = {
  size?: number;
  stroke?: number;
  style?: React.CSSProperties;
  fill?: string;
};

type IconBaseProps = IconProps & { d: string | React.ReactNode };

export function Icon({ d, size = 18, stroke = 1.6, style, fill = 'none' }: IconBaseProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {typeof d === 'string' ? <path d={d} /> : d}
    </svg>
  );
}

export const I = {
  arrow: (p: IconProps) => <Icon {...p} d="M5 12h14M13 5l7 7-7 7" />,
  check: (p: IconProps) => <Icon {...p} d="M4 12l5 5L20 6" />,
  shield: (p: IconProps) => <Icon {...p} d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />,
  lock: (p: IconProps) => <Icon {...p} d={<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></>} />,
  chart: (p: IconProps) => <Icon {...p} d="M3 3v18h18M7 14l4-4 4 4 5-6" />,
  wallet: (p: IconProps) => <Icon {...p} d={<><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M16 13h2M3 10h18"/></>} />,
  globe: (p: IconProps) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/></>} />,
  sparkle: (p: IconProps) => <Icon {...p} d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />,
  pie: (p: IconProps) => <Icon {...p} d={<><path d="M12 3a9 9 0 109 9h-9V3z"/><path d="M14 3a9 9 0 017 7h-7V3z"/></>} />,
  cpu: (p: IconProps) => <Icon {...p} d={<><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></>} />,
  bank: (p: IconProps) => <Icon {...p} d={<><path d="M3 10l9-6 9 6M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18"/></>} />,
  home: (p: IconProps) => <Icon {...p} d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z" />,
  coin: (p: IconProps) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.8-.8-2-1.5-3-1.5s-3 .5-3 2 2 1.8 3 2 3 .5 3 2-2 2-3 2-2.2-.7-3-1.5M12 6v2M12 16v2"/></>} />,
  book: (p: IconProps) => <Icon {...p} d="M4 4h10a4 4 0 014 4v12H8a4 4 0 01-4-4V4zM4 4v14" />,
  dollar: (p: IconProps) => <Icon {...p} d="M12 2v20M17 6H9a3 3 0 000 6h6a3 3 0 010 6H7" />,
  plus: (p: IconProps) => <Icon {...p} d="M12 5v14M5 12h14" />,
  minus: (p: IconProps) => <Icon {...p} d="M5 12h14" />,
  chevron: (p: IconProps) => <Icon {...p} d="M6 9l6 6 6-6" />,
  star: (p: IconProps) => <Icon {...p} d="M12 2l2.9 6.9L22 10l-5.5 4.8L18 22l-6-3.5L6 22l1.5-7.2L2 10l7.1-1.1L12 2z" />,
  quote: (p: IconProps) => <Icon {...p} d="M7 7h3v6H6V10a3 3 0 011-3zm8 0h3v6h-4V10a3 3 0 011-3z" />,
  x: (p: IconProps) => <Icon {...p} d="M6 6l12 12M6 18L18 6" />,
  bolt: (p: IconProps) => <Icon {...p} d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  eye: (p: IconProps) => <Icon {...p} d={<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>} />,
  tree: (p: IconProps) => <Icon {...p} d="M12 3l6 7h-3l5 7H4l5-7H6l6-7zM12 17v4" />,
};

export type IconKey = keyof typeof I;
export type IconComponent = (p: IconProps) => React.ReactElement;
