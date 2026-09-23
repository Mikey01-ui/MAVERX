/** Map chat sender → bm-group accent class (shared mission-channel.css). */
export function chatFromClass(sender: string): string {
  const key = sender.trim().toLowerCase();
  if (key === "voss" || key === "echo") return "from-voss";
  if (key === "zex") return "from-zex";
  if (key === "nova") return "from-nova";
  if (key === "atlas") return "from-atlas";
  if (key === "kade") return "from-kade";
  if (key === "system" || key === "sys") return "from-system";
  return "from-voss";
}
