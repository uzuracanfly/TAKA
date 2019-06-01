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



					//curl http:/cation/json' -d '{"function":"getaccount","args":{"key":"5f2ba01ab3d8c3a418cf0232f83a0cd18e5a8a09"}}'
					if(postData["function"] == "getaccount"){
						let key = "";
						if ("key" in postData["args"] && postData["args"]["key"]){
							key = postData["args"]["key"];
						}

						let LessIndex = 0;
						if ("LessIndex" in postData["args"] && postData["args"]["LessIndex"]){
							LessIndex = postData["args"]["LessIndex"];
						}

						let TargetAccount = new (require('./account.js')).account(key);


						let txstoaccount = {};
						let tags = (require('./transaction.js')).GetTags();
						for (let index in tags){
							let tag = tags[index];
							let tagtxs = TargetAccount.GetFormTxList(undefined,tag,LessIndex);
							let TagMerkleRoot = new (require('./hashs.js')).hashs().GetMarkleroot(tagtxs);

							txstoaccount[tag] = {
								"txs":tagtxs,
								"MerkleRoot":TagMerkleRoot,
							}
						}

						let callback = {
							"privkey":TargetAccount.GetKeys()["privkey"],
							"pubkey":TargetAccount.GetKeys()["pubkey"],
							"address":TargetAccount.GetKeys()["address"],
							"txstoaccount":txstoaccount,
							"balance":TargetAccount.GetBalance(undefined,LessIndex),
						}

						response.write(JSON.stringify(callback));
						response.end();
					};



					if(postData["function"] == "sendtx"){
						let rawtx = postData["args"]["rawtx"];

						let TargetTransaction = new (require('./transaction.js')).Transaction(rawtx);
						TargetTransaction.commit();

						response.write(JSON.stringify(true));
						response.end();
					};



					if(postData["function"] == "getrawtx"){
						let objtx = postData["args"]["objtx"];

						let privkey = "";
						if ("privkey" in postData["args"] && postData["args"]["privkey"]){
							privkey = postData["args"]["privkey"];
						}

						let TargetTransaction = new (require('./transaction.js')).Transaction("",privkey,objtx);
						let result = TargetTransaction.GetRawTx();



						response.write(JSON.stringify(result));
						response.end();
					};



					if (postData["function"] == "sendpaytx"){
						let privkey = postData["args"]["privkey"];
						let toaddress = postData["args"]["toaddress"];
						let amount = postData["args"]["amount"];


						let result = (require('./transaction.js')).SendPayTransaction(privkey,toaddress,amount);


						response.write(JSON.stringify(true));
						response.end();
					}



					if (postData["function"] == "sendrewardtx"){
						let privkey = postData["args"]["privkey"];
						let tag = postData["args"]["tag"];
						let amount = postData["args"]["amount"];

						let result = (require('./TransactionTools/nego.js')).SendNegoTransaction(privkey,tag,amount);

						response.write(JSON.stringify(true));
						response.end();
					}



					if (postData["function"] == "gettx"){
						let txid = postData["args"]["txid"];

						let result = (require('./transaction.js')).GetTx(txid).GetObjTx();

						response.write(JSON.stringify(result));
						response.end();
					};



					if (postData["function"] == "senddatabasetx"){
						let privkey = postData["args"]["privkey"];
						let tag = postData["args"]["tag"];
						let data = postData["args"]["data"];
						
						let commonkey = "";
						if ("commonkey" in postData["args"] && postData["args"]["commonkey"]){
							commonkey = postData["args"]["commonkey"];
						};

						let result = (require('./TransactionTools/database.js')).SendDatabaseTransaction(privkey,tag,data,commonkey);

						response.write(JSON.stringify(true));
						response.end();
					}



					if (postData["function"] == "sendtagordertx"){
						let privkey = postData["args"]["privkey"];
						let tag = postData["args"]["tag"];
						let permissiontype = postData["args"]["permissiontype"];
						let powtarget = postData["args"]["powtarget"];

						let result = (require('./TransactionTools/tagorder.js')).SendTagOrderTransaction(privkey,tag,permissiontype,powtarget);

						response.write(JSON.stringify(true));
						response.end();
					}



					if (postData["function"] == "sendtagaddpermittx"){
						let privkey = postData["args"]["privkey"];
						let tag = postData["args"]["tag"];
						let addaddress = postData["args"]["addaddress"];

						let result = (require('./TransactionTools/tagaddpermit.js')).SendTagAddPermitTransaction(privkey,tag,addaddress);

						response.write(JSON.stringify(true));
						response.end();
					}


				});
			};
		}catch{
			response.write(JSON.stringify(true));
			response.end();
		}

	}).listen(Config.API["port"], Config.API["address"]);
}