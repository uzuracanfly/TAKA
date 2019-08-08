class TAKAAPIRapper{
	constructor (apiaddress,apiport){
		this.apiaddress = apiaddress;
		this.apiport = apiport;
	};

	post(args){
		args = (JSON.stringify(args)).replace( /@/g , "" );

		let jresult = $.ajax({
			url: "http://"+this.apiaddress+":"+this.apiport,
			type:'POST',
			data: args,
			contentType: 'application/json',
			dataType: "json",
			timeout:1000*10,
			async: false,
		}).responseText;

		//console.log(jresult);

		return JSON.parse( jresult );
	};


	PostAsync(args,callback,CallbackArgs){

		args = (JSON.stringify(args)).replace( /@/g , "" );

		let ret = $.ajax({
			url: "http://"+this.apiaddress+":"+this.apiport,
			type:'POST',
			data: args,
			contentType: 'application/json',
			dataType: "json",
			timeout:1000*60*10,
			async: true,
			success: function(CallbackResult){
				callback(CallbackResult,CallbackArgs);
			}
		});

		return ret;
	};


	getaccount(key,LessIndex=0,needs=[],callback="",CallbackArgs=""){
		let args = {
			"function":"getaccount",
			"args":{
				"key":key,
				"LessIndex":LessIndex,
				"needs":needs
			}
		};

		let result;
		if (!callback){
			result = this.post(args);
		}else{
			result = this.PostAsync(args,callback,CallbackArgs);
		};
		return result;
	};


	gettag(tag){
		let args = {
			"function":"gettag",
			"args":{
				"tag":tag,
			}
		};

		let result = this.post(args);
		return result;
	};

	sendtx(rawtx,callback="",CallbackArgs=""){
		let args = {
			"function":"sendtx",
			"args":{
				"rawtx":rawtx
			}
		};

		let result;
		if (!callback){
			result = this.post(args);
		}else{
			result = this.PostAsync(args,callback,CallbackArgs);
		};
		return result;
	}

	getrawtx(objtx,privkey=""){
		let args = {
			"function":"getrawtx",
			"args":{
				"objtx":objtx,
				"privkey":privkey
			}
		};

		let result = this.post(args);
		return result;
	}

	gettx(txid){
		let args = {
			"function":"gettx",
			"args":{
				"txid":txid
			}
		};

		let result = this.post(args);
		return result;
	}

	CallRunContractTransaction(address,tag,FunctionName,FunctionArgs){
		let args = {
			"function":"callruncontracttransaction",
			"args":{
				"address":address,
				"tag":tag,
				"FunctionName":FunctionName,
				"FunctionArgs":FunctionArgs,
			}
		};

		let result = this.post(args);
		return result;
	}


	RunCode(address,tag,FunctionName,FunctionArgs){
		let args = {
			"function":"runcode",
			"args":{
				"address":address,
				"tag":tag,
				"FunctionName":FunctionName,
				"FunctionArgs":FunctionArgs,
			}
		};

		let result = this.post(args);
		return result;
	};
};