export type SystemRole = "master" | "division" | "manager" | "teacher";
export type StaffRole = SystemRole | "staff";

export type StaffMember = {
  id: string;
  name: string;
  position: string;
  division: string;
  department: string;
  role: StaffRole;
  evaluationEligible: boolean;
  status: "Active" | "Absent";
};

export const STAFF: StaffMember[] = [
  {id:"s1",name:"兰天笑 Tim Lan",position:"全校校长 Head of School",division:"SLT",department:"SLT",role:"master",evaluationEligible:false,status:"Absent"},
  {id:"s2",name:"曾令轩",position:"中方校长 Chinese Principal",division:"SLT",department:"SLT",role:"division",evaluationEligible:false,status:"Active"},
  {id:"s3",name:"Alex Callow",position:"小学部校长 Primary Principal",division:"SLT",department:"SLT",role:"division",evaluationEligible:false,status:"Active"},
  {id:"s4",name:"祖文彬 Zoe Zu",position:"中学部校长 & 分管CCA MS Principal & Director of CCA",division:"SLT",department:"SLT",role:"division",evaluationEligible:false,status:"Active"},
  {id:"s5",name:"孙碧清Sunny Sun",position:"高中部校长 High School Principal",division:"SLT",department:"SLT",role:"division",evaluationEligible:false,status:"Active"},
  {id:"s6",name:"梁明慧 Sammy Liang",position:"小学部主任 Director of Primary Teaching and Learning",division:"Primary",department:"Division",role:"division",evaluationEligible:false,status:"Active"},
  {id:"s7",name:"陈薪如 Rebecca Chen",position:"小学语文教师 Primary Chinese Teacher",division:"Primary",department:"语文组Chinese Group",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s8",name:"裴翠云 Priscilla Pei",position:"小学语文教师Chinese Teacher",division:"Primary",department:"语文组Chinese Group",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s9",name:"宋婷雪Cynthia Song",position:"小学语文教师Chinese Teacher",division:"Primary",department:"语文组Chinese Group",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s10",name:"Andrew Nesbit",position:"小学英语协调员&英语教师 Primary English Coordinator&English Teacher",division:"Primary",department:"英语组English",role:"manager",evaluationEligible:true,status:"Active"},
  {id:"s11",name:"杨亚雅Yaya Yang",position:"英语教师EAL Teacher",division:"Primary",department:"英语组English",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s12",name:"范颖Fanny Fan",position:"英语教师English Teacher",division:"Primary",department:"英语组English",role:"teacher",evaluationEligible:true,status:"Absent"},
  {id:"s13",name:"Ben Wilkinson",position:"英语/科学教师 English& Science Teacher",division:"Primary",department:"英语组English",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s14",name:"邱念Nina Qiu",position:"小学数学协调员&数学教师 Priamry Maths Coordinator&Maths Teacher",division:"Primary",department:"数学组 Maths Group",role:"manager",evaluationEligible:true,status:"Active"},
  {id:"s15",name:"邹东利 Rebecca Zou",position:"小学低段数学教师 Math Teacher in Lower Primary",division:"Primary",department:"数学组 Maths Group",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s16",name:"段小青Cindy Duan",position:"数学教师Maths Teacher",division:"Primary",department:"数学组 Maths Group",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s17",name:"阿力娜·买买提 Alina",position:"科学教师Science Teacher+ STEAM",division:"Primary",department:"科学组Science Group",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s18",name:"黄蕊Michelle Huang",position:"科学教师Science Teacher+ STEAM",division:"Primary",department:"科学组Science Group",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s19",name:"王珂涵Kira wang",position:"小一班教师 Pre-School Teacher",division:"Primary",department:"Pre-school小一班",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s20",name:"冯长华Changhua Feng",position:"生活教师Life Teacher",division:"Primary",department:"Pre-school小一班",role:"staff",evaluationEligible:false,status:"Active"},
  {id:"s21",name:"向靖 Jing Xiang",position:"助教TF",division:"Primary",department:"TF group助教组",role:"staff",evaluationEligible:false,status:"Absent"},
  {id:"s22",name:"朱寅耘 Tiffany Zhu",position:"助教TF",division:"Primary",department:"TF group助教组",role:"staff",evaluationEligible:false,status:"Active"},
  {id:"s23",name:"彭丹Heidi Peng",position:"图书馆管理员Librarian",division:"Primary",department:"Library图书馆",role:"staff",evaluationEligible:false,status:"Active"},
  {id:"s24",name:"田秀娟 Jessie Tian",position:"小学部关顾协调员 Primary Pastoral Care Coordinator",division:"Primary",department:"学生支持 Students Support",role:"manager",evaluationEligible:false,status:"Active"},
  {id:"s25",name:"郎诩珊 Echo Lang",position:"初高中语文协调员 & 语文教师 MS & HS Chinese Coordinator & ChineseTeacher",division:"Middle School",department:"语文人文组Chinese&Humanities",role:"manager",evaluationEligible:true,status:"Active"},
  {id:"s26",name:"邓丰兰Anna Deng",position:"中小学人文协调员 & 中文人文教师 Primary and MS Humanities Coordinator & Humanities Teacher",division:"Middle School",department:"语文人文组Chinese&Humanities",role:"manager",evaluationEligible:true,status:"Active"},
  {id:"s27",name:"树林娜Selina Shu",position:"人文教师Humanities Teacher",division:"Middle School",department:"语文人文组Chinese&Humanities",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s28",name:"Simon Delaney",position:"英语教师English Teacher",division:"Middle School",department:"英语组English",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s29",name:"秦培培Amy Qin",position:"初中部英语协调员&英语教师 MS English Coordinator & English Teacher",division:"Middle School",department:"英语组English",role:"manager",evaluationEligible:true,status:"Active"},
  {id:"s30",name:"陈少玲Clare Chen",position:"英语教师English Teacher",division:"Middle School",department:"英语组English",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s31",name:"郜慧婷Cathryn Gao",position:"中学部教学主任 & 中学部数学&经济&计算机课程课程协调员&数学教师 Teaching and Learning Director in MS & Secondary School Maths & Economics & CS subject Coordinator& Math Teacher",division:"Middle School",department:"数学经济组 Maths & Economics",role:"manager",evaluationEligible:true,status:"Active"},
  {id:"s32",name:"唐丹洋Dora Tang",position:"数学教师Math teacher",division:"Middle School",department:"数学经济组 Maths & Economics",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s33",name:"程颖芳 Evelyn Cheng",position:"数学教师 Math Teacher",division:"Middle School",department:"数学经济组 Maths & Economics",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s34",name:"钟宇欣Holly Zhong",position:"数学教师 Math Teacher",division:"Middle School",department:"数学经济组 Maths & Economics",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s35",name:"李媛媛Echo Li",position:"小学科学协调员& G1-8 STEAM Coordinator & ICT Teacher Primary Science Coordinator&G1-8 STEAM协调员&ICT 教师",division:"Middle School",department:"科学组Science Group",role:"manager",evaluationEligible:true,status:"Active"},
  {id:"s36",name:"周燕平 Annie Zhou",position:"生物教师Biology Teacher",division:"Middle School",department:"科学组Science Group",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s37",name:"郑洪梅 May Zheng",position:"初高中德育关顾协调员 MS & HS Pastoral Care Coordinator",division:"Middle School",department:"学生支持 Students Support",role:"manager",evaluationEligible:false,status:"Active"},
  {id:"s38",name:"Gordon Peer",position:"AP教师兼辩论与演讲区域总监 AP Teacher and Regional Director of Debate & Public Speaking",division:"High School",department:"WSDA",role:"teacher",evaluationEligible:true,status:"Absent"},
  {id:"s39",name:"兰婷 Lan Ting",position:"高中部助理校长（分管巅峰项目）",division:"High School",department:"WSDA",role:"division",evaluationEligible:false,status:"Active"},
  {id:"s40",name:"王思惟Siwei Wang",position:"语文教师 Chinese Teacher",division:"High School",department:"语文人文组Chinese&Humanities",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s41",name:"庄童Frankie Zhuang",position:"语文教师Chinese teacher",division:"High School",department:"语文人文组Chinese&Humanities",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s42",name:"汪宇恒Sherry Wang",position:"行政办公室副主任 & 人文教师 Deputy Director of school office & Humanities Teacher",division:"High School",department:"语文人文组Chinese&Humanities",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s43",name:"Heys Wolfenden",position:"英语组主任 & 英语教师 Head of English & English Teacher",division:"High School",department:"英语组English",role:"manager",evaluationEligible:true,status:"Active"},
  {id:"s44",name:"Paul Theodore Williams",position:"英语教师English Teacher",division:"High School",department:"英语组English",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s45",name:"Alastair Gold",position:"英语教师English Teacher",division:"High School",department:"英语组English",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s46",name:"董应馨 Meg Dong",position:"英语教师English Teacher",division:"High School",department:"英语组English",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s47",name:"熊伊第Yidi Xiong",position:"数学教师Math Teacher",division:"High School",department:"数学经济组 Maths & Economics",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s48",name:"陈露Chen Lu",position:"经济学教师Economics Teacher",division:"High School",department:"数学经济组 Maths & Economics",role:"teacher",evaluationEligible:true,status:"Absent"},
  {id:"s49",name:"赵静 Skylar Zhao",position:"经济学教师Economics Teacher",division:"High School",department:"数学经济组 Maths & Economics",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s50",name:"王诚逸 Conan Wang",position:"经济学教师Economics Teacher",division:"High School",department:"数学经济组 Maths & Economics",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s51",name:"廖曦Liz Liao",position:"经济学教师Economics Teacher",division:"High School",department:"数学经济组 Maths & Economics",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s52",name:"Behnam Akbari",position:"计算机科学教师 & 数学教师 Computer Science Teacher & Math Teacher",division:"High School",department:"数学经济组 Maths & Economics",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s53",name:"王尧 Kelvin Wang",position:"数学教师 & 巅峰项目助理 Math teacher & Assistant of Summit Programme",division:"High School",department:"数学经济组 Maths & Economics",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s54",name:"潘明越Ryan Pan",position:"数学教师Math Teacher",division:"High School",department:"数学经济组 Maths & Economics",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s55",name:"刘镠Thomas Liu",position:"高中部助理校长& 物理教师 Assistant Principal of High School & Physics Teacher",division:"High School",department:"科学计算机组 Science & Computer Science",role:"division",evaluationEligible:true,status:"Active"},
  {id:"s56",name:"黄颖 Clare Huang",position:"生物教师Biology Teacher",division:"High School",department:"科学计算机组 Science & Computer Science",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s57",name:"胡骏婷 Doria hu",position:"物理教师&科学组协调员 Physics Teacher&Science Coordinator",division:"High School",department:"科学计算机组 Science & Computer Science",role:"manager",evaluationEligible:true,status:"Active"},
  {id:"s58",name:"贺锦强 Adrian He",position:"物理教师Physics Teacher",division:"High School",department:"科学计算机组 Science & Computer Science",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s59",name:"耿朋 Peng Geng",position:"物理计算机老师 Physics/ Computer Science Teacher",division:"High School",department:"科学计算机组 Science & Computer Science",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s60",name:"Angel Tan",position:"生物教师 Biology Teacher",division:"High School",department:"科学计算机组 Science & Computer Science",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s61",name:"刘奥Kate Liu",position:"化学教师Chemistry Teacher",division:"High School",department:"科学计算机组 Science & Computer Science",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s62",name:"王亚超Carrie Wang",position:"化学教师Chemistry Teacher",division:"High School",department:"科学计算机组 Science & Computer Science",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s63",name:"罗思桂Luna Luo",position:"实验室技术员Lab Tech",division:"High School",department:"科学计算机组 Science & Computer Science",role:"staff",evaluationEligible:false,status:"Active"},
  {id:"s64",name:"刘春梅Molly Liu",position:"实验室技术员Lab Tech",division:"High School",department:"科学计算机组 Science & Computer Science",role:"staff",evaluationEligible:false,status:"Absent"},
  {id:"s65",name:"张婷 Summer Zhang",position:"升学指导协调员College Counselor Coordinator",division:"High School",department:"升学指导 College Counseling",role:"manager",evaluationEligible:false,status:"Active"},
  {id:"s66",name:"林恩恩Ann Lin",position:"升学指导主任 Head of College Counselor",division:"High School",department:"升学指导 College Counseling",role:"manager",evaluationEligible:false,status:"Active"},
  {id:"s67",name:"Argyrios Kampanos",position:"艺术总监&音乐教师 Director of Arts & Music Teacher",division:"Cross-Divisional",department:"艺术组 Art Group",role:"manager",evaluationEligible:true,status:"Active"},
  {id:"s68",name:"Sharon Lambayong",position:"音乐教师 Music Teacher",division:"Cross-Divisional",department:"艺术组 Art Group",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s69",name:"钟琳迪Bonny Zhong",position:"美术教师 Art Teacher",division:"Cross-Divisional",department:"艺术组 Art Group",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s70",name:"张凌霄Eric Zhang",position:"美术教师 Art Teacher",division:"Cross-Divisional",department:"艺术组 Art Group",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s71",name:"Simon Poole",position:"美术组协调员 & 美术教师 Art Coordinaor & Art Teacher",division:"Cross-Divisional",department:"艺术组 Art Group",role:"manager",evaluationEligible:true,status:"Active"},
  {id:"s72",name:"Kevin Kinney",position:"戏剧教师 Drama Teacher",division:"Cross-Divisional",department:"艺术组 Art Group",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s73",name:"Michael Gary Greenwood",position:"戏剧老师Drama Teacher",division:"Cross-Divisional",department:"艺术组 Art Group",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s74",name:"胡静 Miley Hu",position:"音乐助教 Music TF",division:"Cross-Divisional",department:"艺术组 Art Group",role:"staff",evaluationEligible:false,status:"Active"},
  {id:"s75",name:"Bryce Pearson",position:"体育组组长 Director of Sports",division:"Cross-Divisional",department:"体育组 PE",role:"manager",evaluationEligible:false,status:"Active"},
  {id:"s76",name:"张朝健 Jack Zhang",position:"体育教师PE Teacher",division:"Cross-Divisional",department:"体育组 PE",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s77",name:"Vitor Hugo Machado",position:"体育教师PE Teacher",division:"Cross-Divisional",department:"体育组 PE",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s78",name:"三金初Jacey San",position:"体育教师PE Teacher",division:"Cross-Divisional",department:"体育组 PE",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s79",name:"李锐灵 Shirley Lee",position:"学生发展中心主任 Head of Student Development Center",division:"Cross-Divisional",department:"学生发展中心 Student Development",role:"staff",evaluationEligible:false,status:"Active"},
  {id:"s80",name:"罗梦莹 Romin Luo",position:"心理咨询教师Mental Health Teacher",division:"Cross-Divisional",department:"学生发展中心 Student Development",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s81",name:"Abdallah Khaleel",position:"特殊教育教师SEN Teacher",division:"Cross-Divisional",department:"学生发展中心 Student Development",role:"teacher",evaluationEligible:true,status:"Active"},
  {id:"s82",name:"王月 Cynthia Wang",position:"英语学习支持中心主任 Director of the English Language Learning Support Center",division:"Cross-Divisional",department:"英语学习支持中心 English Language Learning Support Center",role:"staff",evaluationEligible:false,status:"Active"},
  {id:"s83",name:"熊婷 Belle Xiong",position:"小学1-4年级寄宿部项目（联合）总监 Director of Boarding Operations ( G1-G4)",division:"Cross-Divisional",department:"寄宿部 Boarding",role:"staff",evaluationEligible:false,status:"Active"},
  {id:"s84",name:"李晴空 Lily Li",position:"寄宿导师兼寄宿导师协调员 Boarding Coordinator and Boarding tutor",division:"Cross-Divisional",department:"寄宿部 Boarding",role:"manager",evaluationEligible:false,status:"Active"},
  {id:"s85",name:"王凡 Cathy Wang",position:"寄宿导师Boarding Tutor",division:"Cross-Divisional",department:"寄宿部 Boarding",role:"staff",evaluationEligible:false,status:"Active"},
  {id:"s86",name:"沈驿 Harry Shen",position:"寄宿导师Boarding Tutor",division:"Cross-Divisional",department:"寄宿部 Boarding",role:"staff",evaluationEligible:false,status:"Active"},
  {id:"s87",name:"刘春月Liu Chunyue",position:"寄宿导师Boarding Tutor",division:"Cross-Divisional",department:"寄宿部 Boarding",role:"staff",evaluationEligible:false,status:"Active"},
  {id:"s88",name:"向咏梅 May Xiang",position:"寄宿导师Boarding Tutor",division:"Cross-Divisional",department:"寄宿部 Boarding",role:"staff",evaluationEligible:false,status:"Active"},
  {id:"s89",name:"刘民涛 Maria Liu",position:"寄宿导师Boarding Tutor",division:"Cross-Divisional",department:"寄宿部 Boarding",role:"staff",evaluationEligible:false,status:"Active"}
];

export const ROLE_USERS: Record<SystemRole, StaffMember> = {
  master: STAFF.find((s) => s.id === "s1")!,
  division: STAFF.find((s) => s.id === "s5")!,
  manager: STAFF.find((s) => s.id === "s31")!,
  teacher: STAFF.find((s) => s.id === "s47")!,
};

export const FRAMEWORK = {
  academicYear: "2026–27",
  observationsRequired: 3,
  lessonPlanRequired: true,
  feedbackDueDays: 3,
  reflectionDueDays: 5,
  developmentGoalRequired: true,
  followUpRequired: true,
  windows: [
    { id: "w1", label: "Observation 1", range: "Sep–Nov", due: "30 Nov 2026" },
    { id: "w2", label: "Observation 2", range: "Jan–Mar", due: "31 Mar 2027" },
    { id: "w3", label: "Observation 3", range: "Apr–Jun", due: "18 Jun 2027" },
  ],
};

export const MATH_OUTCOMES = [
  "Calculate the gradient of a straight line from coordinates or a graph.",
  "Interpret positive, negative and zero gradient in mathematical and contextual situations.",
  "Use and interpret equations of straight-line graphs, including the relationship between gradient and the coefficient of x.",
  "Use coordinate geometry to solve problems involving straight lines."
];

export type DemoEvaluationStatus = "Complete" | "Scheduled" | "Overdue" | "Feedback due" | "Reflection due" | "Not yet due";

export function demoStatus(member: StaffMember, offset = 0): DemoEvaluationStatus {
  const n = Number(member.id.slice(1)) + offset;
  return ["Complete", "Complete", "Scheduled", "Feedback due", "Reflection due", "Overdue", "Not yet due"][n % 7] as DemoEvaluationStatus;
}

export function eligibleStaff(division?: string) {
  return STAFF.filter((s) => s.evaluationEligible && s.status === "Active" && (!division || s.division === division));
}

export function departmentSummary(division: string) {
  const people = eligibleStaff(division);
  const groups = new Map<string, StaffMember[]>();
  for (const person of people) groups.set(person.department, [...(groups.get(person.department) ?? []), person]);
  return [...groups.entries()].map(([department, members]) => {
    const completed = members.filter((m) => demoStatus(m) === "Complete").length;
    const overdue = members.filter((m) => demoStatus(m) === "Overdue").length;
    return { department, members, completed, overdue, percent: Math.round((completed / Math.max(1, members.length)) * 100) };
  });
}
