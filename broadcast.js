const IP = require("ip");

const CONFIG = require('./config.js');

const MAIN = require('./main.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);
const TRANSACTION = require('./transaction.js');
const HEX = require('./hex.js');


















exports.GetConnectionNodeList = async function(){
	let NodeList = await exports.GetNodeList();

	let result = [];
	for (let index in NodeList){
		let address = NodeList[index];

		let NodeData = await exports.GetNode(address);
		if (NodeData["state"] == 1){
			result.push(NodeData);
		}
	}

	return result;
}


exports.GetNodeList = async function(){
	let nodelist = await DATABASE.get("nodelist");
	if (nodelist.length == 0){
		for (let index in CONFIG.broadcast["seed"]){
			let address = CONFIG.broadcast["seed"][index];

			await exports.SetNode(address,"",0);
		};
	}

	return nodelist;
}

exports.GetNode = async function(address){
	let nodes = await DATABASE.get("nodelist",address);

	if (nodes.length == 0){
		return false;
	}

	let node = nodes[0];

	return node;
}

exports.SetNode = async function(address,type,state){
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

	let data = {"time":Math.floor(Date.now()/1000),"type":type,"state":state};
	await DATABASE.set("nodelist",address,data);

	return 1;
}



















let BroadcastTransactions = {};
let BroadcastNodeList = {};

let CursorIndexPerAddress = {};

async function SetActionEvents(socket,address){


	/* ノードリスト取得 */
	socket.on('GetNodeList', async function (data) {
		try{
			let nodelist = await exports.GetNodeList();

			socket.emit('GetNodeList_return', nodelist);
		}catch(e){
			MAIN.note(2,"SetActionEvents_GetNodeList",e);
		}
	});

	socket.on('GetNodeList_return', async function(data){
		try{
			BroadcastNodeList[address] = data;
		}catch(e){
			MAIN.note(2,"SetActionEvents_GetNodeList_return",e);
		}
	});






	/*
		選出して生のトランザクションをお届け

		parameter : {"CursorIndex":0,"count":count}
		response : {"rawtxs":[rawtxs],"NextCursorIndex":0}
	*/
	socket.on('GetTransactions', async function (data) {
		try{
			let rawtxs = [];


			let UnconfirmedTransactions = await TRANSACTION.GetUnconfirmedTransactions();
			for (let index in UnconfirmedTransactions){
				let rawtx = UnconfirmedTransactions[index];

				if (rawtxs.length >= data["count"]){
					break;
				}

				let TargetTransaction = new TRANSACTION.Transaction(rawtx);
				let txid = await TargetTransaction.GetTxid();
				let objtx = await TargetTransaction.GetObjTx();

				//1分経っていまだに未承認のトランザクションは受け入れない
				if (objtx["time"]+60*1 < Math.floor(Date.now()/1000)){
					continue;
				}


				rawtxs.push(rawtx);
			}

			let txids = await TRANSACTION.GetAllTxids();
			let NextCursorIndex = 0;
			for (let index in txids){
				let txid = txids[index];

				if (index < data["CursorIndex"]){
					continue;
				}

				if (rawtxs.length >= data["count"]){
					NextCursorIndex = index;
					break;
				}

				let rawtx = await TRANSACTION.GetRawTxToDirect(txid);

				rawtxs.push(rawtx);
			}

			socket.emit('GetTransactions_return', {"rawtxs":rawtxs,"NextCursorIndex":NextCursorIndex});
		}catch(e){
			MAIN.note(2,"SetActionEvents_GetTransactions",e);
		};
	});

	socket.on('GetTransactions_return', async function (data) {
		try{
			CursorIndexPerAddress[address] = data["NextCursorIndex"];
			BroadcastTransactions[address] = data["rawtxs"];
		}catch(e){
			MAIN.note(2,"SetActionEvents_GetTransactions_return",e);
		};
	});
};











async function RuningGetTransactions(socket,address){
	try{
		/* 承認済みトランザクションリストまとめ */
		let ConfirmedTxidsPerTag = {};

		let tags = await TRANSACTION.GetTags();
		for (let index in tags){
			let tag = tags[index];

			let txids = await TRANSACTION.GetTagTxids(tag);
			ConfirmedTxidsPerTag[tag] = txids;
		};

		let UnconfirmedTransactions = await TRANSACTION.GetUnconfirmedTransactions();
		for (let index in UnconfirmedTransactions){
			let rawtx = UnconfirmedTransactions[index];

			let TargetTransaction = new TRANSACTION.Transaction(rawtx);
			let txid = await TargetTransaction.GetTxid();
			let objtx = await TargetTransaction.GetObjTx();

			if (!objtx["tag"] in ConfirmedTxidsPerTag){
				ConfirmedTxidsPerTag[objtx["tag"]] = [];
			}

			(ConfirmedTxidsPerTag[objtx["tag"]]).push(txid);
		};

		if (address in BroadcastTransactions){
			delete BroadcastTransactions[address];
		};

		let CursorIndex = 0;
		if (address in CursorIndexPerAddress){
			CursorIndex = CursorIndexPerAddress[address];
		}
		socket.emit('GetTransactions',{"CursorIndex":CursorIndex,"count":1000});





		/* BroadcastTransactions取得まで待機 */
		let timecount = 0;
		while (timecount < 10){
			if (address in BroadcastTransactions){
				break;
			};

			timecount = timecount + 1;
			await MAIN.sleep(1);
		}




		if (address in BroadcastTransactions){
			let BroadcastTransactionsPerAddress = BroadcastTransactions[address];
			for (let index in BroadcastTransactionsPerAddress){
				let rawtx = BroadcastTransactionsPerAddress[index];

				if (!rawtx){
					continue;
				}

				let TargetTransaction = new TRANSACTION.Transaction(rawtx);

				await TargetTransaction.commit(undefined,false,false,-1);
			};
		};
	}catch(e){
		MAIN.note(2,"RuningGetTransactions",e);
	}
};

async function RuningGetNodeList(socket,address){
	try{
		if (address in BroadcastNodeList){
			delete BroadcastNodeList[address];
		};
		socket.emit('GetNodeList');




		/* BroadcastNodeList取得まで待機 */
		let timecount = 0;
		while (timecount < 10){
			if (address in BroadcastNodeList){
				break;
			};

			timecount = timecount + 1;
			await MAIN.sleep(1);
		}


		if (address in BroadcastNodeList){
			for (let index in BroadcastNodeList[address]){
				let NodeAddress = BroadcastNodeList[address][index];

				/* すでに追加済み */
				let NodeData = await exports.GetNode(NodeAddress);
				if (NodeData){
					return false;
				}

				await exports.SetNode(NodeAddress,"",0);
			};
		};
	}catch(e){
		MAIN.note(2,"RuningGetNodeList",e);
	};
};





















exports.SetServer = async function(){
	/* ノードリストのリセット */
	for (let index in await exports.GetNodeList()){
		let address = await exports.GetNodeList()[index];

		await exports.SetNode(address,"",0);
	};


	const options = {
		serveClient: false,
		pingTimeout: 120000,
		pingInterval: 60000
		// transports: ['polling']
	}


	const HTTP = require('http').createServer();
	const IO = require('socket.io')(HTTP,options);



	async function SetActionNode(socket){
		/* ノードリストにクライアントのアドレスを追加 */
		let address = socket.request.connection.remoteAddress;
		address = address.replace(/^.*:/, '');


		/* 接続ノード数上限 */
		if (socket.client.conn.server.clientsCount >= 3){
			socket.disconnect();
			return false;
		}


		
		let nodedata = await exports.GetNode(address);
		if (nodedata){
			while (true){
				await MAIN.sleep(Math.random()*5);
				try{
					nodedata = await exports.GetNode(address);
					//すでにこちらがクライアント側として接続済み
					if (nodedata["type"] == "client" && nodedata["state"] == 1){
						return false;
					};
					if (nodedata["time"]+10 < Math.floor(Date.now()/1000)){
						break;
					}
				}catch(e){
					MAIN.note(2,"broadcast_SetActionNode",e);
				}
			}
		}
		await exports.SetNode(address,"server",1);



		MAIN.note(1,"SetServer_connect","Connect Node : "+address);
		SetActionEvents(socket,address);


		socket.on('disconnect', async function(){
			MAIN.note(1,"SetServer_disconnect","Disconnect Node : "+address);

			await exports.SetNode(address,"server",0);
		});


		/* 接続ノードに対してデータの要求 */
		while (true){
			try{
				let nodedata = await exports.GetNode(address);
				if (!nodedata){
					break;
				}
				if (nodedata["state"] == 0){
					break;
				};

				let PromiseRuningGetTransactions = RuningGetTransactions(socket,address);
				let PromiseRuningGetNodeList = RuningGetNodeList(socket,address);

				await Promise.race([PromiseRuningGetTransactions, PromiseRuningGetNodeList]);

			}catch(e){
				MAIN.note(2,"broadcast_SetServer",e);
			}finally{
				await MAIN.sleep(1);
			}
		};
	};




	IO.on('connection', async function(socket){
		SetActionNode(socket);
	});




	HTTP.listen(CONFIG.broadcast["port"]);
}







exports.SetClient = async function(){
	const IO = require('socket.io-client');




	async function SetActionNode(address){

		let socket = IO('http://'+address+':'+CONFIG.broadcast["port"]);


		SetActionEvents(socket,address);


		socket.on('connect', async function(){
			let nodedata = await exports.GetNode(address);
			if (nodedata){
				while (true){
					await MAIN.sleep(Math.random()*5);
					try{
						nodedata = await exports.GetNode(address);
						//すでにこちらがサーバー側として接続済み
						if (nodedata["type"] == "server" && nodedata["state"] == 1){
							return false;
						};
						if (nodedata["time"]+10 < Math.floor(Date.now()/1000)){
							break;
						}

					}catch(e){
						MAIN.note(2,"broadcast_SetClient",e);
					}
				}
			}
			await exports.SetNode(address,"client",1);


			MAIN.note(1,"SetClient_connect","Connect Node : "+address);


			/* 接続ノードに対してデータの要求 */
			while (true){
				try{
					let nodedata = await exports.GetNode(address);
					if (!nodedata){
						break;
					}
					if (nodedata["state"] == 0){
						break;
					};

					let PromiseRuningGetTransactions = RuningGetTransactions(socket,address);
					let PromiseRuningGetNodeList = RuningGetNodeList(socket,address);

					await Promise.race([PromiseRuningGetTransactions, PromiseRuningGetNodeList]);

				}catch(e){
					MAIN.note(2,"broadcast_SetClient",e);
				}finally{
					await MAIN.sleep(1);
				}
			};
		});

		socket.on('disconnect', async function(){
			MAIN.note(1,"SetClient_disconnect","Disconnect Node : "+address);

			await exports.SetNode(address,"client",0);
		});

	}









	//アクション設定が完了したノードリスト
	let SetActionAddressList = [];

	while (true){
		try{
			let nodelist = await exports.GetNodeList();


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