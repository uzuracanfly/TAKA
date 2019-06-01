exports.NegoData = class{
	constructor(rawdata="",objdata={}){
		this.main = require('../main.js');
		this.hex = require('../hex.js');
		this.rawdata = rawdata;
		this.objdata = objdata;
	};

	GetRawData(objdata=this.objdata){
		let data = "";

		let tag = new this.hex.HexText().string_to_utf8_hex_string(objdata["tag"]);
		let taglen = tag.length.toString(16);
		data = data + this.main.GetFillZero(taglen,16) + tag;

		let EncryptoPrivkey = objdata["EncryptoPrivkey"];
		let EncryptoPrivkeyLen = EncryptoPrivkey.length.toString(16);
		data = data + this.main.GetFillZero(EncryptoPrivkeyLen,16) + EncryptoPrivkey;

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
			"tag":new this.hex.HexText().utf8_hex_string_to_string(tag),
			"EncryptoPrivkey":EncryptoPrivkey,
		}

		return objdata;
	};
};






exports.SendNegoTransaction = function(privkey,tag,amount){
	amount = parseInt(amount);

	return new Promise(function (resolve, reject) {

		let TargetAccount = new (require('../account.js')).account(privkey);

		let RewardAccount = new (require('../account.js')).account();
		let RewardPrivkey = RewardAccount.GetKeys()["privkey"];
		//console.log(RewardPrivkey);
		let result = new (require('../transaction.js')).SendPayTransaction(privkey,RewardAccount.GetKeys()["address"],amount);


		result.then(function (paytxid) {
			/*
			報酬トランザクション生成
			*/

			let FormTxList = TargetAccount.GetFormTxList(undefined,"nego");
			let MerkleRoot = new (require('../hashs.js')).hashs().GetMarkleroot(FormTxList);

			let TagMerkleRoot = (require('../transaction.js')).GetTagMerkleRoot(tag);
			let EncryptoPrivkey = new (require('../crypto.js')).common().GetEncryptedData(TagMerkleRoot,RewardPrivkey);

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
			let TargetTransaction = new (require('../transaction.js')).Transaction("",privkey,objtx);
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
	let Account = require('../account.js');
	let Transaction = require('../transaction.js');
	let main = require('../main.js');


	function mining(){
		/*
		negoトランザクションを走査してprivkeyを集める
		*/
		let negotxids = Transaction.GetTagTxids("nego");
		let Rewards = [];
		for (let index in negotxids){
			let txid = negotxids[index];
			let tx = Transaction.GetTx(txid);

			let negodata = new exports.NegoData(tx.GetObjTx()["data"]);


			if (Config.Nego["MiningTags"].indexOf(negodata.GetObjData()["tag"]) == -1){continue;};


			//tagのtxリストから共通鍵作る
			let tagtxids = Transaction.GetTagTxids(negodata.GetObjData()["tag"]);
			let commonkey = new (require('../hashs.js')).hashs().GetMarkleroot(tagtxids);

			if (!commonkey){continue;};


			//賞金の入った秘密鍵を取得
			let EncryptoPrivkey = negodata.GetObjData()["EncryptoPrivkey"];

			let RewardPrivkey = new (require('../crypto.js')).common().GetDecryptedData(commonkey,EncryptoPrivkey);
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


			let CollectAccount = new Account.account(Config.Nego["CollectPrivkey"]);
			let RewardAccount = new Account.account(RewardPrivkey);

			let sendamount = 0;
			try{
				sendamount = RewardAccount.GetBalance();
			}catch(e){
				continue;
			}

			if (sendamount > 0 && UsedRewardPrivkey.indexOf(RewardPrivkey) == -1){
				UsedRewardPrivkey.push(RewardPrivkey);
				main.note(1,"nego_RunMining","[Reward] "+sendamount+" by tag of "+tag);
				let result = Transaction.SendPayTransaction(RewardPrivkey,CollectAccount.GetKeys()["address"],sendamount);
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