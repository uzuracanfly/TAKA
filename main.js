const READLINE = require('readline');


exports.note = function(stat,title,text){
	const CONFIG = require('./config.js');
	
	let result = "["+title+"]";
	if (stat == 0){
		result = result + "[DEBUG]";
	}
	if (stat == 1){
		result = result + "[INFO]";
	}
	if (stat == 2){
		result = result + "[WARN]";
	}
	if (stat == 3){
		result = result + "[ERRO]";
	}

	result = result + text;


	if (CONFIG.Note["loglevel"] <= stat){
		console.log(result);
	};

	return result;
}


exports.GetFillZero = function(hex, hexlength){
	let needzeroffill = hexlength-hex.length;
	if (needzeroffill > 0){
		for (var i=needzeroffill;i>0;i--){
			hex = "0" + hex
		};
	};

	return hex;
};


exports.errorHandle = function(process) {
	return function(){
		try {
			return process.apply(this, arguments);
		}catch (e) {
			console.log(e);
			console.log('エラーから復帰しました');
		}
	};
}



exports.sleep = function(msec){
	return new Promise(function(resolve) {
		setTimeout(function() {resolve()}, 1000*msec);
	})
}



exports.GetConsole = async function(pretext){
	return new Promise(function(resolve) {
		const RL = READLINE.createInterface({
			input: process.stdin,
			output: process.stdout,
			bufferSize: 10240
		});

		RL.question(pretext, (inputtext) => {
			RL.close();
			return resolve(inputtext);
		});
	});
}


exports.GetTime = async function(){
	return Math.floor( new Date().getTime() / 1000 );
};


exports.GetRandom = async function(l){
	// 生成する文字列に含める文字セット
	let c = "abcdefghijklmnopqrstuvwxyz0123456789";

	let cl = c.length;
	let r = "";
	for(let i=0; i<l; i++){
		r += c[Math.floor(Math.random()*cl)];
	}

	return r;
}