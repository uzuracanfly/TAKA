const MAIN = require('../main.js');
const HEX = require('../hex.js');

const ACCOUNT = require('../account.js');
const HASHS = require('../hashs.js');
const TRANSACTION = require('../transaction.js');



exports.TagOrderData = class{
	constructor(rawdata="",objdata={}){
		this.rawdata = rawdata;
		this.objdata = objdata;
	};

	GetRawData(objdata=this.objdata){

		let feetxid = objdata["feetxid"];
		feetxid = MAIN.GetFillZero(feetxid, 64);

		let permissiontype = objdata["permissiontype"].toString(16);
		permissiontype = MAIN.GetFillZero(permissiontype, 2);

		let powtarget = MAIN.GetFillZero(objdata["powtarget"], 64);

		let DataMaxSizeInByte = objdata["DataMaxSizeInByte"].toString(16);
		DataMaxSizeInByte = MAIN.GetFillZero(DataMaxSizeInByte, 16);

		let FeeToAddress = MAIN.GetFillZero(objdata["FeeToAddress"], 40);

		let FeeAmount = objdata["FeeAmount"].toString(16);
		FeeAmount = MAIN.GetFillZero(FeeAmount, 16);

		let data = feetxid + permissiontype + powtarget + DataMaxSizeInByte + FeeToAddress + FeeAmount;

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

		let feetxid = cut(64);
		let permissiontype = parseInt(cut(2),16);
		let powtarget = cut(64);
		let DataMaxSizeInByte = parseInt(cut(16),16);
		let FeeToAddress = cut(40);
		let FeeAmount = parseInt(cut(16),16);

		let objdata = {
			"feetxid":feetxid,
			"permissiontype":permissiontype,
			"powtarget":powtarget,
			"DataMaxSizeInByte":DataMaxSizeInByte,
			"FeeToAddress":FeeToAddress,
			"FeeAmount":FeeAmount,
		};

		return objdata;
	};
};






exports.SendTagOrderTransaction = async function(privkey,tag,permissiontype,powtarget="0000000000000000000000000000000000000000000000000000000000000000",DataMaxSizeInByte=10000,FeeToAddress="",FeeAmount=0){

	let TargetAccount = new ACCOUNT.account(privkey);

	//tag利用料支払いのトランザクションを発行
	let paytxid = await TRANSACTION.SendPayTransaction(privkey,"ffffffffffffffffffffffffffffffffffffffff",1);


	let FormTxList = await TargetAccount.GetFormTxList(undefined,tag);
	let MerkleRoot = new HASHS.hashs().GetMarkleroot(FormTxList);

	let objdata = {
		"feetxid":paytxid,
		"permissiontype":permissiontype,
		"powtarget":powtarget,
		"DataMaxSizeInByte":parseInt(DataMaxSizeInByte),
		"FeeToAddress":FeeToAddress,
		"FeeAmount":parseInt(FeeAmount),
	};

	let TagOrder = new exports.TagOrderData("",objdata);

	let objtx = {
		"pubkey":(await TargetAccount.GetKeys())["pubkey"],
		"type":12,
		"time":Math.floor(Date.now()/1000),
		"tag":tag,
		"index":FormTxList.length+1,
		"MerkleRoot":MerkleRoot,
		"toaddress":"",
		"amount":0,
		"data":TagOrder.GetRawData(),
		"sig":"",
		"nonce":0
	};
	//console.log(objtx);
	let TargetTransaction = new TRANSACTION.Transaction("",privkey,objtx);
	let txid = await TargetTransaction.commit();

	return txid;
};