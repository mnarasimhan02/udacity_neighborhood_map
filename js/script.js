function viewModel() {
    var self = this;
    var map, service, infowindow, address;
    var markers = [];
    var myLocation = {};

    // center map: Gaithersburg City Neighborhood in maryland
    var maryland = new google.maps.LatLng(39.136385, -77.216324);

    // holds places array, infowindow, markers, and all other info
    self.placeArray = ko.observableArray([]);

    // string to hold foursquare information
    self.fourSquareAPI = '';

    // load the map
    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: maryland,
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        // search for parks within radius
        var request = {
            location: maryland,
            radius: 900,
            types: ['restaurant']
        };

        // infowindow to display content
        infowindow = new google.maps.InfoWindow();

        service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, callback);

        // will show a list of all the markers
        var list = (document.getElementById('list'));

        // map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(list);

        var input = (document.getElementById('input'));
        // map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);
        var searchBox = new google.maps.places.SearchBox((input));

        google.maps.event.addListener(searchBox, 'places_changed', function() {
            var places = searchBox.getPlaces();
            clearMarkers();
            self.placeArray.removeAll();
            var bounds = new google.maps.LatLngBounds();

            for (var i = 0, place; i <= 10; i++) {
                if (places[i] !== undefined) {
                    place = places[i];
                    allLocations(place);
                    setMarker(place);
                    bounds.extend(place.geometry.location);
                }
            }
            map.fitBounds(bounds);

        });
        google.maps.event.addListener(map, 'bounds_changed', function() {
            var bounds = map.getBounds();
            searchBox.setBounds(bounds);
        });

    }

    // create markers
    function setMarker(place) {
        var icon = {
          url: 'img/restaurant.png', // url
          scaledSize: new google.maps.Size(50, 50), // scaled size
        }
        var marker = new google.maps.Marker({
            map: map,
            name: place.name,
            position: place.geometry.location,
            place_id: place.place_id,
            animation: google.maps.Animation.DROP,
            icon: icon
        });

        google.maps.event.addListener(marker, 'click', function() {
            self.getFoursquareInfo(place);
            infowindow.setContent('<div class="text-center"><img src="img/loading.gif"></div>');
            infowindow.open(map, this);
            map.panTo(marker.position);
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                marker.setAnimation(null);
            }, 1450);

        });

        markers.push(marker);
        return marker;
    }

    // callback function to handle results object and PlacesServiceStatus response
    function callback(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            bounds = new google.maps.LatLngBounds();
            results.forEach(function(place) {
                place.marker = setMarker(place);
                bounds.extend(new google.maps.LatLng(
                    place.geometry.location.lat(),
                    place.geometry.location.lng()));
            });
            map.fitBounds(bounds);
            results.forEach(allLocations);
        }
    }

    this.getFoursquareInfo = function(place) {
        // foursquare api url
        var foursquare = 'https://api.foursquare.com/v2/venues/search?oauth_token=COVMN3WLIESURUQOG3055SSHDF1X1MNENCNH3IFW5DJA4NBS&v=20170420&ll=39.136385,-77.216324&query=\'' + place.name + '\'&limit=10';

        // start ajax and grab: venue name, phone number and twitter handle
        $.getJSON(foursquare).done(function(response) {
            self.fourSquareAPI = '<br>' + 'Foursquare Information:' + '<br>';
            var venue = response.response.venues[0];
            var venueName = venue.name;

            if (venueName !== null && venueName !== undefined) {
                self.fourSquareAPI += 'Name: ' + venueName + '<br>';
            } else {
                self.fourSquareAPI += venue.name;
            }

            var phoneNumber = venue.contact.formattedPhone;
            if (phoneNumber !== null && phoneNumber !== undefined) {
                self.fourSquareAPI += 'Phone: ' + phoneNumber + ' ';
            } else {
                self.fourSquareAPI += 'Phone not available' + ' ';
            }

            var twitterHandle = venue.contact.twitter;
            if (twitterHandle !== null && twitterHandle !== undefined) {
                self.fourSquareAPI += '<br>' + 'twitter: @' + twitterHandle;
            }
            if (place.vicinity !== undefined) {
              var address = place.vicinity;
            } else if (place.formatted_address !== undefined) {
              var address = place.formatted_address;
            }
            var contentString = '<div style="font-weight: 300">' + place.name + '</div><div>' + address + '</div>' + self.fourSquareAPI;
            infowindow.setContent(contentString);

        }).fail(function(jqxhr, textStatus, error) {
            var contentString = '<div style="font-weight: 300">' + place.name + '</div><div>' + address + '</div>';
            infowindow.setContent(contentString);
        });
    };

    // open infowindow upon click
    self.clickMarker = function(place) {
        var marker;
        for (var i = 0; i < markers.length; i++) {
            if (place.place_id === markers[i].place_id) {
                marker = markers[i];
            }
        }
        google.maps.event.trigger(marker, 'click');
    };

    // into knockout
    function allLocations(place) {
        var myLocation = {};
        myLocation.place_id = place.place_id;
        myLocation.position = place.geometry.location.toString();
        myLocation.name = place.name;

        if (typeof(place.vicinity) !== undefined) {
            address = place.vicinity;
        } else if (typeof(place.formatted_address) !== undefined) {
            address = place.formatted_address;
        }
        myLocation.address = address;

        self.placeArray.push(myLocation);
    }

    // clears marks upon picking a particular location on the autocomplete dropdown
    function clearMarkers() {
        for (var i = 0; i < markers.length; i++) {
            if (markers[i]) {
                markers[i].setMap(null);
            }
        }

        // reset markers
        markers = [];
    }

    // map bounds get updated as page is resized
    google.maps.event.addDomListener(window, 'resize', function() {
        map.setCenter(maryland);
    });

    // load the map in the window
    google.maps.event.addDomListener(window, 'load', initMap);


}

$(function() {
    ko.applyBindings(new viewModel());
});
