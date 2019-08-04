const ZLIB = require('zlib');

const CRYPTO = require('./crypto.js');
const HASHS = require('./hashs.js');
const TRANSACTION = require('./transaction.js');
const CONFIG = require('./config.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);




exports.account = class{
	constructor(key=""){
		this.key = key;
	};


	async GetKeys(key=this.key){
		// 圧縮関数 (要deflate.js)
		function deflate(val) {
			val = encodeURIComponent(val); // UTF16 → UTF8
			val = ZLIB.deflateRawSync(val); // 圧縮
			val = val.toString("base64"); // base64エンコード
		 	return val;
		}

		// 復号関数 (要inflate.js)
		function inflate(val) {
			val = Buffer.from(val,'base64');
			val = ZLIB.inflateRawSync(val); // 復号
			val = decodeURIComponent(val); // UTF8 → UTF16
			return val;
		}


		/* キーの識別 */
		let address = "";
		let pubkey = "";
		let privkey = "";
		let MinPrivkey = "";
		if (key.length == 40){
			address = key;
		}else if(key.length == 4016){
			pubkey = key;
		}else if(key.length == 11456){
			privkey = key;
		}else if(key.length > 6600 && key.length < 6700){
			MinPrivkey = key;
		}else{
			privkey = await new CRYPTO.signature().CreatePrivkey();
		}


		if (MinPrivkey){
			privkey = inflate(MinPrivkey);
		}
		if (privkey){
			MinPrivkey = deflate(privkey)
			pubkey = await new CRYPTO.signature().GetPrivkeyToPubkey(privkey);
		};
		if (pubkey){
			address = new HASHS.hashs().sha256(pubkey);
			address = new HASHS.hashs().ripemd160(address);
		};
		let keys = {
			"MinPrivkey":MinPrivkey,
			"privkey":privkey,
			"pubkey":pubkey,
			"address":address,
		}

		this.key = key;

		return keys;
	};


	//アカウントの残高を構成するtxのリスト
	async GetFormTxList(address="",tag="",LessIndex=0){
		if (!address){
			address = (await this.GetKeys())["address"];
		}

		let TxidListPerAccount = DATABASE.get("TransactionIdsPerAccount",address);

		let result = [];
		for (let index in TxidListPerAccount){
			let txid = TxidListPerAccount[index];

			if (tag){
				let tx = TRANSACTION.GetTx(txid);
				let ObjTx = await tx.GetObjTx();
				if (ObjTx["tag"] != tag){
					continue;
				};
			}

			if (LessIndex && result.length-1 >= LessIndex){
				break;
			}

			result.push(txid);
		}


		return result;
	};


	async GetBalance(address="",LessIndex=0){
		if (!address){
			address = (await this.GetKeys())["address"];
		}

		let txlist = await this.GetFormTxList(address,"pay",LessIndex);

		let balance = 0;
		for (let index in txlist){
			let txid = txlist[index];

			let rawtxdata = DATABASE.get("ConfirmedTransactions",txid);
			if (rawtxdata.length <= 0){
				return 0;
			}
			let rawtx = rawtxdata[0];
			let TargetTransaction = new TRANSACTION.Transaction(rawtx);

			if ((await TargetTransaction.GetObjTx())["toaddress"]==address){balance = balance + (await TargetTransaction.GetObjTx())["amount"]}else{balance = balance - (await TargetTransaction.GetObjTx())["amount"]};
			
		}

		return balance;
	}
};
