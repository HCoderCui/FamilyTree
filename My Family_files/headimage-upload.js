$(window).load(function() {
	var options =
	{
		thumbBox: '.thumbBox',
		spinner: '.spinner',
		imgSrc: 'resources/images/man.png'
	}
	// options.imgSrc = document.parentNode.getAttribute('xlink:href');
	var cropper = $('.imageBox').cropbox(options);
	$('#upload-file').on('change', function(){
		$('#btnCrop').attr("disabled",false);
		var reader = new FileReader();
		reader.onload = function(e) {
			options.imgSrc = e.target.result;
			cropper = $('.imageBox').cropbox(options);
		}
		reader.readAsDataURL(this.files[0]);
		// alert(this.files.length);
		this.files = [];
	})
	$('#btnCrop').on('click', function(){
		var img = cropper.getDataURL();
		$('#btnUpLoad').attr("disabled",false);
		$('.cropped').html('');
		$('.cropped').append('<img id="headImg" src="'+img+'" align="absmiddle" style="width:64px;height:64px;margin-top:4px;box-shadow:0px 0px 12px #7E7E7E;" ><p>64px*64px</p>');
		// $('.cropped').append('<img src="'+img+'" align="absmiddle" style="width:64px;margin-top:4px;border-radius:64px;box-shadow:0px 0px 12px #7E7E7E;" ><p>64px*64px</p>');
		// $('.cropped').append('<img src="'+img+'" align="absmiddle" style="width:128px;margin-top:4px;border-radius:128px;box-shadow:0px 0px 12px #7E7E7E;"><p>128px*128px</p>');
		// $('.cropped').append('<img src="'+img+'" align="absmiddle" style="width:180px;margin-top:4px;border-radius:180px;box-shadow:0px 0px 12px #7E7E7E;"><p>180px*180px</p>');
	})
	$('#btnUpLoad').on('click', function(){
		var imgSrc = $('#headImg').attr("src");
		var imgbase64 = imgSrc.split(",")[1];
//		alert(imgbase64);
		var imgCropDiv = document.getElementById('imgCropBox');
		var nodeIndex = imgCropDiv.getAttribute("nodeIndex");

		$.ajax({
			url : "familyTree/uploadheadimage",
			type : "POST", 
			contentType: "application/json",
			data: JSON.stringify({"base64String":imgbase64,"nodeIndex":nodeIndex}),
			success : function(data, textStatus){	
//				alert("OK");
				var headimageUrl = data;
				var element = document.getElementById("closebt_cropbox");
//				一个兼容性所有浏览器的版本,事件主动派发器
				var dispatch = window.addEventListener ? 
						function(el, type){ 
							try{ 
								var evt = document.createEvent('Event'); 
								evt.initEvent(type,true,true); 
								el.dispatchEvent(evt); 
								}
							catch(e){
								alert(e);
								}
							} : 
						function(el, type){ 
								try{ 
									el.fireEvent('on'+type); 
								}
								catch(e){
									alert(e);
									} 
							} ; 
				dispatch(element,"click");
//				var targetImage = $("image[nodeid='"+nodeIndex+"']");
//				targetImage.setAttribute("xlink:href",headimageUrl);
//				imgCropDiv.style.display = "none";
			},
			error: function(response){
				alert(JSON.stringify(response));
			},
//			dataType: 'json'
		});
//		var targetImage = imgCropDiv.getAttribute("targetImage");
//		targetImage.setAttribute("xlink:href",imgSrc);
//		imgCropDiv.style.display = "none";
	})
	$('#btnZoomIn').on('click', function(){
		cropper.zoomIn();
	})
	$('#btnZoomOut').on('click', function(){
		cropper.zoomOut();
	})
});