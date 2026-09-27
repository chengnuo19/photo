import { withPhotos } from './samples';
import type { BookDoc } from './schema';

const base = `${import.meta.env.BASE_URL}assets/book/`;

/**
 * Built-in sample book. Replace the files in /public/assets/book/ and the text here
 * (or build a book in the editor) to make your own.
 */
export const sampleBook: BookDoc = withPhotos({
  id: 'sample-nz',
  version: 1,
  themeId: 'storybook',
  meta: {
    kicker: '一次春天的旅行',
    title: '新西兰',
    subtitle: '用丙烯马克笔画下的旅途',
    author: '安',
    dateLine: '二〇二四 · 春',
    coverLines: ['我画下了那些', '一直留在心里的地方，', '让它们永远不会褪色。'],
    closingLines: ['下次见，', '新西兰。'],
    dedication: {
      to: '给一起看过这些风景的你',
      body: '有些地方只去过一次，\n却会在心里住很久。',
    },
    letter: {
      salutation: '亲爱的你：',
      body:
        '翻到这里，旅程就要结束了。\n\n那些清晨的羊群、午后的樱花、傍晚安静的码头，我一张一张画下来，是怕自己有一天会忘记。\n\n谢谢你陪我走过这一路。下一次，我们去更远的地方。',
      signoff: '安',
      date: '二〇二四年十月',
    },
  },
  cover: {},
  sound: { flip: true },
  spreads: [
    {
      id: 'paddocks',
      layout: 'full-spread',
      images: [{ src: `${base}page-01.svg`, alt: '春天的牧场，远处是深绿的树林和缓坡，草地上散落着羊群', focal: { x: 0.5, y: 0.6 } }],
      caption: '春天的牧场，满是羊群和刚出生的小羊。',
      stamp: { date: '9.14', place: '坎特伯雷' },
    },
    {
      id: 'blossoms',
      layout: 'full-spread',
      images: [{ src: `${base}page-02.svg`, alt: '晴朗蓝天下的樱花枝，远处是一座火山和白色的房子', focal: { x: 0.55, y: 0.4 } }],
      caption: '樱花开在明亮的春日蓝天里。',
      stamp: { date: '9.18', place: '基督城' },
    },
    {
      id: 'harbour',
      layout: 'full-spread',
      images: [{ src: `${base}page-03.svg`, alt: '黄昏的港口，海面平静如镜，白色的船停在栈桥边', focal: { x: 0.5, y: 0.55 } }],
      caption: '黄昏的皮克顿码头，海面静得像一块玻璃。',
      stamp: { date: '9.22', place: '皮克顿' },
    },
  ],
});
