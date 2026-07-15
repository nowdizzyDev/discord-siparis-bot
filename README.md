# 🛒 Discord Sipariş Botu

Discord.js v14 ile geliştirilmiş, Component V2 destekli sipariş ve ticket yönetim botu.

---

## ✨ Özellikler

- 📦 Stok yönetimi (ekle, sil, güncelle)
- 🛍️ Component V2 sipariş menüsü — stok değişince otomatik güncellenir
- 🎫 Sipariş başına otomatik ticket kanalı açılır
- 💳 Çoklu ödeme yöntemi (PayPal, Paycell, Papara, IBAN)
- 📋 Açık sipariş listesi
- 📣 Log kanalı
- 🔒 Tüm yönetim komutları sadece bot sahibine açık (`ownerId`)

---

## 🚀 Kurulum

**Gereksinimler:** Node.js v22.5+

```bash
git clone https://github.com/nowdizzyDev/discord-siparis-bot.git
cd discord-siparis-bot
npm install
```

`config.json` dosyası oluştur:

```json
{
  "token": "BOT_TOKENINI_BURAYA_YAZ",
  "clientId": "BOTUN_CLIENT_ID",
  "guildId": "SUNUCUNUN_ID",
  "ownerId": "SENIN_DISCORD_ID"
}
```

Komutları kaydet ve botu başlat:

```bash
node deploy-commands.js
node index.js
```

---

## 📋 Komutlar

| Komut | Açıklama | Kimin Kullanabileceği |
|---|---|---|
| `/menu` | Sipariş menüsünü açar
| `/setup` | Bot ayarlarını yapılandırır | Sadece Owner |
| `/stok-ekle` | Stoğa yeni ürün ekler | Sadece Owner |
| `/stok-sil` | Stoktan ürün kaldırır | Sadece Owner |
| `/stok-guncelle` | Ürün stok adedini günceller | Sadece Owner |
| `/siparisler` | Açık siparişleri listeler | Sadece Owner |

---

## ⚙️ Setup Komutları

`/setup` ile açılan panelden:

- **Log Kanalı** — Sipariş onay/iptal logları buraya gönderilir
- **Ticket Kategorisi** — Sipariş kanalları bu kategori altında açılır
- **Yetkili Rolü** — Siparişleri onaylayabilecek rol
- **Ödeme Ekle/Sil** — PayPal, Paycell, Papara, IBAN

---

## 🗂️ Proje Yapısı

```
siparis-bot/
├── commands/
│   ├── menu.js
│   ├── setup.js
│   ├── siparisler.js
│   ├── stok-ekle.js
│   ├── stok-guncelle.js
│   └── stok-sil.js
├── handlers/
│   ├── logHandler.js
│   ├── menuGuncelle.js
│   ├── ownerCheck.js
│   └── ticketPanel.js
├── config.json        ← .gitignore'da (token içerir)
├── database.js
├── deploy-commands.js
├── emoji.json
└── index.js
```

---

## 🛠️ Teknolojiler

- [Discord.js v14](https://discord.js.org/)
- Node.js built-in `node:sqlite` (derleme gerektirmez)
- Component V2 (`ContainerBuilder`, `TextDisplayBuilder`, `SeparatorBuilder`)
