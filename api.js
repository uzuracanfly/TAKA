const FS = require('fs');

const ACCOUNT = require('./account.js');
const TRANSACTION = require('./transaction.js');
const HASHS = require('./hashs.js');
const TRANSACTIONTOOLS_NEGO = require('./TransactionTools/nego');
const TRANSACTIONTOOLS_DATABASE = require('./TransactionTools/database.js');
const TRANSACTIONTOOLS_TAGORDER = require('./TransactionTools/tagorder.js');
const TRANSACTIONTOOLS_TAGADDPERMIT = require('./TransactionTools/tagaddpermit.js');
const TRANSACTIONTOOLS_CONTRACT = require('./TransactionTools/contract.js');


//API Server
exports.SetServer = function(){
	let http = require('http');

	http.createServer(function(request,response) {

		response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8','Access-Control-Allow-Origin': '*'});


		if(request.method === 'POST') {
			let postData = "";
			request.on('data', function(chunk) {
				postData += chunk;
			}).on('end', function() {
				try{


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

						let TargetAccount = new ACCOUNT.account(key);


						let txids = {};
						let tags = TRANSACTION.GetTags();
						for (let index in tags){
							let tag = tags[index];
							let tagtxs = TargetAccount.GetFormTxList(undefined,tag,LessIndex);
							let TagMerkleRoot = new HASHS.hashs().GetMarkleroot(tagtxs);

							txids[tag] = {
								"txs":tagtxs,
								"MerkleRoot":TagMerkleRoot,
							}
						}

						let callback = {
							"privkey":TargetAccount.GetKeys()["privkey"],
							"pubkey":TargetAccount.GetKeys()["pubkey"],
							"address":TargetAccount.GetKeys()["address"],
							"txids":txids,
							"balance":TargetAccount.GetBalance(undefined,LessIndex),
						}

						response.write(JSON.stringify(callback));
						response.end();
					};




					if(postData["function"] == "gettag"){
						let tag = postData["args"]["tag"];

						if (!tag){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}

						let TagTxids = TRANSACTION.GetTagTxids(tag);

						let callback = {
							"txids":TagTxids,
						}


						if (tag != "pay" && tag != "nego" && TagTxids.length > 0){
							let TagOrderTx = new TRANSACTION.GetTagOrderTx(tag);
							let TagOrderObjTx = TagOrderTx.GetObjTx();

							let TagOrderData = new TRANSACTIONTOOLS_TAGORDER.TagOrderData(TagOrderObjTx["data"]);
							let TagOrderObjData = TagOrderData.GetObjData();

							let ownerpubkey = TagOrderObjTx["pubkey"];
							let OwnerAccount = new ACCOUNT.account(ownerpubkey);

							let TagPermitAddresss = TRANSACTION.GetTagPermitAddresss(tag);

							callback["owner"] = {
								"pubkey":ownerpubkey,
								"address":OwnerAccount.GetKeys()["address"]
							};
							callback["permissiontype"] = TagOrderObjData["permissiontype"];
							callback["powtarget"] = TagPermitAddresss;
						};

						response.write(JSON.stringify(callback));
						response.end();
					};



					if(postData["function"] == "sendtx"){
						let rawtx = postData["args"]["rawtx"];

						if (!rawtx){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}

						let TargetTransaction = new TRANSACTION.Transaction(rawtx);
						let result = TargetTransaction.commit();

						result.then(function(value){
							response.write(JSON.stringify(value));
							response.end();
						});
					};



					if(postData["function"] == "getrawtx"){
						let objtx = postData["args"]["objtx"];

						if (!objtx){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}

						let privkey = "";
						if ("privkey" in postData["args"] && postData["args"]["privkey"]){
							privkey = postData["args"]["privkey"];
						}

						let TargetTransaction = new TRANSACTION.Transaction("",privkey,objtx);
						let result = TargetTransaction.GetRawTx();



						response.write(JSON.stringify(result));
						response.end();
					};



					if (postData["function"] == "sendpaytx"){
						let privkey = postData["args"]["privkey"];
						let toaddress = postData["args"]["toaddress"];
						let amount = postData["args"]["amount"];


						if (!privkey || !toaddress || !amount){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}


						let result = TRANSACTION.SendPayTransaction(privkey,toaddress,amount);


						result.then(function(value){
							response.write(JSON.stringify(value));
							response.end();
						});
					}



					if (postData["function"] == "sendrewardtx"){
						let privkey = postData["args"]["privkey"];
						let tag = postData["args"]["tag"];
						let amount = postData["args"]["amount"];


						if (!privkey || !tag || !amount){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}


						let result = TRANSACTIONTOOLS_NEGO.SendNegoTransaction(privkey,tag,amount);

						result.then(function(value){
							response.write(JSON.stringify(value));
							response.end();
						});
					}



					if (postData["function"] == "gettx"){
						let txid = postData["args"]["txid"];


						if (!txid){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}


						let result = TRANSACTION.GetTx(txid).GetObjTx();

						let callback = {
							"pubkey":result["pubkey"],
							"type":result["type"],
							"time":result["time"],
							"tag":result["tag"],
							"index":result["index"],
							"MerkleRoot":result["MerkleRoot"],
							"toaddress":result["toaddress"],
							"amount":result["amount"],
							"data":result["data"],
							"sig":result["sig"],
							"nonce":result["nonce"],
						}

						response.write(JSON.stringify(callback));
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


						if (!privkey || !tag || !data){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}



						let result = TRANSACTIONTOOLS_DATABASE.SendDatabaseTransaction(privkey,tag,data,commonkey);

						result.then(function(value){
							response.write(JSON.stringify(value));
							response.end();
						});
					}



					if (postData["function"] == "sendtagordertx"){
						let privkey = postData["args"]["privkey"];
						let tag = postData["args"]["tag"];
						let permissiontype = postData["args"]["permissiontype"];

						let powtarget = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
						if ("powtarget" in postData["args"] && postData["args"]["powtarget"]){
							privkey = postData["args"]["privkey"];
						}


						if (!privkey || !tag || !permissiontype){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}

						let result = TRANSACTIONTOOLS_TAGORDER.SendTagOrderTransaction(privkey,tag,permissiontype,powtarget);

						result.then(function(value){
							response.write(JSON.stringify(value));
							response.end();
						});
					}



					if (postData["function"] == "sendtagaddpermittx"){
						let privkey = postData["args"]["privkey"];
						let tag = postData["args"]["tag"];
						let addaddress = postData["args"]["addaddress"];


						if (!privkey || !tag || !addaddress){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}


						let result = TRANSACTIONTOOLS_TAGADDPERMIT.SendTagAddPermitTransaction(privkey,tag,addaddress);

						result.then(function(value){
							response.write(JSON.stringify(value));
							response.end();
						});
					}



					if (postData["function"] == "sendcontractsetfunctiontx"){
						let privkey = postData["args"]["privkey"];
						let tag = postData["args"]["tag"];
						let FunctionName = postData["args"]["FunctionName"];
						let CodeType = postData["args"]["CodeType"];
						let CodeData = postData["args"]["CodeData"];
						let CodePath = "";
						if ("CodePath" in postData["args"]){
							CodePath = postData["args"]["CodePath"];
						};


						if (!privkey || !tag || !FunctionName || !CodeType || !CodeData){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}


						let result = TRANSACTIONTOOLS_CONTRACT.SendContractSetFunctionTransaction(privkey,tag,FunctionName,CodeType,CodeData,CodePath);

						result.then(function(value){
							response.write(JSON.stringify(value));
							response.end();
						});
					};



					if (postData["function"] == "sendcontractrunfunctiontx"){
						let privkey = postData["args"]["privkey"];
						let tag = postData["args"]["tag"];
						let FunctionName = postData["args"]["FunctionName"];
						let FunctionArgs = postData["args"]["FunctionArgs"];


						if (!privkey || !tag || !FunctionName || !FunctionArgs){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}


						let result = TRANSACTIONTOOLS_CONTRACT.SendContractRunFunctionTransaction(privkey,tag,FunctionName,FunctionArgs);

						result.then(function(value){
							response.write(JSON.stringify(value));
							response.end();
						});
					};



					if (postData["function"] == "sendcontractshowfunctiontx"){
						let privkey = postData["args"]["privkey"];
						let tag = postData["args"]["tag"];
						let FunctionName = postData["args"]["FunctionName"];
						let FunctionArgs = postData["args"]["FunctionArgs"];


						if (!privkey || !tag || !FunctionName || !FunctionArgs){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}


						let result = TRANSACTIONTOOLS_CONTRACT.SendContractShowFunctionTransaction(privkey,tag,FunctionName,FunctionArgs);


						response.write(JSON.stringify(result));
						response.end();

					};



				}catch(e){
					console.log(e);
					response.write(JSON.stringify(false));
					response.end();
				};

			});
		}else{
			let HtmlLib = {
				"form":FS.readFileSync('UI/lib/MessagerLib/form.js'),
				"notification":FS.readFileSync('UI/lib/MessagerLib/notification.js'),
				"basicfunctions":FS.readFileSync('UI/lib/basicfunctions.js'),
				"TAKAAPIRapper":FS.readFileSync('UI/lib/TAKAAPIRapper.js'),
			};

			let ExplorerHtml = FS.readFileSync('UI/explorer.html');


			//GETメゾット
			for (let libname in HtmlLib){
				if (request.url == "/lib/"+libname){
					response.writeHead(200, {'Content-Type': 'text/html'});
					response.end(HtmlLib[libname]);
					break;
				};
			}


			if (request.url == "/explorer"){
				response.writeHead(200, {'Content-Type': 'text/html'});
				response.end(ExplorerHtml);
			};
		}

	}).listen(Config.API["port"], Config.API["address"]);
}