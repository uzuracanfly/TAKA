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

		let tag = new HEX.HexText().string_to_utf8_hex_string(objdata["tag"]);
		let taglen = tag.length.toString(16);

		let permissiontype = objdata["permissiontype"].toString(16);
		permissiontype = MAIN.GetFillZero(permissiontype, 2);

		let powtarget = MAIN.GetFillZero(objdata["powtarget"], 64);

		let DataMaxSizeInByte = objdata["DataMaxSizeInByte"].toString(16);
		DataMaxSizeInByte = MAIN.GetFillZero(DataMaxSizeInByte, 16);

		let FeeToAddress = MAIN.GetFillZero(objdata["FeeToAddress"], 40);

		let FeeAmount = objdata["FeeAmount"].toString(16);
		FeeAmount = MAIN.GetFillZero(FeeAmount, 16);

		let data = MAIN.GetFillZero(taglen,16) + tag + permissiontype + powtarget + DataMaxSizeInByte + FeeToAddress + FeeAmount;

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
		let permissiontype = parseInt(cut(2),16);
		let powtarget = cut(64);
		let DataMaxSizeInByte = parseInt(cut(16),16);
		let FeeToAddress = cut(40);
		let FeeAmount = parseInt(cut(16),16);

		let objdata = {
			"tag":tag,
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
	/* Feeを追加 */
	let FeeResult = await TRANSACTION.SendPayTransaction(privkey,"ffffffffffffffffffffffffffffffffffffffff",1);
	if (!FeeResult){
		return false;
	}



	let objdata = {
		"tag":tag,
		"permissiontype":permissiontype,
		"powtarget":powtarget,
		"DataMaxSizeInByte":parseInt(DataMaxSizeInByte),
		"FeeToAddress":FeeToAddress,
		"FeeAmount":parseInt(FeeAmount),
	};
	let TagOrder = new exports.TagOrderData("",objdata);


	let result = await TRANSACTION.SendTransaction(privkey,12,"tagorder","0000000000000000000000000000000000000000",0,TagOrder.GetRawData(),undefined);

	return result;
};