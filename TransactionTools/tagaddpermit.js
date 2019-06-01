exports.TagAddPermitData = class{
	constructor(rawdata="",objdata={}){
		this.main = require('../main.js');
		this.hex = require('../hex.js');
		this.rawdata = rawdata;
		this.objdata = objdata;
	};

	GetRawData(objdata=this.objdata){

		let address = objdata["address"];
		address = this.main.GetFillZero(address, 40);

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
	let account = require('../account.js');
	let transaction = require('../transaction.js');
	let hashs = require('../hashs.js');
	let main = require('../main.js');


	let TargetAccount = new account.account(privkey);

	let FormTxList = TargetAccount.GetFormTxList(undefined,tag);
	let MerkleRoot = new hashs.hashs().GetMarkleroot(FormTxList);

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
	let TargetTransaction = new (require('../transaction.js')).Transaction("",privkey,objtx);
	let result = TargetTransaction.commit();

	return result;
};