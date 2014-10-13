/*global require*/
require([
  "dojo/parser",
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
  "dijit/form/RadioButton",
  "dojo/_base/lang",
  "dojox/lang/aspect",
  "dijit/Dialog",
  "esri/config",
  "esri/request",
  "dojo/promise/all",
  "esri/tasks/DataFile",
  "esri/tasks/Geoprocessor"
], function (
  parser, ready, dom, domAttr, domClass, domConstruct, domStyle, array, registry, on, query, domProp, ioQuery,
  arcgisPortal, config, esriLang, IdentityManager, RadioButton, dojoLang, aspect, Dialog,
  esriConfig, esriRequest, all, DataFile, Geoprocessor) {

	var portalFG;
	var portalBG;
	var groupFG;
	var groupBG;
	var nextQueryParamsFG;
	var queryParamsFG;
	var nextQueryParamsBG;
	var queryParamsBG;
	var thumbnailGeneratorURL = "http://nwdemo1.esri.com/arcgis/rest/services/GP/GenerateThumb/GPServer";
	var dataFile1b, dataFile2b;

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


	ready(function () {
		parser.parse();

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
		if (!isSet(displayOptions.itemId)) {
			// hide update item button if no item id is present
			domStyle.set(document.getElementById("update"), "display", "none");
		}
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
		on(portalBG, "ready", loadPortal);
		on(portalFG, "ready", loadForegrounds);
		on(document.getElementById("next"), "click", getNext);
		on(document.getElementById("prev"), "click", getPrevious);
		on(document.getElementById("nextForegroundButton"), "click", getNextForeground);
		on(document.getElementById("prevForegroundButton"), "click", getPreviousForeground);
		on(document.getElementById("submitButton"), "click", submitForm);
		on(document.getElementById("updateItemBtn"), "click", updateItem);

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
					num: displayOptions.numItemsPerPage
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

		var galleryList = document.getElementById("galleryList");
		domConstruct.empty(galleryList);  //empty the gallery to remove existing items

		//navigation buttons
		(queryResponse.results.length < 6) ? disableButton(document.getElementById("next")) : enableButton(document.getElementById("next"));
		(queryResponse.queryParams.start > 1) ? enableButton(document.getElementById("prev")) : disableButton(document.getElementById("prev"));
		//Build the thumbnails for each item the thumbnail when clicked will display the web map in a template or the web application
		var frag = document.createDocumentFragment();
		array.forEach(queryResponse.results, function (item) {
			if (item.id) {
				////var url = (item.type === "Web Map") ?
				////  displayOptions.templateUrl + "?webmap=" + item.id + "&theme=" + displayOptions.themeName :
				////  item.itemDataUrl;

				var li = domConstruct.create("li", {}, frag);
				domConstruct.create("label", {
					//href: url,
					className: "backgroundGrid",
					target: "_blank",
					innerHTML: "<div class=\"imageOption\"><img src=\"" + item.thumbnailUrl + "\"/><span id=\"thumbnailName\">" + item.title + "</span><br /><span><input type=\"radio\" name=\"rdoThumbBG\" value=\"" + item.itemDataUrl + "\"/></span></div>"
				}, li);
			}
		});
		domConstruct.place(frag, galleryList);
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
					innerHTML: "<div class=\"imageOption\"><img src=\"" + item.thumbnailUrl + "\"/><span id=\"thumbnailName\">" + item.title + "</span><br /><span><input type=\"radio\" name=\"rdoThumbFG\" value=\"" + item.itemDataUrl + "\"/> <label for=\"radioOne\"></label></span></div>"
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

	function getNext(evt) {
		evt.preventDefault(); // don't submit form
		if (nextQueryParamsBG.start > -1) {
			groupBG.queryItems(nextQueryParamsBG).then(updateGrid);
		}
	}

	function getPrevious(evt) {
		evt.preventDefault(); // don't submit form
		if (nextQueryParamsBG.start !== 1) { //we aren't at the beginning keep querying.
			var params = queryParamsBG;
			params.start = params.start - params.num;
			groupBG.queryItems(params).then(updateGrid);
		}
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

	function enableSubmit() {
		domAttr.set(document.getElementById("submitButton"), "disabled", false);
		domClass.remove(document.getElementById("submitButton"), "disabled");
		domStyle.set(document.getElementById("spinner"), "display", "none");
	}

	function disableSubmit() {
		domAttr.set(document.getElementById("submitButton"), "disabled", true);
		domClass.add(document.getElementById("submitButton"), "disabled");
		domStyle.set(document.getElementById("spinner"), "display", "");
	}

	function updateItem() {
		// TODO
	}

	function submitForm() {

		var imageFG, imageBG;
		var promises;
		////var uploadResults;
		var imageFGfromUser = false;
		var imageBGfromUser = false;
		var bgUpload = document.getElementById("backgroundUpload"),
			fgUpload = document.getElementById("foregroundUpload");
		var layerUrl;

		if (bgUpload && bgUpload.files && bgUpload.files.length > 0) {
			imageBGfromUser = true;
			layerUrl = thumbnailGeneratorURL + "/uploads/upload";
			var layersRequestBG = esriRequest({
				url: layerUrl,
				form: document.getElementById("bgForm"),
				handleAs: "json",
				callbackParamName: "callback"
			}, { usePost: true });
			imageBG = layersRequestBG;
		} else {
			imageBG = null;
		}

		if (fgUpload && fgUpload.files && fgUpload.files.length > 0) {
			imageFGfromUser = true;
			layerUrl = thumbnailGeneratorURL + "/uploads/upload";
			var layersRequestFG = esriRequest({
				url: layerUrl,
				form: document.getElementById("fgForm"),
				handleAs: "json",
				callbackParamName: "callback"
			}, { usePost: true });
			imageFG = layersRequestFG;
		} else {
			imageFG = null;
		}

		disableSubmit();

		getSelectedBG();
		getSelectedFG();
		if (imageBG || imageFG) {
			promises = new all([imageBG, imageFG]);
			promises.then(handleUploadsIfNecessary);
		} else {
			getSelectedBG();
			getSelectedFG();
			handleQueryResults([dataFile1b, dataFile2b]);
		}

		function getSelectedFG() {
			dataFile2b = new DataFile();
			var radioObj = document.getElementById("fgForm");
			var radioLength = radioObj.length;
			for (var i = 0; i < radioLength; i++) {
				if (radioObj[i].checked) {
					dataFile2b.url = radioObj[i].value;
					return dataFile2b;
				}
			}
		}

		function getSelectedBG() {
			dataFile1b = new DataFile();
			var radioObj = document.getElementById("bgForm");
			var radioLength = radioObj.length;
			for (var i = 0; i < radioLength; i++) {
				if (radioObj[i].checked) {
					dataFile1b.url = radioObj[i].value;
				}
			}
		}

		function handleUploadsIfNecessary(results) {
			var dataFile1a = new DataFile();
			var dataFile2a = new DataFile();
			if (results[0]) {
				dataFile1a.itemID = results[0].item.itemID;
			} else {
				dataFile1a.url = dataFile1b.url;
			}
			if (results[1]) {
				dataFile2a.itemID = results[1].item.itemID;
			} else {
				dataFile2a.url = dataFile2b.url;
			}
			handleQueryResults([dataFile1a, dataFile2a]);
		}

		function handleQueryResults(results) {
			//console.log(results);
			//uploadResults = results;
			var gp = new Geoprocessor(thumbnailGeneratorURL + "/" + encodeURI("Generate Thumbnail for ArcGIS Online or Portal for ArcGIS Items"));
			//require(["esri/tasks/DataFile"], function(DataFile) {
			//var dataFile1 = new DataFile();
			//var dataFile2 = new DataFile();
			//dataFile1.itemID = uploadResults[0].item.itemID;
			//dataFile2.itemID = uploadResults[1].item.itemID;
			var params = {
				"ItemText": "The rain in spain falls mainly in the plains",
				"FontSize": "15",
				"TextColor": "#FF0000",
				"Align": "Left",
				"SelectedFont": "DejaVuSansMono-Bold.ttf",
				"ULX": "0",
				"ULY": "90",
				"LRX": "165",
				"LRY": "133"
			};
			if (results[0].url) {
				params.BackgroundImage = results[0];
			} else {
				params.BackgroundImageItemID = results[0];
			}

			if (results[1].url) {
				params.ForegroundImage = results[1];
			} else {
				params.ForegroundImageItemID = results[1];
			}

			params.ItemText = document.getElementById("thumbText").value;
			params.SelectedFont = document.getElementById("selectedFont").value;
			params.FontSize = document.getElementById("fontSize").value;
			params.Align = document.getElementById("textAlign").value;
			params.TextColor = document.getElementById("colorPicker").value; // registry.byId("colorPicker").value;
			params.ULX = document.getElementById("x1").value;
			params.ULY = document.getElementById("y1").value;
			params.LRX = document.getElementById("x2").value;
			params.LRY = document.getElementById("y2").value;

			console.log(params);
			gp.submitJob(params, completeCallback, statusCallback, statusErrback);
			function statusCallback(jobInfo) {
				console.log(jobInfo.jobStatus);
			}
			function statusErrback(error) {
				console.log(error);
				enableSubmit();
			}

			function completeCallback(jobInfo) {
				enableSubmit();

				console.log(jobInfo);
				gp.getResultData(jobInfo.jobId, "OutputImage", function (results) {
					console.log(results);
					if (results) {
						domAttr.set(document.getElementById("download"), "innerHTML", "<a href=\"" + results.value.url + "\" target=\"_new\">Download image</a>");
						domAttr.set(document.getElementById("info"), "innerHTML", "<img src=\"" + results.value.url + "\"></img>");
					}

					dlgThumbnail.show();
				});
			}

			//});
		}
	}
});

jQuery(function ($) {
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
		onRelease: clearCoords
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
});