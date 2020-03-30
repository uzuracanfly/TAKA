const THENREQUEST = require('then-request');
const HTTP = require('http');
const FS = require('fs');
const CRYPTO = require('crypto');

const HEX = new (require('./hex.js')).HexText();
const CONFIG = require('./config.js');




exports.ChangeMemDatabase = class{
	constructor (address,port,database){
		this.address = address;
		this.port = port;
		this.database = database;
	};


	async SendPostbyjson(url,paras){
		let headers = {
			'Content-Type':'application/json'
		};

		//リクエスト送信
		let res = await (THENREQUEST(
			'POST',
			url, 
			{
				headers: headers,
				json: paras,
				timeout: 5000,
			}
		).getBody('utf8'));
		return JSON.parse(res);
	};


	async add(table,index,data){	
		let result = await this.SendPostbyjson("http://"+this.address+":"+this.port,{"function":"add","args":{"database":this.database,"table":table,"index":index,"data":data}});
		return result;
	}


	async set(table,index,data){
		let result = await this.SendPostbyjson("http://"+this.address+":"+this.port,{"function":"set","args":{"database":this.database,"table":table,"index":index,"data":data}});
		return result;
	}


	async remove(table,index,removeindex=-1,removevalue=null){
		let result = await this.SendPostbyjson("http://"+this.address+":"+this.port,{"function":"remove","args":{"database":this.database,"table":table,"index":index,"removeindex":parseInt(removeindex),"removevalue":removevalue}});
		return result;
	}


	async delete(table,index){
		let result = await this.SendPostbyjson("http://"+this.address+":"+this.port,{"function":"delete","args":{"database":this.database,"table":table,"index":index}});
		return result;
	}


	async get(table,index=""){
		let result = await this.SendPostbyjson("http://"+this.address+":"+this.port,{"function":"get","args":{"database":this.database,"table":table,"index":index}});
		return result;
	}


	async getindexs(table){
		let result = await this.SendPostbyjson("http://"+this.address+":"+this.port,{"function":"getindexs","args":{"database":this.database,"table":table}});
		return result;
	}
};






exports.RunCommit = async function(){


	let transactions = [];

	HTTP.createServer(async function(request, response) {
		try{
			response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});

			if(request.method === 'POST') {
				let postData = "";
				request.on('data', async function(chunk) {
					postData += chunk;
				}).on('end', async function() {
					try{
						postData = JSON.parse(postData);

						if(postData["function"] == "set"){
							let database = postData["args"]["database"];
							let table = postData["args"]["table"];
							let index = postData["args"]["index"];
							let data = postData["args"]["data"];

							let result = [];
							if (data instanceof Array){
								result = data;
							}else{
								result = [data];
							}

							transactions.push({"function":"set","args":{"database":database,"table":table,"index":index,"data":result},"request":request,"response":response});

						};
						if(postData["function"] == "add"){
							let database = postData["args"]["database"];
							let table = postData["args"]["table"];
							let index = postData["args"]["index"];
							let data = postData["args"]["data"];

							transactions.push({"function":"add","args":{"database":database,"table":table,"index":index,"data":data},"request":request,"response":response});

						};
						if(postData["function"] == "remove"){
							let database = postData["args"]["database"];
							let table = postData["args"]["table"];
							let index = postData["args"]["index"];

							let removeindex = -1;
							if ("removeindex" in postData["args"]){
								removeindex = parseInt(postData["args"]["removeindex"]);
							};
							let removevalue = null;
							if ("removevalue" in postData["args"]){
								removevalue = postData["args"]["removevalue"];
							};
							

							transactions.push({"function":"remove","args":{"database":database,"table":table,"index":index,"removeindex":removeindex,"removevalue":removevalue},"request":request,"response":response});

						};
						if(postData["function"] == "delete"){
							let database = postData["args"]["database"];
							let table = postData["args"]["table"];
							let index = postData["args"]["index"];

							transactions.push({"function":"delete","args":{"database":database,"table":table,"index":index},"request":request,"response":response});

						};
						if(postData["function"] == "get"){
							let database = postData["args"]["database"];
							let table = postData["args"]["table"];
							let index = postData["args"]["index"];
							
							transactions.push({"function":"load","args":{"database":database,"table":table,"index":index},"request":request,"response":response});

						};
					}catch(e){
						console.log(e);

						response.writeHead(400, {'Content-Type': 'application/json; charset=utf-8'});
						response.write(JSON.stringify(false));
						response.end();
					}
				});
			};
		}catch(e){
			console.log(e);

			response.writeHead(400, {'Content-Type': 'application/json; charset=utf-8'});
			response.write(JSON.stringify(false));
			response.end();
		}

	}).listen(CONFIG.database["port"], CONFIG.database["address"]);
























	const GetFillZero = function(hex, hexlength){
		let needzeroffill = hexlength-hex.length;
		if (needzeroffill > 0){
			for (var i=needzeroffill;i>0;i--){
				hex = "0" + hex
			};
		};

		return hex;
	};


	const sleep = function(msec){
		return new Promise(function(resolve) {
			setTimeout(function() {resolve()}, 1000*msec);
		})
	}


	const ConversionData = function(array,hex){
		if (array){
			let lencount = array.length;
			lencount = lencount.toString(16);
			hex = GetFillZero(lencount,16);
			
			for (let index in array){
				let per = array[index];

				/*
					00 : str
					01 : hex
					02 : obj
				*/
				//perはすべてhexに変換
				let type;
				if (/^[0-9a-f]{64,}$/.test(per)){
					type = "01";
				}else if (per instanceof Array || per instanceof Object){
					type = "02";
					per = JSON.stringify(per);
					per = HEX.string_to_utf8_hex_string(per);
				}else{
					type = "00";
					per = HEX.string_to_utf8_hex_string(per);
				}

				let perlen = per.length;
				perlen = perlen.toString(16);
				perlen = GetFillZero(perlen,16);


				hex = hex + type + perlen + per;
			}

			return hex;
		}else if (hex){
			function cut(len){
				let cuthex = hex.slice(0,len);
				hex = hex.slice(len);
				return cuthex;
			};


			function VariableCut(lenlen=16){
				let len = parseInt(cut(lenlen),16);

				let cuthex = hex.slice(0,len);
				hex = hex.slice(len);

				return cuthex;
			};

			array = [];
			let lencount = parseInt(cut(16),16);
			for (let index=0;index<lencount;index++){
				let type = cut(2);
				let per = VariableCut(16);

				/*
					00 : str
					01 : hex
					02 : obj
				*/
				//perはすべてhexから各種データに変換
				if (type == "00"){
					per = HEX.utf8_hex_string_to_string(per);
				}
				if (type == "02"){
					per = HEX.utf8_hex_string_to_string(per);
					per = JSON.parse(per);
				}
				array.push(per);
			}

			return array;
		}
	};



	async function load(database,table,index=""){
		while (true){
			try {
				if (!index){
					let result = [];
					let path = "database/"+database+"/"+table+"/";
					let list = FS.readdirSync(path);
					for (let index in list){
						let value = list[index];

						result.push(value.replace(/.json/g, ''));
					}
					return result;
				};


				let path = "database/"+database+"/"+table+"/"+index+".json";
				FS.statSync(path);

				let data = FS.readFileSync(path, 'hex');
				//暗号化必要性
				if ("key" in CONFIG.database && CONFIG.database["key"]){
					data = new CRYPTO.common().GetDecryptedData(CONFIG.database["key"],data);
				};


				if (!data){
					throw new Error("no data");
				}

				data = ConversionData("",data);

				return data;

			}catch(e){
				if (e.code === 'ENOENT') {
					return [];
				} else {
					console.log(e);
					throw e;
				}
			};

			await sleep(1);
		};
	}


	/*
		arg data : array
		save data : hex
	*/
	async function save(database,table,index,data){
		async function CreateDir(path){
			return new Promise(function (resolve, reject) {
				FS.mkdir(path, function (err) {
					if (e) {
						return resolve(false);
					}
					return resolve(true);
				});
			});
		}
		async function CreateFile(path,data,type){
			return new Promise(function (resolve, reject) {
				FS.writeFile(path,data,type, (e) => {
					if (e) {
						return reject(e);
					}
					return resolve(true);
				});
			});
		}

		data = ConversionData(data,"");

		if ("key" in CONFIG.database && CONFIG.database["key"]){
			data = new CRYPTO.common().GetEncryptedData(CONFIG.database["key"],data);
		};

		await CreateDir("database/");
		await CreateDir("database/"+database+"/");
		await CreateDir("database/"+database+"/"+table+"/");
		await CreateFile("database/"+database+"/"+table+"/"+index+".json", data, "hex")

		return true;
	}


	async function Delete(database,table,index){
		FS.unlinkSync("database/"+database+"/"+table+"/"+index+".json");
		return true;
	}


	while (true){
		try{
			if (transactions.length > 0){
				let transaction = transactions[0];

				transactions.shift();

				if (transaction["function"] == "set"){
					await save(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"],transaction["args"]["data"]);

					(transaction["response"]).write(JSON.stringify(true));
					(transaction["response"]).end();
				};
				if (transaction["function"] == "add"){
					let data = await load(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"]);
					data.push(transaction["args"]["data"]);
					await save(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"],data);

					(transaction["response"]).write(JSON.stringify(true));
					(transaction["response"]).end();
				};
				if (transaction["function"] == "remove"){
					let data = await load(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"]);
					if (transaction["args"]["removeindex"] != -1){
						data.splice(transaction["args"]["removeindex"], 1);
					};
					if (transaction["args"]["removevalue"] != null){
						data = data.filter(n => n !== transaction["args"]["removevalue"]);
					};
					await save(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"],data);

					(transaction["response"]).write(JSON.stringify(true));
					(transaction["response"]).end();
				};
				if (transaction["function"] == "delete"){
					await Delete(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"]);

					(transaction["response"]).write(JSON.stringify(true));
					(transaction["response"]).end();
				};
				if (transaction["function"] == "load"){
					let result = await load(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"]);

					(transaction["response"]).write(JSON.stringify(result));
					(transaction["response"]).end();
				}

				delete transaction;
			};
		}catch(e){
			console.log(e);
		}finally{
			await sleep(0.001);
		}
	};

};