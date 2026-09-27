import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Book, type BookHandle } from '../components/Book/Book';
import { EditContext, type EditApi } from '../components/Editor/EditContext';
import { PageOptions } from '../components/Editor/PageOptions';
import { PageStrip } from '../components/Editor/PageStrip';
import { Scene } from '../components/Scene/Scene';
import { Masthead } from '../components/Masthead/Masthead';
import { Dot, QuietButton, QuietLink } from '../components/ui/QuietButton';
import type { BuiltBook } from '../data/buildPages';
import { duplicateBook, moveSpread, spreadsFromImages } from '../data/bookOps';
import type { BookDoc } from '../data/schema';
import { fontsOf, getTheme, listThemes, themeStyle } from '../themes';
import { download, exportBook, type ExportKind } from '../export/exportBook';
import { fontSample, useFontsReady } from '../hooks/useFontsReady';
import { isSampleId, useLoadedBook } from '../hooks/useLoadedBook';
import { importAudio, importImage, resolveBook, type ImportedImage } from '../storage/assets';
import { putBook } from '../storage/db';
import { go, href } from './router';
import app from './App.module.css';
import styles from './EditorPage.module.css';

const STRIP_SPACE = 132;

export function EditorPage({ id }: { id: string }) {
  const { doc, setDoc, status } = useLoadedBook(id);

  // The built-in sample is read-only: editing it makes a personal copy first.
  useEffect(() => {
    if (!isSampleId(id) || !doc) return;
    const copy = duplicateBook(doc);
    void putBook(copy).then(() => go(href.edit(copy.id)));
  }, [id, doc]);

  if (status === 'missing') {
    return (
      <main className={`${app.room} ${app.center}`} data-ready>
        <p className={app.note}>找不到这本书。</p>
        <QuietLink href={href.shelf()}>回到书架</QuietLink>
      </main>
    );
  }
  if (!doc || isSampleId(id)) return <main className={app.room} />;
  return <Editor initial={doc} onDocChange={setDoc} />;
}

function Editor({ initial, onDocChange }: { initial: BookDoc; onDocChange: (d: BookDoc) => void }) {
  const [doc, setDocState] = useState(initial);
  const docRef = useRef(doc);
  const past = useRef<BookDoc[]>([]);
  const future = useRef<BookDoc[]>([]);
  const [assetsTick, setAssetsTick] = useState(0);

  const commit = useCallback(
    (next: BookDoc) => {
      docRef.current = next;
      setDocState(next);
      onDocChange(next);
    },
    [onDocChange],
  );

  const update = useCallback(
    (recipe: (d: BookDoc) => void) => {
      const prev = docRef.current;
      const next = structuredClone(prev);
      recipe(next);
      past.current.push(prev);
      if (past.current.length > 80) past.current.shift();
      future.current = [];
      commit(next);
    },
    [commit],
  );

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(docRef.current);
    commit(prev);
  }, [commit]);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(docRef.current);
    commit(next);
  }, [commit]);

  // ---- autosave
  const [saved, setSaved] = useState<'saved' | 'saving'>('saved');
  useEffect(() => {
    if (doc === initial) return;
    setSaved('saving');
    const t = window.setTimeout(() => {
      void putBook(doc).then(() => setSaved('saved'));
    }, 450);
    return () => window.clearTimeout(t);
  }, [doc, initial]);

  // ---- files
  const fileInput = useRef<HTMLInputElement>(null);
  const pending = useRef<((files: File[]) => void) | null>(null);
  const openPicker = (accept: string, multiple: boolean) =>
    new Promise<File[]>((resolve) => {
      const input = fileInput.current!;
      input.accept = accept;
      input.multiple = multiple;
      input.value = '';
      pending.current = resolve;
      input.click();
    });

  const importFile = useCallback(async (f: File) => {
    const im = await importImage(f);
    setAssetsTick((t) => t + 1);
    return im;
  }, []);

  const api: EditApi = useMemo(
    () => ({
      update,
      importFile,
      pickImage: async () => {
        const [f] = await openPicker('image/*', false);
        return f ? importFile(f) : null;
      },
    }),
    [update, importFile],
  );

  // ---- view tracking + navigation
  const bookRef = useRef<BookHandle>(null);
  const [view, setView] = useState<{ idx: number; built: BuiltBook | null }>({ idx: 0, built: null });
  const onView = useCallback((idx: number, built: BuiltBook) => setView({ idx, built }), []);
  const pendingJump = useRef<string | null>(null);

  const [busy, setBusy] = useState<string | null>(null);

  const addImages = useCallback(
    async (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith('image/'));
      if (!images.length) return;
      setBusy(`正在整理 ${images.length} 张照片…`);
      try {
        const imported: ImportedImage[] = [];
        for (const f of images) imported.push(await importImage(f));
        setAssetsTick((t) => t + 1);
        const spreads = spreadsFromImages(imported, docRef.current.themeId);
        const cur = view.built?.views[view.idx];
        update((d) => {
          const at = cur?.kind === 'story' ? d.spreads.findIndex((s) => s.id === cur.spread!.id) + 1 : d.spreads.length;
          d.spreads.splice(at, 0, ...spreads);
          if (!d.cover.image && d.spreads.length === spreads.length && imported[0]) {
            d.cover.image = { src: imported[0].src, thumb: imported[0].thumb, alt: '封面' };
          }
        });
        pendingJump.current = spreads[0]?.id ?? null;
      } finally {
        setBusy(null);
      }
    },
    [update, view],
  );

  const removeSpread = useCallback(
    (sid: string) =>
      update((d) => {
        d.spreads = d.spreads.filter((s) => s.id !== sid);
      }),
    [update],
  );

  const resolved = useMemo(() => resolveBook(doc), [doc, assetsTick]); // eslint-disable-line react-hooks/exhaustive-deps

  // Jump to newly added pages once the book has rebuilt.
  useEffect(() => {
    const target = pendingJump.current;
    if (!target || !view.built) return;
    const vi = view.built.views.findIndex((v) => v.spread?.id === target);
    if (vi >= 0) {
      pendingJump.current = null;
      bookRef.current?.goToView(vi);
    }
  });

  // ---- keyboard: undo / redo (text fields keep their own undo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA)$/.test(t.tagName))) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // ---- music
  const setMusic = async () => {
    const [f] = await openPicker('audio/*', false);
    if (!f) return;
    const src = await importAudio(f);
    setAssetsTick((t) => t + 1);
    update((d) => void (d.music = { src, title: f.name.replace(/\.[^.]+$/, '') }));
  };

  // ---- export
  const [menu, setMenu] = useState<null | 'export' | 'music' | 'style'>(null);
  const runExport = async (kind: ExportKind) => {
    setMenu(null);
    try {
      await putBook(docRef.current);
      const res = await exportBook(docRef.current, kind, setBusy);
      setBusy(`完成，${(res.blob.size / 1024 / 1024).toFixed(1)} MB`);
      download(res);
      window.setTimeout(() => setBusy(null), 2400);
    } catch (err) {
      setBusy(`导出失败：${(err as Error).message}`);
      window.setTimeout(() => setBusy(null), 5000);
    }
  };

  // ---- drag photos anywhere onto the room
  const [over, setOver] = useState(false);
  const dragDepth = useRef(0);

  const ready = useFontsReady(fontSample(doc), fontsOf(doc), doc.themeId);
  const cur = view.built?.views[view.idx];

  return (
    <EditContext.Provider value={api}>
      <main
        className={`${app.room} ${styles.editor} ${getTheme(doc.themeId).className}`}
        style={themeStyle(doc)}
        data-ready={ready || undefined}
        onDragEnter={(e) => {
          if (!e.dataTransfer.types.includes('Files')) return;
          dragDepth.current++;
          setOver(true);
        }}
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (!dragDepth.current) setOver(false);
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setOver(false);
          void addImages([...e.dataTransfer.files]);
        }}
      >
        <Scene theme={getTheme(doc.themeId)} mode="edit" sound={false} />
        <Masthead
          book={resolved}
          shelfHref={href.shelf()}
          footer={saved === 'saving' ? '保存中…' : '已自动保存在这台设备上'}
          right={
            <>
              <span className={styles.menuWrap}>
                <QuietButton active={menu === 'style'} onClick={() => setMenu(menu === 'style' ? null : 'style')} aria-expanded={menu === 'style'}>
                  风格 · {getTheme(doc.themeId).name}
                </QuietButton>
                {menu === 'style' && (
                  <div className={`${styles.menu} ${styles.styleMenu}`} role="menu">
                    {(['classic', 'screen'] as const).map((g) => (
                      <div key={g} className={styles.styleGroup}>
                        <p className={styles.menuNote}>{g === 'classic' ? '经典' : '影视'}</p>
                        {listThemes()
                          .filter((t) => t.group === g)
                          .map((t) => (
                            <div key={t.id} className={styles.styleRow} data-active={doc.themeId === t.id || undefined}>
                              <button
                                type="button"
                                className={styles.styleName}
                                onClick={() =>
                                  update((d) => {
                                    d.themeId = t.id;
                                    delete d.paletteId;
                                    delete d.coverVariant;
                                  })
                                }
                              >
                                {t.name}
                              </button>
                              <span className={styles.swatches}>
                                {t.palettes.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    title={p.name}
                                    aria-label={`${t.name} · ${p.name}`}
                                    className={styles.swatch}
                                    data-active={(doc.themeId === t.id && (doc.paletteId ?? t.palettes[0].id) === p.id) || undefined}
                                    style={{ background: `linear-gradient(135deg, ${p.swatch[0]} 50%, ${p.swatch[1]} 50%)`, boxShadow: `inset 0 0 0 2px ${p.swatch[2]}` }}
                                    onClick={() =>
                                      update((d) => {
                                        if (d.themeId !== t.id) delete d.coverVariant;
                                        d.themeId = t.id;
                                        d.paletteId = p.id;
                                      })
                                    }
                                  />
                                ))}
                              </span>
                            </div>
                          ))}
                      </div>
                    ))}
                    {getTheme(doc.themeId).photoFilter && (
                      <div className={styles.styleGroup}>
                        <p className={styles.menuNote}>照片</p>
                        <QuietButton
                          active={doc.photoFilter !== false}
                          onClick={() => update((d) => void (d.photoFilter = d.photoFilter === false ? undefined : false))}
                        >
                          主题滤镜 · {getTheme(doc.themeId).photoFilter!.label}：{doc.photoFilter === false ? '关' : '开'}
                        </QuietButton>
                      </div>
                    )}
                  </div>
                )}
              </span>
              <Dot />
              <span className={styles.menuWrap}>
                <QuietButton active={!!doc.music} onClick={() => setMenu(menu === 'music' ? null : 'music')} aria-expanded={menu === 'music'}>
                  音乐
                </QuietButton>
                {menu === 'music' && (
                  <div className={styles.menu} role="menu">
                    <p className={styles.menuNote}>{doc.music ? `当前：${doc.music.title ?? '背景音乐'}` : '读者翻开书时，音乐会轻轻响起'}</p>
                    <QuietButton onClick={() => void setMusic().then(() => setMenu(null))}>{doc.music ? '更换音乐' : '选择一首音乐'}</QuietButton>
                    {doc.music && (
                      <QuietButton onClick={() => (update((d) => void delete d.music), setMenu(null))}>移除音乐</QuietButton>
                    )}
                  </div>
                )}
              </span>
              <QuietButton active={doc.sound.flip} onClick={() => update((d) => void (d.sound.flip = !d.sound.flip))}>
                音效
              </QuietButton>
              <Dot />
              <QuietButton onClick={undo} disabled={!past.current.length} title="撤销 (Ctrl+Z)">
                撤销
              </QuietButton>
              <Dot />
              <QuietLink href={href.read(doc.id)}>预览</QuietLink>
              <span className={styles.menuWrap}>
                <QuietButton onClick={() => setMenu(menu === 'export' ? null : 'export')} aria-expanded={menu === 'export'}>
                  导出
                </QuietButton>
                {menu === 'export' && (
                  <div className={styles.menu} role="menu">
                    <p className={styles.menuNote}>送礼</p>
                    <QuietButton
                      active={doc.gift?.unwrap !== false}
                      onClick={() => update((d) => void (d.gift = { ...d.gift, unwrap: d.gift?.unwrap === false }))}
                    >
                      拆封仪式：{doc.gift?.unwrap === false ? '关' : '开'}
                    </QuietButton>
                    {doc.gift?.unwrap !== false && (
                      <div className={styles.giftFields}>
                        <label>
                          送给
                          <input
                            value={doc.gift?.to ?? ''}
                            placeholder={doc.meta.dedication?.to || '收礼的人'}
                            maxLength={16}
                            onChange={(e) => {
                              const to = e.target.value;
                              update((d) => void (d.gift = { ...d.gift, to }));
                            }}
                          />
                        </label>
                        <label>
                          来自
                          <input
                            value={doc.gift?.from ?? ''}
                            placeholder={doc.meta.author || '你的名字'}
                            maxLength={16}
                            onChange={(e) => {
                              const from = e.target.value;
                              update((d) => void (d.gift = { ...d.gift, from }));
                            }}
                          />
                        </label>
                      </div>
                    )}
                    <p className={styles.menuNote}>读者打开书之前，会先拆开一份{getTheme(doc.themeId).name}风格的包装</p>
                    <p className={styles.menuNote}>导出</p>
                    <QuietButton onClick={() => void runExport('zip')}>网站文件夹（.zip）</QuietButton>
                    <p className={styles.menuNote}>解压后拖到 Netlify Drop 即得分享链接，也可直接双击打开</p>
                    <QuietButton onClick={() => void runExport('html')}>单个网页文件（.html）</QuietButton>
                    <p className={styles.menuNote}>一个文件就是整本书，适合直接发送</p>
                  </div>
                )}
              </span>
            </>
          }
        />

        <Book book={resolved} reserveBottom={STRIP_SPACE} handle={bookRef} onView={onView} />

        <PageOptions doc={doc} view={cur} update={update} onRemoveSpread={removeSpread} />
        <PageStrip
          doc={doc}
          resolved={resolved}
          built={view.built}
          current={view.idx}
          onJump={(v) => bookRef.current?.goToView(v)}
          onMove={(from, to) => update((d) => moveSpread(d, from, to))}
          onAdd={() => void openPicker('image/*', true).then(addImages)}
        />

        <input
          ref={fileInput}
          type="file"
          className="visually-hidden"
          tabIndex={-1}
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            pending.current?.(files);
            pending.current = null;
          }}
        />

        {over && <div className={styles.drop}>松开，把照片放进书里</div>}
        {busy && <div className={styles.busy}>{busy}</div>}
        {menu && <div className={styles.scrim} onClick={() => setMenu(null)} />}
      </main>
    </EditContext.Provider>
  );
}
