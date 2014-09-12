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

var item1, item2;
var displayOptions = {
  numItemsPerPage: 6,
  group: {
    group: "67fb524bd2e24c80bf2b972b4ce5aa95",
    bgId: null, // will hold the background group id
    fgId: null  // will hold the foreground group id
  },
  portalUrl: 'http://www.arcgis.com'
};

require([
  "dojo/parser",
  "dojo/ready",
  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-construct",
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
  "dojox/widget/ColorPicker", //adding color picker from dojo to replace jQuery spectrum
  "dijit/form/RadioButton",
  "dojox/lang/aspect",
  "dijit/Dialog"
], function(parser, ready, dom, domAttr, domConstruct, array, registry, on, query, domProp, ioQuery, arcgisPortal, config, esriLang, IdentityManager, ColorPicker, RadioButton, dojoLang, Dialog) {


  ready(function() {
    parser.parse();
    esriConfig.defaults.io.proxyUrl = "/proxy/proxy.ashx";
    esriConfig.defaults.io.alwaysUseProxy = false;

    portalFG = new arcgisPortal.Portal(displayOptions.portalUrl);
    portalBG = new arcgisPortal.Portal(displayOptions.portalUrl);

    // get groups passed by URL parameter if they are set
    var queryParams = ioQuery.queryToObject(window.location.search.slice(1)),
        bgId = queryParams["bgid"],
        fgId = queryParams["fgid"];
    if(esriLang.isDefined(bgId) && bgId.length > 0) {
      displayOptions.bgId = bgId;
    }
    if(esriLang.isDefined(fgId) && fgId.length > 0) {
      displayOptions.fgId = fgId;
    }

    on(portalBG, 'ready', loadPortal);
    on(portalFG, 'ready', loadForegrounds);
    on(dom.byId('next'), "click", getNext);
    on(dom.byId('prev'), "click", getPrevious);
    on(dom.byId('nextForegroundButton'), "click", getNextForeground);
    on(dom.byId('prevForegroundButton'), "click", getPreviousForeground);
    //on(query("div.imageOption"), "div.imageOption:click", console.log("working " + event.target));

    var colorPicker = new ColorPicker({}, "colorPicker"); //summon the colorpicker
    //dlgThumbnail.show();

    on(dom.byId("backgroundUpload"), "change", function() { //uncheck the radio buttons when an image is uploaded
      query(".backgroundGrid").query("input[type=radio]").attr("checked", false);
    });
    on(dom.byId("foregroundUpload"), "change", function() {
      query(".foregroundGrid").query("input[type=radio]").attr("checked", false);
    });

    dojox.lang.aspect.advise(portalFG, "queryItems", {
      afterReturning: function(queryItemsPromise) {
        queryItemsPromise.then(function(result) {
          nextQueryParamsFG = result.nextQueryParams;
          queryParamsFG = result.queryParams;
        });
      }
    });
    dojox.lang.aspect.advise(portalBG, "queryItems", {
      afterReturning: function(queryItemsPromise) {
        queryItemsPromise.then(function(result) {
          nextQueryParamsBG = result.nextQueryParams;
          queryParamsBG = result.queryParams;
        });
      }
    });

  });


  function loadPortal() { //loads the thumbnails for the backgrounds
    var params = {
      q: 'id:' + (displayOptions.bgId  || '67fb524bd2e24c80bf2b972b4ce5aa95') //insert group id for background images here
    };
    portalBG.queryGroups(params).then(function(groups) {
      //get group title and thumbnail url
      if(groups.results.length == 1) {
        groupBG = groups.results[0];
        if(groupBG.thumbnailUrl) {
          dojo.create('img', {
            src: groupBG.thumbnailUrl,
            width: 64,
            height: 64,
            alt: groupBG.title
          }, dom.byId('groupThumbnail'));
        }

        dom.byId('groupTitle').innerHTML = "Thumbnail Maker";//group.title + "<br /><hr />";
//        dom.byId('sidebar').innerHTML = "Select two images (a background and foreground) and fill out the form.";//group.snippet;

        //Retrieve the web maps and applications from the group and display
        var params = {
          q: ' type: Image',
          num: displayOptions.numItemsPerPage
        };
        groupBG.queryItems(params).then(updateGrid);
      }
    });
  }

  function loadForegrounds() { //loads the thumbnails for the foregrounds
    var params = {
      //q: 'title: ' + displayOptions.group.title + ' AND owner:' + displayOptions.group.owner
      q: 'id:' + (displayOptions.fgId || 'f8836a4c1ca6438a89c5b39dfbd41d42') //insert group id for foreground images here
    };
    portalFG.queryGroups(params).then(function(groups) {
      //get group title and thumbnail url
      if(groups.results.length == 1) {
        groupFG = groups.results[0];
        if(groupFG.thumbnailUrl) {
          domConstruct.create('img', {
            src: groupFG.thumbnailUrl,
            width: 64,
            height: 64,
            alt: groupFG.title
          }, dom.byId('groupThumbnailForegrounds'));
        }

        //Retrieve the web maps and applications from the group and display
        var params = {
          q: ' type: Image',
          num: displayOptions.numItemsPerPage
        };
        groupFG.queryItems(params).then(updateGridForForegrounds);
      }
    });
  }
});

function updateGrid(queryResponse) { //for backgrounds
  //update the gallery to get the next page of items

  var galleryList = dojo.byId('galleryList');
  dojo.empty(galleryList);  //empty the gallery to remove existing items

  //navigation buttons
  (queryResponse.results.length < 6) ? esri.hide(dojo.byId('next')) : esri.show(dojo.byId('next'));
  (queryResponse.queryParams.start > 1) ? esri.show(dojo.byId('prev')) : esri.hide(dojo.byId('prev'));
  //Build the thumbnails for each item the thumbnail when clicked will display the web map in a template or the web application 
  var frag = document.createDocumentFragment();
  dojo.forEach(queryResponse.results, function(item) {
    if(item.id) {
      var url = (item.type === 'Web Map') ?
        displayOptions.templateUrl + '?webmap=' + item.id + '&theme=' + displayOptions.themeName :
        item.itemDataUrl;

      var li = dojo.create('li', {}, frag);
      var a = dojo.create('label', {
        //href: url,
        class: "backgroundGrid",
        target: '_blank',
        //innerHTML: '<div class="tooltip"><p>' + item.tags.toString() + '</p></div><img src="' + item.thumbnailUrl + '"/><div>' + item.title + '</div><div><input type="radio" name="rdoThumbBG"/> <label for="radioOne">Use this.</label></div>'
        innerHTML: '<div class="imageOption"><img src="' + item.thumbnailUrl + '"/><span id="thumbnailName">' + item.title + '</span><br /><span><input type="radio" name="rdoThumbBG" value="' + item.itemDataUrl + '"/></span></div>'
      }, li);
    }
  });
  dojo.place(frag, galleryList);
}

function updateGridForForegrounds(queryResponse) {
  //update the gallery to get the next page of items

  var galleryList = dojo.byId('galleryListForeground');
  dojo.empty(galleryList);  //empty the gallery to remove existing items

  //navigation buttons
  (queryResponse.results.length < 6) ? esri.hide(dojo.byId('nextForegroundButton')) : esri.show(dojo.byId('nextForegroundButton'));
  (queryResponse.queryParams.start > 1) ? esri.show(dojo.byId('prevForegroundButton')) : esri.hide(dojo.byId('prevForegroundButton'));

  //Build the thumbnails for each item the thumbnail when clicked will display the web map in a template or the web application 
  var frag = document.createDocumentFragment();
  dojo.forEach(queryResponse.results, function(item) {
    if(item.id) {
      //var url = (item.type === 'Web Map') ?  
      //  displayOptions.templateUrl + '?webmap=' + item.id + '&theme=' + displayOptions.themeName : 
      //  item.itemDataUrl;

      var li = dojo.create('li', {}, frag);
      var a = dojo.create('label', {
        //href: url,
        class: "foregroundGrid",
        target: '_blank',
        //innerHTML: '<div class="tooltip"><p>' + item.tags.toString() + '</p></div><img src="' + item.thumbnailUrl + '"/><div>' + item.title + '</div><div><input type="radio" name="rdoThumbBG"/> <label for="radioOne">Use this.</label></div>'
        innerHTML: '<div class="imageOption"><img src="' + item.thumbnailUrl + '"/><span id="thumbnailName">' + item.title + '</span><br /><span><input type="radio" name="rdoThumbFG" value="' + item.itemDataUrl + '"/> <label for="radioOne"></label></span></div>'
      }, li);
    }
  });
  dojo.place(frag, galleryList);
}

function getNext(evt) {
  evt.preventDefault(); // don't submit form
  if(nextQueryParamsBG.start > -1) {
    groupBG.queryItems(nextQueryParamsBG).then(updateGrid);
  }
}

/* //attempt at making a preview of the thumbnail
 function getUrlForImageThatCorrespondsWithClickedRadioButton(event){
 var clickedRadio = event.target;
 var img = clickedRadio.parent().siblings("img");
 var imgUrl = img.attr("src");
 return imgUrl;
 console.log(imgUrl);
 }

 function previewThumbnail(event){
 console.log("it's getting this far");
 dom.byId("preview").innerHTML="<img src='"+ getUrlForImageThatCorrespondsWithClickedRadioButton(event); +"'";
 }
 */

function getPrevious(evt) {
  evt.preventDefault(); // don't submit form
  if(nextQueryParamsBG.start !== 1) { //we aren't at the beginning keep querying.
    var params = queryParamsBG;
    params.start = params.start - params.num;
    groupBG.queryItems(params).then(updateGrid);
  }
}

function getNextForeground(evt) {
  evt.preventDefault(); // don't submit form
  if(nextQueryParamsFG.start > -1) {
    groupFG.queryItems(nextQueryParamsFG).then(updateGridForForegrounds);
  }
}

function getPreviousForeground(evt) {
  evt.preventDefault(); // don't submit form
  if(nextQueryParamsFG.start !== 1) { //we aren't at the beginning keep querying.
    var params = queryParamsFG;
    params.start = params.start - params.num;
    groupFG.queryItems(params).then(updateGridForForegrounds);
  }
}

function submitForm() {

  var imageFG, imageBG;
  var promises, uploadResults;
  var imageFGfromUser = false;
  var imageBGfromUser = false;

  if(dojo.byId('backgroundUpload').files.length > 0) {
    imageBGfromUser = true;
    var layerUrl = thumbnailGeneratorURL + "/uploads/upload";
    var layersRequestBG = esri.request({
      url: layerUrl,
      form: dojo.byId("bgForm"),
      handleAs: "json",
      callbackParamName: "callback"
    }, {usePost: true});
    imageBG = layersRequestBG;
  } else {
    imageBG = null;
  }

  if(dojo.byId('foregroundUpload').files.length > 0) {
    imageFGfromUser = true;
    var layerUrl = thumbnailGeneratorURL + "/uploads/upload";
    var layersRequestFG = esri.request({
      url: layerUrl,
      form: dojo.byId("fgForm"),
      handleAs: "json",
      callbackParamName: "callback"
    }, {usePost: true});
    imageFG = layersRequestFG;
  } else {
    imageFG = null;
  }

  require(["dojo/promise/all","dojo/dom","dojo/dom-attr","dojo/dom-class","dojo/dom-style", "dojo/on"], function(all, dom, domAttr, domClass, domStyle, on) {
    domAttr.set(dom.byId("submitButton"), "disabled", true);
    domClass.add(dojo.byId("submitButton"), "disabled");
    domStyle.set(dom.byId("spinner"), "display", "");

    //var images = [];
    //if (imageBG)
    //	images.push(imageBG);
    //else
    //	images.push(null);
    //if (imageFG)
    //	images.push(imageFG);
    //else
    //	images.push(null);
    getSelectedBG();
    getSelectedFG();
    if(imageBG || imageFG) {
      promises = new all([imageBG, imageFG]);
      promises.then(handleUploadsIfNecessary);
    } else {
      require(["esri/tasks/DataFile"], function(DataFile) {
        getSelectedBG();
        getSelectedFG();
        handleQueryResults([dataFile1b, dataFile2b]);
      });
    }

    dojo.on(dom.byId('fgForm'), "click", function(){
      console.log("print");
      change_jCrop_image(getSelectedFG());
    });


    function getSelectedFG() {
      require(["esri/tasks/DataFile"], function(DataFile) {
        dataFile2b = new DataFile();
        var radioObj = dojo.byId('fgForm');
        var radioLength = radioObj.length;
        for(var i = 0; i < radioLength; i++) {
          if(radioObj[i].checked) {
            dataFile2b.url = radioObj[i].value;
            return dataFile2b;
          }
        }
      });
    }

    function getSelectedBG() {
      require(["esri/tasks/DataFile"], function(DataFile) {
        dataFile1b = new DataFile();
        var radioObj = dojo.byId('bgForm');
        var radioLength = radioObj.length;
        for(var i = 0; i < radioLength; i++) {
          if(radioObj[i].checked) {
            dataFile1b.url = radioObj[i].value;
          }
        }
      });
    }

    function handleUploadsIfNecessary(results) {
      require(["esri/tasks/DataFile"], function(DataFile) {
        var dataFile1a = new DataFile();
        var dataFile2a = new DataFile();
        if(results[0]) {
          dataFile1a.itemID = results[0].item.itemID;
        } else {
          dataFile1a.url = dataFile1b.url;
        }
        if(results[1]) {
          dataFile2a.itemID = results[1].item.itemID;
        } else {
          dataFile2a.url = dataFile2b.url;
        }
        handleQueryResults([dataFile1a, dataFile2a]);
      });
    }

    function change_jCrop_image(newImageUrl){
      domAttr.set(query(".jcrop-tracker"), "img", newImageUrl);
    }

    function handleQueryResults(results) {
      //console.log(results);
      //uploadResults = results;
      require(["esri/tasks/Geoprocessor"], function(Geoprocessor) {
        var gp = new Geoprocessor(thumbnailGeneratorURL + "/Generate%20Thumbnail%20for%20ArcGIS%20Online%20or%20Portal%20for%20ArcGIS%20Items");
        //require(["esri/tasks/DataFile"], function(DataFile) {
        //var dataFile1 = new DataFile();
        //var dataFile2 = new DataFile();
        //dataFile1.itemID = uploadResults[0].item.itemID;
        //dataFile2.itemID = uploadResults[1].item.itemID;
        var params = {"ItemText": "The rain in spain falls mainly in the plains", "FontSize": "15", "TextColor": "#FF0000", "Align": "Left", "SelectedFont": "DejaVuSansMono-Bold.ttf", "ULX": "0", "ULY": "90", "LRX": "165", "LRY": "133"};
        if(results[0].url) {
          params.BackgroundImage = results[0];
        } else {
          params.BackgroundImageItemID = results[0];
        }

        if(results[1].url) {
          params.ForegroundImage = results[1];
        } else {
          params.ForegroundImageItemID = results[1];
        }

        params.ItemText = dojo.byId("thumbText").value;
        params.SelectedFont = dojo.byId("selectedFont").value;
        params.FontSize = dojo.byId("fontSize").value;
        params.Align = dojo.byId("textAlign").value;
        params.TextColor = dijit.byId("colorPicker").value;
        params.ULX = dojo.byId("x1").value;
        params.ULY = dojo.byId("y1").value;
        params.LRX = dojo.byId("x2").value;
        params.LRY = dojo.byId("y2").value;

        console.log(params);
        gp.submitJob(params, completeCallback, statusCallback, statusErrback);
        function statusCallback(jobInfo) {
          console.log(jobInfo.jobStatus);
        }
        function statusErrback(error) {
          console.log(error);
          // re-enable button
          domAttr.set(dojo.byId("submitButton"), "disabled", false);
          domClass.remove(dojo.byId("submitButton"), "disabled");
          domStyle.set(dojo.byId("spinner"), "display", "none");
        }

        function completeCallback(jobInfo) {
          domAttr.set(dojo.byId("submitButton"), "disabled", false);
          domClass.remove(dojo.byId("submitButton"), "disabled");
          domStyle.set(dojo.byId("spinner"), "display", "none");

          console.log(jobInfo);
          gp.getResultData(jobInfo.jobId, "OutputImage", function(results) {
            console.log(results);
            if(results) {
              dojo.byId("download").innerHTML = "<a href='" + results.value.url + "' target='_new'>Download image</a>";
              dojo.byId("info").innerHTML = "<img src='" + results.value.url + "'></img>";
            }
            //dijit.byId('itemTypeSelect').attr("disabled", false);
            //dijit.byId('ISOSelect').attr("disabled", false)
            //dijit.byId('thumbnailText').attr("disabled", false)
            //dijit.byId("submitbtn").attr("disabled", false);
            dlgThumbnail.show();
          });
        }

        //});
      });
    }
  });
}
