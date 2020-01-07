const madge = require('../lib/api');

madge('D:\\Dev\\CFMS\\long-term-storage-ui\\src', {includeNpm: true})
	.then((res) => res.dot())
	.then((output) => {
		console.log(output);
	});
