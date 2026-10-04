// @vitest-environment jsdom
// The Preact facts the bridge depends on, and the "two copies of Preact" crash.
import { describe, it, expect } from 'vitest';
import { h, render } from 'preact';
import { useEffect, useLayoutEffect, useState } from 'preact/hooks';
import { useState as useStateFromPanelCopy } from '@bpmn-io/properties-panel/preact/hooks';
import { sleep } from './helpers.js';

describe('Preact lifecycle', () => {
  it('runs hook cleanups while the div is still in the DOM, then removes it', async () => {
    const seen = [];
    const attached = () => !!document.getElementById('child');
    function Child() {
      useLayoutEffect(() => () => seen.push(['layout cleanup', attached()]), []);
      useEffect(() => () => {
        seen.push(['effect cleanup', attached()]);
        queueMicrotask(() => seen.push(['microtask later', attached()]));
        setTimeout(() => seen.push(['150 ms later', attached()]), 150);
      }, []);
      return h('div', { id: 'child' });
    }
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(h(Child), host);
    await sleep(50);
    render(null, host);
    seen.push(['render(null) returned', attached()]);
    await sleep(200);

    expect(seen).toEqual([
      ['layout cleanup', true],
      ['effect cleanup', true],
      ['render(null) returned', false],
      ['microtask later', false],
      ['150 ms later', false]
    ]);
  });

  it('runs useLayoutEffect before render() returns, useEffect later', async () => {
    const order = [];
    function C() {
      useLayoutEffect(() => { order.push('layout effect'); }, []);
      useEffect(() => { order.push('effect'); }, []);
      return null;
    }
    render(h(C), document.createElement('div'));
    order.push('render() returned');
    await sleep(0);
    order.push('setTimeout 0');
    await sleep(150);
    expect(order).toEqual(['layout effect', 'render() returned', 'setTimeout 0', 'effect']);
  });

  it('never runs useEffect (or its cleanup) if the component unmounts first', async () => {
    const order = [];
    function C() {
      useLayoutEffect(() => { order.push('layout effect'); return () => order.push('layout cleanup'); }, []);
      useEffect(() => { order.push('effect'); return () => order.push('effect cleanup'); }, []);
      return null;
    }
    const host = document.createElement('div');
    render(h(C), host);
    render(null, host);
    await sleep(300);
    expect(order).toEqual(['layout effect', 'layout cleanup']);
  });

  it('creates a new DOM node when the key changes, keeps it when props change', () => {
    const host = document.createElement('div');
    render(h('section', null, h('span', { key: 'a' })), host);
    const first = host.querySelector('span');
    render(h('section', null, h('span', { key: 'b' })), host);
    const second = host.querySelector('span');
    render(h('section', null, h('span', { key: 'b', title: 'x' })), host);
    expect(second).not.toBe(first);
    expect(host.querySelector('span')).toBe(second);
  });
});

describe('two copies of Preact', () => {
  it('crashes when a component uses hooks from another Preact copy', () => {
    // @bpmn-io/properties-panel ships its own Preact; its components use these hooks.
    function Entry() {
      const [value] = useStateFromPanelCopy('x');
      return h('span', null, value);
    }
    expect(() => render(h(Entry), document.createElement('div'))).toThrow(/__H/);
  });

  it('works when the hooks come from the same Preact copy', () => {
    function Entry() {
      const [value] = useState('x');
      return h('span', null, value);
    }
    const host = document.createElement('div');
    render(h(Entry), host);
    expect(host.innerHTML).toBe('<span>x</span>');
  });
});
