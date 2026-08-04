Upload firebase-storage.js ke root repository.

Struktur:
COMPUTER-SYSTEM-SET-UP-C01-V2/
├── firebase-config.js
├── firebase-storage.js
├── login.html
├── dashboard.html
├── teacher/
├── kp/
└── kt/

Selepas upload, KT13 perlu import:
import { C01FirebaseStorage } from "../../firebase-storage.js";

Kemudian selepas C01Storage.saveProfile(profile), panggil:
await C01FirebaseStorage.saveKTScore({...});
