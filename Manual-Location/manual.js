"use strict";

/* ============================================================
   TIMEMARK — MANUAL LOCATION SEARCH
   ============================================================

   ADDRESS FORMAT:

   Street, Barangay, Town/City, Province

   Example:

   Magsaysay Avenue, Pantay Fatima, Vigan City, Ilocos Sur

   FEATURES:
   • Search Philippine locations
   • Maximum 8 results
   • Street
   • Barangay
   • Town / City
   • Province
   • Latitude
   • Longitude
   • Updates #address
============================================================ */


/* ============================================================
   ELEMENTS
============================================================ */

const manualLocationSearch =
    document.getElementById("manualLocationSearch");

const searchLocationBtn =
    document.getElementById("searchLocationBtn");

const locationSearchResults =
    document.getElementById("locationSearchResults");

const locationSearchStatus =
    document.getElementById("locationSearchStatus");

const addressSelect =
    document.getElementById("address");


/* ============================================================
   SEARCH LOCATION
============================================================ */

async function searchLocation() {

    if (!manualLocationSearch) {
        return;
    }

    const query =
        manualLocationSearch.value.trim();


    if (!query) {

        if (locationSearchStatus) {

            locationSearchStatus.textContent =
                "Please enter a location.";

        }

        manualLocationSearch.focus();

        return;
    }


    /* Clear previous results */

    if (locationSearchResults) {

        locationSearchResults.innerHTML = "";

    }


    /* Loading */

    if (locationSearchStatus) {

        locationSearchStatus.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                role="status">
            </span>
            Searching location...
        `;

    }


    if (searchLocationBtn) {

        searchLocationBtn.disabled = true;

    }


    try {

        /* ====================================================
           NOMINATIM
        ==================================================== */

        const params =
            new URLSearchParams({

                q: query,

                format: "json",

                addressdetails: "1",

                limit: "8",

                countrycodes: "ph"

            });


        const response =
            await fetch(
                "https://nominatim.openstreetmap.org/search?" +
                params.toString(),
                {
                    method: "GET",

                    headers: {

                        "Accept":
                            "application/json"

                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Location search failed."
            );

        }


        const results =
            await response.json();


        /* ====================================================
           NO RESULTS
        ==================================================== */

        if (
            !results ||
            results.length === 0
        ) {

            if (locationSearchStatus) {

                locationSearchStatus.textContent =
                    "No locations found.";

            }

            return;
        }


        /* ====================================================
           RESULT COUNT
        ==================================================== */

        if (locationSearchStatus) {

            locationSearchStatus.textContent =
                `${results.length} location(s) found.`;

        }


        /* ====================================================
           DISPLAY
        ==================================================== */

        results.forEach(
            function (result) {

                createLocationResult(result);

            }
        );


    } catch (error) {

        console.error(
            "Manual location search error:",
            error
        );


        if (locationSearchStatus) {

            locationSearchStatus.textContent =
                "Unable to search location.";

        }


        if (locationSearchResults) {

            locationSearchResults.innerHTML = `
                <div class="alert alert-danger">
                    Unable to search location.
                    Please try again.
                </div>
            `;

        }

    } finally {

        if (searchLocationBtn) {

            searchLocationBtn.disabled = false;

        }

    }

}


/* ============================================================
   CREATE RESULT
============================================================ */

function createLocationResult(result) {

    if (!locationSearchResults) {
        return;
    }


    const address =
        result.address || {};


    const formattedLocation =
        formatLocation(address);


    const button =
        document.createElement("button");


    button.type =
        "button";


    button.className =
        "list-group-item list-group-item-action";


    button.innerHTML = `

        <div class="fw-semibold">

            ${escapeHtml(
                formattedLocation ||
                result.display_name ||
                "Unknown location"
            )}

        </div>

        <div class="small text-muted mt-1">

            ${escapeHtml(
                result.display_name || ""
            )}

        </div>

    `;


    button.addEventListener(
        "click",
        function () {

            selectLocation(
                result,
                formattedLocation
            );

        }
    );


    locationSearchResults.appendChild(
        button
    );

}


/* ============================================================
   FORMAT LOCATION
============================================================

   REQUIRED:

   Street, Barangay, Town/City, Province
============================================================ */

/* ============================================================
   FORMAT LOCATION
   Street, Barangay, Town/City, Province
============================================================ */

function formatLocation(address, displayName) {

    if (!address) {
        return "";
    }

    const street = cleanValue(
        address.road ||
        address.street ||
        address.pedestrian ||
        address.footway ||
        address.path ||
        ""
    );

    const barangay = cleanValue(
        address.suburb ||
        address.village ||
        address.neighbourhood ||
        address.quarter ||
        address.hamlet ||
        ""
    );

    const townCity = cleanValue(
        address.city ||
        address.town ||
        address.municipality ||
        address.city_district ||
        ""
    );

    /* PROVINCE: check every candidate and keep the first one
       that is NOT a region name */

    const provinceCandidates = [
        address.province,
        address.county,
        address.state_district,
        address.state
    ];

    let province = "";

    for (const candidate of provinceCandidates) {

        const cleaned = cleanProvince(candidate);

        if (cleaned) {
            province = cleaned;
            break;
        }
    }

    /* Last resort: read it from display_name */

    if (!province && displayName) {
        province = provinceFromDisplayName(displayName);
    }

    const parts = [street, barangay, townCity, province].filter(
        function (value) {
            return value && value.trim() !== "";
        }
    );

    /* Remove duplicates (e.g. city and barangay with the same name) */

    const unique = parts.filter(function (value, index) {
        return parts.findIndex(function (v) {
            return v.toLowerCase() === value.toLowerCase();
        }) === index;
    });

    return unique.join(", ");
}


/* ============================================================
   PROVINCE FROM display_name (fallback)
============================================================ */

function provinceFromDisplayName(displayName) {

    const parts = displayName
        .split(",")
        .map(function (p) { return p.trim(); })
        .filter(Boolean);

    /* display_name ends with: ..., Province, Region, Postcode, Philippines.
       Walk from the end and take the first non-region, non-numeric part. */

    for (let i = parts.length - 1; i >= 0; i--) {

        const part = parts[i];

        if (/^\d+$/.test(part)) continue;
        if (part.toLowerCase() === "philippines") continue;

        const cleaned = cleanProvince(part);

        if (cleaned) {
            return cleaned;
        }
    }

    return "";
}


/* ============================================================
   CLEAN PROVINCE (returns "" for regions)
============================================================ */

function cleanProvince(value) {

    if (!value || typeof value !== "string") {
        return "";
    }

    const normalized = value.trim().toLowerCase();

    const regions = [
        "calabarzon",
        "central luzon",
        "ilocos region",
        "cagayan valley",
        "central visayas",
        "eastern visayas",
        "western visayas",
        "northern mindanao",
        "davao region",
        "soccsksargen",
        "caraga",
        "zamboanga peninsula",
        "bicol region",
        "mimaropa",
        "cordillera administrative region",
        "bangsamoro autonomous region in muslim mindanao",
        "national capital region",
        "metro manila",
        "ncr",
        "car",
        "region i",
        "region ii",
        "region iii",
        "region iv-a",
        "region iv-b",
        "region v",
        "region vi",
        "region vii",
        "region viii",
        "region ix",
        "region x",
        "region xi",
        "region xii",
        "region xiii",
        "philippines"
    ];

    if (regions.includes(normalized)) {
        return "";
    }

    return value.trim();
}




/* ============================================================
   CLEAN VALUE
============================================================ */

function cleanValue(value) {

    if (
        !value ||
        typeof value !== "string"
    ) {

        return "";

    }


    return value.trim();

}


/* ============================================================
   SELECT LOCATION
============================================================ */

function selectLocation(
    result,
    formattedLocation
) {

    /* ========================================================
       COORDINATES
    ======================================================== */

    const latitude =
        Number(result.lat);

    const longitude =
        Number(result.lon);


    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        console.error(
            "Invalid coordinates:",
            result
        );

        return;
    }


    /* ========================================================
       UPDATE ADDRESS DROPDOWN
    ======================================================== */

    if (addressSelect) {

        let option =
            Array.from(
                addressSelect.options
            ).find(
                function (item) {

                    return (
                        item.value ===
                        formattedLocation
                    );

                }
            );


        if (!option) {

            option =
                document.createElement(
                    "option"
                );


            option.value =
                formattedLocation;


            option.textContent =
                formattedLocation;


            addressSelect.appendChild(
                option
            );

        }


        addressSelect.value =
            formattedLocation;

    }


    /* ========================================================
       MANUAL LATITUDE
    ======================================================== */

    const manualLatitude =
        document.getElementById(
            "manualLatitude"
        );


    if (manualLatitude) {

        manualLatitude.value =
            latitude.toFixed(6);

    }


    /* ========================================================
       MANUAL LONGITUDE
    ======================================================== */

    const manualLongitude =
        document.getElementById(
            "manualLongitude"
        );


    if (manualLongitude) {

        manualLongitude.value =
            longitude.toFixed(6);

    }


    /* ========================================================
       GLOBAL VALUES
    ======================================================== */

    window.manualSearchLatitude =
        latitude;

    window.manualSearchLongitude =
        longitude;

    window.manualSearchAddress =
        formattedLocation;


    /* ========================================================
       EVENT
    ======================================================== */

    document.dispatchEvent(

        new CustomEvent(
            "manualLocationSelected",
            {

                detail: {

                    latitude:
                        latitude,

                    longitude:
                        longitude,

                    address:
                        formattedLocation,

                    result:
                        result

                }

            }

        )

    );


    /* ========================================================
       CLOSE MODAL
    ======================================================== */

    const modalElement =
        document.getElementById(
            "manualLocationModal"
        );


    if (
        modalElement &&
        typeof bootstrap !== "undefined"
    ) {

        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );


        if (modal) {

            modal.hide();

        }

    }

}


/* ============================================================
   SEARCH BUTTON
============================================================ */

if (searchLocationBtn) {

    searchLocationBtn.addEventListener(
        "click",
        searchLocation
    );

}


/* ============================================================
   ENTER KEY
============================================================ */

if (manualLocationSearch) {

    manualLocationSearch.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                searchLocation();

            }

        }
    );

}


/* ============================================================
   MODAL
============================================================ */

const manualLocationModal =
    document.getElementById(
        "manualLocationModal"
    );


if (manualLocationModal) {

    manualLocationModal.addEventListener(
        "shown.bs.modal",
        function () {

            if (manualLocationSearch) {

                manualLocationSearch.focus();

            }

        }
    );


    manualLocationModal.addEventListener(
        "hidden.bs.modal",
        function () {

            if (manualLocationSearch) {

                manualLocationSearch.value =
                    "";

            }


            if (locationSearchResults) {

                locationSearchResults.innerHTML =
                    "";

            }


            if (locationSearchStatus) {

                locationSearchStatus.textContent =
                    "";

            }

        }
    );

}


/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHtml(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value || "";


    return div.innerHTML;

}
 
