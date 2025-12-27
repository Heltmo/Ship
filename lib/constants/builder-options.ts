/**
 * Builder Profile Options
 * Constants for all dropdown and checkbox options in builder onboarding
 */

// ============================================================================
// TIMEZONES
// ============================================================================

export const TIMEZONES = [
  // Americas
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Toronto", label: "Toronto (ET)" },
  { value: "America/Vancouver", label: "Vancouver (PT)" },
  { value: "America/Mexico_City", label: "Mexico City (CT)" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (ART)" },

  // Europe
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
  { value: "Europe/Madrid", label: "Madrid (CET/CEST)" },
  { value: "Europe/Rome", label: "Rome (CET/CEST)" },
  { value: "Europe/Stockholm", label: "Stockholm (CET/CEST)" },
  { value: "Europe/Warsaw", label: "Warsaw (CET/CEST)" },
  { value: "Europe/Athens", label: "Athens (EET/EEST)" },
  { value: "Europe/Moscow", label: "Moscow (MSK)" },

  // Asia
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Seoul", label: "Seoul (KST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },

  // Oceania
  { value: "Australia/Sydney", label: "Sydney (AEDT/AEST)" },
  { value: "Australia/Melbourne", label: "Melbourne (AEDT/AEST)" },
  { value: "Australia/Perth", label: "Perth (AWST)" },
  { value: "Pacific/Auckland", label: "Auckland (NZDT/NZST)" },

  // Africa
  { value: "Africa/Cairo", label: "Cairo (EET)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
  { value: "Africa/Lagos", label: "Lagos (WAT)" },
] as const;

// ============================================================================
// WORK MODES - "I work best like this"
// ============================================================================

export const WORK_MODES = [
  {
    id: "solo_deep_work",
    label: "Solo deep work",
    description: "Focus time alone, minimal interruptions",
  },
  {
    id: "pair_programming",
    label: "Pair programming",
    description: "Real-time collaboration, coding together",
  },
  {
    id: "async_communication",
    label: "Async communication",
    description: "Write-ups, docs, respond on your own time",
  },
  {
    id: "real_time_collaboration",
    label: "Real-time collaboration",
    description: "Video calls, screen shares, live discussions",
  },
] as const;

// ============================================================================
// ITERATION STYLES - Vibe Coder vs Regular Coder
// ============================================================================

export const ITERATION_STYLES = [
  {
    id: "vibe_coder",
    label: "🚀 Vibe coder",
    description: "Fast & messy - ship quick, refine later",
  },
  {
    id: "regular_coder",
    label: "🎯 Regular coder",
    description: "Slow & polished - get it right the first time",
  },
] as const;

// ============================================================================
// STACK FOCUS
// ============================================================================

export const STACK_OPTIONS = [
  {
    id: "web",
    label: "Web",
    description: "Websites, web apps, frontend/backend",
  },
  {
    id: "mobile",
    label: "Mobile",
    description: "iOS, Android, React Native, Flutter",
  },
  {
    id: "ai",
    label: "AI/ML",
    description: "Machine learning, LLMs, AI agents",
  },
  {
    id: "game",
    label: "Game Dev",
    description: "Unity, Unreal, game engines",
  },
  {
    id: "backend",
    label: "Backend/Infrastructure",
    description: "APIs, databases, cloud, DevOps",
  },
  {
    id: "tooling",
    label: "Dev Tools/Tooling",
    description: "CLIs, dev tools, frameworks, libraries",
  },
] as const;

// ============================================================================
// PRIMARY TOOLS
// ============================================================================

export const PRIMARY_TOOLS = [
  { id: "cursor", label: "Cursor" },
  { id: "vscode", label: "VS Code" },
  { id: "replit", label: "Replit" },
  { id: "claude", label: "Claude" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "windsurf", label: "Windsurf" },
  { id: "vim", label: "Vim/Neovim" },
  { id: "other", label: "Other" },
] as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TimezoneOption = typeof TIMEZONES[number];
export type WorkModeOption = typeof WORK_MODES[number];
export type IterationStyleOption = typeof ITERATION_STYLES[number];
export type StackOption = typeof STACK_OPTIONS[number];
export type ToolOption = typeof PRIMARY_TOOLS[number];
