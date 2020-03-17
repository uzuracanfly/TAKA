const ZLIB = require('zlib');

const MAIN = require('./main.js');
const CRYPTO = require('./crypto.js');
const HASHS = require('./hashs.js');
const HEX = require('./hex.js');
const TRANSACTION = require('./transaction.js');
const CONFIG = require('./config.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);




exports.account = class{
	constructor(key=""){
		this.key = key;
		this.setupbool = false;
	};


	async SetUpClass(){
		if (this.setupbool){
			return 0;
		}
		this.setupbool = true;

		if (!this.key){
			this.key = await new CRYPTO.signature().CreatePrivkey();
		};

		return 1;
	}


	async GetKeys(key=this.key){
		await this.SetUpClass();
		if (!key){
			key = this.key;
		}


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
		}else if(key.length > 4016 && key.length < 11456){
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

		return keys;
	};


	//アカウントの残高を構成するtxのリスト
	async GetFormTxList(address="",tag="",LessIndex=0,LessTime=0,BoolNeedApproved=0){
		await this.SetUpClass();
		if (!address){
			address = (await this.GetKeys())["address"];
		}
		if (!tag){
			tag = "pay"
		}

		let TransactionIdsPerAccountAndTag = await DATABASE.get("TransactionIdsPerAccountAndTag",address+"_"+tag);
		if (LessTime){
			LessIndex = await TRANSACTION.GetLessIndexFromLessTime(address,tag,LessTime);
			LessTime = 0;
		};


		let result = [];
		if (LessIndex && TransactionIdsPerAccountAndTag.length+1 != LessIndex){
			for (let index in TransactionIdsPerAccountAndTag){
				let txid = TransactionIdsPerAccountAndTag[index];

				if (LessIndex && result.length+1 >= LessIndex){
					break;
				}

				result.push(txid);
			}
		}else{
			result = TransactionIdsPerAccountAndTag;
		}

		if (BoolNeedApproved && result.length > 0){
			let lasttxid = result.slice(-1);
			let LASTTX = TRANSACTION.GetTx(lasttxid);
			let objtx = await LASTTX.GetObjTx();

			let SenderAccount = new exports.account(objtx["pubkey"]);
			let SenderAccountTxids = await SenderAccount.GetFormTxList(undefined,objtx["tag"]);

			let ToAccount = new exports.account(objtx["toaddress"]);
			let ToAccountTxids = await ToAccount.GetFormTxList(undefined,objtx["tag"]);

			if (SenderAccountTxids.slice(-1)[0] == lasttxid && ToAccountTxids.slice(-1)[0] == lasttxid){
				result = result.slice(0,-1);
			}
		};

		return result;

	};


	//アカウントが生成したトランザクションリスト
	async GetSendTxList(address="",tag=""){
		await this.SetUpClass();
		if (!address){
			address = (await this.GetKeys())["address"];
		}
		if (!tag){
			tag = "pay"
		}

		let TransactionIdsPerAccountAndTag = await DATABASE.get("TransactionIdsPerSenderAndTag",address+"_"+tag);

		return TransactionIdsPerAccountAndTag;
	};


	async GetBalance(address="",LessIndex=0,LessTime=0,BoolNeedApproved=0){
		await this.SetUpClass();
		if (!address){
			address = (await this.GetKeys())["address"];
		}

		let txlist = await this.GetFormTxList(address,"pay",LessIndex,LessTime,BoolNeedApproved);
		if (LessTime){
			LessIndex = await TRANSACTION.GetLessIndexFromLessTime(address,"pay",LessTime);
			LessTime = 0;
		};



		/* indexの残高のキャッシュがとられている */
		let MaxCacheIndex = 0;
		let BalanceWithMaxCacheIndex = 0;
		let datas = await DATABASE.get("BalancePerAddress",address);
		for (let index in datas){
			let data = datas[index];

			let CacheIndex = parseInt(data["index"]);
			if (LessIndex && LessIndex <= CacheIndex){
				continue;
			}
			if (MaxCacheIndex < CacheIndex){
				MaxCacheIndex = CacheIndex;
				BalanceWithMaxCacheIndex = parseInt(data["balance"]);
			}
		}




		let balance = BalanceWithMaxCacheIndex;
		for (let index in txlist){
			if (MaxCacheIndex && MaxCacheIndex >= parseInt(index)+1){
				continue;
			}

			let txid = txlist[index];

			let TX = TRANSACTION.GetTx(txid);
			let objtx = await TX.GetObjTx();

			let SenderKeys = await this.GetKeys(objtx["pubkey"]);

			if (SenderKeys["address"]==address){
				balance = balance - objtx["amount"]
			};
			if (objtx["toaddress"]==address){
				balance = balance + objtx["amount"]
			};
			
		}

		return balance;
	}


	async GetSendAmountToAddress(address="",toaddress="",LessIndex=0,LessTime=0,BoolNeedApproved=0){
		await this.SetUpClass();
		if (!address){
			address = (await this.GetKeys())["address"];
		}

		let txlist = await this.GetFormTxList(address,"pay",LessIndex,LessTime,BoolNeedApproved);
		if (LessTime){
			LessIndex = await TRANSACTION.GetLessIndexFromLessTime(address,"pay",LessTime);
			LessTime = 0;
		};



		/* indexの残高のキャッシュがとられている */
		let MaxCacheIndex = 0;
		let AmountWithMaxCacheIndex = 0;
		let datas = await DATABASE.get("SendAmountToAddressPerAddress",`${address}_${toaddress}`);
		for (let index in datas){
			let data = datas[index];

			let CacheIndex = parseInt(data["index"]);
			if (LessIndex && LessIndex <= CacheIndex){
				continue;
			}
			if (MaxCacheIndex < CacheIndex){
				MaxCacheIndex = CacheIndex;
				AmountWithMaxCacheIndex = parseInt(data["amount"]);
			}
		}



		let TxlistPerAccAndToAndTag = await DATABASE.get("TransactionIdsPerAccountAndToAccountAndTag",address+"_"+toaddress+"_pay");
		let amount = AmountWithMaxCacheIndex;
		for (let index in txlist){
			if (MaxCacheIndex && MaxCacheIndex >= parseInt(index)+1){
				continue;
			}

			let txid = txlist[index];

			if (TxlistPerAccAndToAndTag.indexOf(txid) == -1){
				continue;
			}

			let TX = TRANSACTION.GetTx(txid);
			let objtx = await TX.GetObjTx();

			let SenderKeys = await this.GetKeys(objtx["pubkey"]);

			if (SenderKeys["address"] == address && objtx["toaddress"] == toaddress){
				amount = amount + objtx["amount"];
			};
		}

		return amount;
	}
};
