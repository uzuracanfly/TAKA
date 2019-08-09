const IP = require("ip");

const CONFIG = require('./config.js');

const MAIN = require('./main.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);
const TRANSACTION = require('./transaction.js');






exports.GetNodeList = function(){
	let nodelist = DATABASE.get("nodelist");
	if (nodelist.length == 0){
		for (let index in CONFIG.broadcast["seed"]){
			let address = CONFIG.broadcast["seed"][index];

			exports.SetNode(address,"server",0);
		};
	}

	return nodelist;
}

exports.GetNode = function(address){
	let nodes = DATABASE.get("nodelist",address);

	if (nodes.length == 0){
		return false;
	}

	return nodes[0];
}

exports.SetNode = function(address,type,state){
	if (address === undefined) {
		return 0;
	};
	if (!address) {
		return 0;
	};
	if (address == IP.address()){
		return 0;
	};
	if (address == "0") {
		return 0;
	};
	if (address == "127.0.0.1") {
		return 0;
	};

	MAIN.note(1,"SetNode",address+" state:"+state);

	DATABASE.set("nodelist",address,{"type":type,"state":state});

	return 1;
}


function SetActionEvents(socket){

	/* データを求められたときの処理 */

	socket.on('GetNodeList', function (data) {
		try{
			let nodelist = exports.GetNodeList();

			socket.emit('NodeList', nodelist);
		}catch(e){
			MAIN.note(2,"SetActionEvents",e);
		}
	});


	socket.on('GetTransactionIdsPerAll', function (data) {
		try{
			let txids = DATABASE.get("TransactionIdsPerAll","live");

			socket.emit('TransactionIdsPerAll', txids);
		}catch(e){
			MAIN.note(2,"SetActionEvents",e);
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
			MAIN.note(2,"SetActionEvents",e);
		}
	});


	socket.on('GetTransaction', function (data) {
		try{
			let txs = DATABASE.get("ConfirmedTransactions",data);

			socket.emit('Transaction', txs[0]);
		}catch(e){
			MAIN.note(2,"SetActionEvents",e);
		}
	});




	/* 求めたデータが到着した時の処理 */

	/* ノードリスト取得 */
	socket.on('NodeList', function(data){
		try{
			for (let mindex in data){
				let maddress = data[mindex];

				exports.SetNode(maddress,"",0);
			};
		}catch(e){
			MAIN.note(2,"SetActionEvents",e);
		}
	});

	/* 未承認のトランザクション追加 */
	socket.on('UnconfirmedTransactions', async function(data){
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
			MAIN.note(2,"SetActionEvents",e);
		}
	});


	/* 承認済みのトランザクションIdからトランザクションデータ要求用のリストにid追加 */
	socket.on('TransactionIdsPerAll', function(data){
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
			MAIN.note(2,"SetActionEvents",e);
		}
	});


	/* トランザクションデータ到着 */
	socket.on('Transaction', async function(data){
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
			MAIN.note(2,"SetActionEvents",e);
		}
	});
};





















//rawtxを取得する予定のtxidリスト
let MyNodeGetPlanTxids = [];


exports.SetServer = function(){
	const APP = require('express')();
	const HTTP = require('http').Server(APP);
	const IO = require('socket.io')(HTTP);







	IO.on('connection', async function(socket){

		/* ノードリストにクライアントのアドレスを追加 */
		let address = socket.request.connection.remoteAddress;
		address = address.replace(/^.*:/, '');


		/* すでにこちらがサーバー側またはクライアント側として接続済み */
		let nodedata = exports.GetNode(address);
		if (nodedata){
			if (nodedata["state"] == 1){
				return false;
			};
		}
		exports.SetNode(address,"server",1);



		MAIN.note(1,"SetServer_connect","Connect Node : "+address);
		SetActionEvents(socket);


		socket.on('disconnect', async function(socket){
			MAIN.note(1,"SetServer_disconnect","Disconnect Node : "+address);

			exports.SetNode(address,"server",0);
		});


		/* 接続ノードに対してデータの要求 */
		while (true){
			try{
				let nodedata = exports.GetNode(address);
				if (!nodedata){
					break;
				}
				if (nodedata["state"] == 0){
					break;
				};

				socket.emit('GetNodeList');
				socket.emit('GetUnconfirmedTransactions');
				socket.emit('GetTransactionIdsPerAll');

				for (let index in MyNodeGetPlanTxids){
					let txid = MyNodeGetPlanTxids[index];

					socket.emit('GetTransaction',txid);
					await MAIN.sleep(1);
				}

				await MAIN.sleep(1);
			}catch(e){
				MAIN.note(2,"SetServer",e);
				continue;
			};
		};
	});




	HTTP.listen(CONFIG.broadcast["port"]);
}







exports.SetClient = async function(){
	const IO = require('socket.io-client');




	async function SetActionNode(address){

		let socket = IO('http://'+address+':'+CONFIG.broadcast["port"]);


		SetActionEvents(socket);


		socket.on('connect', async function(){
			/* すでにこちらがサーバー側またはクライアント側として接続済み */
			let nodedata = exports.GetNode(address);
			if (nodedata){
				if (nodedata["state"] == 1){
					return false;
				};
			}
			exports.SetNode(address,"client",1);


			MAIN.note(1,"SetClient_connect","Connect Node : "+address);


			/* 接続ノードに対してデータの要求 */
			while (true){
				try{
					let nodedata = exports.GetNode(address);
					if (!nodedata){
						break;
					}
					if (nodedata["state"] == 0){
						break;
					};

					socket.emit('GetNodeList');
					socket.emit('GetUnconfirmedTransactions');
					socket.emit('GetTransactionIdsPerAll');

					for (let index in MyNodeGetPlanTxids){
						let txid = MyNodeGetPlanTxids[index];

						socket.emit('GetTransaction',txid);
						await MAIN.sleep(1);
					}

					await MAIN.sleep(1);
				}catch(e){
					MAIN.note(2,"SetClient",e);
					continue;
				};
			};
		});

		socket.on('disconnect', async function(){
			MAIN.note(1,"SetClient_disconnect","Disconnect Node : "+address);

			exports.SetNode(address,"client",0);
		});

	}









	//アクション設定が完了したノードリスト
	let SetActionAddressList = [];

	while (true){
		try{
			let nodelist = exports.GetNodeList();


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
			MAIN.note(2,"SetClient",e);
			continue;
		};


	};
}




exports.SetP2P = async function(){
	/* ノードリストのリセット */
	for (let index in exports.GetNodeList()){
		let address = exports.GetNodeList()[index];

		exports.SetNode(address,"",0);
	};

	exports.SetServer();
	exports.SetClient();
};