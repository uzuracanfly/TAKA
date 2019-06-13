const MAIN = require('../main.js');
const HEX = require('../hex.js');

const ACCOUNT = require('../account.js');
const HASHS = require('../hashs.js');
const TRANSACTION = require('../transaction.js');


exports.TagAddPermitData = class{
	constructor(rawdata="",objdata={}){
		this.rawdata = rawdata;
		this.objdata = objdata;
	};

	GetRawData(objdata=this.objdata){

		let address = objdata["address"];
		address = MAIN.GetFillZero(address, 40);

		let data = address;

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

		let address = cut(40);

		let objdata = {
			"address":address,
		};

		return objdata;
	};
};






exports.SendTagAddPermitTransaction = function(privkey,tag,addaddress){

	let TargetAccount = new ACCOUNT.account(privkey);

	let FormTxList = TargetAccount.GetFormTxList(undefined,tag);
	let MerkleRoot = new HASHS.hashs().GetMarkleroot(FormTxList);

	let objdata = {
		"address":addaddress,
	};

	let TagAddPermit = new exports.TagAddPermitData("",objdata);

	let objtx = {
		"pubkey":TargetAccount.GetKeys()["pubkey"],
		"type":13,
		"time":Math.floor(Date.now()/1000),
		"tag":tag,
		"index":FormTxList.length+1,
		"MerkleRoot":MerkleRoot,
		"toaddress":"",
		"amount":0,
		"data":TagAddPermit.GetRawData(),
		"sig":"",
		"nonce":0
	};
	//console.log(objtx);
	let TargetTransaction = new TRANSACTION.Transaction("",privkey,objtx);
	let result = TargetTransaction.commit();

	return result;
};