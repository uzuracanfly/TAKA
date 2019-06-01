exports.account = class{
	constructor(key=""){
		this.crypto = require('./crypto.js');
		this.hashs = require('./hashs.js');
		this.transaction = require('./transaction.js');
		this.database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);

		if (key){
			this.key = key;
		}else{
			this.key = new this.crypto.signature().CreatePrivkey();
		}
	};


	GetKeys(key=this.key){
		
		/* キーの識別 */
		let address = "";
		let pubkey = "";
		let privkey = "";
		if (key.length == 40){
			address = key;
		}else if(key.length == 66){
			pubkey = key;
		}else if(key.length == 64){
			privkey = key;
		}else{
			this.key = new this.crypto.signature().CreatePrivkey();
		}


		if (privkey){
			pubkey = new this.crypto.signature().GetPrivkeyToPubkey(privkey);
		};
		if (pubkey){
			address = this.GetAddress(pubkey);
		};
		let keys = {
			"privkey":privkey,
			"pubkey":pubkey,
			"address":address,
		}

		return keys;
	};


	GetAddress(pubkey=this.GetKeys()["pubkey"]){
		let hash = new this.hashs.hashs().sha256(pubkey);
		hash = new this.hashs.hashs().ripemd160(hash);

		return hash;
	};


	//アカウントの残高を構成するtxのリスト
	GetFormTxList(address=this.GetKeys()["address"],tag="",LessIndex=0){
		let TxidListPerAccount = this.database.get("TransactionIdsPerAccount",address);

		let result = [];
		for (let index in TxidListPerAccount){
			let txid = TxidListPerAccount[index];

			if (tag){
				let tx = this.transaction.GetTx(txid);
				let ObjTx = tx.GetObjTx();
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


	GetBalance(address=this.GetKeys()["address"],LessIndex=0){
		let txlist = this.GetFormTxList(address,"pay",LessIndex);

		let balance = 0;
		for (let index in txlist){
			let txid = txlist[index];

			let rawtxdata = this.database.get("ConfirmedTransactions",txid);
			if (rawtxdata.length <= 0){
				return 0;
			}
			let rawtx = rawtxdata[0];
			let TargetTransaction = new this.transaction.Transaction(rawtx);

			if (TargetTransaction.objtx["toaddress"]==address){balance = balance + TargetTransaction.objtx["amount"]}else{balance = balance - TargetTransaction.objtx["amount"]};
			
		}

		return balance;
	}
};
