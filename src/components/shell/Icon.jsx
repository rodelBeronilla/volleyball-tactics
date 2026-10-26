// Line icons in the same style as the Setter Signals / Serve Receive tools
const PATHS = {
  home: <><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-5h4v5" /></>,
  court: <><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M4 12h16" /><path d="M4 8.5h16" strokeDasharray="2 2" /></>,
  whistle: <><circle cx="9" cy="14" r="5" /><path d="M13 11l7-4v4l-6.2 2.2" /><path d="M7 6l-1.5-2.5M10.5 5.5L11 3" /></>,
  chart: <><path d="M4 20h16" /><path d="M7 16v-5M12 16V7M17 16v-8" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><circle cx="17" cy="9" r="2.5" /><path d="M15 20a5 5 0 0 1 6-4.6" /></>,
  github: <path d="M9 19c-4 1.5-4-2-6-2.5m12 5v-3.3a2.9 2.9 0 0 0-.8-2.2c2.7-.3 5.5-1.3 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.5 2.4 5.5 2.7 5.5 2.7a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.1c0 4.6 2.8 5.7 5.5 6a2.9 2.9 0 0 0-.8 2.2V21" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
};

export default function Icon({ name, className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
