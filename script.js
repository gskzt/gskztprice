// Storage keys
const STORAGE_CARDS = 'video_service_cards';
const STORAGE_CREDENTIALS = 'video_service_credentials';

// Default data
const defaultCards = [
    { id: 1, title: 'Шашки по городу', price: 4000, description: '' },
    { id: 2, title: 'Шашки по городу с сергеком', price: 5000, description: '' },
    { id: 3, title: '1 минутный видео', price: 6000, description: '' },
    { id: 4, title: '1 минутный видео с полицейскими', price: 7000, description: '' },
    { id: 5, title: '1 минутный видео полносюжетный (полицейские+сергек)', price: 8000, description: '' }
];

const defaultCredentials = {
    username: 'admin',
    password: 'admin123'
};

// State
let cards = [];
let currentIndex = 2; // Start with middle card (index 2)
let isAdmin = false;
let credentials = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCredentials();
    loadCards();
    initCarousel();
    initAdminPanel();
    initKeyboardNavigation();
});

// Load/Save Functions
function loadCredentials() {
    const stored = localStorage.getItem(STORAGE_CREDENTIALS);
    if (stored) {
        credentials = JSON.parse(stored);
    } else {
        credentials = { ...defaultCredentials };
        saveCredentials();
    }
}

function saveCredentials() {
    localStorage.setItem(STORAGE_CREDENTIALS, JSON.stringify(credentials));
}

function loadCards() {
    const stored = localStorage.getItem(STORAGE_CARDS);
    if (stored) {
        cards = JSON.parse(stored);
    } else {
        cards = defaultCards.map(card => ({ ...card }));
        saveCards();
    }
    renderCards();
}

function saveCards() {
    localStorage.setItem(STORAGE_CARDS, JSON.stringify(cards));
}

// Carousel Functions
function initCarousel() {
    renderCards();
    scheduleCarouselUpdate();
    
    document.getElementById('prevBtn').addEventListener('click', (e) => {
        if (currentIndex === 0) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (currentIndex > 0) {
            currentIndex--;
            scheduleCarouselUpdate();
        }
    });
    
    document.getElementById('nextBtn').addEventListener('click', (e) => {
        if (currentIndex === cards.length - 1) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (currentIndex < cards.length - 1) {
            currentIndex++;
            scheduleCarouselUpdate();
        }
    });
    
    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    const carouselTrack = document.getElementById('carouselTrack');
    
    carouselTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    carouselTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && currentIndex < cards.length - 1) {
                currentIndex++;
                scheduleCarouselUpdate();
            } else if (diff < 0 && currentIndex > 0) {
                currentIndex--;
                scheduleCarouselUpdate();
            }
        }
    }
}

function renderCards() {
    const carouselTrack = document.getElementById('carouselTrack');
    const indicators = document.getElementById('indicators');
    
    carouselTrack.innerHTML = '';
    indicators.innerHTML = '';
    
    cards.forEach((card, index) => {
        // Create card element
        const cardElement = document.createElement('div');
        cardElement.className = 'carousel-card';
        cardElement.dataset.index = index;
        
        if (index === currentIndex) {
            cardElement.classList.add('active');
        }
        
        cardElement.innerHTML = `
            <h3 class="carousel-card-title">${escapeHtml(card.title)}</h3>
            <div class="carousel-card-price">${formatPrice(card.price)} тг</div>
            ${card.description ? `<p class="carousel-card-description">${escapeHtml(card.description)}</p>` : ''}
            <button class="carousel-card-btn" onclick="openWhatsApp(${card.id})">Заказать</button>
        `;
        
        carouselTrack.appendChild(cardElement);
        
        // Create indicator
        const indicator = document.createElement('button');
        indicator.className = 'indicator';
        if (index === currentIndex) {
            indicator.classList.add('active');
        }
        indicator.addEventListener('click', () => {
            currentIndex = index;
            scheduleCarouselUpdate();
        });
        indicators.appendChild(indicator);
    });
    
    // Ensure current index is valid
    if (currentIndex >= cards.length) {
        currentIndex = Math.max(0, cards.length - 1);
    }
}

function updateCarousel() {
    const carouselTrack = document.getElementById('carouselTrack');
    const cardElements = carouselTrack.querySelectorAll('.carousel-card');
    const indicators = document.querySelectorAll('.indicator');
    
    if (cardElements.length === 0) return;
    
    // Update active states - Batch DOM updates
    cardElements.forEach((card, index) => {
        if (index === currentIndex) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    
    indicators.forEach((indicator, index) => {
        if (index === currentIndex) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
    
    // Calculate transform - Perfect centering with proper gap calculation
    const activeCard = cardElements[currentIndex];
    const cardWidth = activeCard.offsetWidth;
    const gap = 24; // 1.5rem = 24px (matches CSS gap)
    const containerWidth = carouselTrack.parentElement.offsetWidth;
    const totalCardWidth = cardWidth + gap;
    
    // Center the active card perfectly in the viewport
    const offset = (containerWidth / 2) - (cardWidth / 2) - (currentIndex * totalCardWidth);
    
    carouselTrack.style.transform = `translateX(${offset}px)`;
    
    // Update button states
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === cards.length - 1;
}

// WhatsApp Function
function openWhatsApp(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    const phoneNumber = '77477330414';
    const message = encodeURIComponent(`Здравствуйте! Хочу заказать услугу: ${card.title} - ${formatPrice(card.price)} тг`);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
}

// Admin Panel Functions
function initAdminPanel() {
    const adminBtn = document.getElementById('adminBtn');
    const adminModal = document.getElementById('adminModal');
    const closeModal = document.getElementById('closeModal');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const changeCredentialsBtn = document.getElementById('changeCredentialsBtn');
    const credentialsForm = document.getElementById('credentialsForm');
    const cancelCredentialsBtn = document.getElementById('cancelCredentialsBtn');
    const addCardBtn = document.getElementById('addCardBtn');
    const cardModal = document.getElementById('cardModal');
    const closeCardModal = document.getElementById('closeCardModal');
    const cardForm = document.getElementById('cardForm');
    const cancelCardBtn = document.getElementById('cancelCardBtn');
    
    adminBtn.addEventListener('click', () => {
        adminModal.classList.add('show');
        if (!isAdmin) {
            document.getElementById('adminLogin').style.display = 'block';
            document.getElementById('adminPanel').style.display = 'none';
        } else {
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            renderAdminCards();
        }
    });
    
    closeModal.addEventListener('click', () => {
        adminModal.classList.remove('show');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            adminModal.classList.remove('show');
        }
    });
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        if (username === credentials.username && password === credentials.password) {
            isAdmin = true;
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            renderAdminCards();
            loginForm.reset();
        } else {
            alert('Неверный логин или пароль');
        }
    });
    
    logoutBtn.addEventListener('click', () => {
        isAdmin = false;
        document.getElementById('adminLogin').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('changeCredentials').style.display = 'none';
    });
    
    changeCredentialsBtn.addEventListener('click', () => {
        const changeCredentials = document.getElementById('changeCredentials');
        changeCredentials.style.display = changeCredentials.style.display === 'none' ? 'block' : 'none';
    });
    
    credentialsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newUsername = document.getElementById('newUsername').value;
        const newPassword = document.getElementById('newPassword').value;
        
        credentials.username = newUsername;
        credentials.password = newPassword;
        saveCredentials();
        
        alert('Учетные данные изменены');
        credentialsForm.reset();
        document.getElementById('changeCredentials').style.display = 'none';
    });
    
    cancelCredentialsBtn.addEventListener('click', () => {
        document.getElementById('changeCredentials').style.display = 'none';
        document.getElementById('credentialsForm').reset();
    });
    
    addCardBtn.addEventListener('click', () => {
        document.getElementById('cardModalTitle').textContent = 'Добавить карточку';
        document.getElementById('cardId').value = '';
        document.getElementById('cardForm').reset();
        cardModal.classList.add('show');
    });
    
    closeCardModal.addEventListener('click', () => {
        cardModal.classList.remove('show');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === cardModal) {
            cardModal.classList.remove('show');
        }
    });
    
    cardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cardId = document.getElementById('cardId').value;
        const title = document.getElementById('cardTitle').value;
        const price = parseInt(document.getElementById('cardPrice').value);
        const description = document.getElementById('cardDescription').value;
        
        if (cardId) {
            // Edit existing card
            const index = cards.findIndex(c => c.id === parseInt(cardId));
            if (index !== -1) {
                cards[index].title = title;
                cards[index].price = price;
                cards[index].description = description;
            }
        } else {
            // Add new card
            const newId = Math.max(...cards.map(c => c.id), 0) + 1;
            cards.push({ id: newId, title, price, description });
        }
        
        saveCards();
        renderCards();
        scheduleCarouselUpdate();
        renderAdminCards();
        cardModal.classList.remove('show');
        cardForm.reset();
    });
    
    cancelCardBtn.addEventListener('click', () => {
        cardModal.classList.remove('show');
        cardForm.reset();
    });
}

function renderAdminCards() {
    const cardsList = document.getElementById('cardsList');
    cardsList.innerHTML = '';
    
    cards.forEach(card => {
        const cardItem = document.createElement('div');
        cardItem.className = 'card-item';
        cardItem.innerHTML = `
            <div class="card-item-info">
                <div class="card-item-title">${escapeHtml(card.title)}</div>
                <div class="card-item-price">${formatPrice(card.price)} тг</div>
            </div>
            <div class="card-item-actions">
                <button class="btn-secondary" onclick="editCard(${card.id})">Редактировать</button>
                <button class="btn-danger" onclick="deleteCard(${card.id})">Удалить</button>
            </div>
        `;
        cardsList.appendChild(cardItem);
    });
}

function editCard(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    document.getElementById('cardModalTitle').textContent = 'Редактировать карточку';
    document.getElementById('cardId').value = card.id;
    document.getElementById('cardTitle').value = card.title;
    document.getElementById('cardPrice').value = card.price;
    document.getElementById('cardDescription').value = card.description || '';
    
    document.getElementById('cardModal').classList.add('show');
}

function deleteCard(cardId) {
    if (confirm('Вы уверены, что хотите удалить эту карточку?')) {
        cards = cards.filter(c => c.id !== cardId);
        saveCards();
        renderCards();
        
        // Adjust current index if needed
        if (currentIndex >= cards.length) {
            currentIndex = Math.max(0, cards.length - 1);
        }
        scheduleCarouselUpdate();
        renderAdminCards();
    }
}

// Keyboard Navigation
function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            currentIndex--;
            scheduleCarouselUpdate();
        } else if (e.key === 'ArrowRight' && currentIndex < cards.length - 1) {
            currentIndex++;
            scheduleCarouselUpdate();
        }
    });
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Handle window resize - Optimized for performance
let resizeTimeout;
let isResizing = false;

window.addEventListener('resize', () => {
    if (!isResizing) {
        isResizing = true;
        requestAnimationFrame(() => {
            clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        scheduleCarouselUpdate();
        isResizing = false;
    }, 150);
        });
    }
});

// Optimize carousel updates
let animationFrameId = null;
function scheduleCarouselUpdate() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(() => {
        updateCarousel();
        animationFrameId = null;
    });
}

// Make functions globally available
window.openWhatsApp = openWhatsApp;
window.editCard = editCard;
window.deleteCard = deleteCard;

