const RAW_URL = 'https://raw.githubusercontent.com/DooOffc-Dev/dtbs/refs/heads/main/doodb.json';
const API_URL = 'https://api.github.com/repos/DooOffc-Dev/dtbs/contents/doodb.json';

// 🔥 TOKEN LANGSUNG DIMASUKKAN (BIAR GA RIBET ENV)
const GITHUB_TOKEN = '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';

const LOGIN_PASSWORD = "DooBotzDev";
let numbersData = [];

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const btn = document.getElementById('themeBtn');
    const icon = btn.querySelector('i');
    if (document.body.classList.contains('light-mode')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'light');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'dark');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const btn = document.getElementById('themeBtn');
        if (btn) btn.querySelector('i').className = 'fas fa-sun';
    }
});

function togglePassword() {
    const input = document.getElementById('passwordInput');
    input.type = input.type === 'password' ? 'text' : 'password';
}

async function handleLogin() {
    const password = document.getElementById('passwordInput').value;
    if (password === LOGIN_PASSWORD) {
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'dashboard.html';
    } else {
        alert('Password salah!');
    }
}

if (window.location.pathname.includes('dashboard.html')) {
    if (!localStorage.getItem('isLoggedIn')) {
        window.location.href = 'index.html';
    } else {
        loadNumbers();
    }
}

async function loadNumbers() {
    try {
        const response = await fetch(RAW_URL);
        if (!response.ok) throw new Error('Gagal mengambil data');
        const data = await response.json();
        
        const list = data?.numbers || data?.data || [];
        numbersData = list.map(n => ({ number: n, status: "active" }));
        renderTable(numbersData);
    } catch (error) {
        console.error("Gagal load data:", error);
        numbersData = [];
        renderTable(numbersData);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="padding: 30px; color: #94a3b8; font-size: 14px;">Belum ada nomor terdaftar</td></tr>`;
        return;
    }
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.number}</td>
            <td><span class="status-badge">${item.status || 'active'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function searchTable() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = numbersData.filter(item => 
        item.number.toLowerCase().includes(query)
    );
    renderTable(filtered);
}

async function addNumber() {
    const number = document.getElementById('phoneInput').value.trim();
    if (!number || number.length < 10) {
        alert("Masukkan nomor yang valid!");
        return;
    }

    try {
        const getRes = await fetch(RAW_URL);
        if (!getRes.ok) throw new Error('Gagal mengambil data dari GitHub');
        const jsonData = await getRes.json();

        const key = Array.isArray(jsonData?.numbers) ? 'numbers' : (Array.isArray(jsonData?.data) ? 'data' : null);
        if (!key) throw new Error("Struktur database tidak valid");

        if (jsonData[key].includes(number)) {
            alert("Nomor sudah ada di database!");
            return;
        }

        jsonData[key].push(number);

        const shaRes = await fetch(API_URL);
        if (!shaRes.ok) throw new Error('Gagal mengambil SHA');
        const shaData = await shaRes.json();
        const currentSHA = shaData.sha;

        const updatedData = JSON.stringify(jsonData, null, 2);
        const base64Content = btoa(unescape(encodeURIComponent(updatedData)));

        const updateRes = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Menambahkan nomor ${number} dari web`,
                content: base64Content,
                sha: currentSHA,
            }),
        });

        const result = await updateRes.json();

        if (updateRes.status === 200) {
            alert(`✅ Nomor ${number} berhasil ditambahkan ke database!`);
            document.getElementById('phoneInput').value = '';
            loadNumbers();
        } else {
            alert(`❌ Gagal: ${result.message}`);
        }
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}
