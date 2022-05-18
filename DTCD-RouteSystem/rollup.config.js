import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';

import { version } from './package.json';

const watch = Boolean(process.env.ROLLUP_WATCH);

const pluginName = 'RouteSystem';

const outputFile = `${pluginName}.js`;
const outputDirectory = watch
  ? `./../../DTCD/server/plugins/DTCD-${pluginName}_${version}`
  : `./build`;

const plugins = [resolve(), babel({ babelHelpers: 'bundled' }), json()];

export default {
  input: `./src/${pluginName}.js`,
  output: {
    file: `${outputDirectory}/${outputFile}`,
    format: 'esm',
    sourcemap: false,
  },
  watch: {
    include: ['./*/**'],
  },
  plugins,
};
