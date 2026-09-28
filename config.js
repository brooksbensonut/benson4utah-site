/**
 * Brooks Benson for Utah Senate Campaign
 * Site Configuration & Analytics
 */

// ============================================
// ANALYTICS CONFIGURATION
// ============================================
const ANALYTICS_CONFIG = {
  // Google Analytics 4 Measurement ID
  ga4MeasurementId: 'G-31E2K8VDL7',

  // Enable/disable tracking (set false for development)
  enabled: true,

  // Track these events automatically
  autoTrack: {
    pageViews: true,
    scrollDepth: true,
    outboundLinks: true,
    formSubmissions: true,
    donationClicks: true
  }
};

// ============================================
// WINRED DONATION CONFIGURATION
// ============================================
const WINRED_CONFIG = {
  // Base WinRed donation page URL (without https://)
  baseUrl: 'secure.winred.com/brooks-benson-4-utah/donate-today',

  // Default donation amounts to display on buttons
  defaultAmounts: [25, 50, 100, 250],

  // Source codes for tracking different donation entry points
  sourceCodes: {
    footer: 'website-footer',
    hero: 'website-hero',
    navbar: 'website-nav',
    getInvolved: 'website-get-involved'
  },

  // Default URL parameters
  defaults: {
    coverFees: true,      // Pre-check "cover processing fees" option
    recurring: false      // Don't pre-check recurring donations
  }
};

/**
 * Build WinRed donation URL with parameters
 * @param {number|null} amount - Donation amount (optional)
 * @param {string} source - Source code for tracking
 * @param {object} options - Additional URL parameters
 * @returns {string} Complete WinRed URL
 */
function buildWinRedUrl(amount = null, source = 'website', options = {}) {
  let url = `https://${WINRED_CONFIG.baseUrl}`;
  const params = [];

  // Add amount if specified
  if (amount !== null) {
    params.push(`amount=${amount}`);
  }

  // Add source code for tracking
  params.push(`sc=${source}`);

  // Add cover fees option
  const coverFees = options.coverFees !== undefined ? options.coverFees : WINRED_CONFIG.defaults.coverFees;
  params.push(`cover_fees=${coverFees}`);

  // Add recurring option
  const recurring = options.recurring !== undefined ? options.recurring : WINRED_CONFIG.defaults.recurring;
  params.push(`recurring=${recurring}`);

  // Combine URL with parameters
  if (params.length > 0) {
    url += '?' + params.join('&');
  }

  return url;
}

/**
 * Open donation method modal instead of going directly to WinRed.
 * Stores amount/source so WinRed path still gets full tracking.
 * @param {number|null} amount - Donation amount (optional)
 * @param {string} source - Source code for tracking
 */
function openDonationPage(amount = null, source = 'website') {
  // Store for WinRed passthrough
  window._donationPending = { amount, source };
  trackEvent('donation_modal_shown', { amount: amount, source: source });
  showDonationModal();
}

/**
 * Proceed to WinRed with stored amount/source
 */
function proceedToWinRed() {
  const pending = window._donationPending || {};
  const url = buildWinRedUrl(pending.amount, pending.source);
  trackEvent('donation_method_selected', { method: 'winred', amount: pending.amount, source: pending.source });
  closeDonationModal();
  window.open(url, '_blank');
}

/**
 * Proceed to Venmo - deep link on mobile, web URL on desktop
 */
function proceedToVenmo() {
  const pending = window._donationPending || {};
  trackEvent('donation_method_selected', { method: 'venmo', amount: pending.amount, source: pending.source });

  // Show Venmo detail view inside the modal
  const step1 = document.getElementById('donate-step-choose');
  const step2 = document.getElementById('donate-step-venmo');
  if (step1 && step2) {
    step1.style.display = 'none';
    step2.style.display = 'block';
  }
}

/**
 * Open Venmo app (mobile deep link) or web fallback
 */
function openVenmoApp() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    // Try deep link first, fall back to web URL
    window.location.href = VENMO_CONFIG.deepLink;
    setTimeout(function() {
      window.open(VENMO_CONFIG.url, '_blank');
    }, 1500);
  } else {
    window.open(VENMO_CONFIG.url, '_blank');
  }
}

/**
 * Show the donation method modal
 */
function showDonationModal() {
  let modal = document.getElementById('donation-modal');
  if (!modal) {
    createDonationModal();
    modal = document.getElementById('donation-modal');
  }
  // Reset to step 1
  const step1 = document.getElementById('donate-step-choose');
  const step2 = document.getElementById('donate-step-venmo');
  if (step1) step1.style.display = 'block';
  if (step2) step2.style.display = 'none';

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Close the donation method modal
 */
function closeDonationModal() {
  const modal = document.getElementById('donation-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Create donation modal DOM elements dynamically.
 * This means zero HTML changes needed across pages.
 */
function createDonationModal() {
  const modal = document.createElement('div');
  modal.id = 'donation-modal';
  modal.className = 'modal-overlay';
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeDonationModal();
  });

  modal.innerHTML = `
    <div class="modal-content donate-modal-content">
      <button class="modal-close" onclick="closeDonationModal()">&times;</button>

      <!-- Step 1: Choose method -->
      <div id="donate-step-choose">
        <h2>How would you like to give?</h2>
        <p class="modal-intro">Choose your preferred donation method</p>

        <button class="donate-method-btn donate-method-winred" onclick="proceedToWinRed()">
          <span class="donate-method-icon">&#128179;</span>
          <span class="donate-method-label">
            <strong>Credit / Debit Card</strong>
            <span>Secure donation via WinRed</span>
          </span>
        </button>

        <button class="donate-method-btn donate-method-venmo" onclick="proceedToVenmo()">
          <span class="donate-method-icon">&#128241;</span>
          <span class="donate-method-label">
            <strong>Venmo</strong>
            <span>Send directly from the app</span>
          </span>
        </button>

        <p class="donate-disclosure">All contributions are reported per Utah campaign finance law.</p>
      </div>

      <!-- Step 2: Venmo details -->
      <div id="donate-step-venmo" style="display:none;">
        <button class="donate-back-btn" onclick="document.getElementById('donate-step-choose').style.display='block'; document.getElementById('donate-step-venmo').style.display='none';">&larr; Back</button>
        <h2>Donate via Venmo</h2>
        <p class="modal-intro">Scan the QR code or tap the button below</p>

        <div class="venmo-qr-container">
          <img src="qr-venmo.png" alt="Venmo QR Code for @brooksbenson4utah" class="venmo-qr-img" />
        </div>

        <p class="venmo-handle">@brooksbenson4utah</p>

        <button class="btn btn-primary venmo-open-btn" onclick="openVenmoApp()">Open Venmo</button>

        <p class="venmo-note">Please include your full name in the payment note for campaign reporting.</p>
        <p class="donate-disclosure">All contributions are reported per Utah campaign finance law.</p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

// Close donation modal on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeDonationModal();
  }
});

// ============================================
// ANALYTICS TRACKING FUNCTIONS
// ============================================

/**
 * Initialize Google Analytics 4
 */
function initAnalytics() {
  if (!ANALYTICS_CONFIG.enabled) return;

  // Load GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.ga4MeasurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', ANALYTICS_CONFIG.ga4MeasurementId, {
    page_title: document.title,
    page_location: window.location.href,
    custom_map: {
      'dimension1': 'issue_page',
      'dimension2': 'utm_source',
      'dimension3': 'utm_campaign'
    }
  });

  // Parse and store UTM parameters
  parseUtmParams();

  // Auto-track scroll depth if enabled
  if (ANALYTICS_CONFIG.autoTrack.scrollDepth) {
    initScrollTracking();
  }
}

/**
 * Track custom event to GA4
 * @param {string} eventName - Event name
 * @param {object} params - Event parameters
 */
function trackEvent(eventName, params = {}) {
  if (!ANALYTICS_CONFIG.enabled || typeof gtag === 'undefined') return;

  // Add UTM params to all events
  const utmParams = getStoredUtmParams();
  const fullParams = { ...params, ...utmParams };

  gtag('event', eventName, fullParams);
}

/**
 * Track page view (for SPA-style navigation)
 * @param {string} pagePath - Page path
 * @param {string} pageTitle - Page title
 */
function trackPageView(pagePath, pageTitle) {
  if (!ANALYTICS_CONFIG.enabled || typeof gtag === 'undefined') return;

  gtag('config', ANALYTICS_CONFIG.ga4MeasurementId, {
    page_path: pagePath,
    page_title: pageTitle
  });
}

/**
 * Parse UTM parameters from URL and store in session
 */
function parseUtmParams() {
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const utmData = {};

  utmKeys.forEach(key => {
    const value = params.get(key);
    if (value) {
      utmData[key] = value;
    }
  });

  if (Object.keys(utmData).length > 0) {
    sessionStorage.setItem('campaign_utm', JSON.stringify(utmData));
  }
}

/**
 * Get stored UTM parameters
 * @returns {object} UTM parameters
 */
function getStoredUtmParams() {
  try {
    return JSON.parse(sessionStorage.getItem('campaign_utm')) || {};
  } catch {
    return {};
  }
}

/**
 * Track scroll depth milestones
 */
function initScrollTracking() {
  const milestones = [25, 50, 75, 100];
  const tracked = new Set();

  window.addEventListener('scroll', () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );

    milestones.forEach(milestone => {
      if (scrollPercent >= milestone && !tracked.has(milestone)) {
        tracked.add(milestone);
        trackEvent('scroll_depth', { percent: milestone, page: window.location.pathname });
      }
    });
  }, { passive: true });
}

/**
 * Track CTA button clicks
 * @param {string} ctaName - Name of the CTA
 * @param {string} location - Where on page (hero, sidebar, footer, etc)
 */
function trackCTA(ctaName, location) {
  trackEvent('cta_click', { cta_name: ctaName, cta_location: location });
}

/**
 * Track form submissions
 * @param {string} formName - Name of the form
 */
function trackFormSubmission(formName) {
  trackEvent('form_submit', { form_name: formName });
}

// ============================================
// VENMO DONATION CONFIGURATION
// ============================================
const VENMO_CONFIG = {
  handle: 'brooksbenson4utah',
  url: 'https://www.venmo.com/u/brooksbenson4utah',
  deepLink: 'venmo://paycharge?txn=pay&recipients=brooksbenson4utah'
};

// Initialize analytics on page load
document.addEventListener('DOMContentLoaded', initAnalytics);
