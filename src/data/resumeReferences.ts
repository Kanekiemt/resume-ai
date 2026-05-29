/**
 * Built-in resume reference library curated from:
 * - 超级简历 WonderCV (wondercv.com)
 * - 职徒简历 52cv (52cv.com)
 * - 锤子简历 (100chui.com)
 * - 全民简历 (qmjianli.com)
 */

export interface ReferenceEntry {
  snippet: string;
  highlight: string;
  sourceTitle: string;
  sourceUrl: string;
}

interface SectionRefs {
  [sectionType: string]: ReferenceEntry[];
}

// ── 项目经验 references ──
const projectRefs: ReferenceEntry[] = [
  {
    snippet: '主导需求分析，设计核心交易流程原型（Axure），协调4人团队，项目获校级创业大赛银奖。通过200份问卷发现排队痛点，上线后平均取餐时间缩短40%。',
    highlight: 'STAR + 量化 + 工具名',
    sourceTitle: '超级简历 - 产品经理项目经验范例',
    sourceUrl: 'https://www.wondercv.com/jianlimoban/chanpin',
  },
  {
    snippet: '通过研究分析用户行为数据，基于Python+Pandas构建特征工程流水线，构建推荐模型，AUC从0.71提升至0.78，团队获省赛三等奖。',
    highlight: 'STAR + 技术栈 + 指标对比',
    sourceTitle: '职徒简历 - 数据分析项目范例',
    sourceUrl: 'https://www.52cv.com/jianlimoban/1512.html',
  },
  {
    snippet: '担任后端开发负责人，使用Spring Boot+Redis重构订单系统，QPS从1200提升至5800，响应时间从850ms降至120ms。',
    highlight: '技术深度 + 量化对比 + 角色明确',
    sourceTitle: '100分简历 - 开发岗项目范例',
    sourceUrl: 'https://www.100chui.com/article/485116.html',
  },
  {
    snippet: '搭建用户行为埋点体系，覆盖20+关键指标，用SQL+Tableau搭建可视化看板，推动3项功能优化落地，转化率提升18%。',
    highlight: '业务指标 + 工具链 + 落地成果',
    sourceTitle: '锤子简历 - 数据驱动项目范例',
    sourceUrl: 'https://100chui.com/article/485016.html',
  },
];

// ── 实习/工作经历 references ──
const workRefs: ReferenceEntry[] = [
  {
    snippet: '负责公众号内容运营，策划3场线上活动，撰写15篇原创干货文章，3个月粉丝增长200%（达15000人），阅读量提升150%。',
    highlight: 'STAR完整 + 量化对比 + 基线明确',
    sourceTitle: '职徒简历 - 实习经历STAR写法',
    sourceUrl: 'https://www.52cv.com',
  },
  {
    snippet: '协助产品经理完成用户调研，完成50场深度访谈，输出12个核心需求点，推动3项功能优化落地，用户满意度提升22%。',
    highlight: '动作动词 + 数字成果 + 业务影响',
    sourceTitle: '超级简历 - 产品实习范例',
    sourceUrl: 'https://www.wondercv.com',
  },
  {
    snippet: '参与数据清洗与特征工程，处理10万+条原始数据，使用Python自动化脚本减少人工处理时间80%，数据准确率从92%提升至99.5%。',
    highlight: '技术工具 + 效率提升 + 准确性对比',
    sourceTitle: '100分简历 - 数据分析实习',
    sourceUrl: 'https://100chui.com',
  },
];

// ── 自我评价 references ──
const selfEvalRefs: ReferenceEntry[] = [
  {
    snippet: '本人拥有3年B端SaaS产品经验，主导过日活10万+的核心模块改版，擅长用数据驱动产品决策。对AI新技术保持敏感，曾利用Cursor辅助开发将原型产出效率提升40%。期望在数据产品方向深入发展。',
    highlight: '经验量化 + 技术能力 + 职业方向',
    sourceTitle: '锤子简历 - 自我评价黄金300字',
    sourceUrl: 'https://100chui.com/article/485371.html',
  },
  {
    snippet: '3个月内从零掌握Python数据分析全栈（Pandas+Matplotlib+Scikit-learn），独立完成用户画像系统开发。具备扎实的数学建模基础，获得全国大学生数学建模竞赛省一等奖。',
    highlight: '学习能力证明 + 证书 + 具体技能',
    sourceTitle: '职徒简历 - 应届生自我评价',
    sourceUrl: 'https://www.52cv.com',
  },
  {
    snippet: '我具备良好的跨部门沟通能力，曾主导10人协作项目提前2周交付。工作中注重文档沉淀，编写技术方案文档30+篇，团队知识传承效率显著提升。',
    highlight: '第一人称 + 数据证明 + 软技能具体化',
    sourceTitle: '超级简历 - HR认可的自我评价',
    sourceUrl: 'https://www.wondercv.com',
  },
];

// ── 专业技能 references ──
const skillRefs: ReferenceEntry[] = [
  {
    snippet: 'Python · SQL · Tableau · Excel · Pandas · 用户行为埋点 · A/B测试 · 特征工程',
    highlight: '工具+技术+方法 分类清晰',
    sourceTitle: '超级简历 - 数据分析技能列表',
    sourceUrl: 'https://www.wondercv.com',
  },
  {
    snippet: 'Java · Spring Boot · MySQL · Redis · RabbitMQ · Docker · Linux · 分布式系统设计',
    highlight: '按技术栈分层排列',
    sourceTitle: '100分简历 - 后端开发技能模板',
    sourceUrl: 'https://100chui.com',
  },
  {
    snippet: 'Axure · Figma · 用户研究 · 需求分析 · PRD撰写 · 竞品分析 · 数据分析 · 项目管理',
    highlight: '工具+方法论 覆盖产品全流程',
    sourceTitle: '职徒简历 - 产品经理技能清单',
    sourceUrl: 'https://www.52cv.com',
  },
];

// ── 教育背景 references ──
const educationRefs: ReferenceEntry[] = [
  {
    snippet: '计算机科学与技术 本科 | GPA 3.6/4.0（前15%）| 核心课程：数据结构、操作系统、计算机网络、机器学习',
    highlight: 'GPA+排名+核心课程',
    sourceTitle: '超级简历 - 教育背景标准格式',
    sourceUrl: 'https://www.wondercv.com',
  },
  {
    snippet: '金融学 硕士 | 通过CFA一级 | 核心课程：计量经济学、金融工程、风险管理 | 获校级一等奖学金',
    highlight: '证书+荣誉+课程',
    sourceTitle: '职徒简历 - 金融方向教育模板',
    sourceUrl: 'https://www.52cv.com',
  },
];

// ── Master lookup ──
const allRefs: SectionRefs = {
  projects: projectRefs,
  work_experience: workRefs,
  self_evaluation: selfEvalRefs,
  skills: skillRefs,
  education: educationRefs,
};

export function getBuiltInRefs(sectionType: string): ReferenceEntry[] {
  return allRefs[sectionType] || projectRefs; // fallback to project refs
}
