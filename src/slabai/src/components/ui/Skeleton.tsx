export function SkeletonBlock({ height = "var(--slabai-space-16)" }: { height?: string }) {
  return <div aria-hidden="true" className="skeleton" style={{ minHeight: height }} />;
}
