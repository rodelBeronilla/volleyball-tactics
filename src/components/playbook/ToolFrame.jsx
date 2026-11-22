import { useEffect, useRef } from 'react';

import { TOOLS } from './tools';

/** Same-origin iframe running one of the static tools in public/tools/ (see ./tools.js). */
export default function ToolFrame({ tool, tab, onTabChange }) {
  const frameRef = useRef(null);
  // The tool announces its default tab while booting; ignore that until the
  // frame has loaded and been pointed at the routed tab.
  const ready = useRef(false);
  const config = TOOLS[tool];

  const api = () => frameRef.current?.contentWindow?.[config.api];

  // Route → tool
  const sync = () => {
    const a = api();
    if (a && config.currentTab(a.state) !== tab) a.showTab(tab);
  };
  useEffect(sync);

  // Tool → route (e.g. "Play in 3D" inside Setter Signals switches its tab)
  useEffect(() => {
    const onMessage = e => {
      if (!ready.current || e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.tool === tool && e.data.tab && config.tabs.some(t => t.id === e.data.tab)) onTabChange(e.data.tab);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [tool, config, onTabChange]);

  return (
    <iframe
      ref={frameRef}
      key={tool}
      src={`${import.meta.env.BASE_URL}tools/${tool}/index.html`}
      title={config.title}
      onLoad={() => { sync(); ready.current = true; }}
      className="flex-1 w-full min-h-0 border-0 bg-[var(--color-surface)]"
    />
  );
}
