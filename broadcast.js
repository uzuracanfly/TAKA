const CONFIG = require('./config.js');

const SYNCREQUEST = require('sync-request');
const APP = require('express')();
const HTTP = require('http').Server(APP);
const IO = require('socket.io')(HTTP);

const MAIN = require('./main.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);
const TRANSACTION = require('./transaction.js');



IO.set('heartbeat interval', 5000);
IO.set('heartbeat timeout', 15000);



exports.SetServer = function(){
	let broadcast = IO.of('/broadcast').on('connection', function(socket) {

		socket.on('GetNodeList', function (data) {
			let nodelist = DATABASE.get("nodelist","live");

			socket.emit('NodeList', nodelist);
		});


		socket.on('GetTransactionIdsPerAll', function (data) {
			let txids = DATABASE.get("TransactionIdsPerAll","live");

			socket.emit('TransactionIdsPerAll', txids);
		});


		socket.on('GetUnconfirmedTransactions', function (data) {
			let txs = [];
			let tags = DATABASE.get("UnconfirmedTransactions");
			for (let index in tags){
				let tag = tags[index];

				let rawtx = DATABASE.get("UnconfirmedTransactions",tag);

				txs.push(rawtx);
			};

			socket.emit('UnconfirmedTransactions', txs);
		});


		socket.on('GetTransaction', function (data) {
			let txs = DATABASE.get("ConfirmedTransactions",data["txid"]);

			socket.emit('Transaction', txs[0]);
		});
	});
}







exports.SetClient = async function(){

	let nodelist = DATABASE.get("nodelist","live");
	if (nodelist.length == 0){
		nodelist = CONFIG.broadcast["seed"];
	}









	let MyNodeUnconfirmedTransactions = [];

	/* データ到着時の処理 */
	for (let index in nodelist){
		let address = nodelist[index];

		let broadcast = IO.connect('http://'+address+':'+CONFIG.broadcast["port"]+'/broadcast');


		/* ノードリスト取得 */
		broadcast.on('NodeList', function(data){
			let nodelist = DATABASE.get("nodelist","live");

			for (let mindex in data){
				let saveaddress = savenodelist[mindex];

				if (nodelist.indexOf(saveaddress) >= 0){
					continue;
				};

				MAIN.note(1,"broadcast_RunScanning_addnode",saveaddress);

				let nodelist = DATABASE.add("nodelist","live",saveaddress);
			};
		});



		/* 未承認のトランザクション追加 */
		broadcast.on('UnconfirmedTransactions', function(data){
			for (let mindex in data){
				let rawtx = data[mindex];

				new TRANSACTION.Transaction().commit(rawtx);
			};
		});



		/* 承認済みのトランザクションIdからトランザクションデータ要求用のリストにid追加 */
		broadcast.on('TransactionIdsPerAll', function(data){
			let TransactionIdsPerAll = TRANSACTION.GetAllTxids();

			for (let mindex in data){
				let txid = data[mindex];

				if (TransactionIdsPerAll.indexOf(txid) >= 0){
					continue;
				};
				if (MyNodeUnconfirmedTransactions.indexOf(txid) >= 0){
					continue;
				};

				MyNodeUnconfirmedTransactions.push(txid);
			};
		});



		/* トランザクションデータ到着 */
		broadcast.on('Transaction', function(data){
			new TRANSACTION.Transaction().commit(data);
		});
	};








	/* 各ノードにデータの要求 */
	while (true){
		try{
			for (let index in nodelist){
				let address = nodelist[index];

				let broadcast = IO.connect('http://'+address+':'+CONFIG.broadcast["port"]+'/broadcast');

				broadcast.emit('GetNodeList');
				broadcast.emit('GetUnconfirmedTransactions');
				broadcast.emit('GetTransactionIdsPerAll');

				for (let index in MyNodeUnconfirmedTransactions){
					let txid = MyNodeUnconfirmedTransactions[index];
					broadcast.emit('GetTransaction',txid);
				};
				MyNodeUnconfirmedTransactions = [];


				IO.disconnect();
			};
			await MAIN.sleep(1);
		}catch(e){
			console.log(e);
			continue;
		};
	}
}