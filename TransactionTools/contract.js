const FS = require('fs');
const TRANSACTION = require('../transaction.js');

exports.SetFunctionData = class{
	constructor(rawdata="",objdata={}){
		this.main = require('../main.js');
		this.hex = require('../hex.js');
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
		let FunctionName = new this.hex.HexText().string_to_utf8_hex_string(objdata["FunctionName"]);
		if (FunctionName.length%2 != 0){
			FunctionName = "0" + FunctionName;
		}
		let FunctionNamelen = FunctionName.length.toString(16);
		FunctionNamelen = this.main.GetFillZero(FunctionNamelen,16);


		let CodeType = objdata["CodeType"].toString(16);
		CodeType = this.main.GetFillZero(CodeType,2);


		let CodeData = new this.hex.HexText().string_to_utf8_hex_string(objdata["CodeData"]);
		if (CodeData.length%2 != 0){
			CodeData = "0" + CodeData;
		}
		let CodeDataLen = (CodeData.length).toString(16);
		CodeDataLen = this.main.GetFillZero(CodeDataLen, 16);

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
		FunctionName = new this.hex.HexText().utf8_hex_string_to_string(FunctionName);
		let CodeType = parseInt(cut(2),16);
		let CodeData = VariableCut();
		CodeData = new this.hex.HexText().utf8_hex_string_to_string(CodeData);

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

	let TargetAccount = new (require('../account.js')).account(privkey);

	let FormTxList = TargetAccount.GetFormTxList(undefined,tag);
	let MerkleRoot = new (require('../hashs.js')).hashs().GetMarkleroot(FormTxList);

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
	let TargetTransaction = new (require('../transaction.js')).Transaction("",privkey,objtx);
	let result = TargetTransaction.commit();

	return result;
};





























exports.RunFunctionData = class{
	constructor(rawdata="",objdata={}){
		this.main = require('../main.js');
		this.hex = require('../hex.js');
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
		let FunctionName = new this.hex.HexText().string_to_utf8_hex_string(objdata["FunctionName"]);
		if (FunctionName.length%2 != 0){
			FunctionName = "0" + FunctionName;
		}
		let FunctionNamelen = FunctionName.length.toString(16);
		FunctionNamelen = this.main.GetFillZero(FunctionNamelen,16);


		let FunctionArgs = JSON.stringify(objdata["FunctionArgs"]);
		FunctionArgs = new this.hex.HexText().string_to_utf8_hex_string(FunctionArgs);
		if (FunctionArgs.length%2 != 0){
			FunctionArgs = "0" + FunctionArgs;
		}
		let FunctionArgslen = FunctionArgs.length.toString(16);
		FunctionArgslen = this.main.GetFillZero(FunctionArgslen,16);


		let result = JSON.stringify(objdata["result"]);
		result = new this.hex.HexText().string_to_utf8_hex_string(result);
		if (result.length%2 != 0){
			result = "0" + result;
		}
		let ResultLen = result.length.toString(16);
		ResultLen = this.main.GetFillZero(ResultLen,16);


		let SetData = JSON.stringify(objdata["SetData"]);
		SetData = new this.hex.HexText().string_to_utf8_hex_string(SetData);
		if (SetData.length%2 != 0){
			SetData = "0" + SetData;
		}
		let SetDataLen = SetData.length.toString(16);
		SetDataLen = this.main.GetFillZero(SetDataLen,16);



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
		FunctionName = new this.hex.HexText().utf8_hex_string_to_string(FunctionName);

		let FunctionArgs = VariableCut();
		FunctionArgs = new this.hex.HexText().utf8_hex_string_to_string(FunctionArgs);
		FunctionArgs = JSON.parse(FunctionArgs);

		let result = VariableCut();
		result = new this.hex.HexText().utf8_hex_string_to_string(result);
		result = JSON.parse(result);

		let SetData = VariableCut();
		SetData = new this.hex.HexText().utf8_hex_string_to_string(SetData);
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




exports.SendContractRunFunctionTransaction = function(privkey,tag,FunctionName,FunctionArgs){

	let TargetAccount = new (require('../account.js')).account(privkey);

	let FormTxList = TargetAccount.GetFormTxList(undefined,tag);
	let MerkleRoot = new (require('../hashs.js')).hashs().GetMarkleroot(FormTxList);


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

	let CodeResult = false;
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

					let ExecFunctions = require("../exec/"+objtagdata["FunctionName"]+".js");
					CodeResult = ExecFunctions.MAIN(TargetAccount.GetKeys(),FunctionArgs,LoadDataPerTag);

					if (!CodeResult){
						return 0;
					}

					break;
				}

			}
		}
	}
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
	let TargetTransaction = new (require('../transaction.js')).Transaction("",privkey,objtx);
	let result = TargetTransaction.commit();

	return result;
};


exports.SendContractShowFunctionTransaction = function(privkey,tag,FunctionName,FunctionArgs){

	let TargetAccount = new (require('../account.js')).account(privkey);

	let FormTxList = TargetAccount.GetFormTxList(undefined,tag);
	let MerkleRoot = new (require('../hashs.js')).hashs().GetMarkleroot(FormTxList);


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

	let CodeResult = false;
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

					let ExecFunctions = require("../exec/"+objtagdata["FunctionName"]+".js");
					CodeResult = ExecFunctions.MAIN(TargetAccount.GetKeys(),FunctionArgs,LoadDataPerTag);

					if (!CodeResult){
						return 0;
					}

					break;
				}

			}
		}
	}
	if (!CodeResult){
		return 0;
	}
	if (!("result" in CodeResult) || !("SetData" in CodeResult)){
		return 0;
	}

	return CodeResult["result"];
};