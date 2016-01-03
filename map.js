// hard-coded given array of locations
var locationData = [
  {
        name: "Hanauma Bay",
        lat: 21.2688816,
        lng: -157.6978971
    },
    {
        name: "Makapuu Point Light",
        lat: 21.3098811,
        lng: -157.6519712,
    },
    {
        name: "Kualoa Ranch",
        lat: 21.5207498,
        lng: -157.839471
    },
    {
        name: "Pearl Harbor",
        lat: 21.3675563,
        lng: -157.9410582
    },
    {
        name: "Valley of the Temples Memorial Park",
        lat: 21.4307244,
        lng: -157.8344311
    }
];

// declaring a variable that reference to the div that the map will be loaded into.
var mapCanvas = document.getElementById('map');

// initialize the map
var map;
function initMap() {

    // Creating an object literal containing the required properties we want to pass to the map
    var mapOptions = {

        // center is a Google Maps LatLng object that tells the the API where to center the map
        center: new google.maps.LatLng(21.482043, -157.9273958),

        // a number between 0 (farthest) and 22 that sets the zoom level of the map
        zoom: 10,

        // mapTypeId is used to specify what type of map to use. Your choices are ROADMAP, SATELLITE, HYBRID, or TERRAIN
        mapTypeId: google.maps.MapTypeId.ROADMAP,

        // disable zoom control
        disableDefaultUI: true,

        scrollwheel: false

    };

    //Calling the Google Map constructor, thereby initializing the map
    map = new google.maps.Map(mapCanvas, mapOptions);

    // activating viewModel - avoid running before Google Maps loads
    ko.applyBindings(new viewModel());
}

// Create alert if google maps failes to load
function googleError() {
    mapCanvas.innerHTML = '<div class="alert alert-danger" role="alert">Google Maps is not loading. Please refresh the page.</div>';
}

// model - Attraction constructor
var Attraction = function (data) {
    this.name = ko.observable(data.name);
    this.lat = ko.observable(data.lat);
    this.lng = ko.observable(data.lng);
    this.url = ko.observable();
    this.marker = ko.observable();
};

// ViewModel
var viewModel = function () {
    // refer to ViewModel scope/binding context
    var self = this;

    // Create an array of all places
    self.attractionList = ko.observableArray([]);

    // Create new Attraction objects for each location data & store them in the attractionList array
    locationData.forEach(function(attractionItem) {
        self.attractionList.push(new Attraction(attractionItem));
    });

    // Craete a global InfoWindow object that will be reused for all markers
    var infoWindow = new google.maps.InfoWindow({
        maxWidth: 200,
    });

    // Initialize marker
    var marker;

	// Create marker, get wiki URL, and add click listener to show infowindow for each attractionItem
    self.attractionList().forEach(function (attractionItem) {

        // Create markers for each place and place them on map
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(attractionItem.lat(), attractionItem.lng()),
            map: map,
            animation: google.maps.Animation.DROP
        });

        // assigning marker value to its property
        attractionItem.marker = marker;

        // Make AJAX request to Wikipedia
        var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + attractionItem.name() + '&format=json';

	    var wikiRequestTimeout = setTimeout(function(){
	        $('#error').innerHTML('<div class="alert alert-danger" role="alert">Unable to obtain description from Wikipedia</div>');
	    }, 8000);

	    $.ajax({
	        url: wikiUrl,
	        dataType: 'jsonp',
	        success: function(data){
	            //console.log(data);

	            //var wikiArticleLink =  data[1];

	            //var url = '<a target="_blank" href="http:en.wikipedia.org/wiki/' + wikiArticleLink + '">' + 'More info </a>';


	            attractionItem.url(data[2][0]);

	            clearTimeout(wikiRequestTimeout);

	            var contentString = '<p><strong>' + attractionItem.name() + '</p></strong><p>' + attractionItem.url() + '</p>';

		        // Function to Bounce marker when clicked and stop bounce if marker is bouncing when clicked
				function toggleBounce () {
			        if (attractionItem.marker.getAnimation() ==! null) {
			            attractionItem.marker.setAnimation(null);
			        } else {
			            attractionItem.marker.setAnimation(google.maps.Animation.BOUNCE);
			        }
			    }

				// Bounce marker and show infoWindow when marker is clicked
			    google.maps.event.addListener(attractionItem.marker, 'click', function () {

		            // call the toggleBounce function
		            toggleBounce();

		            // stop bouncing
		            setTimeout(toggleBounce, 1250);

		            // insert content into infoWindow
		            infoWindow.setContent(contentString);
		            infoWindow.open(map, this);

		            // center marker on map canvas
		            map.panTo(attractionItem.marker.getPosition());
		        });
	        }
	    });

    });

	// Activate the appropriate marker when the user clicks a list item
    self.showInfo = function (attractionItem) {
        google.maps.event.trigger(attractionItem.marker, 'click');
    };

    // Combine showInfo and selectedAttraction function
    self.onClick = function (attractionItem) {
        self.showInfo(attractionItem);
        self.selectedAttraction(attractionItem);
    };

    // highlight selected Attraction on click
    // This will hold the selected person
    self.selectedAttraction = ko.observable();
    self.select = function(attractionItem){
        // The event receives the current data as parameter
        self.selectedAttraction(attractionItem);
    };

    // *** Filter markers and key location list based on search input

    // Create observable array to contain only the markers that should be visible based on search
    self.visible = ko.observableArray();

    // Show all markers by default before any user input
    self.attractionList().forEach(function (place) {
        self.visible.push(place);
    });

    // Track and store user input in search form
    self.userInput = ko.observable('');

    // Compare user input and marker names.
    // If user input can be found in the attraction name, attraction item remains visible
    // Remove all other markers not macthing user input.
    self.filterMarkers = function () {

        // close infoWindow if it is open before searching
        if(infoWindow){
            infoWindow.close();
        }

        // change user input to lower case
        var searchInput = self.userInput().toLowerCase();

		// When user types, remove all visible attraction items
        self.visible.removeAll();

        self.attractionList().forEach(function (place) {

        	// Set all markers and places to not visible.
            place.marker.setVisible(false);

            // Compare each attraction name to user input
            // If user input can be found within attraction name, push it to visible array
            // e.g., 'Blue Whale'.indexOf('Blue') !== -1; // true
            if (place.name().toLowerCase().indexOf(searchInput) !== -1) {
                self.visible.push(place);
            }
        });

        // Set matching attraction name and marker as visible
        self.visible().forEach(function (place) {
            place.marker.setVisible(true);
        });
    };

}; // ViewModel

