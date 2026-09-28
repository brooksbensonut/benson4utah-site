// Brooks Benson Campaign Website JavaScript

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
});

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header Scroll Effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = '#ffffff';
        header.style.backdropFilter = 'none';
    }
});

// Google Apps Script endpoint
const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxjDmHXRfz7YS2ztjpZ7zgerhnTurjB5hrwmL-k_5weK2BmPMlvjD5-ZyT6orBYRWV0/exec';

// Rate limiting - 60 seconds between submissions per form type
function canSubmit(formType) {
    const key = 'lastSubmit_' + formType;
    const lastSubmit = localStorage.getItem(key);
    const now = Date.now();
    if (lastSubmit && (now - parseInt(lastSubmit)) < 60000) {
        return false;
    }
    localStorage.setItem(key, now.toString());
    return true;
}

// Sign-up forms (homepage Stay Connected, text.html)
function showFormError(form, message) {
    const el = form.querySelector('.form-error');
    if (!el) {
        if (message) alert(message);
        return;
    }
    el.textContent = message;
    el.hidden = !message;
}

document.querySelectorAll('.sms-signup').forEach(function(form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const btn = this.querySelector('button[type="submit"]');
        const honeypot = this.querySelector('input[name="website"]');
        const smsConsent = this.querySelector('input[name="sms_consent"]').checked;
        const email = this.querySelector('input[name="email"]').value.trim();

        // Honeypot check
        if (honeypot && honeypot.value) {
            alert('Thank you for subscribing!'); // Fake success for bots
            return;
        }

        const check = SmsConsent.validateSignup({
            email: email,
            phone: this.querySelector('input[name="phone"]').value,
            smsConsent: smsConsent
        });
        if (!check.ok) {
            showFormError(this, check.error);
            return;
        }
        showFormError(this, '');

        if (!canSubmit('signup')) {
            alert('Please wait a moment before submitting again.');
            return;
        }

        const label = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Sending...';

        const data = Object.assign({
            type: 'signup',
            source: this.dataset.source,
            email: email,
            phone: check.phone,
            zip: this.querySelector('input[name="zip"]').value.trim()
        }, SmsConsent.buildConsentRecord({ smsConsent: smsConsent, pageUrl: window.location.href, now: new Date() }));

        fetch(FORM_ENDPOINT, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(() => {
            alert(smsConsent
                ? 'Thanks for signing up! You\'ll get campaign updates by email and text.'
                : 'Thank you for subscribing! You\'ll receive updates about Brooks\'s campaign.');
            this.reset();
            btn.disabled = false;
            btn.textContent = label;
        })
        .catch(() => {
            alert(SmsConsent.MESSAGES.sendFailed);
            btn.disabled = false;
            btn.textContent = label;
        });
    });
});

// Volunteer Form
const volunteerForm = document.getElementById('volunteerForm');
if (volunteerForm) {
    volunteerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const btn = this.querySelector('button[type="submit"]');
        const honeypot = this.querySelector('input[name="website"]');

        const smsConsent = this.querySelector('input[name="sms_consent"]').checked;

        // Honeypot check
        if (honeypot && honeypot.value) {
            alert('Thank you for volunteering!'); // Fake success for bots
            return;
        }

        const check = SmsConsent.validateSignup({
            email: this.querySelector('#vol-email').value,
            phone: this.querySelector('#vol-phone').value,
            smsConsent: smsConsent
        });
        if (!check.ok) {
            alert(check.error);
            return;
        }

        if (!canSubmit('volunteer')) {
            alert('Please wait a moment before submitting again.');
            return;
        }

        // Gather checkbox values
        const availability = Array.from(this.querySelectorAll('input[name="availability"]:checked'))
            .map(cb => cb.value).join(', ');
        const interests = Array.from(this.querySelectorAll('input[name="interests"]:checked'))
            .map(cb => cb.value).join(', ');

        const data = Object.assign({
            type: 'volunteer',
            name: this.querySelector('#vol-name').value,
            email: this.querySelector('#vol-email').value,
            phone: check.phone,
            location: this.querySelector('#vol-location').value,
            availability: availability,
            interests: interests,
            comments: this.querySelector('#vol-comments').value
        }, SmsConsent.buildConsentRecord({ smsConsent: smsConsent, pageUrl: window.location.href, now: new Date() }));

        btn.disabled = true;
        btn.textContent = 'Sending...';

        fetch(FORM_ENDPOINT, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(() => {
            alert('Thank you for volunteering! We\'ll be in touch soon.');
            this.reset();
            btn.disabled = false;
            btn.textContent = 'Sign Up to Volunteer';
            closeVolunteerModal();
        })
        .catch(() => {
            alert(SmsConsent.MESSAGES.sendFailed);
            btn.disabled = false;
            btn.textContent = 'Sign Up to Volunteer';
        });
    });
}

// Donation Amount Selection
document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all buttons
        document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        this.classList.add('active');
        
        // Update donate button text with selected amount
        const amount = this.textContent;
        const donateBtn = this.parentElement.nextElementSibling;
        donateBtn.textContent = `Donate ${amount}`;
    });
});

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.problem-card, .solution-card, .issue-card, .involvement-card');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Volunteer Modal Functions
function openVolunteerModal() {
    const modal = document.getElementById('volunteer-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeVolunteerModal() {
    const modal = document.getElementById('volunteer-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on overlay click (not content)
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('volunteer-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeVolunteerModal();
            }
        });
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeVolunteerModal();
    }
});

// Add event listeners for volunteer buttons
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href="#volunteer-form"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            openVolunteerModal();
        });
    });
});

// Donation handling now in config.js via openDonationPage() → donation modal

// Analytics setup and trackEvent/trackCTA/trackFormSubmission live in config.js
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.sms-signup').forEach(form => {
        form.addEventListener('submit', function() {
            trackFormSubmission(this.dataset.source);
        });
    });

    document.querySelectorAll('a[href="#volunteer-form"]').forEach(btn => {
        btn.addEventListener('click', function() {
            trackCTA('volunteer', 'volunteer-modal');
        });
    });
});

// Performance optimization - Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}