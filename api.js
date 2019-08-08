const FS = require('fs');
const IP = require("ip");

const CONFIG = require('./config.js');
const MAIN = require('./main.js');
const ACCOUNT = require('./account.js');
const TRANSACTION = require('./transaction.js');
const HASHS = require('./hashs.js');
const TRANSACTIONTOOLS_TAGREWARD = require('./TransactionTools/tagreward');
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
			}).on('end', async function() {
				try{


					postData = JSON.parse(postData);




					/*
					サーバー管理関連コマンド
					*/
					if(postData["function"] == "getimporttag"){
						let callback = await TRANSACTION.GetImportTags();

						response.write(JSON.stringify(callback));
						response.end();
					};
					if(postData["function"] == "setimporttag"){
						let type = postData["args"]["type"];
						let tag = postData["args"]["tag"];

						let callback = await TRANSACTION.SetImportTags(type,tag);

						response.write(JSON.stringify(callback));
						response.end();
					};
					if(postData["function"] == "getminingtags"){
						let callback = await TRANSACTIONTOOLS_TAGREWARD.GetMiningTags();

						response.write(JSON.stringify(callback));
						response.end();
					};
					if(postData["function"] == "setminingtags"){
						let type = postData["args"]["type"];
						let tag = postData["args"]["tag"];

						let callback = await TRANSACTIONTOOLS_TAGREWARD.SetMiningTags(type,tag);

						response.write(JSON.stringify(callback));
						response.end();
					};


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
						let needs = [];
						if ("needs" in postData["args"] && postData["args"]["needs"]){
							needs = postData["args"]["needs"];
						}

						let TargetAccount = new ACCOUNT.account(key);
						let keys = await TargetAccount.GetKeys();


						let txids = {};
						let tags = TRANSACTION.GetTags();
						for (let index in tags){
							let tag = tags[index];
							let tagtxs = await TargetAccount.GetFormTxList(undefined,tag,LessIndex);
							let TagMerkleRoot = new HASHS.hashs().GetMarkleroot(tagtxs);

							txids[tag] = {
								"txs":tagtxs,
								"MerkleRoot":TagMerkleRoot,
							}
						}

						let callback = {
							"MinPrivkey":keys["MinPrivkey"],
							"address":keys["address"],
							"balance":await TargetAccount.GetBalance(undefined,LessIndex),
						}


						if (needs.indexOf("privkey") >= 0){
							callback["privkey"] = keys["privkey"];
						};
						if (needs.indexOf("pubkey") >= 0){
							callback["pubkey"] = keys["pubkey"];
						};
						if (needs.indexOf("txids") >= 0){
							callback["txids"] = txids;
						};

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
						let TagMerkleRoot = new HASHS.hashs().GetMarkleroot(TagTxids);

						let callback = {
							"txids":TagTxids,
							"MerkleRoot":TagMerkleRoot,
						}


						if (tag != "pay" && tag != "tagreward" && TagTxids.length > 0){
							let TagOrderTx = await TRANSACTION.GetTagOrderTx(tag);
							let TagOrderObjTx = await TagOrderTx.GetObjTx();

							let TagOrderData = new TRANSACTIONTOOLS_TAGORDER.TagOrderData(TagOrderObjTx["data"]);
							let TagOrderObjData = TagOrderData.GetObjData();

							let ownerpubkey = TagOrderObjTx["pubkey"];
							let OwnerAccount = new ACCOUNT.account(ownerpubkey);

							let TagPermitAddresss = await TRANSACTION.GetTagPermitAddresss(tag);

							callback["owner"] = {
								"pubkey":ownerpubkey,
								"address":(await OwnerAccount.GetKeys())["address"]
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
						let result = await TargetTransaction.commit();


						response.write(JSON.stringify(result));
						response.end();

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
						let result = await TargetTransaction.GetRawTx();



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



					if (postData["function"] == "sendtagrewardtx"){
						let privkey = postData["args"]["privkey"];
						let tag = postData["args"]["tag"];
						let amount = postData["args"]["amount"];


						if (!privkey || !tag || !amount){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}


						let result = TRANSACTIONTOOLS_TAGREWARD.SendTagrewardTransaction(privkey,tag,amount);

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


						let result = await TRANSACTION.GetTx(txid).GetObjTx();

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

						let powtarget = "0000000000000000000000000000000000000000000000000000000000000000";
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



					if (postData["function"] == "sendsetcontracttransaction"){
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


						let result = TRANSACTIONTOOLS_CONTRACT.SendSetContractTransaction(privkey,tag,FunctionName,CodeType,CodeData,CodePath);

						result.then(function(value){
							response.write(JSON.stringify(value));
							response.end();
						});
					};



					if (postData["function"] == "sendruncontracttransaction"){
						let privkey = postData["args"]["privkey"];
						let tag = postData["args"]["tag"];
						let FunctionName = postData["args"]["FunctionName"];
						let FunctionArgs = postData["args"]["FunctionArgs"];


						if (!privkey || !tag || !FunctionName || !FunctionArgs){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}


						let result = TRANSACTIONTOOLS_CONTRACT.SendRunContractTransaction(privkey,tag,FunctionName,FunctionArgs);

						result.then(function(value){
							response.write(JSON.stringify(value));
							response.end();
						});
					};



					if (postData["function"] == "callruncontracttransaction"){
						let address = postData["args"]["address"];
						let tag = postData["args"]["tag"];
						let FunctionName = postData["args"]["FunctionName"];
						let FunctionArgs = postData["args"]["FunctionArgs"];


						if (!address || !tag || !FunctionName || !FunctionArgs){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}


						let result = TRANSACTIONTOOLS_CONTRACT.CallRunContractTransaction(address,tag,FunctionName,FunctionArgs);


						result.then(function(value){
							response.write(JSON.stringify(value));
							response.end();
						});

					};



					if (postData["function"] == "runcode"){
						let address = postData["args"]["address"];
						let tag = postData["args"]["tag"];
						let FunctionName = postData["args"]["FunctionName"];
						let FunctionArgs = postData["args"]["FunctionArgs"];


						if (!address || !tag || !FunctionName || !FunctionArgs){
							response.write(JSON.stringify(false));
							response.end();
							return 0;
						}


						let TargetAccount = new ACCOUNT.account(address);
						let result = TRANSACTIONTOOLS_CONTRACT.RunCode(TargetAccount,tag,FunctionName,FunctionArgs);


						result.then(function(value){
							response.write(JSON.stringify(value));
							response.end();
						});

					};


				}catch(e){
					MAIN.note(2,"SetServer",e);
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
				"TAKALIBRapper":FS.readFileSync('UI/lib/TAKALIBRapper_bundle.js'),
			};

			let ExplorerHtml = FS.readFileSync('UI/explorer.html');
			let WalletHtml = FS.readFileSync('UI/wallet.html');


			//GETメゾット
			for (let libname in HtmlLib){
				if (request.url == "/lib/"+libname){
					response.writeHead(200, {'Content-Type': 'text/html'});
					response.end(HtmlLib[libname]);
					break;
				};
			}


			if (request.url == "/explorer"){
				ExplorerHtml = ExplorerHtml.toString();
				ExplorerHtml = ExplorerHtml.replace( "MYIPADDRESS", IP.address() );
				ExplorerHtml = ExplorerHtml.replace( "MYPORT", CONFIG.API["port"] );
				ExplorerHtml = Buffer.from(ExplorerHtml, 'utf-8');
				response.writeHead(200, {'Content-Type': 'text/html'});
				response.end(ExplorerHtml);
			};
			if (request.url == "/wallet"){
				WalletHtml = WalletHtml.toString();
				WalletHtml = WalletHtml.replace( "MYIPADDRESS", IP.address() );
				WalletHtml = WalletHtml.replace( "MYPORT", CONFIG.API["port"] );
				WalletHtml = Buffer.from(WalletHtml, 'utf-8');
				response.writeHead(200, {'Content-Type': 'text/html'});
				response.end(WalletHtml);
			};
		}

	}).listen(CONFIG.API["port"], CONFIG.API["address"]);
}