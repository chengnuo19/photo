import { useState } from 'react';
import { hashAnswer, splitAnswers } from '../../data/gift';
import type { BookDoc } from '../../data/schema';
import { newId } from '../../storage/assets';
import { QuietButton } from '../ui/QuietButton';
import styles from './GiftSettings.module.css';

/** `datetime-local` value for a timestamp, in this device's time zone. */
const toLocalInput = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/**
 * Everything about giving the book: the wrapping (to / from), when it may be opened, a
 * question to answer first, and whether it plays itself once opened.
 */
export function GiftSettings({ doc, update, themeName }: { doc: BookDoc; update: (recipe: (d: BookDoc) => void) => void; themeName: string }) {
  const gift = doc.gift ?? {};
  const wrapped = gift.unwrap !== false;
  const quiz = gift.quiz;
  const [answers, setAnswers] = useState('');
  const [editingAnswers, setEditingAnswers] = useState(!quiz?.answers.length);
  const set = (fn: (g: NonNullable<BookDoc['gift']>) => void) =>
    update((d) => {
      const g = { ...d.gift };
      fn(g);
      d.gift = g;
    });

  return (
    <div className={styles.gift}>
      <QuietButton active={wrapped} onClick={() => set((g) => void (g.unwrap = !wrapped))}>
        拆封仪式：{wrapped ? '开' : '关'}
      </QuietButton>
      {wrapped && (
        <>
          <div className={styles.fields}>
            <label>
              送给
              <input value={gift.to ?? ''} placeholder={doc.meta.dedication?.to || '收礼的人'} maxLength={16} onChange={(e) => set((g) => void (g.to = e.target.value))} />
            </label>
            <label>
              来自
              <input value={gift.from ?? ''} placeholder={doc.meta.author || '你的名字'} maxLength={16} onChange={(e) => set((g) => void (g.from = e.target.value))} />
            </label>
          </div>
          <p className={styles.note}>读者打开书之前，会先拆开一份{themeName}风格的包装</p>

          <label className={styles.row}>
            <span>拆封时间</span>
            <input
              type="datetime-local"
              value={gift.unlockAt ? toLocalInput(gift.unlockAt) : ''}
              onChange={(e) => {
                const ms = e.target.value ? new Date(e.target.value).getTime() : NaN;
                set((g) => {
                  if (Number.isFinite(ms)) g.unlockAt = ms;
                  else delete g.unlockAt;
                });
              }}
            />
            {gift.unlockAt ? (
              <button type="button" className={styles.clear} onClick={() => set((g) => void delete g.unlockAt)} aria-label="不限时间">
                ×
              </button>
            ) : null}
          </label>
          <p className={styles.note}>{gift.unlockAt ? '到这个时间之前，读者只能看到礼物和倒计时（比如生日当天 0 点）' : '不填：随时可以拆开'}</p>

          {quiz ? (
            <div className={styles.quiz}>
              <label className={styles.stack}>
                <span>拆开前要回答的问题</span>
                <input value={quiz.question} maxLength={60} placeholder="我们第一次见面是在哪里？" onChange={(e) => set((g) => void (g.quiz = { ...quiz, question: e.target.value }))} />
              </label>
              {editingAnswers ? (
                <label className={styles.stack}>
                  <span>答案（可以写几个，用逗号隔开；大小写、空格、标点不影响）</span>
                  <input
                    value={answers}
                    placeholder="人民公园，公园"
                    onChange={(e) => {
                      setAnswers(e.target.value);
                      const list = splitAnswers(e.target.value);
                      set((g) => void (g.quiz = { ...quiz, answers: list.map((a) => hashAnswer(a, quiz.salt)) }));
                    }}
                  />
                </label>
              ) : (
                <p className={styles.note}>
                  已设置 {quiz.answers.length} 个答案（保存后不再显示）。
                  <button type="button" className={styles.link} onClick={() => (setAnswers(''), setEditingAnswers(true))}>
                    重新设置
                  </button>
                </p>
              )}
              <label className={styles.stack}>
                <span>答错三次后的提示（可不填）</span>
                <input value={quiz.hint ?? ''} maxLength={60} placeholder="那天下着雨" onChange={(e) => set((g) => void (g.quiz = { ...quiz, hint: e.target.value || undefined }))} />
              </label>
              <QuietButton onClick={() => set((g) => void delete g.quiz)}>去掉问题</QuietButton>
            </div>
          ) : (
            <QuietButton
              onClick={() => {
                setAnswers('');
                setEditingAnswers(true);
                set((g) => void (g.quiz = { question: '', answers: [], salt: newId() }));
              }}
            >
              加一个拆封问题
            </QuietButton>
          )}
          {quiz && !quiz.answers.length && <p className={styles.warn}>还没有填答案：读者不用回答就能打开</p>}
        </>
      )}
      <QuietButton active={!!gift.autoplay} onClick={() => set((g) => void (g.autoplay = !g.autoplay || undefined))}>
        打开后自动放映：{gift.autoplay ? '开' : '关'}
      </QuietButton>
      <p className={styles.note}>书会自己一页页翻，配着音乐，适合给长辈看或投到电视上；读者点一下就停</p>
      <p className={styles.note}>倒计时和问题只是仪式感：懂技术的人能绕过，别用来藏秘密</p>
    </div>
  );
}
