import { examples, loadWorkspace, saveWorkspace } from './data.js';
import { languages } from './languages.mjs';

const find = (id) => document.getElementById(id);
const form = find('work');
const source = find('source');
const deadline = find('deadline');
const language = find('language');
const send = find('send');
const status = find('status');
const empty = find('empty');
const resultPanel = find('result');
const fallback = '暂时无法解释这条信息。你可以先上网查找不懂的词，再向老师确认具体要求。';
const workspace = loadWorkspace();

source.value = workspace.source ?? '';
deadline.value = workspace.deadline ?? '';
for (const name of languages) language.add(new Option(name, name));
language.value = workspace.language ?? '简体中文';
if (!language.value) language.selectedIndex = 0;

function showResult() {
  const saved = workspace.last;
  const result = saved?.source === source.value.trim() && saved.language === language.value &&
    (saved.deadline ?? '') === deadline.value
    ? saved.result : null;
  empty.hidden = Boolean(result);
  resultPanel.hidden = !result;
  if (!result) return;

  find('summary').textContent = result.summary;
  find('translation').textContent = result.translation;
  find('entered-deadline').hidden = !deadline.value;
  const date = find('deadline-value');
  date.dateTime = deadline.value;
  date.textContent = deadline.value;
  find('no-steps').hidden = result.steps.length > 0;
  find('omitted').hidden = !result.omittedSteps;
  const steps = find('steps');
  steps.replaceChildren();
  for (const step of result.steps) {
    const item = document.createElement('li');
    const evidence = document.createElement('small');
    item.dir = 'auto';
    evidence.textContent = `原文：${step.evidence}`;
    item.append(step.action, evidence);
    steps.append(item);
  }
  const questions = find('questions');
  questions.replaceChildren();
  questions.hidden = !result.questions.length;
  for (const question of result.questions) {
    const item = document.createElement('li');
    item.dir = 'auto';
    item.textContent = question;
    questions.append(item);
  }
}

function save() {
  workspace.source = source.value;
  workspace.deadline = deadline.value;
  workspace.language = language.value;
  try {
    saveWorkspace(workspace);
  } catch {
    status.textContent = '浏览器暂时无法保存这份指南。';
  }
}

function updateInput() {
  status.textContent = '';
  showResult();
  save();
}

source.addEventListener('input', updateInput);
deadline.addEventListener('input', updateInput);
language.addEventListener('change', updateInput);

const exampleButtons = examples.map(({ title, description, source: sample }) => {
  const button = document.createElement('button');
  button.type = 'button';
  const subtitle = document.createElement('small');
  subtitle.textContent = description;
  button.append(title, subtitle);
  button.addEventListener('click', () => {
    source.value = sample;
    deadline.value = '';
    updateInput();
    source.focus();
  });
  find('examples').append(button);
  return button;
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = source.value.trim();
  if (!input || send.disabled) return;
  const selectedLanguage = language.value;
  const selectedDeadline = deadline.value;
  const controls = [source, deadline, language, send, ...exampleButtons];
  for (const control of controls) control.disabled = true;
  send.textContent = status.textContent = '正在思考……';
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: input, language: selectedLanguage, deadline: selectedDeadline }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.result) {
      status.textContent = body?.error?.message || fallback;
      return;
    }
    workspace.last = { source: input, language: selectedLanguage, deadline: selectedDeadline, result: body.result };
    showResult();
    status.textContent = '指南已生成。';
    save();
  } catch {
    status.textContent = fallback;
  } finally {
    for (const control of controls) control.disabled = false;
    send.textContent = '发送给 AI';
  }
});

showResult();
