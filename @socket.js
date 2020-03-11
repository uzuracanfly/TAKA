const HTTP = require('http').createServer();
const options = {
	serveClient: false,
	pingTimeout: 120000,
	pingInterval: 60000
	// transports: ['polling']
}
const IO = require('socket.io')(HTTP,options);

const IOC = require('socket.io-client');






async function send(socket,name,args){
	return new Promise(function (resolve, reject) {
		socket.on(`${name}_return`, async function (data) {
			return resolve(data);
		});
		socket.emit(`${name}`,args);
	});
}







async function SetClient(){
	let socket = IOC(`http://127.0.0.1:1000`);

	console.log(await send(socket,"test",{}));
	console.log(await send(socket,"test",{}));
	console.log(await send(socket,"test",{}));
	console.log(await send(socket,"test",{}));
	console.log(await send(socket,"test",{}));
}




async function SetServer(){
	IO.on('connection', async function(socket){
		socket.on("test", async function (data) {
			socket.emit(`test_return`,{"test":"test"});
		});
	});

	HTTP.listen(1000);
}


(async () => {
	await SetServer();
	SetClient();
})();