const FS = require('fs');
const SR = require('secure-random');
const IP = require('ip');
const CP = require('child_process');
const PATH = require('path');


const MAIN = require('./main.js');
const CRYPTO = require('./crypto.js');
const BOOTSTRAP = require('./bootstrap.js');

(async () => {
	try{
		const CONFIG = require('./config.js');
	}catch(e){
		console.log("None Config!Setup Config!"+" : "+e);

		/*
			Configの設定
		*/
		let API_ADDRESS = await MAIN.GetConsole("[API] Use Address (0.0.0.0) : ");
		if (!API_ADDRESS){
			API_ADDRESS = "0.0.0.0";
		};
		let API_PORT = await MAIN.GetConsole("[API] Use Port (80) : ");
		if (!API_PORT){
			API_PORT = "80";
		};
		let API_ACCESSPOINT = await MAIN.GetConsole("[API] ACCESS POINT TO API (http://127.0.0.1) : ");
		if (!API_ACCESSPOINT){
			API_ACCESSPOINT = "http://"+IP.address()+":"+API_PORT;
		};


		let IMPORTTAGS = await MAIN.GetConsole('[ImportTags] ([]) : ');
		if (!IMPORTTAGS){
			IMPORTTAGS = "[]";
		};


		let TAGREWARD_MININGTAGS = await MAIN.GetConsole('[TagReward] Mining Tags ([]) : ');
		if (!TAGREWARD_MININGTAGS){
			TAGREWARD_MININGTAGS = "[]";
		};
		let TAGREWARD_COLLECTPRIVKEY = await MAIN.GetConsole('[TagReward] Collect Privkey () : ');
		if (!TAGREWARD_COLLECTPRIVKEY){
			TAGREWARD_COLLECTPRIVKEY = await new CRYPTO.signature().CreatePrivkey();
		}
		let TAGREWARD_CONTROLTAG = await MAIN.GetConsole('[TagReward] Use Control Tag (false) : ');
		if (!TAGREWARD_CONTROLTAG){
			TAGREWARD_CONTROLTAG = false;
		};



		let BOOTSTRAP_BOOL = await MAIN.GetConsole('[bootstrap] Use bootstrap(download the database from the other node.) (true) : ');
		if (!BOOTSTRAP_BOOL){
			BOOTSTRAP_BOOL = true;
		};



		if (BOOTSTRAP_BOOL != "false"){
			console.log("bootstrap downloading.....");
			let result = await BOOTSTRAP.DownloadDataBase("TAKA");
			if (result){
				console.log("done.");
			}else{
				console.log("error.");
			}
		}



		let ConfigData = FS.readFileSync("./config_sample.js", 'utf8');
		ConfigData = ConfigData.replace( 'API_ADDRESS', '"'+API_ADDRESS+'"' );
		ConfigData = ConfigData.replace( 'API_PORT', API_PORT );
		ConfigData = ConfigData.replace( 'API_ACCESSPOINT', '"'+API_ACCESSPOINT+'"' );

		ConfigData = ConfigData.replace( 'IMPORTTAGS', IMPORTTAGS );

		ConfigData = ConfigData.replace( 'TAGREWARD_MININGTAGS', TAGREWARD_MININGTAGS );
		ConfigData = ConfigData.replace( 'TAGREWARD_COLLECTPRIVKEY', '"'+TAGREWARD_COLLECTPRIVKEY+'"' );
		ConfigData = ConfigData.replace( 'TAGREWARD_CONTROLTAG', TAGREWARD_CONTROLTAG );

		FS.writeFile("./config.js", ConfigData, "utf8", (e) => {
			if (e) {
				console.log(e);
				throw e;
			}

			console.log("Done!Restart please!");
			process.exit(0);
		});
		return 1;
	}





	let FunctionList = [
		{"name":"DatabaseRunCommit","function":"let Database = require('./database.js');Database.RunCommit()","time":0},
		{"name":"TransactionRunCommit","function":"let Transaction = require('./transaction.js');Transaction.RunCommit()","time":1000},
		{"name":"BroadcastSetServer","function":"let Broadcast = require('./broadcast.js');Broadcast.SetServer()","time":1000},
		{"name":"BroadcastSetClient","function":"let Broadcast = require('./broadcast.js');Broadcast.SetClient()","time":1100},
		{"name":"APISetServer","function":"let API = require('./api.js');API.SetServer()","time":1000},
		{"name":"TagrewardRunMining","function":"let Tagreward = require('./TransactionTools/tagreward.js');Tagreward.RunMining()","time":1000},
		{"name":"exchange","function":"let EXCHANGE = require('./exchange.js');EXCHANGE.RunExchangeScan()","time":1000},
		{"name":"ControlTag","function":"let Tagreward = require('./TransactionTools/tagreward.js');Tagreward.RunControlTag()","time":1000},
		{"name":"bootstrap","function":"let BOOTSTRAP = require('./bootstrap.js');BOOTSTRAP.RunSaveDataBase()","time":1000},
		{
			"name":"TEST",
			"function":"\
				const FS = require('fs');\
				FS.stat('./test.js', (error, stats) => {\
					if (!error) {\
						let TEST = require('./test.js');\
						TEST.main();\
					}\
				})\
			",
			"time":2000
		},
	];



	
	for (let index in FunctionList) {
		let FunctionData = FunctionList[index];

		new Promise(async function (resolve, reject) {
			await MAIN.sleep(parseInt(FunctionData["time"]/1000));

			let child = CP.fork(`initcode.js`);
			child.send(FunctionData["function"]);
			child.on('error', (code) => {
				console.log(`[ERROR]`);
				console.log(code);
			});
			child.on('close', (code) => {
				console.log(`[END]`);
				console.log(code);
			});
			child.on('exit', (code) => {
				console.log(`[END]`);
				console.log(code);
			});
		});
	}
})();