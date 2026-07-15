const {
  SlashCommandBuilder, MessageFlags, ActionRowBuilder, StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ComponentType
} = require('discord.js');
const { tumStoklar, stokGetir, db } = require('../database');
const { menuGuncelle }              = require('../handlers/menuGuncelle');
const { ownerKontrol }              = require('../handlers/ownerCheck');
const e = require('../emoji.json');

module.exports = {
  data: new SlashCommandBuilder().setName('stok-guncelle').setDescription('Mevcut bir ürünün stok adedini güncelle'),
  async execute(interaction) {
    if (!await ownerKontrol(interaction)) return;
    const stoklar = tumStoklar();

    if (stoklar.length === 0) return interaction.reply({ content: `${e.hata} Stokta hiç ürün yok.`, flags: MessageFlags.Ephemeral });

    const stokMetni = stoklar.map(s => {
      const durum = s.adet === 0 ? `${e.kirmizi} **STOK BİTTİ**` : `${e.yesil} **${s.adet}** adet`;
      return `${e.paket} \`#${s.id}\` **${s.urun_adi}** — ${s.fiyat}₺ → ${durum}`;
    }).join('\n');

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.ayar} Stok Güncelle`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(stokMetni))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Güncellemek istediğin ürünü seç:`))
      .addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('stok_guncelle_sec').setPlaceholder(`${e.paket} Güncellenecek ürünü seç...`)
          .addOptions(stoklar.map(s => new StringSelectMenuOptionBuilder()
            .setLabel(s.urun_adi.slice(0, 25))
            .setDescription(s.adet === 0 ? `⚠️ STOK BİTTİ — ${s.fiyat}₺` : `${s.adet} adet mevcut — ${s.fiyat}₺`)
            .setValue(String(s.id))
            .setEmoji(s.adet === 0 ? '🔴' : '🟢')
          ))
      ));

    const { resource } = await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, withResponse: true });
    const reply = resource.message;

    const collector = reply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60_000, max: 1 });

    collector.on('collect', async (sel) => {
      const urunId = parseInt(sel.values[0]);
      const urun   = stokGetir(urunId);
      if (!urun) return sel.update({ components: [], content: `${e.hata} Ürün bulunamadı.`, flags: MessageFlags.Ephemeral });

      await sel.showModal(
        new ModalBuilder().setCustomId(`stok_guncelle_modal_${urunId}`).setTitle(`${e.paket} ${urun.urun_adi.slice(0, 40)}`)
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('yeni_adet').setLabel(`Mevcut: ${urun.adet} adet — Yeni adet gir`)
              .setStyle(TextInputStyle.Short).setPlaceholder('örn: 25').setValue(String(urun.adet)).setRequired(true)
          ))
      );

      await interaction.editReply({ components: [], content: `${e.sure} Modal açıldı...`, flags: MessageFlags.Ephemeral }).catch(() => {});
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') interaction.editReply({ content: `${e.sure} Süre doldu.`, components: [], flags: MessageFlags.Ephemeral }).catch(() => {});
    });
  }
};

async function stokGuncelleModalIsle(interaction) {
  const urunId   = parseInt(interaction.customId.replace('stok_guncelle_modal_', ''));
  const yeniAdet = parseInt(interaction.fields.getTextInputValue('yeni_adet').trim());
  const urun     = stokGetir(urunId);

  if (!urun) return interaction.reply({ content: `${e.hata} Ürün bulunamadı.`, flags: MessageFlags.Ephemeral });
  if (isNaN(yeniAdet) || yeniAdet < 0) return interaction.reply({ content: `${e.hata} Geçersiz adet.`, flags: MessageFlags.Ephemeral });

  const eskiAdet = urun.adet;
  db.prepare('UPDATE stok SET adet = ? WHERE id = ?').run(yeniAdet, urunId);
  await menuGuncelle(interaction.client);

  const degisim = yeniAdet - eskiAdet;
  const degisimMetni = degisim > 0 ? `${e.yesil} +${degisim} adet eklendi` : degisim < 0 ? `${e.kirmizi} ${degisim} adet azaltıldı` : `${e.sari} Değişiklik yok`;
  const stoklar   = tumStoklar();
  const stokMetni = stoklar.map(s => `${s.adet === 0 ? e.kirmizi : e.yesil} \`#${s.id}\` **${s.urun_adi}** — ${s.fiyat}₺ × **${s.adet}** adet`).join('\n');

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.basarili} Stok Güncellendi!`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([`${e.paket} **Ürün:** ${urun.urun_adi}`, `${e.stok} **Eski Adet:** ${eskiAdet}`, `${e.basarili} **Yeni Adet:** ${yeniAdet}`, degisimMetni].join('\n')))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${e.liste} **Güncel Stok:**\n${stokMetni}`));

  await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
}

module.exports.stokGuncelleModalIsle = stokGuncelleModalIsle;
