// @vitest-environment jsdom
// React 19 facts that decide how a bridge can be written.
import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { sleep } from './helpers.js';

describe('React 19', () => {
  it('has no legacy ReactDOM.render / unmountComponentAtNode', () => {
    expect(ReactDOM.render).toBeUndefined();
    expect(ReactDOM.unmountComponentAtNode).toBeUndefined();
  });

  it('root.render() is asynchronous - the div is empty right after the call', async () => {
    const div = document.createElement('div');
    createRoot(div).render(createElement('b', null, 'hi'));
    expect(div.innerHTML).toBe('');
    await Promise.resolve();
    expect(div.innerHTML).toBe('');
    await sleep(0);
    expect(div.innerHTML).toBe('<b>hi</b>');
  });

  it('flushSync makes it synchronous', () => {
    const div = document.createElement('div');
    const root = createRoot(div);
    flushSync(() => root.render(createElement('b', null, 'hi')));
    expect(div.innerHTML).toBe('<b>hi</b>');
  });

  // Which root's content ends up in the div depends on timing; only this part is certain.
  it('a second createRoot on the same div only logs an error in development, it does not throw', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const div = document.createElement('div');
    createRoot(div).render(createElement('b', null, 'one'));
    expect(() => createRoot(div).render(createElement('b', null, 'two'))).not.toThrow();
    await sleep(0);
    expect(error.mock.calls.some(([msg]) => String(msg).includes('already been passed to createRoot'))).toBe(true);
    error.mockRestore();
  });

  it('unmounting a root whose div was already removed works', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    root.render(createElement('b', null, 'hi'));
    await sleep(0);
    div.remove();
    expect(() => root.unmount()).not.toThrow();
    expect(div.innerHTML).toBe('');
  });
});
