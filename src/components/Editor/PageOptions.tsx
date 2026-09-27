import { useState } from 'react';
import { LAYOUT_CAPACITY, type View } from '../../data/buildPages';
import { LAYOUT_LABELS } from '../../data/bookOps';
import type { BookDoc, Spread, SpreadLayout } from '../../data/schema';
import { newId } from '../../storage/assets';
import { activeDecor, getTheme } from '../../themes';
import { Dot, QuietButton } from '../ui/QuietButton';
import { useEdit } from './EditContext';
import { LayoutIcon } from './LayoutIcon';
import s from './PageOptions.module.css';

interface Props {
  doc: BookDoc;
  view?: View;
  update: (recipe: (d: BookDoc) => void) => void;
  onRemoveSpread: (id: string) => void;
}

const LAYOUTS = Object.keys(LAYOUT_LABELS) as SpreadLayout[];

/** Options for whatever is open right now — one quiet line, small trays open above it. */
export function PageOptions({ doc, view, update, onRemoveSpread }: Props) {
  const edit = useEdit();
  const [tray, setTray] = useState<null | 'stickers'>(null);
  const theme = getTheme(doc.themeId);
  if (!view) return null;

  if (view.kind === 'story' && view.spread) {
    const sp = doc.spreads.find((x) => x.id === view.spread!.id);
    if (!sp) return null;
    const set = (fn: (x: Spread) => void) =>
      update((d) => {
        const t = d.spreads.find((x) => x.id === sp.id);
        if (t) fn(t);
      });
    const cap = LAYOUT_CAPACITY[sp.layout];
    const decorNow = sp.overrides?.decor === 'none' ? 'none' : (activeDecor(theme, sp)?.id ?? 'none');
    const addSticker = (src: string) =>
      set((x) => {
        const n = x.stickers?.length ?? 0;
        x.stickers = [
          ...(x.stickers ?? []),
          { id: newId(), src, x: 0.62 + ((n * 0.09) % 0.3), y: 0.22 + ((n * 0.17) % 0.55), rot: Math.round(Math.random() * 16 - 8), scale: 0.09 },
        ];
      });

    return (
      <div className={s.row}>
        <span className={s.group} role="radiogroup" aria-label="版式">
          {LAYOUTS.map((l) => (
            <button
              key={l}
              type="button"
              className={s.layout}
              data-active={sp.layout === l || undefined}
              data-short={sp.images.length < Math.min(LAYOUT_CAPACITY[l], 1) || undefined}
              title={LAYOUT_LABELS[l]}
              aria-label={LAYOUT_LABELS[l]}
              aria-checked={sp.layout === l}
              role="radio"
              onClick={() => set((x) => void (x.layout = l))}
            >
              <LayoutIcon layout={l} />
            </button>
          ))}
        </span>
        <Dot />
        <span className={s.group}>
          <span className={s.k}>装饰</span>
          {theme.decor.map((d) => (
            <QuietButton key={d.id} active={decorNow === d.id} onClick={() => set((x) => void (x.overrides = { ...x.overrides, decor: d.id }))}>
              {d.label}
            </QuietButton>
          ))}
          <QuietButton active={decorNow === 'none'} onClick={() => set((x) => void (x.overrides = { ...x.overrides, decor: 'none' }))}>
            无
          </QuietButton>
        </span>
        {theme.photoFilter && doc.photoFilter !== false && (
          <>
            <Dot />
            <QuietButton
              active={sp.overrides?.filter !== false}
              title="这一页的照片是否使用主题滤镜"
              onClick={() => set((x) => void (x.overrides = { ...x.overrides, filter: x.overrides?.filter === false ? undefined : false }))}
            >
              滤镜 · {theme.photoFilter.label}
            </QuietButton>
          </>
        )}
        <Dot />
        <span className={s.trayWrap}>
          <QuietButton active={tray === 'stickers'} onClick={() => setTray(tray ? null : 'stickers')}>
            加贴纸
          </QuietButton>
          {tray === 'stickers' && (
            <div className={s.tray} role="menu">
              <div className={s.stickerGrid}>
                {Object.entries(theme.stickers).map(([name, st]) => (
                  <button key={name} type="button" className={s.sticker} title={st.label} onClick={() => addSticker('theme:' + name)}>
                    <st.Component className={s.stickerArt} />
                  </button>
                ))}
              </div>
              <QuietButton
                onClick={async () => {
                  const im = await edit?.pickImage();
                  if (im) addSticker(im.src);
                }}
              >
                上传自己的贴纸（PNG）
              </QuietButton>
              <p className={s.note}>拖动贴纸移动，拖右下角圆点旋转缩放</p>
            </div>
          )}
        </span>
        <QuietButton
          active={sp.overrides?.captionStyle === 'hand'}
          onClick={() => set((x) => void (x.overrides = { ...x.overrides, captionStyle: x.overrides?.captionStyle === 'hand' ? 'serif' : 'hand' }))}
        >
          手写说明
        </QuietButton>
        {cap > 1 && sp.images.length < cap && (
          <QuietButton
            onClick={async () => {
              const im = await edit?.pickImage();
              if (im) set((x) => void x.images.push({ src: im.src, thumb: im.thumb, alt: im.name.replace(/\.[^.]+$/, ''), focal: { x: 0.5, y: 0.5 } }));
            }}
          >
            再放一张（{sp.images.length}/{cap}）
          </QuietButton>
        )}
        <Dot />
        <QuietButton onClick={() => onRemoveSpread(sp.id)}>删除这一页</QuietButton>
      </div>
    );
  }

  const toggle = (key: 'dedication' | 'letter', on: boolean) =>
    update((d) => {
      if (on) d.meta[key] = key === 'dedication' ? { to: '给你', body: '' } : { salutation: '亲爱的你：', body: '' };
      else delete d.meta[key];
    });

  return (
    <div className={s.row}>
      {view.kind === 'cover' && theme.covers.length > 1 && (
        <>
          <span className={s.group}>
            <span className={s.k}>封面</span>
            {theme.covers.map((c) => (
              <QuietButton key={c.id} active={(doc.coverVariant ?? theme.covers[0].id) === c.id} onClick={() => update((d) => void (d.coverVariant = c.id))}>
                {c.name}
              </QuietButton>
            ))}
          </span>
          <Dot />
        </>
      )}
      <QuietButton active={!!doc.meta.dedication} onClick={() => toggle('dedication', !doc.meta.dedication)}>
        献词页
      </QuietButton>
      <QuietButton active={!!doc.meta.letter} onClick={() => toggle('letter', !doc.meta.letter)}>
        结尾的信
      </QuietButton>
      <span className={s.note}>点书上的文字即可直接修改</span>
    </div>
  );
}
