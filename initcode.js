process.on('message', async function(data) {
	try{
		eval(data);
	}catch(e){
		console.log(e);
	}
});
