const IP = require("ip");

const CONFIG = require('./config.js');

const MAIN = require('./main.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);
const TRANSACTION = require('./transaction.js');
const HEX = require('./hex.js');









async function send(socket,name,args){
	return new Promise(function (resolve, reject) {
		socket.on(`${name}_return`, async function (data) {
			return resolve(data);
		});
		socket.emit(`${name}`,args);
	});
}












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

	let node = new HEX.HexText().utf8_hex_string_to_string(nodes[0]);
	node = JSON.parse(node);

	return node;
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

	let data = {"time":Math.floor(Date.now()/1000),"type":type,"state":state};
	data = JSON.stringify(data);
	data = new HEX.HexText().string_to_utf8_hex_string(data);
	DATABASE.set("nodelist",address,data);

	return 1;
}



















function SetActionEvents(socket,address){


	/* ノードリスト取得 */
	socket.on('GetNodeList', function (data) {
		try{
			let nodelist = exports.GetNodeList();

			socket.emit('NodeList', nodelist);
		}catch(e){
			MAIN.note(2,"SetActionEvents",e);
		}
	});






	/*
		選出して生のトランザクションをお届け

		parameter : {"ConfirmedTxidsPerTag":[ConfirmedTxidsPerTag],"count":count,"NeedTags":[]}
		response : [rawtxs]
	*/
	socket.on('GetTransactions', async function (data) {
		try{
			let rawtxs = [];

			let tags = TRANSACTION.GetTags();
			tags = tags.sort(TRANSACTION.TagCompare);
			for (let index in tags){
				let tag = tags[index];

				if (rawtxs.length >= data["count"]){
					break;
				}
				if ((data["NeedTags"]).length > 0 && (data["NeedTags"]).indexOf(tag) == -1){
					continue;
				}

				let txids = await TRANSACTION.GetTagTxids(tag);
				for (let index in txids){
					let txid = txids[index];

					if (rawtxs.length >= data["count"]){
						break;
					}
					if (tag in data["ConfirmedTxidsPerTag"] && (data["ConfirmedTxidsPerTag"][tag]).indexOf(txid) != -1){
						continue;
					}

					let rawtx = await TRANSACTION.GetRawTxToDirect(txid);

					rawtxs.push(rawtx);
				}
			}
			let UnconfirmedTransactions = await TRANSACTION.GetUnconfirmedTransactions();
			for (let index in UnconfirmedTransactions){
				let rawtx = UnconfirmedTransactions[index];

				if (rawtxs.length >= data["count"]){
					break;
				}

				let TargetTransaction = new TRANSACTION.Transaction(rawtx);
				let txid = await TargetTransaction.GetTxid();
				let objtx = await TargetTransaction.GetObjTx();

				if (objtx["tag"] in data["ConfirmedTxidsPerTag"] && (data["ConfirmedTxidsPerTag"][objtx["tag"]]).indexOf(txid) != -1){
					continue;
				}
				if ((data["NeedTags"]).length > 0 && (data["NeedTags"]).indexOf(objtx["tag"]) == -1){
					continue;
				}

				//1分経っていまだに未承認のトランザクションは受け入れない
				if (objtx["time"]+60*1 < Math.floor(Date.now()/1000)){
					continue;
				}


				rawtxs.push(rawtx);
			}

			socket.emit('transactions', rawtxs);
		}catch(e){
			MAIN.note(2,"GetTransactions",e);
		};
	});
};











async function RuningGetTransactions(socket,address){
	try{
		/* 承認済みトランザクションリストまとめ */
		let ConfirmedTxidsPerTag = {};

		let tags = TRANSACTION.GetTags();
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

		let RawTxs = await send(socket,'GetTransactions',{"ConfirmedTxidsPerTag":ConfirmedTxidsPerTag,"count":5,"NeedTags":(await TRANSACTION.GetImportTags())});






		for (let index in RawTxs){
			let rawtx = RawTxs[index];

			if (!rawtx){
				continue;
			}

			let TargetTransaction = new TRANSACTION.Transaction(rawtx);

			await TargetTransaction.commit(undefined,false,false,-1);
		};
	}catch(e){
		MAIN.note(2,"RuningGetTransactions",e);
	}
};

async function RuningGetNodeList(socket,address){
	try{
		let NodeList = await send(socket,'GetNodeList',{})



		for (let index in NodeList){
			let NodeAddress = NodeList[index];

			/* すでに追加済み */
			let NodeData = exports.GetNode(NodeAddress);
			if (NodeData){
				return false;
			}

			exports.SetNode(NodeAddress,"",0);
		};
	}catch(e){
		MAIN.note(2,"RuningGetNodeList",e);
	};
};





















exports.SetServer = function(){
	/* ノードリストのリセット */
	for (let index in exports.GetNodeList()){
		let address = exports.GetNodeList()[index];

		exports.SetNode(address,"",0);
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


		
		let nodedata = exports.GetNode(address);
		if (nodedata){
			while (true){
				try{
					nodedata = exports.GetNode(address);
					//すでにこちらがクライアント側として接続済み
					if (nodedata["type"] == "client" && nodedata["state"] == 1){
						return false;
					};
					if (nodedata["time"]+10 < Math.floor(Date.now()/1000)){
						break;
					}
				}catch(e){
					MAIN.note(2,"broadcast_SetActionNode",e);
				}finally{
					await MAIN.sleep(1);
				}
			}
		}
		exports.SetNode(address,"server",1);



		MAIN.note(1,"SetServer_connect","Connect Node : "+address);
		SetActionEvents(socket,address);


		socket.on('disconnect', async function(){
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

				await RuningGetTransactions(socket,address);
				await RuningGetNodeList(socket,address);

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
			let nodedata = exports.GetNode(address);
			if (nodedata){
				while (true){
					try{
						nodedata = exports.GetNode(address);
						//すでにこちらがサーバー側として接続済み
						if (nodedata["type"] == "server" && nodedata["state"] == 1){
							return false;
						};
						if (nodedata["time"]+10 < Math.floor(Date.now()/1000)){
							break;
						}

					}catch(e){
						MAIN.note(2,"broadcast_SetClient",e);
					}finally{
						await MAIN.sleep(1);
					}
				}
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

					await RuningGetTransactions(socket,address);
					await RuningGetNodeList(socket,address);

				}catch(e){
					MAIN.note(2,"broadcast_SetClient",e);
				}finally{
					await MAIN.sleep(1);
				}
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


		}catch(e){
			MAIN.note(2,"SetClient",e);
		};
		await MAIN.sleep(10);
	};
}