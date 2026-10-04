// Shows, with timestamps, the Preact order the bridge depends on:
//   * useLayoutEffect runs before render() returns, useEffect runs later
//   * on unmount, hook cleanups run while the div is still in the DOM,
//     and Preact removes the div right after
//   * if the component unmounts before useEffect ran, that effect and its
//     cleanup never run at all
import { h, render } from 'preact';
import { useEffect, useLayoutEffect } from 'preact/hooks';

export function runLifecycleDemo(host, list, { unmountBeforeEffect = false } = {}) {
  list.innerHTML = '';
  const t0 = performance.now();
  const say = (kind, text) => {
    const li = document.createElement('li');
    li.className = `log-${kind}`;
    li.innerHTML = `<time>+${(performance.now() - t0).toFixed(1)} ms</time> `;
    li.append(document.createTextNode(text));
    list.append(li);
  };
  const attached = () => (document.getElementById('lifecycle-child') ? 'yes' : 'NO');

  function Child() {
    useLayoutEffect(() => {
      say('preact', 'useLayoutEffect');
      return () => say('preact', `layout cleanup · div in DOM: ${attached()}`);
    }, []);
    useEffect(() => {
      say('preact', 'useEffect');
      return () => {
        say('preact', `effect cleanup · div in DOM: ${attached()}`);
        queueMicrotask(() => say('timer', `microtask after cleanup · div in DOM: ${attached()}`));
        setTimeout(() => say('timer', `150 ms after cleanup · div in DOM: ${attached()}`), 150);
      };
    }, []);
    return h('div', { id: 'lifecycle-child' });
  }

  host.hidden = false;
  say('action', 'render(<Child/>)');
  render(h(Child), host);
  say('action', 'render() returned');

  if (unmountBeforeEffect) {
    say('action', 'render(null) right away  → unmount before useEffect ran');
    render(null, host);
    setTimeout(() => say('timer', '300 ms later: useEffect and its cleanup never ran'), 300);
    host.hidden = true;
    return;
  }

  setTimeout(() => {
    say('action', 'render(null)  → unmount');
    render(null, host);
    say('action', `render(null) returned · div in DOM: ${attached()}`);
    host.hidden = true;
  }, 400);
}
