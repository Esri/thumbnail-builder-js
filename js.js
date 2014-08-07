    dojo.require('esri.arcgis.Portal');
    dojo.require("esri.IdentityManager");
    dojo.require("dojox.lang.aspect");
    dojo.require("dijit.form.RadioButton");

    var displayOptions = {
      templateUrl: 'http://www.arcgis.com/apps/OnePane/basicviewer/profile.html',
      themeName:'gray',
      numItemsPerPage: 6,
      group: {
        //"owner": "ScottMoorePNW",
        //"title": "Thumbnails"
        "group": "67fb524bd2e24c80bf2b972b4ce5aa95"
      },
      portalUrl: 'http://www.arcgis.com'
    };
    var portal;
    var group;
    var nextQueryParams;
    var queryParams;

    function init() {
      portal = new esri.arcgis.Portal(displayOptions.portalUrl);
      make_submit_button_take_user_to_the_next_page();
      dojo.connect(portal, 'onLoad', loadPortal);
      dojox.lang.aspect.advise(portal, "queryItems", {
        afterReturning: function (queryItemsPromise) {
          queryItemsPromise.then(function (result) {
            nextQueryParams = result.nextQueryParams;
            queryParams = result.queryParams;
          });
        }
      });
    make_upload_buttons_clear_corresponding_radio_buttons();
    //hilight_selected_thumbnail();
    }

    function hilight_selected_thumbnail(){
    	$(".gallery").on("click", function(event){
    		console.log("this is " + this);
    		jQuery("div", this).addClass('active');
    	});
    }

    function loadPortal() {
        var params = {
          //q: 'title: ' + displayOptions.group.title + ' AND owner:' + displayOptions.group.owner
          q: 'id: 67fb524bd2e24c80bf2b972b4ce5aa95' //insert group id for background images here
        };
        portal.queryGroups(params).then(function(groups){
        //get group title and thumbnail url 
        if (groups.results.length == 1) {
          group = groups.results[0];
          if (group.thumbnailUrl) {
            dojo.create('img', {
              src: group.thumbnailUrl,
              width: 64,
              height: 64,
              alt: group.title
            }, dojo.byId('groupThumbnail'));
          }

          dojo.byId('groupTitle').innerHTML = "Thumbnail Maker";//group.title + "<br /><hr />";
          dojo.byId('sidebar').innerHTML = "Select two images (a background and foreground) and fill out the form.";//group.snippet;
          
          //Retrieve the web maps and applications from the group and display 
          var params = {
            q: ' type: Image',
            num: displayOptions.numItemsPerPage
          };
          group.queryItems(params).then(updateGrid);
          loadForegrounds();
          $("#colorPicker").spectrum({
          	color:"#fff"
          });
        }
      });
    }
    
    function loadForegrounds() {
        var params = {
          //q: 'title: ' + displayOptions.group.title + ' AND owner:' + displayOptions.group.owner
          q: 'id: f8836a4c1ca6438a89c5b39dfbd41d42' //insert group id for foreground images here
        };
        portal.queryGroups(params).then(function(groups){
        //get group title and thumbnail url 
        if (groups.results.length == 1) {
          group = groups.results[0];
          if (group.thumbnailUrl) {
            dojo.create('img', {
              src: group.thumbnailUrl,
              width: 64,
              height: 64,
              alt: group.title
            }, dojo.byId('groupThumbnailForegrounds'));
          }
          
          //Retrieve the web maps and applications from the group and display 
          var params = {
            q: ' type: Image',
            num: displayOptions.numItemsPerPage
          };
          group.queryItems(params).then(updateGridForForegrounds);
        }
      });
    }


    function progressToNextInputOption() {
      var currentStepNumber = 0;
      $("#groupThumbnail").html('');
      console.log("It's getting this far");
      currentStepNumber++;
    }

    function make_upload_buttons_clear_corresponding_radio_buttons(){
    	$("#backgroundUpload").on("change", function(){
    		console.log("It's getting this far.");
    		$(".backgroundGrid").find("input:radio").prop("checked", false);
    	});

    	$("#foregroundUpload").on("change", function(){
    		console.log("It's getting this far.");
    		$(".foregroundGrid").find("input:radio").prop("checked", false);
    	});
    }


    function make_submit_button_take_user_to_the_next_page(){
      var submitButton=$("#submitButton");
      submitButton.on("click", function(){
		//submitting the form
      });
        var form = $("#myform");
        //galleryListForSecondImageParts.toggle("slide");
    }

    function updateGrid(queryResponse) { //for backgrounds
      //update the gallery to get the next page of items
        
      var galleryList = dojo.byId('galleryList');
      dojo.empty(galleryList);  //empty the gallery to remove existing items
     
       //navigation buttons 
      (queryResponse.results.length < 6) ? esri.hide(dojo.byId('next')) : esri.show(dojo.byId('next'));
      (queryResponse.queryParams.start > 1) ? esri.show(dojo.byId('prev')) : esri.hide(dojo.byId('prev'));
      
      //Build the thumbnails for each item the thumbnail when clicked will display the web map in a template or the web application 
      var frag = document.createDocumentFragment();
      dojo.forEach(queryResponse.results, function (item) {
        if (item.id) {
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
      (queryResponse.results.length < 6) ? esri.hide(dojo.byId('next')) : esri.show(dojo.byId('next'));
      (queryResponse.queryParams.start > 1) ? esri.show(dojo.byId('prev')) : esri.hide(dojo.byId('prev'));
      
      //Build the thumbnails for each item the thumbnail when clicked will display the web map in a template or the web application 
      var frag = document.createDocumentFragment();
      dojo.forEach(queryResponse.results, function (item) {
        if (item.id) {
          var url = (item.type === 'Web Map') ?  
            displayOptions.templateUrl + '?webmap=' + item.id + '&theme=' + displayOptions.themeName : 
            item.itemDataUrl;
          
          var li = dojo.create('li', {}, frag);
          var a = dojo.create('label', {
            //href: url,
            class: "foregroundGrid",
            target: '_blank',
            //innerHTML: '<div class="tooltip"><p>' + item.tags.toString() + '</p></div><img src="' + item.thumbnailUrl + '"/><div>' + item.title + '</div><div><input type="radio" name="rdoThumbBG"/> <label for="radioOne">Use this.</label></div>'
            innerHTML: '<div class="imageOption"><img src="' + item.thumbnailUrl + '"/><span id="thumbnailName">' + item.title + '</span><br /><span><input type="radio" name="rdoThumbBG" value="' + item.itemDataUrl + '"/> <label for="radioOne"></label></span></div>'
          }, li);
        }
      });

      dojo.place(frag, galleryList);
    }

    function getNext() {
      if (nextQueryParams.start > -1) {
        group.queryItems(nextQueryParams).then(updateGrid);
      } //I can't figure out why this isn't working. The requests are going to my local machine instead of the ArcGIS Online server.
    }

    function getPrevious() {
      if (nextQueryParams.start !== 1) { //we aren't at the beginning keep querying. 
        var params = queryParams;
        params.start = params.start - params.num;
        group.queryItems(params).then(updateGrid);
      }
    }
    /*
    $("#colorPicker").spectrum({
        color: "#fff",
    });
    */
    dojo.ready(init);