// TEMPORARY: Force show update banner for testing on mobile
// Delete this file after testing!

setTimeout(() => {
    console.log('🧪 TEST MODE: Forcing update banner for mobile test');
    
    const banner = document.createElement('div');
    banner.id = 'testBanner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #ff7043 0%, #f4511e 100%);
        color: white;
        padding: 20px;
        text-align: center;
        font-weight: bold;
        font-size: 18px;
        z-index: 99999;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        cursor: pointer;
    `;
    
    banner.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto;">
            <div style="font-size: 32px; margin-bottom: 8px;">🧪</div>
            <div style="font-size: 18px; margin-bottom: 8px;">
                TEST MODE - Banner Working!
            </div>
            <div style="font-size: 14px; opacity: 0.9;">
                Tap to reload page
            </div>
        </div>
    `;
    
    banner.addEventListener('click', () => {
        window.location.reload(true);
    });
    
    document.body.insertBefore(banner, document.body.firstChild);
    console.log('🧪 Test banner displayed!');
}, 2000);
