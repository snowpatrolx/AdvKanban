import type { StoryChapter } from '../types';

// 冒险章节数据（v1.24）
// - 章节选项：仅保留 wisdom（经验）/ favor（连续天数护盾），完全移除金币相关效果
// - 故事支线：每章 2 条，每条含 3 个阶段；每个阶段需先完成若干任务（tasksRequired）
//   才能选择该阶段的选项，选中后进入下一阶段，全部阶段走完即完成支线
//   —— 支线进度与任务完成进度直接关联

export const CHAPTERS: StoryChapter[] = [
  {
    id: 1,
    title: '觉醒',
    area: '起始村',
    condition: 'completed_tasks',
    conditionValue: 1,
    bossName: null,
    bossHP: 0,
    storyText: '混沌降临，迷雾笼罩了整片大陆。你在起始村的小屋中醒来，耳畔传来一个声音："秩序守护者，你的冒险从这里开始。完成你的第一个任务，驱散眼前的迷雾吧。"',
    bossDefeatedText: '迷雾散去，你感受到了前所未有的力量。前方的森林正在召唤你。',
    options: [
      { id: 'read', label: '村中读书', description: '读几页旧书，领悟几分道理', effect: 'wisdom', wisdomPoints: 20, oneTime: true },
      { id: 'pack', label: '整理行囊', description: '清点装备，为出发做准备', effect: 'wisdom', wisdomPoints: 10 },
      { id: 'watch', label: '村口守望', description: '在村口静静守望，积攒一点守护之力', effect: 'favor', favorShields: 1 },
    ],
    sideQuests: [
      {
        id: 'ch1-s1', chapterId: 1, title: '丢失的家猫', emoji: '🐱',
        intro: '村长焦急地找到你：他的老猫不见了，村里孩子都很担心。',
        stages: [
          { id: 'ch1-s1-st1', tasksRequired: 2, text: '你在村里四处打听，有人说午后看见猫往村后的草坡去了。',
            options: [
              { id: 'search', label: '立刻去草坡找', description: '沿脚印仔细搜寻', wisdomPoints: 15 },
              { id: 'ask', label: '再问几个村民', description: '多收集一些线索', wisdomPoints: 10, favorShields: 1 },
            ] },
          { id: 'ch1-s1-st2', tasksRequired: 3, text: '你在草坡的荆棘丛里听见了微弱的猫叫，它被困住了。',
            options: [
              { id: 'free', label: '小心拨开荆棘', description: '徒手把猫抱出来', wisdomPoints: 20 },
              { id: 'calm', label: '轻声安抚它', description: '先让它冷静下来', wisdomPoints: 15, favorShields: 1 },
            ] },
          { id: 'ch1-s1-st3', tasksRequired: 3, text: '老猫平安回到村长家，孩子们围着你欢呼。',
            options: [
              { id: 'pat', label: '摸摸它的头', description: '温柔地告别', wisdomPoints: 15, favorShields: 1 },
              { id: 'leave', label: '默默离开', description: '不居功，继续赶路', wisdomPoints: 20 },
            ] },
        ],
      },
      {
        id: 'ch1-s2', chapterId: 1, title: '破损的风车', emoji: '🌬️',
        intro: '村口的风车坏了，磨坊主说这两天没法磨面，再拖下去全村都要断粮。',
        stages: [
          { id: 'ch1-s2-st1', tasksRequired: 2, text: '你爬上风车检查，发现是中轴的木楔松动了。',
            options: [
              { id: 'wedge', label: '找块硬木楔紧', description: '就地取材修理', wisdomPoints: 15 },
              { id: 'study', label: '先研究结构', description: '弄清楚原理再动手', wisdomPoints: 20 },
            ] },
          { id: 'ch1-s2-st2', tasksRequired: 3, text: '风车转起来了，但叶片又发出异响，似乎哪里还没对齐。',
            options: [
              { id: 'align', label: '逐一校准叶片', description: '耐心调整角度', wisdomPoints: 20, favorShields: 1 },
              { id: 'lubricate', label: '给转轴上油', description: '减少摩擦', wisdomPoints: 15 },
            ] },
          { id: 'ch1-s2-st3', tasksRequired: 3, text: '风车平稳运转，面粉一袋袋磨了出来，磨坊主笑得合不拢嘴。',
            options: [
              { id: 'accept', label: '收下一袋面粉', description: '作为谢礼', wisdomPoints: 15, favorShields: 1 },
              { id: 'share', label: '分给村里的孩子', description: '把谢礼分享出去', wisdomPoints: 20, favorShields: 1 },
            ] },
        ],
      },
    ],
  },
  {
    id: 2,
    title: '初探森林',
    area: '翠绿森林',
    condition: 'streak_days',
    conditionValue: 3,
    bossName: '森林木灵',
    bossHP: 50,
    storyText: '穿过村庄外的草地，你来到了翠绿森林。古老的树木遮天蔽日，一个低沉的声音在林间回荡："闯入者……可恶的人类……"森林木灵挡住了你的去路。',
    bossDefeatedText: '木灵化为点点绿光消散，森林恢复了宁静。一条小路通向远方的沼泽。',
    options: [
      { id: 'listen', label: '聆听风声', description: '聆听森林低语，获得经验', effect: 'wisdom', wisdomPoints: 40, oneTime: true },
      { id: 'herb', label: '辨认草药', description: '记录林间的草药知识', effect: 'wisdom', wisdomPoints: 25 },
      { id: 'pray', label: '折枝祈福', description: '为森林祈福，获得 1 张连续天数护盾', effect: 'favor', favorShields: 1 },
    ],
    sideQuests: [
      {
        id: 'ch2-s1', chapterId: 2, title: '迷路的旅人', emoji: '🧑‍🎒',
        intro: '你在林间遇到一位迷失方向的旅人，他请求你帮他回到村庄。',
        stages: [
          { id: 'ch2-s1-st1', tasksRequired: 3, text: '旅人说他记得村庄在太阳落下的方向，但林间根本看不到太阳。',
            options: [
              { id: 'moss', label: '看树干苔藓辨向', description: '用自然知识找北', wisdomPoints: 25 },
              { id: 'stream', label: '沿溪流往下走', description: '水流总会通往有人烟处', wisdomPoints: 20, favorShields: 1 },
            ] },
          { id: 'ch2-s1-st2', tasksRequired: 4, text: '途中你们撞见一窝受惊的野蜂，旅人被蜇得满脸包。',
            options: [
              { id: 'herb2', label: '采草药敷上', description: '用林间草药消肿', wisdomPoints: 30 },
              { id: 'rest', label: '先找地方休息', description: '让他缓一缓', wisdomPoints: 20, favorShields: 1 },
            ] },
          { id: 'ch2-s1-st3', tasksRequired: 4, text: '村庄的炊烟出现在眼前，旅人热泪盈眶地握住你的手。',
            options: [
              { id: 'guide', label: '送他到村口', description: '善始善终', wisdomPoints: 25, favorShields: 1 },
              { id: 'farewell', label: '在此告别', description: '相信他能走完最后一段', wisdomPoints: 30 },
            ] },
        ],
      },
      {
        id: 'ch2-s2', chapterId: 2, title: '林间的小狐狸', emoji: '🦊',
        intro: '一只跛脚的小狐狸蹲在路边，用警惕又哀求的眼神望着你。',
        stages: [
          { id: 'ch2-s2-st1', tasksRequired: 3, text: '它的前爪被猎人的夹子夹住了，伤口还在流血。',
            options: [
              { id: 'open', label: '用力掰开夹子', description: '快速解救', wisdomPoints: 25, favorShields: 1 },
              { id: 'soothe', label: '先轻声安抚', description: '避免它挣扎受更重的伤', wisdomPoints: 30 },
            ] },
          { id: 'ch2-s2-st2', tasksRequired: 4, text: '小狐狸不再抗拒，任由你为它包扎，但它似乎不愿离开你。',
            options: [
              { id: 'bandage', label: '仔细包扎伤口', description: '用干净布条固定', wisdomPoints: 30 },
              { id: 'feed', label: '找些野果喂它', description: '让它恢复些力气', wisdomPoints: 20, favorShields: 1 },
            ] },
          { id: 'ch2-s2-st3', tasksRequired: 4, text: '几天后小狐狸能跑能跳了，它在你脚边绕了三圈，才奔向森林深处。',
            options: [
              { id: 'watch', label: '目送它离开', description: '默默祝福', wisdomPoints: 25, favorShields: 1 },
              { id: 'follow', label: '悄悄跟一段路', description: '看看它是否真的安全', wisdomPoints: 30 },
            ] },
        ],
      },
    ],
  },
  {
    id: 3,
    title: '沼泽迷途',
    area: '迷雾沼泽',
    condition: 'completed_tasks',
    conditionValue: 10,
    bossName: '沼泽巫女',
    bossHP: 100,
    storyText: '迷雾沼泽弥漫着腐朽的气息，脚下的泥泞让你步履维艰。远处传来诡异的笑声，沼泽巫女从浓雾中现身："又来了一个送死的冒险者……"',
    bossDefeatedText: '巫女的诅咒被打破，沼泽中的迷雾渐渐消散。远处隐约可见古代遗迹的轮廓。',
    options: [
      { id: 'rune', label: '解读巫符', description: '研究巫女遗留的符文', effect: 'wisdom', wisdomPoints: 60, oneTime: true },
      { id: 'ecology', label: '记录沼泽生态', description: '观察并记录沼泽的独特生物', effect: 'wisdom', wisdomPoints: 35 },
      { id: 'purify', label: '驱散怨气', description: '净化沼泽怨气，获得 1 张连续天数护盾', effect: 'favor', favorShields: 1 },
    ],
    sideQuests: [
      {
        id: 'ch3-s1', chapterId: 3, title: '沼泽骸骨', emoji: '💀',
        intro: '沼泽深处散落着一副古老的骸骨，骨缝间镶嵌着几颗还在发光的珠子。',
        stages: [
          { id: 'ch3-s1-st1', tasksRequired: 3, text: '你靠近时，珠子闪烁得更厉害了，像是在回应什么。',
            options: [
              { id: 'examine', label: '仔细检查骸骨', description: '看看它生前的故事', wisdomPoints: 35 },
              { id: 'wait', label: '退后观察', description: '等它安静下来再靠近', wisdomPoints: 25, favorShields: 1 },
            ] },
          { id: 'ch3-s1-st2', tasksRequired: 4, text: '你辨认出这是一位古代探险者，手中还紧握着半本被泡烂的日记。',
            options: [
              { id: 'read', label: '拼合日记残页', description: '尝试复原记录', wisdomPoints: 45 },
              { id: 'bury', label: '先为他筑土堆', description: '入土为安', wisdomPoints: 20, favorShields: 1 },
            ] },
          { id: 'ch3-s1-st3', tasksRequired: 4, text: '骸骨的光渐渐熄灭，像是终于得到了安息，沼泽里雾气都淡了几分。',
            options: [
              { id: 'pray', label: '默祷致意', description: '愿他灵魂安宁', wisdomPoints: 30, favorShields: 1 },
              { id: 'take', label: '收好他的日记', description: '让这段记录不被遗忘', wisdomPoints: 40 },
            ] },
        ],
      },
      {
        id: 'ch3-s2', chapterId: 3, title: '雾中的呼救声', emoji: '🆘',
        intro: '浓雾里隐约传来呼救声，但你分不清方向，沼泽处处是陷阱。',
        stages: [
          { id: 'ch3-s2-st1', tasksRequired: 3, text: '你循着声音走去，脚下忽然一软——是片流沙！',
            options: [
              { id: 'calm', label: '保持冷静慢动作', description: '越挣扎陷得越深', wisdomPoints: 35 },
              { id: 'grab', label: '抓住手边的藤条', description: '借力爬出来', wisdomPoints: 25, favorShields: 1 },
            ] },
          { id: 'ch3-s2-st2', tasksRequired: 4, text: '脱险后你找到了声音的源头：一个采药老人陷在泥坑里。',
            options: [
              { id: 'pull', label: '用绳索拉他上来', description: '合力施救', wisdomPoints: 30, favorShields: 1 },
              { id: 'log', label: '推一根朽木过去', description: '让他借力爬起', wisdomPoints: 35 },
            ] },
          { id: 'ch3-s2-st3', tasksRequired: 4, text: '老人感激涕零，告诉你一条穿越沼泽的安全路径。',
            options: [
              { id: 'listen', label: '认真记下路径', description: '之后能少走弯路', wisdomPoints: 45 },
              { id: 'escort', label: '护送他出沼泽', description: '确保他平安', wisdomPoints: 30, favorShields: 1 },
            ] },
        ],
      },
    ],
  },
  {
    id: 4,
    title: '遗迹密语',
    area: '古代遗迹',
    condition: 'knowledge_count',
    conditionValue: 5,
    bossName: '遗迹守卫',
    bossHP: 150,
    storyText: '巨大的石柱矗立在遗迹之中，墙壁上刻满了古老的符文。当你试图解读它们时，地面开始震动——遗迹守卫苏醒了，它庞大的石质身躯挡在了前方。',
    bossDefeatedText: '守卫轰然倒塌，扬起漫天尘土。遗迹深处的一道门缓缓打开，通向龙之巢穴。',
    options: [
      { id: 'inscribe', label: '符文悟道', description: '参悟符文之意，获得经验', effect: 'wisdom', wisdomPoints: 80, oneTime: true },
      { id: 'map', label: '测绘遗迹', description: '绘制遗迹的结构图', effect: 'wisdom', wisdomPoints: 50 },
      { id: 'honor', label: '恭敬祭奠', description: '向守卫致敬，获得 1 张连续天数护盾', effect: 'favor', favorShields: 1 },
    ],
    sideQuests: [
      {
        id: 'ch4-s1', chapterId: 4, title: '遗民的秘密', emoji: '📜',
        intro: '你在遗迹角落发现一间被遗忘的密室，里面留有遗民写的日记和一张残缺的地图。',
        stages: [
          { id: 'ch4-s1-st1', tasksRequired: 4, text: '密室的门半掩着，里面积了厚厚一层灰，似乎几百年没人来过。',
            options: [
              { id: 'enter', label: '小心走进去', description: '不破坏任何东西', wisdomPoints: 45 },
              { id: 'dust', label: '先清理灰尘', description: '看清墙上的壁画', wisdomPoints: 35, favorShields: 1 },
            ] },
          { id: 'ch4-s1-st2', tasksRequired: 5, text: '日记记录了一个辉煌文明的衰落，地图则标注着一条通往深处的密道。',
            options: [
              { id: 'diary', label: '通读整本日记', description: '了解那段历史', wisdomPoints: 60 },
              { id: 'map', label: '拼合残缺地图', description: '复原密道路线', wisdomPoints: 45, favorShields: 1 },
            ] },
          { id: 'ch4-s1-st3', tasksRequired: 5, text: '你在密室深处找到一枚遗民的徽章，它似乎还在微微发着光。',
            options: [
              { id: 'keep', label: '带走徽章保管', description: '让它重见天日', wisdomPoints: 50 },
              { id: 'leave', label: '留在原地', description: '尊重逝者的安排', wisdomPoints: 40, favorShields: 1 },
            ] },
        ],
      },
      {
        id: 'ch4-s2', chapterId: 4, title: '会发光的壁画', emoji: '🖼️',
        intro: '遗迹墙上有一幅会发光的壁画，画中的人影似乎在动，像在讲述一个故事。',
        stages: [
          { id: 'ch4-s2-st1', tasksRequired: 4, text: '你凝神看去，壁画描绘的是古人对抗混沌的战争。',
            options: [
              { id: 'study', label: '逐格研读', description: '理解战争的来龙去脉', wisdomPoints: 55 },
              { id: 'sketch', label: '临摹下来', description: '带回去慢慢研究', wisdomPoints: 40, favorShields: 1 },
            ] },
          { id: 'ch4-s2-st2', tasksRequired: 5, text: '壁画忽然亮起一束光，指向地板上一块松动的石砖。',
            options: [
              { id: 'lift', label: '撬开石砖看看', description: '下面可能藏着东西', wisdomPoints: 45, favorShields: 1 },
              { id: 'decode', label: '先破译光的含义', description: '也许是个机关', wisdomPoints: 60 },
            ] },
          { id: 'ch4-s2-st3', tasksRequired: 5, text: '石砖下是一卷古书，记载着遗迹的真正用途——它曾是一座知识圣殿。',
            options: [
              { id: 'read', label: '当场阅读古书', description: '吸收其中智慧', wisdomPoints: 65 },
              { id: 'deliver', label: '带出去交给学者', description: '让更多人受益', wisdomPoints: 45, favorShields: 1 },
            ] },
        ],
      },
    ],
  },
  {
    id: 5,
    title: '最终决战',
    area: '龙之巢穴',
    condition: 'streak_days',
    conditionValue: 30,
    bossName: '拖延之龙',
    bossHP: 500,
    storyText: '龙之巢穴炽热无比，岩浆在地表流淌。一头巨大的黑色巨龙盘踞在洞穴深处——拖延之龙，混沌的根源。它睁开猩红的眼睛："你终于来了，秩序守护者。但你会像其他人一样，倒在我的脚下……"',
    bossDefeatedText: '随着最后一击，拖延之龙发出震耳欲聋的咆哮，化为灰烬消散。阳光重新照耀大陆，混沌终结，秩序恢复。你，就是传说中的英雄！',
    options: [
      { id: 'dragon', label: '参悟龙意', description: '从龙的独白中领悟更高的秩序之道', effect: 'wisdom', wisdomPoints: 120, oneTime: true },
      { id: 'record', label: '记录龙之独白', description: '记下它的话语以备后察', effect: 'wisdom', wisdomPoints: 80 },
      { id: 'oath', label: '守护誓言', description: '立下守护誓言，获得 2 张连续天数护盾', effect: 'favor', favorShields: 2 },
    ],
    sideQuests: [
      {
        id: 'ch5-s1', chapterId: 5, title: '被囚禁的骑士', emoji: '🛡',
        intro: '龙巢深处有一名被锁链困住的老骑士，他请求你解救他。',
        stages: [
          { id: 'ch5-s1-st1', tasksRequired: 4, text: '骑士的锁链由龙鳞锻成，普通工具根本弄不断。',
            options: [
              { id: 'heat', label: '用岩浆熔断', description: '借龙巢的高温', wisdomPoints: 55 },
              { id: 'lock', label: '研究锁链的机关', description: '也许有开锁的方法', wisdomPoints: 65, favorShields: 1 },
            ] },
          { id: 'ch5-s1-st2', tasksRequired: 5, text: '锁链打开后，老骑士却站不起来——他被关得太久了。',
            options: [
              { id: 'help', label: '搀扶他慢慢活动', description: '帮他恢复知觉', wisdomPoints: 50, favorShields: 1 },
              { id: 'listen', label: '听他讲过去的故事', description: '一位老骑士的传奇', wisdomPoints: 70 },
            ] },
          { id: 'ch5-s1-st3', tasksRequired: 5, text: '老骑士终于能站立，他把祖传的护身符交给你。',
            options: [
              { id: 'accept', label: '郑重收下', description: '传承这份勇气', wisdomPoints: 60, favorShields: 1 },
              { id: 'refuse', label: '请他自己留着', description: '护身符该陪主人到最后', wisdomPoints: 70, favorShields: 1 },
            ] },
        ],
      },
      {
        id: 'ch5-s2', chapterId: 5, title: '龙巢里的小龙', emoji: '🐉',
        intro: '在龙巢的角落，你发现一只瑟瑟发抖的幼龙，它似乎与黑龙并非同类。',
        stages: [
          { id: 'ch5-s2-st1', tasksRequired: 4, text: '幼龙对你龇牙，但它的翅膀受了伤，飞不起来。',
            options: [
              { id: 'approach', label: '慢慢靠近示好', description: '消除它的戒心', wisdomPoints: 55, favorShields: 1 },
              { id: 'observe', label: '远远观察它', description: '判断它的伤势', wisdomPoints: 45 },
            ] },
          { id: 'ch5-s2-st2', tasksRequired: 5, text: '你用草药为它处理了翅膀，它开始舔你的手表示亲近。',
            options: [
              { id: 'heal', label: '每天来为它换药', description: '直到它痊愈', wisdomPoints: 65 },
              { id: 'feed', label: '找来它能吃的食物', description: '帮它补充体力', wisdomPoints: 50, favorShields: 1 },
            ] },
          { id: 'ch5-s2-st3', tasksRequired: 5, text: '幼龙的翅膀痊愈了，它绕着你飞了几圈，向远方的山脉飞去。',
            options: [
              { id: 'wave', label: '挥手送别', description: '愿它自由成长', wisdomPoints: 60, favorShields: 1 },
              { id: 'follow', label: '目送它消失在云里', description: '记住这一刻', wisdomPoints: 70 },
            ] },
        ],
      },
    ],
  },
  {
    id: 6,
    title: '新世界的门扉',
    area: '天空之城',
    condition: 'completed_tasks',
    conditionValue: 100,
    bossName: '云之守护者',
    bossHP: 800,
    storyText: '大陆重归平静后，天空中出现了一座漂浮的城市。一道光柱从天而降，指引你前往新的领域。在云端之上，云之守护者正在等待新的挑战者。',
    bossDefeatedText: '云之守护者微微颔首："你已证明了自己的实力。更遥远的星辰大海在等着你。"天空之城的大门缓缓开启。',
    options: [
      { id: 'cloud', label: '参悟云意', description: '参悟云朵流动中的秩序', effect: 'wisdom', wisdomPoints: 140, oneTime: true },
      { id: 'chart', label: '绘制云海图', description: '记录云海的走向', effect: 'wisdom', wisdomPoints: 100 },
      { id: 'bless', label: '云之赐护', description: '向守护者致意，获得 2 张连续天数护盾', effect: 'favor', favorShields: 2 },
    ],
    sideQuests: [
      {
        id: 'ch6-s1', chapterId: 6, title: '坠落的旅人', emoji: '🪂',
        intro: '一名失去滑翔翼的旅人被困在云层之间，他请求你想办法带他回家。',
        stages: [
          { id: 'ch6-s1-st1', tasksRequired: 4, text: '旅人悬在两座浮岛之间，手边只有一根快要断裂的绳梯。',
            options: [
              { id: 'rope', label: '抛出绳索救他', description: '把他拉到安全处', wisdomPoints: 70, favorShields: 1 },
              { id: 'wing', label: '找材料临时做滑翔翼', description: '从根本上解决问题', wisdomPoints: 85 },
            ] },
          { id: 'ch6-s1-st2', tasksRequired: 5, text: '旅人得救了，但他身上还带着要送往天空之城的重要信件。',
            options: [
              { id: 'letter', label: '帮他保管信件', description: '护送到目的地', wisdomPoints: 75, favorShields: 1 },
              { id: 'rest', label: '先让他休息恢复', description: '惊魂未定不宜赶路', wisdomPoints: 60 },
            ] },
          { id: 'ch6-s1-st3', tasksRequired: 5, text: '你们一起抵达天空之城，旅人把你推荐给了城主见礼官。',
            options: [
              { id: 'meet', label: '去见识一下城主', description: '结识新的人脉', wisdomPoints: 90 },
              { id: 'decline', label: '婉拒后继续上路', description: '不贪图虚名', wisdomPoints: 75, favorShields: 1 },
            ] },
        ],
      },
      {
        id: 'ch6-s2', chapterId: 6, title: '失控的浮岛', emoji: '☁️',
        intro: '天空之城下方有一座浮岛正在缓缓下沉，岛上还住着几户居民。',
        stages: [
          { id: 'ch6-s2-st1', tasksRequired: 4, text: '你发现浮岛的核心水晶出现了裂痕，这是它失去浮力的原因。',
            options: [
              { id: 'inspect', label: '仔细检查裂痕', description: '判断能否修复', wisdomPoints: 80 },
              { id: 'evacuate', label: '先疏散岛上居民', description: '人命关天', wisdomPoints: 60, favorShields: 1 },
            ] },
          { id: 'ch6-s2-st2', tasksRequired: 5, text: '修复水晶需要一种特殊的云石，城中仓库里也许有存货。',
            options: [
              { id: 'mine', label: '去采集云石', description: '亲力亲为', wisdomPoints: 85, favorShields: 1 },
              { id: 'request', label: '向城主申请调配', description: '走正规流程', wisdomPoints: 70 },
            ] },
          { id: 'ch6-s2-st3', tasksRequired: 5, text: '水晶修复后浮岛重新升起，岛上居民欢呼着向你道谢。',
            options: [
              { id: 'celebrate', label: '和居民一起庆祝', description: '分享这份喜悦', wisdomPoints: 75, favorShields: 1 },
              { id: 'record', label: '记录修复方法', description: '以备将来参考', wisdomPoints: 90 },
            ] },
        ],
      },
    ],
  },
  {
    id: 7,
    title: '星辰大海',
    area: '星之海岸',
    condition: 'streak_days',
    conditionValue: 60,
    bossName: '深海利维坦',
    bossHP: 1200,
    storyText: '穿过云端，你来到了星之海岸。海面倒映着漫天繁星，一条巨大的海蛇从水中跃起——深海利维坦，守护着通往星辰的秘密。',
    bossDefeatedText: '利维坦沉入深海，海面恢复平静。海面上浮现出一条星光铺就的道路，通向宇宙的尽头。',
    options: [
      { id: 'stars', label: '星辰卜算', description: '借星光卜算命运', effect: 'wisdom', wisdomPoints: 180, oneTime: true },
      { id: 'log', label: '观星日志', description: '记录每晚的星象变化', effect: 'wisdom', wisdomPoints: 120 },
      { id: 'guard', label: '星辰守护', description: '向星辰祷告，获得 2 张连续天数护盾', effect: 'favor', favorShields: 2 },
    ],
    sideQuests: [
      {
        id: 'ch7-s1', chapterId: 7, title: '星辰碎片', emoji: '⭐',
        intro: '夜空中坠落几颗闪亮的星辰碎片，它们散落在海岸边，一闪一闪。',
        stages: [
          { id: 'ch7-s1-st1', tasksRequired: 4, text: '碎片散发着微弱的光，靠近时能听见轻柔的嗡鸣。',
            options: [
              { id: 'collect', label: '小心拾起碎片', description: '别伤了手', wisdomPoints: 95 },
              { id: 'listen', label: '聆听它的嗡鸣', description: '也许是一种信号', wisdomPoints: 80, favorShields: 1 },
            ] },
          { id: 'ch7-s1-st2', tasksRequired: 5, text: '你收集到三块碎片，它们拼在一起时指向了海面上的某个方位。',
            options: [
              { id: 'sail', label: '划船前往指示处', description: '看看那里有什么', wisdomPoints: 100, favorShields: 1 },
              { id: 'study', label: '先研究碎片的特性', description: '弄清原理再行动', wisdomPoints: 110 },
            ] },
          { id: 'ch7-s1-st3', tasksRequired: 5, text: '指示处是一座海底星门，碎片嵌入门框后，门内传来悠扬的歌声。',
            options: [
              { id: 'enter', label: '走进星门一探究竟', description: '冒险精神', wisdomPoints: 120 },
              { id: 'close', label: '把碎片取下关好门', description: '有些秘密不该被打扰', wisdomPoints: 95, favorShields: 1 },
            ] },
        ],
      },
      {
        id: 'ch7-s2', chapterId: 7, title: '搁浅的海豚', emoji: '🐬',
        intro: '一只海豚在退潮时搁浅在沙滩上，拼命拍打着尾巴却回不到海里。',
        stages: [
          { id: 'ch7-s2-st1', tasksRequired: 4, text: '海豚皮肤已经开始发干，必须尽快让它回到水里。',
            options: [
              { id: 'water', label: '不断泼水保持湿润', description: '为救援争取时间', wisdomPoints: 80, favorShields: 1 },
              { id: 'push', label: '合力把它推回海里', description: '趁下一个浪头', wisdomPoints: 95 },
            ] },
          { id: 'ch7-s2-st2', tasksRequired: 5, text: '海豚回到浅海却没有游走，它绕着你的船转，像是想带你去什么地方。',
            options: [
              { id: 'follow', label: '划船跟着它', description: '看看它要去哪', wisdomPoints: 105 },
              { id: 'stay', label: '留在原地观察', description: '不贸然跟随', wisdomPoints: 85, favorShields: 1 },
            ] },
          { id: 'ch7-s2-st3', tasksRequired: 5, text: '海豚带你找到一处被渔网困住的小鲸，你解开渔网后它们一起游走了。',
            options: [
              { id: 'free', label: '彻底清理废弃渔网', description: '避免再伤害生灵', wisdomPoints: 110, favorShields: 1 },
              { id: 'watch', label: '目送它们远去', description: '满足地离开', wisdomPoints: 100 },
            ] },
        ],
      },
    ],
  },
  {
    id: 8,
    title: '时间回廊',
    area: '时光圣殿',
    condition: 'knowledge_count',
    conditionValue: 20,
    bossName: '时间守望者',
    bossHP: 1500,
    storyText: '沿着星光之路前行，你来到了时光圣殿。过去与未来在这里交织，时间守望者立于沙漏之旁："凡人，你可知晓时间的重量？"',
    bossDefeatedText: '时间守望者停下了沙漏："你已超越时间的束缚。去吧，去书写属于你自己的永恒。"圣殿深处，一颗永恒之心正在闪耀。',
    options: [
      { id: 'karma', label: '参透因果', description: '在时间长廊里领悟因果', effect: 'wisdom', wisdomPoints: 220, oneTime: true },
      { id: 'notes', label: '撰写时间札记', description: '记录你对时间的感悟', effect: 'wisdom', wisdomPoints: 160 },
      { id: 'vow', label: '永恒盟约', description: '签订永恒盟约，获得 3 张连续天数护盾', effect: 'favor', favorShields: 3 },
    ],
    sideQuests: [
      {
        id: 'ch8-s1', chapterId: 8, title: '童年的自己', emoji: '👶',
        intro: '回廊中浮现一个小小的身影，竟然是你童年的自己——他正抱着一只小狗，请求你带它回家。',
        stages: [
          { id: 'ch8-s1-st1', tasksRequired: 4, text: '童年的你说小狗是从家里偷偷跑出来的，怕被大人责骂，不敢自己回去。',
            options: [
              { id: 'comfort', label: '蹲下来安慰他', description: '让他别害怕', wisdomPoints: 110, favorShields: 1 },
              { id: 'recall', label: '努力回忆这段往事', description: '也许你记得结局', wisdomPoints: 130 },
            ] },
          { id: 'ch8-s1-st2', tasksRequired: 5, text: '你意识到改变过去可能引发不可预知的后果，但又不忍看到童年的自己哭泣。',
            options: [
              { id: 'guide', label: '陪他走回家门口', description: '只送到能看见家的地方', wisdomPoints: 130, favorShields: 1 },
              { id: 'advice', label: '教他如何向大人坦白', description: '授人以渔', wisdomPoints: 145 },
            ] },
          { id: 'ch8-s1-st3', tasksRequired: 5, text: '童年的你破涕为笑，抱着小狗跑向家门，身影渐渐淡去。',
            options: [
              { id: 'smile', label: '微笑着看他离开', description: '与过去的自己和解', wisdomPoints: 140, favorShields: 1 },
              { id: 'reflect', label: '站在原地沉思', description: '时间给你上了一课', wisdomPoints: 155 },
            ] },
        ],
      },
      {
        id: 'ch8-s2', chapterId: 8, title: '未寄出的信', emoji: '✉️',
        intro: '回廊的石台上放着一封泛黄的信，信封上写着一个你不认识的名字，却标注着"请在百年后寄出"。',
        stages: [
          { id: 'ch8-s2-st1', tasksRequired: 4, text: '信没有封口，你犹豫着要不要看——它的主人显然已经不在了。',
            options: [
              { id: 'read', label: '悄悄读一遍', description: '了解这百年的牵挂', wisdomPoints: 135 },
              { id: 'seal', label: '帮他把信封好', description: '尊重隐私', wisdomPoints: 110, favorShields: 1 },
            ] },
          { id: 'ch8-s2-st2', tasksRequired: 5, text: '你得知收信人是写信人早已去世的恋人，这封信永远送不到了。',
            options: [
              { id: 'bury', label: '把信埋在圣殿花园', description: '让它随时间安息', wisdomPoints: 120, favorShields: 1 },
              { id: 'copy', label: '抄一份保留原件', description: '记下这份深情', wisdomPoints: 145 },
            ] },
          { id: 'ch8-s2-st3', tasksRequired: 5, text: '当你处理完信件，回廊里闪过一道温暖的光，仿佛有人在向你道谢。',
            options: [
              { id: 'bow', label: '向光点鞠躬致意', description: '愿逝者安息', wisdomPoints: 130, favorShields: 1 },
              { id: 'continue', label: '继续在回廊探索', description: '还有更多时间之谜', wisdomPoints: 150 },
            ] },
        ],
      },
    ],
  },
  {
    id: 9,
    title: '永恒之心',
    area: '创世神殿',
    condition: 'completed_tasks',
    conditionValue: 300,
    bossName: '混沌之主',
    bossHP: 2500,
    storyText: '你终于来到了创世神殿。混沌之主端坐于虚空王座之上，它是一切混乱的源头，也是你命运的终点。"有趣……真有趣。那就让我看看，你能做到什么程度吧！"',
    bossDefeatedText: '混沌之主化为万千光点，融入了宇宙之中。秩序与混沌重新达到了平衡。而你，已不再只是一个冒险者——你成为了新世界的缔造者。新的冒险，才刚刚开始……',
    options: [
      { id: 'genesis', label: '创世之道', description: '领悟创世与毁灭的平衡之道', effect: 'wisdom', wisdomPoints: 300, oneTime: true },
      { id: 'notes', label: '混沌研究笔记', description: '整理对混沌本质的观察', effect: 'wisdom', wisdomPoints: 220 },
      { id: 'order', label: '秩序守护', description: '立下永恒守护誓言，获得 3 张连续天数护盾', effect: 'favor', favorShields: 3 },
    ],
    sideQuests: [
      {
        id: 'ch9-s1', chapterId: 9, title: '裂隙里的回声', emoji: '🌀',
        intro: '创世神殿的裂隙里不断传来呼喊声，像是被混沌吞噬的文明在求救。',
        stages: [
          { id: 'ch9-s1-st1', tasksRequired: 5, text: '回声杂乱无章，你需要静下心才能分辨出其中的含义。',
            options: [
              { id: 'meditate', label: '盘膝冥想', description: '让声音在心中清晰起来', wisdomPoints: 180 },
              { id: 'record', label: '用符文记录声音', description: '事后慢慢分析', wisdomPoints: 150, favorShields: 1 },
            ] },
          { id: 'ch9-s1-st2', tasksRequired: 6, text: '你听出那是一个古老种族的遗言，他们希望有人能记住他们的存在。',
            options: [
              { id: 'memorize', label: '把他们的名字刻在心间', description: '承诺永不忘记', wisdomPoints: 190, favorShields: 1 },
              { id: 'inscribe', label: '在神殿石壁上刻下记录', description: '让后来者也能知晓', wisdomPoints: 200 },
            ] },
          { id: 'ch9-s1-st3', tasksRequired: 6, text: '回声渐渐平息，裂隙缓缓合拢，那个种族终于得以安息。',
            options: [
              { id: 'mourn', label: '为他们默哀', description: '致以最后的敬意', wisdomPoints: 170, favorShields: 1 },
              { id: 'vow', label: '立下守护文明的誓言', description: '不让悲剧重演', wisdomPoints: 210 },
            ] },
        ],
      },
      {
        id: 'ch9-s2', chapterId: 9, title: '创世的碎片', emoji: '✨',
        intro: '神殿地面散落着几块创世时遗留的碎片，每一块都蕴含着原初的力量。',
        stages: [
          { id: 'ch9-s2-st1', tasksRequired: 5, text: '碎片之间互相排斥又互相吸引，像是在寻找某种排列。',
            options: [
              { id: 'arrange', label: '尝试排列碎片', description: '看会发生什么', wisdomPoints: 190 },
              { id: 'observe', label: '长时间观察规律', description: '先摸清它们的脾性', wisdomPoints: 170, favorShields: 1 },
            ] },
          { id: 'ch9-s2-st2', tasksRequired: 6, text: '当碎片归位，空中浮现出一幅宇宙诞生的全息影像。',
            options: [
              { id: 'study', label: '仔细研究影像', description: '洞悉宇宙的起源', wisdomPoints: 220 },
              { id: 'preserve', label: '想办法保存影像', description: '让它不随碎片消散', wisdomPoints: 180, favorShields: 1 },
            ] },
          { id: 'ch9-s2-st3', tasksRequired: 6, text: '影像结束后碎片化为光点融入你体内，你感到前所未有的清明。',
            options: [
              { id: 'absorb', label: '接纳这份力量', description: '与创世之力共鸣', wisdomPoints: 230 },
              { id: 'release', label: '把力量还归天地', description: '不独占这份馈赠', wisdomPoints: 200, favorShields: 1 },
            ] },
        ],
      },
    ],
  },
  {
    id: 10,
    title: '荒原新芽',
    area: '新芽荒原',
    condition: 'completed_tasks',
    conditionValue: 400,
    bossName: '荒原岩灵',
    bossHP: 3200,
    storyText: '混沌退去后，大陆边缘露出了一片荒芜的焦土。你决定在这里重建家园。可当你犁开第一块土地时，沉睡的荒原岩灵从地底苏醒，它认为开垦会破坏大地的宁静。',
    bossDefeatedText: '岩灵崩解为肥沃的土壤，荒原上冒出了第一抹新绿。你搭起木屋、围起篱笆，家园的雏形就此诞生。',
    options: [
      { id: 'farming', label: '农作之道', description: '研读古老的农作之书', effect: 'wisdom', wisdomPoints: 200, oneTime: true },
      { id: 'diary', label: '农事日志', description: '记录每天的耕作心得', effect: 'wisdom', wisdomPoints: 140 },
      { id: 'home', label: '家园守护', description: '为家园立下守护誓言，获得 2 张连续天数护盾', effect: 'favor', favorShields: 2 },
    ],
    sideQuests: [
      {
        id: 'ch10-s1', chapterId: 10, title: '流浪的种子', emoji: '🌱',
        intro: '风带来一颗奇异的种子，它也许是新家园的第一株果树。',
        stages: [
          { id: 'ch10-s1-st1', tasksRequired: 4, text: '种子的外壳很硬，普通的土埋进去似乎无法让它发芽。',
            options: [
              { id: 'crack', label: '轻轻嗑开外壳', description: '帮助它破壳', wisdomPoints: 120 },
              { id: 'soak', label: '用温水浸泡一天', description: '唤醒它的生机', wisdomPoints: 100, favorShields: 1 },
            ] },
          { id: 'ch10-s1-st2', tasksRequired: 5, text: '种子冒出了嫩芽，但它似乎对土壤的要求很挑剔。',
            options: [
              { id: 'soil', label: '调配特制营养土', description: '满足它的口味', wisdomPoints: 140, favorShields: 1 },
              { id: 'compost', label: '制作有机堆肥', description: '慢慢改善土质', wisdomPoints: 120 },
            ] },
          { id: 'ch10-s1-st3', tasksRequired: 5, text: '嫩芽长成了一棵挂满奇异果实的小树，成为新家园的标志。',
            options: [
              { id: 'tend', label: '每天精心照料', description: '让它茁壮成长', wisdomPoints: 130, favorShields: 1 },
              { id: 'share', label: '把果实分给邻里', description: '分享这份新生', wisdomPoints: 150 },
            ] },
        ],
      },
      {
        id: 'ch10-s2', chapterId: 10, title: '第一口井', emoji: '🪣',
        intro: '新家园缺水，你决定挖一口井，但荒原的土层坚硬，挖了几天都没见水。',
        stages: [
          { id: 'ch10-s2-st1', tasksRequired: 4, text: '你发现某处的泥土比别处湿润，也许地下有暗河。',
            options: [
              { id: 'dig', label: '换个地方重新挖', description: '跟着湿土走', wisdomPoints: 120, favorShields: 1 },
              { id: 'divine', label: '用探测术找水脉', description: '更科学地定位', wisdomPoints: 135 },
            ] },
          { id: 'ch10-s2-st2', tasksRequired: 5, text: '挖到一定深度时井壁开始渗水，但土质松散有塌方危险。',
            options: [
              { id: 'reinforce', label: '用石块加固井壁', description: '防止塌方', wisdomPoints: 130, favorShields: 1 },
              { id: 'lining', label: '烧制陶片衬砌', description: '一劳永逸', wisdomPoints: 145 },
            ] },
          { id: 'ch10-s2-st3', tasksRequired: 5, text: '清冽的井水终于涌了上来，新家园的生命线就此打通。',
            options: [
              { id: 'celebrate', label: '和邻居们共饮第一瓢水', description: '共享甘甜', wisdomPoints: 125, favorShields: 1 },
              { id: 'plan', label: '规划用水水渠', description: '让水惠及更多土地', wisdomPoints: 150 },
            ] },
        ],
      },
    ],
  },
  {
    id: 11,
    title: '金色麦田',
    area: '丰收平原',
    condition: 'knowledge_count',
    conditionValue: 30,
    bossName: '蝗灾领主',
    bossHP: 4200,
    storyText: '家园的麦田一望无际，金黄的麦浪随风起伏。就在丰收前夕，遮天蔽日的蝗群席卷而来，蝗灾领主落在麦田中央，发出刺耳的嘶鸣。',
    bossDefeatedText: '蝗群散去，麦田保住了。你加固了粮仓、修好了风车，丰收的喜悦传遍了新家园。',
    options: [
      { id: 'harvest', label: '丰收之道', description: '学习丰收的秘密', effect: 'wisdom', wisdomPoints: 240, oneTime: true },
      { id: 'notes', label: '麦田观察录', description: '记录作物生长的规律', effect: 'wisdom', wisdomPoints: 180 },
      { id: 'windmill', label: '风车守护', description: '加固风车守护家园，获得 3 张连续天数护盾', effect: 'favor', favorShields: 3 },
    ],
    sideQuests: [
      {
        id: 'ch11-s1', chapterId: 11, title: '迷路的羊群', emoji: '🐑',
        intro: '你在麦田边发现一群迷路的羊，它们看起来饿坏了。',
        stages: [
          { id: 'ch11-s1-st1', tasksRequired: 4, text: '羊群的毛色参差不齐，显然流浪了很久，还混入了一只受伤的小羊。',
            options: [
              { id: 'feed', label: '取些草料喂它们', description: '先解决温饱', wisdomPoints: 135, favorShields: 1 },
              { id: 'heal', label: '先医治受伤的小羊', description: '优先处理伤势', wisdomPoints: 150 },
            ] },
          { id: 'ch11-s1-st2', tasksRequired: 5, text: '你在一只领头羊的脖子上发现了名牌，上面写着邻村的地址。',
            options: [
              { id: 'send', label: '亲自把羊送回邻村', description: '善始善终', wisdomPoints: 155, favorShields: 1 },
              { id: 'message', label: '托人捎信给主人', description: '让主人来认领', wisdomPoints: 130 },
            ] },
          { id: 'ch11-s1-st3', tasksRequired: 5, text: '邻村主人感激不尽，执意要送你一只刚出生的小羊羔作为谢礼。',
            options: [
              { id: 'accept', label: '收下小羊羔', description: '为家园添丁', wisdomPoints: 140, favorShields: 1 },
              { id: 'refuse', label: '婉拒并帮忙建栅栏', description: '用劳动代替谢礼', wisdomPoints: 160 },
            ] },
        ],
      },
      {
        id: 'ch11-s2', chapterId: 11, title: '坏掉的风车', emoji: '🌾',
        intro: '丰收在即，用来磨面的风车却突然停转，全村的麦子都等着加工。',
        stages: [
          { id: 'ch11-s2-st1', tasksRequired: 4, text: '你检查发现是主齿轮崩裂了，这种部件需要重新铸造。',
            options: [
              { id: 'forge', label: '生炉重铸齿轮', description: '亲手打造', wisdomPoints: 150, favorShields: 1 },
              { id: 'order', label: '去邻镇订购新件', description: '更稳妥但费时', wisdomPoints: 130 },
            ] },
          { id: 'ch11-s2-st2', tasksRequired: 5, text: '齿轮换好后，风车又能转了，但磨出的面总夹杂着细沙。',
            options: [
              { id: 'sieve', label: '增设一道筛面工序', description: '过滤杂质', wisdomPoints: 140, favorShields: 1 },
              { id: 'clean', label: '彻底清理磨盘缝隙', description: '从源头解决', wisdomPoints: 155 },
            ] },
          { id: 'ch11-s2-st3', tasksRequired: 5, text: '面粉终于又白又细，村民们排队磨面，脸上都是丰收的笑容。',
            options: [
              { id: 'maintain', label: '制定风车保养计划', description: '防患于未然', wisdomPoints: 160 },
              { id: 'bread', label: '用新面烤一炉面包', description: '和大家分享', wisdomPoints: 135, favorShields: 1 },
            ] },
        ],
      },
    ],
  },
  {
    id: 12,
    title: '秩序之城',
    area: '家园之城',
    condition: 'completed_tasks',
    conditionValue: 600,
    bossName: '混沌残影',
    bossHP: 5500,
    storyText: '田地和屋舍渐渐连成了城镇，越来越多的旅人在这里定居。就在你为新城奠基的那天，混沌的残影从地底涌出，想要摧毁你亲手建立的一切。',
    bossDefeatedText: '残影消散，钟楼敲响了第一声。秩序之城在阳光下拔地而起，成为所有冒险者共同的家园。',
    options: [
      { id: 'city', label: '城池之道', description: '参悟建城的终极智慧', effect: 'wisdom', wisdomPoints: 400, oneTime: true },
      { id: 'journal', label: '建城手札', description: '记录从荒原到城市的历程', effect: 'wisdom', wisdomPoints: 280 },
      { id: 'all', label: '全城守护', description: '召集全城居民立下守护誓言，获得 3 张连续天数护盾', effect: 'favor', favorShields: 3 },
    ],
    sideQuests: [
      {
        id: 'ch12-s1', chapterId: 12, title: '最后的守夜人', emoji: '🕯',
        intro: '钟楼的地下室里有一位年迈的守夜人，他说自己守卫着一扇不能打开的门。',
        stages: [
          { id: 'ch12-s1-st1', tasksRequired: 5, text: '守夜人年迈体弱，但他坚持要日夜守在门前，不肯离开半步。',
            options: [
              { id: 'help', label: '替他值几个夜班', description: '让他能休息一下', wisdomPoints: 200, favorShields: 1 },
              { id: 'chat', label: '听他讲这扇门的来历', description: '了解背后的故事', wisdomPoints: 220 },
            ] },
          { id: 'ch12-s1-st2', tasksRequired: 6, text: '你得知门后封印着一缕混沌残响，守夜人家族世代看守，如今只剩他一人。',
            options: [
              { id: 'vow', label: '立誓接过守夜职责', description: '让传承延续下去', wisdomPoints: 240, favorShields: 1 },
              { id: 'seal', label: '帮忙加固门上的封印', description: '减轻守夜人的负担', wisdomPoints: 220 },
            ] },
          { id: 'ch12-s1-st3', tasksRequired: 6, text: '守夜人含泪把家族信物交给你，自己终于安心地闭上了眼，面容安详。',
            options: [
              { id: 'honor', label: '为他举办简朴的葬礼', description: '送别最后一代守夜人', wisdomPoints: 210, favorShields: 1 },
              { id: 'inherit', label: '郑重接过信物继续值守', description: '他的使命由你完成', wisdomPoints: 250 },
            ] },
        ],
      },
      {
        id: 'ch12-s2', chapterId: 12, title: '新城的第一座学堂', emoji: '🏫',
        intro: '越来越多孩子在秩序之城出生，居民们希望建一座学堂，却没人愿意出面主持。',
        stages: [
          { id: 'ch12-s2-st1', tasksRequired: 5, text: '选址和木料都已就绪，但没人知道该教孩子们些什么。',
            options: [
              { id: 'curriculum', label: '制定一套启蒙课程', description: '识字、算术、自然', wisdomPoints: 220 },
              { id: 'invite', label: '去邀请一位游学先生', description: '专业的事交给专业的人', wisdomPoints: 200, favorShields: 1 },
            ] },
          { id: 'ch12-s2-st2', tasksRequired: 6, text: '学堂开学了，可孩子们天性好动，坐不住，家长们开始抱怨。',
            options: [
              { id: 'fun', label: '把课上得更有趣', description: '寓教于乐', wisdomPoints: 230, favorShields: 1 },
              { id: 'rules', label: '和家长们沟通立规矩', description: '家校配合', wisdomPoints: 210 },
            ] },
          { id: 'ch12-s2-st3', tasksRequired: 6, text: '一年后，第一批孩子结业，他们在学堂门口齐声向你道谢。',
            options: [
              { id: 'expand', label: '继续扩建学堂', description: '让更多孩子受益', wisdomPoints: 240 },
              { id: 'attend', label: '参加他们的结业礼', description: '见证这一时刻', wisdomPoints: 220, favorShields: 1 },
            ] },
        ],
      },
    ],
  },
];
