// @vitest-environment jsdom
// Each bug from the talk, reproduced with real form-js, Preact and React,
// and the fix that removes it.
import { describe, it, expect, afterEach } from 'vitest';
import { scenarios, getData } from '../src/demo/scenarios.js';
import { mountForm, settle, sleep, snapshot, eventMessages } from './helpers.js';

let current;
afterEach(async () => {
  await current?.cleanup();
  current = null;
});

async function openPicker(view) {
  view.container.querySelector('.picker-trigger').click();
  await sleep(400);
}

describe('mode 1 · naive: one root per instance, rendered once', () => {
  it('unmounts every root it creates (no leak)', async () => {
    current = await mountForm('naive');
    await scenarios.hideShowTimes(current.form, 10);
    await settle();
    current.form.destroy();
    await settle();
    const s = snapshot();
    expect(s.rootsCreated).toBe(11);
    expect(s.rootsUnmounted).toBe(11);
    expect(s.documentListeners).toBe(0);
  });

  it('BUG: never syncs props - after re-import the picker still shows the old value', async () => {
    current = await mountForm('naive');
    await scenarios.reimportSameRows(current.form);
    await settle();
    expect(getData(current.form).fruit).toBe('Cherry');
    expect(current.pickerValue()).toBe('Banana');
  });
});

describe('mode 2 · registry keyed by field id', () => {
  it('syncs props into the same root and keeps React state', async () => {
    current = await mountForm('sharedKey');
    await openPicker(current);
    await scenarios.typeFilter(current.form);
    await settle();
    expect(snapshot().rootsCreated).toBe(1);
    expect(current.pickerMeta()).toContain('opened 1×');
    expect(current.container.querySelector('.picker-status').textContent).toContain('filter "ana"');
  });

  it('BUG: a remount in one render hands the new div the OLD, detached root', async () => {
    current = await mountForm('sharedKey');
    const oldSlot = current.container.querySelector('.bridge-slot');
    await scenarios.reimportNewRows(current.form);
    const newSlot = current.container.querySelector('.bridge-slot');

    expect(newSlot).not.toBe(oldSlot);
    expect(oldSlot.isConnected).toBe(false);
    expect(eventMessages('bug').some((m) => m.includes('DETACHED'))).toBe(true);

    // It heals on the next render (form-js re-renders after import),
    // with a new root - the old React state is gone.
    await settle();
    expect(current.picker()).not.toBeNull();
    expect(snapshot().rootsCreated).toBe(2);
  });

  it('BUG: hidden again before its useEffect ran, the field comes back EMPTY and stays empty', async () => {
    current = await mountForm('sharedKey');
    const completed = await scenarios.hideShowTimes(current.form, 10);
    expect(completed).toBeLessThan(10);

    await sleep(1000);
    const slot = current.container.querySelector('.bridge-slot');
    expect(slot).not.toBeNull();
    expect(slot.innerHTML).toBe('');
    expect(eventMessages('bug').some((m) => m.includes('DETACHED'))).toBe(true);
  });

  it('works and does not leak when every useEffect has run (slow hide/show)', async () => {
    current = await mountForm('sharedKey');
    expect(await scenarios.hideShowSlow(current.form, 3)).toBe(3);
    await settle();
    const s = snapshot();
    expect(s.rootsUnmounted).toBe(3);
    expect(s.documentListeners).toBe(1);
  });
});

describe('mode 3 · per-instance key + deferred DOM check', () => {
  it('BUG: never unmounts a root - every hidden field leaks its React tree', async () => {
    current = await mountForm('deferredCheck');
    expect(await scenarios.hideShowTimes(current.form, 10)).toBe(10);
    await settle();
    let s = snapshot();
    expect(s.rootsCreated).toBe(11);
    expect(s.rootsUnmounted).toBe(0);
    expect(s.documentListeners).toBe(11);

    current.form.destroy();
    await settle();
    s = snapshot();
    expect(s.rootsUnmounted).toBe(0);
    expect(s.documentListeners).toBe(11);
  });

  it('BUG: even when the cleanup runs, the timer finds no div and skips unmount', async () => {
    current = await mountForm('deferredCheck');
    expect(await scenarios.hideShowSlow(current.form, 3)).toBe(3);
    await settle();
    expect(snapshot().rootsUnmounted).toBe(0);
    expect(eventMessages('bug').filter((m) => m.includes('SKIPPED')).length).toBe(3);
  });

  it('the generation counter changes nothing (ids are never reused)', async () => {
    const run = async (generation) => {
      const view = await mountForm('deferredCheck', { generation });
      await scenarios.typeFilter(view.form);
      await scenarios.hideShowTimes(view.form, 5);
      await scenarios.reimportNewRows(view.form);
      await settle();
      const { rootsCreated, rootsUnmounted, documentListeners } = snapshot();
      await view.cleanup();
      return { rootsCreated, rootsUnmounted, documentListeners };
    };
    const without = await run(false);
    const withCounter = await run(true);
    expect(withCounter).toEqual(without);
    expect(without.rootsUnmounted).toBe(0);
  });

  it('keeps React state while props change', async () => {
    current = await mountForm('deferredCheck');
    const id = current.picker().dataset.pickerId;
    await openPicker(current);
    await scenarios.typeFilter(current.form);
    await settle();
    expect(current.picker().dataset.pickerId).toBe(id);
    expect(current.pickerMeta()).toContain('opened 1×');
  });
});

describe('mode 4 · fixed: refs, synced props, always unmount', () => {
  it('unmounts every root: no leaked trees, no leaked listeners', async () => {
    current = await mountForm('fixed');
    expect(await scenarios.hideShowTimes(current.form, 10)).toBe(10);
    await scenarios.reimportNewRows(current.form);
    await settle();
    expect(snapshot().documentListeners).toBe(1);
    current.form.destroy();
    await settle();
    const s = snapshot();
    expect(s.rootsUnmounted).toBe(s.rootsCreated);
    expect(s.documentListeners).toBe(0);
  });

  it('syncs the props React uses and keeps React state', async () => {
    current = await mountForm('fixed');
    const id = current.picker().dataset.pickerId;
    await openPicker(current);
    await scenarios.typeFilter(current.form);
    await scenarios.reimportSameRows(current.form);
    await settle();
    expect(current.pickerValue()).toBe('Cherry');
    expect(current.picker().dataset.pickerId).toBe(id);
    expect(current.pickerMeta()).toContain('opened 1×');
  });

  it('does not re-render React for fields it does not use', async () => {
    current = await mountForm('fixed');
    const before = snapshot().rootRenders;
    await scenarios.typeNotes(current.form);
    await settle();
    expect(snapshot().rootRenders).toBe(before);
  });
});

describe('cost of the production pattern', () => {
  it('mode 3 re-renders React on every form change, even for unrelated fields', async () => {
    current = await mountForm('deferredCheck');
    const before = snapshot().rootRenders;
    await scenarios.typeNotes(current.form);
    await settle();
    expect(snapshot().rootRenders).toBeGreaterThan(before);
  });
});
