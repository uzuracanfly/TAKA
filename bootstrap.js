const FS = require('fs');
const ARCHIVER = require('archiver');
const THENREQUEST = require('then-request');
const UNZIP = require('unzip2');


exports.RunSaveDataBase = async function(){
	const CONFIG = require('./config.js');
	const MAIN = require('./main.js');

	while (true){
		try{
			FS.mkdir("bootstrap/", async function (err) {
				FS.mkdir("database/", async function (err) {
					FS.mkdir(`database/${CONFIG.database["database"]}/`, async function (err) {

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


						let list = FS.readdirSync(`database/${CONFIG.database["database"]}`);
						for (let index in list){
							let value = list[index];

							//ブラックリスト
							if ((["nodelist","TagMiningResult_FoundPrivkey","TagMiningResult_hooray"]).indexOf(value) > -1){
								continue;
							}

							archive.directory(`database/${CONFIG.database["database"]}/${value}`,`${value}`);
						}

						archive.finalize();
					});
				});
		
			});
		}catch(e){
			MAIN.note(2,"RunSaveDataBase",e);
		}

		await MAIN.sleep(60*30);
	}
}







exports.DownloadDataBase = async function(database){
	return new Promise(function(resolve, reject) {
		try{
			let headers = {
				'Content-Type':'application/zip'
			};

			//リクエスト送信
			let ZipData = await (THENREQUEST(
				'GET',
				`https://neko.taka.site/bootstrap`, 
				{
					headers: headers,
				}
			).getBody('hex'));
			FS.mkdir("bootstrap/", function (err) {
				FS.mkdir("database/", function (err) {
					FS.mkdir(`database/${database}/`, function (err) {
						FS.writeFile(`bootstrap/bootstrap.zip`, ZipData, "hex", (error) => {
							FS.createReadStream(`bootstrap/bootstrap.zip`)
							.pipe( UNZIP.Extract({ path: `./database/${database}` }) )
							.on('close', function () {
								return resolve(true);
							});
						});
					});
				});
			});
		}catch(e){
			console.log(e);
			return resolve(false);
		};
	});
};