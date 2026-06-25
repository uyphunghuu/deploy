interface RouteMapProps {
  points: Array<{ x: number; y: number }>;
  title: string;
}

export function RouteMap({ points, title }: RouteMapProps) {
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x * 100} ${point.y * 100}`)
    .join(" ");

  return (
    <div className="route-map" role="img" aria-label={title}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d={path} fill="none" stroke="var(--slabai-brand-orange-600)" strokeLinecap="round" strokeWidth="3" />
        {points.map((point, index) => (
          <circle
            cx={point.x * 100}
            cy={point.y * 100}
            fill={index === 0 ? "var(--slabai-brand-blue-600)" : "var(--slabai-brand-orange-600)"}
            key={`${point.x}-${point.y}`}
            r={index === 0 ? 2.8 : 2}
          />
        ))}
      </svg>
    </div>
  );
}
