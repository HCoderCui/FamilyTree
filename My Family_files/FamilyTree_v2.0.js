/*-------------------------------------------------------------------------------------------
|     FamilyTree.js
\------------------------------------------------------------------------------------------*/
'use strict';

/**
 * 家庭树节点，存储单个节点相关信息，以后将对其封装，隐藏信息
 * @class FamilyNode
 * @constructor FamilyNode(id,gid,psdesc)
 */
(function invocation(){
	
var FamilyNode = function(id, gid, psdesc, leveln) {
	/**
	 * @property
	 * id--编号
	 * gid--组号,标记属于哪个子树
	 * psdesc--个人信息
	 * Xposition Yposition--节点在SVG上的 X Y 坐标
	 * spouse--配偶节点(指针)
	 * nodeParents--父母节点集
	 * nodeChildren--节点的孩子节点数组
	 * nextSibli--节点的兄弟(姐妹)节点(指针)，不包括妻子节点
	 * level--所属层数(第几代)
	 * isVisited--是否遍历过
	 */
	this.id = id;
	this.gid = gid;
	this.psdesc = psdesc;
	this.levelNum = leveln;
	// this.siblingIndex = 0;
	this.dbIndex = 0;
	this.showNodesIndex = 0;
	this.collapsedNodesIndex = 0;	

	this.Xposition = 0;
	this.Yposition = 0;
	this.spouse = null;
	this.nodeParents = {
		"father": null,
		"mother": null
	};
	this.nodeChildren = [];
	this.nextSibli = null;
	this.isVisited = false;
	this.hasBranch = false;
}

FamilyNode.prototype.hasBranch = function(){
	return this.nodeParents['father'] != null;
}

FamilyNode.prototype.hasParents = function(){
	return this.nodeParents['father'] != null;
}

FamilyNode.prototype.hasSpouse = function(){
	return this.spouse != null;
}

FamilyNode.prototype.isOnlyChild = function() {
	// alert(this.nodeParents["father"].id);
	return (this.nodeParents["father"].getNodeChildrenNum() == 1);
}

FamilyNode.prototype.getNodeChildrenNum = function() {
	return this.nodeChildren.length;
}

FamilyNode.prototype.getFirstChild = function() {
	return this.nodeChildren[0];
}
FamilyNode.prototype.getLastChild = function() {
	return this.nodeChildren[this.nodeChildren.length - 1];
}

/**
 * 家庭树对象(存储数据)，存储所有节点的数据信息，与外界交互(能访问)的唯一对象
 * @class FamilyTree
 * @constructor FamilyTree()
 */
var FamilyTree = function() {
	/**
	 * @property
	 * config--在SVG画树的基本配置信息
	 * levelSeparation--层间节点Y方向距离
	 * siblingSeparation--相邻节点间X方向距离
	 * addIconHeight--节点下方三角形按钮的高度
	 * Scaling--节点缩放倍数
	 * render--节点渲染方式，默认为SVG
	 * defaultNodeWide defaultNodeHeight--节点默认的宽和高
	 * XSeparation YSeparation--画笔起始点X Y方向实际距离
	 * Xposition Yposition--画笔当前位置
	 * rightLimitXPosition--当前子树右界线，用于确定下一子树的起始X位置
	 * currentlevel--当前层(代)数
	 * width height--控制呈现树的SVG宽高，覆盖全部节点和连线
	 * nDatabaseNodes--存储所有节点的数组
	 * showNodeList--存储显示节点的数组
	 * collapsedNodeList--存储可展开节点的数组
	 * root--根节点指针，树遍历入口，非实际节点
	 * selectedNodeId--当前被选中的节点id
	 * linksPath--画连线的 svg path 代码
	 * 
	 */

	this.config = {
		levelSeparation: 28,
		siblingSeparation: 20,

		defaultNodeWide: 100,
		defaultNodeHeight: 46,

		linkColor: "black",
		nodeColor: "blue",
		nodeBorderColor: "black",
		Scaling: 1.0,

		defaultrender: "SVG"
	};

	this.XSeparation = this.config.siblingSeparation + this.config.defaultNodeWide;
	this.YSeparation = this.config.levelSeparation + this.config.defaultNodeHeight;
	this.Xposition = 1;
	this.Yposition = 1;
	// this.rightLimitXPosition = 1;

	// this.obj = obj;
	// this.elm = document.getElementById(elm);
	// this.self = this;
	this.currentlevel = 0;
	// this.translateX = 100;
	// this.translateY = 60;
	this.width = 0;
	this.height = 0;

	this.linksPath = [];
	this.nDatabaseNodes = {};
	this.showNodeList = [];
	this.collapsedNodeList = [];

	this.root = null;
	this.selectedNodeId = -1;

}

/**
 * 将新节点加入到树上，建立联系
 * @method addNode
 * @param {参数类型} id gid psdesc leveln-节点所属第几代(层) 参数说明
 */

FamilyTree.prototype.addNode = function(id, gid, psdesc) {
	// 由gid 确定目标节点
	var targetNode = this.nDatabaseNodes[gid];
//	for (var k = 0; k < this.nDatabaseNodes.length; k++) {
//		if (this.nDatabaseNodes[k] == null) continue;
//		if (gid == this.nDatabaseNodes[k].id) {
//			targetNode = this.nDatabaseNodes[k];
//			break;
//		}
//	}
	// var leveln = targetNode.levelNum;
	switch (psdesc.nodetype) {
		case "parent":
			var fatherDesc = psdesc.fatherDesc;
			var motherDesc = psdesc.motherDesc;
			// gid为-1
			var fatherNode = new FamilyNode(id, -1, fatherDesc);

			//添加到Tree的node数组上 
			var i = this.nDatabaseNodes.length;
			this.nDatabaseNodes[i] = fatherNode;
	
			var motherNode = new FamilyNode(id + 1, gid, motherDesc);
			// 放入母节点到总数组
			var i = this.nDatabaseNodes.length;
			this.nDatabaseNodes[i] = motherNode;
			// targetNode添加到父母节点children数组
			fatherNode.nodeChildren[0] = targetNode;
			motherNode.nodeChildren = fatherNode.nodeChildren;
			// 添加targetNode的父母节点
			targetNode.nodeParents["father"] = fatherNode;
			targetNode.nodeParents["mother"] = motherNode;
			// 添加couple关系
			fatherNode.spouse = motherNode;
			motherNode.spouse = fatherNode;
			// 修改孩子节点的gid属性为父节点id
			targetNode.gid = fatherNode.id;
			this.root = fatherNode;
			break;

		case "sibling":
			var siblingDesc = psdesc.siblingDesc;
			var siblingNode = new FamilyNode(id, gid, siblingDesc);
//			var i = this.nDatabaseNodes.length;
			this.nDatabaseNodes[id] = siblingNode;
			// node添加到父母节点的children数组
			var j = targetNode.nodeParents["father"].getNodeChildrenNum();
			targetNode.nodeParents["father"].nodeChildren[j] = siblingNode;
			// 添加父母节点
			siblingNode.nodeParents = targetNode.nodeParents;

			// 兄弟节点指针
			while (targetNode.nextSibli != null) {

				targetNode = targetNode.nextSibli;

			}
			// alert(targetNode.id);
			targetNode.nextSibli = siblingNode;
			break;

		case "child":
			var childDesc = psdesc.childDesc;
			var childNode = new FamilyNode(id, gid, childDesc);

			//添加到Tree的node数组上 
//			var i = this.nDatabaseNodes.length;
			// node.dbIndex = i;
			this.nDatabaseNodes[id] = childNode;
			// 添加子女节点
			var j = targetNode.getNodeChildrenNum();
			targetNode.nodeChildren[j] = childNode;
			// alert(targetNode.getNodeChildrenLength());
			// 有兄弟节点，则上一个兄弟节点指向node
			if (j - 1 >= 0) {
				var nodeLastChild = targetNode.nodeChildren[j - 1];
				nodeLastChild.nextSibli = childNode;
				// 给node添加父母节点,与兄弟节点指向同一组父母节点
				childNode.nodeParents = nodeLastChild.nodeParents;
			} else {
				// 没有兄弟节点
				// 给node添加父母节点
				var nodeParents = {};
				if (targetNode.psdesc.sex == "男") {
					nodeParents["father"] = targetNode;
					nodeParents["mother"] = targetNode.spouse;
				} else {
					nodeParents["mother"] = targetNode;
					nodeParents["father"] = targetNode.spouse;
				}
				childNode.nodeParents = nodeParents;
			}
			break;

		case "spouse":
			var spouseDesc = psdesc.spouseDesc;
			var spouseNode = new FamilyNode(id, gid, spouseDesc);

			//添加到Tree的node数组上 
//			var i = this.nDatabaseNodes.length;
			this.nDatabaseNodes[id] = spouseNode;

			targetNode.spouse = spouseNode;
			spouseNode.spouse = targetNode;

			targetNode.spouse.nodeChildren = targetNode.nodeChildren = [];
			break;
	}	
}

FamilyTree.prototype.positionChildrenNodes = function(node) {
	if (node.nodeParents['father'] && node.isOnlyChild()){
		this.Xposition += this.XSeparation/2;
	}
	if (node.getNodeChildrenNum() == 0) {
		// this.showNodeList.push(node);
		var j = node.showNodesIndex = this.showNodeList.length;
		this.showNodeList[j] = node;
		// 遍历树到了底层，确定节点X Y坐标
		node.Xposition = this.Xposition;
		node.Yposition = this.Yposition;
		// 更新画笔起始点
		this.Xposition = node.Xposition + this.XSeparation;
		// position link -- 叶子节点上的"|"
		var linkX = node.Xposition + this.config.defaultNodeWide / 2;
		var linkY = node.Yposition;
		this.linksPath.push("M" + linkX + " " + linkY + " L" + linkX + " " + (linkY - this.config.levelSeparation / 2));
		return;
		// this.rightLimitPosition = this.Xposition;
	} else {
		// 遍历到下一层，Yposition递增
		this.Yposition += this.YSeparation;
		this.positionNodes(node.getFirstChild());
		// set the whole tree's height
		// 记录树的最深的Y坐标
		if (this.height < this.Yposition)
			this.height = this.Yposition;
	}
}

FamilyTree.prototype.positionSelfNode = function(node) {
	if (node.getNodeChildrenNum() > 0) {
		// this.showNodeList.push(node);
		var j = node.showNodesIndex = this.showNodeList.length;
		this.showNodeList[j] = node;
		// 确定父节点坐标位置
		this.Yposition -= this.YSeparation;
		node.Yposition = this.Yposition;

		var firstChild = node.getFirstChild();
		var lastChild = node.getLastChild();
		var firstChildXposition = firstChild.Xposition;
		var lastChildXposition = lastChild.Xposition;
		// 父母节点居中
		node.Xposition = (firstChildXposition + lastChildXposition - this.XSeparation) / 2;


		// position link -- 父母节点与孩子节点之间的连线
		// 竖
		var	linkX = node.Xposition + this.config.defaultNodeWide + this.config.siblingSeparation / 2;
		var	linkY = node.Yposition + this.config.defaultNodeHeight / 2;
		this.linksPath.push("M" + linkX + " " + linkY + " L" + linkX + " " + (linkY + this.YSeparation / 2));
		// 横
		linkX = firstChildXposition + this.config.defaultNodeWide / 2;
		linkY = linkY + this.YSeparation / 2;
		this.linksPath.push("M" + linkX + " " + linkY + " L" + (lastChildXposition + this.config.defaultNodeWide / 2) + " " + linkY);

		// 父节点上的"|"
		// if (node!==this.root){
		linkX = node.Xposition + this.config.defaultNodeWide / 2;
		linkY = node.Yposition;
		this.linksPath.push("M" + linkX + " " + linkY + " L" + linkX + " " + (linkY - this.config.levelSeparation / 2));
		// }	
	}
	// 父节点的配偶坐标位置
	var spouseNode = node.spouse;
	if (spouseNode != null) {
		// this.showNodeList.push(node.spouse);
		// 展示节点组
		var j = spouseNode.showNodesIndex = this.showNodeList.length;
		this.showNodeList[j] = spouseNode;

		this.collapsedNodeList.push(spouseNode);
		spouseNode.Xposition = node.Xposition + this.XSeparation;
		spouseNode.Yposition = node.Yposition;
		// 更新右边相邻节点的起始Xposition,即右边线
		var spouseRLP = spouseNode.Xposition + this.XSeparation;
		if (spouseRLP > this.Xposition)
				this.Xposition = spouseRLP;	

		// position link -- 配偶之间的连线
		var linkX = node.Xposition + this.config.defaultNodeWide;
		var linkY = node.Yposition + this.config.defaultNodeHeight / 2;
		this.linksPath.push("M" + linkX + " " + linkY + " L" + (linkX + this.config.siblingSeparation) + " " + linkY);
	}
	return;
}

FamilyTree.prototype.positionSpouseBranch = function(node){
	var spouseNode = node.spouse;
}

FamilyTree.prototype.positionSiblingNodes = function(node) {
	node = node.nextSibli;
	if (node != null) {
		this.positionNodes(node);
	}
	return;
}

FamilyTree.prototype.positionNodes = function(node) {
	// 孩子节点
	this.positionChildrenNodes(node);
	// 自身节点
	this.positionSelfNode(node);
	// 伴偶分支节点
	this.positionSpouseBranch(node);
	// 同辈(兄弟)节点
	this.positionSiblingNodes(node);
}

FamilyTree.prototype.positionTree = function(node){
	// reset showNodeList collapsedNodeList
	this.showNodeList = [];
	this.collapsedNodeList = [];
	this.positionNodes(node);
	this.width = this.Xposition;
	this.height += this.config.defaultNodeHeight + this.config.levelSeparation;
}

FamilyTree.prototype.drawTree = function() {
	var s = [];
	// alert(this.width + ',' + this.height);
	s.push('<svg id="familyTreeSVG" cursor="move" overflow="hidden" style="position:absolute;transform: translate(30px,30px);">');
	// alert('<svg id="familyTreeSVG" cursor="move" overflow="hidden"' + 'width="' + this.width + '" height="' 
	// 	+ this.height + '" style="position:absolute;transform: translate(' + this.translateX + 'px,' 
	// 	+ this.translateY + 'px);"' + ' viewBox="0,0,' + this.width + ',' + this.height + '">');
	// 画links
	var path = '<path stroke-width:1 stroke="rgb(88, 88, 87)" d="' + this.linksPath.join(' ') + ' Z"/>';
	s.push(path);
	s.push('<g>');
	// s.push('<g currentScale="'+ this.config.Scaling +'" id="FamilyTree">');
	for (var k = 0; k < this.showNodeList.length; k++) {
		var node = this.showNodeList[k];
//		if (node == null || node.psdesc == null) continue;
		// 添加Icon
		var addIconHalfSide = 8;
		var addIconX = node.Xposition + this.config.defaultNodeWide/2;
		var addIconY = node.Yposition + this.config.defaultNodeHeight;
		var addIconHeight = 6;
		// 添加符号'+'
		var addSymbolHalfLen = 3;
		s.push('<path class="addbt" nodeid="'+ node.id
			+'" stroke-width:1 stroke="rgb(0, 0, 0)" cursor="pointer" fill="rgb(256,256,256)" d="M'
			+(addIconX-addIconHalfSide)+" "+addIconY+' L'+(addIconX-2)+" "+(addIconY+addIconHeight)
			+' L'+(addIconX+2)+" "+(addIconY+addIconHeight)+' L'+(addIconX+addIconHalfSide)+" "+addIconY
			// "+"符号
			+' M'+(addIconX-addSymbolHalfLen)+" "+(addIconY+addSymbolHalfLen)+' L'
			+(addIconX+addSymbolHalfLen)+" "+(addIconY+addSymbolHalfLen)
			+' M'+(addIconX)+" "+(addIconY)+' L'+addIconX+" "+(addIconY+addSymbolHalfLen*2)
			+'Z"/>');
		var nodeColor = null;
		var imghref = null;
		if (node.psdesc.pathHeadPicture != ""){
			imghref = node.psdesc.pathHeadPicture;
			if (node.psdesc.sex == "男"){
				nodeColor = "#9FD5EB";
			}
			else {
				nodeColor = "#F5B8DB";
			}
		} else {
		if (node.psdesc.sex == "男"){
			nodeColor = "#9FD5EB";
			imghref = "resources\\images\\man.png";
		}
		else {
			nodeColor = "#F5B8DB";
			imghref = "resources\\images\\woman.png"
		}
		}
		s.push('<g>');
		// 圆角矩形
		s.push('<rect cursor="pointer" nodeid="' + node.id + '" x=' + node.Xposition + ' y=' + node.Yposition 
			+ ' width="' + this.config.defaultNodeWide + '" height="' + this.config.defaultNodeHeight 
			+ '"rx="5" ry="5"' + '" style="fill:' + nodeColor + ';stroke-width:1;stroke:rgb(0,0,0)"/>');
		// 添加头像
		var offserLeft = node.Xposition + 3;
		var offserTop = node.Yposition + 3;
		var imgw = 30;
		var imgh = 40;
		s.push('<image nodeid="'+ node.id +'" cursor="pointer" x="' + offserLeft + '" y="' + offserTop + '" width="' + imgw + '" height="' + imgh
			+ '" xlink:href="' + imghref + '"></image>');
		// text
		var psdesc = node.psdesc;
		var fontsize1 = 10;
		var fontsize2 = 5;
		var textX = offserLeft + imgw + 3;
		var textY = offserTop + fontsize1; 
		s.push('<text id="nodename" nodeid="' + node.id + '" x="'+ textX +'" y="'+ textY +'" font-size="'+ fontsize1 +'px">'+ psdesc.fname+psdesc.sname+'</text>');
		s.push('<text onclick="inviteMember(this);" data-email ="'+ psdesc["email"] +'" cursor="pointer" onmouseover="this.style.fill=\'red\'" onmouseout="this.style.fill=\'black\'" x="'+ (textX+fontsize2) +'" y="'+ (offserTop+imgh-fontsize2) +'" font-size="'+ fontsize2 +'px" font-color="#000">'+ "邀请" +'</text>');
		s.push('</g>');
		
	}
	for (var j = 0; j < this.collapsedNodeList.length; j++){
		
		var collapsedNode = this.collapsedNodeList[j];
//		if (collapsedNode == null || collapsedNode.psdesc == null) continue;
		var ixcoordinate = collapsedNode.Xposition + this.config.defaultNodeWide - this.config.defaultNodeWide/5;
		var iycoordinate = collapsedNode.Yposition + this.config.defaultNodeHeight;
		var excoordinate = ixcoordinate;
		var eycoordinate = iycoordinate + 3;
		var recthalflen = this.config.levelSeparation/3;
		var nodeColor = null;
		if (collapsedNode.psdesc.sex == "男"){
			nodeColor = "#9FD5EB";
		}
		else {
			nodeColor = "#F5B8DB";
		}
		s.push('<path nodeindex="'+collapsedNode.showNodesIndex+'" class="branchbt" cursor="pointer" d="M'+ixcoordinate+' '+iycoordinate+' L'+excoordinate+' '+eycoordinate
			+' L'+(excoordinate-recthalflen)+' '+eycoordinate
			+' L'+(excoordinate-recthalflen)+' '+(eycoordinate+recthalflen)
			+' L'+(excoordinate+recthalflen)+' '+(eycoordinate+recthalflen)
			+' L'+(excoordinate+recthalflen)+' '+eycoordinate
			+' L'+excoordinate+' '+eycoordinate
			+' Z" style="fill:'+nodeColor+';stroke:black;stroke-width:0.5"/>');
	}
	s.push('</g>');
	s.push('</svg>');

	return s.join('');
}

FamilyTree.prototype.resetTreeAttr = function(){
	
	this.Xposition = 1;
	this.Yposition = 1;
	// this.rightLimitPosition = 0;

	this.translateX = 100;
	this.translateY = 60;
	this.width = 0;
	this.height = 0;

	this.linksPath = [];
	// this.showNodeList = [];
	// this.collapsedNodeList = [];
	// this.nDatabaseNodes = [];
}

FamilyTree.prototype.Initial = function(datas) {
//	初始成员
	var iInfo = datas[0]["memberInfo"];
	var iNodeIndex = iInfo["nodeIndex"];
	var iNode = new FamilyNode(iNodeIndex,-1,iInfo,0);
	this.root = iNode;
	this.nDatabaseNodes[iNodeIndex] = iNode;

	for (var i = 1; i< datas.length; i++){
		var tempData = datas[i]; 
		var tempPsdesc = {};
		var nodeType = tempData["nodeType"];
		if (nodeType == "father" || nodeType == "mother"){
			tempPsdesc["nodetype"] = "parent";
			tempPsdesc[nodeType + "Desc"] = tempData["member"];
			var nextData = datas[i+1];
			tempPsdesc[nextData["nodeType"] + "Desc"] = nextData["member"];
			i = i + 1; 
		}else{
			tempPsdesc["nodetype"] = nodeType;
			tempPsdesc[nodeType + "Desc"] = tempData["memberInfo"];
		}
		this.addNode(tempData["newNodeIndex"],tempData["operdNodeIndex"],tempPsdesc);
	}
//	var parentPsdesc = {
//		nodetype : "parent",
//		fatherDesc : fatherInfo,
//		motherDesc : motherInfo
//	};
//	this.addNode(1,0,parentPsdesc);
	
}

FamilyTree.showTree = function(container,mytree) {
	mytree.positionTree(mytree.root);
	// alert(mytree.width + ',' + mytree.height);
	container.innerHTML = mytree.drawTree();

	var myTreeSVG = document.getElementById("familyTreeSVG");
	myTreeSVG.setAttribute('width',mytree.width);
	myTreeSVG.setAttribute('height',mytree.height);
	myTreeSVG.setAttribute('viewBox','0,0,' +mytree.width+','+mytree.height);

	InitTreeListeners(myTreeSVG,mytree);
	mytree.resetTreeAttr();
}

$("#familytree").click(function(){
	
	function getCookie(c_name)
	{
		if (document.cookie.length>0)
		{ 
			var c_start = document.cookie.indexOf(c_name + "=")
			if (c_start!=-1)
			{ 
				c_start=c_start + c_name.length+1 
				var c_end = document.cookie.indexOf(";",c_start)

				if (c_end==-1) c_end=document.cookie.length
				return unescape(document.cookie.substring(c_start,c_end))
			} 
		}
		return ""
	}

	var account = getCookie("account");
//	alert(account);
	
	$.get("familyTree",
			function(data){
				$("#myTreeContainer").append(JSON.stringify(data) + "<br />");
				
				var myFamilyTree = new FamilyTree();
				myFamilyTree.Initial(data);
				var myTreeDiv = document.getElementById('myTreeContainer');
				FamilyTree.showTree(myTreeDiv,myFamilyTree);
			},
			"json");
});

})();

