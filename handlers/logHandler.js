const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { getAyar } = require('../database');
const e = require('../emoji.json');

async function logGonder(guild, data) {
  const logKanalId = getAyar('log_kanal_id');
  if (!logKanalId) return;
  const kanal = guild.channels.cache.get(logKanalId);
  if (!kanal) return;

  const { type, siparis } = data;
  const tarih = new Date().toLocaleString('tr-TR');
  let baslik = '', detay = '';

  if (type === 'tamamlandi') {
    baslik = `## ${e.log_tamam} Sipariş Tamamlandı`;
    detay = [
      `${e.id} **Sipariş No:** \`#${siparis.id}\``,
      `${e.paket} **Ürün:** ${siparis.urun_adi}`,
      `${e.para} **Tutar:** ${siparis.toplam_fiyat}₺`,
      `${e.kullanici} **Müşteri:** <@${siparis.kullanici_id}>`,
      `${e.kalkan} **Onaylayan:** <@${data.yetkili.id}>`,
      `${e.takvim} **Tarih:** ${tarih}`
    ].join('\n');
  } else if (type === 'iptal') {
    baslik = `## ${e.log_iptal} Sipariş İptal Edildi`;
    detay = [
      `${e.id} **Sipariş No:** \`#${siparis.id}\``,
      `${e.paket} **Ürün:** ${siparis.urun_adi}`,
      `${e.para} **Tutar:** ${siparis.toplam_fiyat}₺`,
      `${e.kullanici} **Müşteri:** <@${siparis.kullanici_id}>`,
      `${e.hata} **İptal Eden:** <@${data.iptalEden.id}>`,
      `${e.takvim} **Tarih:** ${tarih}`
    ].join('\n');
  } else if (type === 'yeni') {
    baslik = `## ${e.log_yeni} Yeni Sipariş`;
    detay = [
      `${e.id} **Sipariş No:** \`#${siparis.id}\``,
      `${e.paket} **Ürün:** ${siparis.urun_adi}`,
      `${e.para} **Tutar:** ${siparis.toplam_fiyat}₺`,
      `${e.kullanici} **Müşteri:** <@${siparis.kullanici_id}>`,
      `${e.takvim} **Tarih:** ${tarih}`
    ].join('\n');
  }

  if (!baslik) return;

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(baslik))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(detay));

  await kanal.send({ components: [container], flags: MessageFlags.IsComponentsV2 })
    .catch(err => console.error('[logGonder]', err.message));
}

module.exports = { logGonder };
