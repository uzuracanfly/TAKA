class notification {
	constructor (){
		this.notificationOuter=element(
			{
				"name":"notificationOuter",
				"type":"div",
				"attachele":document.body,
				"width":"100%",
				"height":"100px",
				"color":"rgba(0,0,0,1)",
				"backgroundColor":"rgba(255,127,0,0.5)",
				"display":"none",
				"zIndex":"999",
				"position":"fixed",
				"bottom":"0px",
				"right":"0px",
				"margin":"auto",
			}
		);
		this.notificationInner=element(
			{
				"name":"notificationInner",
				"type":"div",
				"attachele":this.notificationOuter,
				"width":"100%",
				"maxWidth":"1024px",
				"height":"50%",
				"position":"absolute",
				"top":"0px",
				"bottom":"0px",
				"left":"0px",
				"right":"0px",
				"margin":"auto",
				"overflow":"auto",
				"wordBreak":"break-all",
				"textAlign":"center",
				"fontSize":"20px",
			}
		);
		this.notificationClose=element(
			{
				"name":"notificationClose",
				"type":"div",
				"attachele":this.notificationOuter,
				"textAlign":"center",
				"fontSize":"30px",
				"float":"right",
				"innerHTML":"×",
				"clickfunction":function(){
					document.getElementById("notificationOuter").style.display="none";
				}
			}
		);

		this.notificationWaiting = [];

		setTimeout(this.notificationPrint(),1000);
	};



	/*
	メッセージボックス表示
	notification(
		[
			["text","testtest"],
			["input","printname","valuename"],
			["select",selectname,[["printname","valuename"],["printname","valuename"]]],
			["button","Done!",function(){}],
			["locations","X","Y"]
		],
		"news",
	)

	type
	news : 即時表示されるが10秒待機
	get : すぐに表示しすぐにきえる
	*/
	notification(para,type)
	{
		if (!para){
			this.notificationWaiting = [];
			this.notificationInner.innerHTML = "";
			this.notificationOuter.style.display="none";
			return 1;
		};

		Array.prototype.push.apply(this.notificationWaiting,[[para,type]])
		return 1;
	};


	notificationPrint()
	{

		this.notificationInner.innerHTML = "";

		/* paraの有無 */
		if (this.notificationWaiting.length > 0){

			let para = this.notificationWaiting[0][0];
			let type = this.notificationWaiting[0][1];

			/* paraから表示する内容を表示 */
			for (let index in para){
				let paradata = para[index];

				if (paradata[0] == "title"){
					let text = element(
						{
							"name":"title"+index,
							"attachele":this.notificationInner,
							"type":"h1",
							"width":"100%",
							"textAlign":"center",
						}
					);
					text.innerHTML = paradata[1];
				};
				if (paradata[0] == "head"){
					let text = element(
						{
							"name":"head"+index,
							"attachele":this.notificationInner,
							"type":"h2",
							"width":"100%",
							"textAlign":"center",
						}
					);
					text.innerHTML = paradata[1];
				};
				if (paradata[0] == "text"){
					let text = element(
						{
							"name":"text"+index,
							"attachele":this.notificationInner,
							"type":"div",
							"width":"100%",
							"textAlign":"center",
						}
					);
					text.innerHTML = paradata[1];
				};
				if (paradata[0] == "input"){
					inputprintname = paradata[1];
					inputvaluename = paradata[2];
					let inputele = element(
						{
							"name":inputvaluename,
							"attachele":this.notificationInner,
							"type":"input",
							"placeholder":inputprintname,
							"width":"100%",
							"textAlign":"center",
						}
					);
				};
				if (paradata[0] == "time"){
					date = paradata[1];
					elename = paradata[2];

					let YY = date.getYear();
					let MM = date.getMonth() + 1;
					let DD = date.getDate();
					let hh = date.getHours();
					let mm = date.getMinutes();
					let ss = date.getSeconds();
					if (YY < 2000) { YY += 1900; }
					if (MM < 10) { MM = "0" + MM; }
					if (DD < 10) { DD = "0" + DD; }
					if (hh < 10) { hh = "0" + hh; }
					if (mm < 10) { mm = "0" + mm; }
					if (ss < 10) { ss = "0" + ss; }
					data_text = YY + "-" + MM + "-" + DD + "T" + hh + ":" + mm + ":" +ss;

					let inputele = element(
						{
							"name":elename,
							"attachele":this.notificationInner,
							"type":"input",
							"width":"100%",
							"textAlign":"center",
						}
					);
					inputele.type = "datetime-local";
					inputele.value = data_text;
				};
				if (paradata[0] == "textblog"){
					inputprintname = paradata[1];
					inputvaluename = paradata[2];
					let inputele = element(
						{
							"name":inputvaluename,
							"attachele":this.notificationInner,
							"type":"textarea",
							"placeholder":inputprintname,
							"width":"100%",
							"textAlign":"center",
							"margin":"10 auto",
							"height":"300px",
						}
					);
				};
				if (paradata[0] == "select"){
					selectname = paradata[1];
					selectlist = paradata[2];
					let selectele = element(
						{
							"name":selectname,
							"attachele":this.notificationInner,
							"type":"select",
							"width":"100%",
							"textAlign":"center",
						}
					);

					/* 選択を追加する */
					for (let mindex in selectlist){
						let selectdata = selectlist[mindex];

						selectele.options[mindex] = new Option(selectdata[0], selectdata[1]);
					};
				};
				if (paradata[0] == "button"){
					let buttonname = paradata[1];
					let buttonfunction = paradata[2];

					let buttonele = element(
						{
							"name":buttonname,
							"attachele":this.notificationInner,
							"type":"input",
							"value":buttonname,
							"clickfunction":buttonfunction,
							"width":"100%",
							"textAlign":"center",
						}
					);
					buttonele.type = "button";
				};
				if (paradata[0] == "locations"){
					let map = element(
						{
							"name":"map"+index,
							"attachele":this.notificationInner,
							"type":"div",
							"width":"100%",
							"height":"700px",
						}
					);
					let ymap = new Y.Map(
						"map"+index,
						{
							configure : {
								doubleClickZoom : true,
								scrollWheelZoom : true,
								singleClickPan : true,
								dragging : true
							}
						}
					);
					ymap.drawMap(new Y.LatLng(paradata[1], paradata[2]), 17, Y.LayerSetId.NORMAL);
					let marker = new Y.Marker(new Y.LatLng(paradata[1], paradata[2]));
					ymap.addFeature(marker);
				};
				if (paradata[0] == "img"){
					let src = paradata[1];

					let img = element(
						{
							"name":"img"+index,
							"attachele":this.notificationInner,
							"type":"img",
							"width":"100%",
							"textAlign":"center",
						}
					);
					img.src = src;
				};
				if (paradata[0] == "file"){
					let name = paradata[1];

					let fileele = element(
						{
							"name":"fileele",
							"attachele":this.notificationInner,
							"type":"input",
							"width":"100%",
							"textAlign":"center",
						}
					);
					fileele.type = "file";

					let filecache = element(
						{
							"name":name,
							"attachele":this.notificationInner,
							"type":"input",
							"height":"100%",
							"textAlign":"center",
							"display":"none",
						}
					);


					fileele.addEventListener("change", function(evt){
						let file = evt.target.files;
						let reader = new FileReader();

						//dataURL形式でファイルを読み込む
						reader.readAsDataURL(file[0]);

						//ファイルの読込が終了した時の処理
						reader.onload = function(){
							let dataUrl = reader.result;

							filecache.value = dataUrl;
						}
					},false);
				};
			};

			this.notificationWaiting.shift();

			/* notificationの表示 */
			this.notificationOuter.style.display="block";

			var that = this;
			if (type == "news"){
				setTimeout(function(){that.notificationPrint()},10000);
			}else if (type == "info"){
				setTimeout(function(){that.notificationPrint()},1000);
			};
		}else{
			var that = this;
			this.notificationOuter.style.display="none";
			setTimeout(function(){that.notificationPrint()},1000);
		};
	};
};