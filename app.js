// HIGHTOUCH EVENTS APP.JS FILE –– LAST UPDATED: 11/25/2024 AT 5:00 PM PT //
// Additions: Improved "Complete Form" event tracking, decoupled from pageview tracking

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

// Function to get additional parameters (includes only "user_id")
async function getAdditionalParams() {
    let ipData = {};
    try {
        const ipv4Response = await fetch('https://api.ipify.org?format=json');
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
        console.error("Error fetching IP and geo data:", error);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');

    return {
        ...ipData,
        utmParameters: {
            source: urlParams.get('utm_source'),
            medium: urlParams.get('utm_medium'),
            campaign: urlParams.get('utm_campaign'),
            id: urlParams.get('utm_id'),
            term: urlParams.get('utm_term'),
            content: urlParams.get('utm_content'),
            fbclid: fbclid,
            gclid: urlParams.get('gclid'),
            atrefid: urlParams.get('atrefid'),
            ad_id: urlParams.get('ad_id'),
            adset_id: urlParams.get('adset_id'),
            campaign_id: urlParams.get('campaign_id'),
            ad_name: urlParams.get('ad_name'),
            adset_name: urlParams.get('adset_name'),
            campaign_name: urlParams.get('campaign_name'),
            placement: urlParams.get('placement'),
            site_source_name: urlParams.get('site_source_name'),
            gbraid: urlParams.get('gbraid'),
            wbraid: urlParams.get('wbraid'),
            ttclid: urlParams.get('ttclid'),
            sccid: urlParams.get('ScCid')
        },
        fbc: getFBC(fbclid),
        fbp: getFBP(),
        device_id: getDeviceId(),
        directory: window.location.pathname.split('/')[1],
        user_id: getUserIdFromDataLayer()
    };
}

// Track page views independently
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
            console.log("Page view tracked successfully.");
        }
    );
}

// Track initial page view
trackPageView();

// Initialize form event listener
function initializeFormEventListener() {
    const form = document.querySelector(".react-form-contents");

    if (!form) {
        console.warn("Form with class 'react-form-contents' not found.");
        return;
    }

    console.log("Form found. Adding submit event listener.");
    form.addEventListener("submit", async function(event) {
        event.preventDefault(); // Prevent default form submission

        const formData = {
            first_name: document.querySelector("#name-yui_3_17_2_1_1733252193375_12106-fname-field")?.value || null,
            last_name: document.querySelector("#name-yui_3_17_2_1_1733252193375_12106-lname-field")?.value || null,
            email: document.querySelector("#email-yui_3_17_2_1_1733252193375_12107-field")?.value || null,
            phone_country: document.querySelector("#phone-c48ec3b8-6c62-4462-aa21-af587054f3ef-country-code-field")?.value || null,
            phone_number: document.querySelector("#phone-c48ec3b8-6c62-4462-aa21-af587054f3ef-input-field")?.value || null
        };

        const additionalParams = await getAdditionalParams();
        const payload = { ...formData, ...additionalParams };

        console.log("Complete Form data captured:", payload);

        // Push to dataLayer
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "complete_form", form_data: payload });

        // Send to Hightouch
        window.htevents.track(
            "complete_form",
            payload,
            {},
            function() {
                console.log("Complete Form event tracked to Hightouch successfully:", payload);
            }
        );

        // Optionally, submit form after tracking
        // form.submit();
    });
}

// Observe DOM for dynamically loaded form
function observeForm() {
    const observer = new MutationObserver(() => {
        const form = document.querySelector(".react-form-contents");
        if (form) {
            observer.disconnect(); // Stop observing
            initializeFormEventListener(); // Attach event listener
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Run form initialization independently
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".react-form-contents");
    if (form) {
        initializeFormEventListener();
    } else {
        observeForm();
    }
});
