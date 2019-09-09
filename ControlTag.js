const CONFIG = require('./config.js');
const MAIN = require('./main.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);
const TRANSACTION = require('./transaction.js');
const TRANSACTIONTOOLS_TAGREWARD = require('./TransactionTools/tagreward');




exports.RunControlTag = async function(){
	while (true){
		try{
			let TagsRewardPerYear = {};
			let TxidsTagreward = TRANSACTION.GetTagTxids("tagreward");
			for (let index in TxidsTagreward){
				let txid = TxidsTagreward[index];

				let TX = TRANSACTION.GetTx(txid);
				let objtx = await TX.GetObjTx();
				let rewarddata = (new TRANSACTIONTOOLS_TAGREWARD.TagrewardData(objtx["data"])).GetObjData();

				let rewardtxid = rewarddata["rewardtxid"];
				let REWARDTX = TRANSACTION.GetTx(rewardtxid);
				let rewardobjtx = await REWARDTX.GetObjTx();

				if (!(rewarddata["tag"] in TagsRewardPerYear)){
					TagsRewardPerYear[rewarddata["tag"]] = 0;
				}

				if (rewardobjtx["time"] > Math.floor(Date.now()/1000)-60*60*24*30*12){
					TagsRewardPerYear[rewarddata["tag"]] = TagsRewardPerYear[rewarddata["tag"]] + rewardobjtx["amount"];
				}
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
					MAIN.note(1,"RunControlTag",`ADD ${tag}`);
					await TRANSACTION.SetImportTags("add",tag);
				}
			}


			/* remove */
			let ImportTags = await TRANSACTION.GetImportTags();
			for (let index in ImportTags){
				let tag = ImportTags[index];

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


				if (TagsRewardPerYear[tag] / SumSize * 1000000 < 1){
					MAIN.note(1,"RunControlTag",`REMOVE ${tag}`);
					await TRANSACTION.SetImportTags("remove",tag);
				}
			}



			/* すべてsetminingtags */
			let MiningTags = await TRANSACTIONTOOLS_TAGREWARD.GetMiningTags();
			for (let index in MiningTags){
				let tag = MiningTags[index];

				await TRANSACTIONTOOLS_TAGREWARD.SetMiningTags("remove",tag);
			};
			ImportTags = await TRANSACTION.GetImportTags();
			for (let index in ImportTags){
				let tag = ImportTags[index];

				await TRANSACTIONTOOLS_TAGREWARD.SetMiningTags("add",tag);
			};
		}catch(e){
			MAIN.note(2,"RunControlTag",e);
		}

		await MAIN.sleep(60);
	}
}