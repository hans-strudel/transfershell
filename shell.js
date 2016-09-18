const vm = require('vm'),
	fs = require('fs');

function newShell(cnt, options){
	cnt.options = cnt.options || {}
	options = cnt.options || {};
	options.prompt = cnt.options.prompt || {};
	options.types = cnt.options.types || {};
	
	cnt.options.prompt.txt = cnt.options.prompt.txt || '> ';
	process.stdout.write(colorize(cnt.options.prompt.txt, cnt.options.prompt.color));
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	
	const context = new vm.createContext(cnt);
	
	process.stdin.on('data', function (data) {
		data = (data + '').trim(); // remove trailing \r || \r\n
		try {
			// var outer = eval(data);
			
			var line = new vm.Script('output = ' + data);
			line.runInContext(context);
			var out = context.output;
			
			// var out = outer;
			if (typeof out === 'string' && cnt.options.custom){
				for (var ch in cnt.options.custom){
					out = out.replace(new RegExp(ch, 'g'), function(m){
						//console.log(colorize(m, options.custom[ch]))
						return colorize(m, cnt.options.custom[ch]);
					})
				}
			}
			if (typeof out === 'string' && cnt.options.str){
				out = cnt.options.str + out + cnt.options.str;
			}
			if (cnt.options.types[typeof out]){
				out = colorize(out, cnt.options.types[typeof out])
			}
			console.log(out);
			
			
		} catch (e){
			if (cnt.options.types.error){
				e = colorize(e, options.types.error);
			}
			console.log(e);
		}
		
		//fs.writeFileSync('context.json', JSON.stringify(context, function(key,val){
		//	return (typeof val === 'function' && key !== 'require') ? '' + val : val;
		//}));

		saveShell(context);
		
		// process.stdout.write(prefix);
		process.stdout.write(colorize(cnt.options.prompt.txt, cnt.options.prompt.color));
	});
}

var options = {
	deps: [
		'fs',
		'console'
	],
	prompt: {
		color: [90,39],
		txt: '~> '
	},
	types: {
		'string': [32,39],
		'number': [33,39],
		'function': [36, 39],
		'boolean': [35,39],
		'undefined': [35,39],
		'error': [31,39]
	},
	custom: {
		'{': [43,49],
		'}': [43,49]
	},
	str: "'"
}

//var shell = JSON.parse(fs.readFileSync('context.json', 'utf8')) || {};
var shell = require('./functions.js');
shell.require = require;
shell.options = shell.options || options;
options.deps.forEach(function(dep){
	shell[dep] = require(dep);
})

newShell(shell, options);


function saveShell(cnt){
	var out = '';
	for (var key in cnt){
		out += 'module.exports.' + key + ' = '
		if (typeof cnt[key] === 'object'){
			out += JSON.stringify(cnt[key], function(k,v){
				return (typeof v === 'function') ? ('' + v) : v;
			})
		} else if (typeof cnt[key] === 'string'){
			out += '"' + cnt[key] + '"';
		} else {
			out += cnt[key];
		}
		
		out += '\r\n';
	}
	fs.writeFileSync('functions.js', out);
}


function colorize(str, col){
	return '\u001b[' + col[0] + 'm' + str + '\u001b[' + col[1] + 'm' 
}