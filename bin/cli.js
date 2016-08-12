#!/usr/bin/env node
'use strict';

const process = require('process');
const program = require('commander');
const rc = require('rc')('madge');
const log = require('../lib/log');
const version = require('../package.json').version;
const output = require('../lib/output');
const madge = require('../lib/api');

program
	.version(version)
	.usage('[options] <file>')
	.option('--basedir <path>', 'base directory to use when resolving paths')
	.option('--list', 'show list of all dependencies (default)')
	.option('--summary', 'show summary of all dependencies')
	.option('--circular', 'show circular dependencies')
	.option('--depends <name>', 'show modules that depends on the given id')
	.option('--json', 'show output as JSON')
	.option('--exclude-regexp <regexp>', 'Exclude modules using a RegExp')
	.option('--image <file>', 'write graph to file as an image')
	.option('--layout <name>', 'layout engine to use for graph (dot/neato/fdp/sfdp/twopi/circo)')
	.option('--dot', 'show graph using the DOT language')
	.option('--no-color', 'disable color in output and image', false)
	.option('--require-config <file>', 'path to RequireJS config')
	.option('--webpack-config <file>', 'path to webpack config')
	.parse(process.argv);

if (!program.args.length) {
	console.log(program.helpInformation());
	process.exit(1);
}

if (!program.color) {
	process.env.DEBUG_COLORS = false;
}

if (rc.config) {
	log('using runtime configuration from %s', rc.config);
}

const config = Object.assign({}, rc);

delete config._;
delete config.config;
delete config.configs;

['layout', 'requireConfig', 'webpackConfig'].forEach((option) => {
	if (program[option]) {
		config[option] = program[option];
	}
});

if (program.basedir) {
	config.baseDir = program.basedir;
}

if (program.excludeRegexp) {
	config.excludeRegExp = [program.excludeRegexp];
}

if (!program.color) {
	config.backgroundColor = '#ffffff';
	config.nodeColor = '#00000';
	config.noDependencyColor = '#00000';
	config.cyclicNodeColor = '#000000';
	config.edgeColor = '#757575';
}

madge(program.args[0], config)
	.then((res) => {
		if (program.summary) {
			return output.summary(res.obj(), {
				json: program.json
			});
		}

		if (program.depends) {
			return output.depends(res.depends(program.depends), {
				json: program.json
			});
		}

		if (program.circular) {
			const circular = res.circular();

			output.circular(circular, {
				json: program.json
			});

			if (circular.length) {
				process.exit(1);
			}

			return;
		}

		if (program.image) {
			return res.image(program.image).then((imagePath) => {
				console.log('Image created at %s', imagePath);
			});
		}

		if (program.dot) {
			return res.dot().then((output) => {
				process.stdout.write(output);
			});
		}

		return output.list(res.obj(), {
			json: program.json
		});
	})
	.catch((err) => {
		output.error(err);

		process.exit(1);
	});
