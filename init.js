const CLUSTER = require('cluster');
const FS = require('fs');
const SR = require('secure-random');
const IP = require('ip');
const {
	Worker, isMainThread, parentPort, workerData, threadId
} = require('worker_threads');


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
	}





	let FunctionList = [
		{"name":"DatabaseRunCommit","function":function(){let Database = require('./database.js');Database.RunCommit()},"time":0},
		{"name":"TransactionRunCommit","function":function(){let Transaction = require('./transaction.js');Transaction.RunCommit()},"time":1000},
		{"name":"BroadcastSetServer","function":function(){let Broadcast = require('./broadcast.js');Broadcast.SetP2P()},"time":1000},
		{"name":"APISetServer","function":function(){let API = require('./api.js');API.SetServer()},"time":1000},
		{"name":"TagrewardRunMining","function":function(){let Tagreward = require('./TransactionTools/tagreward.js');Tagreward.RunMining()},"time":1000},
		{"name":"exchange","function":function(){let EXCHANGE = require('./exchange.js');EXCHANGE.RunExchangeScan()},"time":1000},
		{"name":"ControlTag","function":function(){let Tagreward = require('./TransactionTools/tagreward.js');Tagreward.RunControlTag()},"time":1000},
		{"name":"bootstrap","function":function(){let BOOTSTRAP = require('./bootstrap.js');BOOTSTRAP.RunSaveDataBase()},"time":1000},
		{
			"name":"TEST",
			"function":function(){
				FS.stat('./test.js', (error, stats) => {
					if (!error) {
						let TEST = require('./test.js');
						TEST.main();
					}
				})
			},
			"time":2000
		},
	];

	if (isMainThread) {
		for (let index in FunctionList) {
			const worker = new Worker(__filename);

			worker.on('error', (err) => {
				MAIN.note(3,"init",err);
			});
			worker.on('exit', (code) => {
				MAIN.note(1,"init",`Worker died`);
			});
		};
	} else {

		await MAIN.sleep(FunctionList[threadId-1]["time"] / 1000);

		FunctionList[threadId-1]["function"]();

		MAIN.note(1,"init",`Worker ${process.pid} to ${FunctionList[threadId-1]["name"]} started`);
	}
})();