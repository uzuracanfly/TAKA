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

		let data = feetxid + permissiontype + powtarget;

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

		let objdata = {
			"feetxid":feetxid,
			"permissiontype":permissiontype,
			"powtarget":powtarget,
		};

		return objdata;
	};
};






exports.SendTagOrderTransaction = function(privkey,tag,permissiontype,powtarget){

	return new Promise(function (resolve, reject) {

		let TargetAccount = new ACCOUNT.account(privkey);

		//tag利用料支払いのトランザクションを発行
		let result = new TRANSACTION.SendPayTransaction(privkey,MAIN.GetFillZero("", 40),1);


		result.then(function (paytxid) {
			let FormTxList = TargetAccount.GetFormTxList(undefined,tag);
			let MerkleRoot = new HASHS.hashs().GetMarkleroot(FormTxList);

			let objdata = {
				"feetxid":paytxid,
				"permissiontype":permissiontype,
				"powtarget":powtarget,
			};

			let TagOrder = new exports.TagOrderData("",objdata);

			let objtx = {
				"pubkey":TargetAccount.GetKeys()["pubkey"],
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
			let result = TargetTransaction.commit();

			result.then(function (txid) {
				resolve(txid);
			}).catch(function (error) {
				console.log(error);
			});
			
		}).catch(function (error) {
			console.log(error);
		});
	});
};