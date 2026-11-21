const storageKey = 'workguide.v1';

export const examples = [
  {
    title: '科学作业',
    description: '整理截止时间和提交方式',
    source: 'Science homework: Finish questions 1–4 on the plant cells worksheet. Turn it in on Friday at 3:00 p.m. in the class portal. Bring your science notebook to class on Monday.',
  },
  {
    title: '图书馆通知',
    description: '找出需要向老师确认的信息',
    source: 'Library visit: Bring your library card and return any borrowed books. Meet in the school lobby after lunch next Thursday. Your teacher will announce the exact meeting time later.',
  },
];

export function loadWorkspace() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) ?? {};
  } catch {
    return {};
  }
}

export function saveWorkspace(workspace) {
  localStorage.setItem(storageKey, JSON.stringify(workspace));
}
