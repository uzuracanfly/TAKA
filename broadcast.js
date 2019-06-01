exports.SetServer = function(){
	let http = require('http');

	http.createServer(function(request, response) {
		try{
			response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});


			if(request.method === 'POST') {
				let postData = "";
				request.on('data', function(chunk) {
					postData += chunk;
				}).on('end', function() {


					postData = JSON.parse(postData);

					if(postData["function"] == "GetNodelist"){
						let nodelist = database.get("nodelist","live");

						response.write(JSON.stringify(nodelist));
						response.end();
					};
					if(postData["function"] == "GetConfirmedTransactionIds"){
						let txlist = database.get("TransactionIdsPerAll","live");

						response.write(JSON.stringify(txlist));
						response.end();
					};
					if(postData["function"] == "GetTransaction"){
						let txs = database.get("ConfirmedTransactions",postData["args"]["txid"]);

						response.write(JSON.stringify(txs[0]));
						response.end();
					};
					if(postData["function"] == "GetUnConfirmedTransactions"){
						let txs = [];
						let tags = database.get("UnconfirmedTransactions");
						for (let index in tags){
							let tag = tags[index];

							let rawtx = database.get("UnconfirmedTransactions",tag);

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

	}).listen(Config.broadcast["port"], Config.broadcast["address"]);
}



exports.RunScanning = function(){
	let request = require('sync-request');
	let main = require('./main.js');
	let database = new (require('./database.js')).ChangeMemDatabase(Config.database["address"],Config.database["port"],Config.database["database"]);


	function SendPostbyjson(url,paras){
		let headers = {
			'Content-Type':'application/json'
		};

		//リクエスト送信
		let res = request(
			'POST',
			url, 
			{
				headers: headers,
				json: paras,
			}
		);
		return JSON.parse(res.getBody('utf8'));
	};


	let nodelist = database.get("nodelist","live");
	if (nodelist.length == 0){
		nodelist = Config.broadcast["seed"];
	}


	for (let index in nodelist){
		let address = nodelist[index];
		/* 未承認のトランザクション追加 */
		let rawtxlist = SendPostbyjson("http://"+address+":"+Config.broadcast["port"],{"function":"GetUnConfirmedTransactions"});
		for (let mindex in rawtxlist){
			let rawtx = txidlist[mindex];

			new (require('./transaction.js')).Transaction().commit(rawtx);
		};


		/* トランザクションを走査そして追加 */
		let txidlist = SendPostbyjson("http://"+address+":"+Config.broadcast["port"],{"function":"GetConfirmedTransactionIds"});
		for (let mindex in txidlist){
			let txid = txidlist[mindex];

			let rawtx = SendPostbyjson("http://"+address+":"+Config.broadcast["port"],{"function":"GetTransaction","args":{"txid":txid}});
			new (require('./transaction.js')).Transaction().commit(rawtx);
		};


		/* ノード追加 */
		let savenodelist = SendPostbyjson("http://"+address+":"+Config.broadcast["port"],{"function":"GetNodelist"});
		for (let mindex in savenodelist){
			let saveaddress = savenodelist[mindex];

			main.note(1,"broadcast_RunScanning_addnode",saveaddress);

			let nodelist = database.add("nodelist","live",saveaddress);
		};
	}
}