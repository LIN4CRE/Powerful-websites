import { Icon } from './Icon';
import { usePwaState } from '../hooks/usePwaState';

/** Announces a waiting service worker; the visitor decides when to reload. */
export function UpdateToast() {
  const { needRefresh, applyUpdate } = usePwaState();
  if (!needRefresh) return null;

  return (
    <div className="update-toast" role="status" aria-live="polite">
      <Icon name="Sparkles" size={14} className="text-[var(--accent)]" />
      <span className="text-[0.78rem] text-[var(--text-soft)]">A new version is available.</span>
      <button type="button" className="btn btn--primary btn--sm" onClick={applyUpdate}>
        Refresh
      </button>
    </div>
  );
}
