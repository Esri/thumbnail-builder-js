# ArcGIS Online Thumbnail Builder
## An Esri SE Prototype

See the demo and docs: http://nwdemo1.esri.com/ThumbnailBuilder.

This tool allows user to create thumbnails for ArcGIS Online items by merging a background and foreground image and some text.

### Basic Usage

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
  
### Server Component

https://github.com/sirws/ThumbnailBuilderServer

### Installing Locally

You will need to install the proxy page.  It can be downloaded from here: https://github.com/Esri/resource-proxy/releases

To get the proxy to allow POST requests on IIS, you may need to enable HTTP Activation on your IIS Web Server:
http://stackoverflow.com/questions/11116134/wcf-on-iis8-svc-handler-mapping-doesnt-work/14491386#14491386
