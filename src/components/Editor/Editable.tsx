import { useRef, useState, type ElementType, type PointerEvent as RPointerEvent } from 'react';
import type { BookImage, Focal } from '../../data/schema';
import type { ImportedImage } from '../../storage/assets';
import { PageImage } from '../Book/PageImage';
import { useEdit } from './EditContext';
import s from './Editable.module.css';

interface TextProps {
  value?: string;
  onCommit: (v: string) => void;
  as?: ElementType;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

/**
 * Text that is typeset normally for readers and becomes editable in place in the editor.
 * The element is uncontrolled while focused; the value is committed on blur.
 */
export function EditableText({ value = '', onCommit, as: Tag = 'p', className, placeholder, multiline }: TextProps) {
  const edit = useEdit();
  if (!edit) return value ? <Tag className={className}>{value}</Tag> : null;
  return (
    <Tag
      className={`${className ?? ''} ${s.text}`}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder}
      data-multiline={multiline || undefined}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const v = e.currentTarget.innerText.replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim();
        if (v !== value) onCommit(v);
        if (!v) e.currentTarget.textContent = '';
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        e.stopPropagation();
        if (e.key === 'Escape' || (!multiline && e.key === 'Enter')) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    >
      {value}
    </Tag>
  );
}

interface SlotProps {
  image?: BookImage;
  half?: 'left' | 'right';
  decorative?: boolean;
  onChange?: (img: BookImage) => void;
  emptyLabel?: string;
  className?: string;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * An image position on a page. In the editor: drag to pan the crop, drop a file or use
 * “换一张” to replace. For spread-wide images both halves edit the same picture.
 */
export function ImageSlot({ image, half, decorative, onChange, emptyLabel = '放一张图片', className }: SlotProps) {
  const edit = useEdit();
  const [live, setLive] = useState<Focal | null>(null);
  const [over, setOver] = useState(false);
  const drag = useRef<{ x: number; y: number; f: Focal; w: number; h: number } | null>(null);

  if (!edit || !onChange) {
    return image ? <PageImage image={image} half={half} decorative={decorative} className={className} /> : null;
  }

  const replaceWith = (im: ImportedImage | null) => {
    if (!im) return;
    onChange({ src: im.src, thumb: im.thumb, alt: image?.alt || im.name.replace(/\.[^.]+$/, ''), focal: { x: 0.5, y: 0.5 } });
  };

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (!image || e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    const r = e.currentTarget.getBoundingClientRect();
    drag.current = { x: e.clientX, y: e.clientY, f: image.focal ?? { x: 0.5, y: 0.5 }, w: half ? r.width * 2 : r.width, h: r.height };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    // Dragging the picture right reveals more of its left side.
    setLive({ x: clamp(d.f.x - ((e.clientX - d.x) / d.w) * 1.6), y: clamp(d.f.y - ((e.clientY - d.y) / d.h) * 1.6) });
  };
  const onPointerUp = () => {
    if (drag.current && live && image) onChange({ ...image, focal: live });
    drag.current = null;
    setLive(null);
  };

  const shown = image && live ? { ...image, focal: live } : image;

  return (
    <div
      className={`${s.slot} ${className ?? ''}`}
      data-empty={!image || undefined}
      data-over={over || undefined}
      data-dragging={!!live || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          e.stopPropagation();
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={async (e) => {
        const f = [...e.dataTransfer.files].find((x) => x.type.startsWith('image/'));
        setOver(false);
        if (!f) return;
        e.preventDefault();
        e.stopPropagation();
        replaceWith(await edit.importFile(f));
      }}
    >
      {shown ? (
        <PageImage image={shown} half={half} decorative={decorative} />
      ) : (
        <button type="button" className={s.empty} onClick={async () => replaceWith(await edit.pickImage())}>
          {emptyLabel}
        </button>
      )}
      {image && half !== 'right' && (
        <div className={s.tools}>
          <button type="button" onClick={async () => replaceWith(await edit.pickImage())}>
            换一张
          </button>
          <span className={s.hint}>拖动图片调整取景</span>
        </div>
      )}
    </div>
  );
}
