/*
クッキー取得
*/

function GetCookies()
{
	var vars = {};

	var allcookies = document.cookie;

	var param = allcookies.split(';');
	for(var i = 0; i < param.length; i++) {
		var keySearch = param[i].search(/=/);
		var key = '';
		if(keySearch != -1) key = param[i].slice(0, keySearch);
		key = key.trim();
		var val = param[i].slice(param[i].indexOf('=', 0) + 1);
		if(key != '') vars[key] = decodeURI(val);
	}

	return vars;
}



function GetCookie(name)
{
	var ret = null;

	var cookieName = name + '=';
	var allcookies = document.cookie;

	var position = allcookies.indexOf( cookieName );
	if( position != -1 )
	{
		var startIndex = position + cookieName.length;

		var endIndex = allcookies.indexOf( ';', startIndex );
		if( endIndex == -1 )
		{
			endIndex = allcookies.length;
		}

		ret = decodeURIComponent(
			allcookies.substring( startIndex, endIndex ) );
	}

	return ret;
}

function SetCookie(name,setvar,deadsec)
{
	var expire = new Date();
	expire.setTime( expire.getTime() + 1000 * deadsec );

	document.cookie = name + '=' + setvar + '; expires=' + expire.toUTCString();

	return 1;
};

function DeleteCookie(name)
{
	document.cookie=name+'=;max-age=0;';
	return 1;
};






/*
element(
	{
		"name":"test",
		"attachele":attachele,
		"type":"div",
	}
)
*/
function element(para)
{
	var element = document.createElement(para["type"]);
	para["attachele"].appendChild(element);
	element.id = para["name"];
	element.name = para["name"];
	if ("color" in para){
		element.style.color = para["color"];
	};
	if ("class" in para){
		element.className = para["class"];
	};
	if ("backgroundColor" in para){
		element.style.backgroundColor = para["backgroundColor"];
	};
	if ("width" in para){
		element.style.width = para["width"];
	};
	if ("height" in para){
		element.style.height = para["height"];
	};
	if ("margin" in para){
		element.style.margin = para["margin"];
	};
	if ("padding" in para){
		element.style.margin = para["padding"];
	};
	if ("position" in para){
		element.style.position = para["position"];
	};
	if ("top" in para){
		element.style.top = para["top"];
	};
	if ("bottom" in para){
		element.style.bottom = para["bottom"];
	};
	if ("left" in para){
		element.style.left = para["left"];
	};
	if ("right" in para){
		element.style.right = para["right"];
	};
	if ("zIndex" in para){
		element.style.zIndex = para["zIndex"];
	};
	if ("value" in para){
		element.value = para["value"];
	};
	if ("placeholder" in para){
		element.placeholder = para["placeholder"];
	};
	if ("clickfunction" in para){
		element.addEventListener('click', para["clickfunction"], false);
	};
	if ("rightclickfunction" in para){
		element.oncontextmenu = para["rightclickfunction"];
	};
	if ("overfunction" in para){
		element.addEventListener('mouseover', para["overfunction"], false);
	};
	if ("outfunction" in para){
		element.addEventListener('mouseout', para["outfunction"], false);
	};
	if ("display" in para){
		element.style.display=para["display"];
	};
	if ("innerHTML" in para){
		element.innerHTML=para["innerHTML"];
	};
	if ("textAlign" in para){
		element.style.textAlign=para["textAlign"];
	};
	if ("minWidth" in para){
		element.style.minWidth=para["minWidth"];
	};
	if ("maxWidth" in para){
		element.style.maxWidth=para["maxWidth"];
	};
	if ("minHeight" in para){
		element.style.minHeight=para["minHeight"];
	};
	if ("maxHeight" in para){
		element.style.maxHeight=para["maxHeight"];
	};
	if ("overflow" in para){
		element.style.overflow=para["overflow"];
	};
	if ("fontSize" in para){
		element.style.fontSize=para["fontSize"];
	};
	if ("float" in para){
		element.style.cssFloat=para["float"];
	};
	if ("src" in para){
		element.src=para["src"];
	};
	if ("wordBreak" in para){
		element.style.wordBreak=para["wordBreak"];
	};
	if ("readOnly" in para){
		element.readOnly=para["readOnly"];
	};
	return element;
};


/*
Get取得
*/
function GetGetVars()
{
	var vars = {}; 
	var param = location.search.substring(1).split('&');
	for(var i = 0; i < param.length; i++) {
		var keySearch = param[i].search(/=/);
		var key = '';
		if(keySearch != -1) key = param[i].slice(0, keySearch);
		var val = param[i].slice(param[i].indexOf('=', 0) + 1);
		if(key != '') vars[key] = decodeURI(val);
	}
	return vars;
}


function GetGetVar(name)
{
	var vars = {}; 
	var param = location.search.substring(1).split('&');
	for(var i = 0; i < param.length; i++) {
		var keySearch = param[i].search(/=/);
		var key = '';
		if(keySearch != -1) key = param[i].slice(0, keySearch);
		var val = param[i].slice(param[i].indexOf('=', 0) + 1);
		if(key != '') vars[key] = decodeURI(val);
	}
	return vars[name];
}


function SetGet(GetVars)
{
	var URL = location.protocol + "//" + location.hostname;

	var index = 0;
	for (var key in GetVars){
		var GetVar = GetVars[key];
		if (index <= 0){
			URL = URL + "?"+key+"="+GetVar;
		}else{
			URL = URL + "&"+key+"="+GetVar;
		};

		index = index + 1;
	};

	window.location.href = URL;
	return 1
};



function GetStrRandom()
{
	// 生成する文字列の長さ
	var l = 64;

	// 生成する文字列に含める文字セット
	var c = "abcdefghijklmnopqrstuvwxyz0123456789";

	var cl = c.length;
	var r = "";
	for(var i=0; i<l; i++){
		r += c[Math.floor(Math.random()*cl)];
	}

	return r;
};



var isJSON = function(arg) {
	arg = (typeof arg === "function") ? arg() : arg;
	if (typeof arg  !== "string") {
		return false;
	}
	try {
	arg = (!JSON) ? eval("(" + arg + ")") : JSON.parse(arg);
		return true;
	} catch (e) {
		return false;
	}
};



function GetHTMLTimeTextFromJSDate(date){
	var YY = date.getYear();
	var MM = date.getMonth() + 1;
	var DD = date.getDate();
	var hh = date.getHours();
	var mm = date.getMinutes();
	var ss = date.getSeconds();
	if (YY < 2000) { YY += 1900; }
	if (MM < 10) { MM = "0" + MM; }
	if (DD < 10) { DD = "0" + DD; }
	if (hh < 10) { hh = "0" + hh; }
	if (mm < 10) { mm = "0" + mm; }
	if (ss < 10) { ss = "0" + ss; }
	data_text = YY + "-" + MM + "-" + DD + "T" + hh + ":" + mm + ":" +ss;

	return data_text;
};
