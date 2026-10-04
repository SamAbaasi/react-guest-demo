// No Preact alias. form-js-editor >= 1.21 installs its own Preact 10.15.1,
// the viewer and this app use another one. Open /preact.html: the editor stays blank.
import { defineConfig } from 'vite';
import { baseConfig } from './vite.shared.js';

export default defineConfig(baseConfig('no alias', 'noalias'));
