/*	Setup authentication app_id and app_code 
*	WARNING: this is a demo-only key
*	please register for an Evaluation, Base or Commercial key for use in your app.
*	Just visit http://developer.here.com/get-started for more details. Thank you! 
*/
nokia.Settings.set("app_id", "DemoAppId01082013GAL"); 
nokia.Settings.set("app_code", "AJKnXv84fjrb0KIHawS0Tg");
// Use staging environment (remove the line for production environment)
nokia.Settings.set("serviceMode", "cit");
// Enable https
(document.location.protocol == "https:") && nokia.Settings.set("secureConnection", "force");


/* We create a UI notecontainer for example description
 * NoteContainer is a UI helper function and not part of the Maps API for JavaScript
 * See exampleHelpers.js for implementation details 
 */

 var noteContainer = new NoteContainer({
			id: "isolineControlsContainer",
			parent: document.getElementById("uiContainer"),
			title: "Isoline routing example",
			content:'This example uses "isoline" routing to display the resulting isolines on a map.<br><br>' +
					'<div>Point A: <input id="pointA" value="Berlin" type="text"/><br>' +
					'<input type="button" id="addRemovePoint" style="width: auto; min-width: 100%; text-align:center" value="Add a 2nd point" /><br>' +
					'<div id="pointBContainer" style="display:none">Point B:&nbsp;&nbsp;<input id="pointB" type="text" style="display:block"/></div></div><br>' +
					'<div>Unit:<br>' +
					'<div id="unitTypes">' +
					'<input type="button" id="type_minute" value="Mins (travel time)" style="width: auto; min-width: 45%; display: inline-block; margin-right: 5px; background-color: #0AF;" />' +
					'<input type="button" id="type_km" value="Kms (dist.)" style="width: auto; min-width: 45%; display: inline-block;" />' +
					'</div></div>' +
					'<div>Value: ' +
					'<span id="unitValues">' +
					'<input type="button" value="1" style="width: auto; min-width: 30px; display: inline-block; margin-right: 5px" />' +
					'<input type="button" value="2" style="width: auto; min-width: 30px; display: inline-block; margin-right: 5px" />' +
					'<input type="button" value="5" style="width: auto; min-width: 30px; display: inline-block; margin-right: 5px" />' +
					'<input type="button" value="10" style="width: auto; min-width: 30px; display: inline-block; margin-right: 5px; background-color: #0AF; " />' +
					'<input type="button" value="15" style="width: auto; min-width: 30px; display: inline-block;" />' +
					'</span></div>' +
					'<div>Mode:<br>' +
					'<span id="modes">' +
					'<input type="button" id="mode_car" value="Car" style="width: auto; min-width: 45%; display: inline-block; margin-right: 5px; background-color: #0AF;" />' +
					'<input type="button" id="mode_pedestrian" value="Pedestrian" style="width: auto; min-width: 45%; display: inline-block;" />' +
					'</span></div>' +
					'<div><br><input type="checkbox" id="traffic" checked/><label for="traffic">Use traffic data</label><br><br></div>' +
					'<input id="routing" type="button" value="calculate isoline"/>'
		}),
		// Hold a reference to our example's controls and container element
		mapContainer = document.getElementById("mapContainer"),
    pointA = document.getElementById("pointA"),
    pointB = document.getElementById("pointB"),
    pointBContainer = document.getElementById("pointBContainer"),
		calroute = document.getElementById("routing"),
		addRemovePoint = document.getElementById("addRemovePoint"),
		modes = document.getElementById("modes"),
		unitTypes = document.getElementById("unitTypes"),
    unitValues = document.getElementById("unitValues"),
		// Get the "traffic" checkbox
		traffic = document.getElementById("traffic"),
		// Initialize our map in Berlin
		map = new nokia.maps.map.Display(mapContainer, {
        center: [52.51, 13.45],
        zoomLevel: 13,
				components: [new nokia.maps.map.component.Behavior()]
		}),
    // Default unitValue regardless of isoline routing mode (km | min)
    unitValue = 10,
		// Create advanced routing and search managers
		routingManager1 = new nokia.maps.advrouting.Manager(),
		routingManager2 = new nokia.maps.advrouting.Manager(),
		searchManager1 = new nokia.maps.search.Manager(),
		searchManager2 = new nokia.maps.search.Manager(),
		objectContainer,
    // Default request mode
		requestMode = "car",
    // Default request unit
		requestUnit = "minutes",
		isolineOptions = [
				{ pen: { strokeColor: "#000", lineWidth: 1 }, brush: { color: "#CC2A"} },
				{ pen: { strokeColor: "#000", lineWidth: 1 }, brush: { color: "#2C2A"} }
		],
		options = 0,
		// Create an isoline routing request
		routingRequest = {
        // Set departure time to calculate using the current traffic flow; when "Use traffic data" is "on".
        // Departure also accepts ISO 8601 formatted dates, i.e. 2012-12-01T17:00:00Z
        // More info: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/toISOString
        departure: "now",
				/* The start parameter: isoline routing starts from this point;
				 * this value is modified by the geocoding callback functions
				 */
				start: {position: new nokia.maps.geo.Coordinate(50.112, 8.6834)},
        /* "distances" and "travelTimes" properties cannot co-exist in the same routing request.
         * They are shown here just for the sake of displaying the available options.
         * Look below at the "calroute" click handler to see how they are set
         * per scenario (distance || travel time).
         */
				distances: [],
        travelTimes: [],
				modes: [
					{
							type: "fastest",
							transportModes: ["car"],
							trafficMode: "enabled"
					}
				]
		},
		/* Create a sentinel variable that keeps the number of pending routing requests.
		 * We want to avoid zooming in to the objects' bounding box each time a request returns.
		 * Instead, let the last request response trigger the zoom-in action.
		 */
		pendingRoutingRequests = 0,
		// Callback function for our isoline routing manager
		routingCallback = function (observedRouter, key, value) {
				if (value == "finished") {
						// Update the pending requests counter
						pendingRoutingRequests = pendingRoutingRequests - 1;
						
						// Get isoline from manager
						var isolines = observedRouter.getIsolines();
						
						// Use result set to transform the first isoline result to map object and push it to container 
						for (var i = 0, l = isolines.length ; i<l; i++) {
								var isolineContainer = new nokia.maps.routing.component.IsolineResultSet( isolines[i], isolineOptions[options++%2] ).container;
								objectContainer.objects.add( isolineContainer );
						}
						
						if (!isolines[0])
								alert("The routing request did not return any isolines!")
						else {
							// Add the object container if it was never added
							if (!objectContainer.getDisplay()) {
								map.objects.add( objectContainer );
							}
							// Zoom in to the isoline(s) bounding box only if no pending request exists
							if (pendingRoutingRequests < 1) {
								var bbox = objectContainer.getBoundingBox();
								map.zoomTo(bbox, false, "default");
							}
						}
				} else if ( value == "failed" ) {
						// Update the pending requests counter
						pendingRoutingRequests = pendingRoutingRequests - 1;
						alert("The isoline routing request failed.");
				}
		},
		// Callback function for first search manager
		searchCallback1 = function (observedManager, key, value) {
				 if (value == "finished" && observedManager.locations[0]) {
						 // Reset the start point of isoline routing by first result of geocode request
						 var start = observedManager.locations[0].displayPosition;
						 routingRequest.start = {position: start};
						 
						objectContainer = objectContainer || new nokia.maps.map.Container();
						// Push the start point of isoline to container and display it.
						objectContainer.objects.add( new nokia.maps.map.StandardMarker(start, {text: "S"}) );
						
						 // Make an isoline routing request, after updating the pendingRequests counter
						 pendingRoutingRequests = pendingRoutingRequests + 1;
						 routingManager1.calculateIsoline(routingRequest);
				} else if (value == "failed") {
						alert("The geocode request failed.");
				}
		},
		// Callback function for second search manager
		searchCallback2 = function (observedManager, key, value) {
				 if (value == "finished" && observedManager.locations[0]) {
						 // Reset the start point of isoline routing by first result of geocode request
						 var start = observedManager.locations[0].displayPosition;
						 routingRequest.start = {position: start};
						 
						objectContainer = objectContainer || new nokia.maps.map.Container();
						// Push the start point of isoline to container and display it.
						objectContainer.objects.add(new nokia.maps.map.StandardMarker(start, {text: "S"}));
						
						  // Make an isoline routing request, after updating the pendingRequests counter
						 pendingRoutingRequests = pendingRoutingRequests + 1;
						 routingManager2.calculateIsoline(routingRequest);
				} else if (value == "failed") {
					alert("The geocode request failed.");
				}
		};

// Delegate clicks on the buttons container to find which button was pressed
unitTypes.onclick = function (evt) {
  var e = evt || window.event,
      target = e.target || e.srcElement,
      color = "";
  if (target.type && target.type == "button") {
    requestUnit = (target.id == "type_km") ? "km" : "minutes";
    // Loop through all elements in the container to unset coloring
    for (var i=0,node; node = unitTypes.childNodes[i++];) {
      if (node.nodeName == "INPUT") {
        // Highlight just the target input, while unlcolorizing any others
        color = (node != target) ? "" : "#0AF";
        node.style.backgroundColor = color;
      }
    }
  }
}

// Delegate clicks on the buttons container to find which button was pressed
unitValues.onclick = function (evt) {
  var e = evt || window.event,
      target = e.target || e.srcElement,
      color = "";
  if (target.type && target.type == "button") {
    unitValue = parseInt(target.value, 10);
    // Loop through all elements in the container to unset coloring
    for (var i=0,node; node = unitValues.childNodes[i++];) {
      if (node.nodeName == "INPUT") {
        // Highlight just the target input, while unlcolorizing any others
        color = (node != target) ? "" : "#0AF";
        node.style.backgroundColor = color;
      }
    }
  }
}

// Delegate clicks on the buttons container to find which button was pressed
modes.onclick = function (evt) {
  var e = evt || window.event,
      target = e.target || e.srcElement,
      color = "";
  if (target.type && target.type == "button") {
    requestMode = (target.id == "mode_car") ? "car" : "pedestrian";
    // Loop through all elements in the container to unset coloring
    for (var i=0,node; node = modes.childNodes[i++];) {
      if (node.nodeName == "INPUT") {
        // Highlight just the target input, while unlcolorizing any others
        color = (node != target) ? "" : "#0AF";
        node.style.backgroundColor = color;
      }
    }
  }
}

// Onclick event handler for calculate isoline button
calroute.onclick = function () {
		// In case both distance and travelTime entries are in routingRequest, delete them.
		// A request can only made with either distance or travelTime, but not both
		delete routingRequest["distances"];
		delete routingRequest["travelTimes"];
		
		// Remove objectContainer if it is already created.
		if (objectContainer) {
				map.objects.remove(objectContainer);
				objectContainer = null;
		}
		
		// Set distance or travelTime according to user's preferences
		if (requestUnit == "km")
				routingRequest["distances"] = [unitValue*1000]; // Multiply by 1000 to get Kms
		else
				routingRequest["travelTimes"] = [unitValue*60]; // Multiply by 60 to specify minutes
		
		// Set transport mode
		routingRequest.modes[0].transportModes = [requestMode];
    
    if (traffic.checked) {
      routingRequest["departure"] = "now";
      routingRequest.modes[0].trafficMode = "enabled";
    } else {
      delete routingRequest["departure"];
      routingRequest.modes[0].trafficMode = "disabled";
    }
		
		// Get start addresses and then send geocode requests
		var start1 = pointA.value,
			start2 = pointB.value;

		if (start1) searchManager1.geocode(start1);
		if (start2) searchManager2.geocode(start2);
};

// Onclick event handler for addRemovePoint button to show another input for a second start point
addRemovePoint.onclick = function (evt) {
  switch (pointBContainer.style.display) {
    // PointB was visible, hide it, and reset its value
    case "block" :
      addRemovePoint.value="Add a 2nd point";
      pointBContainer.style.display = "none";
      pointB.value = "";
      break;
    default :
      addRemovePoint.value="Remove the 2nd point";
      pointBContainer.style.display = "block";
      break;
  }
};

// Set callbacks for each manager
routingManager1.addObserver("state", routingCallback);
routingManager2.addObserver("state", routingCallback);
searchManager1.addObserver("state", searchCallback1);
searchManager2.addObserver("state", searchCallback2);
		