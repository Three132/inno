document.addEventListener('DOMContentLoaded', () => {
    // ---- Elements ----
    const filterPills = document.querySelectorAll('.filter-pill');
    const cards = document.querySelectorAll('.card');
    const modal = document.getElementById('detail-modal');
    const closeModalBtn = document.querySelector('.close-btn');

    // ---- Filtering Logic ----
    function filterCards(category) {
        cards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.style.display = 'block';
                // Animation reset
                card.style.animation = 'none';
                card.offsetHeight; /* trigger reflow */
                card.style.animation = 'fadeIn 0.5s'; 
            } else {
                card.style.display = 'none';
            }
        });
    }

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Remove active class from all
            filterPills.forEach(p => p.classList.remove('active'));
            // Add active class to clicked
            pill.classList.add('active');
            
            const category = pill.dataset.filter;
            filterCards(category);
        });
    });

    // Initialize Filter (Trigger based on active pill)
    const activePill = document.querySelector('.filter-pill.active');
    if(activePill) {
        filterCards(activePill.dataset.filter);
    }

    // ---- Modal Logic ----
    // Open Modal
    cards.forEach(card => {
        // If the card is wrapped in a link (like Soil Analysis), skip modal event
        if (card.closest('a')) return;

        card.addEventListener('click', () => {
            const title = card.querySelector('.card-title').textContent;
            const content = card.querySelector('.card-desc').textContent;
            const imgSrc = card.querySelector('.card-image').src;
            const tag = card.querySelector('.card-tag').innerText;

            // Populate Modal Elements
            const modalImg = document.getElementById('modal-img');
            const modalTag = document.getElementById('modal-tag');
            const modalTitle = document.getElementById('modal-title');
            const modalDesc = document.getElementById('modal-desc');

            if(modalImg) modalImg.src = imgSrc;
            if(modalTag) modalTag.innerText = tag;
            if(modalTitle) modalTitle.innerText = title;
            if(modalDesc) {
                modalDesc.innerHTML = `
                    ${content} <br><br>
                    <span style="color:var(--primary-color)">>> ACCESSING DATABASE...</span><br>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                `;
            }

            if(modal) {
                modal.classList.add('open');
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
            }
        });
    });

    // Close Modal
    if(closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        });
    }

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (modal && e.target === modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
});

// Helper: HSV to RGB (kept if needed for animations, though mostly used in soil_analysis.js now)
function hsvToRgb(h, s, v) {
    let r, g, b;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Add naive fade-in animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(style);
