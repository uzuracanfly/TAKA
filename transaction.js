exports.Transaction = class{
	constructor(rawtx="",privkey="",objtx={}){
		this.main = require('./main.js');
		this.crypto = require('./crypto.js');
		this.account = require('./account.js');
		this.hashs = require('./hashs.js');
		this.hex = require('./hex.js');
		this.database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);


		if (privkey){
			this.TargetAccount = new this.account.account(privkey);
		};


		if (rawtx){
			this.rawtx = rawtx;
			this.objtx = this.GetObjTx();
			if (!privkey){
				this.TargetAccount = new this.account.account(this.objtx["pubkey"]);
			};
		}else{
			this.objtx = objtx;
			if (!privkey){
				this.TargetAccount = new this.account.account(this.objtx["pubkey"]);
			};
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

		let pubkey_toin = this.main.GetFillZero(TargetAccount.GetKeys()["pubkey"], 66);
		let type_toin = this.main.GetFillZero(type, 2);
		let time_toin = this.main.GetFillZero(time, 16);

		let tag_toin = "";
		if (tag.length%2 == 0){
			tag_toin = tag;
		}else{
			tag_toin = "0" + tag;
		}
		let taglen_toin = (tag_toin.length).toString(16);
		taglen_toin = this.main.GetFillZero(taglen_toin, 16);

		let index_toin = this.main.GetFillZero(index, 16);
		let MerkleRoot_toin = this.main.GetFillZero(MerkleRoot, 64);
		let toaddress_toin = this.main.GetFillZero(toaddress, 40);
		let amount_toin = this.main.GetFillZero(amount, 64);

		let data_toin = "";
		if (data.length%2 == 0){
			data_toin = data;
		}else{
			data_toin = "0" + data;
		}
		let datalen_toin = (data_toin.length).toString(16);
		datalen_toin = this.main.GetFillZero(datalen_toin, 16);


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
			if ("privkey" in TargetAccount.GetKeys() && TargetAccount.GetKeys()["privkey"]){
				let org = new this.hashs.hashs().sha256d(rawtx);
				sig = new this.crypto.signature().GetSignData(TargetAccount.GetKeys()["privkey"],org);
			}
			if ("sig" in objtx && objtx["sig"]){
				sig = objtx["sig"];
			}
			let siglen_toin = (sig.length).toString(16);
			siglen_toin = this.main.GetFillZero(siglen_toin, 16);
			rawtx = rawtx + siglen_toin + sig;



			/* nonce */
			let nonce = 0;
			if ("nonce" in objtx && objtx["nonce"]){
				nonce = objtx["nonce"];
			}
			let nonce_toin = this.main.GetFillZero(nonce, 16);
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




		//割り当て済みの部分は自由に利用できない
		if (objtx["type"] != 1 && objtx["type"] != 11 && objtx["type"] != 12 && objtx["type"] != 13){
			if (objtx["type"] <= 100){
				return 0;
			};
		}



		if (objtx["type"] != 1 && objtx["amount"] > 0){
			return 0;
		};
		



		if (objtx["type"] == 1 && objtx["tag"] != "pay"){
			return 0;
		};
		if (objtx["type"] != 1 && objtx["tag"] == "pay"){
			return 0;
		};
		if (objtx["type"] == 1 && objtx["data"].length > 0){
			return 0;
		};
		if (objtx["type"] == 1 && objtx["amount"] <= 0){
			return 0;
		};






		/*
		Nego関連
		*/

		if (objtx["type"] == 11 && objtx["tag"] != "nego"){
			return 0;
		};
		if (objtx["type"] != 11 && objtx["tag"] == "nego"){
			return 0;
		};
		if (objtx["type"] == 11){
			try{
				let nego = require('./TransactionTools/nego.js');
				let Nego = new nego.NegoData(objtx["data"]);
				let NegoObjData = Nego.GetObjData();
				//console.log(NegoObjData);
				if (!("tag" in NegoObjData) || !NegoObjData["tag"]){
					return 0;
				}
				if (!("EncryptoPrivkey" in NegoObjData) || !NegoObjData["EncryptoPrivkey"]){
					return 0;
				}
			}catch(e){
				return 0;
			};
		};





		/*
		tag order関連
		> 否定条件
		・指定tagにすでにtxが存在する
		・txのtag orderのデータのfeetxidのpubkeyとtxのpubkeyが違うまたは数量が足りない
		*/
		if (objtx["type"] == 12){
			try{
				let tagorder = require('./TransactionTools/tagorder.js');
				let Tagorder = new tagorder.TagOrderData(objtx["data"]);
				let TagorderObjData = Tagorder.GetObjData();

				let tagtxs = exports.GetTagTxids(objtx["tag"]);
				if (tagtxs.length > 0){
					return 0;
				};

				let feetx = exports.GetTx(TagorderObjData["feetxid"]);
				let feetxobj = feetx.GetObjTx();
				if (feetxobj["pubkey"] != objtx["pubkey"]){
					return 0;
				}
				if (feetxobj["amount"] < 1){
					return 0;
				}
				if (feetxobj["toaddress"] != this.main.GetFillZero("", 40)){
					return 0;
				}
			}catch(e){
				return 0;
			};
		};





		/*
		タグへの権利者追加
		> 否定条件
		・タグの管理者自身が追加していない
		*/
		if (objtx["type"] == 13){
			try{
				let tagaddpermit = require('./TransactionTools/tagaddpermit.js');
				let Tagaddpermit = new tagaddpermit.TagAddPermitData(objtx["data"]);
				let TagaddpermitObjData = Tagaddpermit.GetObjData();

				let TagOrderTx = exports.GetTagOrderTx(objtx["tag"]);
				if (TagOrderTx.GetObjTx()["pubkey"] != objtx["pubkey"]){
					return 0;
				}
			}catch(e){
				//console.log(e);
				return 0;
			};

		};






		/*
		ユーザー定義のデータ関連
		>否定条件
		・tag orderが提出されていないtagを利用している場合
			- tag orderのパーミッションタイプによるdata送信の制限
			 0、制限なし
			 1、owner以外すべて制限
			 2、指定されたアドレスのみ
		*/
		if (objtx["type"] > 100){
			let tagtxids = exports.GetTagTxids(objtx["tag"]);
			if (tagtxids){
				let tagordertxid = tagtxids[0];

				let tagordertx = exports.GetTx(tagordertxid);
				let tagordertxobj = tagordertx.GetObjTx();
				if (tagordertxobj["type"] != 12){
					return 0;
				};

				let tagorder = require('./TransactionTools/tagorder.js');
				let Tagorder = new tagorder.TagOrderData(tagordertxobj["data"]);
				let TagorderObjData = Tagorder.GetObjData();
				if (TagorderObjData["permissiontype"] == 1 && tagordertxobj["pubkey"] != objtx["pubkey"]){
					return 0;
				}


				if (TagorderObjData["permissiontype"] == 2 && tagordertxobj["pubkey"] != objtx["pubkey"]){
					let TagPermitAddresss = exports.GetTagPermitAddresss(objtx["tag"]);

					//TagAddPermitAddresssの中にトランザクション発行元が許可されているか
					if (TagPermitAddresss.indexOf(TargetAccount.GetKeys()["address"]) == -1){
						return 0;
					};
				};
			}else{
				return 0;
			}
		};






		//原文と署名文の確認
		let org = this.GetRawTx(TargetAccount,objtx,true);
		org = new this.hashs.hashs().sha256d(org);
		let sig = objtx["sig"];
		let sigbool = new this.crypto.signature().ConfirmationSign(org,sig,TargetAccount.GetKeys()["pubkey"]);
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
		let pretxlist = TargetAccount.GetFormTxList(undefined,objtx["tag"],objtx["index"]);
		let IndexMerkleRoot = new this.hashs.hashs().GetMarkleroot(pretxlist);
		IndexMerkleRoot = this.main.GetFillZero(IndexMerkleRoot, 64);
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

		//negoは固定
		if (objtx["tag"] == "nego"){
			return BigInt("0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
		}else if (objtx["tag"] == "pay"){
			let TargetAccount = new this.account.account(objtx["pubkey"]);
			let target_upper = BigInt("0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
			let time = objtx["time"];
			let txids = TargetAccount.GetFormTxList(undefined,objtx["tag"],objtx["index"]);
			
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
					target = BigInt("0x000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
				}
				if (needtime > 60*6){
					target = BigInt("0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
				}
				if (needtime > 60*9){
					target = BigInt("0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
				}
			};

			return target;
		}else{
			let TagOrderTx = exports.GetTagOrderTx(objtx["tag"]);

			if (TagOrderTx){
				let TagOrderTxData = TagOrderTx.GetObjTx()["data"];

				let tagorder = require('./TransactionTools/tagorder.js');
				let Tagorder = new tagorder.TagOrderData(TagOrderTxData);
				let TagorderObjData = Tagorder.GetObjData();

				let target = BigInt("0x"+TagorderObjData["powtarget"]);

				return target;
			}else{
				return BigInt("0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
			}
		}
	}


	commit(rawtx=this.rawtx){
		let outthis = this;
		let target = BigInt("0x0000000000000000000000000000000000000000000000000000000000000000");
		let txid = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
		let numtxid = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

		return new Promise(function (resolve, reject) {
			let bPromise = require('bluebird');
			(function loop(nonce) {
				let objtx = outthis.GetObjTx(rawtx);

				if (numtxid <= target){
					let database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);
					database.add("UnconfirmedTransactions",objtx["tag"],rawtx);

					return resolve(txid);
				}else{
					return bPromise.delay(1).then(function() {

						let TargetAccount = new outthis.account.account(objtx["pubkey"]);

						/*
						powのtargetを特定する
						*/
						target = outthis.GetPOWTarget(rawtx);

						objtx["nonce"] = nonce;

						rawtx = outthis.GetRawTx(TargetAccount,objtx);
						txid = outthis.GetTxid(rawtx);
						numtxid = BigInt("0x"+txid);
						
						return nonce+1;
					}).then(loop);
				};
			})(0);
		}).catch(function (error) {
			console.log(error);
		});
	};
};










exports.GetAllTxids = function(){
	let database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);

	let txids = database.get("TransactionIdsPerAll","live");

	return txids;
}


exports.GetTx = function(txid){
	try{
		let database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);

		let rawtx = database.get("ConfirmedTransactions",txid);
		let TargetTransaction = new exports.Transaction(rawtx[0]);

		return TargetTransaction;
	}catch(e){
		console.log(e);
		return {};
	}
}

exports.GetTags = function(){
	let database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);

	let tags = database.get("UnconfirmedTransactions");

	return tags;
};

exports.GetTagTxids = function(tag){
	let database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);

	let txids = database.get("TransactionIdsPerTag",tag);

	return txids;
}

exports.GetTagMerkleRoot = function(tag){
	let Hashs = require('./hashs.js');

	let txids = exports.GetTagTxids(tag);

	let MerkleRoot = new Hashs.hashs().GetMarkleroot(txids);
	return MerkleRoot;
};

exports.SendPayTransaction = function(privkey,toaddress,amount){
	amount = parseInt(amount);

	let TargetAccount = new (require('./account.js')).account(privkey);

	let FormTxList = TargetAccount.GetFormTxList(undefined,"pay");
	let MerkleRoot = new (require('./hashs.js')).hashs().GetMarkleroot(FormTxList);

	let objtx = {
		"pubkey":TargetAccount.GetKeys()["pubkey"],
		"type":1,
		"time":Math.floor(Date.now()/1000),
		"tag":"pay",
		"index":FormTxList.length+1,
		"MerkleRoot":MerkleRoot,
		"toaddress":toaddress,
		"amount":amount,
		"data":"",
		"sig":"",
		"nonce":0
	};
	let TargetTransaction = new exports.Transaction("",privkey,objtx);
	let result = TargetTransaction.commit();

	return result;
};

exports.GetTagOrderTx = function(tag){
	let tagtxs = exports.GetTagTxids(tag);
	if (tagtxs){
		let tagordertxid = tagtxs[0];

		let tagordertx = exports.GetTx(tagordertxid);
		let tagordertxobj = tagordertx.GetObjTx();
		if (tagordertxobj["type"] != 12){
			return 0;
		};

		return tagordertx;
	}else{
		return 0;
	}
}


exports.GetTagPermitAddresss = function(tag){
	let tagtxids = exports.GetTagTxids(tag);

	let PermitAddresss = [];
	for (let index in tagtxids){
		let tagtxid = tagtxids[index];

		let tagtx = exports.GetTx(tagtxid);
		let tagtxobj = tagtx.GetObjTx();
		if (tagtxobj["type"] == 13){
			let tagaddpermit = require('./TransactionTools/tagaddpermit.js');
			let Tagaddpermit = new tagaddpermit.TagAddPermitData(tagtxobj["data"]);
			let TagaddpermitObjData = Tagaddpermit.GetObjData();
			PermitAddresss.push(TagaddpermitObjData["address"]);
		}
	};

	return PermitAddresss;
};






/*
未確認トランザクションの走査と確認
*/
exports.RunCommit = function(){
	let database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);
	let main = require('./main.js');


	function commit(TargetTransaction){
		database.add("ConfirmedTransactions",TargetTransaction.GetTxid(),TargetTransaction.rawtx);

		database.add("TransactionIdsPerTag",TargetTransaction.objtx["tag"],TargetTransaction.GetTxid());
		database.add("TransactionIdsPerAccount",TargetTransaction.TargetAccount.GetKeys()["address"],TargetTransaction.GetTxid());
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

				//timeが古い順並び替え
				let UnconfirmedTransactionsSort = [];
				for (let mindex in UnconfirmedTransactions){
					let oldtime = 9999999999999999;
					let oldrawtx = "";
					for (let mmindex in UnconfirmedTransactions){
						let rawtx = UnconfirmedTransactions[mmindex];

						if (UnconfirmedTransactionsSort.indexOf(rawtx) >= 0){
							continue;
						}

						let TargetTransaction = new exports.Transaction(rawtx);

						let objtx = TargetTransaction.GetObjTx();
						if (oldtime >= objtx["time"]){
							oldtime = objtx["time"];
							oldrawtx = rawtx;
						}
					};
					if (oldrawtx){
						UnconfirmedTransactionsSort.push(oldrawtx);
					}
				};


				for (let mindex in UnconfirmedTransactionsSort){
					let rawtx = UnconfirmedTransactionsSort[mindex];

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