const READLINESYNC = require('readline-sync');
const REQUEST = require('sync-request');

exports.RunConsole = function(){
	/*
	コンソール
	*/

	function SendPostbyjson(url,paras){
		let headers = {
			'Content-Type':'application/json'
		};

		//リクエスト送信
		let res = REQUEST(
			'POST',
			url, 
			{
				headers: headers,
				json: paras,
			}
		);
		return JSON.parse(res.getBody('utf8'));
	};

	function CommandAction(commands){
		return new Promise(function(resolve, reject) {
			console.log(commands);
			let result = false;
			if (commands[0] == "getaccount"){
				let key = commands[1];
				result = SendPostbyjson("http://127.0.0.1:"+Config.API["port"],{"function":"getaccount","args":{"key":key}});
			}else if (commands[0] == "gettag"){
				let tag = commands[1];
				result = SendPostbyjson("http://127.0.0.1:"+Config.API["port"],{"function":"gettag","args":{"tag":tag}});
			}else if (commands[0] == "sendpaytx"){
				let privkey = commands[1];
				let toaddress = commands[2];
				let amount = commands[3];
				result = SendPostbyjson("http://127.0.0.1:"+Config.API["port"],{"function":"sendpaytx","args":{"privkey":privkey,"toaddress":toaddress,"amount":amount}});
			}else if (commands[0] == "sendrewardtx"){
				let privkey = commands[1];
				let tag = commands[2];
				let amount = commands[3];
				result = SendPostbyjson("http://127.0.0.1:"+Config.API["port"],{"function":"sendrewardtx","args":{"privkey":privkey,"tag":tag,"amount":amount}});
			}else if (commands[0] == "gettx"){
				let txid = commands[1];
				result = SendPostbyjson("http://127.0.0.1:"+Config.API["port"],{"function":"gettx","args":{"txid":txid}});
			}else if (commands[0] == "senddatabasetx"){
				let privkey = commands[1];
				let tag = commands[2];
				let data = commands[3];
				let commonkey = "";
				if (commands.length >= 5){
					commonkey = commands[4];
				};
				result = SendPostbyjson("http://127.0.0.1:"+Config.API["port"],{"function":"senddatabasetx","args":{"privkey":privkey,"tag":tag,"data":data,"commonkey":commonkey}});
			}else if (commands[0] == "sendtagordertx"){
				let privkey = commands[1];
				let tag = commands[2];
				let permissiontype = commands[3];
				let powtarget = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
				if (commands.length >= 5){
					powtarget = commands[4];
				};

				result = SendPostbyjson("http://127.0.0.1:"+Config.API["port"],{"function":"sendtagordertx","args":{"privkey":privkey,"tag":tag,"permissiontype":permissiontype,"powtarget":powtarget}});
			}else if (commands[0] == "sendtagaddpermittx"){
				let privkey = commands[1];
				let tag = commands[2];
				let addaddress = commands[3];

				result = SendPostbyjson("http://127.0.0.1:"+Config.API["port"],{"function":"sendtagaddpermittx","args":{"privkey":privkey,"tag":tag,"addaddress":addaddress}});
			}else if (commands[0] == "sendcontractsetfunctiontx"){
				let privkey = commands[1];
				let tag = commands[2];
				let FunctionName = commands[3];
				let CodeType = commands[4];
				let CodeData = commands[5];
				let CodePath = "";
				if (commands.length >= 7){
					CodePath = commands[6];
				};

				result = SendPostbyjson("http://127.0.0.1:"+Config.API["port"],{"function":"sendcontractsetfunctiontx","args":{"privkey":privkey,"tag":tag,"FunctionName":FunctionName,"CodeType":CodeType,"CodeData":CodeData,"CodePath":CodePath}});
			}else if (commands[0] == "sendcontractrunfunctiontx"){
				let privkey = commands[1];
				let tag = commands[2];
				let FunctionName = commands[3];
				let FunctionArgs = commands[4];
				FunctionArgs = JSON.parse(FunctionArgs);

				result = SendPostbyjson("http://127.0.0.1:"+Config.API["port"],{"function":"sendcontractrunfunctiontx","args":{"privkey":privkey,"tag":tag,"FunctionName":FunctionName,"FunctionArgs":FunctionArgs}});
			}else if (commands[0] == "sendcontractshowfunctiontx"){
				let privkey = commands[1];
				let tag = commands[2];
				let FunctionName = commands[3];
				let FunctionArgs = commands[4];
				FunctionArgs = JSON.parse(FunctionArgs);

				result = SendPostbyjson("http://127.0.0.1:"+Config.API["port"],{"function":"sendcontractshowfunctiontx","args":{"privkey":privkey,"tag":tag,"FunctionName":FunctionName,"FunctionArgs":FunctionArgs}});
			};

			resolve(result);
		}).catch(function (error) {
			console.log(error);
		});
	}

	let Promise = require('bluebird');
	Promise.resolve(0).then(function loop(i) {
		return new Promise(function(resolve, reject) {
			let commandtext = READLINESYNC.question(Math.floor(Date.now()/1000) + " : ");
			let commands = commandtext.split(' ')
			let actionresult = CommandAction(commands);
			actionresult.then(function(value){
				console.log(JSON.stringify(value,null,'\t'));
			});

			resolve(true);
		}).delay(100).then(loop);
	});
};