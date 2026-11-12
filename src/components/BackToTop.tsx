import { useEffect, useState } from 'react';
import { Icon } from './Icon';

/** Appears once the visitor has scrolled past the hero. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      className="back-to-top"
      data-visible={visible ? 'true' : 'false'}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <Icon name="ArrowUp" size={15} />
      <span className="sr-only">Back to top</span>
    </button>
  );
}
