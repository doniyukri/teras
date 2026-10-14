import { useEffect, useState } from 'react';
import './ShareBar.css';

export default function ShareBar({ getUrl, message }) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!note) return undefined;
    const timer = setTimeout(() => setNote(''), 2200);
    return () => clearTimeout(timer);
  }, [note]);

  async function act(kind) {
    try {
      const url = await getUrl();
      const text = message(url);
      if (kind === 'copy') {
        await navigator.clipboard.writeText(url);
        setNote('Link copied.');
        return;
      }
      if (kind === 'device' && navigator.share) {
        await navigator.share({ text, url });
        return;
      }
      const href = kind === 'whatsapp'
        ? `https://wa.me/?text=${encodeURIComponent(text)}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(href, '_blank', 'noopener,noreferrer');
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      setNote('Could not share from this browser.');
    }
  }

  return (
    <div className="share-bar">
      <button type="button" onClick={() => act('copy')}>Copy link</button>
      <button type="button" onClick={() => act('whatsapp')}>WhatsApp</button>
      <button type="button" onClick={() => act('x')}>X</button>
      {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
        <button type="button" onClick={() => act('device')}>Share</button>
      ) : null}
      {note ? <p className="share-note">{note}</p> : null}
    </div>
  );
}
