const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'bot.db'));

db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS stok (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    urun_adi  TEXT    NOT NULL,
    fiyat     REAL    NOT NULL,
    adet      INTEGER NOT NULL DEFAULT 0,
    aciklama  TEXT    DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS siparisler (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    kanal_id      TEXT    NOT NULL,
    kullanici_id  TEXT    NOT NULL,
    urun_id       INTEGER NOT NULL,
    urun_adi      TEXT    NOT NULL,
    adet          INTEGER NOT NULL DEFAULT 1,
    toplam_fiyat  REAL    NOT NULL,
    durum         TEXT    NOT NULL DEFAULT 'acik',
    tarih         TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
  CREATE TABLE IF NOT EXISTS ayarlar (
    anahtar TEXT PRIMARY KEY,
    deger   TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS odeme_yontemleri (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    yontem  TEXT NOT NULL UNIQUE,
    bilgi   TEXT NOT NULL
  );
`);

const getAyar = (anahtar) => {
  const row = db.prepare('SELECT deger FROM ayarlar WHERE anahtar = ?').get(anahtar);
  return row ? row.deger : null;
};

const setAyar = (anahtar, deger) => {
  db.prepare('INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES (?, ?)').run(anahtar, deger);
};

const stokEkle = (urun_adi, fiyat, adet, aciklama = '') =>
  db.prepare('INSERT INTO stok (urun_adi, fiyat, adet, aciklama) VALUES (?, ?, ?, ?)').run(urun_adi, fiyat, adet, aciklama);

const stokSil = (id) =>
  db.prepare('DELETE FROM stok WHERE id = ?').run(id);

const stokGetir = (id) =>
  db.prepare('SELECT * FROM stok WHERE id = ?').get(id);

const tumStoklar = () =>
  db.prepare('SELECT * FROM stok ORDER BY id').all();

const stokDus = (id, adet) =>
  db.prepare('UPDATE stok SET adet = adet - ? WHERE id = ? AND adet >= ?').run(adet, id, adet);

const sipariisKaydet = (kanal_id, kullanici_id, urun_id, urun_adi, adet, toplam_fiyat) =>
  db.prepare('INSERT INTO siparisler (kanal_id, kullanici_id, urun_id, urun_adi, adet, toplam_fiyat) VALUES (?, ?, ?, ?, ?, ?)').run(kanal_id, kullanici_id, urun_id, urun_adi, adet, toplam_fiyat);

const acikSiparisler = () =>
  db.prepare("SELECT * FROM siparisler WHERE durum = 'acik' ORDER BY id DESC").all();

const siparisDurumGuncelle = (kanal_id, durum) =>
  db.prepare('UPDATE siparisler SET durum = ? WHERE kanal_id = ?').run(durum, kanal_id);

const kanalSiparisi = (kanal_id) =>
  db.prepare("SELECT * FROM siparisler WHERE kanal_id = ? AND durum = 'acik'").get(kanal_id);

const odemeEkle = (yontem, bilgi) =>
  db.prepare('INSERT OR REPLACE INTO odeme_yontemleri (yontem, bilgi) VALUES (?, ?)').run(yontem, bilgi);

const odemeSil = (yontem) =>
  db.prepare('DELETE FROM odeme_yontemleri WHERE yontem = ?').run(yontem);

const odemeYontemleri = () =>
  db.prepare('SELECT * FROM odeme_yontemleri ORDER BY id').all();

module.exports = {
  db,
  getAyar, setAyar,
  stokEkle, stokSil, stokGetir, tumStoklar, stokDus,
  sipariisKaydet, acikSiparisler, siparisDurumGuncelle, kanalSiparisi,
  odemeEkle, odemeSil, odemeYontemleri
};
