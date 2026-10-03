import type { BookDoc, Spread } from '../../data/schema';
import { newId } from '../../storage/assets';
import type { Theme } from '../../themes/types';
import { QuietButton } from '../ui/QuietButton';
import { useEdit } from './EditContext';
import { MusicPicker } from './MusicPicker';
import s from './PageOptions.module.css';

/**
 * Chapters: a spread can start a new chapter, with a name (shown in the page strip and, if
 * wanted, on a title page) and its own music.
 */
export function ChapterTray({
  doc,
  sp,
  theme,
  set,
  update,
}: {
  doc: BookDoc;
  sp: Spread;
  theme: Theme;
  set: (fn: (x: Spread) => void) => void;
  update: (recipe: (d: BookDoc) => void) => void;
}) {
  const edit = useEdit();
  const index = doc.spreads.findIndex((x) => x.id === sp.id);
  const number = doc.spreads.slice(0, index + 1).filter((x) => x.chapter).length;

  if (!sp.chapter) {
    return (
      <div className={`${s.tray} ${s.wide}`}>
        <p className={s.trayText}>把书分成几章：每一章可以有自己的名字和音乐（比如前半本欢快，后半本抒情）。</p>
        <QuietButton onClick={() => set((x) => void (x.chapter = { title: '' }))}>从这一页开始新的一章</QuietButton>
      </div>
    );
  }

  const ch = sp.chapter;
  const addTitlePage = () =>
    update((d) => {
      const i = d.spreads.findIndex((x) => x.id === sp.id);
      if (i < 0) return;
      const title = d.spreads[i].chapter?.title || `第 ${number} 章`;
      const page: Spread = { id: newId(), layout: 'text', images: [], caption: title, title, chapter: d.spreads[i].chapter };
      delete d.spreads[i].chapter;
      d.spreads.splice(i, 0, page);
    });

  return (
    <div className={`${s.tray} ${s.wide}`}>
      <label className={s.field}>
        <span>第 {number} 章的名字（显示在下方页面条上）</span>
        <input value={ch.title ?? ''} maxLength={40} placeholder={`第 ${number} 章`} onChange={(e) => set((x) => void (x.chapter = { ...x.chapter, title: e.target.value }))} />
      </label>
      {doc.music?.kind === 'link' ? (
        <p className={s.trayText}>整本书用的是音乐 App 里的歌，章节不能单独换音乐。</p>
      ) : (
        <>
          <p className={s.trayText}>这一章的音乐：</p>
          <MusicPicker
            value={ch.music}
            theme={theme}
            allowLink={false}
            inheritLabel="接着放"
            pickFile={edit?.pickSong ?? (async () => null)}
            onChange={(m) =>
              set((x) => {
                const next = { ...x.chapter };
                if (m) next.music = m;
                else delete next.music;
                x.chapter = next;
              })
            }
          />
        </>
      )}
      <div className={s.trayRow}>
        <QuietButton onClick={addTitlePage}>在前面加一张章节标题页</QuietButton>
        <QuietButton onClick={() => set((x) => void delete x.chapter)}>取消分章</QuietButton>
      </div>
    </div>
  );
}
