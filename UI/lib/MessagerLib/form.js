
class form {


	/*
	new form(
		[
			["text","testtest"],
			["input","printname","valuename"],
			["select",selectname,[["printname","valuename"],["printname","valuename"]]],
			["button","Done!",function(){}],
			["locations","X","Y"]
		],
		"nekoneko"
	)
	*/


	constructor (para,index,attachouter=document.body,attachinner=null){
		this.para = para;
		this.index = index;


		if (!index){
			index = GetStrRandom();
		};


		if (!attachinner){
			this.formOuter=element(
				{
					"name":"formOuter" + index,
					"type":"div",
					"attachele":attachouter,
					"width":"100%",
					"height":"100%",
					"color":"rgba(0,0,0,1)",
					"backgroundColor":"rgba(255,127,0,0.8)",
					"zIndex":"998",
					"position":"fixed",
					"top":"0px",
					"bottom":"0px",
					"left":"0px",
					"right":"0px",
					"margin":"auto",
				}
			);

			this.formInner=element(
				{
					"name":"formInner" + index,
					"type":"div",
					"attachele":this.formOuter,
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
		}else{
			this.formOuter = attachinner;

			this.formInner=element(
				{
					"name":"formInner" + index,
					"type":"div",
					"attachele":this.formOuter,
					"width":"100%",
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
		};



		this.formClose=element(
			{
				"name":index,
				"type":"div",
				"attachele":this.formOuter,
				"textAlign":"center",
				"fontSize":"30px",
				"float":"right",
				"innerHTML":"×",
				"clickfunction":function(){
					document.getElementById("formOuter"+this.name).parentNode.removeChild(document.getElementById("formOuter"+this.name));
				}
			}
		);

		this.SetForm(para);
	};



	SetForm(para)
	{
		/* paraから表示する内容を表示 */
		for (let index in para){
			let paradata = para[index];

			if (paradata[0] == "title"){
				let argtext = paradata[1];
				let resultargtext = "";
				if (typeof argtext == 'object'){
					for (let mindex in argtext){
						let mtext = argtext[mindex];

						resultargtext = resultargtext + mtext + "<br>";
					};
				}else{
					resultargtext = argtext;
				};

				let text = element(
					{
						"name":"text"+index,
						"attachele":this.formInner,
						"type":"h1",
						"fontSize":"30px",
						"width":"100%",
						"textAlign":"center",
					}
				);
				text.innerHTML = resultargtext;
			};
			if (paradata[0] == "head"){
				let argtext = paradata[1];
				let resultargtext = "";
				if (typeof argtext == 'object'){
					for (let index in argtext){
						let mtext = argtext[index];

						resultargtext = resultargtext + mtext + "<br>";
					};
				}else{
					resultargtext = argtext;
				};

				let text = element(
					{
						"name":"text"+index,
						"attachele":this.formInner,
						"type":"h2",
						"fontSize":"25px",
						"width":"100%",
						"textAlign":"center",
					}
				);
				text.innerHTML = resultargtext;
			};
			if (paradata[0] == "text"){
				let argtext = paradata[1];
				let resultargtext = "";
				if (typeof argtext == 'object'){
					for (let mindex in argtext){
						let mtext = argtext[mindex];

						resultargtext = resultargtext + mtext + "<br>";
					};
				}else{
					resultargtext = argtext;
				};

				let text = element(
					{
						"name":"text"+index,
						"attachele":this.formInner,
						"type":"div",
						"fontSize":"20px",
						"width":"100%",
						"textAlign":"center",
					}
				);
				text.innerHTML = resultargtext;
			};
			if (paradata[0] == "input"){
				let inputprintname = paradata[1];
				let inputvaluename = paradata[2];
				let inputele = element(
					{
						"name":inputvaluename,
						"attachele":this.formInner,
						"type":"input",
						"fontSize":"20px",
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
						"attachele":this.formInner,
						"type":"input",
						"fontSize":"20px",
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
						"attachele":this.formInner,
						"type":"textarea",
						"fontSize":"20px",
						"placeholder":inputprintname,
						"width":"100%",
						"textAlign":"center",
						"margin":"10 auto",
						"height":"300px",
					}
				);
			};
			if (paradata[0] == "select"){
				let selectname = paradata[1];
				let selectlist = paradata[2];
				let selectele = element(
					{
						"name":selectname,
						"attachele":this.formInner,
						"type":"select",
						"fontSize":"20px",
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
						"attachele":this.formInner,
						"type":"input",
						"fontSize":"20px",
						"value":buttonname,
						"clickfunction":buttonfunction,
						"width":"100%",
						"textAlign":"center",
					}
				);
				buttonele.type = "button";
			};
			if (paradata[0] == "button_img"){
				let buttonsrc = paradata[1];
				let buttonfunction = paradata[2];
				let buttonsize = paradata[3];


				let imgele = element(
					{
						"name":"imgele",
						"attachele":this.formInner,
						"type":"img",
						"margin":"10px",
						"clickfunction":buttonfunction,
						"width":buttonsize,
						"src":buttonsrc,
					}
				);
				imgele.type = "button";
			};
			if (paradata[0] == "locations"){
				let map = element(
					{
						"name":"map"+index,
						"attachele":this.formInner,
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
						"attachele":this.formInner,
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
						"attachele":this.formInner,
						"type":"input",
						"width":"100%",
						"textAlign":"center",
					}
				);
				fileele.type = "file";

				let filecache = element(
					{
						"name":name,
						"attachele":this.formInner,
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
			if (paradata[0] == "color"){
				let name = paradata[1];
				let DefaultColor = paradata[2];



				let EleSampleColor = element(
					{
						"name":name,
						"attachele":this.formInner,
						"type":"div",
						"width":"50px",
						"height":"50px",
						"margin":"auto",
						"textAlign":"center",
						"backgroundColor":DefaultColor,
					}
				);
				let EleColor = element(
					{
						"name":"EleColor",
						"attachele":this.formInner,
						"type":"input",
						"width":"100%",
						"textAlign":"center",
						"value":"SELECT",
					}
				);
				EleColor.type = "button";
				EleColor.setAttribute("cmanCPat","rc_form:RGBA,def_color:bgc="+name+",rc_bg:"+name);
				EleColor.onclick = function(){
					let EleColor = this;
					cmanCP_JS_open(EleColor);
				};
			};
		};

		return 1;
	};



	DeleteForm()
	{
		document.getElementById("formOuter"+this.index).parentNode.removeChild(document.getElementById("formOuter"+this.index));
		return this.index;
	};
};