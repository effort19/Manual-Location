# 📍 Manual Location Search

The **Manual Location Search** feature allows users to manually search and select a location when GPS data is unavailable, inaccurate, or needs to be changed.

## 🔎 How It Works

Users can enter a location such as:

```text
Vigan City
```

or:

```text
Magsaysay Avenue, Vigan City
```

The application searches **OpenStreetMap Nominatim** and displays up to **8 matching Philippine locations**.

## 🗺️ Address Format

Search results are automatically formatted using:

```text
Street, Barangay, Town/City, Province
```

Example:

```text
Magsaysay Avenue, Pantay Fatima, Vigan City, Ilocos Sur
```

The formatter checks available OpenStreetMap address fields including:

* Street / Road
* Barangay / Village
* City / Town / Municipality
* Province

Philippine region names such as **Ilocos Region**, **CALABARZON**, and **Central Luzon** are filtered out when identifying the province.

## 📌 Selecting a Location

When the user selects a search result, the application automatically updates:

* 📍 Address
* 🌐 Latitude
* 🌐 Longitude
* 📌 Manual latitude field
* 📌 Manual longitude field

The selected location is also sent to the application through the `manualLocationSelected` event.

## 🌐 Nominatim API

Manual Location Search uses the OpenStreetMap Nominatim search service.

The search request:

* Searches only Philippine locations
* Requests detailed address information
* Returns up to 8 results
* Retrieves latitude and longitude for each result

## ⌨️ Search Methods

Users can start a search by:

1. Entering a location in the search field and clicking **Search**
2. Entering a location and pressing **Enter**

## 🧹 Result Handling

Previous search results are cleared before a new search begins.

The interface displays:

```text
Searching location...
```

while the request is being processed.

If results are found, the application displays the number of locations found.

If no results are available, it displays:

```text
No locations found.
```

## 📱 Manual Location Use Cases

Manual Location Search is useful when:

* GPS is unavailable
* Photo EXIF GPS data is incorrect
* Device GPS is inaccurate
* A different location needs to be selected
* Users want to manually assign a location to a photo
* More precise address information is required

## 🛠️ Technologies

* JavaScript
* OpenStreetMap
* Nominatim API
* Bootstrap
* HTML DOM API
* Fetch API
* Browser Custom Events

## 📄 Implementation

The feature is implemented through the location search functionality, including:

```javascript
searchLocation()
createLocationResult()
formatLocation()
selectLocation()
```

The selected location provides the application with:

```javascript
{
    latitude,
    longitude,
    address,
    result
}
```

The current implementation uses `countrycodes: "ph"` and `limit: "8"` for Philippine location searches.
