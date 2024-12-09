// HIGHTOUCH EVENTS APP.JS FILE –– LAST UPDATED: 11/25/2024 AT 4:45 PM PT //
// Additions: Separated "Complete Form" and "Pageview" tracking to work independently.

console.log("Hightouch Events script initialized.");

// Utility Functions
function removeEmptyProperties(obj) {
    if (typeof obj !== "object" || obj === null) return obj;
    for (const key in obj) if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        typeof value === "object" && value !== null && (obj[key] = removeEmptyProperties(value));
        (obj[key] === null || obj[key] === "" || obj[key] === undefined) && delete obj[key];
    }
    return Object.keys(obj).length === 0 && obj.constructor === Object ? {} : obj;
}

// Enable debugging in development mode
window.htevents.debug(false);

// Generate a GUID
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Unique Device ID
function getDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = generateGUID();
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
}

// Generate FBC (Facebook Click ID)
function getFBC(fbclid) {
    const cookieValue = document.cookie
        .split("; ")
        .find(row => row.startsWith("_fbc="))
        ?.split("=")[1];
    return cookieValue || (fbclid ? generateFBC(fbclid) : null);
}

function generateFBC(fbclid) {
    const timestamp = Math.floor(Date.now() / 1000);
    const fbc = `fb.${window.location.hostname}.${timestamp}.${fbclid}`;
    document.cookie = `_fbc=${fbc}; path=/; expires=${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()}; SameSite=Lax`;
    return fbc;
}

// Generate FBP (Facebook Browser ID)
function getFBP() {
    const cookieValue = document.cookie
        .split("; ")
        .find(row => row.startsWith("_fbp="))
        ?.split("=")[1];
    return cookieValue || generateFBP();
}

function generateFBP() {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const randomNumber = Math.random().toString(36).substring(2, 15);
    const fbp = `fb.1.${timestamp}.${randomNumber}`;
    document.cookie = `_fbp=${fbp}; path=/; expires=${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()}; SameSite=Lax`;
    return fbp;
}

// Additional Parameters
async function getAdditionalParams() {
    let ipData = {};
    try {
        const ipv4Response = await fetch("https://api.ipify.org?format=json");
        const ipv4Data = await ipv4Response.json();
        ipData.ipAddress = ipv4Data.ip;

        const geoResponse = await fetch(`https://ipapi.co/${ipv4Data.ip}/json/`);
        const geoData = await geoResponse.json();
        ipData = {
            ...ipData,
            userCountry: geoData.country_name,
            userRegion: geoData.region,
            userCity: geoData.city,
            userPostal: geoData.postal
        };
    } catch (error) {
        console.error("Error fetching IP/Geo data:", error);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get("fbclid");

    return {
        ...ipData,
        utmParameters: {
            source: urlParams.get("utm_source"),
            medium: urlParams.get("utm_medium"),
            campaign: urlParams.get("utm_campaign"),
            term: urlParams.get("utm_term"),
            content: urlParams.get("utm_content"),
            fbclid: fbclid,
            gclid: urlParams.get("gclid"),
            fbc: getFBC(fbclid),
            fbp: getFBP(),
            device_id: getDeviceId()
        }
    };
}

// Track Page Views (Always Executes)
async function trackPageView() {
    try {
        const additionalParams = await getAdditionalParams();
        window.htevents.page(
            "pageview",
            document.title,
            {
                hostname: window.location.hostname,
                path: window.location.pathname,
                ...additionalParams
            },
            {
                ip: additionalParams.ipAddress
            },
            function() {
                console.log("Page view tracked:", document.title);
            }
        );
    } catch (error) {
        console.error("Error tracking page view:", error);
    }
}

// Initialize Form Tracking
function initializeFormEventListener() {
    const form = document.querySelector(".react-form-contents");

    if (form) {
        console.log("Form found. Adding submit event listener.");
        form.addEventListener("submit", async function(event) {
            event.preventDefault();

            const formData = {
                first_name: document.querySelector("#name-yui_3_17_2_1_1733252193375_12106-fname-field")?.value || null,
                last_name: document.querySelector("#name-yui_3_17_2_1_1733252193375_12106-lname-field")?.value || null,
                email: document.querySelector("#email-yui_3_17_2_1_1733252193375_12107-field")?.value || null
            };

            const additionalParams = await getAdditionalParams();
            const payload = {
                ...formData,
                ...additionalParams
            };

            console.log("Complete Form data captured:", payload);

            // Send to Hightouch
            window.htevents.track("complete_form", payload, {}, function() {
                console.log("Complete Form event tracked:", payload);
            });

            // Optionally, submit the form after tracking
            // form.submit();
        });
    } else {
        console.warn("Form with class 'react-form-contents' not found.");
    }
}

// DOMContentLoaded: Separate Tracking
document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing Hightouch Events...");
    trackPageView(); // Always track page views
    initializeFormEventListener(); // Form tracking
});
