const IP = require("ip");

const CONFIG = require('./config.js');

const MAIN = require('./main.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);
const TRANSACTION = require('./transaction.js');





exports.GetConnectionNodeList = function(){
	let NodeList = exports.GetNodeList();

	let result = [];
	for (let index in NodeList){
		let address = NodeList[index];

		let NodeData = exports.GetNode(address);
		if (NodeData["state"] == 1){
			result.push(NodeData);
		}
	}

	return result;
}


exports.GetNodeList = function(){
	let nodelist = DATABASE.get("nodelist");
	if (nodelist.length == 0){
		for (let index in CONFIG.broadcast["seed"]){
			let address = CONFIG.broadcast["seed"][index];

			exports.SetNode(address,"",0);
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

	DATABASE.set("nodelist",address,{"time":Math.floor(Date.now()/1000),"type":type,"state":state});

	return 1;
}


function SetActionEvents(socket){


	/* ノードリスト取得 */
	socket.on('GetNodeList', function (data) {
		try{
			let nodelist = exports.GetNodeList();

			socket.emit('NodeList', nodelist);
		}catch(e){
			MAIN.note(2,"SetActionEvents",e);
		}
	});

	socket.on('NodeList', function(data){
		try{
			for (let index in data){
				let address = data[index];

				/* すでに追加済み */
				let NodeData = exports.GetNode(address);
				if (NodeData){
					return false;
				}

				exports.SetNode(address,"",0);
			};
		}catch(e){
			MAIN.note(2,"SetActionEvents",e);
		}
	});





	/* 未承認のトランザクション追加 */
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

	socket.on('UnconfirmedTransactions', async function(data){
		try{
			let TransactionIdsPerAll = TRANSACTION.GetAllTxids();
			
			for (let mindex in data){
				let rawtx = data[mindex];

				if (!rawtx){
					continue;
				}


				let UnconfirmedTransactions = await TRANSACTION.GetUnconfirmedTransactions();
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

				if (TransactionIdsPerAll.indexOf(txid) >= 0){
					continue;
				};

				TargetTransaction.commit(undefined,false,false,-1);
			};
		}catch(e){
			MAIN.note(2,"SetActionEvents",e);
		}
	});





	/*
		選出して生のトランザクションをお届け

		parameter : {"ConfirmedTxids":[ConfirmedTxids],"count":count,"NeedTags":[]}
		response : [rawtxs]
	*/
	socket.on('GetConfirmedTransactions', async function (data) {
		try{
			let TransactionIdsPerAll = TRANSACTION.GetAllTxids();
			let rawtxs = [];
			for (let index in TransactionIdsPerAll){
				let txid = TransactionIdsPerAll[index];

				if (rawtxs.length >= data["count"]){
					break;
				}
				if ((data["ConfirmedTxids"]).indexOf(txid) > 0){
					continue;
				}

				let TX = TRANSACTION.GetTx(txid);
				let rawtx = await TX.GetRawTx();
				let objtx = await TX.GetObjTx();

				if ((data["NeedTags"]).length > 0 && (data["NeedTags"]).indexOf(objtx["tag"]) == -1){
					continue;
				}

				rawtxs.push(rawtx);
			}

			socket.emit('ConfirmedTransactions', rawtxs);
		}catch(e){
			MAIN.note(2,"GetConfirmedTransactions",e);
		};
	});

	socket.on('ConfirmedTransactions', async function (rawtxs) {
		try{
			BroadcastConfirmedTransactions = rawtxs;
		}catch(e){
			MAIN.note(2,"ConfirmedTransactions",e);
		};
	});
};



async function RuningGetConfirmedTransactions(socket,address){
	while (true){
		try{
			let nodedata = exports.GetNode(address);
			if (!nodedata){
				break;
			}
			if (nodedata["state"] == 0){
				break;
			};



			/* 承認済みトランザクションリストまとめ */
			let ConfirmedTxids = TRANSACTION.GetAllTxids();
			let UnconfirmedTransactions = await TRANSACTION.GetUnconfirmedTransactions();
			for (let index in UnconfirmedTransactions){
				let rawtx = UnconfirmedTransactions[index];

				let TargetTransaction = new TRANSACTION.Transaction(rawtx);
				let txid = await TargetTransaction.GetTxid();

				if (ConfirmedTxids.indexOf(txid) > 0){
					continue;
				}

				ConfirmedTxids.push(txid);
			};
			BroadcastConfirmedTransactions = [];
			socket.emit('GetConfirmedTransactions',{"ConfirmedTxids":ConfirmedTxids,"count":10,"NeedTags":(await TRANSACTION.GetImportTags())});





			/* BroadcastConfirmedTransactions取得まで待機 */
			let timecount = 0;
			while (timecount < 10*60){
				if (BroadcastConfirmedTransactions.length > 0){
					break;
				};

				timecount = timecount + 1;
				await MAIN.sleep(1);
			}





			for (let index in BroadcastConfirmedTransactions){
				let rawtx = BroadcastConfirmedTransactions[index];

				if (!rawtx){
					continue;
				}

				let TargetTransaction = new TRANSACTION.Transaction(rawtx);

				await TargetTransaction.commit(undefined,false,false,-1);
			};
		}catch(e){
			MAIN.note(2,"RuningGetConfirmedTransactions",e);
		}

		await MAIN.sleep(1);
	};
};

async function RuningGetUnConfirmedTransactions(socket,address){
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

		}catch(e){
			MAIN.note(2,"RuningGetUnConfirmedTransactions",e);
		};

		await MAIN.sleep(1);
	};
};




















let BroadcastConfirmedTransactions = [];

exports.SetServer = function(){
	const APP = require('express')();
	const HTTP = require('http').Server(APP);
	const IO = require('socket.io')(HTTP);



	async function SetActionNode(socket){
		/* ノードリストにクライアントのアドレスを追加 */
		let address = socket.request.connection.remoteAddress;
		address = address.replace(/^.*:/, '');


		/* 接続ノード数上限 */
		if (socket.client.conn.server.clientsCount >= 3){
			socket.disconnect();
			return false;
		}


		/* すでにこちらがクライアント側として接続済み */
		let nodedata = exports.GetNode(address);
		if (nodedata){
			if (nodedata["type"] == "client" && nodedata["state"] == 1){
				return false;
			};
			while (true){
				if (nodedata["time"]+10 < Math.floor(Date.now()/1000)){
					break;
				}

				await MAIN.sleep(1);
			}
		}
		exports.SetNode(address,"server",1);



		MAIN.note(1,"SetServer_connect","Connect Node : "+address);
		SetActionEvents(socket);


		socket.on('disconnect', async function(){
			MAIN.note(1,"SetServer_disconnect","Disconnect Node : "+address);

			exports.SetNode(address,"server",0);
		});


		/* 接続ノードに対してデータの要求 */
		RuningGetConfirmedTransactions(socket,address);
		RuningGetUnConfirmedTransactions(socket,address);
	};


	IO.set('heartbeat interval', 5000);
	IO.set('heartbeat timeout', 15000);

	IO.on('connection', async function(socket){
		SetActionNode(socket);
	});




	HTTP.listen(CONFIG.broadcast["port"]);
}







exports.SetClient = async function(){
	const IO = require('socket.io-client');




	async function SetActionNode(address){

		let socket = IO('http://'+address+':'+CONFIG.broadcast["port"]);


		SetActionEvents(socket);


		socket.on('connect', async function(){
			/* すでにこちらがサーバー側として接続済み */
			let nodedata = exports.GetNode(address);
			if (nodedata){
				if (nodedata["type"] == "server" && nodedata["state"] == 1){
					return false;
				};
				while (true){
					if (nodedata["time"]+10 < Math.floor(Date.now()/1000)){
						break;
					}

					await MAIN.sleep(1);
				}
			}
			exports.SetNode(address,"client",1);


			MAIN.note(1,"SetClient_connect","Connect Node : "+address);


			/* 接続ノードに対してデータの要求 */
			RuningGetConfirmedTransactions(socket,address);
			RuningGetUnConfirmedTransactions(socket,address);
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


		}catch(e){
			MAIN.note(2,"SetClient",e);
		};
		await MAIN.sleep(10);
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