const CONFIG = require('../config.js');

const MAIN = require('../main.js');
const HEX = require('../hex.js');

const ACCOUNT = require('../account.js');
const HASHS = require('../hashs.js');
const TRANSACTION = require('../transaction.js');
const CRYPTO = require('../crypto.js');
const DATABASE = new (require('../database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);



exports.TagrewardData = class{
	constructor(rawdata="",objdata={}){
		this.rawdata = rawdata;
		this.objdata = objdata;
	};

	GetRawData(objdata=this.objdata){
		let data = "";

		let tag = new HEX.HexText().string_to_utf8_hex_string(objdata["tag"]);
		let taglen = tag.length.toString(16);
		data = data + MAIN.GetFillZero(taglen,16) + tag;

		let RewardAddress = objdata["RewardAddress"];
		data = data + MAIN.GetFillZero(RewardAddress,40);

		let UsingRawTxIndex = objdata["UsingRawTxIndex"].toString(16);
		data = data + MAIN.GetFillZero(UsingRawTxIndex,16);

		let EncryptoPrivkey = objdata["EncryptoPrivkey"];
		let EncryptoPrivkeyLen = EncryptoPrivkey.length.toString(16);
		data = data + MAIN.GetFillZero(EncryptoPrivkeyLen,16) + EncryptoPrivkey;

		return data;
	};

	GetObjData(rawdata=this.rawdata){
		function cut(len){
			let cuthex = rawdata.slice(0,len);
			rawdata = rawdata.slice(len);
			return cuthex
		};


		function VariableCut(){
			let len = parseInt(cut(16),16);

			let cuthex = rawdata.slice(0,len);
			rawdata = rawdata.slice(len);

			return cuthex
		};

		let tag = VariableCut(16);
		tag = new HEX.HexText().utf8_hex_string_to_string(tag);
		let RewardAddress = cut(40);
		let UsingRawTxIndex = parseInt(cut(16),16);
		let EncryptoPrivkey = VariableCut();

		let objdata = {
			"tag":tag,
			"RewardAddress":RewardAddress,
			"UsingRawTxIndex":UsingRawTxIndex,
			"EncryptoPrivkey":EncryptoPrivkey,
		}

		return objdata;
	};
};






exports.SendTagrewardTransaction = async function(privkey,tag,amount){
	try{
		amount = parseInt(amount);




		/*
		報酬を報酬アドレスに用意
		*/
		let RewardAccount = new ACCOUNT.account();
		let RewardPrivkey = (await RewardAccount.GetKeys())["privkey"];
		//console.log(RewardPrivkey);
		let paytxid = await TRANSACTION.SendPayTransaction(privkey,(await RewardAccount.GetKeys())["address"],amount);
		if (!paytxid){
			return false;
		}



		/* Feeを追加 */
		let FeeResult = await TRANSACTION.SendPayTransaction(privkey,"ffffffffffffffffffffffffffffffffffffffff",1);
		if (!FeeResult){
			return false;
		}




		/*
		報酬トランザクション生成
		*/
		let TagTxids = await TRANSACTION.GetTagTxids(tag);
		let TagRewardWithTime = Math.floor(Date.now()/1000);
		TagTxids = TagTxids.sort(exports.TxidLengthCompare);
		let TagtxidsMarkleroot = new HASHS.hashs().GetMarkleroot(TagTxids);

		let UsingRawTxIndex = Math.floor( Math.random() * TagTxids.length )+1;
		let UsingRawTx = await TRANSACTION.GetTx(TagTxids[UsingRawTxIndex-1]).GetRawTx();
		let commonkey = new HASHS.hashs().sha256(TagtxidsMarkleroot + UsingRawTx);

		let EncryptoPrivkey = new CRYPTO.common().GetEncryptedData(commonkey,RewardPrivkey);

		let objdata = {
			"tag":tag,
			"RewardAddress":(await RewardAccount.GetKeys())["address"],
			"UsingRawTxIndex":UsingRawTxIndex,
			"EncryptoPrivkey":EncryptoPrivkey,
		};
		let Tagreward = new exports.TagrewardData("",objdata);


		let result = await TRANSACTION.SendTransaction(privkey,11,"tagreward","0000000000000000000000000000000000000000",0,Tagreward.GetRawData(),undefined);

		return result;
	}catch(e){
		console.log(e);
		return "";
	}
};


exports.GetMiningTags = async function(){
	let MiningTags = [];
	let DatabaseMiningTags = DATABASE.get("MiningTags","live");
	for (let index in DatabaseMiningTags){
		let tag = DatabaseMiningTags[index];

		let HEXTEXT = new HEX.HexText();
		tag = HEXTEXT.utf8_hex_string_to_string(tag);
		MiningTags.push(tag);
	}

	Array.prototype.push.apply(MiningTags, CONFIG.Tagreward["MiningTags"]);

	return MiningTags;
}

exports.SetMiningTags = async function(type,tag){
	if (type == "add"){
		let MiningTags = await exports.GetMiningTags();
		let index = MiningTags.indexOf(tag);
		if (index > -1){
			return 0;
		}
		let HEXTEXT = new HEX.HexText();
		tag = HEXTEXT.string_to_utf8_hex_string(tag);
		DATABASE.add("MiningTags","live",tag);
	}else if (type == "remove"){
		let MiningTags = await exports.GetMiningTags();
		let index = MiningTags.indexOf(tag);
		if (index == -1){
			return 0;
		}
		DATABASE.remove("MiningTags","live",index);
	};
	return 1;
}


exports.TxidLengthCompare = function(TxidA, TxidB){
	let comparison = 0;

	if (parseInt(TxidA,16) < parseInt(TxidB,16)){
		comparison = -1;
	}else{
		comparison = 1;
	}

	return comparison;
}






exports.RunMining = async function(){
	while (true){

		/*
		tagrewardトランザクションを走査してprivkeyを集める
		*/
		let tagrewardtxids = await TRANSACTION.GetTagTxids("tagreward");
		let Rewards = [];
		for (let index in tagrewardtxids){
			try{
				let txid = tagrewardtxids[index];
				let tx = TRANSACTION.GetTx(txid);
				let TagRewardObjTx = await tx.GetObjTx();
				let TAGREWARDDATA = new exports.TagrewardData(TagRewardObjTx["data"]);
				let TagRewardObjData = TAGREWARDDATA.GetObjData();
				let PlanRewardAccount = new ACCOUNT.account(TagRewardObjData["RewardAddress"]);


				if (await PlanRewardAccount.GetBalance() <= 0){continue;};

				if (TagRewardObjTx["time"]+60*1 > Math.floor(Date.now()/1000) || TagRewardObjTx["time"]+60*30 < Math.floor(Date.now()/1000)){continue;};

				if ((await exports.GetMiningTags()).length>0 && (await exports.GetMiningTags()).indexOf(TagRewardObjData["tag"]) == -1){continue;};


				//tagのtxリストから共通鍵作る
				let tagtxids = await TRANSACTION.GetTagTxids(TagRewardObjData["tag"],TagRewardObjTx["time"]);
				tagtxids = tagtxids.sort(exports.TxidLengthCompare);
				let TagtxidsMarkleroot = new HASHS.hashs().GetMarkleroot(tagtxids);
				let UsingRawTx = await TRANSACTION.GetTx(tagtxids[TagRewardObjData["UsingRawTxIndex"]-1]).GetRawTx();
				let commonkey = new HASHS.hashs().sha256(TagtxidsMarkleroot + UsingRawTx);

				if (!commonkey){continue;};


				//賞金の入った秘密鍵を取得
				let EncryptoPrivkey = TagRewardObjData["EncryptoPrivkey"];

				let RewardPrivkey = new CRYPTO.common().GetDecryptedData(commonkey,EncryptoPrivkey);

				let RewardAccount = null;
				let RewardKeys = null;
				try{
					RewardAccount = new ACCOUNT.account(RewardPrivkey);
					RewardKeys = await RewardAccount.GetKeys();
				}catch(e){
					continue;
				}

				//表記されていたアドレスと違う = 不正 されたことをログに保存
				if (TagRewardObjData["RewardAddress"] != RewardKeys["address"]){
					let TagRewardCheetah = {"tag":TagRewardObjData["tag"],"amount":await PlanRewardAccount.GetBalance(),"time":TagRewardObjTx["time"],"TagRewardTxid":txid};
					TagRewardCheetah = new HEX.HexText().string_to_utf8_hex_string(JSON.stringify(TagRewardCheetah));


					let TagRewardCheetahs = DATABASE.get("TagRewardCheetah",TagRewardObjData["tag"]);
					if (TagRewardCheetahs.indexOf(TagRewardCheetah) == -1){
						DATABASE.add("TagRewardCheetah",TagRewardObjData["tag"],TagRewardCheetah);
					}
				}


				if (await RewardAccount.GetBalance() <= 0){continue;};


				//console.log(commonkey);
				//console.log(EncryptoPrivkey);
				//console.log(RewardPrivkey);
				Rewards.push({"tag":TagRewardObjData["tag"],"RewardPrivkey":RewardPrivkey});
			}catch(e){
				console.log(e);
				continue;
			};
		}



		/*
		集めた秘密鍵から資産引き抜き
		*/
		for (let index in Rewards){
			let reward = Rewards[index];

			let RewardPrivkey = reward["RewardPrivkey"];
			let tag = reward["tag"];


			let CollectAccount = new ACCOUNT.account(CONFIG.Tagreward["CollectPrivkey"]);
			let RewardAccount = new ACCOUNT.account(RewardPrivkey);

			let sendamount = 0;
			try{
				sendamount = await RewardAccount.GetBalance();
			}catch(e){
				continue;
			}

			//秘密鍵取得をログに保存
			let TagMiningResult = {"tag":tag,"amount":sendamount,"time":Math.floor(Date.now()/1000),"RewardSentTxid":""};
			TagMiningResult = new HEX.HexText().string_to_utf8_hex_string(JSON.stringify(TagMiningResult));
			DATABASE.add("TagMiningResult_FoundPrivkey",tag,TagMiningResult);

			if (sendamount > 0){
				let result = await TRANSACTION.SendPayTransaction(RewardPrivkey,(await CollectAccount.GetKeys())["address"],sendamount);
				if (result){
					MAIN.note(1,"tagreward_RunMining","[Reward] "+sendamount+" by tag of "+tag);


					//秘密鍵から残高を取得をログに保存
					let TagMiningResult = {"tag":tag,"amount":sendamount,"time":Math.floor(Date.now()/1000),"RewardSentTxid":result};
					TagMiningResult = new HEX.HexText().string_to_utf8_hex_string(JSON.stringify(TagMiningResult));
					DATABASE.add("TagMiningResult_hooray",tag,TagMiningResult);
				}
			}
		}



		await MAIN.sleep(1);
	}
}







exports.RunControlTag = async function(){

	if (!CONFIG.Tagreward["UseControlTag"]){
		return false;
	}

	while (true){
		try{

			// 報酬 / 年 をタグごとに取得
			let TagsRewardPerYear = {};
			let TxidsTagreward = await TRANSACTION.GetTagTxids("tagreward");
			for (let index in TxidsTagreward){
				let txid = TxidsTagreward[index];

				let TX = TRANSACTION.GetTx(txid);
				let objtx = await TX.GetObjTx();
				let rewarddata = (new exports.TagrewardData(objtx["data"])).GetObjData();

				if (objtx["time"] < Math.floor(Date.now()/1000)-60*60*24*30*12){
					continue;
				};

				let RewardAddress = rewarddata["RewardAddress"];
				let REWARDACCOUNT = new ACCOUNT.account(RewardAddress);

				let RewardBalance = await REWARDACCOUNT.GetBalance();
				if (RewardBalance <= 0){
					let TxidsPerPay = await REWARDACCOUNT.GetFormTxList(undefined,"pay");
					RewardBalance = await REWARDACCOUNT.GetBalance(undefined,TxidsPerPay.length);
				}


				if (!(rewarddata["tag"] in TagsRewardPerYear)){
					TagsRewardPerYear[rewarddata["tag"]] = 0;
				}

				TagsRewardPerYear[rewarddata["tag"]] = TagsRewardPerYear[rewarddata["tag"]] + RewardBalance;
			}


			/*
			add

			条件
			・不正にかさましされていない
			and
			・過去に追加された履歴がない
			*/
			for (let tag in TagsRewardPerYear){
				if ((await TRANSACTION.GetImportTags()).indexOf(tag) > -1){
					continue;
				}



				//不正によってかさましされた数量
				let TagRewardCheetahs = DATABASE.get("TagRewardCheetah",tag);
				let CheetahAmountPerYear = 0;
				for (let index in TagRewardCheetahs){
					let TagRewardCheetah = TagRewardCheetahs[index];
					TagRewardCheetah = new HEX.HexText().utf8_hex_string_to_string(TagRewardCheetah);
					TagRewardCheetah = JSON.parse(TagRewardCheetah);

					if (TagRewardCheetah["time"] < Math.floor(Date.now()/1000)-60*60*24*30*12){
						continue;
					};

					CheetahAmountPerYear = CheetahAmountPerYear + TagRewardCheetah["amount"];
				}

				/* 不正にかさましされている */
				if (TagsRewardPerYear[tag]/2 < CheetahAmountPerYear){
					continue;
				}



				/* 過去に追加された過去がある */
				RunControlTagAddTagLogs = DATABASE.get("RunControlTagAddTagLog",tag);
				if (RunControlTagAddTagLogs.length > 0){
					continue;
				};




				let RunControlTagAddTagLog = {"tag":tag,"time":Math.floor(Date.now()/1000)};
				RunControlTagAddTagLog = new HEX.HexText().string_to_utf8_hex_string(JSON.stringify(RunControlTagAddTagLog));
				DATABASE.set("RunControlTagAddTagLog",tag,RunControlTagAddTagLog);





				let result = await TRANSACTION.SetImportTags("add",tag);
				if (result){
					MAIN.note(1,"RunControlTag",`ADD ${tag}`);
				};
			}


			/*
			remove

			条件
			・費用対サイズが悪すぎる
			or
			・不正がrewardの大半を占めている場合
			*/
			let ImportTags = await TRANSACTION.GetImportTags();
			for (let index in ImportTags){
				let tag = ImportTags[index];

				if (tag == "pay" || tag == "tagorder" || tag == "tagreward" || tag == "tagaddpermit"){
					continue;
				}
				if ((await TRANSACTION.GetImportTags()).indexOf(tag) == -1){
					continue;
				}

				let SumSize = 0;
				let TxidsPerTag = await TRANSACTION.GetTagTxids(tag);
				for (let index in TxidsPerTag){
					let txid = TxidsPerTag[index];

					let TX = TRANSACTION.GetTx(txid);
					let rawtx = await TX.GetRawTx();

					SumSize = SumSize + (rawtx.length/2);
				}


				if (!(tag in TagsRewardPerYear) || TagsRewardPerYear[tag] / SumSize * 1000000 < 1){
					let result = await TRANSACTION.SetImportTags("remove",tag);
					if (result){
						MAIN.note(1,"RunControlTag",`REMOVE ${tag}`);
						continue;
					}
				}





				//不正によってかさましされた数量
				let TagRewardCheetahs = DATABASE.get("TagRewardCheetah",tag);
				let CheetahAmountPerYear = 0;
				for (let index in TagRewardCheetahs){
					let TagRewardCheetah = TagRewardCheetahs[index];

					TagRewardCheetah = JSON.parse(new HEX.HexText().utf8_hex_string_to_string(TagRewardCheetah));

					if (TagRewardCheetah["time"] < Math.floor(Date.now()/1000)-60*60*24*30*12){
						continue;
					};

					CheetahAmountPerYear = CheetahAmountPerYear + TagRewardCheetah["amount"];
				}

				if (TagsRewardPerYear[tag]/2 < CheetahAmountPerYear){
					let result = await TRANSACTION.SetImportTags("remove",tag);
					if (result){
						MAIN.note(1,"RunControlTag",`REMOVE ${tag}`);
						continue;
					}
				}
			}



			/* すべてsetminingtags */
			let MiningTags = await exports.GetMiningTags();
			for (let index in MiningTags){
				let tag = MiningTags[index];

				await exports.SetMiningTags("remove",tag);
			};
			ImportTags = await TRANSACTION.GetImportTags();
			for (let index in ImportTags){
				let tag = ImportTags[index];

				await exports.SetMiningTags("add",tag);
			};
		}catch(e){
			MAIN.note(2,"RunControlTag",e);
		}

		await MAIN.sleep(60);
	}
}