// HIGHTOUCH EVENTS APP.JS FILE –– REFINED ON 11/25/2024 //

console.log("Hightouch Events script initialized.");

// Function to remove empty properties from objects
function removeEmptyProperties(obj) {
    if (typeof obj !== "object" || obj === null) return obj;
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === "object" && value !== null) {
                obj[key] = removeEmptyProperties(value);
            }
            if (obj[key] === null || obj[key] === "" || obj[key] === undefined) {
                delete obj[key];
            }
        }
    }
    return Object.keys(obj).length === 0 && obj.constructor === Object ? {} : obj;
}

// Enable debugging in development mode
window.htevents.debug(false);

// Function to generate a 36-character, 128-bit GUID with hyphens
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Function to get or generate a unique Device ID (GUID)
function getDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = generateGUID();
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
}

// Function to get or generate a unique Session ID (GUID)
function getSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
        sessionId = generateGUID();
        sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
}

// Helper function to fetch additional parameters (e.g., geo, IP)
async function getAdditionalParams() {
    try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipResponse.json();

        const geoResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
        const geoData = await geoResponse.json();

        return {
            ipAddress: ipData.ip,
            userCountry: geoData.country_name,
            userRegion: geoData.region,
            userCity: geoData.city,
            userPostal: geoData.postal,
            device_id: getDeviceId()
        };
    } catch (error) {
        console.error("Error fetching additional parameters:", error);
        return {};
    }
}

// Function to track page views
async function trackPageView() {
    const additionalParams = await getAdditionalParams();
    const eventName = document.title;

    window.htevents.page(
        "Page View",
        eventName,
        {
            hostname: window.location.hostname,
            path: window.location.pathname,
            ...additionalParams
        },
        {
            ip: additionalParams.ipAddress
        },
        function() {
            console.log("Page view event successfully tracked:", eventName);
        }
    );
}

// Track initial page view on load
document.addEventListener("DOMContentLoaded", () => {
    console.log("Tracking page view event.");
    trackPageView();
});

// Function to track Complete Form event
function initializeFormEventListener() {
    const form = document.querySelector(".react-form-contents");

    if (!form) {
        console.warn("Form with class 'react-form-contents' not found.");
        return;
    }

    console.log("Form found. Adding submit event listener.");

    form.addEventListener("submit", async function(event) {
        event.preventDefault(); // Prevent default form submission

        console.log("Form submitted. Capturing data...");
        const formData = {
            first_name: document.querySelector("#name-yui_3_17_2_1_1733252193375_12106-fname-field")?.value || null,
            last_name: document.querySelector("#name-yui_3_17_2_1_1733252193375_12106-lname-field")?.value || null,
            email: document.querySelector("#email-yui_3_17_2_1_1733252193375_12107-field")?.value || null,
            phone_country: document.querySelector("#phone-c48ec3b8-6c62-4462-aa21-af587054f3ef-country-code-field")?.value || null,
            phone_number: document.querySelector("#phone-c48ec3b8-6c62-4462-aa21-af587054f3ef-input-field")?.value || null
        };

        console.log("Captured form data:", formData);

        // Fetch additional parameters
        const additionalParams = await getAdditionalParams();
        const payload = { ...formData, ...additionalParams };

        console.log("Complete Form payload prepared:", payload);

        // Push to dataLayer
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "complete_form", form_data: payload });

        console.log("Complete Form event pushed to dataLayer.");

        // Send to Hightouch
        window.htevents.track(
            "complete_form",
            payload,
            {},
            function() {
                console.log("Complete Form event successfully tracked to Hightouch:", payload);
            }
        );

        // Optionally submit form after tracking
        // form.submit();
    });
}

// Observe DOM for dynamically added forms
function observeForm() {
    console.log("Observing for form with MutationObserver...");

    const observer = new MutationObserver(() => {
        const form = document.querySelector(".react-form-contents");
        if (form) {
            console.log("Form detected via MutationObserver.");
            observer.disconnect(); // Stop observing
            initializeFormEventListener(); // Attach event listener
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Initialize form tracking on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".react-form-contents");
    if (form) {
        console.log("Form found during DOMContentLoaded.");
        initializeFormEventListener();
    } else {
        console.warn("Form not found during DOMContentLoaded. Setting up observer...");
        observeForm();
    }
});
