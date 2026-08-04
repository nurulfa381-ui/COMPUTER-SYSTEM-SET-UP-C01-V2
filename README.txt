C01 FIREBASE SYNC OVERLAY

1. Upload fail ini ke root repository:

firebase-sync.js

2. Pastikan root turut mempunyai:

firebase-config.js
firebase-storage.js

3. Untuk KT13, tambah baris ini sebelum </body> dalam:

kt/kt13/index.html

<script type="module" src="../../firebase-sync.js?v=20260804-1"></script>

4. Untuk KT14 dan KT15, gunakan baris sama:

<script type="module" src="../../firebase-sync.js?v=20260804-1"></script>

5. Jangan ubah script.js asal KT.

FUNGSI:
- Memerhati localStorage.
- Menghantar profil dan markah ke Firestore.
- Jika Internet gagal, KT asal masih berfungsi.
- Menerima markah rasmi guru secara masa nyata.
- Menyimpan markah rasmi semula ke localStorage.

UJIAN:
- Login pelatih.
- Jawab KT.
- Tekan Hantar.
- Semak Firestore:
  students/{uid}/assessments/kt13

MANUAL SYNC:
Buka Console dan jalankan:

C01FirebaseSync.syncNow()
