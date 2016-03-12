function inviteMember(e){
		var inviteEamil = e.getAttribute("data-email");
		$.get("familyTree/invite",
				{"inviteEmail":inviteEamil},
				function(result){
					if (result = "true")
						alert("成功发出邀请！");
				});
}

var InitTreeListeners = function (myTreeEle, myFamilyTree) {

	var EventUtil = {
		getWheelDelta: function(event) {
			if (event.wheelDelta) {
				// alert(window.client);  undefine
				return event.wheelDelta;
				// return (client.engine.opera && client.engine.opera < 9.5 ? -event.wheelDelta : event.wheelDelta);
			} else {
				// Firefox
				return -event.detail * 40;
			}
		},
		addHandler: function(element, eventype, evenhandler) {
			// element = document.getElementById(element);
			// alert(element);
			if (element.addEventListener) {
				element.addEventListener(eventype, evenhandler, false);
			} else if (element.attachEvent) {
				element.attachEvent("on" + eventype, evenhandler);
			} else {
				element["on" + eventype] = evenhandler;
			}
		},
		getEvent: function(event) {
			return event || window.event;
		},
	};

	var zoomRate = 1.08; // Must be greater than 1. Increase this value for faster zooming (i.e., less granularity).

	function zoom(zoomType) {
		var viewBox = theSvgElement.getAttribute('viewBox'); // Grab the object representing the SVG element's viewBox attribute.
		var viewBoxValues = viewBox.split(' '); // Create an array and insert each individual view box attribute value (assume they're seperated by a single whitespace character).

		viewBoxValues[2] = parseFloat(viewBoxValues[2]); // Convert string "numeric" values to actual numeric values.
		viewBoxValues[3] = parseFloat(viewBoxValues[3]);

		if (zoomType == 'zoomIn') {
			viewBoxValues[2] /= zoomRate; // Decrease the width and height attributes of the viewBox attribute to zoom in.
			viewBoxValues[3] /= zoomRate;

		} else if (zoomType == 'zoomOut') {
			viewBoxValues[2] *= zoomRate; // Increase the width and height attributes of the viewBox attribute to zoom out.
			viewBoxValues[3] *= zoomRate;
		} else
			alert("function zoom(zoomType) given invalid zoomType parameter.");

		theSvgElement.setAttribute('viewBox', viewBoxValues.join(' ')); // Convert the viewBoxValues array into a string with a white space character between the given values.

		// var currentZoomFactor = svgViewBoxWidth / viewBoxValues[2]; // Calculates the current zoom factor, could have just as easily used svgViewBoxHeight.      
		// var newText = document.createTextNode("Current zoom factor = " + currentZoomFactor.toFixed(3)); // Create a generic new text node object.
		// var parentNode = document.getElementById('currentZoomFactorText'); // Get the parent node of the text node we want to replace.

		// parentNode.replaceChild(newText, parentNode.firstChild); // Replace the first child text node with the new text object.
	}

	function zoomViaMouseWheel(mouseWheelEvent) {
		/* When the mouse is over the webpage, don't let the mouse wheel scroll the entire webpage: */
		mouseWheelEvent.cancelBubble = true;
		var w = 0;
		var h = 0;
		// 正则表达，可能包含小数点的数字
		var reg = /\-?[0-9]+\.?[0-9]*/g;
		var translateValues = this.style.transform.match(reg);

		if (mouseWheelEvent.wheelDelta > 0) {
			// ZoomIn
			w = this.getAttribute('width') * zoomRate;
			h = this.getAttribute('height') * zoomRate;
			translateValues[0] /= zoomRate;
			translateValues[1] /= zoomRate;
			// alert(this.getAttribute('style'));
		} else {
			// ZoomOut
			w = this.getAttribute('width') / zoomRate;
			h = this.getAttribute('height') / zoomRate;
			translateValues[0] *= zoomRate;
			translateValues[1] *= zoomRate;
		}
		this.setAttribute('width', w);
		this.setAttribute('height', h);
		// change transform
		this.style.transform = 'translate(' + translateValues[0] + 'px,' + translateValues[1] + 'px)';
		return false;
	}

	/**
	 * @property
	 * ex_X ex_Y--记录拖拽前鼠标位置
	 * dragging--是否处于拖拽状态
	 * targetSex--目标节点的性别
	 * targetName--目标节点的名字
	 * newMemberSex--新节点的性别
	 * newMemberNodetype--新节点的节点类型
	 * rectColors--节点颜色集
	 */

	var ex_X = 0;
	var ex_Y = 0;
	var dragging = false;

	function dragHandler(mouseMoveEvent) {
		mouseMoveEvent = EventUtil.getEvent(mouseMoveEvent);
		switch (mouseMoveEvent.type) {
			case "mousedown":
				mouseMoveEvent.stopImmediatePropagation();
				dragging = true;
				ex_X = mouseMoveEvent.clientX;
				ex_Y = mouseMoveEvent.clientY;
				// alert(ex_X+"," +ex_Y);
				break;
			case "mousemove":
				mouseMoveEvent.stopImmediatePropagation();
				if (dragging) {
					var reg = /\-?[0-9]+\.?[0-9]*/g;
					var translateValues = this.style.transform.match(reg);
					translateValues[0] = parseFloat(translateValues[0]);
					translateValues[1] = parseFloat(translateValues[1]);
					translateValues[0] += mouseMoveEvent.clientX - ex_X;
					translateValues[1] += mouseMoveEvent.clientY - ex_Y;

					this.style.transform = 'translate(' + translateValues[0] + 'px,' + translateValues[1] + 'px)';

					ex_X = mouseMoveEvent.clientX;
					ex_Y = mouseMoveEvent.clientY;
				}
				break;
			case "mouseup":
				mouseMoveEvent.stopImmediatePropagation();
				dragging = false;
				break;
		}
		return false;
	}

	var targetNode = null;
	var targetId = null;
	var targetSex = null;
	var targetName = null;
	var newMemberSex = null;
	var newMemberNodetype = null;
	var rectColors = {
		"男": "#9FD5EB",
		"女": "#F5B8DB"
	};

	var mainContainer = document.getElementById('main');
	var mainCentrePointTop = mainContainer.offsetTop;
	var mainCentrePointLeft = mainContainer.offsetLeft;
	
   /**
	 * 点击节点下的添加Icon后，弹出添加成员选择SVG
	 * @method popAdditionChooseDiv -> appendAdditionSvg
	 * @for 所属类名
	 * @param {参数类型} 参数名 参数说明
	 * @return {返回值类型} 返回值说明
	 */

	function popAdditionChooseDiv(clickEvent) {
		targetId = clickEvent.target.getAttribute('nodeid');
		targetNode = myFamilyTree.nDatabaseNodes[targetId];
		targetSex = targetNode.psdesc.sex;
		targetName = targetNode.psdesc.fname + targetNode.psdesc.sname;
		// 弹出遮罩
		// var div = document.createElement('div');
		// div.style.width = mainContainer.clientWidth + "px";
		// div.style.height = window.innerHeight + "px";
		// div.style.opacity = "0.8";
		// div.style.position = "fixed";
		// div.style.top = this.offsetParent.offsetTop + "px";
		// div.style.left = this.offsetParent.offsetLeft + "px";
		// div.style.zindex = "1";
		// div.style.background = "#000";
		// mainContainer.appendChild(div);
		// 弹出添加成员的选择界面
		var svgDiv = document.createElement('div');
		svgDiv.style.zindex = "1002";
		svgDiv.style.position = "absolute";
		svgDiv.style.left = mainCentrePointLeft + "px";
		svgDiv.style.top =  mainCentrePointTop + "px";
		svgDiv.style.background = "#272C2E";
		svgDiv.style.opacity = "0.9";
		svgDiv.style.borderRadius = "10px";
		appendAdditionSvg(svgDiv);
		mainContainer.appendChild(svgDiv);
		// alert(svgDiv.previousSibling);
		// Initial listeners for rect
		// alert(embed.innerHTML);  undefine
		return false;
	}

	function appendAdditionSvg(div) {
		var sex = "男";
		if (targetSex == "男")
			sex = "女";
		var spouseRectColor = rectColors[sex];
		var html = [];

		
		html = '<svg width="640" height="480" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0,0,720,480">'
		+ '<g>' 
		+ '<rect id="" x="220" y="190" rx="10" ry="10" width="200" height="100" fill="#9FD5EB" stroke-width="1"/>'
		+ '<text fill="rgb(16, 74, 115)" x="320" y="220" font-size="18px">'+targetName+'</text>'
		+ '</g>'; 
		if (targetNode.hasSpouse()){
			html += '<g cursor="pointer">' 
			+ '<rect nodetype="child" sex="男" x="140" y="330" width="160" height="60" rx="10" ry="10" fill="#9FD5EB" stroke-width="1"/>' 
			+ '<text fill="rgb(16, 74, 115)" x="190" y="360" font-size="22px">添加儿子</text>' 
			+ '</g>' 
			+ '<g cursor="pointer">' 
			+ '<rect nodetype="child" sex="女" x="340" y="330" width="160" height="60" rx="10" ry="10" fill="#F5B8DB" stroke-width="1"/>' 
			+ '<text fill="rgb(16, 74, 115)" x="390" y="360" font-size="22px">添加女儿</text>' 
			+ '</g>'
			+ '<g>'
			+ '<line x1="220" y1="330" x2="220" y2="310" stroke="#AFAFAF" stroke-opacity="2" />' 
			+ '<line x1="420" y1="330" x2="420" y2="310" stroke="#AFAFAF" stroke-opacity="2" />' 
			+ '<line x1="220" y1="310" x2="420" y2="310" stroke="#AFAFAF" stroke-opacity="2" />' 
			+ '<line x1="320" y1="310" x2="320" y2="290" stroke="#AFAFAF" stroke-opacity="2" />'
			+ '</g>';
		} else{
			html += '<g cursor="pointer">' 
			+ '<rect nodetype="spouse" sex="'+sex+'" x="450" y="210" width="160" height="60" rx="10" ry="10" fill="'+spouseRectColor+'" stroke-width="1"/>' 
			+ '<text fill="rgb(16, 74, 115)" x="500" y="240" font-size="22px">添加配偶</text>' 
			+ '</g>' 
			+ '<line x1="420" y1="240" x2="450" y2="240" stroke="#AFAFAF" stroke-opacity="2" />';
		}
		
		if (targetNode.hasParents()){
		html += '<g cursor="pointer">' 
		+ '<rect nodetype="sibling" sex="男" x="30" y="160" width="160" height="60" rx="10" ry="10" fill="#9FD5EB" stroke-width="1"/>' 
		+ '<text fill="rgb(16, 74, 115)" x="80" y="190" font-size="22px">添加兄弟</text>' 
		+ '</g>' 
		+ '<g cursor="pointer">' 
		+ '<rect nodetype="sibling" sex="女" x="30" y="250" width="160" height="60" rx="10" ry="10" fill="#F5B8DB" stroke-width="1"/>' 
		+ '<text fill="rgb(16, 74, 115)" x="80" y="280" font-size="22px">添加姐妹</text>' 
		+ '</g>'
		+ '<g>'
		+ '<line x1="190" y1="190" x2="205" y2="190" stroke="#AFAFAF" stroke-opacity="2" />' 
		+ '<line x1="190" y1="280" x2="205" y2="280" stroke="#AFAFAF" stroke-opacity="2" />' 
		+ '<line x1="205" y1="190" x2="205" y2="280" stroke="#AFAFAF" stroke-opacity="2" />' 
		+ '<line x1="205" y1="235" x2="220" y2="235" stroke="#AFAFAF" stroke-opacity="2" />'
		+ '</g>';
		}else{
		html += '<g cursor="pointer">' 
		+ '<rect nodetype="parent" sex="男" x="140" y="90" width="160" height="60" rx="10" ry="10" fill="#9FD5EB" stroke-width="1"/>' 
		+ '<text fill="rgb(16, 74, 115)" x="190" y="120" font-size="22px">添加父亲</text>' 
		+ '</g>' 
		+ '<g cursor="pointer">' 
		+ '<rect nodetype="parent" sex="女" x="340" y="90" width="160" height="60" rx="10" ry="10" fill="#F5B8DB" stroke-width="1"/>' 
		+ '<text fill="rgb(16, 74, 115)" x="390" y="120" font-size="22px">添加母亲</text>' 
		+ '</g>' 
		+ '<g>'
		+ '<line x1="220" y1="170" x2="220" y2="150" stroke="#AFAFAF" stroke-opacity="2" />' 
		+ '<line x1="420" y1="170" x2="420" y2="150" stroke="#AFAFAF" stroke-opacity="2" />' 
		+ '<line x1="220" y1="170" x2="420" y2="170" stroke="#AFAFAF" stroke-opacity="2" />' 
		+ '<line x1="320" y1="190" x2="320" y2="170" stroke="#AFAFAF" stroke-opacity="2" />'
		+ '</g>';
		}
		html += '<path cursor="pointer" d="M236.098 140.654C236.098 134.442 243.7 129.407 253.075 129.407L272.6573 127.6969L273.265 135.33L299.581 125.263L273.265 115.194L275.109 122.9096L253.075 121.116C236.789 121.116 223.588 129.865 223.588 140.655C223.588 151.448 236.789 160.196 253.075 160.196L284.546 160.196L284.546 151.904L253.075 151.904C243.7 151.903 236.098 146.868 236.098 140.654Z" transform="matrix(-0.388,0,0,-0.612,694.8793,133.733)" fill="#8F897A" stroke="none" stroke-opacity="0"/>' 
		+ '</svg>';

		div.innerHTML = html;
		initAdditionSvgListeners(div);
	}
	
	/**
	 * 弹出添加成员选择框
	 * @method initAdditionSvgListeners -> popAdditionFormDiv
	 * @for 所属类名
	 * @param {div} 含选择框Svg的Div 
	 * @return {返回值类型} 返回值说明
	 */
	function initAdditionSvgListeners(div) {
		var exit = div.getElementsByTagName('path');
		// alert(div.innerHTML);

		EventUtil.addHandler(exit[0], 'click', function(event) {
			// mainContainer.removeChild(div.previousSibling);
			mainContainer.removeChild(div);
		});
		var rectList = div.getElementsByTagName('rect');
		for (var i = 1; i < rectList.length; i++) {
			EventUtil.addHandler(rectList[i], 'click', function(event) {
				mainContainer.removeChild(div);
				popAdditionFormDiv(event);
			});
		};
		// alert(rect.length);
	}

	/**
	 * 点击添加成员矩形，弹出相应form以填入新成员信息
	 * @method 方法名
	 * @for 所属类名
	 * @param {参数类型} 参数名 参数说明
	 * @return {返回值类型} 返回值说明
	 */

	function popAdditionFormDiv(event) {
		// alert(event.target.nextSibling.innerHTML);
		// 标题——sibling
		var targetString = event.target.nextSibling.innerHTML;
		// 新添加成员的性别和节点类型
		newMemberSex = event.target.getAttribute('sex');
		alert(newMemberSex);
		newMemberNodetype = event.target.getAttribute('nodetype');

		var formDiv = document.createElement('div');
		formDiv.style.cssText = 'position: absolute;z-index: 1002;height: 400px;width: 450px;display: block;background-color: #DFDFDF;border-radius:8px;box-shadow: 0 0 5px #ccc;margin: 40px auto 0 auto;';
		formDiv.style.top = mainCentrePointTop + "px";
		formDiv.style.left = mainCentrePointLeft + "px";

		var headerDiv = document.createElement('div');
		headerDiv.style.cssText = 'padding: 20px 13px 5px;';
		var headerTitle = document.createElement('span');
		headerTitle.style.cssText = 'color: #555552;font-size: 20px;line-height: 1.2;max-height: 48px;overflow: hidden;width: 80%;';
		headerTitle.innerHTML = targetString;
		headerDiv.appendChild(headerTitle);

		var formContent = document.createElement('div');
		formContent.style.cssText = 'padding: 16px 21px;background-color: #fff;min-height: 40px;box-shadow: 0 0 5px #ccc;';

		var form = document.createElement('form');
		form.id = "additonform";

		var contentDiv = document.createElement('div');
		contentDiv.style.cssText = 'overflow-y: hidden;overflow-x: hidden;padding-top: 3px;';
		
		var fNameDiv = document.createElement('div');
		fNameDiv.style.cssText = 'float: left;min-width: 135px;margin-bottom: 12px;margin-right: 15px;';
		var fNameTitle = document.createElement('div');
		fNameTitle.style.cssText = 'font-size: 14px;color: #6e6e6e;line-height: 19px;';
		fNameTitle.innerHTML = "姓：";
		var fNameInput = document.createElement('input');
		fNameInput.id = "fname";
		fNameInput.style.cssText = 'width: 140px;border: 1px solid #e4e4e4;font-size: 14px;color: #353535;height: 20px;padding:1px 2px;';
		var fNameInputDiv = document.createElement('div');
		fNameInputDiv.appendChild(fNameInput);
		fNameDiv.appendChild(fNameTitle);
		fNameDiv.appendChild(fNameInputDiv);

		var sNameDiv = document.createElement('div');
		sNameDiv.style.cssText = 'float: left;min-width: 135px;margin-bottom: 12px;';
		var sNameTitle = document.createElement('div');
		sNameTitle.style.cssText = 'font-size: 14px;color: #6e6e6e;line-height: 19px;';
		sNameTitle.innerHTML = "名：";
		var sNameInput = document.createElement('input');
		sNameInput.id = "sname";
		sNameInput.style.cssText = 'width: 140px;border: 1px solid #e4e4e4;font-size: 14px;color: #353535;height: 20px;padding:1px 2px;';
		var sNameInputDiv = document.createElement('div');
		sNameInputDiv.appendChild(sNameInput);
		sNameDiv.appendChild(sNameTitle);
		sNameDiv.appendChild(sNameInputDiv);

		var appellationDiv = document.createElement('div');
		appellationDiv.style.cssText = 'float: left;min-width: 135px;margin-bottom: 12px;margin-right: 15px;';
		var appellationTitle = document.createElement('div');
		appellationTitle.style.cssText = 'font-size: 14px;color: #6e6e6e;line-height: 19px';
		appellationTitle.innerHTML = "称呼：";
		var appellationInput = document.createElement('input');
		appellationInput.id = "appellation";
		appellationInput.style.cssText = 'width: 140px;border: 1px solid #e4e4e4;font-size: 14px;color: #353535;height: 20px;padding:1px 2px;';
		var appellationInputDiv = document.createElement('div');
		appellationInputDiv.appendChild(appellationInput);
		appellationDiv.appendChild(appellationTitle);
		appellationDiv.appendChild(appellationInputDiv);

		var clearDiv = document.createElement('div');
		clearDiv.style.cssText = 'clear: both;display: block;overflow: hidden;visibility: hidden;width: 0;height: 0;';

		var homeTownSelectDiv = document.createElement('div');
		var homeTownTitle = document.createElement('div');
		homeTownTitle.style.cssText = 'font-size: 14px;color: #6e6e6e;line-height: 19px';
		homeTownTitle.innerHTML = "故乡：";
		var provinceSelectDiv = document.createElement('div');
		provinceSelectDiv.style.cssText = 'float: left;margin-right: 15px; margin-bottom: 12px;';
		var provinceSelect = document.createElement('select');
		provinceSelect.style.cssText = 'cursor: pointer;width: 140px;border: 1px solid #e4e4e4;font-size: 14px;color: #353535;height: 20px;padding:1px 2px;';
		provinceSelect.id = "province";
		provinceSelectDiv.appendChild(provinceSelect);
		var citySelectDiv = document.createElement('div');
		citySelectDiv.style.float = "left";
		var citySelect = document.createElement('select');
		citySelect.style.cssText = 'cursor: pointer;width: 140px;border: 1px solid #e4e4e4;font-size: 14px;color: #353535;height: 20px;padding:1px 2px;';
		citySelect.id = "city";
		citySelectDiv.appendChild(citySelect);
		homeTownSelectDiv.appendChild(homeTownTitle);
		homeTownSelectDiv.appendChild(provinceSelectDiv);
		homeTownSelectDiv.appendChild(citySelectDiv);

		var isAliveChooseDiv = document.createElement('div');
		isAliveChooseDiv.style.cssText = 'width:100%;float: left;margin-bottom: 8px;font-size: 14px;color: #6e6e6e;line-height: 19px';
		isAliveChooseDiv.innerHTML = '<table cellspacing="0" cellpadding="0" border="0">' + '<tbody><tr>' + '<td width="6"><input height="5" type="radio" name="isAlive" id="living" value="true" checked="true"></td>' + '<td width="3"></td>' + '<td><label id="" for="living" class="">健在</label></td>' + '<td width="35"></td>' + '<td width="6"><input type="radio" name="isAlive" id="deceased" value="false"></td>' + '<td width="3"></td>' + '<td><label id="" for="deceased" class="">已故</label></td>' + '</tr></tbody></table>';

		var emailAccountDiv = document.createElement('div');
		emailAccountDiv.style.cssText = 'float: left;min-width: 100%;margin-bottom: 12px;margin-right: 15px;';
		var emailAccountTitle = document.createElement('div');
		emailAccountTitle.style.cssText = 'font-size: 14px;color: #6e6e6e;line-height: 19px';
		emailAccountTitle.innerHTML = "电子邮件地址：";
		var emailAccountInput = document.createElement('input');
		emailAccountInput.id = "emailaccount";
		emailAccountInput.style.cssText = 'width: 140px;border: 1px solid #e4e4e4;font-size: 14px;color: #353535;height: 20px;padding:1px 2px;';
		var emailAccountInputDiv = document.createElement('div');
		emailAccountInputDiv.appendChild(emailAccountInput);
		emailAccountDiv.appendChild(emailAccountTitle);
		emailAccountDiv.appendChild(emailAccountInputDiv);

		var isConfirmDiv = document.createElement('div');
		isConfirmDiv.style.cssText = 'float: right;margin-bottom: 12px;font-size: 16px;';
		isConfirmDiv.innerHTML = '<table cellspacing="0" cellpadding="0" border="0">' + '<tbody><tr>' + '<td><label style="cursor:pointer" id="confirm" class="">确定</label></td>' + '<td width="15"></td>' + '<td><label style="cursor:pointer" id="cancel" class="">取消</label></td>' + '</tr></tbody></table>';

		mainContainer.appendChild(formDiv);
		formDiv.appendChild(headerDiv);
		formDiv.appendChild(formContent);
		formContent.appendChild(form);
		form.appendChild(contentDiv);
		contentDiv.appendChild(fNameDiv);
		contentDiv.appendChild(sNameDiv);
		contentDiv.appendChild(appellationDiv);
		contentDiv.appendChild(clearDiv);
		contentDiv.appendChild(homeTownSelectDiv);
		contentDiv.appendChild(isAliveChooseDiv);
		contentDiv.appendChild(emailAccountDiv);
		contentDiv.appendChild(isConfirmDiv);

		// 初始化address插件
		addressInit('province', 'city');
		initFormDivListeners(formDiv);
	}
	/**
	 * 添加Form监听器，响应添加成员，利用ajax操作后台数据库
	 * @method 方法名
	 * @for 所属类名
	 * @param {参数类型} 参数名 参数说明
	 * @return {返回值类型} 返回值说明
	 */
	function initFormDivListeners(div) {

		var confirmElement = document.getElementById('confirm');
		var cancelElement = document.getElementById('cancel');
		EventUtil.addHandler(confirmElement, 'click', function(event) {
			var fistName = document.getElementById('fname').value;
			var secondName = document.getElementById('sname').value;
			var appel = document.getElementById('appellation').value;
			var province = document.getElementById('province').value;
			var city = document.getElementById('city').value;
			// var isAliveGroup = document.getElementsByName('isAlive');
			var isAliveValue = $('input:radio:checked').attr('value');
			var email = document.getElementById('emailaccount').value;
			// for (var i=0; i<isAliveGroup.length; i++){
			// 	var isAliveRadio = isAliveGroup[i];
			// 	if (isAliveRadio.checked){
			// 		// alert(isAliveRadio.value);
			// 		isAliveValue = isAliveRadio.value;
			// 		break;
			// 	}
			// }
			var memberData = {};
			
//			memberData['icon'] = null;
			memberData['fname'] = fistName;
			memberData['sname'] = secondName;
//			memberData['appellation'] = appel;
			memberData['province'] = province;
			memberData['city'] = city;
			// memberData['nodetype'] = newMemberNodetype;
			memberData['sex'] = newMemberSex;
//			memberData['ngeneration'] = 1;
			memberData['isalive'] = isAliveValue;
			memberData['email'] = email;
//			头像数据
			memberData["pathHeadPicture"] = "";

			// 节点信息--节点类型和个人信息
			var tempPsdesc = {};
			tempPsdesc['nodetype'] = newMemberNodetype;
			if (newMemberNodetype == 'parent'){
				var nullmemberData = {
//					icon : null,
					fname : "不详",
					sname : "",
					appellation : "不详",
					province : "不详",
					city : "不详",
//					ngeneration : 1,
					isAlive : 'living'  
				}; 
				if (newMemberSex == '男'){
					nullmemberData['sex'] = '女';
					tempPsdesc['fatherDesc'] = memberData;
					tempPsdesc['motherDesc'] = nullmemberData;
				} 
				if (newMemberSex == '女'){
					nullmemberData['sex'] = '男';
					tempPsdesc['fatherDesc'] = nullmemberData;
					tempPsdesc['motherDesc'] = memberData;
				}
			}else{
				tempPsdesc[newMemberNodetype + 'Desc'] = memberData;
			}
			
			// var treeSVG = document.getElementById("familyTreeSVG");
//			var newNodeId = myFamilyTree.nDatabaseNodes.length;
			// alert(myFamilyTree);
			var myTreeDiv = document.getElementById('myTreeContainer');
			alert(memberData["sex"]);
			/*var obj = {
				     "a":"a",
				     "b":"b",
				};
			alert($.param({
                "obj.a":obj.a,
                "obj.b":obj.b }));*/
			var treeRecord = {};
			treeRecord["memberInfo"] = memberData;
			treeRecord["nodeType"] = newMemberNodetype;
			treeRecord["operdNodeIndex"] = targetId;
//			treeRecord["newNodeIndex"] = newNodeId;
//			alert(JSON.stringify(treeRecord));
			$.ajax({
				url : "familyTree/add",
				type : "POST", 
				contentType: "application/json",
				data: JSON.stringify(treeRecord),
				success : function (data, textStatus){	
					var newNodeId = data;
					myFamilyTree.addNode(newNodeId, targetId, tempPsdesc);
					var FamilyTree = myFamilyTree.constructor;
					FamilyTree.showTree(myTreeDiv, myFamilyTree);
//					alert("test");
					},
				dataType: 'json'
			});
			
			
			// alert(memberData['sex']);

			// mainContainer.removeChild(div.previousSibling);
			mainContainer.removeChild(div);
		});
		EventUtil.addHandler(cancelElement, 'click', function(event) {
			// mainContainer.removeChild(div.previousSibling);
			mainContainer.removeChild(div);
		});
	}
	
   /**
	 * 弹出个人信息Form，查看个人信息
	 * @method 方法名
	 * @for 所属类名
	 * @param {参数类型} 参数名 参数说明
	 * @return {返回值类型} 返回值说明
	 */
	function popPersonPanelDiv(clickEvent){
		targetId = clickEvent.target.getAttribute('nodeid');
		targetNode = myFamilyTree.nDatabaseNodes[targetId];
		var psdesc = targetNode.psdesc;

		var title = psdesc.fname + psdesc.sname + "的个人信息";
		var formDiv = document.createElement('div');
		formDiv.style.cssText = 'position: absolute;z-index: 1002;height: 400px;width: 450px;display: block;background-color: #DFDFDF;border-radius:8px;box-shadow: 0 0 5px #ccc;margin: 40px auto 0 auto;';
		formDiv.style.top = mainCentrePointTop + "px";
		formDiv.style.left = mainCentrePointLeft + "px";

		var headerDiv = document.createElement('div');
		headerDiv.style.cssText = 'padding: 20px 13px 5px;';
		var headerTitle = document.createElement('span');
		headerTitle.style.cssText = 'color: #000;font-size: 20px;line-height: 1.2;max-height: 48px;overflow: hidden;width: 80%;';
		headerTitle.innerHTML = title;
		headerDiv.appendChild(headerTitle);

		var formContent = document.createElement('div');
		formContent.style.cssText = 'padding: 16px 21px;background-color: #fff;min-height: 40px;box-shadow: 0 0 5px #ccc;';

		var form = document.createElement('form');
		form.id = "additonform";

		var contentDiv = document.createElement('div');
		contentDiv.style.cssText = 'overflow-y: hidden;overflow-x: hidden;padding-top: 3px;';

		var fNameDiv = document.createElement('div');
		fNameDiv.style.cssText = 'float: left;min-width: 135px;margin-bottom: 12px;margin-right: 15px;';
		var fNameTitle = document.createElement('div');
		fNameTitle.style.cssText = 'font-size: 14px;color: #6e6e6e;line-height: 19px;';
		fNameTitle.innerHTML = "姓：";
		var fNameInput = document.createElement('input');
		fNameInput.id = "fname";
		fNameInput.type = "text";
		fNameInput.style.cssText = 'width: 140px;border: 1px solid #e4e4e4;font-size: 14px;color: #353535;height: 20px;padding:1px 2px;';
		fNameInput.value = psdesc.fname;
		var fNameInputDiv = document.createElement('div');
		fNameInputDiv.appendChild(fNameInput);
		fNameDiv.appendChild(fNameTitle);
		fNameDiv.appendChild(fNameInputDiv);

		var sNameDiv = document.createElement('div');
		sNameDiv.style.cssText = 'float: left;min-width: 135px;margin-bottom: 12px;';
		var sNameTitle = document.createElement('div');
		sNameTitle.style.cssText = 'font-size: 14px;color: #6e6e6e;line-height: 19px;';
		sNameTitle.innerHTML = "名：";
		var sNameInput = document.createElement('input');
		sNameInput.id = "sname";
		sNameInput.type = "text";
		sNameInput.style.cssText = 'width: 140px;border: 1px solid #e4e4e4;font-size: 14px;color: #353535;height: 20px;padding:1px 2px;';
		sNameInput.value = psdesc.sname;
		var sNameInputDiv = document.createElement('div');
		sNameInputDiv.appendChild(sNameInput);
		sNameDiv.appendChild(sNameTitle);
		sNameDiv.appendChild(sNameInputDiv);

		var appellationDiv = document.createElement('div');
		appellationDiv.style.cssText = 'float: left;min-width: 135px;margin-bottom: 12px;margin-right: 15px;';
		var appellationTitle = document.createElement('div');
		appellationTitle.style.cssText = 'font-size: 14px;color: #6e6e6e;line-height: 19px';
		appellationTitle.innerHTML = "称呼：";
		var appellationInput = document.createElement('input');
		appellationInput.id = "appellation";
		appellationInput.style.cssText = 'width: 140px;border: 1px solid #e4e4e4;font-size: 14px;color: #353535;height: 20px;padding:1px 2px;';
		appellationInput.value = psdesc.appellation;
		var appellationInputDiv = document.createElement('div');
		appellationInputDiv.appendChild(appellationInput);
		appellationDiv.appendChild(appellationTitle);
		appellationDiv.appendChild(appellationInputDiv);

		var clearDiv = document.createElement('div');
		clearDiv.style.cssText = 'clear: both;display: block;overflow: hidden;visibility: hidden;width: 0;height: 0;';

		var homeTownSelectDiv = document.createElement('div');
		var homeTownTitle = document.createElement('div');
		homeTownTitle.style.cssText = 'font-size: 14px;color: #6e6e6e;line-height: 19px';
		homeTownTitle.innerHTML = "故乡：";
		
		var provinceSelectDiv = document.createElement('div');
		provinceSelectDiv.style.cssText = 'float: left;margin-right: 15px; margin-bottom: 12px;';
		var provinceSelect = document.createElement('select');
		provinceSelect.style.cssText = 'cursor: pointer;width: 140px;border: 1px solid #e4e4e4;font-size: 14px;color: #353535;height: 20px;padding:1px 2px;';
		provinceSelect.id = "province";
		provinceSelectDiv.appendChild(provinceSelect);

		var citySelectDiv = document.createElement('div');
		citySelectDiv.style.float = "left";
		var citySelect = document.createElement('select');
		citySelect.style.cssText = 'cursor: pointer;width: 140px;border: 1px solid #e4e4e4;font-size: 14px;color: #353535;height: 20px;padding:1px 2px;';
		citySelect.id = "city";
		citySelect.value = cityValue;
		citySelectDiv.appendChild(citySelect);
		homeTownSelectDiv.appendChild(homeTownTitle);
		homeTownSelectDiv.appendChild(provinceSelectDiv);
		homeTownSelectDiv.appendChild(citySelectDiv);
		

		var isAliveChooseDiv = document.createElement('div');
		isAliveChooseDiv.style.cssText = 'width:100%;float: left;margin-bottom: 8px;font-size: 14px;color: #6e6e6e;line-height: 19px';
		isAliveChooseDiv.innerHTML = '<table cellspacing="0" cellpadding="0" border="0">' + '<tbody><tr>' + '<td width="6"><input height="5" type="radio" name="isAlive" id="living" value="true"></td>' + '<td width="3"></td>' + '<td><label id="" for="living" class="">健在</label></td>' + '<td width="35"></td>' + '<td width="6"><input type="radio" name="isAlive" id="deceased" value="false"></td>' + '<td width="3"></td>' + '<td><label id="" for="deceased" class="">已故</label></td>' + '</tr></tbody></table>';

		var emailAccountDiv = document.createElement('div');
		emailAccountDiv.style.cssText = 'float: left;min-width: 100%;margin-bottom: 12px;margin-right: 15px;';
		var emailAccountTitle = document.createElement('div');
		emailAccountTitle.style.cssText = 'font-size: 14px;color: #6e6e6e;line-height: 19px';
		emailAccountTitle.innerHTML = "电子邮件地址：";
		var emailAccountInput = document.createElement('input');
		emailAccountInput.id = "emailaccount";
		emailAccountInput.value = psdesc["email"];
		emailAccountInput.style.cssText = 'width: 140px;border: 1px solid #e4e4e4;font-size: 14px;color: #353535;height: 20px;padding:1px 2px;';
		var emailAccountInputDiv = document.createElement('div');
		emailAccountInputDiv.appendChild(emailAccountInput);
		emailAccountDiv.appendChild(emailAccountTitle);
		emailAccountDiv.appendChild(emailAccountInputDiv);

		var isConfirmDiv = document.createElement('div');
		isConfirmDiv.style.cssText = 'float: right;margin-bottom: 12px;font-size: 16px;';
		isConfirmDiv.innerHTML = '<table cellspacing="0" cellpadding="0" border="0">' + '<tbody><tr>' + '<td><label style="cursor:pointer" id="edit" class="">编辑</label></td>' + '<td width="15"></td>' + '<td><label style="cursor:pointer" id="cancel" class="">取消</label></td>' + '</tr></tbody></table>';

		mainContainer.appendChild(formDiv);
		formDiv.appendChild(headerDiv);
		formDiv.appendChild(formContent);
		formContent.appendChild(form);
		form.appendChild(contentDiv);
		contentDiv.appendChild(fNameDiv);
		contentDiv.appendChild(sNameDiv);
		contentDiv.appendChild(appellationDiv);
		contentDiv.appendChild(clearDiv);
		contentDiv.appendChild(homeTownSelectDiv);
		contentDiv.appendChild(isAliveChooseDiv);
		contentDiv.appendChild(emailAccountDiv);
		contentDiv.appendChild(isConfirmDiv);

//		var hometownValue = psdesc.hometown.split('-');
		var provinceValue = psdesc.province;
		var cityValue = psdesc.city;
		addressInit('province', 'city',provinceValue,cityValue);
		var isAliveValue = psdesc.isalive;
		$('input[type=radio][name=isAlive][value='+isAliveValue+']').attr('checked','true');
		// var temp = $("input[type=radio][name=isAlive][checked=true]");
		initPersonPanelDivListeners(formDiv);
	}

	/**
	 * 添加个人信息Form监听器，响应修改成员信息，利用ajax操作后台数据库
	 * @method 方法名
	 * @for 所属类名
	 * @param {参数类型} 参数名 参数说明
	 * @return {返回值类型} 返回值说明
	 */
	function initPersonPanelDivListeners(personPanelDiv){
		var editElement = document.getElementById('edit');
		var cancelElement = document.getElementById('cancel');
		EventUtil.addHandler(editElement, 'click', function(event) {
			var fistName = document.getElementById('fname').value;
			var secondName = document.getElementById('sname').value;
			var name = fistName + secondName;
//			修改名字
			var $textElement = $('text[nodeid='+targetId+'][id=nodename]');

			// update db person data
			// .....
			var appel = document.getElementById('appellation').value;
			var province = document.getElementById('province').value;
			var city = document.getElementById('city').value;
			//  or $('input:radio:checked').attr('value');
			// var isAliveGroup = document.getElementsByName('isAlive');
			var isAliveValue = $('input:radio:checked').attr('value');
			// for (var i=0; i<isAliveGroup.length; i++){
				// var isAliveRadio = isAliveGroup[i];
				// if (isAliveRadio.checked){
					// alert(isAliveRadio.value);
					// isAliveValue = isAliveRadio.value;
					// break;
				// }
			// }

			targetNode.psdesc['fname'] = fistName;
			targetNode.psdesc['sname'] = secondName;
			targetNode.psdesc['appellation'] = appel;
			targetNode.psdesc['province'] = province;
			targetNode.psdesc['city'] = city;
			targetNode.psdesc['isalive'] = isAliveValue;
//			alert(targetNode.psdesc['sex']);
			$.ajax({
				url : "modifyNode.action",
				type : "post", 
				data: decodeURIComponent($.param({	
					"member.id" : targetId,
					"member.fname" : fistName,
					"member.sname" : secondName,
					"member.appellation" : appel,
					"member.province" : province,
					"member.city" : city,
					"member.sex" : targetNode.psdesc['sex'],
					"member.isalive" : isAliveValue,
					"member.ngeneration" : 1,
					})),
				success : function (data, textStatus){		
					alert("修改成功");
					$textElement.text(name);
					}, 
				error : function (xhr, textStatus){
					alert("出错！");
				}
			});
			
			mainContainer.removeChild(personPanelDiv);
		});
		EventUtil.addHandler(cancelElement, 'click', function(event) {
			mainContainer.removeChild(personPanelDiv);
		});
	}
	
	/**
	 * 弹出上传图片界面
	 * @method 方法名
	 * @for 所属类名
	 * @param {参数类型} 参数名 参数说明
	 * @return {返回值类型} 返回值说明
	 */
	function popUpLoadImageDiv(clickEvent) {
		var targetImage = clickEvent.target;
		var targetId = targetImage.getAttribute("nodeid");
		targetNode = myFamilyTree.nDatabaseNodes[targetId];
		
		// var embed = document.createElement('embed');
		// embed.style.zindex = "1103";
		// embed.style.position = "absolute";
		// embed.style.top = "50%";
		// embed.style.right = "1%";
		// embed.width = "100%";
		// embed.height = "600px";
		// embed.type = "text/html";
		// embed.src = "pictureupload/index.html";
		// // embed.setAttribute("picpath",targetImage.getAttribute('xlink:href'));
		// mainContainer.appendChild(embed);

		var imgCropDiv = document.getElementById('imgCropBox');
		imgCropDiv.setAttribute("nodeIndex",targetId);
//		imgCropDiv.setAttribute("targetImage",targetImage);
		imgCropDiv.style.display = "block";

		// 关闭弹出embed.————可以将其抽取出来写成组件
		var closeBt = document.createElement('a');
		//closeBt.id = "globalCloseBt";
		closeBt.id = "closebt_cropbox";
		closeBt.style.zindex = "1104";
		closeBt.style.position = "absolute";
		// closeBt.style.float = "right";
		closeBt.style.margin = "100px 100px 0 0";
		closeBt.style.top = "0px";
		closeBt.style.right = "0px";
		closeBt.style.fontsize = "88px";
		closeBt.style.cursor = "pointer";
		closeBt.style.disabled = "true";
		closeBt.innerHTML = "关闭";
		document.body.appendChild(closeBt);
		EventUtil.addHandler(closeBt,"click",function(event){
			// 将截图的图片展示为头像
			var headImg = document.getElementById('headImg');
			if (headImg){
				targetImage.setAttribute("xlink:href",headImg.src);
			}
			imgCropDiv.style.display = "none";
			document.body.removeChild(closeBt);
		});
		// var image = $('img-preview preview-lg > img');
        // alert(image.val());
	}

	/**
	 * 给家族树组件添加监听器：拖拽，添加新成员，修改成员信息，上传头像，查看家族树分支
	 */
	EventUtil.addHandler(myTreeEle, "mousewheel", zoomViaMouseWheel);
	// EventUtil.addHandler(element, "click", zoomViaClick);
	EventUtil.addHandler(myTreeEle, "mouseup", dragHandler);
	EventUtil.addHandler(myTreeEle, "mousemove", dragHandler);
	EventUtil.addHandler(myTreeEle, "mousedown", dragHandler);
	// 添加新成员Bt
	var addBtList = $('.addbt');
	// alert(rectList.length);
	for (var i = 0; i < addBtList.length; i++) {
		var addBt = addBtList[i];
		EventUtil.addHandler(addBt, "click", popAdditionChooseDiv);
	}
	// 修改个人信息
	var nodeRectList = myTreeEle.getElementsByTagName('rect');
	for (var i = 0; i < nodeRectList.length; i++) {
		var nodeRect = nodeRectList[i];
		EventUtil.addHandler(nodeRect, 'dblclick', popPersonPanelDiv);
	}
	// 家谱分支
	var branchBtList = $('.branchbt');
	for (var i = 0; i < branchBtList.length; i++) {
		var branchBt = branchBtList[i];
		EventUtil.addHandler(branchBt, "click", function(event){
			var nodeIndex = event.target.getAttribute('nodeindex');
			targetNode = myFamilyTree.showNodeList[nodeIndex];
			// alert(nodeIndex);
			// alert(myFamilyTree.showNodeList.length);
			var root = targetNode;
			// 找出家谱分支的根节点
			if (root.hasParents()){
				while (root.hasParents()){
					root = root.nodeParents["father"];
				}
				myFamilyTree.root = root;
				var myTreeDiv = document.getElementById('myTreeContainer');
				var FamilyTree = myFamilyTree.constructor;
				// showTree(myTreeDiv,myFamilyTree)  myTreeDiv才是divcontainer 而非myTreeEle
				FamilyTree.showTree(myTreeDiv,myFamilyTree);
			}
			return;
		});
	}
	// 上传头像
	var uploadImageList = myTreeEle.getElementsByTagName('image');
	for (var i = 0; i < uploadImageList.length; i++) {
		var uploadImage = uploadImageList[i];
		EventUtil.addHandler(uploadImage, 'dblclick', popUpLoadImageDiv);
	}

	if (myTreeEle.namespaceURI != "http://www.w3.org/2000/svg") // Alert the user if their browser does not support SVG.
		alert("Inline SVG in HTML5 is not supported. This document requires a browser that supports HTML5 inline SVG.");
	// element.setAttribute('viewBox', "0 0 " + svgViewBoxWidth + " " + svgViewBoxHeight);	
}