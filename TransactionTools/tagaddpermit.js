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




	let objdata = {
		"tag":tag,
		"address":addaddress,
	};

	let TagAddPermit = new exports.TagAddPermitData("",objdata);


	let result = await TRANSACTION.SendTransaction(privkey,13,"tagaddpermit","0000000000000000000000000000000000000000",0,TagAddPermit.GetRawData(),undefined);

	return result;
};