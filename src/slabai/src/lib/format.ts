export function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} giờ ${minutes} phút`;
  }
  return `${minutes} phút`;
}

export function providerLabel(provider: string): string {
  const labels: Record<string, string> = {
    garmin: "Garmin",
    strava: "Strava",
    "apple-health": "Apple Health",
    coros: "Coros"
  };
  return labels[provider] ?? provider;
}
