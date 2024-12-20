const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: [
        'https://metgame.netlify.app',
        'https://myengwords-production.up.railway.app',
        'http://localhost:3000',
        'http://localhost:5500',
        'http://localhost:5501',
        'http://127.0.0.1:5500',
        'http://127.0.0.1:5501'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static('public'));

// Veritabanı dosya yolunu yapılandır
const dbPath = process.env.NODE_ENV === 'production'
    ? path.resolve('/tmp/words.db')
    : path.resolve(__dirname, 'words.db');

// SQLite veritabanı bağlantısı
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err.message);
        return;
    }
    console.log('Veritabanına bağlanıldı:', dbPath);
    
    // Tablo oluştur
    db.run(`CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        eng TEXT NOT NULL,
        tr TEXT NOT NULL,
        level TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Tablo oluşturma hatası:', err);
        } else {
            console.log('Tablo hazır');
        }
    });
});

// Uygulama kapatıldığında veritabanını temiz bir şekilde kapat
process.on('SIGTERM', () => {
    db.close((err) => {
        if (err) {
            console.error('Veritabanı kapatma hatası:', err);
        } else {
            console.log('Veritabanı bağlantısı kapatıldı');
        }
        process.exit(0);
    });
});

// Tüm kelimeleri getir
app.get('/api/words', (req, res) => {
    db.all("SELECT * FROM words", [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        if (!rows || rows.length === 0) {
            console.log('No words found in database');
            res.json([]);
            return;
        }
        console.log(`Returning ${rows.length} words`);
        res.json(rows);
    });
});

// Seviyeye göre kelimeleri getir
// app.get('/api/words/:level', (req, res) => {
//     const level = req.params.level;
//     db.all("SELECT * FROM words WHERE level = ?", [level], (err, rows) => {
//         if (err) {
//             res.status(400).json({ error: err.message });
//             return;
//         }
//         res.json(rows);
//     });
// });

// Yeni kelime ekle
app.post('/api/words', (req, res) => {
    const { eng, tr, level } = req.body;
    db.run("INSERT INTO words (eng, tr, level) VALUES (?, ?, ?)", 
        [eng, tr, level], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID });
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
}); 
