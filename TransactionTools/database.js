const MAIN = require('../main.js');
const HEX = require('../hex.js');
const CRYPTO = require('../crypto.js');

const ACCOUNT = require('../account.js');
const HASHS = require('../hashs.js');
const TRANSACTION = require('../transaction.js');
const TRANSACTIONTOOLS_TAGORDER = require('./tagorder.js');


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



exports.SendDatabaseTransaction = async function(privkey,tag,data,AddAddressIndex="",commonkey=""){
	try{
		/* Feeを追加 */
		let TAGORDERTX = await TRANSACTION.GetTagOrderTx(tag);
		let TagOrderObjTx = await TAGORDERTX.GetObjTx();
		let TagData = new TRANSACTIONTOOLS_TAGORDER.TagOrderData(TagOrderObjTx["data"]).GetObjData();
		if (TagData["FeeAmount"] > 0){
			let result = await TRANSACTION.SendPayTransaction(privkey,TagData["FeeToAddress"],TagData["FeeAmount"]);
			if (!result){
				return false;
			}
		}



		let DatabaseData = new exports.DatabaseData(commonkey,data);
		let rawdata = DatabaseData.GetRawData();
		if (!rawdata){
			return false;
		}


		let result = await TRANSACTION.SendTransaction(privkey,101,tag,AddAddressIndex,0,rawdata,undefined);

		return result;
	}catch(e){
		MAIN.note(2,"SendDatabaseTransaction",e);
		return false;
	}
};