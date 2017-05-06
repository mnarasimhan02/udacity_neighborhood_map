function viewModel() {
  var self = this; 
  var map, service, infowindow, address;
  var markers = []; 
  var location = {}; 
  // center map: Gaithersburg City Neighborhood in defaultLatLong
  var defaultLatLong = new google.maps.LatLng(39.136385, -77.216324);  

  // holds places array, infowindow, markers, and all other info
  self.placeArray = ko.observableArray([]);
  
  // load the map
  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
    center: defaultLatLong,
    zoom: 16,
    mapTypeId: google.maps.MapTypeId.ROADMAP    
    });
    // search for parks within radius 
    var request = {
      location: defaultLatLong,
      radius: 1000,
      types: ['restaurant','cafe'],
    };

    // infowindow to display content
    infowindow = new google.maps.InfoWindow();
    
    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, renderPlacesList);         

    // will show a list of all the markers
    var list = (document.getElementById('list'));

    map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(list);
    
    var input = (document.getElementById('input'));
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);
    var searchBox = new google.maps.places.SearchBox((input));
    
    google.maps.event.addListener(searchBox, 'places_changed', function() {
      var places = searchBox.getPlaces();
      clearMarkers();
      self.placeArray.removeAll();
      var bounds = new google.maps.LatLngBounds();  

      for(var i = 0, place; i <= 10; i++){
        if (places[i] !== undefined){
          place = places[i];
          allLocations(place);
          setMarker(place);
          bounds.extend(place.geometry.location);          
        }
      } 
      map.fitBounds(bounds); 

    });
    google.maps.event.addListener(map, 'bounds_changed', function(){
      var bounds = map.getBounds();
      searchBox.setBounds(bounds);
    });  
    
  }
  
  // create markers
  function setMarker(place) {
    var img = 'img/park.png'; 
    var marker = new google.maps.Marker({
      map: map,
      name: place.name,
      position: place.geometry.location,
      place_id: place.place_id,
      animation: google.maps.Animation.DROP,
      icon:img 
    });    
    google.maps.event.addListener(marker, 'click', function() {
        self.clickMarker(place);
    });

    markers.push(marker);
    return marker;
  }

  // callback function to handle results object and PlacesServiceStatus response
  function renderPlacesList(results, status){
    if (status == google.maps.places.PlacesServiceStatus.OK){
      bounds = new google.maps.LatLngBounds();
      results.forEach(function (place){
        place.marker = setMarker(place);
        bounds.extend(new google.maps.LatLng(
          place.geometry.location.lat(),
          place.geometry.location.lng()));
      });
      map.fitBounds(bounds);
      results.forEach(allLocations);                 
    }
  }
  
  // callback function to handle results object for place (resturant) details
  function renderPlaceInfo(place, status){
    if (status == google.maps.places.PlacesServiceStatus.OK){
        var galleryImages = {};
        var galleryImagesHtml = '';
        var thumbUrl;
        if(typeof(place.photos) !== 'undefined'){
            for (var i = 0; i < place.photos.length; i++ ) {
                var imgUrl = place.photos[i].getUrl({'maxWidth': 100, 'maxHeight': 72});
                thumbUrl = imgUrl;
                galleryImages[i] = imgUrl;
                galleryImagesHtml += '<img height="72px" src="'+imgUrl+'" />';
            }
            place.galleryImages = galleryImages;
        }

        if (typeof(place.vicinity) !== undefined) {
          address = place.vicinity;
        } else if (typeof(place.formatted_address) !== undefined) {
          address = place.formatted_address;
        }
        place.address = address;
        
        
    setTimeout(function() {
      var starRating = (place.rating/5)*80;
      var reviewsHtml = (typeof(place.reviews) !== undefined)?'<p class="public-reviews"><a target="blank" title="'+place.reviews[0].author_name+'" href="'+place.reviews[0].author_url+'"><img width="36" src="'+place.reviews[0].profile_photo_url+'"/></a>' + place.reviews[0].text + '</p>':'';
      var contentString = '<div class="detailed-info-box"><div class="text-info-container"><strong>' + place.name + '</strong><p>' + place.address + '</p><p class="rating"><span class="rating-span">' + place.rating + '</span><span class="rating-span"><span class="stars"><span style="width: '+starRating+'px;"></span></span></span></p>'+reviewsHtml+'</div><div class="image-slider">'+galleryImagesHtml+'</div></div>';
      infowindow.setContent(contentString);
    }, 300);
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
//    alert('sd');
    var marker;
    for(var i = 0; i < markers.length; i++) {      
      if(place.place_id === markers[i].place_id) { 
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

  // into knockout
  function allLocations(place){  
    var location = {};
    var galleryImages = {};
    var thumbUrl;
    location.place_id = place.place_id;
    location.position = place.geometry.location.toString();
    location.name = place.name;
    if(typeof(place.opening_hours) !== 'undefined'){
        location.opening_hours = place.opening_hours;
    }
    location.rating = place.rating;
    if(typeof(place.photos) !== 'undefined'){
        for (var i = 0; i < place.photos.length; i++ ) {
            var imgUrl = place.photos[i].getUrl({'maxWidth': 100, 'maxHeight': 72});
            thumbUrl = imgUrl;
            galleryImages[i]=imgUrl;
        }
        location.galleryImages = galleryImages;
    }else{
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
  }

  // clears marks upon picking a particular location on the autocomplete dropdown
  function clearMarkers() {
    for (var i = 0; i < markers.length; i++ ) {
      if (markers[i]) {
        markers[i].setMap(null);
      }
    }

    // reset markers
    markers = []; 
  } 

  // map bounds get updated as page is resized
  google.maps.event.addDomListener(window, 'resize', function(){
    map.setCenter(defaultLatLong); 
  }); 

  // load the map in the window
  google.maps.event.addDomListener(window, 'load', initMap);


}

$(function(){
  ko.applyBindings(new viewModel());
});