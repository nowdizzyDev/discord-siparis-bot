const {
  SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle, ContainerBuilder, TextDisplayBuilder,
  SeparatorBuilder, SeparatorSpacingSize, ChannelType, PermissionsBitField, MessageFlags
} = require('discord.js');
const { tumStoklar, stokGetir, getAyar, setAyar } = require('../database');
const { ticketPanelGonder } = require('../handlers/ticketPanel');
const e = require('../emoji.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Sipariş menüsünü aç'),

  async execute(interaction) {
    const stoklar = tumStoklar().filter(s => s.adet > 0);

    if (stoklar.length === 0) {
      return interaction.reply({
        components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.hata} Stok Boş\nŞu an satışta ürün bulunmuyor.`))],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    const urunMetni = stoklar.map(s =>
      `${e.paket} **${s.urun_adi}** — \`${s.fiyat}₺\`  ${e.stok} **${s.adet}** adet` +
      (s.aciklama ? `\n-# ${s.aciklama}` : '')
    ).join('\n');

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.sepet} Sipariş Menüsü`))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`> Almak istediğin ürünü seç, kaç adet istediğini gir.`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(urunMetni))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('menu_urun_sec')
            .setPlaceholder(`${e.sepet} Bir ürün seç...`)
            .addOptions(stoklar.map(s =>
              new StringSelectMenuOptionBuilder()
                .setLabel(s.urun_adi)
                .setDescription(`${s.fiyat}₺ — Stok: ${s.adet} adet` + (s.aciklama ? ` | ${s.aciklama}`.slice(0, 40) : ''))
                .setValue(String(s.id))
                .setEmoji('📦')
            ))
        )
      );

    const { resource } = await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, withResponse: true });
    const reply = resource.message;
    setAyar('menu_kanal_id', reply.channelId);
    setAyar('menu_mesaj_id', reply.id);
  }
};

async function menuSelectIsle(interaction) {
  const urunId = parseInt(interaction.values[0]);
  const urun = stokGetir(urunId);

  if (!urun || urun.adet <= 0) {
    return interaction.reply({
      components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`${e.hata} Bu ürün artık stokta yok.`))],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  return interaction.showModal(
    new ModalBuilder()
      .setCustomId(`menu_adet_modal_${urunId}`)
      .setTitle(`${urun.urun_adi.slice(0, 45)}`)
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('adet')
            .setLabel(`Kaç adet? (Stok: ${urun.adet} adet — ${urun.fiyat}₺/adet)`)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`1 ile ${urun.adet} arasında bir sayı`)
            .setValue('1')
            .setRequired(true)
        )
      )
  );
}

async function menuAdetModalIsle(interaction) {
  const urunId = parseInt(interaction.customId.replace('menu_adet_modal_', ''));
  const adet   = parseInt(interaction.fields.getTextInputValue('adet').trim());
  const urun   = stokGetir(urunId);

  if (!urun) return interaction.reply({ content: `${e.hata} Ürün bulunamadı.`, flags: MessageFlags.Ephemeral });

  if (isNaN(adet) || adet < 1) {
    return interaction.reply({
      components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`${e.hata} Geçersiz adet. **1** ile **${urun.adet}** arasında tam sayı gir.`))],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  if (adet > urun.adet) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.hata} Stok Yetersiz!`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent([
        `${e.paket} **${urun.urun_adi}**`,
        `${e.stok} Mevcut stok: **${urun.adet}** adet`,
        `${e.hata} Girdiğin adet: **${adet}**`,
        ``,
        `-# En fazla **${urun.adet}** adet seçebilirsin.`
      ].join('\n')));
    return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  }

  await interaction.reply({
    components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`${e.sure} Sipariş kanalın açılıyor...`))],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
  });

  const ticket = await ticketAc(interaction, urun, adet);
  if (!ticket) return;

  const toplam = (urun.fiyat * adet).toFixed(2);
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.basarili} Sipariş Kanalın Açıldı!`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      `${e.paket} **${urun.urun_adi}** × **${adet}** adet`,
      `${e.para} Toplam: **${toplam}₺**`,
      `${e.pin} Kanal: <#${ticket.id}>`
    ].join('\n')));

  await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
}

async function ticketAc(interaction, urun, adet = 1) {
  const guild = interaction.guild;
  const user  = interaction.user;
  const kategoriId   = getAyar('kategori_id');
  const yetkiliRolId = getAyar('yetkili_rol_id');

  if (!kategoriId) {
    await interaction.editReply({ components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`${e.hata} Ticket kategorisi ayarlanmamış.`))], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    return null;
  }

  const mevcutKanal = guild.channels.cache.find(
    c => c.name === `siparis-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}` && c.parentId === kategoriId
  );

  if (mevcutKanal) {
    await interaction.editReply({ components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`${e.uyari} Zaten açık bir sipariş kanalın var: <#${mevcutKanal.id}>`))], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    return null;
  }

  const permissionOverwrites = [
    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
  ];
  if (yetkiliRolId) {
    permissionOverwrites.push({ id: yetkiliRolId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageMessages] });
  }

  const kanalAdi = `siparis-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`;
  let kanal;
  try {
    kanal = await guild.channels.create({ name: kanalAdi, type: ChannelType.GuildText, parent: kategoriId, permissionOverwrites, topic: `${e.paket} ${urun.urun_adi} × ${adet} — ${e.kullanici} ${user.tag}` });
  } catch (err) {
    console.error('[ticketAc]', err);
    await interaction.editReply({ components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`${e.hata} Kanal oluşturulamadı. Bot izinlerini kontrol et.`))], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    return null;
  }

  await ticketPanelGonder(kanal, user, urun, adet);
  return kanal;
}

module.exports.menuSelectIsle    = menuSelectIsle;
module.exports.menuAdetModalIsle = menuAdetModalIsle;
