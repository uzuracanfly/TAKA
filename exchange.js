const MAIN = require('./main.js');
const CONFIG = require('./config.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);
const ETHCOIND = require('./ETHCoind.js');
const ACCOUNT = require('./account.js');
const TRANSACTION = require('./transaction.js');




exports.RunExchangeScan = async function(){
	const TAKAContractAddress = "0x62B447cC1DD78Ed980Cf2B5068bAE8ABd7E9bD97";
	
	while (true){
		let ExchangeOrders = DATABASE.get("ExchangeOrders","live");
		for (let index in ExchangeOrders){
			let ExchangeOrder = ExchangeOrders[index];

			if (!("type" in ExchangeOrder) || !("PayTxid" in ExchangeOrder) || !("ReceiverAddress" in ExchangeOrder) || !("amount" in ExchangeOrder)){
				break;
			}


			let MyTAKAACCOUNT = new ACCOUNT.account(CONFIG.API.exchange["TAKAPrivkey"]);
			let MyETAKACOIND = new ETHCOIND.ETHCoind(CONFIG.API.exchange["ETHPrivkey"],TAKAContractAddress);






			/*
				ETAKA -> TAKA
			*/
			if (ExchangeOrder["type"] == "buy"){
				let bool = true;
				let ExchangeUsings = DATABASE.get("ExchangeUsings","live");
				for (let index in ExchangeUsings){
					let ExchangeUsing = ExchangeUsings[index];

					//すでに使用済み
					if (ExchangeUsing["PayTxid"] == ExchangeOrder["PayTxid"]){
						bool = false;
						break;
					};
				}
				//ExchangeOrdersの要素削除して一回走査を終了
				if (!bool){
					DATABASE.remove("ExchangeOrders","live",index);
					break;
				}



				//PayTxidの内容確認
				let TxData = MyETAKACOIND.GetTransactionData(ExchangeOrder["PayTxid"]);
				//未確認は一旦無視
				if (TxData["status"] != "0x1"){
					continue;
				};
				//コントラクト違う
				if (TxData["to"] != TAKAContractAddress){
					DATABASE.remove("ExchangeOrders","live",index);
					break;
				};
				let log = TxData["logs"][0];
				//送金先が違う
				let TargetAddress = (await MyETAKACOIND.GetKeys())["address"];
				TargetAddress = await MyETAKACOIND.FormKey(TargetAddress,false);
				TargetAddress = await MyETAKACOIND.paddingZero(TargetAddress, 64);
				TargetAddress = await MyETAKACOIND.FormKey(TargetAddress,true);
				if ((log["topics"]).indexOf(TargetAddress) == -1){
					DATABASE.remove("ExchangeOrders","live",index);
					break;
				};
				//数量が違う
				if (BigInt(log["data"]) != BigInt(ExchangeOrder["amount"])){
					DATABASE.remove("ExchangeOrders","live",index);
					break;
				};



				//自分自身がTAKAをもっているか
				let NowMyTAKABalance = await MyTAKAACCOUNT.GetBalance();
				if (NowMyTAKABalance < BigInt(ExchangeOrder["amount"])){
					continue;
				}



				///条件確認完了 TAKA支払い実行
				let ProductTxid = await TRANSACTION.SendPayTransaction(CONFIG.API.exchange["TAKAPrivkey"],ExchangeOrder["ReceiverAddress"],ExchangeOrder["amount"]);

				DATABASE.add("ExchangeUsings","live",{"type":"buy","PayTxid":ExchangeOrder["PayTxid"],"ResultTxid":ProductTxid});

				DATABASE.remove("ExchangeOrders","live",index);
				break;
			};





			/*
				TAKA -> ETAKA
			*/
			if (ExchangeOrder["type"] == "sell"){
				let bool = true;
				let ExchangeUsings = DATABASE.get("ExchangeUsings","live");
				for (let index in ExchangeUsings){
					let ExchangeUsing = ExchangeUsings[index];

					//すでに使用済み
					if (ExchangeUsing["PayTxid"] == ExchangeOrder["PayTxid"]){
						bool = false;
						break;
					};
				}
				//ExchangeOrdersの要素削除して一回走査を終了
				if (!bool){
					DATABASE.remove("ExchangeOrders","live",index);
					break;
				}



				//PayTxidの内容確認
				let TX = TRANSACTION.GetTx(ExchangeOrder["PayTxid"]);
				let objtx = await TX.GetObjTx();
				//送金先が違う
				let TAKATXACCOUNT = new ACCOUNT.account(objtx["pubkey"]);
				let TXKeys = await TAKATXACCOUNT.GetKeys();
				if (TXKeys["address"] != (await MyTAKAACCOUNT.GetKeys()["address"])){
					DATABASE.remove("ExchangeOrders","live",index);
					break;
				}
				//数量が違う
				if (BigInt(objtx["amount"]) != BigInt(ExchangeOrder["amount"])){
					DATABASE.remove("ExchangeOrders","live",index);
					break;
				};



				//自分自身がETAKAをもっているか
				let NowMyETAKABalance = await MyETAKACOIND.GetBalanceToken();
				if (NowMyETAKABalance < BigInt(ExchangeOrder["amount"])){
					continue;
				}	




				///条件確認完了 ETAKA支払い実行
				let ProductTxid = await COIND.SendCoin(ExchangeOrder["ReceiverAddress"],ExchangeOrder["amount"])

				DATABASE.add("ExchangeUsings","live",{"type":"sell","PayTxid":ExchangeOrder["PayTxid"],"ResultTxid":ProductTxid});

				DATABASE.remove("ExchangeOrders","live",index);
				break;
			};
		};


		await MAIN.sleep(10);
	}
}