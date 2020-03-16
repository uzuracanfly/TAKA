const MAIN = require('./main.js');
const HEX = require('./hex.js');
const CONFIG = require('./config.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);
const ETHCOIND = require('./ETHCoind.js');
const ACCOUNT = require('./account.js');
const TRANSACTION = require('./transaction.js');



exports.SetExchangeOrder = async function(type,PayTxid,ReceiverAddress,amount){
	try{
		amount = parseInt(amount);

		DATABASE.add("ExchangeOrders","live",{"type":type,"PayTxid":PayTxid,"ReceiverAddress":ReceiverAddress,"amount":amount});
		return true;
	}catch(e){
		MAIN.note(2,"SetExchangeOrder",e);
		return false;
	}
};





exports.RunExchangeScan = async function(){
	const TAKAContractAddress = "0x62B447cC1DD78Ed980Cf2B5068bAE8ABd7E9bD97";
	
	while (true){
		try{
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
					for (let mindex in ExchangeUsings){
						let ExchangeUsing = ExchangeUsings[mindex];

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
					let TxData = await MyETAKACOIND.GetTransactionData(ExchangeOrder["PayTxid"]);
					//未確認は一旦無視
					if (TxData["status"] != "0x1"){
						continue;
					};
					//コントラクト違う
					if ((TxData["to"]).toLowerCase() != (TAKAContractAddress).toLowerCase()){
						DATABASE.remove("ExchangeOrders","live",index);
						break;
					};
					let log = TxData["logs"][0];
					//送金先が違う
					let TargetAddress = (await MyETAKACOIND.GetKeys())["address"];
					TargetAddress = await MyETAKACOIND.FormKey(TargetAddress,false);
					TargetAddress = await MyETAKACOIND.paddingZero(TargetAddress, 64);
					TargetAddress = await MyETAKACOIND.FormKey(TargetAddress,true);
					TargetAddress = TargetAddress.toLowerCase();
					if ((log["topics"]).indexOf(TargetAddress) == -1){
						DATABASE.remove("ExchangeOrders","live",index);
						break;
					};
					//数量が違う
					if (parseInt(log["data"],16) != parseInt(ExchangeOrder["amount"])){
						DATABASE.remove("ExchangeOrders","live",index);
						break;
					};



					//自分自身がTAKAをもっているか
					let NowMyTAKABalance = await MyTAKAACCOUNT.GetBalance();
					if (NowMyTAKABalance < parseInt(ExchangeOrder["amount"])){
						continue;
					}



					///条件確認完了 TAKA支払い実行
					let ProductTxid = await TRANSACTION.SendPayTransaction(CONFIG.API.exchange["TAKAPrivkey"],ExchangeOrder["ReceiverAddress"],ExchangeOrder["amount"]);
					if (!ProductTxid){
						continue;
					}

					DATABASE.add("ExchangeUsings","live",{"type":"buy","PayTxid":ExchangeOrder["PayTxid"],"ResultTxid":ProductTxid});
					MAIN.note(1,"RunExchangeScan","EXCHANGE "+ExchangeOrder["amount"]+"ETAKA => "+ExchangeOrder["amount"]+"TAKA");

					DATABASE.remove("ExchangeOrders","live",index);
					break;
				};





				/*
					TAKA -> ETAKA
				*/
				if (ExchangeOrder["type"] == "sell"){
					let bool = true;
					let ExchangeUsings = DATABASE.get("ExchangeUsings","live");
					for (let mindex in ExchangeUsings){
						let ExchangeUsing = ExchangeUsings[mindex];

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
					if (objtx["toaddress"] != ((await MyTAKAACCOUNT.GetKeys())["address"])){
						DATABASE.remove("ExchangeOrders","live",index);
						break;
					}
					//数量が違う
					if (parseInt(objtx["amount"]) != parseInt(ExchangeOrder["amount"])){
						DATABASE.remove("ExchangeOrders","live",index);
						break;
					};



					//自分自身がETAKAをもっているか
					let NowMyETAKABalance = await MyETAKACOIND.GetBalanceToken();
					if (NowMyETAKABalance < parseInt(ExchangeOrder["amount"])){
						continue;
					}	




					///条件確認完了 ETAKA支払い実行
					let ProductTxid = await MyETAKACOIND.SendToken(ExchangeOrder["ReceiverAddress"],ExchangeOrder["amount"]);
					if (!ProductTxid){
						continue;
					}

					DATABASE.add("ExchangeUsings","live",{"type":"sell","PayTxid":ExchangeOrder["PayTxid"],"ResultTxid":ProductTxid});
					MAIN.note(1,"RunExchangeScan","EXCHANGE "+ExchangeOrder["amount"]+"TAKA => "+ExchangeOrder["amount"]+"ETAKA");

					DATABASE.remove("ExchangeOrders","live",index);
					break;
				};
			};


			await MAIN.sleep(10);
		}catch(e){
			MAIN.note(2,"RunExchangeScan",e);
			await MAIN.sleep(10);
		}
	}
}