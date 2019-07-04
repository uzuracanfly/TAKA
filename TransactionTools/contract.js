const FS = require('fs');
const CONFIG = require('../config.js');
const MAIN = require('../main.js');
const HEX = require('../hex.js');

const ACCOUNT = require('../account.js');
const HASHS = require('../hashs.js');
const TRANSACTION = require('../transaction.js');

const CP = require('child_process');



exports.SetFunctionData = class{
	constructor(rawdata="",objdata={}){
		this.rawdata = rawdata;
		this.objdata = objdata;
	};


	/*
		{
			"CodeType":1,
			"CodeData":"function main(){}"
		}
	*/
	GetRawData(objdata=this.objdata){
		let FunctionName = new HEX.HexText().string_to_utf8_hex_string(objdata["FunctionName"]);
		if (FunctionName.length%2 != 0){
			FunctionName = "0" + FunctionName;
		}
		let FunctionNamelen = FunctionName.length.toString(16);
		FunctionNamelen = MAIN.GetFillZero(FunctionNamelen,16);


		let CodeType = objdata["CodeType"].toString(16);
		CodeType = MAIN.GetFillZero(CodeType,2);


		let CodeData = new HEX.HexText().string_to_utf8_hex_string(objdata["CodeData"]);
		if (CodeData.length%2 != 0){
			CodeData = "0" + CodeData;
		}
		let CodeDataLen = (CodeData.length).toString(16);
		CodeDataLen = MAIN.GetFillZero(CodeDataLen, 16);

		let rawdata = FunctionNamelen + FunctionName + CodeType + CodeDataLen + CodeData;

		return rawdata;
	};


	GetObjData(rawdata=this.rawdata){
		function cut(len){
			let cuthex = rawdata.slice(0,len);
			rawdata = rawdata.slice(len);
			return cuthex
		};


		function VariableCut(){
			let len = parseInt(cut(16),16);

			let cuthex = rawdata.slice(0,len);
			rawdata = rawdata.slice(len);

			return cuthex
		};


		let FunctionName = VariableCut();
		FunctionName = new HEX.HexText().utf8_hex_string_to_string(FunctionName);
		let CodeType = parseInt(cut(2),16);
		let CodeData = VariableCut();
		CodeData = new HEX.HexText().utf8_hex_string_to_string(CodeData);

		let objdata = {
			"FunctionName":FunctionName,
			"CodeType":CodeType,
			"CodeData":CodeData,
		}

		return objdata;
	};
};



exports.SendContractSetFunctionTransaction = function(privkey,tag,FunctionName,CodeType,CodeData,CodePath=""){
	if (CodePath){
		try{
			CodeData = FS.readFileSync(CodePath, 'utf8');
		}catch(e){
			return false;
		}
	};


	for (let index in CONFIG.Contract["banword"]){
		let banword = CONFIG.Contract["banword"][index];

		//禁止句が含まれる場合
		if (CodeData.indexOf(banword) != -1){
			return 0;
		}
	};

	let TargetAccount = new ACCOUNT.account(privkey);

	let FormTxList = TargetAccount.GetFormTxList(undefined,tag);
	let MerkleRoot = new HASHS.hashs().GetMarkleroot(FormTxList);

	let objdata = {
		"FunctionName":FunctionName,
		"CodeType":parseInt(CodeType),
		"CodeData":CodeData,
	}

	let SETFUNCTIONDATA = new exports.SetFunctionData("",objdata);

	let rawdata = SETFUNCTIONDATA.GetRawData()
	if (!rawdata){
		return false;
	}

	let objtx = {
		"pubkey":TargetAccount.GetKeys()["pubkey"],
		"type":111,
		"time":Math.floor(Date.now()/1000),
		"tag":tag,
		"index":FormTxList.length+1,
		"MerkleRoot":MerkleRoot,
		"toaddress":"",
		"amount":0,
		"data":rawdata,
		"sig":"",
		"nonce":0
	};
	//console.log(objtx);
	let TargetTransaction = new TRANSACTION.Transaction("",privkey,objtx);
	let result = TargetTransaction.commit();

	return result;
};





























exports.RunFunctionData = class{
	constructor(rawdata="",objdata={}){
		this.rawdata = rawdata;
		this.objdata = objdata;
	};



	/*
		{
			"FunctionName":"",
			"FunctionArgs":{},//JSON
			"result":"None",
			"SetData":{},
		}
	*/
	GetRawData(objdata=this.objdata){		
		let FunctionName = new HEX.HexText().string_to_utf8_hex_string(objdata["FunctionName"]);
		if (FunctionName.length%2 != 0){
			FunctionName = "0" + FunctionName;
		}
		let FunctionNamelen = FunctionName.length.toString(16);
		FunctionNamelen = MAIN.GetFillZero(FunctionNamelen,16);


		let FunctionArgs = JSON.stringify(objdata["FunctionArgs"]);
		FunctionArgs = new HEX.HexText().string_to_utf8_hex_string(FunctionArgs);
		if (FunctionArgs.length%2 != 0){
			FunctionArgs = "0" + FunctionArgs;
		}
		let FunctionArgslen = FunctionArgs.length.toString(16);
		FunctionArgslen = MAIN.GetFillZero(FunctionArgslen,16);


		let result = JSON.stringify(objdata["result"]);
		result = new HEX.HexText().string_to_utf8_hex_string(result);
		if (result.length%2 != 0){
			result = "0" + result;
		}
		let ResultLen = result.length.toString(16);
		ResultLen = MAIN.GetFillZero(ResultLen,16);


		let SetData = JSON.stringify(objdata["SetData"]);
		SetData = new HEX.HexText().string_to_utf8_hex_string(SetData);
		if (SetData.length%2 != 0){
			SetData = "0" + SetData;
		}
		let SetDataLen = SetData.length.toString(16);
		SetDataLen = MAIN.GetFillZero(SetDataLen,16);



		let data = FunctionNamelen + FunctionName + FunctionArgslen + FunctionArgs + ResultLen + result + SetDataLen + SetData;

		return data;
	};


	GetObjData(rawdata=this.rawdata){
		function cut(len){
			let cuthex = rawdata.slice(0,len);
			rawdata = rawdata.slice(len);
			return cuthex
		};


		function VariableCut(){
			let len = parseInt(cut(16),16);

			let cuthex = rawdata.slice(0,len);
			rawdata = rawdata.slice(len);

			return cuthex
		};

		let FunctionName = VariableCut();
		FunctionName = new HEX.HexText().utf8_hex_string_to_string(FunctionName);

		let FunctionArgs = VariableCut();
		FunctionArgs = new HEX.HexText().utf8_hex_string_to_string(FunctionArgs);
		FunctionArgs = JSON.parse(FunctionArgs);

		let result = VariableCut();
		result = new HEX.HexText().utf8_hex_string_to_string(result);
		result = JSON.parse(result);

		let SetData = VariableCut();
		SetData = new HEX.HexText().utf8_hex_string_to_string(SetData);
		SetData = JSON.parse(SetData);


		let objdata = {
			"FunctionName":FunctionName,
			"FunctionArgs":FunctionArgs,
			"result":result,
			"SetData":SetData,
		}

		return objdata;
	};
};




exports.RunCode = async function(ObjCodeTx,TargetAccount,FunctionArgs,LoadDataPerTag){
	const starttime = Math.floor(Date.now()/1000);

	let child = CP.spawn("node",["./exec/"+ObjCodeTx["FunctionName"]+".js",JSON.stringify(TargetAccount.GetKeys()),JSON.stringify(FunctionArgs),JSON.stringify(LoadDataPerTag)]);

	let bPromise = require('bluebird');
	(function loop(index) {
		if (starttime+10 >= Math.floor(Date.now()/1000)) {
			return bPromise.delay(1).then(function() {
				return index+1;
			}).then(loop);
		}
		//console.log("kill");
		child.kill('SIGHUP');
		return bPromise.resolve(index);
	})(0);

	return new Promise(function (resolve, reject) {
		child.stdout.on("data", function (data) {
			//console.log("data : "+data);
			return resolve(JSON.parse(data));
		});
		child.on("error", function (e) {
			console.log("error : "+e.message);
			return resolve(false);
		});
	});
};






exports.SendContractRunFunctionTransaction = async function(privkey,tag,FunctionName,FunctionArgs){

	let TargetAccount = new ACCOUNT.account(privkey);

	let FormTxList = TargetAccount.GetFormTxList(undefined,tag);
	let MerkleRoot = new HASHS.hashs().GetMarkleroot(FormTxList);


	/*
		コントラクト実行
	*/

	//タグに結び付いた最新の保存データを取得
	let LoadDataPerTag = {};
	let tagtxids = TRANSACTION.GetTagTxids(tag);
	tagtxids = tagtxids.reverse();

	for (let index in tagtxids){
		let tagtxid = tagtxids[index];

		let tagtx = TRANSACTION.GetTx(tagtxid);
		let objtagtx = tagtx.GetObjTx();

		if (objtagtx["type"] == 112){
			let objtagdata = new exports.RunFunctionData(objtagtx["data"]).GetObjData();

			LoadDataPerTag = objtagdata["SetData"];
			break;
		};
	}




	if (tagtxids.length <= 0){
		return 0;
	}

	//実行するソースのコードをtagのtxidリストから走査

	let ObjCodeTx = false;
	for (let index in tagtxids){
		let tagtxid = tagtxids[index];

		let tagtx = TRANSACTION.GetTx(tagtxid);
		let objtagtx = tagtx.GetObjTx();
		if (objtagtx["type"] == 111){
			let objtagdata = new exports.SetFunctionData(objtagtx["data"]).GetObjData();

			//ソースコード発見
			if (objtagdata["FunctionName"] == FunctionName){
				if (objtagdata["CodeType"] == 1){
					let CodeData = objtagdata["CodeData"];

					try{
						FS.mkdirSync("./exec/");
					}catch(e){
						console.log("");
					}

					FS.writeFileSync("./exec/"+objtagdata["FunctionName"]+".js", CodeData, "utf8");

					let loopindex = 0;
					while (loopindex < 100){
						try{
							FS.statSync("./exec/"+objtagdata["FunctionName"]+".js");
							break;
						}catch(e){
							loopindex = loopindex + 1;
						}
					}

					ObjCodeTx = objtagdata;

					break;
				}

			}
		}
	}


	if (!ObjCodeTx){
		return 0;
	}

	let CodeResult = await exports.RunCode(ObjCodeTx,TargetAccount,FunctionArgs,LoadDataPerTag);
	if (!CodeResult){
		return 0;
	}



	if (!("result" in CodeResult) || !("SetData" in CodeResult)){
		return 0;
	}





	let objdata = {
		"FunctionName":FunctionName,
		"FunctionArgs":FunctionArgs,
		"result":CodeResult["result"],
		"SetData":CodeResult["SetData"],
	}

	let RUNFUNCTIONDATA = new exports.RunFunctionData("",objdata);

	let rawdata = RUNFUNCTIONDATA.GetRawData()
	if (!rawdata){
		return false;
	}

	let objtx = {
		"pubkey":TargetAccount.GetKeys()["pubkey"],
		"type":112,
		"time":Math.floor(Date.now()/1000),
		"tag":tag,
		"index":FormTxList.length+1,
		"MerkleRoot":MerkleRoot,
		"toaddress":"",
		"amount":0,
		"data":rawdata,
		"sig":"",
		"nonce":0
	};
	//console.log(objtx);
	let TargetTransaction = new TRANSACTION.Transaction("",privkey,objtx);
	let result = TargetTransaction.commit();

	return result;
};


exports.SendContractShowFunctionTransaction = async function(privkey,tag,FunctionName,FunctionArgs){

	let TargetAccount = new ACCOUNT.account(privkey);

	let FormTxList = TargetAccount.GetFormTxList(undefined,tag);
	let MerkleRoot = new HASHS.hashs().GetMarkleroot(FormTxList);


	/*
		コントラクト実行
	*/

	//タグに結び付いた最新の保存データを取得
	let LoadDataPerTag = {};
	let tagtxids = TRANSACTION.GetTagTxids(tag);
	tagtxids = tagtxids.reverse();

	for (let index in tagtxids){
		let tagtxid = tagtxids[index];

		let tagtx = TRANSACTION.GetTx(tagtxid);
		let objtagtx = tagtx.GetObjTx();

		if (objtagtx["type"] == 112){
			let objtagdata = new exports.RunFunctionData(objtagtx["data"]).GetObjData();

			LoadDataPerTag = objtagdata["SetData"];
			break;
		};
	}




	if (tagtxids.length <= 0){
		return 0;
	}

	//実行するソースのコードをtagのtxidリストから走査

	let ObjCodeTx = false;
	for (let index in tagtxids){
		let tagtxid = tagtxids[index];

		let tagtx = TRANSACTION.GetTx(tagtxid);
		let objtagtx = tagtx.GetObjTx();
		if (objtagtx["type"] == 111){
			let objtagdata = new exports.SetFunctionData(objtagtx["data"]).GetObjData();

			//ソースコード発見
			if (objtagdata["FunctionName"] == FunctionName){
				if (objtagdata["CodeType"] == 1){
					let CodeData = objtagdata["CodeData"];

					try{
						FS.mkdirSync("./exec/");
					}catch(e){
						console.log("");
					}

					FS.writeFileSync("./exec/"+objtagdata["FunctionName"]+".js", CodeData, "utf8");

					let loopindex = 0;
					while (loopindex < 100){
						try{
							FS.statSync("./exec/"+objtagdata["FunctionName"]+".js");
							break;
						}catch(e){
							loopindex = loopindex + 1;
						}
					}

					ObjCodeTx = objtagdata;

					break;
				}

			}
		}
	}


	if (!ObjCodeTx){
		return 0;
	}

	let CodeResult = await exports.RunCode(ObjCodeTx,TargetAccount,FunctionArgs,LoadDataPerTag);
	if (!CodeResult){
		return 0;
	}


	if (!("result" in CodeResult) || !("SetData" in CodeResult)){
		return 0;
	}

	return CodeResult["result"];
};