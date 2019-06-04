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
			timeout:10000,
			async: false,
		}).responseText;

		//console.log(jresult);

		return JSON.parse( jresult );
	};

	getaccount(key,LessIndex=0){
		let args = {
			"function":"getaccount",
			"args":{
				"key":key,
				"LessIndex":LessIndex
			}
		};

		let result = this.post(args);
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

	sendtx(rawtx){
		let args = {
			"function":"sendtx",
			"args":{
				"rawtx":rawtx
			}
		};

		let result = this.post(args);
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
};