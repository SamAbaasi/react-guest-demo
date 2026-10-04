// A plain React 19 component with real internal state:
// open/closed, fetched items, a search query and a click counter.
// If its root is torn down, all of that is lost, and you can see it.
import { useEffect, useRef, useState } from 'react';
import { stats, log } from '../bridge/instrument.js';
import { fetchFruits } from './fakeApi.js';

let pickerSeq = 0;

export function AsyncPicker({ label, value, filter = '', onChange, disabled }) {
  const [id] = useState(() => ++pickerSeq);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [opens, setOpens] = useState(0);
  const boxRef = useRef(null);

  // Mount / unmount are what the bridge must get right.
  useEffect(() => {
    stats.pickersMounted++;
    log('react', `Picker #${id} mounted`);

    // Same shape as real dropdowns: a global listener for "click outside".
    // It is removed only when React unmounts this component.
    // (Clicks on the demo's own buttons are ignored, so pressing them does not close it.)
    const onDocumentClick = (event) => {
      if (event.target.closest?.('[data-demo-control]')) return;
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('click', onDocumentClick);
    stats.documentListeners++;

    return () => {
      document.removeEventListener('click', onDocumentClick);
      stats.documentListeners--;
      stats.pickersUnmounted++;
      log('react', `Picker #${id} unmounted`);
    };
  }, [id]);

  // "Async pagination": load when opened, and again when the filter prop changes.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetchFruits({ filter: filter + query }).then((result) => {
      if (!cancelled) {
        setItems(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [open, filter, query]);

  return (
    <div className="picker" ref={boxRef} data-picker-id={id}>
      <button
        type="button"
        className="picker-trigger"
        disabled={disabled}
        onClick={() => { setOpen((o) => !o); setOpens((n) => n + 1); }}
      >
        <span className="picker-value">{value || 'Choose…'}</span>
        <span className="picker-meta">React #{id} · opened {opens}×</span>
      </button>
      {open && (
        <div className="picker-panel">
          <input
            className="picker-search"
            placeholder={`Search ${label}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="picker-status">
            {loading ? 'Loading…' : `${items.length} items loaded${filter ? ` · filter "${filter}"` : ''}`}
          </div>
          <ul className="picker-list">
            {items.slice(0, 6).map((item) => (
              <li key={item}>
                <button type="button" onClick={() => { onChange(item); setOpen(false); }}>
                  {item === value ? '✓ ' : ''}{item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
