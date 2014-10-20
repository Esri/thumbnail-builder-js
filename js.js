/*global require*/
require([
  "dojo/ready",
  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/dom-style",
  "dojo/_base/array",
  "dijit/registry",
  "dojo/on",
  "dojo/query",
  "dojo/dom-prop",
  "dojo/io-query",
  "esri/arcgis/Portal",
  "esri/config",
  "esri/lang",
  "esri/IdentityManager",
  "dojo/_base/lang",
  "dojox/lang/aspect",
  "esri/config",
  "esri/request",
  "dojo/promise/all",
  "ImageChooser"
], function (
  ready, dom, domAttr, domClass, domConstruct, domStyle, array, registry, on, query, domProp, ioQuery,
  arcgisPortal, config, esriLang, IdentityManager, dojoLang, aspect,
  esriConfig, esriRequest, all, ImageChooser) {

	var portalFG;
	var portalBG;
	var groupFG;
	var groupBG;
	var nextQueryParamsFG;
	var queryParamsFG;
	var nextQueryParamsBG;
	var queryParamsBG;

	var displayOptions = {
		numItemsPerPage: 6,
		defaultBgId: "67fb524bd2e24c80bf2b972b4ce5aa95",
		defaultFgId: "f8836a4c1ca6438a89c5b39dfbd41d42",
		defaultFontSize: 15,
		itemId: null,     // will hold the item id we should update with the generated image
		bgId: null,       // will hold the background group id
		fgId: null,       // will hold the foreground group id
		text: null,       // text string
		textAlign: null,  // text alignment option: left, right, center
		textBB: null,     // text bounding box, comma-delimited string: e.g. x1,y1,x2,y2
		font: null,       // font family string
		fontSize: null,   // font size
		fontColor: null,  // font color hex value - exclude the "#" character as this has meaning in URLs already
		portalUrl: "http://www.arcgis.com"
	};

	var bgImageChooser;


	ready(function () {
		// set config properties and globals
		esriConfig.defaults.io.proxyUrl = "/proxy/proxy.ashx";
		esriConfig.defaults.io.alwaysUseProxy = false;

		portalFG = new arcgisPortal.Portal(displayOptions.portalUrl);
		portalBG = new arcgisPortal.Portal(displayOptions.portalUrl);

		// initialize the UI
		processQueryParameters();
		fillInitialUIValues();
		init();
	});

	function isSet(str) {
		// helper method which determines if a string is defined and is not empty
		return esriLang.isDefined(str) && str.length > 0;
	}

	function processQueryParameters() {
		//      text: null,       // text string
		//      textAlign: null,  // text alignment option: left, right, center
		//      textBB: null,     // text bounding box, comma-delimited string: e.g. x1,y1,x2,y2
		//      font: null,       // font family string
		//      fontSize: null,   // font size
		//      fontColor: null   // font color hex value

		// get groups passed by URL parameter if they are set
		var queryParams = ioQuery.queryToObject(window.location.search.slice(1)),
			itemId = queryParams.itemid,
			bgId = queryParams.bgid,
			fgId = queryParams.fgid,
			text = queryParams.txt,
			textAlign = queryParams.txtAlign,
			textBounds = queryParams.txtBB,
			font = queryParams.font,
			fontSize = queryParams.fontSize,
			fontColor = queryParams.fontColor;
		if (isSet(itemId)) {
			displayOptions.itemId = itemId;
		}
		if (isSet(bgId)) {
			displayOptions.bgId = bgId;
		}
		if (isSet(fgId)) {
			displayOptions.fgId = fgId;
		}
		if (isSet(text)) {
			displayOptions.text = text;
		}
		if (isSet(textAlign)) {
			displayOptions.textAlign = textAlign;
		}
		if (isSet(textBounds)) {
			displayOptions.textBB = textBounds;
		}
		if (isSet(font)) {
			displayOptions.font = font;
		}
		if (isSet(fontSize)) {
			displayOptions.fontSize = fontSize;
		}
		if (isSet(fontColor)) {
			displayOptions.fontColor = fontColor;
		}
	}

	function fillInitialUIValues() {
		if (isSet(displayOptions.text)) {
			domAttr.set(document.getElementById("thumbText"), "value", displayOptions.text);
		}
		if (isSet(displayOptions.textAlign)) {
			var alignMatches = array.filter(document.getElementById("textAlign").options, function (option) {
				return domAttr.get(option, "value").toLowerCase() === displayOptions.textAlign.toLowerCase();
			});
			if (alignMatches.length > 0) {
				domAttr.set(alignMatches[0], "selected", true);
			}
		}
		if (isSet(displayOptions.textBB)) {
			var coords = displayOptions.textBB.split(",");
			if (coords && coords.length === 4) {
				domAttr.set(document.getElementById("x1"), "value", coords[0]);
				domAttr.set(document.getElementById("y1"), "value", coords[1]);
				domAttr.set(document.getElementById("x2"), "value", coords[2]);
				domAttr.set(document.getElementById("y2"), "value", coords[3]);
			}
		}
		if (isSet(displayOptions.font)) {
			var fontMatches = array.filter(document.getElementById("selectedFont").options, function (option) {
				return domAttr.get(option, "value").toLowerCase() === displayOptions.font.toLowerCase();
			});
			if (fontMatches.length > 0) {
				domAttr.set(fontMatches[0], "selected", true);
			}
		}
		if (isSet(displayOptions.fontSize)) {
			// ensure we fall back to default if input fontSize is bad (e.g. not an int)
			try {
				var fs = parseInt(displayOptions.fontSize);
				if (isNaN(fs)) {
					domAttr.set(document.getElementById("fontSize"), "value", displayOptions.defaultFontSize);
				} else {
					domAttr.set(document.getElementById("fontSize"), "value", fs);
				}
			} catch (e) {
				domAttr.set(document.getElementById("fontSize"), "value", displayOptions.defaultFontSize);
			}
		}
	}

	function init() {
		bgImageChooser = new ImageChooser(document.getElementById("bgImageChooser"), "bg-image");

		on(portalBG, "ready", loadPortal);
		on(portalFG, "ready", loadForegrounds);
		on(document.getElementById("nextForegroundButton"), "click", getNextForeground);
		on(document.getElementById("prevForegroundButton"), "click", getPreviousForeground);

		// hitch in JCrop preview for modern browsers
		if (window.FileReader) {
			//on(document.getElementById("foregroundUpload"), "change", readCustomForeground);
			document.getElementById("foregroundUpload").addEventListener("change", readCustomForeground);
		}

		var colorPicker = document.getElementById("colorPicker");

		if (esriLang.isDefined(displayOptions.fontColor)) {
			colorPicker.value = "#" + displayOptions.fontColor;
		}
		//dlgThumbnail.show();

		on(document.getElementById("backgroundUpload"), "change", function () { //uncheck the radio buttons when an image is uploaded
			query(".backgroundGrid").query("input[type=radio]").attr("checked", false);
		});
		on(document.getElementById("foregroundUpload"), "change", function () {
			query(".foregroundGrid").query("input[type=radio]").attr("checked", false);
		});

		aspect.advise(portalFG, "queryItems", {
			afterReturning: function (queryItemsPromise) {
				queryItemsPromise.then(function (result) {
					nextQueryParamsFG = result.nextQueryParams;
					queryParamsFG = result.queryParams;
				});
			}
		});
		aspect.advise(portalBG, "queryItems", {
			afterReturning: function (queryItemsPromise) {
				queryItemsPromise.then(function (result) {
					nextQueryParamsBG = result.nextQueryParams;
					queryParamsBG = result.queryParams;
				});
			}
		});
	}

	function loadPortal() { //loads the thumbnails for the backgrounds
		var params = {
			q: "id:" + (displayOptions.bgId || displayOptions.defaultBgId) //insert group id for background images here
		};
		portalBG.queryGroups(params).then(function (groups) {
			//get group title and thumbnail url
			if (groups.results.length === 1) {
				groupBG = groups.results[0];
				if (groupBG.thumbnailUrl) {
					domConstruct.create("img", {
						src: groupBG.thumbnailUrl,
						width: 64,
						height: 64,
						alt: groupBG.title
					}, document.getElementById("groupThumbnail"));
				}

				document.getElementById("groupTitle").innerHTML = "Thumbnail Maker";

				//Retrieve the web maps and applications from the group and display
				var params = {
					q: " type: Image",
					num: 100 //displayOptions.numItemsPerPage
				};
				groupBG.queryItems(params).then(updateGrid);
			}
		});
	}

	function loadForegrounds() { //loads the thumbnails for the foregrounds
		var params = {
			q: "id:" + (displayOptions.fgId || displayOptions.defaultFgId) //insert group id for foreground images here
		};
		portalFG.queryGroups(params).then(function (groups) {
			//get group title and thumbnail url
			if (groups.results.length === 1) {
				groupFG = groups.results[0];
				if (groupFG.thumbnailUrl) {
					domConstruct.create("img", {
						src: groupFG.thumbnailUrl,
						width: 64,
						height: 64,
						alt: groupFG.title
					}, document.getElementById("groupThumbnailForegrounds"));
				}

				//Retrieve the web maps and applications from the group and display
				var params = {
					q: " type: Image",
					num: displayOptions.numItemsPerPage
				};
				groupFG.queryItems(params).then(updateGridForForegrounds);
			}
		});
	}

	function enableButton(node) {
		domClass.remove(node, "disabled");
		domAttr.set(node, "disabled", false);
	}

	function disableButton(node) {
		domClass.add(node, "disabled");
		domAttr.set(node, "disabled", true);
	}

	function updateGrid(queryResponse) { //for backgrounds
		//update the gallery to get the next page of items

		var items = [];

		//Build the thumbnails for each item the thumbnail when clicked will display the web map in a template or the web application
		queryResponse.results.forEach(function (item) {
			if (item.id) {
				items.push(item);
			}
		});

		bgImageChooser.addImages(items);
	}

	function updateGridForForegrounds(queryResponse) {
		//update the gallery to get the next page of items

		

		var galleryList = document.getElementById("galleryListForeground");
		domConstruct.empty(galleryList);  //empty the gallery to remove existing items

		//navigation buttons
		(queryResponse.results.length < 6) ? disableButton(document.getElementById("nextForegroundButton")) : enableButton(document.getElementById("nextForegroundButton"));
		(queryResponse.queryParams.start > 1) ? enableButton(document.getElementById("prevForegroundButton")) : disableButton(document.getElementById("prevForegroundButton"));

		//Build the thumbnails for each item the thumbnail when clicked will display the web map in a template or the web application
		var frag = document.createDocumentFragment();
		array.forEach(queryResponse.results, function (item) {
			if (item.id) {
				var li = domConstruct.create("li", {}, frag);
				domConstruct.create("label", {
					//href: url,
					className: "foregroundGrid",
					target: "_blank",
					innerHTML: "<div class='imageOption'><img src='" + item.thumbnailUrl + "'/><span id='thumbnailName'>" + item.title + "</span><br /><span><input type='radio' name='rdoThumbFG' value='" + item.itemDataUrl + "'/> <label for='radioOne'></label></span></div>"
				}, li);
				
			}
		});
		domConstruct.place(frag, galleryList);

		// connect fg click events
		query("label.foregroundGrid > div.imageOption > span > input[type='radio']").forEach(function (node) {
			on(node, "click", function (evt) {
				if (evt && evt.target && evt.target.value) {
					query("img.jCropImage").forEach(function (img) {
						domAttr.set(img, "src", evt.target.value);
					});
				}
			});
		});

		
	}

	function getNextForeground(evt) {
		evt.preventDefault(); // don't submit form
		if (nextQueryParamsFG.start > -1) {
			groupFG.queryItems(nextQueryParamsFG).then(updateGridForForegrounds);
		}
	}

	function getPreviousForeground(evt) {
		evt.preventDefault(); // don't submit form
		if (nextQueryParamsFG.start !== 1) { //we aren't at the beginning keep querying.
			var params = queryParamsFG;
			params.start = params.start - params.num;
			groupFG.queryItems(params).then(updateGridForForegrounds);
		}
	}

	function readCustomForeground(evt) {
		if (evt && evt.target && evt.target.files && evt.target.files.length > 0) {
			var reader = new FileReader();
			reader.onload = function () {
				query("img.jCropImage").forEach(function (img) {
					domAttr.set(img, "src", reader.result);
				});
			};
			reader.readAsDataURL(evt.target.files[0]);
		}
	}

	// Setup preview button

	(function () {
		var previewButton = document.getElementById("previewButton");
		var canvas, ctx;

		canvas = document.getElementById("previewCanvas");
		ctx = canvas.getContext("2d");

		/**
		 * Gets the image element associated with the checked radio button inside of the specified element.
		 * @param {string} id - The id attribute of an element that contains radio buttons.
		 * @returns {(HTMLImageElement|null)}
		 */
		function getSelectedImage(id) {
			var fgRadio = document.getElementById(id).querySelector("input[type='radio']:checked");
			var img;
			if (fgRadio) {
				img = fgRadio.parentElement.parentElement.querySelector("img");
			} else {
				img = null;
			}
			return img;
		}

		function buildPreview() {

			// TODO: Handle user-uploaded files.
			////var bgUpload = document.getElementById("backgroundUpload");
			////var fgUpload = document.getElementById("foregroundUpload");


			//var bgFile;

			//if (bgUpload && bgUpload.files && bgUpload.files.length) {
			//	bgFile = bgUpload.files[0];
			//	console.log(bgFile);
			//}

			var fgImg = getSelectedImage("fgForm");
			var bgImg = bgImageChooser.getSelectedImage();

			var xmin, ymin, xmax, ymax;

			xmin = Number(document.getElementById("x1").value);
			ymin = Number(document.getElementById("y1").value);
			xmax = Number(document.getElementById("x2").value);
			ymax = Number(document.getElementById("y2").value);


			//ctx.clearRect(0, 0, 200, 133);
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			if (bgImg) {
				ctx.drawImage(bgImg, 0, 0);
			}
			if (fgImg) {
				ctx.drawImage(fgImg, 0, 0);
			}

			var textOnImage = document.getElementById("thumbText").value || document.getElementById("thumbText").placeholder;

			ctx.font = [document.getElementById("fontSize").value + "pt ", document.getElementById("selectedFont").value].join("");
			ctx.fillStyle = document.getElementById("colorPicker").value;
			ctx.textAlign = document.getElementById("textAlign").value;
			ctx.textBaseline = "top";

			// Add text
			ctx.fillText(textOnImage, xmin, ymin, xmax-xmin);

			ctx.save();

		}

		previewButton.onclick = buildPreview;


	}());
});

(function ($) {
	// Simple event handler, called from onChange and onSelect
	// event handlers, as per the Jcrop invocation above
	function showCoords(c) {
		$('#x1').val(c.x);
		$('#y1').val(c.y);
		$('#x2').val(c.x2);
		$('#y2').val(c.y2);
		$('#w').val(c.w);
		$('#h').val(c.h);
	}

	function clearCoords() {
		$('#coords input').val('');
	}

	var jcrop_api;


	$('#target').Jcrop({
		onChange: showCoords,
		onSelect: showCoords,
		onRelease: clearCoords,
		setSelect: [$('#x1').val(), $('#y1').val(), $('#x2').val(), $('#y2').val()]
	}, function () {
		jcrop_api = this;
	});

	$('#coords').on('change', 'input', function (/*e*/) {
		var x1 = $('#x1').val(),
			x2 = $('#x2').val(),
			y1 = $('#y1').val(),
			y2 = $('#y2').val();
		jcrop_api.setSelect([x1, y1, x2, y2]);
	});
}(jQuery));