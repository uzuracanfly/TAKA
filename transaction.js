const MAIN = require('./main.js');
const CRYPTO = require('./crypto.js');
const ACCOUNT = require('./account.js');
const HASHS = require('./hashs.js');
const HEX = require('./hex.js');
const CONFIG = require('./config.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);
const FS = require('fs');
const CP = require('child_process');
const CPULEN = require('os').cpus().length;
const HTTP = require('http');
const SYNCREQUEST = require('sync-request');

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
		ToIndex : 16桁
		MerkleRoot : 64桁
		ToMerkleRoot : 64桁
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
		let ToIndex = objtx["ToIndex"].toString(16);
		let MerkleRoot = objtx["MerkleRoot"];
		let ToMerkleRoot = objtx["ToMerkleRoot"];
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
		let ToIndex_toin = MAIN.GetFillZero(ToIndex, 16);
		let MerkleRoot_toin = MAIN.GetFillZero(MerkleRoot, 64);
		let ToMerkleRoot_toin = MAIN.GetFillZero(ToMerkleRoot, 64);
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
		rawtx = rawtx + ToIndex_toin;
		rawtx = rawtx + MerkleRoot_toin;
		rawtx = rawtx + ToMerkleRoot_toin;
		rawtx = rawtx + toaddress_toin;
		rawtx = rawtx + amount_toin;
		rawtx = rawtx + datalen_toin;
		rawtx = rawtx + data_toin;

		if (!orgonly){
			/*
			署名

			sig 原文
			pubkey + type + time + tag length + tag + index + ToIndex + MerkleRoot + ToMerkleRoot + toaddress + amount + data length + data
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
		let ToIndex = parseInt(cut(16),16);
		let MerkleRoot = cut(64);
		let ToMerkleRoot = cut(64);
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
			"ToIndex":ToIndex,
			"MerkleRoot":MerkleRoot,
			"ToMerkleRoot":ToMerkleRoot,
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



	/*
		トランザクション有効性

		0 : 無効
		1 : 有効
		2 : 有効 (Senderにおける現存の同じindexのtxは排除)
		3 : 有効 (Toにおける現存の同じindexのtxは排除)
	*/
	async Confirmation(rawtx=this.rawtx){
		try{
			await this.SetUpClass();
			if (!rawtx){
				rawtx=this.rawtx;
			}


			let objtx = await this.GetObjTx(rawtx);
			let TargetAccount = new ACCOUNT.account(objtx["pubkey"]);
			let ToTargetAccount = new ACCOUNT.account(objtx["toaddress"]);



			//シードは強制
			for (let index in CONFIG.genesistxs){
				let seedrawtx = CONFIG.genesistxs[index];

				let seedtxid = await this.GetTxid(seedrawtx);
				if (await this.GetTxid() == seedtxid){
					return 1;
				}
			}





			//すでにtxidが存在する
			let TX = exports.GetTx(await this.GetTxid(rawtx));
			if (TX){
				return 0;
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













			/*
			indexによって変動する条件達
			同じindexを廃したtxidlistで条件の確認
			*/


			//トランザクション以前での残高の有無
			if (objtx["tag"] == "pay"){
				let balance = await TargetAccount.GetBalance(undefined,objtx["index"]);
				if (balance < objtx["amount"]){
					return 0;
				}
			};



			let NoSamePretxlist = await TargetAccount.GetFormTxList(undefined,objtx["tag"],objtx["index"]);
			let NoSameToPretxlist = await ToTargetAccount.GetFormTxList(undefined,objtx["tag"],objtx["ToIndex"]);



			//MerkleRootの相違
			let IndexMerkleRoot = new HASHS.hashs().GetMarkleroot(NoSamePretxlist);
			IndexMerkleRoot = MAIN.GetFillZero(IndexMerkleRoot, 64);
			if (IndexMerkleRoot != objtx["MerkleRoot"]){
				return 0;
			};



			//ToMerkleRootの相違
			let ToIndexMerkleRoot = new HASHS.hashs().GetMarkleroot(NoSameToPretxlist);
			ToIndexMerkleRoot = MAIN.GetFillZero(ToIndexMerkleRoot, 64);
			if (ToIndexMerkleRoot != objtx["ToMerkleRoot"]){
				return 0;
			};



			//indexの相違
			if (NoSamePretxlist.length+1 != objtx["index"]){
				return 0;
			}


			//ToIndexの相違
			if (NoSameToPretxlist.length+1 != objtx["ToIndex"]){
				return 0;
			}



			//時間が不自然
			let time = Math.floor(Date.now()/1000);
			if (objtx["time"] >= time){
				return 0;
			}
			if (NoSamePretxlist.length > 0){
				let lasttx = exports.GetTx(NoSamePretxlist.slice(-1)[0]);
				if (objtx["time"] <= (await lasttx.GetObjTx())["time"]){
					return 0;
				}
			}








			/*
			現状のtxlistと比べて相違がないか確認
			*/

			let pretxlist = await TargetAccount.GetFormTxList(undefined,objtx["tag"]);
			let ToPretxlist = await ToTargetAccount.GetFormTxList(undefined,objtx["tag"]);

			let SenderBalance = await TargetAccount.GetBalance(undefined,undefined,objtx["time"],1);
			let ToBalance = await ToTargetAccount.GetBalance(undefined,undefined,objtx["time"],1);


			//indexの相違

			if (pretxlist.length+1 != objtx["index"]){
				if (pretxlist.length > 0){
					/*
						同じindexにあるtxと入れ替えるか確認
					*/


					//同じindexに位置する前のtxの情報取得
					let PreTxidSameIndex = pretxlist.slice(-1)[0];
					let NumPreTxidSameIndex = BigInt("0x"+PreTxidSameIndex);

					let PRETXSAMEINDEX = exports.GetTx(PreTxidSameIndex);
					let PreTxSameIndexObjTx = await PRETXSAMEINDEX.GetObjTx();

					let PreTxSameIndexSenderAccount = new ACCOUNT.account(PreTxSameIndexObjTx["pubkey"]);
					let PreTxSameIndexSenderAccountTxids = await PreTxSameIndexSenderAccount.GetFormTxList(undefined,objtx["tag"]);
					let PreTxSameIndexSenderAccountBalance = await PreTxSameIndexSenderAccount.GetBalance(undefined,undefined,PreTxSameIndexObjTx["time"],1);

					let PreTxSameIndexToAccount = new ACCOUNT.account(PreTxSameIndexObjTx["toaddress"]);
					let PreTxSameIndexToAccountTxids = await PreTxSameIndexToAccount.GetFormTxList(undefined,objtx["tag"]);
					let PreTxSameIndexToAccountBalance = await PreTxSameIndexToAccount.GetBalance(undefined,undefined,PreTxSameIndexObjTx["time"],1);


					//Fee宛送金が最優先される
					if (objtx["tag"] == "pay"){
						if (objtx["toaddress"] == "0000000000000000000000000000000000000000" || objtx["toaddress"] == "ffffffffffffffffffffffffffffffffffffffff"){
							return 2;
						}
						if (PreTxSameIndexObjTx["toaddress"] == "0000000000000000000000000000000000000000" || PreTxSameIndexObjTx["toaddress"] == "ffffffffffffffffffffffffffffffffffffffff"){
							return 0;
						}
					};


					//スコアー
					let scores = {"PreTxSameIndex":0,"TargetTx":0};
					if (numtxid < NumPreTxidSameIndex){
						scores["TargetTx"] = scores["TargetTx"] + 1;
					}else if (numtxid > NumPreTxidSameIndex){
						scores["PreTxSameIndex"] = scores["PreTxSameIndex"] + 1;
					}

					if (SenderBalance+ToBalance > PreTxSameIndexSenderAccountBalance+PreTxSameIndexToAccountBalance){
						scores["TargetTx"] = scores["TargetTx"] + 2;
					}else if (SenderBalance+ToBalance < PreTxSameIndexSenderAccountBalance+PreTxSameIndexToAccountBalance){
						scores["PreTxSameIndex"] = scores["PreTxSameIndex"] + 2;
					}

					//console.log(scores);

					//同じindexに位置する前のtxのsenderとto共にそのtxが先端か確認
					//送信主のTAKA量の確認
					if (PreTxSameIndexSenderAccountTxids.slice(-1)[0] == PreTxidSameIndex && PreTxSameIndexToAccountTxids.slice(-1)[0] == PreTxidSameIndex && scores["TargetTx"] > scores["PreTxSameIndex"]){
						return 2;
					}else{
						return 0;
					}
				}else{
					return 0;
				};
			}





			//ToIndexの相違

			if (ToPretxlist.length+1 != objtx["ToIndex"]){
				if (ToPretxlist.length > 0){
					/*
						同じindexにあるtxと入れ替えるか確認
					*/


					//同じindexに位置する前のtxの情報取得
					let PreTxidSameIndex = ToPretxlist.slice(-1)[0];
					let NumPreTxidSameIndex = BigInt("0x"+PreTxidSameIndex);

					let PRETXSAMEINDEX = exports.GetTx(PreTxidSameIndex);
					let PreTxSameIndexObjTx = await PRETXSAMEINDEX.GetObjTx();

					let PreTxSameIndexSenderAccount = new ACCOUNT.account(PreTxSameIndexObjTx["pubkey"]);
					let PreTxSameIndexSenderAccountTxids = await PreTxSameIndexSenderAccount.GetFormTxList(undefined,objtx["tag"]);
					let PreTxSameIndexSenderAccountBalance = await PreTxSameIndexSenderAccount.GetBalance(undefined,undefined,PreTxSameIndexObjTx["time"],1);

					let PreTxSameIndexToAccount = new ACCOUNT.account(PreTxSameIndexObjTx["toaddress"]);
					let PreTxSameIndexToAccountTxids = await PreTxSameIndexToAccount.GetFormTxList(undefined,objtx["tag"]);
					let PreTxSameIndexToAccountBalance = await PreTxSameIndexToAccount.GetBalance(undefined,undefined,PreTxSameIndexObjTx["time"],1);


					//スコアー
					let scores = {"PreTxSameIndex":0,"TargetTx":0};
					if (numtxid < NumPreTxidSameIndex){
						scores["TargetTx"] = scores["TargetTx"] + 1;
					}else if (numtxid > NumPreTxidSameIndex){
						scores["PreTxSameIndex"] = scores["PreTxSameIndex"] + 1;
					}

					if (SenderBalance+ToBalance > PreTxSameIndexSenderAccountBalance+PreTxSameIndexToAccountBalance){
						scores["TargetTx"] = scores["TargetTx"] + 2;
					}else if (SenderBalance+ToBalance < PreTxSameIndexSenderAccountBalance+PreTxSameIndexToAccountBalance){
						scores["PreTxSameIndex"] = scores["PreTxSameIndex"] + 2;
					}


					//console.log(scores);


					//同じindexに位置する前のtxのsenderとto共にそのtxが先端か確認
					if (PreTxSameIndexSenderAccountTxids.slice(-1)[0] == PreTxidSameIndex && PreTxSameIndexToAccountTxids.slice(-1)[0] == PreTxidSameIndex && scores["TargetTx"] > scores["PreTxSameIndex"]){
						return 3;
					}else{
						return 0;	
					}
				}else{
					return 0;
				};
			}




			return 1;

		}catch(e){
			console.log(e);
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
			let target_upper = BigInt("0x000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
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


			let TimeFromBeforeTx = time - lasttxtime;

			target = target_upper;
			if (TimeFromBeforeTx < 60*5){
				target = BigInt("0x0000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
			}
			if (TimeFromBeforeTx < 60*1){
				target = BigInt("0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
			}
		};




		return target;
	}


	async GetNonce(rawtx=this.rawtx,target=0,TimeoutToNonceScan=60){
		await this.SetUpClass();
		if (!rawtx){
			rawtx=this.rawtx;
		}


		let objtx = await this.GetObjTx(rawtx);
		if (!target){
			target = await this.GetPOWTarget(rawtx);
		}
		let StartTime = Math.floor(Date.now()/1000);


		return new Promise(async function (resolve, reject) {
			let ChildList = [];
			new Promise(async function (mresolve, mreject) {
				try{

					let args = {"nonce":objtx["nonce"],"rawtx":rawtx,"StartTime":StartTime,"TimeoutToNonceScan":TimeoutToNonceScan,"target":target.toString()};


					if(typeof CP.spawn == 'function') {
						let headers = {
							'Content-Type':'application/json'
						};

						//リクエスト送信
						let res = SYNCREQUEST(
							'POST',
							`http://${CONFIG.Transaction["address"]}:${CONFIG.Transaction["port"]}`, 
							{
								headers: headers,
								json: {"function":"GetNonce","args":args},
							}
						);
						return mresolve(parseInt( JSON.parse(res.getBody('utf8')) ));
					}else{
						let ProcessCount = navigator.hardwareConcurrency;
						if (TimeoutToNonceScan == -1){
							ProcessCount = 1;
						};
						
						for (let index=0;index<ProcessCount;index++){
							//index0移行はランダムで最初のnonce決める
							if (index != 0){
								args = {"nonce":Math.floor( Math.random() * parseInt("ffffffffffffffff",16) ),"rawtx":rawtx,"StartTime":StartTime,"TimeoutToNonceScan":TimeoutToNonceScan,"target":target.toString()};
							};

							let child = new Worker(CONFIG.API["AccessPoint"]+"/lib/"+'GetNonceForWeb');
							ChildList.push(child);
							child.onmessage = function(e) {
								return mresolve(parseInt(e.data));
							}
							child.postMessage(args);
						};
					};
				}catch(e){
					return mresolve(-1);
				}
			}).then(async function(nonce){
				if(typeof CP.spawn != 'function') {
					for (let index in ChildList){
						let child = ChildList[index];

						child.terminate();
					}
				}
				return resolve(nonce);
			});
		});
	}


	async commit(rawtx=this.rawtx,BoolUntilConfirmation=true,BoolStartConfirmation=false,TimeoutToNonceScan=60){
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

		await DATABASE.add("UnconfirmedTransactions",objtx["tag"],rawtx);

		if (!BoolUntilConfirmation){
			return txid;
		}


		/* txが確認されたかの確認 */
		let timecount = 0;
		while (true){
			let TX = exports.GetTx(txid);

			if (TX){
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
	let txids = await DATABASE.get("TransactionIdsPerAll","live");

	return txids;
}


exports.GetTx = function(txid){
	try{
		let rawtx = await DATABASE.get("ConfirmedTransactions",txid);
		if (rawtx.length <= 0){
			return false;
		}

		let TargetTransaction = new exports.Transaction(rawtx[0]);

		return TargetTransaction;
	}catch(e){
		MAIN.note(2,"GetTx",e);
		return false;
	}
}


exports.GetRawTxToDirect = async function(txid){
	try{
		let rawtxs = await DATABASE.get("ConfirmedTransactions",txid);
		if (rawtxs.length <= 0){
			return false;
		}

		return rawtxs[0];
	}catch(e){
		MAIN.note(2,"GetRawTxToDirect",e);
		return false;
	}
}



exports.GetTags = function(){
	let tags = await DATABASE.get("TransactionIdsPerTag");

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

	let txids = await DATABASE.get("TransactionIdsPerTag",tag);

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

exports.GetLessIndexFromLessTime = async function(address,tag,LessTime){
	try{
		let TimeRaIndexs = await DATABASE.get("TransactionTimeRaIndexPerAccountAndTag",address+"_"+tag);
		if (TimeRaIndexs.length <= 0){
			return 0;
		}

		let MaxIndex = 0;
		for (let index in TimeRaIndexs){
			let TimeRaIndex = TimeRaIndexs[index];

			if (LessTime <= parseInt(TimeRaIndex["time"])){
				continue;
			}
			if (MaxIndex < parseInt(TimeRaIndex["index"])){
				MaxIndex = parseInt(TimeRaIndex["index"]);
			}
		}

		return MaxIndex+1;
	}catch(e){
		MAIN.note(2,"GetLessIndexFromLessTime",e);
		return false;
	}
};


exports.SendTransaction = async function(privkey,type,tag,toaddress,amount,data,time=Math.floor(Date.now()/1000),BoolUntilConfirmation=undefined,BoolStartConfirmation=undefined,TimeoutToNonceScan=undefined){
	type = parseInt(type);
	amount = parseInt(amount);
	toaddress = MAIN.GetFillZero(toaddress, 40);

	let TargetAccount = new ACCOUNT.account(privkey);
	let ToTargetAccount = new ACCOUNT.account(toaddress);

	let FormTxList = await TargetAccount.GetFormTxList(undefined,tag);
	let MerkleRoot = new HASHS.hashs().GetMarkleroot(FormTxList);

	let ToFormTxList = await ToTargetAccount.GetFormTxList(undefined,tag);
	let ToMerkleRoot = new HASHS.hashs().GetMarkleroot(ToFormTxList);

	let objtx = {
		"pubkey":(await TargetAccount.GetKeys())["pubkey"],
		"type":type,
		"time":time,
		"tag":tag,
		"index":FormTxList.length+1,
		"ToIndex":ToFormTxList.length+1,
		"MerkleRoot":MerkleRoot,
		"ToMerkleRoot":ToMerkleRoot,
		"toaddress":toaddress,
		"amount":amount,
		"data":data,
		"sig":"",
		"nonce":0
	};
	let TargetTransaction = new exports.Transaction("",privkey,objtx);
	let result = await TargetTransaction.commit(undefined,BoolUntilConfirmation,BoolStartConfirmation,TimeoutToNonceScan);

	return result;
};



exports.SendPayTransaction = async function(privkey,toaddress,amount){
	let result = await exports.SendTransaction(privkey,1,"pay",toaddress,amount,"");

	return result;
};

exports.GetTagOrderTx = async function(tag){
	try{
		let txids = await DATABASE.get("TagOrderTransactionIdPerTag",tag);
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
		let txids = await DATABASE.get("TagaddpermitTransactionIdPerTag",tag);
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

	let tags = await DATABASE.get("UnconfirmedTransactions");
	for (let index in tags){
		let tag = tags[index];

		Array.prototype.push.apply(rawtxs, await DATABASE.get("UnconfirmedTransactions",tag));
	};

	return rawtxs;
};



exports.GetImportTags = async function(){
	let ImportTags = [];
	let DatabaseImportTags = await DATABASE.get("ImportTags","live");

	Array.prototype.push.apply(ImportTags, DatabaseImportTags);
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
		await DATABASE.add("ImportTags","live",tag);
	}else if (type == "remove"){
		let ImportTags = await exports.GetImportTags();
		let index = ImportTags.indexOf(tag);
		if (index == -1){
			return 0;
		}
		await DATABASE.remove("ImportTags","live",index);
	};
	return 1;
};






exports.TagCompare = function(TagA, TagB){
	if (TagA == "pay"){
		return -1;
	}
	if (TagA == "tagorder" && TagB != "pay"){
		return -1;
	}
	if (TagA == "tagaddpermit" && TagB != "pay" && TagB != "tagorder"){
		return -1;
	}

	return 1;
}








/*
未確認トランザクションの走査と確認
*/
exports.RunCommit = async function(){
	async function commit(TargetTransaction){
		let objtx = await TargetTransaction.GetObjTx();
		let rawtx = await TargetTransaction.GetRawTx();
		let txid = await TargetTransaction.GetTxid();

		await DATABASE.add("TransactionIdsPerTag",objtx["tag"],txid);
		await DATABASE.add("TransactionIdsPerSenderAndTag",(await TargetTransaction.TargetAccount.GetKeys())["address"]+"_"+objtx["tag"],txid);
		await DATABASE.add("TransactionIdsPerAccountAndTag",(await TargetTransaction.TargetAccount.GetKeys())["address"]+"_"+objtx["tag"],txid);
		await DATABASE.add("TransactionIdsPerAccountAndTag",objtx["toaddress"]+"_"+objtx["tag"],txid);
		await DATABASE.add("TransactionIdsPerAccount",(await TargetTransaction.TargetAccount.GetKeys())["address"],txid);
		await DATABASE.add("TransactionIdsPerAccount",objtx["toaddress"],txid);
		await DATABASE.add("TransactionIdsPerAccountAndToAccountAndTag",(await TargetTransaction.TargetAccount.GetKeys())["address"]+"_"+objtx["toaddress"]+"_"+objtx["tag"],txid);
		await DATABASE.add("TransactionIdsPerAll","live",txid);

		//indexと時間の関連付け
		let data = {"time":objtx["time"],"index":objtx["index"],"txid":txid};
		await DATABASE.add("TransactionTimeRaIndexPerAccountAndTag",(await TargetTransaction.TargetAccount.GetKeys())["address"]+"_"+objtx["tag"],data);
		data = {"time":objtx["time"],"index":objtx["ToIndex"],"txid":txid};
		await DATABASE.add("TransactionTimeRaIndexPerAccountAndTag",objtx["toaddress"]+"_"+objtx["tag"],data);

		if (objtx["type"] == 12){
			let Tagorder = new TRANSACTIONTOOLS_TAGORDER.TagOrderData(objtx["data"]);
			let TagorderObjData = Tagorder.GetObjData();
			await DATABASE.add("TagOrderTransactionIdPerTag",TagorderObjData["tag"],txid);
		}
		if (objtx["type"] == 13){
			let Tagaddpermit = new TRANSACTIONTOOLS_TAGADDPERMIT.TagAddPermitData(objtx["data"]);
			let TagaddpermitObjData = Tagaddpermit.GetObjData();
			await DATABASE.add("TagaddpermitTransactionIdPerTag",TagaddpermitObjData["tag"],txid);
		}

		await DATABASE.add("ConfirmedTransactions",txid,rawtx);

		//payの場合残高をキャッシュ
		if (objtx["type"] == 1){
			let data = {"index":objtx["index"],"amount":(await TargetTransaction.TargetAccount.GetSendAmountToAddress(undefined,objtx["toaddress"]))};
			await DATABASE.add("SendAmountToAddressPerAddress",`${(await TargetTransaction.TargetAccount.GetKeys())["address"]}_${objtx["toaddress"]}`,data);

			data = {"index":objtx["index"],"balance":(await TargetTransaction.TargetAccount.GetBalance())};
			await DATABASE.add("BalancePerAddress",(await TargetTransaction.TargetAccount.GetKeys())["address"],data);

			let ToTargetAccount = new ACCOUNT.account(objtx["toaddress"]);
			data = {"index":objtx["ToIndex"],"balance":(await ToTargetAccount.GetBalance())};
			await DATABASE.add("BalancePerAddress",objtx["toaddress"],data);
		};


		MAIN.note(1,"transaction_RunCommit_commit","[commit transaction] txid : "+txid);
		return 1;
	}
	async function reset(TargetTransaction){
		let objtx = await TargetTransaction.GetObjTx();
		let rawtx = await TargetTransaction.GetRawTx();
		let txid = await TargetTransaction.GetTxid();

		await DATABASE.remove("TransactionIdsPerTag",objtx["tag"],-1,txid);
		await DATABASE.remove("TransactionIdsPerSenderAndTag",(await TargetTransaction.TargetAccount.GetKeys())["address"]+"_"+objtx["tag"],-1,txid);
		await DATABASE.remove("TransactionIdsPerAccountAndTag",(await TargetTransaction.TargetAccount.GetKeys())["address"]+"_"+objtx["tag"],-1,txid);
		await DATABASE.remove("TransactionIdsPerAccountAndTag",objtx["toaddress"]+"_"+objtx["tag"],-1,txid);
		await DATABASE.remove("TransactionIdsPerAccount",(await TargetTransaction.TargetAccount.GetKeys())["address"],-1,txid);
		await DATABASE.remove("TransactionIdsPerAccount",objtx["toaddress"],-1,txid);
		await DATABASE.remove("TransactionIdsPerAccountAndToAccountAndTag",(await TargetTransaction.TargetAccount.GetKeys())["address"]+"_"+objtx["toaddress"]+"_"+objtx["tag"],-1,txid);
		await DATABASE.remove("TransactionIdsPerAll","live",-1,txid);

		//indexと時間の関連付け
		let data = {"time":objtx["time"],"index":objtx["index"],"txid":txid};
		await DATABASE.remove("TransactionTimeRaIndexPerAccountAndTag",(await TargetTransaction.TargetAccount.GetKeys())["address"]+"_"+objtx["tag"],-1,data);
		data = {"time":objtx["time"],"index":objtx["ToIndex"],"txid":txid};
		await DATABASE.remove("TransactionTimeRaIndexPerAccountAndTag",objtx["toaddress"]+"_"+objtx["tag"],-1,data);

		if (objtx["type"] == 12){
			let Tagorder = new TRANSACTIONTOOLS_TAGORDER.TagOrderData(objtx["data"]);
			let TagorderObjData = Tagorder.GetObjData();
			await DATABASE.remove("TagOrderTransactionIdPerTag",TagorderObjData["tag"],-1,txid);
		}
		if (objtx["type"] == 13){
			let Tagaddpermit = new TRANSACTIONTOOLS_TAGADDPERMIT.TagAddPermitData(objtx["data"]);
			let TagaddpermitObjData = Tagaddpermit.GetObjData();
			await DATABASE.remove("TagaddpermitTransactionIdPerTag",TagaddpermitObjData["tag"],-1,txid);
		}

		await DATABASE.delete("ConfirmedTransactions",txid);

		//payの場合残高をキャッシュ
		if (objtx["type"] == 1){
			data = {"index":objtx["index"],"amount":(await TargetTransaction.TargetAccount.GetSendAmountToAddress(undefined,objtx["toaddress"],objtx["index"]))};
			await DATABASE.remove("SendAmountToAddressPerAddress",`${(await TargetTransaction.TargetAccount.GetKeys())["address"]}_${objtx["toaddress"]}`,-1,data);

			await DATABASE.remove("BalancePerAddress",(await TargetTransaction.TargetAccount.GetKeys())["address"],objtx["index"]-1);
			await DATABASE.remove("BalancePerAddress",objtx["toaddress"],objtx["ToIndex"]-1);
		};


		MAIN.note(1,"transaction_RunCommit_reset","[reset transaction] txid : "+txid);
		return 1;
	}

	async function RawTxOldCompare(RawTxA, RawTxB){
		let comparison = 0;

		let TargetTransactionA = new exports.Transaction(RawTxA);
		let ObjTxA = await TargetTransactionA.GetObjTx();
		let TargetTransactionB = new exports.Transaction(RawTxB);
		let ObjTxB = await TargetTransactionB.GetObjTx();

		if (ObjTxA["time"] < ObjTxB["time"]){
			comparison = -1;
		}
		if (ObjTxA["time"] > ObjTxB["time"]){
			comparison = 1;
		}

		return comparison;
	}




	//シード適用
	let ConfirmedTransactions = await DATABASE.get("ConfirmedTransactions");
	if (ConfirmedTransactions.length==0){
		for (let index in CONFIG.genesistxs){
			let rawtx = CONFIG.genesistxs[index];

			let SeedTransaction = new exports.Transaction(rawtx);

			await DATABASE.add("UnconfirmedTransactions",(await SeedTransaction.GetObjTx())["tag"],rawtx);
		}
	}


	while (true){
		try{

			let UnconfirmedTransactionsTags = await DATABASE.get("UnconfirmedTransactions");
			UnconfirmedTransactionsTags = UnconfirmedTransactionsTags.sort(exports.TagCompare);
			for (let index in UnconfirmedTransactionsTags){
				let tag = UnconfirmedTransactionsTags[index];

				if (!tag){
					continue;
				}
				if ((await exports.GetImportTags()).length>0 && (await exports.GetImportTags()).indexOf(tag) == -1){
					continue;
				};

				let UnconfirmedTransactions = await DATABASE.get("UnconfirmedTransactions",tag);

				//timeが古い順並び替え
				UnconfirmedTransactions = UnconfirmedTransactions.sort(await RawTxOldCompare);


				for (let mindex in UnconfirmedTransactions){
					try{
						let rawtx = UnconfirmedTransactions[mindex];

						await DATABASE.remove("UnconfirmedTransactions",tag,undefined,rawtx);

						MAIN.note(0,"transaction_RunCommit_commit","[catch transaction] "+rawtx);

						while (true){
							let TargetTransaction = new exports.Transaction(rawtx);
							let objtx = await TargetTransaction.GetObjTx();
							let ToTargetAccount = new ACCOUNT.account(objtx["toaddress"]);


							let txbool = await TargetTransaction.Confirmation();
							if (txbool == 1){
								await commit(TargetTransaction);
								break;
							}
							if (txbool == 2){
								let SenderAccountTxids = await TargetTransaction.TargetAccount.GetFormTxList(undefined,objtx["tag"]);
								let ResetTxid = SenderAccountTxids.slice(-1)[0];
								let RESETTX = exports.GetTx(ResetTxid);
								await reset(RESETTX);
							}
							if (txbool == 3){
								let ToAccountTxids = await ToTargetAccount.GetFormTxList(undefined,objtx["tag"]);
								let ResetTxid = ToAccountTxids.slice(-1)[0];
								let RESETTX = exports.GetTx(ResetTxid);
								await reset(RESETTX);
							}
							if (txbool == 0){
								MAIN.note(0,"transaction_RunCommit_commit","[pass transaction] "+rawtx);
								break;
							}
						};
					}catch(e){
						MAIN.note(2,"transaction_RunCommit",e);
					}finally{
						await MAIN.sleep(0.1);
					}
				}
			};

		}catch(e){
			MAIN.note(2,"transaction_RunCommit",e);

		}finally{
			await global.RunStop();
			await MAIN.sleep(1);
		}
	}
}









/*
GetNonce スレッド
*/
exports.RunGetNonce = async function(){
	let ChildList = [];
	let WorkList = [];
	for (let index=0;index<CPULEN;index++){
		let child = CP.fork("GetNonceForNode.js");
		child.on('message', (data) => {
			//data -> {"key":"","nonce":0}

			let workkey = data["key"];
			let response = WorkList[workkey]["response"];

			response.write(JSON.stringify(data["nonce"]));
			response.end();

			delete WorkList[workkey];
		});
		ChildList.push(child);
	};

	HTTP.createServer(async function(request, response) {
		try{
			(async () => {
				response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});

				if(request.method === 'POST') {
					let postData = "";
					request.on('data', async function(chunk) {
						postData += chunk;
					}).on('end', async function() {
						try{
							postData = JSON.parse(postData);

							if(postData["function"] == "GetNonce"){
								for (let index in ChildList){

									//2コア目からnonceを変更する
									let args = postData["args"];
									if (index != 0){
										//すでにnonceが決まっている
										if (args["nonce"] != 0){
											break;
										}

										args["nonce"] = Math.floor( Math.random() * parseInt("ffffffffffffffff",16) );
									};

									let child = ChildList[index];

									let workkey = await MAIN.GetRandom(16);

									WorkList[workkey] = {"response":response};
									child.send( (Object.assign(args, {"key":workkey})) );
								};
							};
						}catch(e){
							MAIN.note(2,"RunGetNonce",e);
							response.write(JSON.stringify(false));
							response.end();
						}
					});
				};
			})();
		}catch(e){
			MAIN.note(2,"RunGetNonce",e);
			response.write(JSON.stringify(false));
			response.end();
		}
	}).listen(CONFIG.Transaction["port"], CONFIG.Transaction["address"]);
}