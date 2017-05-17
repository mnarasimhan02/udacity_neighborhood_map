
function viewModel() {
    var self = this;
    var map, service, infowindow, address;
    var markers = [];
    var location = {};
    var searchLocations = [];
    var placesObjects = [];
    // center map: Gaithersburg City Neighborhood in myLocLatLng
    var myLocLatLng = new google.maps.LatLng(39.136385, -77.216324);
    self.query = ko.observable('');
    // holds places array, infowindow, markers, and all other info
    self.placeArray = ko.observableArray([]);
    self.search = function(value) {
        self.placeArray.removeAll();
        clearMarkers();
        for (var x in searchLocations) {
            if (searchLocations[x].name.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                self.placeArray.push(searchLocations[x]);
                markers[x].setVisible(true);
            }
        }
    }
    self.query.subscribe(self.search);
    // load the map
    function loadMap() {
        var mapOptions = {
            center: new google.maps.LatLng(39.136385, -77.216324),
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.TERRAIN
        };

        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

        // search for restaurants within radius 
        var request = {
            location: myLocLatLng,
            radius: 1000,
            types: ['restaurant', 'cafe'],
        };

        // infowindow to display content
        infowindow = new google.maps.InfoWindow();
        service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, renderPlacesList);

        // will show a list of all the markers
        var list = (document.getElementById('list'));
        var input = (document.getElementById('input'));
        map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);
        google.maps.event.addListener(map, 'bounds_changed', function() {
            var bounds = map.getBounds();
        });

    }

    // create markers
    function setMarker(place) {
        placesObjects.push(place);
        var img = {
            url: 'img/restaurant.png',
            scaledSize: new google.maps.Size(50, 50), // scaled size
            origin: new google.maps.Point(0, 0), // origin
            anchor: new google.maps.Point(0, 0) // anchor
        };
        var marker = new google.maps.Marker({
            map: map,
            name: place.name,
            position: place.geometry.location,
            place_id: place.place_id,
            animation: google.maps.Animation.DROP,
            icon: img
        });
        google.maps.event.addListener(marker, 'click', function() {
            self.clickMarker(place);
        });

        markers.push(marker);
        return marker;
    }


    // callback function to handle results object and PlacesServiceStatus response
    function renderPlacesList(results, status) {
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
        } else {
            alert("Restaurant places list is not loaded")
        }
    }

    // callback function to handle results object and render resturant details
    function renderPlaceInfo(place, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            var galleryImages = {};
            var galleryImagesHtml = '';
            var thumbUrl;
            if (typeof(place.photos) !== 'undefined') {
                for (var i = 0; i < place.photos.length; i++) {
                    var imgUrl = place.photos[i].getUrl({
                        'maxWidth': 100,
                        'maxHeight': 72
                    });
                    thumbUrl = imgUrl;
                    galleryImages[i] = imgUrl;
                    galleryImagesHtml += '<img height="72px" src="' + imgUrl + '" />';
                }
                place.galleryImages = galleryImages;
            }

            if (typeof(place.vicinity) !== undefined) {
                address = place.vicinity;
            } else if (typeof(place.formatted_address) !== undefined) {
                address = place.formatted_address;
            }
            place.address = address;

            //Send a new call here.
            //Fetch the JSON, parse it. Extract Herenow, checkin count and category information and add to info window
            //venues/search?ll=39.13966719999999,-77.2062876&query=Ken Leslies Country Cooking
            $.get("https://api.foursquare.com/v2/venues/search?v=20161016&ll=" + place.geometry.location.lat() + "," + place.geometry.location.lng() + "&query=" + encodeURIComponent(place.name) + "&client_id=MWXWVYKPA5TVSL0QJX230SUTBNZZHNELA500FK4PAHI5PPWE&client_secret=3DZWKCZHGLOVVPTH0XCURJXT3POB3K0HBQYIEXQLPYA5SUWP")
                .done(function(response) {
                    setTimeout(function() {
                        var starRating = (place.rating / 5) * 80;
                        var reviewsHtml = (typeof(place.reviews) !== undefined) ? '<p class="public-reviews"><a target="blank" title="' + place.reviews[0].author_name + '" href="' + place.reviews[0].author_url + '"><img width="36" src="' + place.reviews[0].profile_photo_url + '"/></a>' + place.reviews[0].text + '</p>' : '';
                        var contentString = '<div class="detailed-info-box"><div class="text-info-container"><strong>' + place.name + " (Here Now: " + response.response.venues[0].hereNow.summary + ")" + '</strong><p>' + place.address + '</p><p class="rating"><span class="rating-span">' + place.rating + '</span><span class="rating-span"><span class="stars"><span style="width: ' + starRating + 'px;"></span></span></span> from <b>' + response.response.venues[0].stats.checkinsCount + ' check-ins.</b><br/>' + '<b>' + response.response.venues[0].categories[0].name + '</b>' + '<br/>' + '</p>' + reviewsHtml + '</div><div class="image-slider">' + galleryImagesHtml + '</div></div>';
                        infowindow.setContent(contentString);
                    }, 300);
                }).fail(function(err) {
                    setTimeout(function() {
                        var starRating = (place.rating / 5) * 80;
                        var reviewsHtml = (typeof(place.reviews) !== undefined) ? '<p class="public-reviews"><a target="blank" title="' + place.reviews[0].author_name + '" href="' + place.reviews[0].author_url + '"><img width="36" src="' + place.reviews[0].profile_photo_url + '"/></a>' + place.reviews[0].text + '</p>' : '';
                        var contentString = '<div class="detailed-info-box"><div class="text-info-container"><strong>' + place.name + '</strong><p>' + place.address + '</p><p class="rating"><span class="rating-span">' + place.rating + '</span><span class="rating-span"><span class="stars"><span style="width: ' + starRating + 'px;"></span></span></span></p>' + reviewsHtml + '</div><div class="image-slider">' + galleryImagesHtml + '</div></div>';
                        infowindow.setContent(contentString);
                    }, 300);
                })
        } else {
            alert("Restaurant reviews and images are not loaded")
        }
    }

    this.getPlaceInfo = function(point) {
        var request = {
            placeId: point.place_id
        };

        service = new google.maps.places.PlacesService(map);
        service.getDetails(request, renderPlaceInfo);
    };

    // open infowindow upon click
    self.clickMarker = function(place) {
        var marker;
        for (var i = 0; i < markers.length; i++) {
            if (place.place_id === markers[i].place_id) {
                marker = markers[i];
            }
        }
        self.getPlaceInfo(place);
        map.panTo(marker.position);
        // allows getPlaceInfo function to load first
        setTimeout(function() {
            infowindow.open(map, marker);
            marker.setAnimation(google.maps.Animation.DROP);
        }, 300);
    };

    // set restaurant rating, photos as thumbnail pictures and address and push into knockout
    function allLocations(place) {
        var location = {};
        var galleryImages = {};
        var thumbUrl;
        location.place_id = place.place_id;
        location.position = place.geometry.location.toString();
        location.name = place.name;
        if (typeof(place.opening_hours) !== 'undefined') {
            location.opening_hours = place.opening_hours;
        }
        location.rating = place.rating;
        if (typeof(place.photos) !== 'undefined') {
            for (var i = 0; i < place.photos.length; i++) {
                var imgUrl = place.photos[i].getUrl({
                    'maxWidth': 100,
                    'maxHeight': 72
                });
                thumbUrl = imgUrl;
                galleryImages[i] = imgUrl;
            }
            location.galleryImages = galleryImages;
        } else {
            thumbUrl = place.icon;
        }
        location.thumbUrl = thumbUrl;

        if (typeof(place.vicinity) !== undefined) {
            address = place.vicinity;
        } else if (typeof(place.formatted_address) !== undefined) {
            address = place.formatted_address;
        }
        location.address = address;
        self.placeArray.push(location);
        searchLocations.push(location);
    }

    // clears marks upon picking a particular location on the autocomplete dropdown
    function clearMarkers() {
        for (var i = 0; i < markers.length; i++) {
            if (markers[i]) {
                markers[i].setVisible(false);
            }
        }
    }

    // map bounds get updated as page is resized
    google.maps.event.addDomListener(window, 'resize', function() {
        map.setCenter(myLocLatLng);
    });

    // load the map in the window
    google.maps.event.addDomListener(window, 'load', loadMap);

}

function initMap(err) {
    if (err) {
        alert('Error loading Map')
    }
    $(function() {
        ko.applyBindings(new viewModel());
    });
    $('#hide').click(function() {
        if ($('#list').is(':visible')) {
            $('#list').hide();
        } else {
            $('#list').show();
        }

    });
}
/**
 * Error callback for GMap API request
 */

function mapError() {
    alert("Failed to load Google Maps ");
}