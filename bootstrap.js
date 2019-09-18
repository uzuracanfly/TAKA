let FS = require('fs');
let ARCHIVER = require('archiver');
const REQUEST = require('sync-request');
var UNZIP = require('unzip');

const CONFIG = require('./config.js');
const MAIN = require('./main.js');
const BROADCAST = require('./broadcast.js');


exports.RunSaveDataBase = async function(){
	while (true){
		try{
			FS.mkdir("bootstrap/", function (err) {
				let output = FS.createWriteStream(`bootstrap/bootstrap.zip`);
				
				let archive = ARCHIVER('zip', {
					zlib: { level: 9 } // Sets the compression level.
				});

				output.on('end', () => {
					MAIN.note(2,"RunSaveDataBase","Data has been drained");
				}); 
				archive.on('warning', (err) =>  {throw err;});
				archive.on('error',  (err) =>  {throw err;});
				archive.pipe(output);

				archive.directory(`database/${CONFIG.database["database"]}`,`${CONFIG.database["database"]}`);
				archive.finalize();
			});
		}catch(e){
			MAIN.note(2,"RunSaveDataBase",e);
		}

		await MAIN.sleep(60*30);
	}
}





exports.DownloadDataBase = async function(){
	return new Promise(function(resolve, reject) {
		let NodeList = BROADCAST.GetNodeList();

		for (let index in NodeList){
			try{
				let NodeAddress = NodeList[index];

				let headers = {
					'Content-Type':'application/zip'
				};

				//リクエスト送信
				let res = REQUEST(
					'GET',
					`https://${NodeAddress}/bootstrap`, 
					{
						headers: headers,
					}
				);
				let ZipData = res.getBody('hex');
				FS.mkdir("bootstrap/", function (err) {
					FS.writeFile(`bootstrap/bootstrap.zip`, ZipData, "hex", (error) => {
						FS.createReadStream( (`bootstrap/bootstrap.zip` ).pipe( UNZIP.Extract( { path: './database/' } )) );
						return resolve(true);
					});
				});
			}catch(e){
				MAIN.note(1,"DownloadDataBase",e);
				continue;
			}
		};

		return resolve(false);
	});
};