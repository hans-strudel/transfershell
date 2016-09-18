const vm = require('vm'),
	fs = require('fs');

function newShell(cnt, options){
	options = options || {};
	options.prompt = options.prompt || {};
	options.types = options.types || {};
	
	var prefix = options.prompt.txt || '> ';
	if (options.prompt.color){
		prefix = colorize(prefix, options.prompt.color);
	}
	
	
	process.stdout.write(prefix);
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
			if (typeof out === 'string' && options.custom){
				for (var ch in options.custom){
					out = out.replace(new RegExp(ch, 'g'), function(m){
						//console.log(colorize(m, options.custom[ch]))
						return colorize(m, options.custom[ch]);
					})
				}
			}
			if (typeof out === 'string' && options.str){
				out = options.str + out + options.str;
			}
			if (options.types[typeof out]){
				out = colorize(out,options.types[typeof out])
			}
			console.log(out);
			
			
		} catch (e){
			if (options.types.error){
				e = colorize(e, options.types.error);
			}
			console.log(e);	
		}
		
		//fs.writeFileSync('context.json', JSON.stringify(context, function(key,val){
		//	return (typeof val === 'function' && key !== 'require') ? '' + val : val;
		//}));
		saveShell(context);
		
		process.stdout.write(prefix);
	});
}

var options = {
	prompt: {
		color: [90,39],
		txt: '~> '
	},
	types: {
		'string': [32,39],
		'number': [33,39],
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

newShell(shell, options);


function saveShell(cnt){
	var out = '';
	for (var key in cnt){
		out += 'module.exports.' + key + ' = ' + cnt[key] + '\r\n';
	}
	fs.writeFileSync('functions.js', out);
}


function colorize(str, col){
	return '\u001b[' + col[0] + 'm' + str + '\u001b[' + col[1] + 'm' 
}