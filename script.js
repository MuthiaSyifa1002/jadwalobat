document.addEventListener('DOMContentLoaded', () => {
    const el = id => document.getElementById(id);
    
    let databaseObat = [], riwayatAksiSelesai = [], nilaiKondisiHarian = [], waktuKondisiHarian = [];
    let totalAksi = 0, aksiTepatWaktu = 0, barChart, lineChart, IDMitigasiAktif = null, isRegisterMode = false;

    el('btn-toggle-auth').addEventListener('click', () => {
        isRegisterMode = !isRegisterMode;
        el('auth-title').innerText = isRegisterMode ? "Daftar" : "Masuk";
        el('auth-subtitle').innerText = isRegisterMode ? "Buat akun baru Anda." : "Silakan masuk ke akun Anda.";
        el('wrapper-fullname').classList.toggle('hidden', !isRegisterMode);
        el('btn-auth-submit').innerText = isRegisterMode ? "Daftar" : "Masuk";
        el('btn-toggle-auth').innerText = isRegisterMode ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar";
    });

    el('form-auth').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = el('auth-email').value.trim();
        const pass = el('auth-password').value;

        if (isRegisterMode) {
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_pass', pass);
            localStorage.setItem('user_name', el('auth-fullname').value.trim());
            alert("Registrasi Berhasil!");
            el('btn-toggle-auth').click();
        } else {
            const rEmail = localStorage.getItem('user_email') || "muthia@unismuh.ac.id";
            const rPass = localStorage.getItem('user_pass') || "muthia2026";
            const rName = localStorage.getItem('user_name') || "Muthia Syifa";

            if (email === rEmail && pass === rPass) {
                el('auth-container').classList.add('hidden');
                el('app-content').classList.remove('hidden');
                el('welcome-name').innerText = rName;
                el('user-display-name').innerText = rName.split(' ')[0];
                perbaruiDashboard();
            } else {
                alert("Email atau password salah!");
            }
        }
    });

    function hitungNotifikasiPengingatBerikutnya() {
        if (!databaseObat.length) return el('kpi-next-reminder').classList.add('hidden');
        const sekarang = new Date(), totalMenitSekarang = (sekarang.getHours() * 60) + sekarang.getMinutes();
        let menitTargetTerkecil = Infinity, namaObatTarget = "";

        databaseObat.forEach(o => {
            let jamKlaster = o.frekuensiNum === "1" ? [8] : o.frekuensiNum === "2" ? [8, 20] : [8, 14, 20];
            if(o.aturan === "Sebelum") jamKlaster = jamKlaster.map(j => j - 2);

            jamKlaster.forEach(jam => {
                let target = jam * 60;
                if (target <= totalMenitSekarang) target += 1440;
                if (target < menitTargetTerkecil) { menitTargetTerkecil = target; namaObatTarget = o.nama; }
            });
        });

        if (menitTargetTerkecil !== Infinity) {
            let nMenit = menitTargetTerkecil % 1440;
            el('text-next-schedule').innerHTML = `${Math.floor(nMenit / 60).toString().padStart(2, '0')}:${(nMenit % 60).toString().padStart(2, '0')} <span class="text-[10px] font-normal block text-gray-300">(${namaObatTarget})</span>`;
            el('kpi-next-reminder').classList.remove('hidden');
        }
    }

    function perbaruiDashboard() {
        el('kpi-obat').innerText = `${databaseObat.length} Obat`;
        if (databaseObat.length) {
            document.querySelectorAll('#wrapper-emoticon button').forEach(b => b.classList.remove('opacity-50', 'pointer-events-none'));
        }
        if (!totalAksi) {
            el('kpi-kepatuhan').innerText = "-- %";
            el('kpi-kepatuhan-sub').innerText = "Belum ada data minum obat";
            el('kpi-kepatuhan-sub').className = "text-xs text-gray-400 mt-1";
        } else {
            const rasio = Math.round((aksiTepatWaktu / totalAksi) * 100);
            el('kpi-kepatuhan').innerText = `${rasio}%`;
            el('kpi-kepatuhan-sub').innerText = rasio >= 80 ? "Sangat Baik! Pertahankan" : "Tingkatkan kedisiplinan Anda";
            el('kpi-kepatuhan-sub').className = `text-xs font-medium mt-1 ${rasio >= 80 ? 'text-emerald-600' : 'text-rose-600'}`;
        }
        hitungNotifikasiPengingatBerikutnya();
    }

    function bukaPanelML(title, icon, loading) {
        el('section-form').classList.add('hidden');
        el('section-ml-panel').classList.remove('hidden');
        el('ml-panel-title').innerText = title;
        el('ml-panel-icon').className = icon;
        el('ml-loading-text').innerText = loading;
        el('ml-panel-loading').classList.remove('hidden');
        el('ml-panel-content').classList.add('hidden');
        el('section-ml-panel').scrollIntoView({ behavior: 'smooth' });
    }

    el('btn-tutup-ml').addEventListener('click', () => el('section-ml-panel').classList.add('hidden'));
    el('btn-batal').addEventListener('click', () => { el('section-form').classList.add('hidden'); el('form-resep').reset(); });

    el('btn-manual').addEventListener('click', () => {
        el('section-ml-panel').classList.add('hidden');
        el('section-form').classList.remove('hidden');
        el('form-resep').reset();
        el('nama-obat').focus();
    });

    el('form-resep').addEventListener('submit', (e) => {
        e.preventDefault();
        if (el('log-kosong')) el('log-kosong').classList.add('hidden');
        
        const data = {
            id: Date.now(),
            nama: el('nama-obat').value.trim(),
            dosis: el('dosis-obat').value.trim(),
            frekuensiNum: el('frekuensi-obat').value,
            frekuensiTeks: el('frekuensi-obat').options[el('frekuensi-obat').selectedIndex].text,
            aturan: document.querySelector('input[name="aturan-makan"]:checked').value
        };
        databaseObat.push(data);
        buatElemenJadwal(data);
        el('section-form').classList.add('hidden');
        perbaruiDashboard();
    });

    function buatElemenJadwal(o) {
        const item = document.createElement('div');
        item.id = `item-${o.id}`;
        item.className = 'flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-gray-200 gap-4';
        item.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-9 h-9 bg-[#F3EDE6]/40 rounded-xl flex items-center justify-center text-[#7A1E2C]"><i class="fa-solid fa-capsules"></i></div>
                <div>
                    <h4 class="font-semibold text-sm text-gray-900">${o.nama}</h4>
                    <p class="text-xs text-gray-500 mt-0.5">${o.dosis} &bull; ${o.frekuensiTeks} &bull; ${o.aturan} Makan</p>
                </div>
            </div>
            <div class="flex items-center space-x-2 self-end sm:self-center">
                <button class="btn-t px-2.5 py-1.5 bg-amber-100 text-amber-800 font-semibold text-xs rounded-lg cursor-pointer">Terlambat</button>
                <button class="btn-m px-2.5 py-1.5 bg-emerald-700 text-white font-semibold text-xs rounded-lg cursor-pointer">Minum</button>
            </div>`;
        el('container-log').insertBefore(item, el('container-log').firstChild);
        item.querySelector('.btn-m').addEventListener('click', () => eksekusiAksiMinum(o.id, true));
        item.querySelector('.btn-t').addEventListener('click', () => {
            IDMitigasiAktif = o.id;
            el('notif-badge').classList.remove('hidden');
            el('teks-mitigasi').innerHTML = `Dosis <strong>${o.nama}</strong> terlambat. Segera konsumsi jika jadwal berikutnya masih lama. Jangan menggandakan dosis berikutnya.`;
            el('section-mitigasi').classList.remove('hidden');
        });
    }

    function eksekusiAksiMinum(id, tepat) {
        totalAksi++; if (tepat) aksiTepatWaktu++;
        const o = databaseObat.find(x => x.id === id), t = new Date();
        const jam = t.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const tgl = t.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric' });

        riwayatAksiSelesai.unshift({ nama: o?.nama || "Obat", dosis: o?.dosis || "", waktu: jam, tanggal: tgl, status: tepat ? 'Tepat Waktu' : 'Terlambat' });
        const item = el(`item-${id}`);
        if (item) {
            item.classList.add('opacity-75');
            item.querySelector('.flex.items-center.space-x-2').innerHTML = tepat ? 
                `<span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">Tepat (${jam})</span>` : 
                `<span class="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">Susulan (${jam})</span>`;
        }
        tambahDataGrafikBar(tgl, jam, tepat);
        perbaruiDashboard();
    }

    el('btn-abaikan-mitigasi').addEventListener('click', () => { if(IDMitigasiAktif) eksekusiAksiMinum(IDMitigasiAktif, false); el('section-mitigasi').classList.add('hidden'); el('notif-badge').classList.add('hidden'); });
    el('btn-konfirmasi-mitigasi').addEventListener('click', () => { if(IDMitigasiAktif) eksekusiAksiMinum(IDMitigasiAktif, true); el('section-mitigasi').classList.add('hidden'); el('notif-badge').classList.add('hidden'); });

    document.querySelectorAll('#wrapper-emoticon button').forEach(b => {
        b.addEventListener('click', function() {
            document.querySelectorAll('#wrapper-emoticon button').forEach(x => x.classList.remove('emoticon-active'));
            this.classList.add('emoticon-active');
            const jam = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            nilaiKondisiHarian.push(parseInt(this.getAttribute('data-status')));
            tambahDataGrafikLine(jam, parseInt(this.getAttribute('data-status')));
        });
    });

    el('btn-fitur-efeksamping').addEventListener('click', () => {
        bukaPanelML("Cek Efek Samping", "fa-solid fa-shield-virus text-amber-600", "Memproses kriteria Decision Tree...");
        setTimeout(() => {
            el('ml-panel-loading').classList.add('hidden'); el('ml-panel-content').classList.remove('hidden');
            if(!databaseObat.length) return el('ml-panel-content').innerHTML = `<p class="text-xs text-gray-400 italic">Belum ada data obat.</p>`;
            let totalDosis = 0; databaseObat.forEach(o => totalDosis += parseInt(o.frekuensiNum));
            let ris = databaseObat.length > 1 ? (totalDosis >= 5 ? "Tinggi" : "Sedang") : "Rendah";
            el('ml-panel-content').innerHTML = `<div class="p-3 bg-gray-50 border rounded-xl"><p>Hasil analisa Decision Tree: Risiko <strong>${ris}</strong>. Berikan jeda konsumsi antar obat.</p></div>`;
        }, 600);
    });

    el('btn-fitur-jadwalpintar').addEventListener('click', () => {
        bukaPanelML("Jadwal Pintar", "fa-solid fa-calendar-check text-indigo-600", "Mengklasterisasi sediaan via K-Means...");
        setTimeout(() => {
            el('ml-panel-loading').classList.add('hidden'); el('ml-panel-content').classList.remove('hidden');
            if(!databaseObat.length) return el('ml-panel-content').innerHTML = `<p class="text-xs text-gray-400 italic">Belum ada data obat.</p>`;
            let resHtml = '<div class="grid grid-cols-1 gap-2">';
            databaseObat.forEach(o => {
                let w = o.frekuensiNum === "1" ? ["08:00"] : o.frekuensiNum === "2" ? ["08:00", "20:00"] : ["08:00", "14:00", "20:00"];
                resHtml += `<div class="p-2 border rounded-lg bg-gray-50 text-xs"><strong>${o.nama}:</strong> Klaster Waktu -> ${w.join(', ')}</div>`;
            });
            el('ml-panel-content').innerHTML = resHtml + '</div>';
        }, 600);
    });

    el('btn-fitur-tren').addEventListener('click', () => {
        bukaPanelML("Rekomendasi Pemulihan", "fa-solid fa-chart-line text-emerald-600", "Menghitung regresi tren...");
        setTimeout(() => {
            el('ml-panel-loading').classList.add('hidden'); el('ml-panel-content').classList.remove('hidden');
            if (nilaiKondisiHarian.length < 2) return el('ml-panel-content').innerHTML = `<p class="text-xs text-gray-400 italic">Isi 'Kabar Harian' minimal 2 kali untuk melihat tren linear.</p>`;
            let sx=0, sy=0, sxy=0, sxx=0, n=nilaiKondisiHarian.length;
            for(let i=0; i<n; i++) { let x=i+1, y=nilaiKondisiHarian[i]; sx+=x; sy+=y; sxy+=(x*y); sxx+=(x*x); }
            let slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
            let rek = slope >= 0 ? "Kondisi membaik. Lakukan jalan santai pagi 15 menit & jaga hidrasi air hangat." : "Kondisi menurun. Kurangi aktivitas, lakukan bedrest total & konsumsi makanan lunak.";
            el('ml-panel-content').innerHTML = `<div class="space-y-2"><div class="p-3 bg-emerald-50 text-emerald-900 text-xs border rounded-xl">Nilai Gradien Tren Linear: <strong>${isNaN(slope)?0:slope.toFixed(2)}</strong></div><div class="p-3 bg-indigo-50 text-indigo-900 text-xs border rounded-xl"><strong>Rekomendasi Aktivitas Kesembuhan:</strong><p class="mt-1">${rek}</p></div></div>`;
        }, 600);
    });

    function tambahDataGrafikBar(tgl, jam, tepat) {
        if (barChart.data.labels[0] === 'Sen') { barChart.data.labels = []; barChart.data.datasets[0].data = []; }
        barChart.data.labels.push(`${tgl} ${jam}`); barChart.data.datasets[0].data.push(tepat ? 100 : 50);
        if (barChart.data.labels.length > 7) { barChart.data.labels.shift(); barChart.data.datasets[0].data.shift(); }
        barChart.data.datasets[0].backgroundColor = barChart.data.datasets[0].data.map(v => v === 100 ? '#7A1E2C' : '#e0919d');
        barChart.update();
    }

    function tambahDataGrafikLine(jam, val) {
        if (lineChart.data.labels[0] === 'Jadwal 1') { lineChart.data.labels = []; lineChart.data.datasets[0].data = []; }
        lineChart.data.labels.push(jam); lineChart.data.datasets[0].data.push(val);
        if (lineChart.data.labels.length > 7) { lineChart.data.labels.shift(); lineChart.data.datasets[0].data.shift(); }
        lineChart.update();
    }

    el('btn-lihat-semua').addEventListener('click', () => {
        el('container-modal-list').innerHTML = riwayatAksiSelesai.length ? "" : '<p class="text-center text-xs text-gray-400 py-4">Belum ada riwayat.</p>';
        riwayatAksiSelesai.forEach(i => {
            const item = document.createElement('div');
            item.className = 'p-3 bg-white border rounded-xl flex justify-between items-center text-xs shadow-2xs';
            item.innerHTML = `<div><strong>${i.nama}</strong><p class="text-gray-500 text-[11px] mt-0.5">${i.dosis} &bull; ${i.tanggal} &bull; ${i.waktu}</p></div><span class="px-2 py-0.5 rounded-full font-medium ${i.status==='Tepat Waktu'?'bg-emerald-100 text-emerald-800':'bg-amber-100 text-amber-800'}">${i.status}</span>`;
            el('container-modal-list').appendChild(item);
        });
        el('modal-semua-log').classList.remove('hidden');
    });
    el('btn-close-modal').addEventListener('click', () => el('modal-semua-log').classList.add('hidden'));

    barChart = new Chart(el('barChartKepatuhan').getContext('2d'), {
        type: 'bar', data: { labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'], datasets: [{ data: [0,0,0,0,0,0,0], backgroundColor: '#F3EDE6', borderRadius: 4, barThickness: 16 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 9 } } } } }
    });

    lineChart = new Chart(el('lineChartGejala').getContext('2d'), {
        type: 'line', data: { labels: ['Jadwal 1', 'Jadwal 2', 'Jadwal 3', 'Jadwal 4', 'Jadwal 5', 'Jadwal 6', 'Jadwal 7'], datasets: [{ data: [0,0,0,0,0,0,0], borderColor: '#7A1E2C', backgroundColor: '#7A1E2C', borderWidth: 1.5, tension: 0.2, pointRadius: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 4, ticks: { stepSize: 1, font: { size: 9 } } }, x: { ticks: { font: { size: 9 } } } } }
    });
});
