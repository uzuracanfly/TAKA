const ZLIB = require('zlib');

const MAIN = require('./main.js');
const CRYPTO = require('./crypto.js');
const HASHS = require('./hashs.js');
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
	async GetFormTxList(address="",tag="",LessIndex=0){
		await this.SetUpClass();
		if (!address){
			address = (await this.GetKeys())["address"];
		}
		if (!tag){
			tag = "pay"
		}

		let TransactionIdsPerAccountAndTag = DATABASE.get("TransactionIdsPerAccountAndTag",address+"_"+tag);

		let result = [];
		for (let index in TransactionIdsPerAccountAndTag){
			let txid = TransactionIdsPerAccountAndTag[index];

			if (LessIndex && result.length-1 >= LessIndex){
				break;
			}

			result.push(txid);
		}


		return result;
	};


	async GetBalance(address="",LessIndex=0){
		await this.SetUpClass();
		if (!address){
			address = (await this.GetKeys())["address"];
		}

		let txlist = await this.GetFormTxList(address,"pay",LessIndex);

		let balance = 0;
		for (let index in txlist){
			let txid = txlist[index];

			let TX = TRANSACTION.GetTx(txid);
			let objtx = await TX.GetObjTx();

			if (objtx["toaddress"]==address){balance = balance + objtx["amount"]}else{balance = balance - objtx["amount"]};
			
		}

		return balance;
	}


	async GetSendAmountToAddress(address="",toaddress="",LessIndex=0){
		await this.SetUpClass();
		if (!address){
			address = (await this.GetKeys())["address"];
		}

		let txlist = await this.GetFormTxList(address,"pay",LessIndex);

		let amount = 0;
		for (let index in txlist){
			let txid = txlist[index];

			let TX = TRANSACTION.GetTx(txid);
			let objtx = await TX.GetObjTx();

			if (objtx["toaddress"] != toaddress){
				continue;
			}

			amount = amount + objtx["amount"];
		}

		return amount;
	}
};
