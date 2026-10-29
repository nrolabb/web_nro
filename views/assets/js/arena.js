// ==========================================================================
// ARENA THẦN RỒNG - GLOBAL JAVASCRIPT
// Starlight particles, navbar toggle, dropdown, and shared utilities
// ==========================================================================

// Mobile Navbar Toggle
function toggleArenaMenu() {
    const navLinks = document.querySelector('.arena-nav-links');
    if (navLinks) {
        navLinks.classList.toggle('show');
    }
}

// Close mobile menu when clicking a link
document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.arena-nav-links li a');
    navLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            const nav = document.querySelector('.arena-nav-links');
            if (nav && nav.classList.contains('show')) {
                nav.classList.remove('show');
            }
        });
    });
});

// User Dropdown Toggle
function toggleArenaDropdown() {
    const dropdown = document.querySelector('.arena-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function (e) {
    const dropdown = document.querySelector('.arena-dropdown');
    const userBtn = document.querySelector('.arena-user-btn');
    if (dropdown && dropdown.classList.contains('show')) {
        if (!dropdown.contains(e.target) && (!userBtn || !userBtn.contains(e.target))) {
            dropdown.classList.remove('show');
        }
    }
});

// ==========================================================================
// CONTINUOUS DYNAMIC SPARKLING STARLIGHT ENGINE
// ==========================================================================
let starlightInterval = null;

function spawnSingleStar() {
    const container = document.getElementById('starlightContainer');
    if (!container) return;

    // Giữ số lượng sao hiển thị đồng thời ở mức 16 - 22 sao
    if (container.children.length >= 22) return;

    const star = document.createElement('div');
    star.className = 'starlight-star';

    const colors = [
        { color: '#ffe600', glow: '#ffaa00' }, // Gold Star
        { color: '#00f0ff', glow: '#00c8ff' }, // Cyan Diamond
        { color: '#ffffff', glow: '#ffffff' }  // White Diamond
    ];

    const c = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.floor(Math.random() * 3) + 7; // 7px đến 9px
    const posX = (Math.random() * 95 + 2).toFixed(2);
    const posY = (Math.random() * 93 + 3).toFixed(2);
    const lifeDuration = (Math.random() * 1.6 + 2.2).toFixed(2); // 2.2s - 3.8s
    const driftX = ((Math.random() - 0.5) * 12).toFixed(1) + 'px';
    const driftY = (-Math.random() * 14 - 3).toFixed(1) + 'px';

    star.style.setProperty('--star-size', size + 'px');
    star.style.setProperty('--star-glow', c.glow);
    star.style.setProperty('--star-life', lifeDuration + 's');
    star.style.setProperty('--drift-x', driftX);
    star.style.setProperty('--drift-y', driftY);

    star.style.left = posX + 'vw';
    star.style.top = posY + 'vh';

    // SVG Ngôi sao 4 cánh nhọn kim cương
    star.innerHTML =
        '<svg viewBox="0 0 24 24" width="100%" height="100%" style="overflow: visible; display: block;">' +
        '<line x1="12" y1="0" x2="12" y2="24" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>' +
        '<line x1="0" y1="12" x2="24" y2="12" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>' +
        '<path d="M12 2 Q12 12 2 12 Q12 12 12 22 Q12 12 22 12 Q12 12 12 2 Z" fill="' + c.color + '"/>' +
        '<circle cx="12" cy="12" r="2" fill="#ffffff"/>' +
        '</svg>';

    // Tự động giải phóng khỏi DOM khi ngôi sao lấp lánh xong
    star.addEventListener('animationend', function () {
        star.remove();
    });

    container.appendChild(star);
}

function startContinuousStarlight() {
    const container = document.getElementById('starlightContainer');
    if (!container) return;

    container.innerHTML = '';

    // Khởi tạo một số sao ngẫu nhiên đầu tiên
    for (var i = 0; i < 12; i++) {
        setTimeout(spawnSingleStar, Math.random() * 1800);
    }

    // Sinh sao mới liên tục
    if (starlightInterval) clearInterval(starlightInterval);
    starlightInterval = setInterval(function () {
        spawnSingleStar();
    }, 220);
}

// Toggle password visibility
function togglePasswordVisibility(inputId, icon) {
    var input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Auto-run on DOM ready
document.addEventListener('DOMContentLoaded', function () {
    startContinuousStarlight();
});
