const storageKey = 'psic.chat.v1';
const form = document.querySelector('form');
const history = document.querySelector('#history');
const input = document.querySelector('#message');
const send = document.querySelector('#send');
const clear = document.querySelector('#clear');
const status = document.querySelector('#status');
let messages = [];

try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (Array.isArray(saved) && saved.length % 2 === 0 &&
      saved.every((entry, index) => entry?.role === (index % 2 ? 'assistant' : 'user') &&
        typeof entry.content === 'string' && entry.content.trim())) {
    messages = saved;
  }
} catch {
  status.textContent = 'Saved chat could not be loaded.';
}

function render(conversation = messages) {
  history.replaceChildren();
  for (const { role, content } of conversation) {
    const item = document.createElement('article');
    item.className = role;
    const name = document.createElement('strong');
    name.textContent = role === 'user' ? 'You' : 'Luna';
    const text = document.createElement('p');
    text.textContent = content;
    item.append(name, text);
    history.append(item);
  }
  history.scrollTop = history.scrollHeight;
  clear.disabled = !messages.length;
}

function save() {
  try {
    if (messages.length) localStorage.setItem(storageKey, JSON.stringify(messages));
    else localStorage.removeItem(storageKey);
  } catch {
    status.textContent = 'This browser could not save the chat.';
  }
}

clear.addEventListener('click', () => {
  if (!confirm('Clear the conversation from this browser?')) return;
  messages = [];
  status.textContent = '';
  save();
  render();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const content = input.value.trim();
  if (!content || send.disabled) return;
  const turn = { role: 'user', content };
  const conversation = [...messages.slice(-10), turn].map((entry) => ({
    role: entry.role,
    content: entry.content.slice(0, 3000),
  }));
  render([...messages, turn]);
  send.disabled = clear.disabled = input.disabled = true;
  status.textContent = 'Luna is replying…';
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversation }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || typeof result?.message !== 'string') {
      throw new Error(result?.error?.message || 'The chat service did not respond.');
    }
    messages.push(turn, { role: 'assistant', content: result.message });
    input.value = '';
    status.textContent = '';
    save();
  } catch (error) {
    status.textContent = error.message || 'Your message could not be sent.';
  } finally {
    input.disabled = send.disabled = false;
    render();
    input.focus();
  }
});

render();
