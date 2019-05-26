//API Server
exports.SetServer = function(){
	let http = require('http');

	http.createServer(function(request, response) {
		try{

			response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8','Access-Control-Allow-Origin': '*'});


			if(request.method === 'POST') {
				let postData = "";
				request.on('data', function(chunk) {
					postData += chunk;
				}).on('end', function() {


					postData = JSON.parse(postData);

					//curl http:/cation/json' -d '{"function":"getaccount","args":{"address":"5f2ba01ab3d8c3a418cf0232f83a0cd18e5a8a09"}}'
					if(postData["function"] == "getaccount"){
						let address = postData["args"]["address"];

						let LessIndex = 0;
						if ("LessIndex" in postData["args"] && postData["args"]["LessIndex"]){
							LessIndex = postData["args"]["LessIndex"];
						}

						let TargetAccount = new (require('./account.js')).account("","",address);

						let txs = TargetAccount.GetFormTxList(address,LessIndex);
						let MerkleRoot = new (require('./hashs.js')).hashs().GetMarkleroot(txs);

						let callback = {
							"txs":txs,
							"MerkleRoot":MerkleRoot,
							"balance":TargetAccount.GetBalance(address,LessIndex),
						}

						response.write(JSON.stringify(callback));
						response.end();
					};

					if(postData["function"] == "sendtx"){
						let signtx = postData["args"]["signtx"];

						let TargetTransaction = new (require('./transaction.js')).Transaction(signtx);
						TargetTransaction.commit();

						response.write(JSON.stringify(true));
						response.end();
					};

					if(postData["function"] == "sendobjtx"){
						let objtx = postData["args"]["objtx"];

						let privkey = "";
						if ("privkey" in postData["args"] && postData["args"]["privkey"]){
							privkey = postData["args"]["privkey"];
						}

						let TargetTransaction = new (require('./transaction.js')).Transaction("",privkey,objtx);
						let result = TargetTransaction.commit();



						response.write(JSON.stringify(result));
						response.end();
					};

				});
			};
		}catch{
			response.write(JSON.stringify(true));
			response.end();
		}

	}).listen(Config.API["port"], Config.API["address"]);
}