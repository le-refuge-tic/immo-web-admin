import type { CSSProperties } from 'react';

type Props = {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  onGlass?: boolean;
  style?: CSSProperties;
};

export default function Skeleton({ width = '100%', height = 14, radius = 6, onGlass = false, style }: Props) {
  return (
    <span
      className={onGlass ? 'skeleton-onglass' : 'skeleton'}
      style={{ display: 'inline-block', width, height, borderRadius: radius, ...style }}
    />
  );
}
