const typescript = require('rollup-plugin-typescript');

export default {
	entry: './index.ts',
	format: 'umd',
	moduleName: 'reactDevToolsSymbiote',
	dest: 'dist/react-devtools-symbiote.js',
	plugins: [
		typescript({
			typescript: require('typescript'),
		}),
	],
};
