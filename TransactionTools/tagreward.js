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

		let rewardtxid = objdata["rewardtxid"];
		data = data + MAIN.GetFillZero(rewardtxid,64);

		let UsingRawTxIndex = objdata["UsingRawTxIndex"].toString(16);
		data = data + MAIN.GetFillZero(UsingRawTxIndex,16);

		let tag = new HEX.HexText().string_to_utf8_hex_string(objdata["tag"]);
		let taglen = tag.length.toString(16);
		data = data + MAIN.GetFillZero(taglen,16) + tag;

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

		let rewardtxid = cut(64);
		let UsingRawTxIndex = parseInt(cut(16),16);
		let tag = VariableCut();
		let EncryptoPrivkey = VariableCut();

		let objdata = {
			"rewardtxid":rewardtxid,
			"UsingRawTxIndex":UsingRawTxIndex,
			"tag":new HEX.HexText().utf8_hex_string_to_string(tag),
			"EncryptoPrivkey":EncryptoPrivkey,
		}

		return objdata;
	};
};






exports.SendTagrewardTransaction = async function(privkey,tag,amount){
	try{
		amount = parseInt(amount);


		let TargetAccount = new ACCOUNT.account(privkey);

		let RewardAccount = new ACCOUNT.account();
		let RewardPrivkey = (await RewardAccount.GetKeys())["privkey"];
		//console.log(RewardPrivkey);
		let paytxid = await TRANSACTION.SendPayTransaction(privkey,(await RewardAccount.GetKeys())["address"],amount);

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

		let UsingRawTxIndex = Math.floor( Math.random() * TagTxids.length );
		let UsingRawTx = await TRANSACTION.GetTx(TagTxids[UsingRawTxIndex]).GetRawTx();
		let commonkey = new HASHS.hashs().sha256(TagtxidsMarkleroot + UsingRawTx);

		let EncryptoPrivkey = new CRYPTO.common().GetEncryptedData(commonkey,RewardPrivkey);

		let objdata = {
			"rewardtxid":paytxid,
			"UsingRawTxIndex":UsingRawTxIndex,
			"tag":tag,
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
	let MiningTags = DATABASE.get("MiningTags","live");

	Array.prototype.push.apply(MiningTags, CONFIG.Tagreward["MiningTags"]);

	return MiningTags;
}

exports.SetMiningTags = async function(type,tag){
	if (type == "add"){
		DATABASE.add("MiningTags","live",tag);
	}else if (type == "remove"){
		let MiningTags = DATABASE.get("MiningTags","live");
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


				if (TagRewardObjTx["time"]+60*10 > Math.floor(Date.now()/1000) || TagRewardObjTx["time"]+60*30 < Math.floor(Date.now()/1000)){continue;};

				if ((await exports.GetMiningTags()).length>0 && (await exports.GetMiningTags()).indexOf(TagRewardObjData["tag"]) == -1){continue;};


				//tagのtxリストから共通鍵作る
				let tagtxids = TRANSACTION.GetTagTxids(TagRewardObjData["tag"]);
				tagtxids = tagtxids.sort(exports.TxidLengthCompare);
				let TagtxidsMarkleroot = new HASHS.hashs().GetMarkleroot(tagtxids);
				let UsingRawTx = await TRANSACTION.GetTx(tagtxids[TagRewardObjData["UsingRawTxIndex"]]).GetRawTx();
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
				UsedRewardPrivkey.push(RewardPrivkey);
				MAIN.note(1,"tagreward_RunMining","[Reward] "+sendamount+" by tag of "+tag);
				TRANSACTION.SendPayTransaction(RewardPrivkey,(await CollectAccount.GetKeys())["address"],sendamount);
			}
		}



		await MAIN.sleep(1);
	}
}