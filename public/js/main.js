/** Broward Realtor System - Main Entry */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 Broward Realtor System Loaded');

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) { target.scrollIntoView({ behavior: 'smooth' }); }
        });
    });

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'contact_form',
                    email: contactForm.querySelector('[type="email"]').value
                })
            });
            alert("Thank you! We'll be in touch shortly.");
            contactForm.reset();
        });
    }

    document.getElementById('get-valuation')?.addEventListener('click', () => {
        document.getElementById('valuation-tool')?.scrollIntoView({ behavior: 'smooth' });
    });
});
