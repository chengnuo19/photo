import type { BookDoc, BookImage, Spread, ThemeId } from './schema';

/**
 * The photographs of the built-in sample books (free Unsplash photos, see
 * public/assets/samples/SOURCES.md). Every theme's sample keeps its own covers and most of its
 * words; this file supplies its nine photos and the story spreads that show them off:
 *
 *   full spread · two pages · photo + text · words only · one large + two small · full spread · polaroid
 */

const base = `${import.meta.env.BASE_URL}assets/samples/`;

type Shot = [slot: string, alt: string, fx?: number, fy?: number];

function img(theme: ThemeId, [slot, alt, fx = 0.5, fy = 0.5]: Shot): BookImage {
  return { src: `${base}${theme}/${slot}.webp`, alt, focal: { x: fx, y: fy } };
}

type Part = 'full1' | 'pair' | 'side' | 'hero' | 'full2' | 'print';

interface Story {
  full1: Shot;
  pair: [Shot, Shot];
  side: Shot;
  hero: [Shot, Shot, Shot];
  full2: Shot;
  print: Shot;
  cap: Record<Part, string>;
  stamps: [string, string][];
  sideTitle: string;
  sideText: string;
  words: { title: string; text: string; quote: string };
  decor?: Partial<Record<Part, string>>;
  meta?: Partial<BookDoc['meta']>;
}

const STORIES: Record<ThemeId, Story> = {
  storybook: {
    full1: ['sheep-hills-new-zealand', '春天的牧场上散落着羊群，远处是河谷和山', 0.5, 0.65],
    pair: [
      ['cherry-blossom-branch', '蓝天下一枝粉白的樱花', 0.5, 0.4],
      ['church-good-shepherd', '湖边的石头小教堂和草丛'],
    ],
    side: ['flat-white-coffee', '木桌上一杯拉花咖啡'],
    hero: [
      ['lake-tekapo-lupins', '湖岸开满紫色和粉色的鲁冰花，远处是雪山', 0.5, 0.6],
      ['mount-cook-road', '通往雪山的公路，一辆车正开过来'],
      ['queenstown-lake-boats', '湖面上停着几艘小船'],
    ],
    full2: ['milford-sound', '峡湾里的山倒映在平静的水面上', 0.5, 0.45],
    print: ['wanaka-tree', '湖水里独自生长的一棵树'],
    cap: {
      full1: '春天的牧场，满是羊群和刚出生的小羊。',
      pair: '樱花开了，湖边的小教堂安安静静。',
      side: '每天早上的一杯 flat white。',
      hero: '鲁冰花开满了湖岸，往雪山去的路好像永远开不完。',
      full2: '峡湾里没有风，山倒映在水里。',
      print: '瓦纳卡湖里那棵孤单的树。',
    },
    stamps: [['9.14', '坎特伯雷'], ['9.18', '特卡波'], ['9.19', '基督城'], ['9.21', '库克山'], ['9.25', '米尔福德峡湾'], ['9.27', '瓦纳卡']],
    sideTitle: '早晨',
    sideText: '旅馆楼下的小咖啡馆，\n老板记住了我们的名字。\n窗外的羊叫了一整个早晨。',
    words: { title: '写在路上', text: '车窗外一会儿是羊，一会儿是湖。\n我们没怎么说话，就这样开了一整天。', quote: '有些地方只去过一次，\n却会在心里住很久。' },
    meta: {
      subtitle: '一路拍下的春天',
      letter: {
        salutation: '亲爱的你：',
        body: '翻到这里，旅程就要结束了。\n\n那些清晨的羊群、湖边的鲁冰花、傍晚安静的峡湾，我一张一张拍下来，是怕自己有一天会忘记。\n\n谢谢你陪我走过这一路。下一次，我们去更远的地方。',
        signoff: '安',
        date: '二〇二四年十月',
      },
    },
  },
  film: {
    full1: ['friends-beach-film', '几个朋友坐在海滩上看海', 0.5, 0.55],
    pair: [
      ['ice-cream-summer', '海边举着一支冰淇淋'],
      ['bicycle-beach', '停在海边的自行车'],
    ],
    side: ['seaside-town', '海港小镇和几条小船', 0.5, 0.6],
    hero: [
      ['beach-umbrellas', '沙滩上一把白色的遮阳伞', 0.45, 0.5],
      ['lighthouse', '海里红白相间的灯塔'],
      ['waves-film-photography', '阳光下的海浪'],
    ],
    full2: ['pier-sunset', '日落时的旧栈桥'],
    print: ['fishing-boats-harbor', '港口里的渔船'],
    cap: {
      full1: '那年夏天，我们在海边待了一整个星期。',
      pair: '冰淇淋化得比吃得快。',
      side: '小镇只有一条街，走到尽头就是海。',
      hero: '遮阳伞、灯塔、浪。一卷胶卷就这样拍完了。',
      full2: '最后一天的日落，谁都没说要走。',
      print: '清晨的渔船，还没睡醒。',
    },
    stamps: [['7.12', '海边'], ['7.13', '小镇'], ['7.13', '码头'], ['7.15', '灯塔'], ['7.18', '旧栈桥'], ['7.19', '港口']],
    sideTitle: '第 12 张',
    sideText: '冲洗出来才发现，\n这张的颜色最好看。\n可惜那天的风，照片里看不见。',
    words: { title: '冲洗笔记', text: '36 张，糊了 5 张，过曝 3 张。\n剩下的每一张，都比我记得的更亮一点。', quote: '把那个夏天，\n装进一卷胶卷里。' },
    meta: {
      kicker: '35mm · 海边',
      title: '那年夏天',
      subtitle: '一卷胶卷的海',
      author: '阿树',
      dateLine: '二〇二四 · 七月',
      coverLines: ['一卷胶卷，', '三十六个夏天的瞬间。'],
      closingLines: ['底片还在，', '夏天也还在。'],
      dedication: { to: '给那年夏天一起在海边的你们', body: '照片会褪色，\n但那天的海风不会。' },
      letter: {
        salutation: '亲爱的你们：',
        body: '胶卷冲出来了，一共三十六张。\n\n有几张糊了，有几张过曝了，可每一张我都舍不得丢。\n\n明年夏天，还去那片海吧。',
        signoff: '阿树',
        date: '二〇二四年八月',
      },
    },
  },
  journal: {
    full1: ['lisbon-rooftops', '里斯本的红色屋顶一直延伸到海边'],
    pair: [
      ['lisbon-tram', '爬坡的黄色老电车'],
      ['azulejo', '贴满蓝白瓷砖的老房子'],
    ],
    side: ['pastel-de-nata', '一盘刚出炉的蛋挞'],
    hero: [
      ['train-window-view', '火车窗外的田野'],
      ['sintra-pena-palace', '山顶上红黄相间的宫殿'],
      ['lisbon-street-laundry', '窄巷两边的老房子'],
    ],
    full2: ['cabo-da-roca', '悬崖上的灯塔和大西洋', 0.55, 0.5],
    print: ['porto-river', '波尔图的河岸'],
    cap: {
      full1: '里斯本的屋顶，一直红到海边。',
      pair: '28 路电车和一整面蓝瓷砖。',
      side: '一天吃了四个蛋挞。',
      hero: '坐火车去辛特拉，山顶的宫殿像一块糖。',
      full2: '陆止于此，海始于斯。',
      print: '最后一站，波尔图。',
    },
    stamps: [['4.03', 'LISBOA'], ['4.04', 'ALFAMA'], ['4.04', 'BELÉM'], ['4.06', 'SINTRA'], ['4.07', 'CABO DA ROCA'], ['4.09', 'PORTO']],
    sideTitle: '贝伦',
    sideText: '排了半小时的队，\n蛋挞烫得拿不住。\n撒一点肉桂粉，就是整个下午。',
    words: { title: '车票背面', text: '坐错了一站，却遇到了最好看的一条街。\n旅行大概就是这样。', quote: '陆止于此，\n海始于斯。' },
    meta: {
      kicker: 'TRAVEL JOURNAL',
      title: '葡萄牙',
      subtitle: '电车、瓷砖和海',
      author: '阿远',
      dateLine: '2024.04',
      coverLines: ['一张车票，', '七天，', '和一整片大西洋。'],
      closingLines: ['下一站，', '还没想好。'],
      dedication: { to: '给一起坐错过车的你', body: '迷路的那条街，\n后来成了最想念的地方。' },
      letter: {
        salutation: '亲爱的旅伴：',
        body: '七天，六座城，一百多张车票和门票，全都夹在这本本子里了。\n\n谢谢你每次都陪我坐错车。\n\n下一次，换你来选目的地。',
        signoff: '阿远',
        date: '2024.04.10',
      },
    },
  },
  museum: {
    full1: ['lone-tree-snow', '雪原上的一棵树'],
    pair: [
      ['sand-dune-minimal', '黑白的沙丘'],
      ['minimal-architecture-shadow', '白墙上的一道光'],
    ],
    side: ['empty-chair-window', '空房间里窗边的一把椅子'],
    hero: [
      ['minimal-foggy-lake', '雾里伸向湖面的栈桥'],
      ['minimal-staircase', '白色的楼梯'],
      ['minimal-vase-flower', '白瓶里的一束干花'],
    ],
    full2: ['salt-flat', '盐湖像镜子一样倒映着云'],
    print: ['minimal-sea-horizon', '只剩下一条线的海平面'],
    cap: {
      full1: 'Pl. 01 · 雪原',
      pair: 'Pl. 02–03 · 沙与光',
      side: 'Pl. 04 · 午后',
      hero: 'Pl. 05–07 · 雾、楼梯、花',
      full2: 'Pl. 08 · 镜面',
      print: 'Pl. 09 · 海平线',
    },
    stamps: [['01.14', '北海道'], ['03.02', '敦煌'], ['05.20', '京都'], ['06.11', '长野'], ['08.07', '乌尤尼'], ['10.30', '冲绳']],
    sideTitle: '午后',
    sideText: '光从窗户进来，\n在地板上停了一个下午。',
    words: { title: '策展人手记', text: '这一年只拍了很少的照片。\n每一张，都是一个安静的地方。', quote: '留白，\n也是一种记得。' },
    meta: {
      subtitle: '一年里安静的地方',
      dedication: { to: '给喜欢安静的你', body: '有些风景不需要说明，\n看着就好。' },
      letter: {
        salutation: '致观者：',
        body: '这本画册只收了九幅作品，每一幅都来自一个很安静的地方。\n\n如果你也在某一页停了很久，那就是它最好的展出。',
        signoff: '安',
        date: '二〇二四年冬',
      },
    },
  },
  watercolor: {
    full1: ['wildflower-meadow', '开满野花的草地'],
    pair: [
      ['tulips', '阳光里的郁金香'],
      ['bicycle-flower-basket', '车筐里装满鲜花的自行车'],
    ],
    side: ['latte-art', '木桌上的一杯拿铁'],
    hero: [
      ['cherry-blossom-street', '两排樱花树下的街道'],
      ['teacup-flowers', '窗边的花束和茶杯'],
      ['flower-shop', '花店门口的花架'],
    ],
    full2: ['misty-lake-morning', '清晨起雾的湖'],
    print: ['pastel-houses', '一排颜色很浅的房子'],
    cap: {
      full1: '四月的草地，是一整盒打翻的颜料。',
      pair: '郁金香，和一辆装满春天的自行车。',
      side: '拿铁上画了一片叶子。',
      hero: '樱花街、花店，还有窗边那杯茶。',
      full2: '清晨的湖，颜色淡得像没干的水彩。',
      print: '镇上的房子都是粉色和蓝色的。',
    },
    stamps: [['4/2', '草地'], ['4/6', '花市'], ['4/8', '街角'], ['4/12', '樱花街'], ['4/20', '湖边'], ['4/28', '小镇']],
    sideTitle: '慢慢来',
    sideText: '咖啡馆的窗边，\n画完一页，咖啡刚好凉了。',
    words: { title: '四月', text: '这个月什么大事都没有发生。\n只是花开了，天暖了，我画了很多页。', quote: '把颜色留给记忆，\n把留白留给时间。' },
  },
  starry: {
    full1: ['milky-way', '雪山上方的银河'],
    pair: [
      ['tent-under-stars', '星空下亮着灯的帐篷'],
      ['campfire-night', '夜里的篝火，火星飞向天空'],
    ],
    side: ['full-moon', '芦苇间升起的满月'],
    hero: [
      ['aurora', '极光倒映在湖里'],
      ['star-trails', '夜空中的圆形星轨'],
      ['telescope-night', '草地上的一架望远镜'],
    ],
    full2: ['lake-night-stars-reflection', '湖面倒映着银河'],
    print: ['desert-night-sky', '沙漠里的仙人掌和星空'],
    cap: {
      full1: '第一次看清银河，是在雪山脚下。',
      pair: '帐篷里亮着灯，篝火一直烧到后半夜。',
      side: '月亮从芦苇后面升起来。',
      hero: '极光、星轨，还有那架旧望远镜。',
      full2: '湖面上也有一条银河。',
      print: '沙漠的夜，星星多得吓人。',
    },
    stamps: [['8.12', '雪山营地'], ['8.12', '营地'], ['8.13', '河边'], ['8.20', '北方'], ['8.21', '湖边'], ['8.28', '沙漠']],
    sideTitle: '满月',
    sideText: '我们躺在草地上数流星，\n数到第十七颗，\n你已经睡着了。',
    words: { title: '观星笔记', text: '北斗七星在北边，\n夏季大三角在头顶。\n你说，这些光走了几万年，才被我们看见。', quote: '我们看过的星星，\n都还在那里。' },
  },
  wednesday: {
    full1: ['gothic-cathedral', '阴天下的哥特式尖塔'],
    pair: [
      ['rainy-window', '挂满雨滴的窗户'],
      ['crow', '一只站在石头上的乌鸦'],
    ],
    side: ['cello', '草地上的一把大提琴和椅子'],
    hero: [
      ['old-library-dark', '昏暗的老图书馆'],
      ['typewriter', '一台老式打字机'],
      ['candles-dark', '黑暗里的一支蜡烛'],
    ],
    full2: ['dark-forest-fog', '雾中的黑色森林'],
    print: ['dried-roses', '一枝枯萎的玫瑰'],
    cap: {
      full1: '钟楼在雨里敲了十三下。',
      pair: '雨下了一整个星期。那只乌鸦每天都来。',
      side: '在山坡上拉琴，没有观众，刚好。',
      hero: '图书馆、打字机和一支快烧完的蜡烛。',
      full2: '森林里的雾，比我还不爱说话。',
      print: '他送的玫瑰。我决定让它枯着。',
    },
    stamps: [['10.13', '钟楼'], ['10.15', '宿舍'], ['10.18', '山坡'], ['10.20', '图书馆'], ['10.27', '森林'], ['10.31', '房间']],
    sideTitle: '午夜练琴',
    sideText: '风像节拍器。\n我拉完最后一个音符，\n天刚好黑透。',
    words: { title: '日记 · 十月', text: '今天有人问我为什么总穿黑色。\n我说，在有人发明更暗的颜色之前，我没有别的选择。', quote: '我不喜欢惊喜，\n除非是我准备的。' },
    decor: { pair: 'crow' },
  },
  stranger: {
    full1: ['foggy-forest-road', '雾里的林间公路'],
    pair: [
      ['bicycle-night-street', '夜里路灯下骑车的人'],
      ['walkie-talkie', '一台对讲机'],
    ],
    side: ['christmas-lights-string', '彩色的圣诞串灯'],
    hero: [
      ['retro-arcade', '霓虹灯下的游戏厅'],
      ['vhs-tapes', '一盘录像带'],
      ['80s-neon-sign', '粉色的霓虹灯牌'],
    ],
    full2: ['flashlight-forest-night', '手电筒照亮的夜晚森林'],
    print: ['diner-neon', '餐厅的红色霓虹灯'],
    cap: {
      full1: '天黑以前一定要骑回家。',
      pair: '"收到请回答，完毕。"',
      side: '串灯亮了三下，是 Y、E、S。',
      hero: '游戏厅的最高分，还是我们的。',
      full2: '手电筒的光，只照得见前面三米。',
      print: '骑车去吃华夫饼，是那年夏天最好的事。',
    },
    stamps: [['7.04', '镜湖路'], ['7.06', '街角'], ['7.09', '客厅'], ['7.12', '游戏厅'], ['11.06', '森林'], ['11.08', '餐厅']],
    sideTitle: '客厅',
    sideText: '我们把串灯挂满了一面墙，\n每一颗灯泡下面，\n都写着一个字母。',
    words: { title: '战役记录', text: '四个人、三辆自行车、两台对讲机。\n还有一个我们谁也不敢说出口的地方。', quote: '朋友之间，\n不说谎。' },
    decor: { full1: 'vines', hero: 'lights' },
  },
  pokemon: {
    full1: ['tall-grass-field', '走进长满草的海边小路'],
    pair: [
      ['forest-path-sunlight', '阳光穿过森林小路'],
      ['japanese-town-street', '电线交错的小镇坡道'],
    ],
    side: ['game-boy', '一台老掌机和几张游戏卡'],
    hero: [
      ['mountain-trail-hiking', '通往雪山的登山小路'],
      ['japan-vending-machine', '街边的红色自动贩卖机'],
      ['rocky-shore-sea', '海边的礁石'],
    ],
    full2: ['japan-mountain-lake', '湖对面的富士山'],
    print: ['rural-japan-road', '乡间公路和电线杆'],
    cap: {
      full1: '草丛里好像有什么东西动了一下！',
      pair: '穿过常青森林，就是下一个小镇。',
      side: '存档了吗？存档了。',
      hero: '一号道路、自动贩卖机，还有海边的洞窟。',
      full2: '终于看到了那座山。',
      print: '冒险还没结束。',
    },
    stamps: [['7.20', '一号道路'], ['7.22', '常青森林'], ['7.22', '存档点'], ['7.25', '山路'], ['7.28', '湖边'], ['7.30', '回家路']],
    sideTitle: '存档',
    sideText: '图鉴完成度 64%。\n徽章 5 枚。\n游戏时间：一整个暑假。',
    words: { title: '冒险笔记', text: '走过的每一条道路，\n都记在这本笔记里。\n下一站，去更大的世界。', quote: '去见识\n更大的世界吧！' },
  },
  ghibli: {
    full1: ['cumulus-clouds-blue-sky', '蓝天里巨大的积雨云'],
    pair: [
      ['rural-bus-stop', '绿树旁的乡下车站站牌'],
      ['summer-rain-umbrella', '雨中的一把黄色雨伞'],
    ],
    side: ['japanese-house-veranda', '老房子的木走廊'],
    hero: [
      ['enoden-kamakura', '海边小镇驶过的绿色电车'],
      ['sunflowers', '一大片向日葵田'],
      ['onomichi', '通往海边的小巷'],
    ],
    full2: ['rice-field-japan', '山谷里的梯田'],
    print: ['green-hill-lone-tree', '山坡上的一棵大树'],
    cap: {
      full1: '云长得比山还高。',
      pair: '在车站等了很久，雨停了，车才来。',
      side: '外婆家的走廊，一到下午就有风。',
      hero: '坐电车去海边，路过一整片向日葵。',
      full2: '梯田绿得有点不真实。',
      print: '山坡上的那棵树，好像一直在等谁。',
    },
    stamps: [['7.21', '外婆家'], ['7.23', '车站'], ['7.24', '走廊'], ['7.28', '海边'], ['8.02', '山谷'], ['8.10', '后山']],
    sideTitle: '午后',
    sideText: '西瓜泡在井水里，\n风铃一直在响。\n那个夏天好像永远不会结束。',
    words: { title: '夏天', text: '暑假的每一天都差不多。\n睡午觉、等电车、看云。\n可我记得每一天。', quote: '风吹过的那个夏天，\n一直都在。' },
  },
  wizard: {
    full1: ['scottish-castle', '湖边的古老城堡倒映在水中'],
    pair: [
      ['steam-train', '森林里冒着蒸汽的火车'],
      ['owl', '站在树桩上的猫头鹰'],
    ],
    side: ['quill-ink', '羽毛笔和旧信纸'],
    hero: [
      ['oxford-dining-hall', '挂满画像的古老礼堂'],
      ['library-ladder-books', '螺旋楼梯旁的高大书架'],
      ['candles-candlelight', '一支烛台'],
    ],
    full2: ['autumn-forest-path', '铺满红叶的森林小路'],
    print: ['knitted-scarf', '织到一半的围巾'],
    cap: {
      full1: '第一次看见城堡，是从湖上的小船里。',
      pair: '火车开了一整天。猫头鹰比我先到。',
      side: '第一封家书，写了三遍才寄出去。',
      hero: '礼堂、图书馆的禁书区，还有一支不会熄灭的蜡烛。',
      full2: '禁林边上的小路，秋天最好看。',
      print: '学院围巾，外婆织的。',
    },
    stamps: [['9.01', '城堡'], ['9.01', '站台'], ['9.03', '宿舍'], ['9.10', '礼堂'], ['10.21', '禁林'], ['12.20', '宿舍']],
    sideTitle: '家书',
    sideText: '亲爱的爸爸妈妈：\n我被分进了一个很好的学院，\n这里的楼梯会自己移动。',
    words: { title: '第一学年', text: '学会了漂浮咒，\n在魁地奇比赛上喊哑了嗓子，\n交到了两个最好的朋友。', quote: '恶作剧\n完毕。' },
    decor: { hero: 'candles' },
  },
};

/** The sample's story spreads, built from the theme's nine photos. */
export function sampleSpreads(theme: ThemeId): Spread[] {
  const s = STORIES[theme];
  const i = (shot: Shot) => img(theme, shot);
  const st = (k: number) => ({ date: s.stamps[k][0], place: s.stamps[k][1] });
  const deco = (k: Part) => (s.decor?.[k] ? { overrides: { decor: s.decor[k] } } : {});
  return [
    { id: `${theme}-1`, layout: 'full-spread', images: [i(s.full1)], caption: s.cap.full1, stamp: st(0), ...deco('full1') },
    { id: `${theme}-2`, layout: 'two-pages', images: s.pair.map(i), caption: s.cap.pair, stamp: st(1), ...deco('pair') },
    { id: `${theme}-3`, layout: 'photo-text', images: [i(s.side)], caption: s.cap.side, title: s.sideTitle, text: s.sideText, stamp: st(2), ...deco('side') },
    { id: `${theme}-4`, layout: 'text', images: [], caption: s.words.quote, title: s.words.title, text: s.words.text },
    { id: `${theme}-5`, layout: 'hero-small', images: s.hero.map(i), caption: s.cap.hero, stamp: st(3), ...deco('hero') },
    { id: `${theme}-6`, layout: 'full-spread', images: [i(s.full2)], caption: s.cap.full2, stamp: st(4), ...deco('full2') },
    { id: `${theme}-7`, layout: 'polaroid', images: [i(s.print)], caption: s.cap.print, stamp: st(5), ...deco('print') },
  ];
}

/** Give a theme's sample book its photographs (and any updated words). */
export function withPhotos(book: BookDoc): BookDoc {
  const s = STORIES[book.themeId];
  if (!s) return book;
  return { ...book, meta: { ...book.meta, ...s.meta }, spreads: sampleSpreads(book.themeId) };
}
