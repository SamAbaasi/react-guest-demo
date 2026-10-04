export const $ = (selector) => document.querySelector(selector);

const LABELS = { action: '▶', preact: 'Preact', react: 'React', timer: 'timer', bug: 'BUG', ok: 'info' };

export function renderLogEntry({ t, kind, message }) {
  const li = document.createElement('li');
  li.className = `log-${kind}`;
  if (kind === 'action') {
    li.textContent = `▶ ${message}`;
  } else {
    li.innerHTML = `<time>+${t} ms</time> <em>${LABELS[kind] || kind}</em> `;
    li.append(document.createTextNode(message));
  }
  return li;
}
