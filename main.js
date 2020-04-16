const READLINE = require('readline');
const FS = require('fs');
const UTF8 = require('utf8');


const out = FS.createWriteStream('info.log');
const err = FS.createWriteStream('error.log');

const logger = new console.Console(out, err);

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
		logger.log(result);
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



exports.ChangePara = async function(KeyType,value){
	let ParaTypes = {
		"MinPrivkey":{"type":"string","StringFunction":async function(KeyType,value){return UTF8.encode(value);},"MinLength":4017,"MaxLength":11455},
		"privkey":{"type":"string","StringFunction":async function(KeyType,value){return UTF8.encode(value);},"length":11456},
		"pubkey":{"type":"string","StringFunction":async function(KeyType,value){return UTF8.encode(value);},"length":4016},
		"address":{"type":"string","StringFunction":async function(KeyType,value){return UTF8.encode(value);},"length":40},
		"tag":{"type":"string","StringFunction":async function(KeyType,value){return UTF8.encode(value);},"MaxLength":32767},
	}
	/*
		"id":{"type":"string","StringFunction":async function(KeyType,value){return UTF8.encode(value);},"length":null},
		"AnnounceTitle":{"type":"string","StringFunction":async function(KeyType,value){return value;},"length":null},
		"AnnounceText":{"type":"string","StringFunction":async function(KeyType,value){return value;},"length":null},
		"PointAmount":{"type":"number","NumberFunction":async function(KeyType,value){return parseInt(value);}},
		"ConfirmCord":{"type":"number","NumberFunction":async function(KeyType,value){return parseInt(value);}},
		"permit":{"type":"number","NumberFunction":async function(KeyType,value){return parseInt(value);}},
		"MailAddress":{"type":"string","StringFunction":async function(KeyType,value){
			let regex = /[\w.\-]+@[\w\-]+\.[\w.\-]+/;
			if(!(regex.test(value))){
				throw new Error('Bad MailAddress');
			};
			return UTF8.encode(value);
		},"length":null},
		"privkey":{"type":"string","StringFunction":async function(KeyType,value){return UTF8.encode(value);},"length":104},
		"AccountId":{"type":"string","StringFunction":async function(KeyType,value){return UTF8.encode(value);},"length":40},
		"UsingIds":{"type":"BoolFunction","BoolFunction":async function(KeyType,value){if (value == null){return true;};return (await exports.isObject(value));}},
	*/

	//console.log(KeyType,value);


	if (KeyType in ParaTypes){
		let ParaType = ParaTypes[KeyType];

		if (ParaType["type"] == "string"){
			value = value.toString();
			value = await ParaType["StringFunction"](KeyType,value);

			if ("length" in ParaType && ParaType["length"]){
				if (value.length != ParaType["length"]){
					throw new Error(`Bad length is ${value} of ${KeyType} type`);
				}
			}
			if ("MinLength" in ParaType && ParaType["MinLength"]){
				if (value.length < ParaType["MinLength"]){
					throw new Error(`Bad MinLength is ${value} of ${KeyType} type`);
				}
			}
			if ("MaxLength" in ParaType && ParaType["MaxLength"]){
				if (value.length > ParaType["MaxLength"]){
					throw new Error(`Bad MaxLength is ${value} of ${KeyType} type`);
				}
			}
			/*
			if ((value.toLowerCase()).indexOf("=") != -1){
				throw new Error('Bad value');
			}
			if ((value.toLowerCase()).indexOf("like") != -1){
				throw new Error('Bad value');
			}
			*/
		}else if(ParaType["type"] == "number"){
			value = await ParaType["NumberFunction"](KeyType,value);
		}else if(ParaType["type"] == "BoolFunction"){
			if (!(await ParaType["BoolFunction"](KeyType,value))){
				throw new Error('Bad type');
			}
		}
	}



	return value;
};
