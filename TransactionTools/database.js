exports.DatabaseData = class{
	constructor(commonkey="",data="",signdata=""){
		this.main = require('../main.js');
		this.hex = require('../hex.js');
		this.crypto = require('../crypto.js');
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
			data = new this.crypto.common().GetDecryptedData(commonkey,data);
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
			signdata = new this.crypto.common().GetEncryptedData(commonkey,signdata);
		};
		return signdata;
	};
};



exports.SendDatabaseTransaction = function(privkey,tag,data,commonkey=""){
	let TargetAccount = new (require('../account.js')).account(privkey);

	let FormTxList = TargetAccount.GetFormTxList(undefined,tag);
	let MerkleRoot = new (require('../hashs.js')).hashs().GetMarkleroot(FormTxList);

	let DatabaseData = new exports.DatabaseData(commonkey,data);

	let rawdata = DatabaseData.GetRawData()
	if (!rawdata){
		return false;
	}

	let objtx = {
		"pubkey":TargetAccount.GetKeys()["pubkey"],
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
	let TargetTransaction = new (require('../transaction.js')).Transaction("",privkey,objtx);
	let result = TargetTransaction.commit();

	return result;
};