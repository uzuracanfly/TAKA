const MAIN = require('../main.js');
const HEX = require('../hex.js');
const CRYPTO = require('../crypto.js');

const ACCOUNT = require('../account.js');
const HASHS = require('../hashs.js');
const TRANSACTION = require('../transaction.js');


exports.DatabaseData = class{
	constructor(commonkey="",data="",signdata=""){
		this.commonkey = commonkey;
		this.data = data;
		this.signdata = signdata;
	};

	GetOrgData(commonkey=this.commonkey,signdata=this.signdata){
		if (parseInt(signdata,16)==NaN){
			return "";
		}
		let data = signdata;
		if (commonkey){
			data = new CRYPTO.common().GetDecryptedData(commonkey,data);
		};
		if (parseInt(data,16)==NaN){
			return "";
		}
		return data;
	};

	GetRawData(commonkey=this.commonkey,data=this.data){
		if (parseInt(data,16)==NaN){
			return "";
		}
		let signdata = data;
		if (commonkey){
			signdata = new CRYPTO.common().GetEncryptedData(commonkey,signdata);
		};
		return signdata;
	};
};



exports.SendDatabaseTransaction = async function(privkey,tag,data,commonkey=""){
	let TargetAccount = new ACCOUNT.account(privkey);

	let FormTxList = await TargetAccount.GetFormTxList(undefined,tag);
	let MerkleRoot = new HASHS.hashs().GetMarkleroot(FormTxList);

	let DatabaseData = new exports.DatabaseData(commonkey,data);

	let rawdata = DatabaseData.GetRawData()
	if (!rawdata){
		return false;
	}

	let objtx = {
		"pubkey":(await TargetAccount.GetKeys())["pubkey"],
		"type":101,
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
	let result = await TargetTransaction.commit();

	return result;
};