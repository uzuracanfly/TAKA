const CONFIG = require('../config.js');

const MAIN = require('../main.js');
const HEX = require('../hex.js');

const ACCOUNT = require('../account.js');
const HASHS = require('../hashs.js');
const TRANSACTION = require('../transaction.js');
const CRYPTO = require('../crypto.js');



exports.NegoData = class{
	constructor(rawdata="",objdata={}){
		this.rawdata = rawdata;
		this.objdata = objdata;
	};

	GetRawData(objdata=this.objdata){
		let data = "";

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

		let tag = VariableCut();
		let EncryptoPrivkey = VariableCut();

		let objdata = {
			"tag":new HEX.HexText().utf8_hex_string_to_string(tag),
			"EncryptoPrivkey":EncryptoPrivkey,
		}

		return objdata;
	};
};






exports.SendNegoTransaction = function(privkey,tag,amount){
	amount = parseInt(amount);

	return new Promise(function (resolve, reject) {

		let TargetAccount = new ACCOUNT.account(privkey);

		let RewardAccount = new ACCOUNT.account();
		let RewardPrivkey = RewardAccount.GetKeys()["privkey"];
		//console.log(RewardPrivkey);
		let result = new TRANSACTION.SendPayTransaction(privkey,RewardAccount.GetKeys()["address"],amount);


		result.then(function (paytxid) {
			/*
			報酬トランザクション生成
			*/

			let FormTxList = TargetAccount.GetFormTxList(undefined,"nego");
			let MerkleRoot = new HASHS.hashs().GetMarkleroot(FormTxList);

			let TagMerkleRoot = TRANSACTION.GetTagMerkleRoot(tag);
			let EncryptoPrivkey = new CRYPTO.common().GetEncryptedData(TagMerkleRoot,RewardPrivkey);

			let objdata = {
				"tag":tag,
				"EncryptoPrivkey":EncryptoPrivkey,
			};

			let Nego = new exports.NegoData("",objdata);
			//console.log(Nego.GetRawData());
			let objtx = {
				"pubkey":TargetAccount.GetKeys()["pubkey"],
				"type":11,
				"time":Math.floor(Date.now()/1000),
				"tag":"nego",
				"index":FormTxList.length+1,
				"MerkleRoot":MerkleRoot,
				"toaddress":"",
				"amount":0,
				"data":Nego.GetRawData(),
				"sig":"",
				"nonce":0
			};
			//console.log(objtx);
			let TargetTransaction = new TRANSACTION.Transaction("",privkey,objtx);
			let result = TargetTransaction.commit();

			result.then(function (txid) {
				resolve(txid);
			}).catch(function (error) {
				console.log(error);
			});
			
		}).catch(function (error) {
			console.log(error);
		});
	});
};







exports.RunMining = function(){
	function mining(){
		/*
		negoトランザクションを走査してprivkeyを集める
		*/
		let negotxids = TRANSACTION.GetTagTxids("nego");
		let Rewards = [];
		for (let index in negotxids){
			let txid = negotxids[index];
			let tx = TRANSACTION.GetTx(txid);

			let negodata = new exports.NegoData(tx.GetObjTx()["data"]);


			if (CONFIG.Nego["MiningTags"].indexOf(negodata.GetObjData()["tag"]) == -1){continue;};


			//tagのtxリストから共通鍵作る
			let tagtxids = TRANSACTION.GetTagTxids(negodata.GetObjData()["tag"]);
			let commonkey = new HASHS.hashs().GetMarkleroot(tagtxids);

			if (!commonkey){continue;};


			//賞金の入った秘密鍵を取得
			let EncryptoPrivkey = negodata.GetObjData()["EncryptoPrivkey"];

			let RewardPrivkey = new CRYPTO.common().GetDecryptedData(commonkey,EncryptoPrivkey);
			//console.log(commonkey);
			//console.log(EncryptoPrivkey);
			//console.log(RewardPrivkey);
			Rewards.push({"tag":negodata.GetObjData()["tag"],"RewardPrivkey":RewardPrivkey});
		}



		/*
		集めた秘密鍵から資産引き抜き
		*/
		for (let index in Rewards){
			let reward = Rewards[index];

			let RewardPrivkey = reward["RewardPrivkey"];
			let tag = reward["tag"];


			let CollectAccount = new ACCOUNT.account(CONFIG.Nego["CollectPrivkey"]);
			let RewardAccount = new ACCOUNT.account(RewardPrivkey);

			let sendamount = 0;
			try{
				sendamount = RewardAccount.GetBalance();
			}catch(e){
				continue;
			}

			if (sendamount > 0 && UsedRewardPrivkey.indexOf(RewardPrivkey) == -1){
				UsedRewardPrivkey.push(RewardPrivkey);
				MAIN.note(1,"nego_RunMining","[Reward] "+sendamount+" by tag of "+tag);
				let result = TRANSACTION.SendPayTransaction(RewardPrivkey,CollectAccount.GetKeys()["address"],sendamount);
			}
		}


		setTimeout(
			mining,
			1000,
		);
	}


	let UsedRewardPrivkey = [];
	mining();
}