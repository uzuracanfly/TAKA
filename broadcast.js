const IP = require("ip");

const CONFIG = require('./config.js');

const MAIN = require('./main.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);
const TRANSACTION = require('./transaction.js');






exports.GetNode = function(){
	let nodelist = DATABASE.get("nodelist","live");
	if (nodelist.length == 0){
		nodelist = CONFIG.broadcast["seed"];
	}

	return nodelist;
}


exports.SetNode = function(address){
	let nodelist = exports.GetNode();

	if (address === undefined) {
		return 0;
	};
	if (!address) {
		return 0;
	};
	if (nodelist.indexOf(address) >= 0){
		return 0;
	};
	if (address == IP.address()){
		return 0;
	}

	MAIN.note(1,"SetNode",address);

	DATABASE.add("nodelist","live",address);

	return 1;
}










exports.SetServer = function(){
	const APP = require('express')();
	const HTTP = require('http').Server(APP);
	const IO = require('socket.io')(HTTP);

	/*
	IO.set('heartbeat interval', 5000);
	IO.set('heartbeat timeout', 15000);
	*/

	IO.on('connection', (socket) => {
		let address = socket.request.connection.remoteAddress;
		address = address.replace(/^.*:/, '');

		exports.SetNode(address);


		socket.on('GetNodeList', function (data) {
			try{
				let nodelist = DATABASE.get("nodelist","live");

				socket.emit('NodeList', nodelist);
			}catch(e){
				console.log(e);
			}
		});


		socket.on('GetTransactionIdsPerAll', function (data) {
			try{
				let txids = DATABASE.get("TransactionIdsPerAll","live");

				socket.emit('TransactionIdsPerAll', txids);
			}catch(e){
				console.log(e);
			}
		});


		socket.on('GetUnconfirmedTransactions', function (data) {
			try{
				let txs = [];
				let tags = TRANSACTION.GetTags();
				for (let index in tags){
					let tag = tags[index];

					if (!tag){
						continue;
					}

					let rawtxs = DATABASE.get("UnconfirmedTransactions",tag);

					if (rawtxs.length == 0){
						continue;
					};

					rawtx = rawtxs[0]

					txs.push(rawtx);
				};

				socket.emit('UnconfirmedTransactions', txs);
			}catch(e){
				console.log(e);
			}
		});


		socket.on('GetTransaction', function (data) {
			try{
				let txs = DATABASE.get("ConfirmedTransactions",data);

				socket.emit('Transaction', txs[0]);
			}catch(e){
				console.log(e);
			}
		});
	});


	HTTP.listen(CONFIG.broadcast["port"]);
}







exports.SetClient = async function(){
	const IO = require('socket.io-client');




	function SetActionNode(address){

		let broadcast = IO('http://'+address+':'+CONFIG.broadcast["port"]);




		/* データ到着時の処理 */

		/* ノードリスト取得 */
		broadcast.on('NodeList', function(data){
			try{
				for (let mindex in data){
					let maddress = data[mindex];

					exports.SetNode(maddress);
				};
			}catch(e){
				console.log(e);
			}
		});



		/* 未承認のトランザクション追加 */
		broadcast.on('UnconfirmedTransactions', async function(data){
			try{
				for (let mindex in data){
					let rawtx = data[mindex];

					if (!rawtx){
						continue;
					}


					let UnconfirmedTransactions = TRANSACTION.GetUnconfirmedTransactions();
					if (UnconfirmedTransactions.indexOf(rawtx) >= 0){
						continue;
					};


					let TargetTransaction = new TRANSACTION.Transaction(rawtx);
					let txid = await TargetTransaction.GetTxid();
					let objtx = await TargetTransaction.GetObjTx();

					//1分経っていまだに未承認のトランザクションは受け入れない
					if (objtx["time"]+60*1 < Math.floor(Date.now()/1000)){
						continue;
					}

					let TransactionIdsPerAll = TRANSACTION.GetAllTxids();
					if (TransactionIdsPerAll.indexOf(txid) >= 0){
						continue;
					};

					if (MyNodeGetPlanTxids.indexOf(txid) >= 0){
						continue;
					};

					TargetTransaction.commit();
				};
			}catch(e){
				console.log(e);
			}
		});



		/* 承認済みのトランザクションIdからトランザクションデータ要求用のリストにid追加 */
		broadcast.on('TransactionIdsPerAll', function(data){
			try{
				let TransactionIdsPerAll = TRANSACTION.GetAllTxids();

				for (let mindex in data){
					let txid = data[mindex];

					if (!txid){
						return 0;
					}

					if (txid.length != 64){
						return 0;
					}

					if (TransactionIdsPerAll.indexOf(txid) >= 0){
						continue;
					};

					if (MyNodeGetPlanTxids.indexOf(txid) >= 0){
						continue;
					};

					MyNodeGetPlanTxids.push(txid);
				};
			}catch(e){
				console.log(e);
			}
		});



		/* トランザクションデータ到着 */
		broadcast.on('Transaction', async function(data){
			try{
				if (!data){
					return 0;
				}

				let UnconfirmedTransactions = TRANSACTION.GetUnconfirmedTransactions();
				if (UnconfirmedTransactions.indexOf(data) >= 0){
					return 0;
				};

				let TargetTransaction = new TRANSACTION.Transaction(data);
				let txid = await TargetTransaction.GetTxid();

				let TransactionIdsPerAll = TRANSACTION.GetAllTxids();
				if (TransactionIdsPerAll.indexOf(txid) >= 0){
					return 0;
				};

				TargetTransaction.commit().then(function(txid){
					MyNodeGetPlanTxids = MyNodeGetPlanTxids.filter(n => n !== txid);
				});
			}catch(e){
				console.log(e);
			}
		});








		broadcast.on('connect', async function(){
			MAIN.note(1,"SetClient_connect","Connect Node : "+address);

			RunSendToNodeAddressList.push(broadcast);
			RunSendToNode(broadcast);
		});



		broadcast.on('disconnect', async function(){
			MAIN.note(1,"SetClient_disconnect","Disconnect Node : "+address);

			RunSendToNodeAddressList = RunSendToNodeAddressList.filter(n => n !== broadcast);
		});

	}



	async function RunSendToNode(broadcast){

		/* 接続ノードに対してデータの要求 */
		while (true){
			try{
				if (RunSendToNodeAddressList.indexOf(broadcast) < 0){
					break;
				};

				broadcast.emit('GetNodeList');
				broadcast.emit('GetUnconfirmedTransactions');
				broadcast.emit('GetTransactionIdsPerAll');

				for (let index in MyNodeGetPlanTxids){
					let txid = MyNodeGetPlanTxids[index];

					broadcast.emit('GetTransaction',txid);
					await MAIN.sleep(1);
				}

				await MAIN.sleep(1);
			}catch(e){
				console.log(e);
				continue;
			};
		};
	}






	//rawtxを取得する予定のtxidリスト
	let MyNodeGetPlanTxids = [];

	//アクション設定が完了したノードリスト
	let SetActionAddressList = [];

	//RunSendToNode実行中のノードリスト
	let RunSendToNodeAddressList = [];

	while (true){
		try{
			let nodelist = exports.GetNode();


			/* 各ノードの設定 */
			for (let index in nodelist){
				let address = nodelist[index];

				if (SetActionAddressList.indexOf(address) >= 0){
					continue;
				};
				SetActionAddressList.push(address);
				SetActionNode(address);
			};


			await MAIN.sleep(10);

		}catch(e){
			console.log(e);
			continue;
		};


	};
}