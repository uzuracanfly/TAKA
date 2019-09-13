const FS = require('fs');

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

const EXCHANGE = require('./exchange.js');
const ETHCOIND = require('./ETHCoind.js');


//API Server
exports.SetServer = function(){
	let http = require('http');

	http.createServer(async function(request,response) {
		(async () => {

			response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8','Access-Control-Allow-Origin': '*'});


			if(request.method === 'POST') {
				let postData = "";
				request.on('data', function(chunk) {
					postData += chunk;
				}).on('end', async function() {
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
								"privkey":keys["privkey"],
								"pubkey":keys["pubkey"],
								"address":keys["address"],
								"txids":txids,
								"balance":await TargetAccount.GetBalance(undefined,LessIndex),
							}

							response.write(JSON.stringify(callback));
							response.end();
						};



						if (postData["function"] == "getsendamounttoaddress"){
							let key = postData["args"]["key"];
							let toaddress = postData["args"]["toaddress"];

							let LessIndex = 0;
							if ("LessIndex" in postData["args"] && postData["args"]["LessIndex"]){
								LessIndex = postData["args"]["LessIndex"];
							}

							let TargetAccount = new ACCOUNT.account(key);
							let callback = await TargetAccount.GetSendAmountToAddress(undefined,toaddress,LessIndex);

							response.write(JSON.stringify(callback));
							response.end();
						}




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


							if (tag != "pay" && tag != "tagorder" && tag != "tagreward" && tag != "tagaddpermit"){
								let TAGORDERTX = await TRANSACTION.GetTagOrderTx(tag);
								if (TAGORDERTX){
									let TagOrderObjTx = await TAGORDERTX.GetObjTx();

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
									callback["powtarget"] = TagOrderObjData["powtarget"];
									callback["DataMaxSizeInByte"] = TagOrderObjData["DataMaxSizeInByte"];
									callback["FeeToAddress"] = TagOrderObjData["FeeToAddress"];
									callback["FeeAmount"] = TagOrderObjData["FeeAmount"];
									callback["TagPermitAddresss"] = TagPermitAddresss;
								}
							};

							response.write(JSON.stringify(callback));
							response.end();
						};



						if (postData["function"] == "gettx"){
							let txid = postData["args"]["txid"];


							if (!txid){
								response.write(JSON.stringify(false));
								response.end();
								return 0;
							}


							let TargetTransaction = new TRANSACTION.GetTx(txid);
							let rawtx = await TargetTransaction.GetRawTx();
							let objtx = await TargetTransaction.GetObjTx();

							let callback = {
								"rawtx":rawtx,
								"objtx":objtx,
							}

							response.write(JSON.stringify(callback));
							response.end();
						};










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












						if(postData["function"] == "sendtx"){
							let rawtx = postData["args"]["rawtx"];

							if (!rawtx){
								response.write(JSON.stringify(false));
								response.end();
								return 0;
							}

							let TargetTransaction = new TRANSACTION.Transaction(rawtx);
							let result = await TargetTransaction.commit(undefined,true,true);


							response.write(JSON.stringify(result));
							response.end();

						};


















						if (postData["function"] == "sendpaytx"){
							let key = postData["args"]["key"];
							let toaddress = postData["args"]["toaddress"];
							let amount = postData["args"]["amount"];


							if (!key || !toaddress || !amount){
								response.write(JSON.stringify(false));
								response.end();
								return 0;
							}


							let result = TRANSACTION.SendPayTransaction(key,toaddress,amount);


							result.then(function(value){
								response.write(JSON.stringify(value));
								response.end();
							});
						}



						if (postData["function"] == "sendtagrewardtx"){
							let key = postData["args"]["key"];
							let tag = postData["args"]["tag"];
							let amount = postData["args"]["amount"];


							if (!key || !tag || !amount){
								response.write(JSON.stringify(false));
								response.end();
								return 0;
							}


							let result = TRANSACTIONTOOLS_TAGREWARD.SendTagrewardTransaction(key,tag,amount);

							result.then(function(value){
								response.write(JSON.stringify(value));
								response.end();
							});
						}




						if (postData["function"] == "senddatabasetx"){
							let key = postData["args"]["key"];
							let tag = postData["args"]["tag"];
							let data = postData["args"]["data"];

							let commonkey = "";
							if ("commonkey" in postData["args"] && postData["args"]["commonkey"]){
								commonkey = postData["args"]["commonkey"];
							};


							if (!key || !tag || !data){
								response.write(JSON.stringify(false));
								response.end();
								return 0;
							}



							let result = TRANSACTIONTOOLS_DATABASE.SendDatabaseTransaction(key,tag,data,commonkey);

							result.then(function(value){
								response.write(JSON.stringify(value));
								response.end();
							});
						}



						if (postData["function"] == "sendtagordertx"){
							let key = postData["args"]["key"];
							let tag = postData["args"]["tag"];
							let permissiontype = postData["args"]["permissiontype"];

							let powtarget = "0000000000000000000000000000000000000000000000000000000000000000";
							if ("powtarget" in postData["args"] && postData["args"]["powtarget"]){
								powtarget = postData["args"]["powtarget"];
							}

							let DataMaxSizeInByte = 10000;
							if ("DataMaxSizeInByte" in postData["args"] && postData["args"]["DataMaxSizeInByte"]){
								DataMaxSizeInByte = postData["args"]["DataMaxSizeInByte"];
							}

							let FeeToAddress = "";
							if ("FeeToAddress" in postData["args"] && postData["args"]["FeeToAddress"]){
								FeeToAddress = postData["args"]["FeeToAddress"];
							};
							let FeeAmount = 0;
							if ("FeeAmount" in postData["args"] && postData["args"]["FeeAmount"]){
								FeeAmount = postData["args"]["FeeAmount"];
							};

							if (!key || !tag || !permissiontype){
								response.write(JSON.stringify(false));
								response.end();
								return 0;
							}

							let result = TRANSACTIONTOOLS_TAGORDER.SendTagOrderTransaction(key,tag,permissiontype,powtarget,DataMaxSizeInByte,FeeToAddress,FeeAmount);

							result.then(function(value){
								response.write(JSON.stringify(value));
								response.end();
							});
						}



						if (postData["function"] == "sendtagaddpermittx"){
							let key = postData["args"]["key"];
							let tag = postData["args"]["tag"];
							let addaddress = postData["args"]["addaddress"];


							if (!key || !tag || !addaddress){
								response.write(JSON.stringify(false));
								response.end();
								return 0;
							}


							let result = TRANSACTIONTOOLS_TAGADDPERMIT.SendTagAddPermitTransaction(key,tag,addaddress);

							result.then(function(value){
								response.write(JSON.stringify(value));
								response.end();
							});
						}



						if (postData["function"] == "sendsetcontracttransaction"){
							let key = postData["args"]["key"];
							let tag = postData["args"]["tag"];
							let FunctionName = postData["args"]["FunctionName"];
							let CodeType = postData["args"]["CodeType"];
							let CodeData = postData["args"]["CodeData"];
							let CodePath = "";
							if ("CodePath" in postData["args"]){
								CodePath = postData["args"]["CodePath"];
							};


							if (!key || !tag || !FunctionName || !CodeType || !CodeData){
								response.write(JSON.stringify(false));
								response.end();
								return 0;
							}


							let result = TRANSACTIONTOOLS_CONTRACT.SendSetContractTransaction(key,tag,FunctionName,CodeType,CodeData,CodePath);

							result.then(function(value){
								response.write(JSON.stringify(value));
								response.end();
							});
						};



						if (postData["function"] == "sendruncontracttransaction"){
							let key = postData["args"]["key"];
							let tag = postData["args"]["tag"];
							let FunctionName = postData["args"]["FunctionName"];
							let FunctionArgs = postData["args"]["FunctionArgs"];
							let AddAddressIndex = "";
							if ("AddAddressIndex" in postData["args"]){
								AddAddressIndex = postData["args"]["AddAddressIndex"];
							};


							if (!key || !tag || !FunctionName || !FunctionArgs){
								response.write(JSON.stringify(false));
								response.end();
								return 0;
							}


							let result = TRANSACTIONTOOLS_CONTRACT.SendRunContractTransaction(key,tag,FunctionName,FunctionArgs,AddAddressIndex);

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
							let AddressIndexs = [];
							if ("AddressIndexs" in postData["args"]){
								AddressIndexs = postData["args"]["AddressIndexs"];
							};
							let lastonly = false;
							if ("lastonly" in postData["args"]){
								lastonly = postData["args"]["lastonly"];
							};


							if (!address || !tag || !FunctionName || !FunctionArgs){
								response.write(JSON.stringify(false));
								response.end();
								return 0;
							}


							let result = TRANSACTIONTOOLS_CONTRACT.CallRunContractTransaction(address,tag,FunctionName,FunctionArgs,AddressIndexs,lastonly);


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
							let AddressIndexs = [];
							if ("AddressIndexs" in postData["args"]){
								AddressIndexs = postData["args"]["AddressIndexs"];
							};
							let lastonly = false;
							if ("lastonly" in postData["args"]){
								lastonly = postData["args"]["lastonly"];
							};


							if (!address || !tag || !FunctionName || !FunctionArgs){
								response.write(JSON.stringify(false));
								response.end();
								return 0;
							}


							let TargetAccount = new ACCOUNT.account(address);
							let result = TRANSACTIONTOOLS_CONTRACT.RunCode(TargetAccount,tag,FunctionName,FunctionArgs,AddressIndexs,lastonly);


							result.then(function(value){
								response.write(JSON.stringify(value));
								response.end();
							});

						};
















						if (postData["function"] == "exchange"){
							let type = postData["args"]["type"];
							let PayTxid = postData["args"]["PayTxid"];
							let ReceiverAddress = postData["args"]["ReceiverAddress"];
							let amount = postData["args"]["amount"];

							let result = EXCHANGE.SetExchangeOrder(type,PayTxid,ReceiverAddress,amount);

							result.then(function(value){
								response.write(JSON.stringify(value));
								response.end();
							});
						};


					}catch(e){
						MAIN.note(2,"api_SetServer",e);
						response.write(JSON.stringify(false));
						response.end();
					};

				});
			}else{
				let HtmlLib = {
					"form":FS.readFileSync('UI/lib/MessagerLib/form.js'),
					"notification":FS.readFileSync('UI/lib/MessagerLib/notification.js'),
					"basicfunctions":FS.readFileSync('UI/lib/basicfunctions.js'),
					"TAKALibRapper":FS.readFileSync('UI/lib/TAKALibRapper_bundle.js'),
					"ETHCoindRapper":FS.readFileSync('UI/lib/ETHCoindRapper_bundle.js'),
					"TAKAICON":FS.readFileSync('UI/picture/TAKAICON.png'),
					"TAKAICON_NoBackground":FS.readFileSync('UI/picture/TAKAICON_NoBackground.png'),
					"twitter":FS.readFileSync('UI/picture/twitter.png'),
					"github":FS.readFileSync('UI/picture/github.png'),
					"wallet":FS.readFileSync('UI/picture/wallet.png'),
					"search":FS.readFileSync('UI/picture/search.png'),
					"Japan":FS.readFileSync('UI/picture/Japan.png'),
					"United-Kingdom":FS.readFileSync('UI/picture/United-Kingdom.png'),
				};

				let ExplorerHtml = FS.readFileSync('UI/explorer.html');
				let WalletHtml = FS.readFileSync('UI/wallet.html');
				let IntroHtml = FS.readFileSync('UI/intro.html');


				//GETメゾット
				for (let libname in HtmlLib){
					if (request.url == "/lib/"+libname){
						response.writeHead(200, {'Content-Type': 'text/html'});
						response.end(HtmlLib[libname]);
						break;
					};
				}


				if ((request.url).indexOf("/explorer") != -1){
					ExplorerHtml = ExplorerHtml.toString();
					ExplorerHtml = ExplorerHtml.replace( "MYURL", CONFIG.API["AccessPoint"] );
					ExplorerHtml = Buffer.from(ExplorerHtml, 'utf-8');
					response.writeHead(200, {'Content-Type': 'text/html'});
					response.end(ExplorerHtml);
				};
				if ((request.url).indexOf("/wallet") != -1){
					WalletHtml = WalletHtml.toString();
					WalletHtml = WalletHtml.replace( "MYURL", CONFIG.API["AccessPoint"] );
					WalletHtml = WalletHtml.replace( /PAYTAKAADDRESS/g, (await new ACCOUNT.account(CONFIG.API.exchange["TAKAPrivkey"]).GetKeys())["address"] );
					WalletHtml = WalletHtml.replace( /PAYETAKAADDRESS/g, (await new ETHCOIND.ETHCoind(CONFIG.API.exchange["ETHPrivkey"]).GetKeys())["address"] );
					WalletHtml = Buffer.from(WalletHtml, 'utf-8');
					response.writeHead(200, {'Content-Type': 'text/html'});
					response.end(WalletHtml);
				};
				if ((request.url).indexOf("/intro") != -1){
					response.writeHead(200, {'Content-Type': 'text/html'});
					response.end(IntroHtml);
				};
			}
		})();
	}).listen(CONFIG.API["port"], CONFIG.API["address"]);
}