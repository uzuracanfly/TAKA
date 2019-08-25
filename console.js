const REQUEST = require('sync-request');

const CONFIG = require('./config.js');
const MAIN = require('./main.js');

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
				let key = "";
				if (commands.length >= 2){
					key = commands[1];
				};
				let LessIndex = 0;
				if (commands.length >= 3){
					LessIndex = parseInt(commands[2]);
				};
				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"getaccount","args":{"key":key,"LessIndex":LessIndex}});
			}else if (commands[0] == "gettag"){
				let tag = commands[1];
				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"gettag","args":{"tag":tag}});
			}else if (commands[0] == "sendpaytx"){
				let key = commands[1];
				let toaddress = commands[2];
				let amount = commands[3];
				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"sendpaytx","args":{"key":key,"toaddress":toaddress,"amount":amount}});
			}else if (commands[0] == "sendtagrewardtx"){
				let key = commands[1];
				let tag = commands[2];
				let amount = commands[3];
				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"sendtagrewardtx","args":{"key":key,"tag":tag,"amount":amount}});
			}else if (commands[0] == "gettx"){
				let txid = commands[1];
				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"gettx","args":{"txid":txid}});
			}else if (commands[0] == "senddatabasetx"){
				let key = commands[1];
				let tag = commands[2];
				let data = commands[3];
				let commonkey = "";
				if (commands.length >= 5){
					commonkey = commands[4];
				};
				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"senddatabasetx","args":{"key":key,"tag":tag,"data":data,"commonkey":commonkey}});
			}else if (commands[0] == "sendtagordertx"){
				let key = commands[1];
				let tag = commands[2];
				let permissiontype = commands[3];
				let powtarget = "0000000000000000000000000000000000000000000000000000000000000000"
				if (commands.length >= 5){
					powtarget = commands[4];
				};
				let DataMaxSizeInByte = 1000;
				if (commands.length >= 6){
					DataMaxSizeInByte = commands[5];
				};

				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"sendtagordertx","args":{"key":key,"tag":tag,"permissiontype":permissiontype,"powtarget":powtarget,"DataMaxSizeInByte":DataMaxSizeInByte}});
			}else if (commands[0] == "sendtagaddpermittx"){
				let key = commands[1];
				let tag = commands[2];
				let addaddress = commands[3];

				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"sendtagaddpermittx","args":{"key":key,"tag":tag,"addaddress":addaddress}});
			}else if (commands[0] == "sendsetcontracttransaction"){
				let key = commands[1];
				let tag = commands[2];
				let FunctionName = commands[3];
				let CodeType = commands[4];
				let CodeData = commands[5];
				let CodePath = "";
				if (commands.length >= 7){
					CodePath = commands[6];
				};

				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"sendsetcontracttransaction","args":{"key":key,"tag":tag,"FunctionName":FunctionName,"CodeType":CodeType,"CodeData":CodeData,"CodePath":CodePath}});
			}else if (commands[0] == "sendruncontracttransaction"){
				let key = commands[1];
				let tag = commands[2];
				let FunctionName = commands[3];
				let FunctionArgs = commands[4];
				FunctionArgs = JSON.parse(FunctionArgs);

				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"sendruncontracttransaction","args":{"key":key,"tag":tag,"FunctionName":FunctionName,"FunctionArgs":FunctionArgs}});
			}else if (commands[0] == "callruncontracttransaction"){
				let address = commands[1];
				let tag = commands[2];
				let FunctionName = commands[3];
				let FunctionArgs = commands[4];
				FunctionArgs = JSON.parse(FunctionArgs);

				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"callruncontracttransaction","args":{"address":address,"tag":tag,"FunctionName":FunctionName,"FunctionArgs":FunctionArgs}});
			}else if (commands[0] == "runcode"){
				let address = commands[1];
				let tag = commands[2];
				let FunctionName = commands[3];
				let FunctionArgs = commands[4];
				FunctionArgs = JSON.parse(FunctionArgs);

				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"runcode","args":{"address":address,"tag":tag,"FunctionName":FunctionName,"FunctionArgs":FunctionArgs}});
			}else if (commands[0] == "getimporttag"){
				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"getimporttag","args":{}});
			}else if (commands[0] == "setimporttag"){
				let type = commands[1];
				let tag = commands[2];

				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"setimporttag","args":{"type":type,"tag":tag}});
			}else if (commands[0] == "getminingtags"){
				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"getminingtags","args":{}});
			}else if (commands[0] == "setminingtags"){
				let type = commands[1];
				let tag = commands[2];

				result = SendPostbyjson("http://127.0.0.1:"+CONFIG.API["port"],{"function":"setminingtags","args":{"type":type,"tag":tag}});
			};

			resolve(result);
		}).catch(function (error) {
			console.log(error);
		});
	}

	let Promise = require('bluebird');
	Promise.resolve(0).then(function loop(i) {
		return new Promise(async function(resolve, reject) {
			let commandtext = await MAIN.GetConsole(Math.floor(Date.now()/1000) + " : ");

			let commands = commandtext.split(' ')
			let actionresult = CommandAction(commands);
			actionresult.then(function(value){
				console.log(JSON.stringify(value,null,'\t'));
				resolve(true);
			});
		}).delay(100).then(loop);
	});
};