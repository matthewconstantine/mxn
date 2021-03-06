mxn.register('yahoo', {	

Mapstraction: {
	
	init: function(element,api) {		
		var me = this;
		if (YMap) {
			this.maps[api] = new YMap(element);

			YEvent.Capture(this.maps[api], EventsList.MouseClick, function(event,location) {
				me.clickHandler(location.Lat, location.Lon, location, me);
			});
			YEvent.Capture(this.maps[api], EventsList.changeZoom, function() {
				me.moveendHandler(me);
			});
			YEvent.Capture(this.maps[api], EventsList.endPan, function() {
				me.moveendHandler(me);
			});
			this.loaded[api] = true;
		}
		else {
			alert(api + ' map script not imported');
		}  
	},
	
	applyOptions: function(){
		if(this.options.enableScrollWheelZoom){
			map.enableContinuousZoom();
			map.enableScrollWheelZoom();
		}
	},

	resizeTo: function(width, height){	
		this.maps[this.api].resizeTo(new YSize(width,height));
	},

	addControls: function( args ) {
		var map = this.maps[this.api];
		
		if (args.pan) {
			map.addPanControl();
		}
		else {
			map.removePanControl();
		}
		
		if (args.zoom == 'large') {
			map.addZoomLong();
		}
		else if ( args.zoom == 'small' ) {
			map.addZoomShort();
		}
		else {
			map.removeZoomScale();
		}
	},

	addSmallControls: function() {
		var map = this.maps[this.api];
		map.addPanControl();
		map.addZoomShort();
		this.addControlsArgs.pan = true;
		this.addControlsArgs.zoom = 'small';
	},

	addLargeControls: function() {
		var map = this.maps[this.api];
		map.addPanControl();
		map.addZoomLong();
		this.addControlsArgs.pan = true;  // keep the controls in case of swap
		this.addControlsArgs.zoom = 'large';
	},

	addMapTypeControls: function() {
		var map = this.maps[this.api];
		map.addTypeControl();
	},

	dragging: function(on) {
		var map = this.maps[this.api];
		if (on) {
			map.enableDragMap();
		} else {
			map.disableDragMap();
		}
	},

	setCenterAndZoom: function(point, zoom) { 
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		
		var yzoom = 18 - zoom; // maybe?
        map.drawZoomAndCenter(pt,yzoom);
	},
	
	addMarker: function(marker, old) {
		var map = this.maps[this.api];
		var pin = marker.toProprietary(this.api);
		map.addOverlay(pin);
		return pin;
	},

	removeMarker: function(marker) {
		var map = this.maps[this.api];
		map.removeOverlay(marker.proprietary_marker);
	},

	removeAllMarkers: function() {
		var map = this.maps[this.api];
		map.removeMarkersAll();
	},
	
	declutterMarkers: function(opts) {
		throw 'Not implemented';
	},

	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		var pl = polyline.toProprietary(this.api);
		map.addOverlay(pl);
		return pl;
	},

	removePolyline: function(polyline) {
		var map = this.maps[this.api];
		map.removeOverlay(polyline.proprietary_polyline);
	},
	
	getCenter: function() {
		var map = this.maps[this.api];
		var pt = map.getCenterLatLon();
        var point = new mxn.LatLonPoint(pt.Lat, pt.Lon);
		return point;
	},

	setCenter: function(point, options) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		map.panToLatLon(pt);
	},

	setZoom: function(zoom) {
		var map = this.maps[this.api];
		var yzoom = 18 - zoom; // maybe?
		map.setZoomLevel(yzoom);		  
	},
	
	getZoom: function() {
		var map = this.maps[this.api];
		return 18 - map.getZoomLevel();
	},

	getZoomLevelForBoundingBox: function( bbox ) {
		throw 'Not implemented';
	},

	setMapType: function(type) {
		var map = this.maps[this.api];
		
		switch(type) {
			case mxn.Mapstraction.ROAD:
				map.setMapType(YAHOO_MAP_REG);
				break;
			case mxn.Mapstraction.SATELLITE:
				map.setMapType(YAHOO_MAP_SAT);
				break;
			case mxn.Mapstraction.HYBRID:
				map.setMapType(YAHOO_MAP_HYB);
				break;
			default:
				map.setMapType(YAHOO_MAP_REG);
		}
	},

	getMapType: function() {
		var map = this.maps[this.api];
		var type = map.getCurrentMapType();
		switch(type) {
			case YAHOO_MAP_REG:
				return mxn.Mapstraction.ROAD;
			case YAHOO_MAP_SAT:
				return mxn.Mapstraction.SATELLITE;
			case YAHOO_MAP_HYB:
				return mxn.Mapstraction.HYBRID;
			default:
				return null;
		}
	},

	getBounds: function () {
		var map = this.maps[this.api];
		var ybox = map.getBoundsLatLon();
        return new mxn.BoundingBox(ybox.LatMin, ybox.LonMin, ybox.LatMax, ybox.LonMax);
	},

	setBounds: function(bounds){
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest();
		var ne = bounds.getNorthEast();
						
		if(sw.lon > ne.lon) {
			sw.lon -= 360;
		}
		var center = new YGeoPoint((sw.lat + ne.lat)/2, (ne.lon + sw.lon)/2);
		
		var container = map.getContainerSize();
		for(var zoom = 1 ; zoom <= 17 ; zoom++){
			var sw_pix = mxn.util.convertLatLonXY_Yahoo(sw,zoom);
			var ne_pix = mxn.util.convertLatLonXY_Yahoo(ne,zoom);
			if(sw_pix.x > ne_pix.x) {
				sw_pix.x -= (1 << (26 - zoom)); //earth circumference in pixel
			}
			if(Math.abs(ne_pix.x - sw_pix.x) <= container.width
				&& Math.abs(ne_pix.y - sw_pix.y) <= container.height){
				map.drawZoomAndCenter(center, zoom); //Call drawZoomAndCenter here: OK if called multiple times anyway
				break;
			}
		}		
	},
	
	addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
		throw 'Not implemented';
	},

	setImagePosition: function(id) {
	   throw 'Not implemented';
	},	
	
	addOverlay: function(url, autoCenterAndZoom) {
		var map = this.maps[this.api];
		map.addOverlay(new YGeoRSS(url));
	},
	
	addTileLayer: function(tile_url, opacity, copyright_text, min_zoom, max_zoom) {
		throw 'Not implemented';
	},

	toggleTileLayer: function(tile_url) {
		throw 'Not implemented';
	},
	
	getPixelRatio: function() {
		throw 'Not implemented';	
	},
	
	mousePosition: function(element) {
		throw 'Not implemented';
	}
	
},

LatLonPoint: {
	
	toProprietary: function() {
		return new YGeoPoint(this.lat,this.lon);
	},

	fromProprietary: function(yahooPoint) {
		this.lat = yahooPoint.Lat;
		this.lon = yahooPoint.Lon;
	}
	
},

Marker: {
	
	toProprietary: function() {
		var ymarker;
	    var size;
	    if(this.iconSize) {
	        size = new YSize(this.iconSize[0], this.iconSize[1]);
	    }
	    if(this.iconUrl) {
	        if(this.iconSize)
	            ymarker = new YMarker(this.location.toProprietary('yahoo'), new YImage(this.iconUrl, size));
	        else
	            ymarker = new YMarker(this.location.toProprietary('yahoo'), new YImage(this.iconUrl));
	    }
	    else {
	        if(this.iconSize)
	            ymarker = new YMarker(this.location.toProprietary('yahoo'), null, size);
	        else
	            ymarker = new YMarker(this.location.toProprietary('yahoo'));
	    }

	    if(this.labelText) {
	        ymarker.addLabel(this.labelText);
	    }

	    if(this.infoBubble) {
	        var theInfo = this.infoBubble;
	        var event_action;
	        if(this.hover) {
	            event_action = EventsList.MouseOver;
	        }
	        else {
	            event_action = EventsList.MouseClick;
	        }
	        YEvent.Capture(ymarker, event_action, function() {
	            ymarker.openSmartWindow(theInfo);
	        });

	    }

	    if(this.infoDiv) {
	        var theInfo = this.infoDiv;
	        var div = this.div;
	        var event_div;
	        if(this.hover) {
	            event_action = EventsList.MouseOver;
	        }
	        else {
	            event_action = EventsList.MouseClick;
	        }
	        YEvent.Capture(ymarker, event_action, function() {
	            document.getElementById(div).innerHTML = theInfo;
	        });
	    }

	    return ymarker;
	},

	openBubble: function() {
		var ypin = this.proprietary_marker;
        ypin.openSmartWindow(this.infoBubble);
	},

	hide: function() {
		this.proprietary_marker.hide();
	},

	show: function() {
		this.proprietary_marker.unhide();
	},

	update: function() {
		throw 'Not implemented';
	}
	
},

Polyline: {

	toProprietary: function() {
		var gpoints = [];
		for (var i = 0,  length = this.points.length ; i< length; i++){
			gpoints.push(this.points[i].toProprietary('google'));
		}
		if (this.closed	|| gpoints[0].equals(gpoints[length-1])) {
			var gpoly = new GPolygon(gpoints, this.color, this.width, this.opacity, this.fillColor || "#5462E3", this.opacity || "0.3");
		} else {
			var gpoly = new GPolyline(gpoints, this.color, this.width, this.opacity);
		}
		return gpoly;
	},
	
	show: function() {
		throw 'Not implemented';
	},

	hide: function() {
		throw 'Not implemented';
	}
	
}

});