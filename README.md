# thumbnail-builder-js

This tool allows user to create thumbnails for ArcGIS Online items by merging a background and foreground image and some text.

The heavy lifting of merging images and adding text is done using a geoprocessing service on an ArcGIS Server.

[View it live](http://nwdemo1.esri.com/ThumbnailBuilder)

![App](https://raw.githubusercontent.com/sirws/ThumbnailBuilderUI/master/screenshot.png)

## Basic Usage
The web application will query groups within ArcGIS Online to populate the foreground and background image galleries.  There are a number of URL parameters in the application.

  bgid - The groupID for the gallery of background images  
  fgid - The groupID for the gallery of foreground images  
  txt - The text to place on the thumbnail  
  textAlign - The alignment of the text withing the bounding box (left, right or center)  
  txtBB - The bounding box in pixels for the text  
  font - The font to use for the text  
  fontSize - The font size to attempt to use (in points)  
  fontColor - The color to use for the font (hex value RGB)  
  
  e.g. 1: http://nwdemo1.esri.com/ThumbnailBuilder/?fgid=f8836a4c1ca6438a89c5b39dfbd41d42&bgid=67fb524bd2e24c80bf2b972b4ce5aa95&txt=This%20is%20a%20test&txtAlign=Center&txtBB=5,96,163,130&font=DejaVu%20Sans%20Mono%20Bold&fontColor=29682c&fontSize=25

  To find your group ID, use this tool:
  https://developers.arcgis.com/javascript/jssamples/portal_getgroupamd.html
  
  As of now, the group should be public and all of the images should be as well.

## Instructions

You will need to install the proxy page.  It can be downloaded from here: https://github.com/Esri/resource-proxy/releases

To get the proxy to allow POST requests on IIS, you may need to enable HTTP Activation on your IIS Web Server:
http://stackoverflow.com/questions/11116134/wcf-on-iis8-svc-handler-mapping-doesnt-work/14491386#14491386

1. Fork and then clone the repo. 
2. Place app in a web server foler.
3. Run the app with your favorite browser!

## Requirements

* Notepad or your favorite HTML editor
* Web browser with access to the Internet

## Resources

* [ArcGIS for JavaScript API Resource Center](http://help.arcgis.com/en/webapi/javascript/arcgis/index.html)
* [ArcGIS Blog](http://blogs.esri.com/esri/arcgis/)
* [twitter@esri](http://twitter.com/esri)

## Issues

Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing

Esri welcomes contributions from anyone and everyone. Please see our [guidelines for contributing](https://github.com/esri/contributing).

## Licensing
Copyright 2015 Esri

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's [license.txt]( https://raw.githubusercontent.com/sirws/ThumbnailBuilderUI/master/License.txt) file.

[](Esri Tags: ArcGIS Online Thumbnail Builder)
[](Esri Language: JavaScript)​