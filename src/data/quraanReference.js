// Master reference data for the Quraan: 114 Surahs and 30 Juz (Parah).
// Names are provided in both English (transliteration + meaning) and Arabic so
// the admin index screen and the mobile Surah/Parah list can render exactly the
// way mainstream Quran apps do.
//
// This is static reference data — it never changes and is not stored in the DB.
// What IS stored per book version is the page each Surah/Parah starts on,
// because every translation PDF paginates differently (models/versionPageIndex.js).

const SURAHS = [
  { number: 1, nameArabic: "الفاتحة", nameEnglish: "Al-Fatihah", meaningEnglish: "The Opening", ayahCount: 7, revelationType: "Meccan" },
  { number: 2, nameArabic: "البقرة", nameEnglish: "Al-Baqarah", meaningEnglish: "The Cow", ayahCount: 286, revelationType: "Medinan" },
  { number: 3, nameArabic: "آل عمران", nameEnglish: "Aal-E-Imran", meaningEnglish: "The Family of Imran", ayahCount: 200, revelationType: "Medinan" },
  { number: 4, nameArabic: "النساء", nameEnglish: "An-Nisa", meaningEnglish: "The Women", ayahCount: 176, revelationType: "Medinan" },
  { number: 5, nameArabic: "المائدة", nameEnglish: "Al-Ma'idah", meaningEnglish: "The Table Spread", ayahCount: 120, revelationType: "Medinan" },
  { number: 6, nameArabic: "الأنعام", nameEnglish: "Al-An'am", meaningEnglish: "The Cattle", ayahCount: 165, revelationType: "Meccan" },
  { number: 7, nameArabic: "الأعراف", nameEnglish: "Al-A'raf", meaningEnglish: "The Heights", ayahCount: 206, revelationType: "Meccan" },
  { number: 8, nameArabic: "الأنفال", nameEnglish: "Al-Anfal", meaningEnglish: "The Spoils of War", ayahCount: 75, revelationType: "Medinan" },
  { number: 9, nameArabic: "التوبة", nameEnglish: "At-Tawbah", meaningEnglish: "The Repentance", ayahCount: 129, revelationType: "Medinan" },
  { number: 10, nameArabic: "يونس", nameEnglish: "Yunus", meaningEnglish: "Jonah", ayahCount: 109, revelationType: "Meccan" },
  { number: 11, nameArabic: "هود", nameEnglish: "Hud", meaningEnglish: "Hud", ayahCount: 123, revelationType: "Meccan" },
  { number: 12, nameArabic: "يوسف", nameEnglish: "Yusuf", meaningEnglish: "Joseph", ayahCount: 111, revelationType: "Meccan" },
  { number: 13, nameArabic: "الرعد", nameEnglish: "Ar-Ra'd", meaningEnglish: "The Thunder", ayahCount: 43, revelationType: "Medinan" },
  { number: 14, nameArabic: "إبراهيم", nameEnglish: "Ibrahim", meaningEnglish: "Abraham", ayahCount: 52, revelationType: "Meccan" },
  { number: 15, nameArabic: "الحجر", nameEnglish: "Al-Hijr", meaningEnglish: "The Rocky Tract", ayahCount: 99, revelationType: "Meccan" },
  { number: 16, nameArabic: "النحل", nameEnglish: "An-Nahl", meaningEnglish: "The Bee", ayahCount: 128, revelationType: "Meccan" },
  { number: 17, nameArabic: "الإسراء", nameEnglish: "Al-Isra", meaningEnglish: "The Night Journey", ayahCount: 111, revelationType: "Meccan" },
  { number: 18, nameArabic: "الكهف", nameEnglish: "Al-Kahf", meaningEnglish: "The Cave", ayahCount: 110, revelationType: "Meccan" },
  { number: 19, nameArabic: "مريم", nameEnglish: "Maryam", meaningEnglish: "Mary", ayahCount: 98, revelationType: "Meccan" },
  { number: 20, nameArabic: "طه", nameEnglish: "Ta-Ha", meaningEnglish: "Ta-Ha", ayahCount: 135, revelationType: "Meccan" },
  { number: 21, nameArabic: "الأنبياء", nameEnglish: "Al-Anbiya", meaningEnglish: "The Prophets", ayahCount: 112, revelationType: "Meccan" },
  { number: 22, nameArabic: "الحج", nameEnglish: "Al-Hajj", meaningEnglish: "The Pilgrimage", ayahCount: 78, revelationType: "Medinan" },
  { number: 23, nameArabic: "المؤمنون", nameEnglish: "Al-Mu'minun", meaningEnglish: "The Believers", ayahCount: 118, revelationType: "Meccan" },
  { number: 24, nameArabic: "النور", nameEnglish: "An-Nur", meaningEnglish: "The Light", ayahCount: 64, revelationType: "Medinan" },
  { number: 25, nameArabic: "الفرقان", nameEnglish: "Al-Furqan", meaningEnglish: "The Criterion", ayahCount: 77, revelationType: "Meccan" },
  { number: 26, nameArabic: "الشعراء", nameEnglish: "Ash-Shu'ara", meaningEnglish: "The Poets", ayahCount: 227, revelationType: "Meccan" },
  { number: 27, nameArabic: "النمل", nameEnglish: "An-Naml", meaningEnglish: "The Ant", ayahCount: 93, revelationType: "Meccan" },
  { number: 28, nameArabic: "القصص", nameEnglish: "Al-Qasas", meaningEnglish: "The Stories", ayahCount: 88, revelationType: "Meccan" },
  { number: 29, nameArabic: "العنكبوت", nameEnglish: "Al-Ankabut", meaningEnglish: "The Spider", ayahCount: 69, revelationType: "Meccan" },
  { number: 30, nameArabic: "الروم", nameEnglish: "Ar-Rum", meaningEnglish: "The Romans", ayahCount: 60, revelationType: "Meccan" },
  { number: 31, nameArabic: "لقمان", nameEnglish: "Luqman", meaningEnglish: "Luqman", ayahCount: 34, revelationType: "Meccan" },
  { number: 32, nameArabic: "السجدة", nameEnglish: "As-Sajdah", meaningEnglish: "The Prostration", ayahCount: 30, revelationType: "Meccan" },
  { number: 33, nameArabic: "الأحزاب", nameEnglish: "Al-Ahzab", meaningEnglish: "The Combined Forces", ayahCount: 73, revelationType: "Medinan" },
  { number: 34, nameArabic: "سبأ", nameEnglish: "Saba", meaningEnglish: "Sheba", ayahCount: 54, revelationType: "Meccan" },
  { number: 35, nameArabic: "فاطر", nameEnglish: "Fatir", meaningEnglish: "Originator", ayahCount: 45, revelationType: "Meccan" },
  { number: 36, nameArabic: "يس", nameEnglish: "Ya-Sin", meaningEnglish: "Ya Sin", ayahCount: 83, revelationType: "Meccan" },
  { number: 37, nameArabic: "الصافات", nameEnglish: "As-Saffat", meaningEnglish: "Those Who Set The Ranks", ayahCount: 182, revelationType: "Meccan" },
  { number: 38, nameArabic: "ص", nameEnglish: "Sad", meaningEnglish: "The Letter Sad", ayahCount: 88, revelationType: "Meccan" },
  { number: 39, nameArabic: "الزمر", nameEnglish: "Az-Zumar", meaningEnglish: "The Troops", ayahCount: 75, revelationType: "Meccan" },
  { number: 40, nameArabic: "غافر", nameEnglish: "Ghafir", meaningEnglish: "The Forgiver", ayahCount: 85, revelationType: "Meccan" },
  { number: 41, nameArabic: "فصلت", nameEnglish: "Fussilat", meaningEnglish: "Explained In Detail", ayahCount: 54, revelationType: "Meccan" },
  { number: 42, nameArabic: "الشورى", nameEnglish: "Ash-Shura", meaningEnglish: "The Consultation", ayahCount: 53, revelationType: "Meccan" },
  { number: 43, nameArabic: "الزخرف", nameEnglish: "Az-Zukhruf", meaningEnglish: "The Ornaments Of Gold", ayahCount: 89, revelationType: "Meccan" },
  { number: 44, nameArabic: "الدخان", nameEnglish: "Ad-Dukhan", meaningEnglish: "The Smoke", ayahCount: 59, revelationType: "Meccan" },
  { number: 45, nameArabic: "الجاثية", nameEnglish: "Al-Jathiyah", meaningEnglish: "The Crouching", ayahCount: 37, revelationType: "Meccan" },
  { number: 46, nameArabic: "الأحقاف", nameEnglish: "Al-Ahqaf", meaningEnglish: "The Wind-Curved Sandhills", ayahCount: 35, revelationType: "Meccan" },
  { number: 47, nameArabic: "محمد", nameEnglish: "Muhammad", meaningEnglish: "Muhammad", ayahCount: 38, revelationType: "Medinan" },
  { number: 48, nameArabic: "الفتح", nameEnglish: "Al-Fath", meaningEnglish: "The Victory", ayahCount: 29, revelationType: "Medinan" },
  { number: 49, nameArabic: "الحجرات", nameEnglish: "Al-Hujurat", meaningEnglish: "The Rooms", ayahCount: 18, revelationType: "Medinan" },
  { number: 50, nameArabic: "ق", nameEnglish: "Qaf", meaningEnglish: "The Letter Qaf", ayahCount: 45, revelationType: "Meccan" },
  { number: 51, nameArabic: "الذاريات", nameEnglish: "Adh-Dhariyat", meaningEnglish: "The Winnowing Winds", ayahCount: 60, revelationType: "Meccan" },
  { number: 52, nameArabic: "الطور", nameEnglish: "At-Tur", meaningEnglish: "The Mount", ayahCount: 49, revelationType: "Meccan" },
  { number: 53, nameArabic: "النجم", nameEnglish: "An-Najm", meaningEnglish: "The Star", ayahCount: 62, revelationType: "Meccan" },
  { number: 54, nameArabic: "القمر", nameEnglish: "Al-Qamar", meaningEnglish: "The Moon", ayahCount: 55, revelationType: "Meccan" },
  { number: 55, nameArabic: "الرحمن", nameEnglish: "Ar-Rahman", meaningEnglish: "The Beneficent", ayahCount: 78, revelationType: "Medinan" },
  { number: 56, nameArabic: "الواقعة", nameEnglish: "Al-Waqi'ah", meaningEnglish: "The Inevitable", ayahCount: 96, revelationType: "Meccan" },
  { number: 57, nameArabic: "الحديد", nameEnglish: "Al-Hadid", meaningEnglish: "The Iron", ayahCount: 29, revelationType: "Medinan" },
  { number: 58, nameArabic: "المجادلة", nameEnglish: "Al-Mujadila", meaningEnglish: "The Pleading Woman", ayahCount: 22, revelationType: "Medinan" },
  { number: 59, nameArabic: "الحشر", nameEnglish: "Al-Hashr", meaningEnglish: "The Exile", ayahCount: 24, revelationType: "Medinan" },
  { number: 60, nameArabic: "الممتحنة", nameEnglish: "Al-Mumtahanah", meaningEnglish: "She That Is To Be Examined", ayahCount: 13, revelationType: "Medinan" },
  { number: 61, nameArabic: "الصف", nameEnglish: "As-Saff", meaningEnglish: "The Ranks", ayahCount: 14, revelationType: "Medinan" },
  { number: 62, nameArabic: "الجمعة", nameEnglish: "Al-Jumu'ah", meaningEnglish: "The Congregation, Friday", ayahCount: 11, revelationType: "Medinan" },
  { number: 63, nameArabic: "المنافقون", nameEnglish: "Al-Munafiqun", meaningEnglish: "The Hypocrites", ayahCount: 11, revelationType: "Medinan" },
  { number: 64, nameArabic: "التغابن", nameEnglish: "At-Taghabun", meaningEnglish: "The Mutual Disillusion", ayahCount: 18, revelationType: "Medinan" },
  { number: 65, nameArabic: "الطلاق", nameEnglish: "At-Talaq", meaningEnglish: "The Divorce", ayahCount: 12, revelationType: "Medinan" },
  { number: 66, nameArabic: "التحريم", nameEnglish: "At-Tahrim", meaningEnglish: "The Prohibition", ayahCount: 12, revelationType: "Medinan" },
  { number: 67, nameArabic: "الملك", nameEnglish: "Al-Mulk", meaningEnglish: "The Sovereignty", ayahCount: 30, revelationType: "Meccan" },
  { number: 68, nameArabic: "القلم", nameEnglish: "Al-Qalam", meaningEnglish: "The Pen", ayahCount: 52, revelationType: "Meccan" },
  { number: 69, nameArabic: "الحاقة", nameEnglish: "Al-Haqqah", meaningEnglish: "The Reality", ayahCount: 52, revelationType: "Meccan" },
  { number: 70, nameArabic: "المعارج", nameEnglish: "Al-Ma'arij", meaningEnglish: "The Ascending Stairways", ayahCount: 44, revelationType: "Meccan" },
  { number: 71, nameArabic: "نوح", nameEnglish: "Nuh", meaningEnglish: "Noah", ayahCount: 28, revelationType: "Meccan" },
  { number: 72, nameArabic: "الجن", nameEnglish: "Al-Jinn", meaningEnglish: "The Jinn", ayahCount: 28, revelationType: "Meccan" },
  { number: 73, nameArabic: "المزمل", nameEnglish: "Al-Muzzammil", meaningEnglish: "The Enshrouded One", ayahCount: 20, revelationType: "Meccan" },
  { number: 74, nameArabic: "المدثر", nameEnglish: "Al-Muddaththir", meaningEnglish: "The Cloaked One", ayahCount: 56, revelationType: "Meccan" },
  { number: 75, nameArabic: "القيامة", nameEnglish: "Al-Qiyamah", meaningEnglish: "The Resurrection", ayahCount: 40, revelationType: "Meccan" },
  { number: 76, nameArabic: "الإنسان", nameEnglish: "Al-Insan", meaningEnglish: "The Man", ayahCount: 31, revelationType: "Medinan" },
  { number: 77, nameArabic: "المرسلات", nameEnglish: "Al-Mursalat", meaningEnglish: "The Emissaries", ayahCount: 50, revelationType: "Meccan" },
  { number: 78, nameArabic: "النبأ", nameEnglish: "An-Naba", meaningEnglish: "The Tidings", ayahCount: 40, revelationType: "Meccan" },
  { number: 79, nameArabic: "النازعات", nameEnglish: "An-Nazi'at", meaningEnglish: "Those Who Drag Forth", ayahCount: 46, revelationType: "Meccan" },
  { number: 80, nameArabic: "عبس", nameEnglish: "Abasa", meaningEnglish: "He Frowned", ayahCount: 42, revelationType: "Meccan" },
  { number: 81, nameArabic: "التكوير", nameEnglish: "At-Takwir", meaningEnglish: "The Overthrowing", ayahCount: 29, revelationType: "Meccan" },
  { number: 82, nameArabic: "الإنفطار", nameEnglish: "Al-Infitar", meaningEnglish: "The Cleaving", ayahCount: 19, revelationType: "Meccan" },
  { number: 83, nameArabic: "المطففين", nameEnglish: "Al-Mutaffifin", meaningEnglish: "The Defrauding", ayahCount: 36, revelationType: "Meccan" },
  { number: 84, nameArabic: "الإنشقاق", nameEnglish: "Al-Inshiqaq", meaningEnglish: "The Sundering", ayahCount: 25, revelationType: "Meccan" },
  { number: 85, nameArabic: "البروج", nameEnglish: "Al-Buruj", meaningEnglish: "The Mansions Of The Stars", ayahCount: 22, revelationType: "Meccan" },
  { number: 86, nameArabic: "الطارق", nameEnglish: "At-Tariq", meaningEnglish: "The Nightcomer", ayahCount: 17, revelationType: "Meccan" },
  { number: 87, nameArabic: "الأعلى", nameEnglish: "Al-A'la", meaningEnglish: "The Most High", ayahCount: 19, revelationType: "Meccan" },
  { number: 88, nameArabic: "الغاشية", nameEnglish: "Al-Ghashiyah", meaningEnglish: "The Overwhelming", ayahCount: 26, revelationType: "Meccan" },
  { number: 89, nameArabic: "الفجر", nameEnglish: "Al-Fajr", meaningEnglish: "The Dawn", ayahCount: 30, revelationType: "Meccan" },
  { number: 90, nameArabic: "البلد", nameEnglish: "Al-Balad", meaningEnglish: "The City", ayahCount: 20, revelationType: "Meccan" },
  { number: 91, nameArabic: "الشمس", nameEnglish: "Ash-Shams", meaningEnglish: "The Sun", ayahCount: 15, revelationType: "Meccan" },
  { number: 92, nameArabic: "الليل", nameEnglish: "Al-Layl", meaningEnglish: "The Night", ayahCount: 21, revelationType: "Meccan" },
  { number: 93, nameArabic: "الضحى", nameEnglish: "Ad-Duhaa", meaningEnglish: "The Morning Hours", ayahCount: 11, revelationType: "Meccan" },
  { number: 94, nameArabic: "الشرح", nameEnglish: "Ash-Sharh", meaningEnglish: "The Relief", ayahCount: 8, revelationType: "Meccan" },
  { number: 95, nameArabic: "التين", nameEnglish: "At-Tin", meaningEnglish: "The Fig", ayahCount: 8, revelationType: "Meccan" },
  { number: 96, nameArabic: "العلق", nameEnglish: "Al-Alaq", meaningEnglish: "The Clot", ayahCount: 19, revelationType: "Meccan" },
  { number: 97, nameArabic: "القدر", nameEnglish: "Al-Qadr", meaningEnglish: "The Power", ayahCount: 5, revelationType: "Meccan" },
  { number: 98, nameArabic: "البينة", nameEnglish: "Al-Bayyinah", meaningEnglish: "The Clear Proof", ayahCount: 8, revelationType: "Medinan" },
  { number: 99, nameArabic: "الزلزلة", nameEnglish: "Az-Zalzalah", meaningEnglish: "The Earthquake", ayahCount: 8, revelationType: "Medinan" },
  { number: 100, nameArabic: "العاديات", nameEnglish: "Al-Adiyat", meaningEnglish: "The Courser", ayahCount: 11, revelationType: "Meccan" },
  { number: 101, nameArabic: "القارعة", nameEnglish: "Al-Qari'ah", meaningEnglish: "The Calamity", ayahCount: 11, revelationType: "Meccan" },
  { number: 102, nameArabic: "التكاثر", nameEnglish: "At-Takathur", meaningEnglish: "The Rivalry In World Increase", ayahCount: 8, revelationType: "Meccan" },
  { number: 103, nameArabic: "العصر", nameEnglish: "Al-Asr", meaningEnglish: "The Declining Day", ayahCount: 3, revelationType: "Meccan" },
  { number: 104, nameArabic: "الهمزة", nameEnglish: "Al-Humazah", meaningEnglish: "The Traducer", ayahCount: 9, revelationType: "Meccan" },
  { number: 105, nameArabic: "الفيل", nameEnglish: "Al-Fil", meaningEnglish: "The Elephant", ayahCount: 5, revelationType: "Meccan" },
  { number: 106, nameArabic: "قريش", nameEnglish: "Quraysh", meaningEnglish: "Quraysh", ayahCount: 4, revelationType: "Meccan" },
  { number: 107, nameArabic: "الماعون", nameEnglish: "Al-Ma'un", meaningEnglish: "The Small Kindnesses", ayahCount: 7, revelationType: "Meccan" },
  { number: 108, nameArabic: "الكوثر", nameEnglish: "Al-Kawthar", meaningEnglish: "The Abundance", ayahCount: 3, revelationType: "Meccan" },
  { number: 109, nameArabic: "الكافرون", nameEnglish: "Al-Kafirun", meaningEnglish: "The Disbelievers", ayahCount: 6, revelationType: "Meccan" },
  { number: 110, nameArabic: "النصر", nameEnglish: "An-Nasr", meaningEnglish: "The Divine Support", ayahCount: 3, revelationType: "Medinan" },
  { number: 111, nameArabic: "المسد", nameEnglish: "Al-Masad", meaningEnglish: "The Palm Fibre", ayahCount: 5, revelationType: "Meccan" },
  { number: 112, nameArabic: "الإخلاص", nameEnglish: "Al-Ikhlas", meaningEnglish: "The Sincerity", ayahCount: 4, revelationType: "Meccan" },
  { number: 113, nameArabic: "الفلق", nameEnglish: "Al-Falaq", meaningEnglish: "The Daybreak", ayahCount: 5, revelationType: "Meccan" },
  { number: 114, nameArabic: "الناس", nameEnglish: "An-Nas", meaningEnglish: "Mankind", ayahCount: 6, revelationType: "Meccan" },
];

// Parah / Juz — traditionally named after the opening words of the part.
//
// startSurah / startAyah are where each Parah begins. Unlike page numbers, these are
// a property of the Quran itself and identical in every edition, which is what lets
// the admin tool tell whether a page's Surah and Parah can actually go together.
// (Standard Hafs boundaries. The Surah of each boundary is what validation uses; the
// ayah is shown as a hint so the admin knows what to look for on the page.)
const JUZ = [
  { number: 1, nameArabic: "الم", nameEnglish: "Alif Lam Meem", startSurah: 1, startAyah: 1 },
  { number: 2, nameArabic: "سيقول", nameEnglish: "Sayaqul", startSurah: 2, startAyah: 142 },
  { number: 3, nameArabic: "تلك الرسل", nameEnglish: "Tilkal Rusul", startSurah: 2, startAyah: 253 },
  { number: 4, nameArabic: "لن تنالوا", nameEnglish: "Lan Tanaloo", startSurah: 3, startAyah: 92 },
  { number: 5, nameArabic: "والمحصنات", nameEnglish: "Wal Mohsanat", startSurah: 4, startAyah: 24 },
  { number: 6, nameArabic: "لا يحب الله", nameEnglish: "La Yuhibbullah", startSurah: 4, startAyah: 148 },
  { number: 7, nameArabic: "وإذا سمعوا", nameEnglish: "Wa Iza Samiu", startSurah: 5, startAyah: 82 },
  { number: 8, nameArabic: "ولو أننا", nameEnglish: "Wa Lau Annana", startSurah: 6, startAyah: 111 },
  { number: 9, nameArabic: "قال الملأ", nameEnglish: "Qalal Malaou", startSurah: 7, startAyah: 88 },
  { number: 10, nameArabic: "واعلموا", nameEnglish: "Wa A'lamu", startSurah: 8, startAyah: 41 },
  { number: 11, nameArabic: "يعتذرون", nameEnglish: "Yatazeroon", startSurah: 9, startAyah: 93 },
  { number: 12, nameArabic: "وما من دابة", nameEnglish: "Wa Mamin Dabbatin", startSurah: 11, startAyah: 6 },
  { number: 13, nameArabic: "وما أبرئ", nameEnglish: "Wa Ma Ubarrio", startSurah: 12, startAyah: 53 },
  { number: 14, nameArabic: "ربما", nameEnglish: "Rubama", startSurah: 15, startAyah: 1 },
  { number: 15, nameArabic: "سبحان الذي", nameEnglish: "Subhanalladhi", startSurah: 17, startAyah: 1 },
  { number: 16, nameArabic: "قال ألم", nameEnglish: "Qal Alam", startSurah: 18, startAyah: 75 },
  { number: 17, nameArabic: "اقترب للناس", nameEnglish: "Iqtaraba Lin-nas", startSurah: 21, startAyah: 1 },
  { number: 18, nameArabic: "قد أفلح", nameEnglish: "Qad Aflaha", startSurah: 23, startAyah: 1 },
  { number: 19, nameArabic: "وقال الذين", nameEnglish: "Wa Qalalladhina", startSurah: 25, startAyah: 21 },
  { number: 20, nameArabic: "أمن خلق", nameEnglish: "Amman Khalaqa", startSurah: 27, startAyah: 56 },
  { number: 21, nameArabic: "اتل ما أوحي", nameEnglish: "Utlu Ma Oohiya", startSurah: 29, startAyah: 45 },
  { number: 22, nameArabic: "ومن يقنت", nameEnglish: "Wa Manyaqnut", startSurah: 33, startAyah: 31 },
  { number: 23, nameArabic: "وما لي", nameEnglish: "Wa Mali", startSurah: 36, startAyah: 28 },
  { number: 24, nameArabic: "فمن أظلم", nameEnglish: "Faman Azlamu", startSurah: 39, startAyah: 32 },
  { number: 25, nameArabic: "إليه يرد", nameEnglish: "Elahi Yuraddu", startSurah: 41, startAyah: 47 },
  { number: 26, nameArabic: "حم", nameEnglish: "Ha Meem", startSurah: 46, startAyah: 1 },
  { number: 27, nameArabic: "قال فما خطبكم", nameEnglish: "Qala Fama Khatbukum", startSurah: 51, startAyah: 31 },
  { number: 28, nameArabic: "قد سمع الله", nameEnglish: "Qad Sami Allah", startSurah: 58, startAyah: 1 },
  { number: 29, nameArabic: "تبارك الذي", nameEnglish: "Tabarakalladhi", startSurah: 67, startAyah: 1 },
  { number: 30, nameArabic: "عم", nameEnglish: "Amma", startSurah: 78, startAyah: 1 },
];

const SURAH_BY_NUMBER = new Map(SURAHS.map((s) => [s.number, s]));
const JUZ_BY_NUMBER = new Map(JUZ.map((j) => [j.number, j]));

// Which Parahs can a given Surah appear in?
//
// A Parah runs from its own start up to the ayah before the next Parah's start, so a
// Parah J covers every Surah from startSurah(J) through startSurah(J+1) — the last one
// included because the next Parah may begin part-way through it. Surah 9 (At-Tawbah),
// for example, is covered by Parahs 10 and 11 and nothing else.
//
// Only the Surah half of each boundary is used here, never the ayah, so this stays
// correct even if an ayah number needs a one-verse correction for a particular mushaf.
const JUZ_NUMBERS_BY_SURAH = new Map();
for (let surah = 1; surah <= SURAHS.length; surah++) {
  const covering = JUZ.filter((juz, i) => {
    const nextStart = JUZ[i + 1] ? JUZ[i + 1].startSurah : SURAHS.length + 1;
    return juz.startSurah <= surah && surah <= nextStart;
  }).map((juz) => juz.number);

  JUZ_NUMBERS_BY_SURAH.set(surah, covering);
}

module.exports = {
  SURAHS,
  JUZ,
  TOTAL_SURAHS: SURAHS.length,
  TOTAL_JUZ: JUZ.length,
  getSurah: (number) => SURAH_BY_NUMBER.get(Number(number)) || null,
  getJuz: (number) => JUZ_BY_NUMBER.get(Number(number)) || null,

  // The Parahs a Surah can legitimately be part of — [] for an unknown Surah.
  getJuzNumbersForSurah: (surahNumber) =>
    JUZ_NUMBERS_BY_SURAH.get(Number(surahNumber)) || [],

  // True when this Surah and Parah can occur on the same page at all.
  isJuzValidForSurah: (surahNumber, juzNumber) => {
    if (!surahNumber || !juzNumber) return true; // nothing to contradict yet
    const allowed = JUZ_NUMBERS_BY_SURAH.get(Number(surahNumber)) || [];
    return allowed.includes(Number(juzNumber));
  },

  // The Parah that a Surah's own first ayah falls inside — the sensible default when
  // the admin marks "Surah starts here".
  //
  // This is the last Parah whose start position is at or before (surah, ayah 1).
  // The ayah half of the comparison matters: Parah 3 begins at 2:253, so although its
  // startSurah is 2, Al-Baqarah's own first ayah belongs to Parah 1, not Parah 3.
  getJuzAtSurahStart: (surahNumber) => {
    const surah = Number(surahNumber);
    let found = null;
    for (const juz of JUZ) {
      const startsAtOrBefore =
        juz.startSurah < surah || (juz.startSurah === surah && juz.startAyah <= 1);
      if (startsAtOrBefore) found = juz.number;
      else break;
    }
    return found;
  },

  // Whole map, sent to the admin UI so the Parah dropdown can filter itself.
  getSurahJuzMap: () => Object.fromEntries(JUZ_NUMBERS_BY_SURAH),
};
