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
		let TargetAccount = new ACCOUNT.account(privkey);

		let RewardAccount = new ACCOUNT.account();
		let RewardPrivkey = (await RewardAccount.GetKeys())["privkey"];
		//console.log(RewardPrivkey);
		let paytxid = await TRANSACTION.SendPayTransaction(privkey,(await RewardAccount.GetKeys())["address"],amount);




		/* Feeを追加 */
		let FeeResult = await TRANSACTION.SendPayTransaction(privkey,"ffffffffffffffffffffffffffffffffffffffff",1);
		if (!FeeResult){
			return false;
		}




		/*
		報酬トランザクション生成
		*/

		let FormTxList = await TargetAccount.GetFormTxList(undefined,"tagreward");
		let MerkleRoot = new HASHS.hashs().GetMarkleroot(FormTxList);

		let TagTxids = TRANSACTION.GetTagTxids(tag);
		if (tag == "pay" && TagTxids.indexOf(paytxid) == -1){
			TagTxids.push(paytxid);
		};
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
		//console.log(Tagreward.GetRawData());
		let objtx = {
			"pubkey":(await TargetAccount.GetKeys())["pubkey"],
			"type":11,
			"time":Math.floor(Date.now()/1000),
			"tag":"tagreward",
			"index":FormTxList.length+1,
			"MerkleRoot":MerkleRoot,
			"toaddress":"",
			"amount":0,
			"data":Tagreward.GetRawData(),
			"sig":"",
			"nonce":0
		};
		//console.log(objtx);
		let TargetTransaction = new TRANSACTION.Transaction("",privkey,objtx);
		let txid = await TargetTransaction.commit();


		return txid;
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

	if (parseInt(TxidA,16) > parseInt(TxidB,16)){
		comparison = -1;
	}else{
		comparison = 1;
	}

	return comparison;
}






exports.RunMining = async function(){
	let UsedRewardPrivkey = [];

	while (true){

		/*
		tagrewardトランザクションを走査してprivkeyを集める
		*/
		let tagrewardtxids = TRANSACTION.GetTagTxids("tagreward");
		let Rewards = [];
		for (let index in tagrewardtxids){
			try{
				let txid = tagrewardtxids[index];
				let tx = TRANSACTION.GetTx(txid);
				let TagRewardObjTx = await tx.GetObjTx();
				let TAGREWARDDATA = new exports.TagrewardData(TagRewardObjTx["data"]);
				let TagRewardObjData = TAGREWARDDATA.GetObjData();


				if (TagRewardObjTx["time"]+60*1 > Math.floor(Date.now()/1000) || TagRewardObjTx["time"]+60*10 < Math.floor(Date.now()/1000)){continue;};

				if ((await exports.GetMiningTags()).length>0 && (await exports.GetMiningTags()).indexOf(TagRewardObjData["tag"]) == -1){continue;};


				//tagのtxリストから共通鍵作る
				let tagtxids = TRANSACTION.GetTagTxids(TagRewardObjData["tag"]);
				tagtxids = tagtxids.sort(exports.TxidLengthCompare);
				let TagtxidsMarkleroot = new HASHS.hashs().GetMarkleroot(tagtxids);
				let UsingRawTx = await TRANSACTION.GetTx(tagtxids[TagRewardObjData["UsingRawTxIndex"]-1]).GetRawTx();
				let commonkey = new HASHS.hashs().sha256(TagtxidsMarkleroot + UsingRawTx);

				if (!commonkey){continue;};


				//賞金の入った秘密鍵を取得
				let EncryptoPrivkey = TagRewardObjData["EncryptoPrivkey"];

				let RewardPrivkey = new CRYPTO.common().GetDecryptedData(commonkey,EncryptoPrivkey);
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

			if (sendamount > 0 && UsedRewardPrivkey.indexOf(RewardPrivkey) == -1){
				let result = await TRANSACTION.SendPayTransaction(RewardPrivkey,(await CollectAccount.GetKeys())["address"],sendamount,10);
				if (result){
					MAIN.note(1,"tagreward_RunMining","[Reward] "+sendamount+" by tag of "+tag);
					UsedRewardPrivkey.push(RewardPrivkey);
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
			let TagsRewardPerYear = {};
			let TxidsTagreward = TRANSACTION.GetTagTxids("tagreward");
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


			/* add */
			for (let tag in TagsRewardPerYear){
				if ((await TRANSACTION.GetImportTags()).indexOf(tag) > -1){
					continue;
				}


				let SumSize = 0;
				let TxidsPerTag = TRANSACTION.GetTagTxids(tag);
				for (let index in TxidsPerTag){
					let txid = TxidsPerTag[index];

					let TX = TRANSACTION.GetTx(txid);
					let rawtx = await TX.GetRawTx();

					SumSize = SumSize + (rawtx.length/2);
				}


				if (TagsRewardPerYear[tag] / SumSize * 1000000 >= 1){
					let result = await TRANSACTION.SetImportTags("add",tag);
					if (result){
						MAIN.note(1,"RunControlTag",`ADD ${tag}`);
					};
				}
			}


			/* remove */
			let ImportTags = await TRANSACTION.GetImportTags();
			for (let index in ImportTags){
				let tag = ImportTags[index];

				if (tag == "pay" || tag == "tagreward"){
					continue;
				}
				if ((await TRANSACTION.GetImportTags()).indexOf(tag) == -1){
					continue;
				}

				let SumSize = 0;
				let TxidsPerTag = TRANSACTION.GetTagTxids(tag);
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