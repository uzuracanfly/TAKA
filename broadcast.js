const CONFIG = require('./config.js');
const HTTP = require('http');
const SYNCREQUEST = require('sync-request');
const MAIN = require('./main.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);


exports.SetServer = function(){
	HTTP.createServer(function(request, response) {
		try{
			response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});


			if(request.method === 'POST') {
				let postData = "";
				request.on('data', function(chunk) {
					postData += chunk;
				}).on('end', function() {


					postData = JSON.parse(postData);

					if(postData["function"] == "GetNodelist"){
						let nodelist = DATABASE.get("nodelist","live");

						response.write(JSON.stringify(nodelist));
						response.end();
					};
					if(postData["function"] == "GetConfirmedTransactionIds"){
						let txlist = DATABASE.get("TransactionIdsPerAll","live");

						response.write(JSON.stringify(txlist));
						response.end();
					};
					if(postData["function"] == "GetTransaction"){
						let txs = DATABASE.get("ConfirmedTransactions",postData["args"]["txid"]);

						response.write(JSON.stringify(txs[0]));
						response.end();
					};
					if(postData["function"] == "GetUnConfirmedTransactions"){
						let txs = [];
						let tags = DATABASE.get("UnconfirmedTransactions");
						for (let index in tags){
							let tag = tags[index];

							let rawtx = DATABASE.get("UnconfirmedTransactions",tag);

							txs.push(rawtx);
						};

						response.write(JSON.stringify(txs));
						response.end();
					};


				});
			};
		}catch{
			response.write(JSON.stringify(true));
			response.end();
		};

	}).listen(CONFIG.broadcast["port"], CONFIG.broadcast["address"]);
}



exports.RunScanning = function(){
	function SendPostbyjson(url,paras){
		let headers = {
			'Content-Type':'application/json'
		};

		//リクエスト送信
		let res = SYNCREQUEST(
			'POST',
			url, 
			{
				headers: headers,
				json: paras,
			}
		);
		return JSON.parse(res.getBody('utf8'));
	};


	let nodelist = DATABASE.get("nodelist","live");
	if (nodelist.length == 0){
		nodelist = CONFIG.broadcast["seed"];
	}


	for (let index in nodelist){
		let address = nodelist[index];
		/* 未承認のトランザクション追加 */
		let rawtxlist = SendPostbyjson("http://"+address+":"+CONFIG.broadcast["port"],{"function":"GetUnConfirmedTransactions"});
		for (let mindex in rawtxlist){
			let rawtx = txidlist[mindex];

			new (require('./transaction.js')).Transaction().commit(rawtx);
		};


		/* トランザクションを走査そして追加 */
		let txidlist = SendPostbyjson("http://"+address+":"+CONFIG.broadcast["port"],{"function":"GetConfirmedTransactionIds"});
		for (let mindex in txidlist){
			let txid = txidlist[mindex];

			let rawtx = SendPostbyjson("http://"+address+":"+CONFIG.broadcast["port"],{"function":"GetTransaction","args":{"txid":txid}});
			new (require('./transaction.js')).Transaction().commit(rawtx);
		};


		/* ノード追加 */
		let savenodelist = SendPostbyjson("http://"+address+":"+CONFIG.broadcast["port"],{"function":"GetNodelist"});
		for (let mindex in savenodelist){
			let saveaddress = savenodelist[mindex];

			MAIN.note(1,"broadcast_RunScanning_addnode",saveaddress);

			let nodelist = DATABASE.add("nodelist","live",saveaddress);
		};
	}
}