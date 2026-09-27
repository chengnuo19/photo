import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { BookDoc } from '../../data/schema';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { armAudio, noiseBurst, paper, play, tone, type Recipe } from '../../sound/engine';
import type { Theme, WrapSpec } from '../../themes/types';
import s from './Unwrap.module.css';

const DEFAULT_WRAP: WrapSpec = { kind: 'ribbon', paper: '#f6f1e7', pattern: 'stars', ribbon: '#e8453c', ink: '#3d372f' };

/** How long the opening animation runs before the book shows. */
const OPEN_MS = 1500;

/**
 * The gift wrapping in front of a shared book. One tap opens it (and counts as the gesture
 * that lets music and sound start); when the animation ends the book is on the table.
 */
export function Unwrap({ theme, book, sound, onOpen, onDone }: { theme: Theme; book: BookDoc; sound: boolean; onOpen: () => void; onDone: () => void }) {
  const spec = theme.wrap ?? DEFAULT_WRAP;
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  // "给…" / "致…" / "To …" is added by the wrapping itself
  const to = (book.gift?.to?.trim() || book.meta.dedication?.to?.trim() || '').replace(/^(献给|送给|给|致|to[:：]?)\s*/i, '');
  const from = book.gift?.from?.trim() || book.meta.author?.trim() || '';

  useEffect(() => {
    armAudio();
  }, []);

  // the book underneath must not turn while it is still wrapped; → opens the gift instead
  const startRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', ' ', 'Enter'].includes(e.key)) return;
      e.preventDefault();
      if (e.key !== 'ArrowLeft' && e.key !== 'PageUp') startRef.current();
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, []);

  const openRef = useRef(false);
  const start = () => {
    if (openRef.current) return;
    openRef.current = true;
    setOpen(true);
    if (sound) play(theme.sound?.unwrap ?? WRAP_SOUND[spec.kind]);
    onOpen();
    window.setTimeout(onDone, reduced ? 250 : OPEN_MS);
  };
  startRef.current = start;

  return (
    <div className={s.overlay} data-unwrap data-open={open || undefined} data-kind={spec.kind}>
      <button ref={btn} type="button" className={s.gift} onClick={start} aria-label={to ? `拆开给${to}的礼物` : '拆开礼物'}>
        <Wrap spec={spec} to={to} from={from} />
      </button>
      {/* full-screen effects live outside the gift (its drop-shadow filter would clip them) */}
      {spec.kind === 'ball' && <span className={s.flash} />}
      {spec.kind === 'tape' && <span className={s.static} />}
      <p className={s.hint}>{to ? `给 ${to} 的一本书 · 轻点拆开` : '轻点拆开'}</p>
    </div>
  );
}

function Wrap({ spec, to, from }: { spec: WrapSpec; to: string; from: string }) {
  switch (spec.kind) {
    case 'ribbon':
      return <RibbonWrap spec={spec} to={to} from={from} />;
    case 'envelope':
      return <EnvelopeWrap spec={spec} to={to} from={from} />;
    case 'ticket':
      return <TicketWrap spec={spec} to={to} />;
    case 'ball':
      return <BallWrap />;
    case 'tape':
      return <TapeWrap to={to} />;
    case 'canister':
      return <CanisterWrap to={to} />;
  }
}

/* ------------------------------------------------------------------ gift box with ribbon */

function RibbonWrap({ spec, to, from }: { spec: Extract<WrapSpec, { kind: 'ribbon' }>; to: string; from: string }) {
  const band = spec.thin ? 3 : 11;
  const pattern: Record<string, string> = {
    stars: `radial-gradient(circle at 25% 25%, ${spec.ribbon}33 0 3px, transparent 4px), radial-gradient(circle at 75% 75%, #f2c23055 0 3px, transparent 4px)`,
    dots: 'radial-gradient(circle, rgba(255,255,255,0.8) 0 2.5px, transparent 3.5px)',
    wash: 'radial-gradient(40% 30% at 20% 30%, rgba(233,167,192,0.35), transparent), radial-gradient(40% 30% at 80% 70%, rgba(143,195,217,0.35), transparent)',
    none: 'none',
  };
  return (
    <span className={s.box} style={{ ['--paper' as string]: spec.paper, ['--ribbon' as string]: spec.ribbon, ['--ink' as string]: spec.ink, ['--band' as string]: `${band}%` } as CSSProperties}>
      <span className={s.lid} style={{ backgroundImage: pattern[spec.pattern ?? 'none'], backgroundSize: spec.pattern === 'wash' ? '100% 100%' : '44px 44px' }}>
        {spec.stamps && (
          <span className={s.stamps}>
            <i />
            <i />
          </span>
        )}
      </span>
      <span className={s.bandV} />
      <span className={s.bandH} />
      <svg className={s.bow} viewBox="0 0 120 80" aria-hidden>
        {spec.thin ? (
          <g fill="none" stroke={spec.ribbon} strokeWidth="3" strokeLinecap="round">
            <path d="M60 40 C40 20 24 24 30 36 C36 46 52 42 60 40 C68 42 84 46 90 36 C96 24 80 20 60 40 Z" />
            <path d="M60 40 L46 70 M60 40 L76 72" />
          </g>
        ) : (
          <g>
            <path d="M60 40 C36 8 8 14 14 36 C18 52 44 46 60 40 Z" fill={spec.ribbon} />
            <path d="M60 40 C84 8 112 14 106 36 C102 52 76 46 60 40 Z" fill={spec.ribbon} />
            <path d="M60 40 C44 30 26 28 22 36" stroke="#000" strokeOpacity="0.18" strokeWidth="2" fill="none" />
            <path d="M60 40 C76 30 94 28 98 36" stroke="#000" strokeOpacity="0.18" strokeWidth="2" fill="none" />
            <path d="M56 44 L40 78 L48 74 L52 80 Z M64 44 L80 78 L72 74 L68 80 Z" fill={spec.ribbon} />
            <rect x="52" y="32" width="16" height="16" rx="4" fill={spec.ribbon} stroke="#000" strokeOpacity="0.2" />
          </g>
        )}
      </svg>
      <span className={s.tag}>
        <b>{to ? `给 ${to}` : '给你'}</b>
        {from && <em>{from}</em>}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ sealed envelope */

function EnvelopeWrap({ spec, to, from }: { spec: Extract<WrapSpec, { kind: 'envelope' }>; to: string; from: string }) {
  return (
    <span className={s.envelope} style={{ ['--paper' as string]: spec.paper, ['--flap' as string]: spec.flap, ['--seal' as string]: spec.seal, ['--ink' as string]: spec.ink } as CSSProperties}>
      <span className={s.card}>
        <b>{to ? `亲爱的 ${to}` : '亲爱的你'}</b>
        <em>这是一本只写给你的书</em>
      </span>
      <span className={s.pocket} />
      <span className={s.flap} />
      <span className={s.address}>
        {to ? `致 ${to}` : '致 你'}
        {from && <small>{from} 寄</small>}
      </span>
      <span className={s.seal}>
        <i className={s.sealL} />
        <i className={s.sealR} />
        <span>{spec.mark}</span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ admission ticket */

function TicketWrap({ spec, to }: { spec: Extract<WrapSpec, { kind: 'ticket' }>; to: string }) {
  return (
    <span className={s.ticket} style={{ ['--paper' as string]: spec.paper, ['--ink' as string]: spec.ink, ['--accent' as string]: spec.accent } as CSSProperties}>
      <span className={s.ticketMain}>
        <small>ADMIT ONE · 仅限一位</small>
        <b>私人展览</b>
        <em>{to ? `特邀 ${to}` : '特邀嘉宾'}</em>
        <small>PRIVATE VIEW · Nº 0001</small>
      </span>
      <span className={s.stub}>
        <small>副券</small>
        <b>0001</b>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ capture ball */

function BallWrap() {
  return (
    <span className={s.ball}>
      <svg viewBox="0 0 200 200" aria-hidden>
        <defs>
          <radialGradient id="uw-red" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ff6a5a" />
            <stop offset="0.6" stopColor="#e3321f" />
            <stop offset="1" stopColor="#a31d10" />
          </radialGradient>
          <radialGradient id="uw-white" cx="0.35" cy="0.3" r="0.9">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#d6d6d6" />
          </radialGradient>
        </defs>
        <g className={s.ballBottom}>
          <path d="M10 100 A90 90 0 0 0 190 100 Z" fill="url(#uw-white)" stroke="#222" strokeWidth="7" />
        </g>
        <g className={s.ballTop}>
          <path d="M10 100 A90 90 0 0 1 190 100 Z" fill="url(#uw-red)" stroke="#222" strokeWidth="7" />
          <rect x="10" y="92" width="180" height="16" fill="#222" />
          <circle cx="100" cy="100" r="26" fill="#222" />
          <circle cx="100" cy="100" r="16" fill="url(#uw-white)" />
          <circle className={s.ballButton} cx="100" cy="100" r="8" fill="#fff" />
          <ellipse cx="62" cy="48" rx="20" ry="11" fill="#fff" opacity="0.5" transform="rotate(-30 62 48)" />
        </g>
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ VHS tape */

function TapeWrap({ to }: { to: string }) {
  return (
    <span className={s.tapeWrap}>
      <span className={s.slot} />
      <span className={s.tape}>
        <span className={s.tapeLabel}>
          <b>{to ? `给 ${to}` : '给你的录像'}</b>
          <small>SP · 120 · ’84</small>
        </span>
        <span className={s.reels}>
          <i />
          <i />
        </span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ film canister */

function CanisterWrap({ to }: { to: string }) {
  return (
    <span className={s.canister}>
      <span className={s.cap} />
      <span className={s.can}>
        <b>{to ? `给 ${to}` : '冲洗好了'}</b>
        <small>400 · 36 EXP</small>
      </span>
      <span className={s.leader} />
    </span>
  );
}

/* ------------------------------------------------------------------ sounds */

const WRAP_SOUND: Record<WrapSpec['kind'], Recipe> = {
  ribbon: (v) => {
    noiseBurst(v, { f: 3000, f2: 1200, q: 0.8, e: { a: 0.05, d: 0.5, peak: 0.12 } });
    paper('board')({ ...v, t: v.t + 0.35 });
  },
  envelope: (v) => {
    noiseBurst(v, { f: 1600, q: 2, e: { a: 0.001, d: 0.05, peak: 0.16 } });
    noiseBurst(v, { f: 4200, f2: 2000, q: 1, e: { a: 0.02, d: 0.45, peak: 0.1 }, at: v.t + 0.2 });
  },
  ticket: (v) => {
    for (let i = 0; i < 7; i++) noiseBurst(v, { f: 3600, q: 2, e: { a: 0.002, d: 0.03, peak: 0.08 }, at: v.t + i * 0.035 });
  },
  ball: (v) => {
    tone(v, { f: 520, f2: 1560, type: 'square', lp: 3000, e: { a: 0.005, d: 0.3, peak: 0.05 } });
    tone(v, { f: 2093, type: 'square', lp: 3500, e: { a: 0.002, d: 0.25, peak: 0.035 }, at: v.t + 0.32 });
  },
  tape: (v) => {
    tone(v, { f: 80, type: 'square', lp: 300, e: { a: 0.005, d: 0.15, peak: 0.08 } });
    noiseBurst(v, { f: 2000, q: 0.3, e: { a: 0.02, d: 0.5, peak: 0.08, hold: 0.3 }, at: v.t + 0.5, rate: 1.5 });
  },
  canister: (v) => {
    tone(v, { f: 300, f2: 900, type: 'sine', e: { a: 0.002, d: 0.08, peak: 0.1 } });
    noiseBurst(v, { f: 2400, q: 3, e: { a: 0.001, d: 0.04, peak: 0.1 } });
    for (let i = 0; i < 6; i++) noiseBurst(v, { f: 2800, q: 3, e: { a: 0.001, d: 0.02, peak: 0.06 }, at: v.t + 0.3 + i * 0.06 });
  },
};
