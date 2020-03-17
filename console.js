const THENREQUEST = require('then-request');

const CONFIG = require('./config.js');
const MAIN = require('./main.js');
const EXIT = require('./exit.js');


function SendPostbyjson(url,paras){
	let headers = {
		'Content-Type':'application/json'
	};

	//リクエスト送信
	let res = await (THENREQUEST(
		'POST',
		url, 
		{
			headers: headers,
			json: paras,
		}
	).getBody('utf8'));
	return JSON.parse(res);
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
			let LessTime = 0;
			if (commands.length >= 4){
				LessTime = parseInt(commands[3]);
			};
			let BoolNeedApproved = 0;
			if (commands.length >= 5){
				BoolNeedApproved = parseInt(commands[4]);
			};
			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"getaccount","args":{"key":key,"LessIndex":LessIndex,"LessTime":LessTime,"BoolNeedApproved":BoolNeedApproved}});
		}else if (commands[0] == "gettag"){
			let tag = commands[1];
			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"gettag","args":{"tag":tag}});
		}else if (commands[0] == "gettx"){
			let txid = commands[1];
			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"gettx","args":{"txid":txid}});






		}else if (commands[0] == "getimporttag"){
			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"getimporttag","args":{}});
		}else if (commands[0] == "setimporttag"){
			let type = commands[1];
			let tag = commands[2];

			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"setimporttag","args":{"type":type,"tag":tag}});
		}else if (commands[0] == "getminingtags"){
			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"getminingtags","args":{}});
		}else if (commands[0] == "setminingtags"){
			let type = commands[1];
			let tag = commands[2];
			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"setminingtags","args":{"type":type,"tag":tag}});










		}else if (commands[0] == "sendtx"){
			let rawtx = commands[1];
			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"sendtx","args":{"rawtx":rawtx}});








		}else if (commands[0] == "sendpaytx"){
			let key = commands[1];
			let toaddress = commands[2];
			let amount = commands[3];
			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"sendpaytx","args":{"key":key,"toaddress":toaddress,"amount":amount}});
		}else if (commands[0] == "sendtagrewardtx"){
			let key = commands[1];
			let tag = commands[2];
			let amount = commands[3];
			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"sendtagrewardtx","args":{"key":key,"tag":tag,"amount":amount}});
		}else if (commands[0] == "senddatabasetx"){
			let key = commands[1];
			let tag = commands[2];
			let data = commands[3];
			let AddAddressIndex = "";
			if (commands.length >= 5){
				AddAddressIndex = commands[4];
			};
			let commonkey = "";
			if (commands.length >= 6){
				commonkey = commands[5];
			};
			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"senddatabasetx","args":{"key":key,"tag":tag,"data":data,"AddAddressIndex":AddAddressIndex,"commonkey":commonkey}});
		}else if (commands[0] == "sendtagordertx"){
			let key = commands[1];
			let tag = commands[2];
			let permissiontype = commands[3];
			let powtarget = "0000000000000000000000000000000000000000000000000000000000000000"
			if (commands.length >= 5){
				powtarget = commands[4];
			};
			let DataMaxSizeInByte = 10000;
			if (commands.length >= 6){
				DataMaxSizeInByte = commands[5];
			};
			let FeeToAddress = "";
			if (commands.length >= 7){
				FeeToAddress = commands[6];
			};
			let FeeAmount = 0;
			if (commands.length >= 8){
				FeeAmount = commands[7];
			};

			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"sendtagordertx","args":{"key":key,"tag":tag,"permissiontype":permissiontype,"powtarget":powtarget,"DataMaxSizeInByte":DataMaxSizeInByte,"FeeToAddress":FeeToAddress,"FeeAmount":FeeAmount}});
		}else if (commands[0] == "sendtagaddpermittx"){
			let key = commands[1];
			let tag = commands[2];
			let addaddress = commands[3];

			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"sendtagaddpermittx","args":{"key":key,"tag":tag,"addaddress":addaddress}});
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

			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"sendsetcontracttransaction","args":{"key":key,"tag":tag,"FunctionName":FunctionName,"CodeType":CodeType,"CodeData":CodeData,"CodePath":CodePath}});
		}else if (commands[0] == "sendruncontracttransaction"){
			let key = commands[1];
			let tag = commands[2];
			let FunctionName = commands[3];
			let FunctionArgs = commands[4];
			FunctionArgs = JSON.parse(FunctionArgs);
			let AddAddressIndex = "";
			if (commands.length >= 6){
				AddAddressIndex = commands[5];
			};

			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"sendruncontracttransaction","args":{"key":key,"tag":tag,"FunctionName":FunctionName,"FunctionArgs":FunctionArgs,"AddAddressIndex":AddAddressIndex}});
		}else if (commands[0] == "callruncontracttransaction"){
			let address = commands[1];
			let tag = commands[2];
			let FunctionName = commands[3];
			let FunctionArgs = commands[4];
			FunctionArgs = JSON.parse(FunctionArgs);
			let AddressIndexs = [];
			if (commands.length >= 6){
				AddressIndexs = JSON.parse(commands[5]);
			};
			let lastonly = false;
			if (commands.length >= 7){
				lastonly = parseInt(commands[6]);
			};

			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"callruncontracttransaction","args":{"address":address,"tag":tag,"FunctionName":FunctionName,"FunctionArgs":FunctionArgs,"AddressIndexs":AddressIndexs,"lastonly":lastonly}});
		}else if (commands[0] == "runcode"){
			let address = commands[1];
			let tag = commands[2];
			let FunctionName = commands[3];
			let FunctionArgs = commands[4];
			FunctionArgs = JSON.parse(FunctionArgs);
			let AddressIndexs = [];
			if (commands.length >= 6){
				AddressIndexs = JSON.parse(commands[5]);
			};
			let lastonly = false;
			if (commands.length >= 7){
				lastonly = parseInt(commands[6]);
			};
			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"runcode","args":{"address":address,"tag":tag,"FunctionName":FunctionName,"FunctionArgs":FunctionArgs,"AddressIndexs":AddressIndexs,"lastonly":lastonly}});










		}else if (commands[0] == "exchange"){
			let type = commands[1];
			let PayTxid = commands[2];
			let ReceiverAddress = commands[3];
			let amount = commands[4];
			
			result = SendPostbyjson(`http://127.0.0.1:${CONFIG.API["port"]}/api`,{"function":"exchange","args":{"type":type,"PayTxid":PayTxid,"ReceiverAddress":ReceiverAddress,"amount":amount}});






		}else if (commands[0] == "exit"){
			result = EXIT.SetExit();
		}



		resolve(result);
	}).catch(function (error) {
		if (error.code == "ECONNREFUSED"){
			console.log("You need to start the node.");
			return false;
		}

		console.log(error);
	});
}



let commands = [];
for (let index=2;index<process.argv.length;index++){
	commands.push(process.argv[index]);
}
CommandAction(commands).then(function(value){
	console.log(JSON.stringify(value,null,'\t'));
});