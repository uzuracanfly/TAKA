exports.Transaction = class{
	constructor(rawtx="",privkey="",objtx={}){
		this.crypto = require('./crypto.js');
		this.account = require('./account.js');
		this.hashs = require('./hashs.js');
		this.hex = require('./hex.js');
		this.database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);


		if (privkey){
			this.TargetAccount = new this.account.account("",privkey);
		};


		if (rawtx){
			this.rawtx = rawtx;
			this.objtx = this.GetObjTx();
			if (!this.TargetAccount){
				this.TargetAccount = new this.account.account(this.objtx["pubkey"]);
			};
		}else{
			this.objtx = objtx;
			this.rawtx = this.GetRawTx();
		};
	};



	/*
		通貨支払い

		pubkey : 66桁
		type : 2桁
		time : 16桁
		tag length : 2桁
		tag : tag length 桁
		index : 16桁
		MerkleRoot : 64桁
		toaddress : 40桁
		amount : 64桁
		data length : 16桁
		data : data length 桁
		sig length : 16桁
		sig : sig length 桁
		nonce : 16桁

	*/
	GetRawTx(TargetAccount=this.TargetAccount,objtx=this.objtx,orgonly=false){

		let type = objtx["type"].toString(16);
		let time = Math.floor(objtx["time"]).toString(16);
		let tag = new this.hex.HexText().string_to_utf8_hex_string(objtx["tag"]);
		let index = objtx["index"].toString(16);
		let MerkleRoot = objtx["MerkleRoot"];
		let toaddress = objtx["toaddress"];
		let amount = objtx["amount"].toString(16);
		let data = objtx["data"];



		let rawtx = "";

		let pubkey_toin = GetFillZero(TargetAccount.keys["pubkey"], 66);
		let type_toin = GetFillZero(type, 2);
		let time_toin = GetFillZero(time, 16);

		let tag_toin = "";
		if (tag.length%2 == 0){
			tag_toin = tag;
		}else{
			tag_toin = "0" + tag;
		}
		let taglen_toin = (tag_toin.length).toString(16);
		taglen_toin = GetFillZero(taglen_toin, 16);

		let index_toin = GetFillZero(index, 16);
		let MerkleRoot_toin = GetFillZero(MerkleRoot, 64);
		let toaddress_toin = GetFillZero(toaddress, 40);
		let amount_toin = GetFillZero(amount, 64);

		let data_toin = "";
		if (data.length%2 == 0){
			data_toin = data;
		}else{
			data_toin = "0" + data;
		}
		let datalen_toin = (data_toin.length).toString(16);
		datalen_toin = GetFillZero(datalen_toin, 16);


		rawtx = rawtx + pubkey_toin;
		rawtx = rawtx + type_toin;
		rawtx = rawtx + time_toin;
		rawtx = rawtx + taglen_toin;
		rawtx = rawtx + tag_toin;
		rawtx = rawtx + index_toin;
		rawtx = rawtx + MerkleRoot_toin;
		rawtx = rawtx + toaddress_toin;
		rawtx = rawtx + amount_toin;
		rawtx = rawtx + datalen_toin;
		rawtx = rawtx + data_toin;

		if (!orgonly){
			/*
			署名

			sig 原文
			pubkey + type + time + tag length + tag + index + MerkleRoot + toaddress + amount + data length + data
			のsha256d
			*/
			let sig = "";
			if ("privkey" in TargetAccount.keys){
				let org = new this.hashs.hashs().sha256d(rawtx);
				sig = new this.crypto.signature().GetSignData(TargetAccount.keys["privkey"],org);
			}
			if ("sig" in objtx && objtx["sig"]){
				sig = objtx["sig"];
			}
			let siglen_toin = (sig.length).toString(16);
			siglen_toin = GetFillZero(siglen_toin, 16);
			rawtx = rawtx + siglen_toin + sig;



			/* nonce */
			let nonce = 0;
			if ("nonce" in objtx && objtx["nonce"]){
				nonce = objtx["nonce"];
			}
			let nonce_toin = GetFillZero(nonce, 16);
			rawtx = rawtx + nonce_toin;
		};

		return rawtx;
	};



	GetObjTx(rawtx=this.rawtx){

		function cut(len){
			let cuthex = rawtx.slice(0,len);
			rawtx = rawtx.slice(len);
			return cuthex
		};


		function VariableCut(){
			let len = parseInt(cut(16),16);

			let cuthex = rawtx.slice(0,len);
			rawtx = rawtx.slice(len);

			return cuthex
		};

		let pubkey = cut(66);
		let type = parseInt(cut(2),16);
		let time = parseInt(cut(16),16);
		let tag = VariableCut();
		let index = parseInt(cut(16),16);
		let MerkleRoot = cut(64);
		let toaddress = cut(40);
		let amount = parseInt(cut(64),16);
		let data = VariableCut();
		let sig = VariableCut();
		let nonce = parseInt(cut(16),16);

		let objtx = {
			"pubkey":pubkey,
			"type":type,
			"time":time,
			"tag":new this.hex.HexText().utf8_hex_string_to_string(tag),
			"index":index,
			"MerkleRoot":MerkleRoot,
			"toaddress":toaddress,
			"amount":amount,
			"data":data,
			"sig":sig,
			"nonce":nonce,
		};

		return objtx;
	};




	//txidの取得
	GetTxid(rawtx=this.rawtx){
		let txid = new this.hashs.hashs().sha256d(rawtx);
		return txid;
	}



	//トランザクション有効性
	Confirmation(rawtx=this.rawtx){

		let objtx = this.GetObjTx(rawtx);
		let TargetAccount = new this.account.account(objtx["pubkey"]);



		//シードは強制
		for (let index in Config.genesistxs){
			let seedrawtx = Config.genesistxs[index];

			let seedtxid = this.GetTxid(seedrawtx);
			if (this.GetTxid() == seedtxid){
				return 1;
			}
		}



		if (objtx["tag"] == "pay" && objtx["data"].length > 0){
			return 0;
		};



		//原文と署名文の確認
		let org = this.GetRawTx(TargetAccount,objtx,true);
		org = new this.hashs.hashs().sha256d(org);
		let sig = objtx["sig"];
		let sigbool = new this.crypto.signature().ConfirmationSign(org,sig,TargetAccount.keys["pubkey"]);
		if (!sigbool){
			return 0;
		};


		//txidとtarget
		let target = this.GetPOWTarget(rawtx);
		let numtxid = BigInt("0x"+this.GetTxid(rawtx));
		if (numtxid > target){
			return 0;
		};



		//MerkleRootとindexsからのMerkleRootの相違
		let pretxlist = TargetAccount.GetFormTxList(undefined,objtx["index"]);
		let IndexMerkleRoot = new this.hashs.hashs().GetMarkleroot(pretxlist);
		IndexMerkleRoot = GetFillZero(IndexMerkleRoot, 64);
		if (IndexMerkleRoot != objtx["MerkleRoot"]){
			return 0;
		};



		//indexの相違
		if (pretxlist.length+1 != objtx["index"]){
			return 0;
		}


		//トランザクション以前での残高の有無
		let balance = TargetAccount.GetBalance(undefined,objtx["index"]);
		if (balance < objtx["amount"]){
			return 0;
		}



		//時間が不自然
		let time = Math.floor(Date.now()/1000);
		if (objtx["time"] >= time){
			return 0;
		}
		if (pretxlist.length > 0){
			let lasttx = exports.GetTx(pretxlist.slice(-1)[0]);
			if (objtx["time"] <= lasttx.objtx["time"]){
				return 0;
			}
		}



		return 1;
	};



	GetPOWTarget(rawtx=this.rawtx){
		let objtx = this.GetObjTx(rawtx);
		let TargetAccount = new this.account.account(objtx["pubkey"]);


		let target_upper = BigInt("0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
		let time = objtx["time"];
		let txids = TargetAccount.GetFormTxList();
		
		let lasttx = false;
		if (txids.length > 0){
			lasttx  = exports.GetTx(txids.slice(-1)[0]);
		}
		let lasttxtime = time - 60*10;
		if (lasttx){
			lasttxtime = lasttx.objtx["time"];
		}

		let needtime = 60*10 - (time - lasttxtime);

		let target = target_upper;
		if (needtime > 0){
			if (needtime > 60*3){
				target = BigInt("0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
			}
			if (needtime > 60*6){
				target = BigInt("0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
			}
			if (needtime > 60*9){
				target = BigInt("0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
			}
		};

		return target;
	}


	commit(rawtx=this.rawtx){

		let outthis = this;
		function pow(rawtx,nonce){
			let database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);


			let objtx = outthis.GetObjTx(rawtx);
			let TargetAccount = new outthis.account.account(objtx["pubkey"]);


			/*
			powのtargetを特定する
			*/
			let target = outthis.GetPOWTarget(rawtx);
			//console.log(GetFillZero(target.toString(16), 64));


			objtx["nonce"] = nonce;

			rawtx = outthis.GetRawTx(TargetAccount,objtx);
			let txid = outthis.GetTxid(rawtx);
			let numtxid = BigInt("0x"+txid);


			if (numtxid <= target){
				database.add("UnconfirmedTransactions",objtx["tag"],rawtx);
			}else{
				nonce = nonce + 1;
				setTimeout(pow,1,rawtx,nonce);
			}
		}

		pow(rawtx,0);

		return true;
	};
};







function GetFillZero(hex, hexlength){
	let needzeroffill = hexlength-hex.length;
	if (needzeroffill > 0){
		for (var i=needzeroffill;i>0;i--){
			hex = "0" + hex
		};
	};

	return hex;
};


exports.GetAllTxids = function(){
	let database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);

	let txids = database.get("TransactionIdsPerAll","live");

	return txids;
}


exports.GetTx = function(txid){
	let database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);

	let rawtx = database.get("ConfirmedTransactions",txid);
	let TargetTransaction = new exports.Transaction(rawtx[0]);

	return TargetTransaction;
}











/*
未確認トランザクションの走査と確認
*/
exports.RunCommit = function(){
	let database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);
	let main = require('./main.js');


	function commit(TargetTransaction){
		database.add("ConfirmedTransactions",TargetTransaction.GetTxid(),TargetTransaction.rawtx);

		database.add("TransactionIdsPerTag",TargetTransaction.objtx["tag"],TargetTransaction.GetTxid());
		database.add("TransactionIdsPerAccount",TargetTransaction.TargetAccount.keys["address"],TargetTransaction.GetTxid());
		database.add("TransactionIdsPerAccount",TargetTransaction.objtx["toaddress"],TargetTransaction.GetTxid());
		database.add("TransactionIdsPerAll","live",TargetTransaction.GetTxid());

		main.note(1,"transaction_RunCommit_commit","[commit transaction] txid : "+TargetTransaction.GetTxid());
		return 1;
	}




	//シード適用
	let ConfirmedTransactions = database.get("ConfirmedTransactions");
	if (ConfirmedTransactions.length==0){
		for (let index in Config.genesistxs){
			let rawtx = Config.genesistxs[index];

			let SeedTransaction = new exports.Transaction(rawtx);

			database.add("UnconfirmedTransactions",SeedTransaction.objtx["tag"],rawtx);
		}
	}


	setInterval(
		function(){

			let UnconfirmedTransactionsTags = database.get("UnconfirmedTransactions");
			for (let index in UnconfirmedTransactionsTags){
				let tag = UnconfirmedTransactionsTags[index];

				if (Config.ImportTags.length>0 && (Config.ImportTags).indexOf(tag) == -1){
					continue;
				};


				let UnconfirmedTransactions = database.get("UnconfirmedTransactions",tag);

				for (let mindex in UnconfirmedTransactions){
					let rawtx = UnconfirmedTransactions[mindex];

					let TargetTransaction = new exports.Transaction(rawtx);


					main.note(1,"transaction_RunCommit_commit","[catch transaction] "+rawtx);

					let txbool = TargetTransaction.Confirmation();
					if (txbool){
						commit(TargetTransaction);
					}else{
						main.note(1,"transaction_RunCommit_commit","[pass transaction] "+rawtx);
					}
				}

				database.set("UnconfirmedTransactions",tag,[]);
			};
		},
		10000
	)
}