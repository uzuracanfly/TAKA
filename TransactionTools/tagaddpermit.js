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

		let tag = new HEX.HexText().string_to_utf8_hex_string(objdata["tag"]);
		let taglen = tag.length.toString(16);

		let address = objdata["address"];
		address = MAIN.GetFillZero(address, 40);

		let data = MAIN.GetFillZero(taglen,16) + tag + address;

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

		let tag = VariableCut(16);
		tag = new HEX.HexText().utf8_hex_string_to_string(tag);
		let address = cut(40);

		let objdata = {
			"tag":tag,
			"address":address,
		};

		return objdata;
	};
};






exports.SendTagAddPermitTransaction = async function(privkey,tag,addaddress){
	/* Feeを追加 */
	let FeeResult = await TRANSACTION.SendPayTransaction(privkey,"ffffffffffffffffffffffffffffffffffffffff",1);
	if (!FeeResult){
		return false;
	}



	let TargetAccount = new ACCOUNT.account(privkey);

	let FormTxList = await TargetAccount.GetFormTxList(undefined,"tagaddpermit");
	let MerkleRoot = new HASHS.hashs().GetMarkleroot(FormTxList);

	let objdata = {
		"tag":tag,
		"address":addaddress,
	};

	let TagAddPermit = new exports.TagAddPermitData("",objdata);

	let objtx = {
		"pubkey":(await TargetAccount.GetKeys())["pubkey"],
		"type":13,
		"time":Math.floor(Date.now()/1000),
		"tag":"tagaddpermit",
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
	let result = await TargetTransaction.commit();

	return result;
};