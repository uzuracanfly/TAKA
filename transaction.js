const MAIN = require('./main.js');
const CRYPTO = require('./crypto.js');
const ACCOUNT = require('./account.js');
const HASHS = require('./hashs.js');
const HEX = require('./hex.js');
const CONFIG = require('./config.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);
const FS = require('fs');

const TRANSACTIONTOOLS_TAGREWARD = require('./TransactionTools/tagreward');
const TRANSACTIONTOOLS_DATABASE = require('./TransactionTools/database.js');
const TRANSACTIONTOOLS_TAGORDER = require('./TransactionTools/tagorder.js');
const TRANSACTIONTOOLS_TAGADDPERMIT = require('./TransactionTools/tagaddpermit.js');
const TRANSACTIONTOOLS_CONTRACT = require('./TransactionTools/contract.js');


exports.Transaction = class{
	constructor(rawtx="",privkey="",objtx=""){
		this.rawtx = rawtx;
		this.objtx = objtx;
		this.privkey = privkey;
		this.setupbool = false;
	};




	async SetUpClass(){
		if (this.setupbool){
			return 0;
		}
		this.setupbool = true;

		if (this.privkey){
			this.TargetAccount = new ACCOUNT.account(this.privkey);
		};

		if (!this.rawtx){
			this.rawtx = await this.GetRawTx();
		}

		if (Object.keys(this.objtx).length == 0){
			this.objtx = await this.GetObjTx();
		}

		if (!this.privkey && Object.keys(this.objtx).length > 0){
			this.TargetAccount = new ACCOUNT.account(this.objtx["pubkey"]);
		};

		return 1;
	}



	/*
		通貨支払い

		pubkey : 4016桁
		type : 2桁
		time : 16桁
		tag length : 4桁
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
	async GetRawTx(TargetAccount=this.TargetAccount,objtx=this.objtx,orgonly=false){
		await this.SetUpClass();
		if (Object.keys(objtx).length == 0){
			objtx = this.objtx;
		}
		if (!TargetAccount){
			TargetAccount = this.TargetAccount;
		}


		let type = objtx["type"].toString(16);
		let time = Math.floor(objtx["time"]).toString(16);
		let tag = new HEX.HexText().string_to_utf8_hex_string(objtx["tag"]);
		let index = objtx["index"].toString(16);
		let MerkleRoot = objtx["MerkleRoot"];
		let toaddress = objtx["toaddress"];
		let amount = objtx["amount"].toString(16);
		let data = objtx["data"];



		let rawtx = "";

		let pubkey_toin = MAIN.GetFillZero((await TargetAccount.GetKeys())["pubkey"], 4016);
		let type_toin = MAIN.GetFillZero(type, 2);
		let time_toin = MAIN.GetFillZero(time, 16);

		let tag_toin = "";
		if (tag.length%2 == 0){
			tag_toin = tag;
		}else{
			tag_toin = "0" + tag;
		}
		let taglen_toin = (tag_toin.length).toString(16);
		taglen_toin = MAIN.GetFillZero(taglen_toin, 4);

		let index_toin = MAIN.GetFillZero(index, 16);
		let MerkleRoot_toin = MAIN.GetFillZero(MerkleRoot, 64);
		let toaddress_toin = MAIN.GetFillZero(toaddress, 40);
		let amount_toin = MAIN.GetFillZero(amount, 64);

		let data_toin = "";
		if (data.length%2 == 0){
			data_toin = data;
		}else{
			data_toin = "0" + data;
		}
		let datalen_toin = (data_toin.length).toString(16);
		datalen_toin = MAIN.GetFillZero(datalen_toin, 16);


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
			if ("sig" in objtx && objtx["sig"]){
				sig = objtx["sig"];
			}else if ("privkey" in (await TargetAccount.GetKeys()) && (await TargetAccount.GetKeys())["privkey"]){
				let org = new HASHS.hashs().sha256d(rawtx);
				sig = await new CRYPTO.signature().GetSignData((await TargetAccount.GetKeys())["privkey"],org);
			}
			let siglen_toin = (sig.length).toString(16);
			siglen_toin = MAIN.GetFillZero(siglen_toin, 16);
			rawtx = rawtx + siglen_toin + sig;



			/* nonce */
			let nonce = "";
			if ("nonce" in objtx && objtx["nonce"]){
				nonce = objtx["nonce"].toString(16);
			}
			let nonce_toin = MAIN.GetFillZero(nonce, 16);
			rawtx = rawtx + nonce_toin;
		};

		return rawtx;
	};



	async GetObjTx(rawtx=this.rawtx){
		await this.SetUpClass();
		if (!rawtx){
			rawtx = this.rawtx;
		}


		function cut(len){
			let cuthex = rawtx.slice(0,len);
			rawtx = rawtx.slice(len);
			return cuthex
		};


		function VariableCut(lenlen=16){
			let len = parseInt(cut(lenlen),16);

			let cuthex = rawtx.slice(0,len);
			rawtx = rawtx.slice(len);

			return cuthex
		};

		let pubkey = cut(4016);
		let type = parseInt(cut(2),16);
		let time = parseInt(cut(16),16);
		let tag = VariableCut(4);
		let index = parseInt(cut(16),16);
		let MerkleRoot = cut(64);
		let toaddress = cut(40);
		let amount = parseInt(cut(64),16);
		let data = VariableCut(16);
		let sig = VariableCut(16);
		let nonce = parseInt(cut(16),16);

		let objtx = {
			"pubkey":pubkey,
			"type":type,
			"time":time,
			"tag":new HEX.HexText().utf8_hex_string_to_string(tag),
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
	async GetTxid(rawtx=this.rawtx){
		await this.SetUpClass();
		if (!rawtx){
			rawtx=this.rawtx;
		}

		let txid = new HASHS.hashs().sha256d(rawtx);
		return txid;
	}



	//トランザクション有効性
	async Confirmation(rawtx=this.rawtx){
		try{
			await this.SetUpClass();
			if (!rawtx){
				rawtx=this.rawtx;
			}


			let objtx = await this.GetObjTx(rawtx);
			let TargetAccount = new ACCOUNT.account(objtx["pubkey"]);



			//シードは強制
			for (let index in CONFIG.genesistxs){
				let seedrawtx = CONFIG.genesistxs[index];

				let seedtxid = await this.GetTxid(seedrawtx);
				if (await this.GetTxid() == seedtxid){
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
			


			/*
			Pay関連
			*/
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
			tagorder & tagreward & tagaddpermit
			の場合はFeeが必要
			*/
			if (objtx["type"] == 11 || objtx["type"] == 12 || objtx["type"] == 13){
				let AmountToFeeAddress = await TargetAccount.GetSendAmountToAddress(undefined,"ffffffffffffffffffffffffffffffffffffffff");

				let LiquidationTargetTxidIndex = 1;
				LiquidationTargetTxidIndex = LiquidationTargetTxidIndex + (await TargetAccount.GetSendTxList(undefined,"tagorder")).length;
				LiquidationTargetTxidIndex = LiquidationTargetTxidIndex + (await TargetAccount.GetSendTxList(undefined,"tagreward")).length;
				LiquidationTargetTxidIndex = LiquidationTargetTxidIndex + (await TargetAccount.GetSendTxList(undefined,"tagaddpermit")).length;
				let NeedSumFee = LiquidationTargetTxidIndex * 1;

				if (AmountToFeeAddress < NeedSumFee){
					return 0;
				}
			};










			/*
			Tagreward関連
			*/
			if (objtx["type"] == 11 && objtx["tag"] != "tagreward"){
				return 0;
			};
			if (objtx["type"] != 11 && objtx["tag"] == "tagreward"){
				return 0;
			};
			if (objtx["type"] == 11){
				try{
					let Tagreward = new TRANSACTIONTOOLS_TAGREWARD.TagrewardData(objtx["data"]);
					let TagrewardObjData = Tagreward.GetObjData();

					if (objtx["toaddress"] != MAIN.GetFillZero("", 40)){
						return 0;
					};
				}catch(e){
					//console.log(e);
					return 0;
				};
			};





			/*
			tag order関連
			> 否定条件
			・指定tagにすでにtxが存在する
			*/
			if (objtx["type"] == 12 && objtx["tag"] != "tagorder"){
				return 0;
			};
			if (objtx["type"] != 12 && objtx["tag"] == "tagorder"){
				return 0;
			};
			if (objtx["type"] == 12){
				try{
					let Tagorder = new TRANSACTIONTOOLS_TAGORDER.TagOrderData(objtx["data"]);
					let TagorderObjData = Tagorder.GetObjData();

					if (objtx["toaddress"] != MAIN.GetFillZero("", 40)){
						return 0;
					};

					//システムの予約済みのタグを指定している場合
					if (TagorderObjData["tag"] == "pay" || TagorderObjData["tag"] == "tagorder" || TagorderObjData["tag"] == "tagreward" || TagorderObjData["tag"] == "tagaddpermit"){
						return 0;
					}

					let TAGORDERTX = await exports.GetTagOrderTx(TagorderObjData["tag"]);
					//tagorderが見つかった場合
					if (TAGORDERTX){
						return 0;
					}

				}catch(e){
					//console.log(e);
					return 0;
				};
			};





			/*
			タグへの権利者追加
			> 否定条件
			・タグの管理者自身が追加していない
			*/
			if (objtx["type"] == 13 && objtx["tag"] != "tagaddpermit"){
				return 0;
			};
			if (objtx["type"] != 13 && objtx["tag"] == "tagaddpermit"){
				return 0;
			};
			if (objtx["type"] == 13){
				try{
					let Tagaddpermit = new TRANSACTIONTOOLS_TAGADDPERMIT.TagAddPermitData(objtx["data"]);
					let TagaddpermitObjData = Tagaddpermit.GetObjData();

					if (objtx["toaddress"] != MAIN.GetFillZero("", 40)){
						return 0;
					};

					/* 送り主とtagorderの送り主が同一ではない場合 */
					let TAGORDERTX = await exports.GetTagOrderTx(TagaddpermitObjData["tag"]);
					//tagorderが見つからなかった場合
					if (!TAGORDERTX){
						return 0;
					}
					let tagordertxobj = await TAGORDERTX.GetObjTx();

					if (tagordertxobj["pubkey"] != objtx["pubkey"]){
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
				let TAGORDERTX = await exports.GetTagOrderTx(objtx["tag"]);
				//tagorderが見つからなかった場合
				if (!TAGORDERTX){
					return 0;
				}
				let tagordertxobj = await TAGORDERTX.GetObjTx();

				//tagorderのデータを取得
				let Tagorder = new TRANSACTIONTOOLS_TAGORDER.TagOrderData(tagordertxobj["data"]);
				let TagorderObjData = Tagorder.GetObjData();



				/*
					パーミッションの確認
					0、制限なし
					1、owner以外すべて制限
					2、指定されたアドレスのみ
				*/
				if (TagorderObjData["permissiontype"] == 1 && tagordertxobj["pubkey"] != objtx["pubkey"]){
					return 0;
				}


				if (TagorderObjData["permissiontype"] == 2 && tagordertxobj["pubkey"] != objtx["pubkey"]){
					let TagPermitAddresss = await exports.GetTagPermitAddresss(objtx["tag"]);

					//TagAddPermitAddresssの中にトランザクション発行元が許可されているか
					if (TagPermitAddresss.indexOf((await TargetAccount.GetKeys())["address"]) == -1){
						return 0;
					};
				};




				//dataサイズが上限を超えていないか
				if (TagorderObjData["DataMaxSizeInByte"] < objtx["data"].length/2){
					return 0;
				};




				/* tagorderで指定されているFeeが支払われているか確認 */

				//SenderからFeeToAddress宛のTAKA数量取得
				let AmountToFeeToAddress = await TargetAccount.GetSendAmountToAddress(undefined,TagorderObjData["FeeToAddress"]);

				//tag内におけるSenderのtx数から支払っておくべきfeeの数量を取得
				let LiquidationTargetTxidIndex = 1;
				LiquidationTargetTxidIndex = LiquidationTargetTxidIndex + (await TargetAccount.GetSendTxList(undefined,objtx["tag"])).length;
				let NeedSumFee = LiquidationTargetTxidIndex * TagorderObjData["FeeAmount"];

				//Fee不足
				if (AmountToFeeToAddress < NeedSumFee){
					return 0;
				}
			};










			/*
			contract
			*/
			if (objtx["type"] == 111){
				try{
					let objdata = new TRANSACTIONTOOLS_CONTRACT.SetFunctionData(objtx["data"]).GetObjData();


					//contractの設定権限の有無
					let TAGORDERTX = await exports.GetTagOrderTx(objtx["tag"]);
					//tagorderが見つからなかった場合
					if (!TAGORDERTX){
						return 0;
					}
					let tagordertxobj = await TAGORDERTX.GetObjTx();
					if (tagordertxobj["pubkey"] != objtx["pubkey"]){
						let TagPermitAddresss = await exports.GetTagPermitAddresss(objtx["tag"]);
						let keys = await TargetAccount.GetKeys();
						if (!(keys["address"] in TagPermitAddresss)){
							return 0;
						};
					};


					//禁止句が含まれる場合
					let CodeData = objdata["CodeData"];
					for (let index in CONFIG.Contract["banword"]){
						let banword = CONFIG.Contract["banword"][index];
						
						if (CodeData.indexOf(banword) != -1){
							return 0;
						}
					};
				}catch(e){
					MAIN.note(2,"Confirmation",e);
					return 0;
				};
			};
			if (objtx["type"] == 112){
				try{
					let objdata = new TRANSACTIONTOOLS_CONTRACT.RunFunctionData(objtx["data"]).GetObjData();
					let FunctionArgs = objdata["FunctionArgs"];
					let FunctionName = objdata["FunctionName"];
					let TxContractResult = objdata["result"];
					let TxContractSetData = objdata["SetData"];


					let CodeResult = await TRANSACTIONTOOLS_CONTRACT.RunCode(TargetAccount,objtx["tag"],FunctionName,FunctionArgs);
					if (!CodeResult){
						return 0;
					}

					if (!("result" in CodeResult) || !("SetData" in CodeResult)){
						return 0;
					}

					if (!CodeResult["result"]){
						return 0;
					}

					if (TxContractResult != CodeResult["result"] || JSON.stringify(TxContractSetData) != JSON.stringify(CodeResult["SetData"])){
						return 0;
					}



				}catch(e){
					MAIN.note(2,"Confirmation",e);
					return 0;
				};
			};











			//原文と署名文の確認
			let org = await this.GetRawTx(TargetAccount,objtx,true);
			org = new HASHS.hashs().sha256d(org);
			let sig = objtx["sig"];
			let sigbool = await new CRYPTO.signature().ConfirmationSign(org,sig,(await TargetAccount.GetKeys())["pubkey"]);
			if (!sigbool){
				return 0;
			};


			//txidとtarget
			let target = await this.GetPOWTarget(rawtx);
			let numtxid = BigInt("0x"+await this.GetTxid(rawtx));
			if (numtxid > target){
				return 0;
			};



			//MerkleRootとindexsからのMerkleRootの相違
			let pretxlist = await TargetAccount.GetFormTxList(undefined,objtx["tag"]);
			let IndexMerkleRoot = new HASHS.hashs().GetMarkleroot(pretxlist);
			IndexMerkleRoot = MAIN.GetFillZero(IndexMerkleRoot, 64);
			if (IndexMerkleRoot != objtx["MerkleRoot"]){
				return 0;
			};



			//indexの相違
			if (pretxlist.length+1 != objtx["index"]){
				return 0;
			}


			//トランザクション以前での残高の有無
			let balance = await TargetAccount.GetBalance(undefined,objtx["index"]);
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
				if (objtx["time"] <= (await lasttx.GetObjTx())["time"]){
					return 0;
				}
			}



			return 1;

		}catch(e){
			MAIN.note(2,"Confirmation",e);
			return 0;
		};
	};



	async GetPOWTarget(rawtx=this.rawtx,powtarget="",lasttxtime=0){
		await this.SetUpClass();
		if (!rawtx){
			rawtx=this.rawtx;
		}

		let target = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
		let objtx = await this.GetObjTx(rawtx);




		/* tagorderなどの場合 */
		if (objtx["tag"] == "tagorder" || objtx["tag"] == "tagreward" || objtx["tag"] == "tagaddpermit"){
			return target;
		}

		/* payでかつfee支払い用アドレスの場合 */
		if (objtx["tag"] == "pay" && (objtx["toaddress"] == "ffffffffffffffffffffffffffffffffffffffff" || objtx["toaddress"] == "0000000000000000000000000000000000000000")){
			return target;
		}




		/* ユーザー定義のtagの場合 */
		if (objtx["tag"] != "pay"){
			if (!powtarget){
				let TagOrderTx = await exports.GetTagOrderTx(objtx["tag"]);
				if (TagOrderTx){
					let TagOrderTxData = (await TagOrderTx.GetObjTx())["data"];

					let Tagorder = new TRANSACTIONTOOLS_TAGORDER.TagOrderData(TagOrderTxData);
					let TagorderObjData = Tagorder.GetObjData();
					powtarget = TagorderObjData["powtarget"];
				};
			};
		};
		if (powtarget){
			target = BigInt("0x"+powtarget);
		}





		/* payまたは自動指定が必要なタグの場合 */
		if (objtx["tag"] == "pay" || target == 0){
			let TargetAccount = new ACCOUNT.account(objtx["pubkey"]);
			let target_upper = BigInt("0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
			let time = objtx["time"];


			if (!lasttxtime){
				let txids = await TargetAccount.GetFormTxList(undefined,objtx["tag"],objtx["index"]);

				
				let lasttx = false;
				if (txids.length > 0){
					lasttx  = exports.GetTx(txids.slice(-1)[0]);
				}
				lasttxtime = time - 60*10;
				if (lasttx){
					lasttxtime = (await lasttx.GetObjTx())["time"];
				}
			};


			let needtime = 60*10 - (time - lasttxtime);

			target = target_upper;
			if (needtime > 0){
				if (needtime > 60*3){
					target = BigInt("0x000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
				}
				if (needtime > 60*6){
					target = BigInt("0x00000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
				}
				if (needtime > 60*9){
					target = BigInt("0x0000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffff");
				}
			};
		};




		return target;
	}


	async GetNonce(rawtx=this.rawtx,target=0,TimeoutToNonceScan=0){
		await this.SetUpClass();
		if (!rawtx){
			rawtx=this.rawtx;
		}

		let objtx = await this.GetObjTx(rawtx);

		let nonce = objtx["nonce"];
		let outthis = this;
		if (!target){
			target = await this.GetPOWTarget(rawtx);
		}
		let txid = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
		let numtxid = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");


		let StartTime = Math.floor(Date.now()/1000);
		while (true){
			try{
				let TargetAccount = new ACCOUNT.account(objtx["pubkey"]);

				objtx["nonce"] = nonce;
				rawtx = await outthis.GetRawTx(TargetAccount,objtx);
				txid = await outthis.GetTxid(rawtx);
				numtxid = BigInt("0x"+txid);


				if (numtxid <= target){
					return nonce;
				}else{
					nonce = nonce + 1;
				};


				if (TimeoutToNonceScan){
					if (Math.floor(Date.now()/1000) >= StartTime + TimeoutToNonceScan){
						return -1;
					}
				};
			}catch(e){
				MAIN.note(2,"GetNonce",e);
			};

			await MAIN.sleep(0.01);
		};
	}


	async commit(rawtx=this.rawtx,BoolUntilConfirmation=true,BoolStartConfirmation=false,TimeoutToNonceScan=0){
		await this.SetUpClass();
		if (!rawtx){
			rawtx=this.rawtx;
		}
		
		let objtx = await this.GetObjTx(rawtx);
		if (!objtx["tag"]){
			return false;
		}
		if ((await exports.GetImportTags()).length>0 && (await exports.GetImportTags()).indexOf(objtx["tag"]) == -1){
			return false;
		};

		if (BoolStartConfirmation){
			let txbool = await this.Confirmation(rawtx);
			if (!txbool){
				return false;
			}
		};
		

		let TargetAccount = new ACCOUNT.account(objtx["pubkey"]);
		let nonce = await this.GetNonce(rawtx,undefined,TimeoutToNonceScan);
		if (nonce == -1){
			return false;
		}
		objtx["nonce"] = nonce;

		rawtx = await this.GetRawTx(TargetAccount,objtx);
		let txid = await this.GetTxid(rawtx);

		DATABASE.add("UnconfirmedTransactions",objtx["tag"],rawtx);

		if (!BoolUntilConfirmation){
			return txid;
		}


		/* txが確認されたかの確認 */
		let timecount = 0;
		while (true){
			let rawtxs = DATABASE.get("ConfirmedTransactions",txid);

			if (rawtxs.length > 0){
				return txid;
			}
			if (timecount > 100*10){
				return false;
			}

			timecount = timecount + 1;

			await MAIN.sleep(0.01);
		}
	};
};










exports.GetAllTxids = function(){
	let txids = DATABASE.get("TransactionIdsPerAll","live");

	return txids;
}


exports.GetTx = function(txid){
	try{
		let rawtx = DATABASE.get("ConfirmedTransactions",txid);
		let TargetTransaction = new exports.Transaction(rawtx[0]);

		return TargetTransaction;
	}catch(e){
		MAIN.note(2,"GetTx",e);
		return false;
	}
}

exports.GetTags = function(){
	let tags = DATABASE.get("TransactionIdsPerTag");

	//空白は排除
	let result = tags.filter(function(vars) {
		return vars;
	});

	return result;
};

exports.GetTagTxids = async function(tag,LessTime=0){
	if (!tag){
		return [];
	}

	let txids = DATABASE.get("TransactionIdsPerTag",tag);

	let result = [];
	if (LessTime){
		for (let index in txids){
			let txid = txids[index];

			let TX = exports.GetTx(txid);
			let TxTime = (await TX.GetObjTx())["time"];

			if (TxTime < LessTime){
				result.push(txid);
			}
		}
	}else{
		result = txids;
	};

	return result;
}

exports.SendPayTransaction = async function(privkey,toaddress,amount,TimeoutToNonceScan=0){
	amount = parseInt(amount);

	let TargetAccount = new ACCOUNT.account(privkey);

	let FormTxList = await TargetAccount.GetFormTxList(undefined,"pay");
	let MerkleRoot = new HASHS.hashs().GetMarkleroot(FormTxList);

	let objtx = {
		"pubkey":(await TargetAccount.GetKeys())["pubkey"],
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
	let result = await TargetTransaction.commit(undefined,undefined,undefined,TimeoutToNonceScan);

	return result;
};

exports.GetTagOrderTx = async function(tag){
	try{
		let txids = DATABASE.get("TagOrderTransactionIdPerTag",tag);
		if (txids.length <= 0){
			return false;
		}
		let TX = exports.GetTx(txids[0]);
		return TX;
	}catch(e){
		MAIN.note(2,"GetTagOrderTx",e);
		return false;
	}
}


exports.GetTagPermitAddresss = async function(tag){
	try{
		let txids = DATABASE.get("TagaddpermitTransactionIdPerTag",tag);
		let PermitAddresss = [];
		for (let index in txids){
			let txid = txids[index];

			let TX = exports.GetTx(txid);
			let objtx = await TX.GetObjTx();

			let Tagaddpermit = new TRANSACTIONTOOLS_TAGADDPERMIT.TagAddPermitData(objtx["data"]);
			let TagaddpermitObjData = Tagaddpermit.GetObjData();

			PermitAddresss.push(TagaddpermitObjData["address"]);
		}

		return PermitAddresss;
	}catch(e){
		MAIN.note(2,"GetTagPermitAddresss",e);
		return 0;
	}
};



exports.GetUnconfirmedTransactions = async function(){
	rawtxs = [];

	let tags = DATABASE.get("UnconfirmedTransactions");
	for (let index in tags){
		let tag = tags[index];

		Array.prototype.push.apply(rawtxs, DATABASE.get("UnconfirmedTransactions",tag));
	};

	return rawtxs;
};



exports.GetImportTags = async function(){
	let ImportTags =  [];
	let DatabaseImportTags = DATABASE.get("ImportTags","live");
	for (let index in DatabaseImportTags){
		let tag = DatabaseImportTags[index];

		let HEXTEXT = new HEX.HexText();
		tag = HEXTEXT.utf8_hex_string_to_string(tag);
		ImportTags.push(tag);
	}

	Array.prototype.push.apply(ImportTags, CONFIG.ImportTags);

	/* 標準装備 */
	if (ImportTags.length > 0){
		if (ImportTags.indexOf("pay") == -1){
			ImportTags.push("pay");
		}
		if (ImportTags.indexOf("tagorder") == -1){
			ImportTags.push("tagorder");
		}
		if (ImportTags.indexOf("tagreward") == -1){
			ImportTags.push("tagreward");
		}
		if (ImportTags.indexOf("tagaddpermit") == -1){
			ImportTags.push("tagaddpermit");
		}
	};

	return ImportTags;
};


exports.SetImportTags = async function(type,tag){
	if (type == "add"){
		let ImportTags = await exports.GetImportTags();
		let index = ImportTags.indexOf(tag);
		if (index > -1){
			return 0;
		}
		let HEXTEXT = new HEX.HexText();
		tag = HEXTEXT.string_to_utf8_hex_string(tag);
		DATABASE.add("ImportTags","live",tag);
	}else if (type == "remove"){
		let ImportTags = await exports.GetImportTags();
		let index = ImportTags.indexOf(tag);
		if (index == -1){
			return 0;
		}
		DATABASE.remove("ImportTags","live",index);
	};
	return 1;
};






/*
未確認トランザクションの走査と確認
*/
exports.RunCommit = async function(){
	async function commit(TargetTransaction){
		let objtx = await TargetTransaction.GetObjTx();
		let rawtx = await TargetTransaction.GetRawTx();
		let txid = await TargetTransaction.GetTxid();

		DATABASE.add("ConfirmedTransactions",txid,rawtx);

		DATABASE.add("TransactionIdsPerTag",objtx["tag"],txid);
		DATABASE.add("TransactionIdsPerSenderAndTag",(await TargetTransaction.TargetAccount.GetKeys())["address"]+"_"+objtx["tag"],txid);
		DATABASE.add("TransactionIdsPerAccountAndTag",(await TargetTransaction.TargetAccount.GetKeys())["address"]+"_"+objtx["tag"],txid);
		DATABASE.add("TransactionIdsPerAccountAndTag",objtx["toaddress"]+"_"+objtx["tag"],txid);
		DATABASE.add("TransactionIdsPerAccount",(await TargetTransaction.TargetAccount.GetKeys())["address"],txid);
		DATABASE.add("TransactionIdsPerAccount",objtx["toaddress"],txid);
		DATABASE.add("TransactionIdsPerAll","live",txid);

		if (objtx["type"] == 12){
			let Tagorder = new TRANSACTIONTOOLS_TAGORDER.TagOrderData(objtx["data"]);
			let TagorderObjData = Tagorder.GetObjData();
			DATABASE.add("TagOrderTransactionIdPerTag",TagorderObjData["tag"],txid);
		}
		if (objtx["type"] == 13){
			let Tagaddpermit = new TRANSACTIONTOOLS_TAGADDPERMIT.TagAddPermitData(objtx["data"]);
			let TagaddpermitObjData = Tagaddpermit.GetObjData();
			DATABASE.add("TagaddpermitTransactionIdPerTag",TagaddpermitObjData["tag"],txid);
		}

		MAIN.note(0,"transaction_RunCommit_commit","[commit transaction] txid : "+txid);
		return 1;
	}




	//シード適用
	let ConfirmedTransactions = DATABASE.get("ConfirmedTransactions");
	if (ConfirmedTransactions.length==0){
		for (let index in CONFIG.genesistxs){
			let rawtx = CONFIG.genesistxs[index];

			let SeedTransaction = new exports.Transaction(rawtx);

			DATABASE.add("UnconfirmedTransactions",(await SeedTransaction.GetObjTx())["tag"],rawtx);
		}
	}


	while (true){
		function TagCompare(TagA, TagB){
			let comparison = 0;

			if (TagA == "pay"){
				comparison = -1;
			}else{
				comparison = 1;
			}

			return comparison;
		}
		async function RawTxOldCompare(RawTxA, RawTxB){
			let comparison = 0;

			let TargetTransactionA = new exports.Transaction(RawTxA);
			let ObjTxA = await TargetTransactionA.GetObjTx();
			let TargetTransactionB = new exports.Transaction(RawTxB);
			let ObjTxB = await TargetTransactionB.GetObjTx();

			if (ObjTxA["time"] < ObjTxB["time"]){
				comparison = -1;
			}else{
				comparison = 1;
			}

			return comparison;
		}


		let UnconfirmedTransactionsTags = DATABASE.get("UnconfirmedTransactions");
		UnconfirmedTransactionsTags = UnconfirmedTransactionsTags.sort(TagCompare);
		for (let index in UnconfirmedTransactionsTags){
			let tag = UnconfirmedTransactionsTags[index];

			if (!tag){
				continue;
			}
			if ((await exports.GetImportTags()).length>0 && (await exports.GetImportTags()).indexOf(tag) == -1){
				continue;
			};

			let UnconfirmedTransactions = DATABASE.get("UnconfirmedTransactions",tag);
			DATABASE.set("UnconfirmedTransactions",tag,[]);

			//timeが古い順並び替え
			UnconfirmedTransactions = UnconfirmedTransactions.sort(await RawTxOldCompare);


			for (let mindex in UnconfirmedTransactions){
				try{
					let rawtx = UnconfirmedTransactions[mindex];

					let TargetTransaction = new exports.Transaction(rawtx);


					MAIN.note(0,"transaction_RunCommit_commit","[catch transaction] "+rawtx);

					let txbool = await TargetTransaction.Confirmation();
					if (txbool){
						await commit(TargetTransaction);
					}else{
						MAIN.note(0,"transaction_RunCommit_commit","[pass transaction] "+rawtx);
					}
				}catch(e){
					MAIN.note(2,"RunCommit",e);
				}
				await MAIN.sleep(0.1);
			}
		};

		await MAIN.sleep(10);
	}
}