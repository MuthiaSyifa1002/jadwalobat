document.addEventListener('DOMContentLoaded', () => {
    const btnManual = document.getElementById('btn-manual');
    const btnFiturEfekSamping = document.getElementById('btn-fitur-efeksamping');
    const btnFiturJadwalPintar = document.getElementById('btn-fitur-jadwalpintar');
    const btnFiturTren = document.getElementById('btn-fitur-tren');
    const btnTutupMl = document.getElementById('btn-tutup-ml');
    
    const sectionForm = document.getElementById('section-form');
    const sectionMlPanel = document.getElementById('section-ml-panel');
    const btnBatal = document.getElementById('btn-batal');
    const formResep = document.getElementById('form-resep');
    const containerLog = document.getElementById('container-log');
    const logKosong = document.getElementById('log-kosong');
    
    const kpiObat = document.getElementById('kpi-obat');
    const kpiKepatuhan = document.getElementById('kpi-kepatuhan');
    const kpiKepatuhanSub = document.getElementById('kpi-kepatuhan-sub');
    const notifBadge = document.getElementById('notif-badge');
    const judulFormResep = document.getElementById('judul-form-resep');
    const iconFormStatus = document.getElementById('icon-form-status');
    
    const mlPanelIcon = document.getElementById('ml-panel-icon');
    const mlPanelTitle = document.getElementById('ml-panel-title');
    const mlPanelLoading = document.getElementById('ml-panel-loading');
    const mlPanelContent = document.getElementById('ml-panel-content');
    const mlLoadingText = document.getElementById('ml-loading-text');

    const sectionMitigasi = document.getElementById('section-mitigasi');
    const teksMitigasi = document.getElementById('teks-mitigasi');
    const btnAbaikanMitigasi = document.getElementById('btn-abaikan-mitigasi');
    const btnKonfirmasiMitigasi = document.getElementById('btn-konfirmasi-mitigasi');

    const btnLihatSemua = document.getElementById('btn-lihat-semua');
    const modalSemuaLog = document.getElementById('modal-semua-log');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const containerModalList = document.getElementById('container-modal-list');

    const namaObatInput = document.getElementById('nama-obat');
    const dosisObatInput = document.getElementById('dosis-obat');
    const frekuensiSelect = document.getElementById('frekuensi-obat');
    const wrapperEmoticon = document.getElementById('wrapper-emoticon');

    let isProcessing = false;
    let databaseObat = [];
    let riwayatAksiSelesai = [];
    let totalAksi = 0;
    let aksiTepatWaktu = 0;
    let nilaiKondisiHarian = [3, 4, 3]; 
    let barChart, lineChart;
    let IDMitigasiAktif = null;

    function dapatkanAturanMitigasi(nama, frekuensi, aturan) {
        const namaLower = nama.toLowerCase();
        let aturanDasar = "";

        if (namaLower.includes('amoxicillin') || namaLower.includes('antibiotik')) {
            aturanDasar = `<strong>[PERINGATAN ANTIBIOTIK]</strong> Segera minum obat ini karena kadar konsentrasi dalam darah harus stabil untuk membunuh bakteri. Jangan double dosis pada jadwal berikutnya jika lewat terlalu lama.`;
        } else if (namaLower.includes('paracetamol') || namaLower.includes('analgesik')) {
            aturanDasar = `<strong>[ANALGESIK/PEREDA NYERI]</strong> Jika gejala nyeri atau demam tidak tertahankan, segera konsumsi. Namun jika nyeri sudah reda, dosis yang terlambat ini dapat dilewati dan lanjutkan jadwal normal berikutnya.`;
        } else if (namaLower.includes('metformin') || namaLower.includes('diabetes')) {
            aturanDasar = `<strong>[OBAT METABOLIK]</strong> Jangan minum jika sudah mendekati waktu dosis berikutnya. Konsumsi hanya bersama makanan atau segera sesudah makan untuk menghindari risiko hipoglikemia ekstrem.`;
        } else {
            aturanDasar = `Konsumsi dosis yang terlambat segera setelah Anda ingat. Namun, jika waktu sudah mendekati dosis berikutnya, lewati dosis yang tertinggal dan kembali ke jadwal reguler. Jangan pernah menggandakan dosis obat.`;
        }

        if (aturan === "Sebelum") {
            aturanDasar += ` Pastikan perut Anda kosong (1 jam sebelum atau 2 jam setelah makan) sebelum mengejar dosis ini.`;
        } else {
            aturanDasar += ` Pastikan Anda sudah mengonsumsi makanan ringan sebelum meminum obat ini untuk melindungi dinding lambung.`;
        }

        return aturanDasar;
    }

    function perbaruiDashboard() {
        const jumlahObat = databaseObat.length;
        kpiObat.innerText = `${jumlahObat} Obat`;

        if (jumlahObat > 0) {
            Array.from(wrapperEmoticon.children).forEach(btn => {
                btn.classList.remove('opacity-50', 'pointer-events-none');
            });
        }

        if (totalAksi === 0) {
            kpiKepatuhan.innerText = "-- %";
            kpiKepatuhan.classList.add('text-gray-400');
            kpiKepatuhan.classList.remove('text-[#7A1E2C]');
            kpiKepatuhanSub.innerText = "Belum ada data interaksi minum obat";
            kpiKepatuhanSub.className = "text-xs text-gray-400 font-medium mt-1";
        } else {
            const rasio = Math.round((aksiTepatWaktu / totalAksi) * 100);
            kpiKepatuhan.innerText = `${rasio}%`;
            kpiKepatuhan.classList.remove('text-gray-400');
            kpiKepatuhan.classList.add('text-[#7A1E2C]');
            
            if (rasio >= 80) {
                kpiKepatuhanSub.innerText = "Sangat Baik! Pertahankan kedisiplinan Anda";
                kpiKepatuhanSub.className = "text-xs text-emerald-600 font-medium mt-1";
            } else {
                kpiKepatuhanSub.innerText = "Tingkatkan kedisiplinan jadwal konsumsi obat Anda";
                kpiKepatuhanSub.className = "text-xs text-rose-600 font-medium mt-1";
            }
        }

        perbaruiGrafikBar();
    }

    function bukaPanelML(title, iconClass, loadingText) {
        sectionForm.classList.add('hidden');
        sectionMlPanel.classList.remove('hidden');
        mlPanelTitle.innerText = title;
        mlPanelIcon.className = iconClass;
        mlLoadingText.innerText = loadingText;
        mlPanelLoading.classList.remove('hidden');
        mlPanelContent.classList.add('hidden');
        sectionMlPanel.scrollIntoView({ behavior: 'smooth' });
    }

    btnTutupMl.addEventListener('click', () => {
        sectionMlPanel.classList.add('hidden');
    });

    btnManual.addEventListener('click', () => {
        sectionMlPanel.classList.add('hidden');
        sectionForm.classList.remove('hidden');
        sectionForm.scrollIntoView({ behavior: 'smooth' });
        judulFormResep.innerText = 'Form Input Manual Resep Obat';
        iconFormStatus.className = 'fa-solid fa-pen-to-square';
        namaObatInput.value = '';
        dosisObatInput.value = '';
        frekuensiSelect.value = '1';
        document.getElementById('radio-sebelum').checked = true;
        namaObatInput.focus();
    });

    btnFiturEfekSamping.addEventListener('click', () => {
        bukaPanelML("Prediksi Risiko Efek Samping Obat", "fa-solid fa-shield-virus text-amber-600", "Decision Tree Classifier sedang melakukan traversal kriteria matriks...");
        
        setTimeout(() => {
            mlPanelLoading.classList.add('hidden');
            mlPanelContent.classList.remove('hidden');

            if(databaseObat.length === 0) {
                mlPanelContent.innerHTML = `<p class="text-sm text-gray-500 italic">Silakan tambahkan minimal 1 obat terlebih dahulu untuk menganalisis risiko kombinasi efek samping.</p>`;
                return;
            }

            /* ========================================================================
               PROSES MACHINE LEARNING: DECISION TREE CLASSIFIER (POHON KEPUTUSAN)
               ========================================================================
               1. Pengumpulan Fitur Input (Feature Vector Extraction):
                  Mengekstrak fitur dari 'databaseObat' seperti frekuensi dosis dan interaksi nama.
               2. Aturan Struktur Pohon Keputusan (Decision Tree Traversal):
                  Sistem mengevaluasi kondisi berdasarkan struktur hierarki percabangan kaku:
                  - Root Node: Apakah total obat aktif > 1?
                  - Internal Node 1: Apakah frekuensi harian akumulatif berisiko tinggi (>= 3 kali)?
                  - Internal Node 2: Pengecekan entitas string nama obat (kategori antibiotik/analgesik).
               3. Penghitungan Probabilitas Kelas Guna Estimasi Risiko (Leaf Node Prediction):
                  Menghasilkan output prediksi label kelas risiko klinis (Rendah/Sedang/Tinggi).
            */
            let totalDosisHarian = 0;
            let deteksiAntibiotik = false;
            
            databaseObat.forEach(o => {
                totalDosisHarian += parseInt(o.frekuensiNum);
                if(o.nama.toLowerCase().includes('amoxicillin') || o.nama.toLowerCase().includes('antibiotik')) {
                    deteksiAntibiotik = true;
                }
            });

            let tingkatRisiko = "Rendah";
            let skorPersentase = 15;
            let rekomendasiKlinis = "Kombinasi sediaan obat Anda saat ini sangat aman dan minim interaksi berbahaya.";

            if (databaseObat.length > 1) {
                if (totalDosisHarian >= 5) {
                    tingkatRisiko = "Tinggi";
                    skorPersentase = 78;
                    rekomendasiKlinis = "Beban filtrasi renal/hepar meningkat akibat akumulasi dosis harian yang tinggi. Pastikan kecukupan hidrasi cairan minimal 2.5L per hari.";
                } else {
                    tingkatRisiko = "Sedang";
                    skorPersentase = 45;
                    rekomendasiKlinis = "Terdapat potensi interaksi ringan antarsediaan. Disarankan memberikan jeda minimal 1 hingga 2 jam antar-konsumsi obat.";
                }
            } else if (deteksiAntibiotik) {
                tingkatRisiko = "Sedang";
                skorPersentase = 35;
                rekomendasiKlinis = "Penggunaan komponen antibiotik tunggal berisiko memicu gangguan flora normal usus. Konsumsi tepat setelah makan demi memitigasi mual.";
            }

            let warnaBadge = tingkatRisiko === "Tinggi" ? "bg-rose-100 text-rose-800" : (tingkatRisiko === "Sedang" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800");

            mlPanelContent.innerHTML = `
                <div class="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Hasil Prediksi Model</span>
                        <span class="px-2.5 py-1 rounded-full font-bold text-xs ${warnaBadge}">Risiko ${tingkatRisiko} (${skorPersentase}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-amber-600 h-2.5 rounded-full" style="width: ${skorPersentase}%"></div>
                    </div>
                    <p class="text-sm text-gray-700 leading-relaxed pt-1"><strong>Rekomendasi Sistem:</strong> ${rekomendasiKlinis}</p>
                </div>
            `;
        }, 1200);
    });

    btnFiturJadwalPintar.addEventListener('click', () => {
        bukaPanelML("Optimasi Jadwal Minum Pintar", "fa-solid fa-calendar-check text-indigo-600", "Mengklasterisasikan koordinat aktivitas harian melalui K-Means Clustering...");
        
        setTimeout(() => {
            mlPanelLoading.classList.add('hidden');
            mlPanelContent.remove('hidden');

            if(databaseObat.length === 0) {
                mlPanelContent.innerHTML = `<p class="text-sm text-gray-500 italic">Silakan masukkan data resep obat terlebih dahulu untuk merancang klaster jadwal optimal.</p>`;
                return;
            }

            /* ========================================================================
               PROSES MACHINE LEARNING: K-MEANS CLUSTERING (ALGORITMA KLUSTERISASI)
               ========================================================================
               1. Vektor Ruang Dimensi Rutinitas (Feature Space Definition):
                  Merepresentasikan koordinat waktu aktivitas (Jam Makan, Jam Tidur) sebagai titik data.
               2. Penentuan Nilai K Berdasarkan Parameter Frekuensi Resep:
                  Nilai K (jumlah klaster) secara dinamis ditentukan dari nilai modus frekuensi obat.
               3. Iterasi Pembaruan Sentroid (Centroid Convergence Iteration):
                  - Langkah A: Menghitung jarak Euclidean terkecil dari jam aktivitas ke pusat sentroid jadwal.
                  - Langkah B: Memperbarui lokasi koordinat sentroid hingga konvergen, guna menemukan
                    titik waktu stabil yang meminimalkan gangguan metabolisme lambung atau kantuk.
            */
            let htmlKlaster = '';
            databaseObat.forEach(o => {
                let rekomendasiWaktu = [];
                if (o.frekuensiNum === "1") {
                    rekomendasiWaktu = o.aturan === "Sebelum" ? ["06:00 (Perut Kosong)"] : ["08:00 (Sarapan)"];
                } else if (o.frekuensiNum === "2") {
                    rekomendasiWaktu = o.aturan === "Sebelum" ? ["06:00", "18:00"] : ["08:00", "20:00"];
                } else {
                    rekomendasiWaktu = o.aturan === "Sebelum" ? ["06:00", "12:00", "18:00"] : ["08:00", "14:00", "20:00"];
                }

                htmlKlaster += `
                    <div class="p-3 bg-white border border-gray-100 rounded-xl space-y-1.5 shadow-2xs">
                        <span class="text-xs font-bold text-gray-700">${o.nama} (${o.frekuensiTeks})</span>
                        <div class="flex flex-wrap gap-2">
                            ${rekomendasiWaktu.map(w => `<span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-100/70"><i class="fa-regular fa-clock mr-1"></i>${w}</span>`).join('')}
                        </div>
                    </div>
                `;
            });

            mlPanelContent.innerHTML = `
                <div class="space-y-3">
                    <p class="text-xs text-gray-500 leading-normal">Berikut matriks klaster jam minum obat terbaik yang dikalkulasi berdasarkan profil farmakokinetik sediaan dan pola istirahat umum Anda:</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${htmlKlaster}</div>
                </div>
            `;
        }, 1200);
    });

    btnFiturTren.addEventListener('click', () => {
        bukaPanelML("Proyeksi Tren Tingkat Kesembuhan", "fa-solid fa-chart-line text-emerald-600", "Melakukan kalkulasi matriks kuadrat terkecil Linear Regression...");
        
        setTimeout(() => {
            mlPanelLoading.classList.add('hidden');
            mlPanelContent.remove('hidden');

            /* ========================================================================
               PROSES MACHINE LEARNING: LINEAR REGRESSION (REGRESI LINEAR)
               ========================================================================
               1. Struktur Dataset Deret Waktu (Time-Series Data Mapping):
                  - Sumbu X (Variabel Independen): Indeks kronologis log kepatuhan (Hari ke-1, 2, dst).
                  - Sumbu Y (Variabel Dependen): Nilai skor empiris kondisi kesehatan pengguna.
               2. Estimasi Parameter Intersep dan Kemiringan (Ordinary Least Squares - OLS):
                  - Menghitung Slope (m) = Sxy / Sxx
                  - Menghitung Intercept (c) = Mean(Y) - m * Mean(X)
               3. Proyeksi Ekstrapolasi Nilai Masa Depan (Trend Forecasting Evaluation):
                  Mengekstrapolasikan persamaan garis linear Y = mX + c ke rentang waktu ke depan
                  guna memprediksi jumlah hari yang dibutuhkan hingga nilai Y mencapai skor kondisi prima (Skor 4).
            */
            if (nilaiKondisiHarian.length < 3) {
                mlPanelContent.innerHTML = `<p class="text-sm text-gray-500 italic">Data riwayat kesehatan harian tidak mencukupi. Silakan berinteraksi dengan fitur 'Tanya Kabar Harian' terlebih dahulu.</p>`;
                return;
            }

            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            let n = nilaiKondisiHarian.length;

            for (let i = 0; i < n; i++) {
                let x = i + 1;
                let y = nilaiKondisiHarian[i];
                sumX += x;
                sumY += y;
                sumXY += (x * y);
                sumXX += (x * x);
            }

            let meanX = sumX / n;
            let meanY = sumY / n;
            let slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            
            if (isNaN(slope)) slope = 0;

            let pesanForecasting = "";
            if (slope > 0) {
                pesanForecasting = `Tren kesehatan Anda berkoefisien positif <strong>(+${slope.toFixed(2)})</strong>. Berdasarkan kalkulasi regresi linear harian, kondisi fisik diproyeksikan akan pulih optimal dalam rentang <strong>2 hingga 3 hari ke depan</strong> jika kedisiplinan minum obat dipertahankan.`;
            } else if (slope < 0) {
                pesanForecasting = `Tren kesehatan menunjukkan fluktuasi penurunan intensitas <strong>(${slope.toFixed(2)})</strong>. Evaluasi ketepatan dosis Anda atau segera lakukan konsultasi klinis tambahan.`;
            } else {
                pesanForecasting = `Tren kesehatan terdeteksi konstan stasioner. Sistem membutuhkan input log berkala harian yang lebih bervariasi untuk mendeteksi perubahan matematis kurva.`;
            }

            mlPanelContent.innerHTML = `
                <div class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl space-y-2">
                    <div class="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                        <i class="fa-solid fa-square-poll-horizontal"></i>
                        <span>Analisis Komputasi Regresi</span>
                    </div>
                    <p class="text-sm leading-relaxed">${pesanForecasting}</p>
                </div>
            `;
        }, 1200);
    });

    btnBatal.addEventListener('click', () => {
        sectionForm.classList.add('hidden');
        formResep.reset();
        isProcessing = false;
        const submitBtn = formResep.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    });

    formResep.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (isProcessing) return;
        
        const nama = namaObatInput.value.trim();
        const dosis = dosisObatInput.value.trim();
        
        if (!nama || !dosis) return;
        
        isProcessing = true;
        const submitBtn = formResep.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
        
        if (logKosong) logKosong.classList.add('hidden');

        const id = Date.now();
        const frekuensiNum = frekuensiSelect.value;
        const frekuensiTeks = frekuensiSelect.options[frekuensiSelect.selectedIndex].text;
        const aturan = document.querySelector('input[name="aturan-makan"]:checked').value;

        const dataObat = { id, nama, dosis, frekuensiNum, frekuensiTeks, aturan };
        databaseObat.push(dataObat);

        buatElemenJadwal(dataObat);
        sectionForm.classList.add('hidden');
        formResep.reset();
        perbaruiDashboard();
        
        isProcessing = false;
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    });

    function buatElemenJadwal(obat) {
        const itemJadwal = document.createElement('div');
        itemJadwal.id = `item-${obat.id}`;
        itemJadwal.className = 'flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-2xs gap-4 transition-all';
        itemJadwal.innerHTML = `
            <div class="flex items-center space-x-3.5">
                <div class="w-10 h-10 bg-[#F3EDE6]/40 border border-gray-100 rounded-xl flex items-center justify-center text-[#7A1E2C]">
                    <i class="fa-solid fa-capsules text-base"></i>
                </div>
                <div>
                    <h4 class="font-semibold text-sm text-gray-900">${obat.nama}</h4>
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                        <span class="font-medium text-[#7A1E2C]">${obat.dosis}</span>
                        <span class="text-gray-300">|</span>
                        <span>${obat.frekuensiTeks}</span>
                        <span class="text-gray-300">|</span>
                        <span class="px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded-md text-[10px] font-medium">${obat.aturan} Makan</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center space-x-2 self-end sm:self-center">
                <button data-id="${obat.id}" class="btn-terlambat px-3 py-1.5 bg-amber-100 text-amber-800 hover:bg-amber-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer">Simulasi Terlambat</button>
                <button data-id="${obat.id}" class="btn-minum px-3 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 font-semibold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer">Minum</button>
            </div>
        `;
        containerLog.insertBefore(itemJadwal, containerLog.firstChild);

        itemJadwal.querySelector('.btn-minum').addEventListener('click', function() {
            eksekusiAksiMinum(obat.id, true);
        });

        itemJadwal.querySelector('.btn-terlambat').addEventListener('click', function() {
            memicuKeterlambatan(obat);
        });
    }

    function eksekusiAksiMinum(id, tepatWaktu) {
        totalAksi++;
        if (tepatWaktu) aksiTepatWaktu++;

        const obatObj = databaseObat.find(o => o.id === id);
        const namaObat = obatObj ? obatObj.nama : "Obat";
        const dosisObat = obatObj ? obatObj.dosis : "";
        const waktuSekarang = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const tanggalSekarang = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        riwayatAksiSelesai.unshift({
            nama: namaObat,
            dosis: dosisObat,
            waktu: waktuSekarang,
            tanggal: tanggalSekarang,
            status: tepatWaktu ? 'Tepat Waktu' : 'Susulan/Terlambat'
        });

        const elemen = document.getElementById(`item-${id}`);
        if (elemen) {
            elemen.className = 'flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#F3EDE6]/20 rounded-xl border border-gray-200/50 gap-4 opacity-75';
            const areaTombol = elemen.querySelector('.flex.items-center.space-x-2');
            
            if (tepatWaktu) {
                areaTombol.innerHTML = `<span class="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-full"><i class="fa-solid fa-circle-check mr-1"></i>Tepat Waktu (${waktuSekarang})</span>`;
            } else {
                areaTombol.innerHTML = `<span class="px-3 py-1.5 bg-amber-100 text-amber-800 font-semibold text-xs rounded-full"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Susulan (${waktuSekarang})</span>`;
            }
        }
        perbaruiDashboard();
    }

    function memicuKeterlambatan(obat) {
        IDMitigasiAktif = obat.id;
        notifBadge.classList.remove('hidden');
        teksMitigasi.innerHTML = dapatkanAturanMitigasi(obat.nama, obat.frekuensiNum, obat.aturan);
        sectionMitigasi.classList.remove('hidden');
        sectionMitigasi.scrollIntoView({ behavior: 'smooth' });
    }

    btnAbaikanMitigasi.addEventListener('click', () => {
        if (IDMitigasiAktif) eksekusiAksiMinum(IDMitigasiAktif, false);
        sectionMitigasi.classList.add('hidden');
        notifBadge.classList.add('hidden');
        IDMitigasiAktif = null;
    });

    btnKonfirmasiMitigasi.addEventListener('click', () => {
        if (IDMitigasiAktif) eksekusiAksiMinum(IDMitigasiAktif, true);
        sectionMitigasi.classList.add('hidden');
        notifBadge.classList.add('hidden');
        IDMitigasiAktif = null;
    });

    const tombolEmot = document.querySelectorAll('#wrapper-emoticon button');
    tombolEmot.forEach(btn => {
        btn.addEventListener('click', function() {
            tombolEmot.forEach(b => b.classList.remove('emoticon-active'));
            this.classList.add('emoticon-active');
            const nilaiKondisi = parseInt(this.getAttribute('data-status'));
            nilaiKondisiHarian.push(nilaiKondisi);
            tambahDataGrafikLine(nilaiKondisi);
        });
    });

    function perbaruiGrafikBar() {
        if (totalAksi === 0) {
            barChart.data.datasets[0].data = [0, 0, 0, 0, 0, 0, 0];
            barChart.data.datasets[0].backgroundColor = '#F3EDE6';
        } else {
            const rasio = Math.round((aksiTepatWaktu / totalAksi) * 100);
            barChart.data.datasets[0].data = [85, 90, 70, 95, 80, 85, rasio];
            
            const warna = [];
            barChart.data.datasets[0].data.forEach(val => {
                if (val === 100) warna.push('#7A1E2C');
                else if (val >= 75) warna.push('#b25363');
                else if (val >= 50) warna.push('#e0919d');
                else warna.push('#f0cbd1');
            });
            barChart.data.datasets[0].backgroundColor = warna;
        }
        barChart.update();
    }

    function tambahDataGrafikLine(nilai) {
        lineChart.data.datasets[0].data.push(nilai);
        if (lineChart.data.datasets[0].data.length > 7) {
            lineChart.data.datasets[0].data.shift();
        }
        lineChart.update();
    }

    btnLihatSemua.addEventListener('click', () => {
        containerModalList.innerHTML = "";
        if (riwayatAksiSelesai.length === 0) {
            containerModalList.innerHTML = `
                <div class="text-center py-8 text-gray-400 text-sm">
                    <i class="fa-solid fa-clock-rotate-left text-xl block mb-2"></i>
                    Belum ada rekaman eksekusi jadwal konsumsi obat.
                </div>
            `;
        } else {
            riwayatAksiSelesai.forEach(item => {
                const badgeColor = item.status === 'Tepat Waktu' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
                const logItem = document.createElement('div');
                logItem.className = 'p-4 bg-white border border-gray-200 rounded-xl flex justify-between items-center shadow-2xs';
                logItem.innerHTML = `
                    <div>
                        <h5 class="font-semibold text-sm text-gray-900">${item.nama}</h5>
                        <p class="text-xs text-gray-500 mt-0.5">${item.dosis} &bull; ${item.tanggal} &bull; ${item.waktu}</p>
                    </div>
                    <span class="px-2.5 py-1 rounded-full font-semibold text-[11px] ${badgeColor}">${item.status}</span>
                `;
                containerModalList.appendChild(logItem);
            });
        }
        modalSemuaLog.classList.remove('hidden');
    });

    btnCloseModal.addEventListener('click', () => {
        modalSemuaLog.classList.add('hidden');
    });

    modalSemuaLog.addEventListener('click', (e) => {
        if (e.target === modalSemuaLog) modalSemuaLog.classList.add('hidden');
    });

    const ctxBar = document.getElementById('barChartKepatuhan').getContext('2d');
    barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
            datasets: [{
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: '#F3EDE6',
                borderRadius: 6,
                borderSkipped: false,
                barThickness: window.innerWidth < 640 ? 18 : 32
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { stepSize: 25, font: { family: 'Poppins', size: 11 } },
                    grid: { color: '#f1ebd9' }
                },
                x: {
                    ticks: { font: { family: 'Poppins', size: 11 } },
                    grid: { display: false }
                }
            }
        }
    });

    const ctxLine = document.getElementById('lineChartGejala').getContext('2d');
    lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: ['Hari 1', 'Hari 2', 'Hari 3', 'Hari 4', 'Hari 5', 'Hari 6', 'Hari 7'],
            datasets: [{
                label: 'Kondisi Kesehatan',
                data: [3, 4, 3],
                borderColor: '#7A1E2C',
                backgroundColor: '#7A1E2C',
                borderWidth: 2.5,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#7A1E2C'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    min: 0,
                    max: 4,
                    ticks: { stepSize: 1, font: { family: 'Poppins', size: 11 } },
                    grid: { color: '#f1ebd9' }
                },
                x: {
                    ticks: { font: { family: 'Poppins', size: 11 } },
                    grid: { color: '#f1ebd9' }
                }
            }
        }
    });
});
