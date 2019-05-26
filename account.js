exports.account = class{
	constructor(pubkey="",privkey="",address=""){
		this.crypto = require('./crypto.js');
		this.hashs = require('./hashs.js');
		this.transaction = require('./transaction.js');
		this.database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);

		if (privkey){
			this.keys = this.GetKeys(privkey);
		}else if (pubkey){
			this.keys = {
				"pubkey":pubkey,
				"address":this.GetAddress(pubkey),
			}
		}else if (address){
			this.keys = {
				"address":address
			}
		}else{
			privkey = new this.crypto.signature().CreatePrivkey();
			this.keys = this.GetKeys(privkey);
		}
	};


	GetKeys(privkey=this.keys["privkey"]){
		let pubkey = new this.crypto.signature().GetPrivkeyToPubkey(privkey);
		let address = this.GetAddress(pubkey);
		let keys = {
			"privkey":privkey,
			"pubkey":pubkey,
			"address":address,
		}

		return keys;
	};


	GetAddress(pubkey=this.keys["pubkey"]){
		let hash = new this.hashs.hashs().sha256(pubkey);
		hash = new this.hashs.hashs().ripemd160(hash);

		return hash;
	};


	//アカウントの残高を構成するtxのリスト
	GetFormTxList(address=this.keys["address"],LessIndex=0){
		let TxidListPerAccount = this.database.get("TransactionIdsPerAccount",address);

		let result = [];
		for (let index in TxidListPerAccount){
			let txid = TxidListPerAccount[index];

			if (LessIndex && index >= LessIndex){
				break;
			}

			result.push(txid);
		}


		return result;
	};


	GetBalance(address=this.keys["address"],LessIndex=0){
		let txlist = this.GetFormTxList(address,LessIndex);

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
