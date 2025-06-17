export interface EmailTemplateData {
  companyName?: string;
  inviterName?: string;
  inviteUrl?: string;
  role?: string;
  contractTitle?: string;
  contractUrl?: string;
  daysUntilExpiration?: number;
  userName?: string;
  emailVerificationUrl?: string;
  passwordResetUrl?: string;
  newPassword?: string;
  loginUrl?: string;
  signatureUrl?: string;
  documentName?: string;
  approverName?: string;
  maintenanceDate?: string;
  maintenanceDuration?: string;
  maintenanceType?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailTemplates {
  private static baseTemplate(title: string, content: string, footer?: string): string {
    return `
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333333; 
            background-color: #f6f9fc;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .header h1 { 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 10px;
          }
          .header p { 
            font-size: 16px; 
            opacity: 0.9;
          }
          .content { 
            padding: 40px 30px; 
            background-color: #ffffff;
          }
          .content h2 { 
            color: #2d3748; 
            font-size: 24px; 
            margin-bottom: 20px;
          }
          .content p { 
            margin-bottom: 16px; 
            font-size: 16px; 
            line-height: 1.6;
          }
          .button { 
            display: inline-block; 
            padding: 16px 32px; 
            background-color: #4f46e5; 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px;
            margin: 24px 0;
            transition: background-color 0.3s ease;
          }
          .button:hover { 
            background-color: #4338ca; 
          }
          .button-secondary {
            background-color: #6b7280;
          }
          .button-secondary:hover {
            background-color: #4b5563;
          }
          .info-box {
            background-color: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning-box {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .success-box {
            background-color: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer { 
            background-color: #f8fafc; 
            padding: 30px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .footer a {
            color: #4f46e5;
            text-decoration: none;
          }
          .divider {
            margin: 30px 0;
            border: none;
            border-top: 1px solid #e5e7eb;
          }
          ul {
            margin: 16px 0;
            padding-left: 20px;
          }
          li {
            margin-bottom: 8px;
            font-size: 16px;
          }
          .text-center {
            text-align: center;
          }
          .text-small {
            font-size: 14px;
            color: #6b7280;
          }
          .brand-logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand-logo">📋 Contravo</div>
            <h1>${title}</h1>
            <p>Akıllı Sözleşme Yönetim Platformu</p>
          </div>
          
          <div class="content">
            ${content}
          </div>
          
          <div class="footer">
            ${footer || `
              <p>Bu email otomatik olarak gönderilmiştir.</p>
              <p>© 2024 Contravo. Tüm hakları saklıdır.</p>
              <p>
                <a href="#">Gizlilik Politikası</a> | 
                <a href="#">Kullanım Şartları</a> | 
                <a href="#">Destek</a>
              </p>
            `}
          </div>
        </div>
      </body>
    </html>
    `;
  }

  static companyInvitation(data: EmailTemplateData): EmailTemplate {
    const roleText = data.role === 'ADMIN' ? 'Yönetici' : 'Üye';
    
    const content = `
      <h2>Merhaba! 👋</h2>
      
      <p><strong>${data.inviterName}</strong> sizi <strong>${data.companyName}</strong> şirketine <strong>${roleText}</strong> olarak katılmaya davet etti.</p>
      
      <div class="info-box">
        <p><strong>🏢 Şirket:</strong> ${data.companyName}</p>
        <p><strong>👤 Rol:</strong> ${roleText}</p>
        <p><strong>📨 Davet Eden:</strong> ${data.inviterName}</p>
      </div>
      
      <p>Daveti kabul etmek için aşağıdaki butona tıklayın:</p>
      
      <div class="text-center">
        <a href="${data.inviteUrl}" class="button">Daveti Kabul Et</a>
      </div>
      
      <p class="text-small">⏰ Bu davet linki 7 gün sonra geçersiz olacaktır.</p>
      
      <hr class="divider">
      
      <p><strong>Contravo ile neler yapabilirsiniz?</strong></p>
      <ul>
        <li>📄 Sözleşmeleri kolayca oluşturun ve yönetin</li>
        <li>👥 Ekip üyeleriyle gerçek zamanlı işbirliği yapın</li>
        <li>📊 Detaylı analitik ve raporlar alın</li>
        <li>🔔 Önemli tarihler için otomatik hatırlatmalar</li>
        <li>✍️ Dijital imza ve onay süreçleri</li>
        <li>📱 Mobil uyumlu modern arayüz</li>
      </ul>
    `;

    return {
      subject: `${data.companyName} şirketine davet edildiniz - Contravo`,
      html: this.baseTemplate('Şirket Daveti', content),
      text: `Merhaba! ${data.inviterName} sizi ${data.companyName} şirketine ${roleText} olarak katılmaya davet etti. Daveti kabul etmek için: ${data.inviteUrl}`
    };
  }

  static contractExpiring(data: EmailTemplateData): EmailTemplate {
    const content = `
      <h2>⚠️ Sözleşme Süresi Dolmak Üzere</h2>
      
      <p>Merhaba <strong>${data.userName}</strong>,</p>
      
      <p>Aşağıdaki sözleşmenizin süresi <strong>${data.daysUntilExpiration} gün</strong> içinde dolacak:</p>
      
      <div class="warning-box">
        <p><strong>📄 Sözleşme:</strong> ${data.contractTitle}</p>
        <p><strong>⏰ Kalan Süre:</strong> ${data.daysUntilExpiration} gün</p>
        <p><strong>🏢 Şirket:</strong> ${data.companyName}</p>
      </div>
      
      <p>Sözleşmeyi incelemek ve gerekli işlemleri yapmak için:</p>
      
      <div class="text-center">
        <a href="${data.contractUrl}" class="button">Sözleşmeyi Görüntüle</a>
      </div>
      
      <p><strong>Yapmanız gerekenler:</strong></p>
      <ul>
        <li>Sözleşme şartlarını gözden geçirin</li>
        <li>Yenileme gerekiyorsa yeni sözleşme oluşturun</li>
        <li>Gerekirse karşı tarafla iletişime geçin</li>
        <li>Arşivleme işlemlerini planlayın</li>
      </ul>
    `;

    return {
      subject: `🚨 Sözleşme süresi dolmak üzere: ${data.contractTitle}`,
      html: this.baseTemplate('Sözleşme Hatırlatması', content),
      text: `Sözleşme süresi dolmak üzere: ${data.contractTitle}. Kalan süre: ${data.daysUntilExpiration} gün. İncelemek için: ${data.contractUrl}`
    };
  }

  static contractExpired(data: EmailTemplateData): EmailTemplate {
    const content = `
      <h2>🔴 Sözleşme Süresi Doldu</h2>
      
      <p>Merhaba <strong>${data.userName}</strong>,</p>
      
      <p>Aşağıdaki sözleşmenizin süresi <strong>dolmuştur</strong>:</p>
      
      <div class="warning-box">
        <p><strong>📄 Sözleşme:</strong> ${data.contractTitle}</p>
        <p><strong>⚠️ Durum:</strong> Süresi Doldu</p>
        <p><strong>🏢 Şirket:</strong> ${data.companyName}</p>
      </div>
      
      <p>Sözleşmeyi incelemek için:</p>
      
      <div class="text-center">
        <a href="${data.contractUrl}" class="button">Sözleşmeyi Görüntüle</a>
      </div>
      
      <p><strong>Önerilen işlemler:</strong></p>
      <ul>
        <li>Sözleşmeyi arşivleyin</li>
        <li>Gerekirse yeni sözleşme oluşturun</li>
        <li>Yasal gereklilikleri kontrol edin</li>
        <li>İlgili tarafları bilgilendirin</li>
      </ul>
    `;

    return {
      subject: `🔴 Sözleşme süresi doldu: ${data.contractTitle}`,
      html: this.baseTemplate('Sözleşme Süresi Doldu', content),
      text: `Sözleşme süresi doldu: ${data.contractTitle}. İncelemek için: ${data.contractUrl}`
    };
  }

  static approvalNeeded(data: EmailTemplateData): EmailTemplate {
    const content = `
      <h2>📋 Onay Bekleyen Sözleşme</h2>
      
      <p>Merhaba <strong>${data.userName}</strong>,</p>
      
      <p>Aşağıdaki sözleşme onayınızı bekliyor:</p>
      
      <div class="info-box">
        <p><strong>📄 Sözleşme:</strong> ${data.contractTitle}</p>
        <p><strong>🏢 Şirket:</strong> ${data.companyName}</p>
        <p><strong>⏰ Durum:</strong> Onay Bekliyor</p>
      </div>
      
      <p>Sözleşmeyi inceleyip onaylamak için:</p>
      
      <div class="text-center">
        <a href="${data.contractUrl}" class="button">Sözleşmeyi İncele ve Onayla</a>
      </div>
      
      <p><strong>Onay süreci:</strong></p>
      <ul>
        <li>Sözleşme içeriğini dikkatli bir şekilde inceleyin</li>
        <li>Gerekirse yorumlarınızı ekleyin</li>
        <li>Onaylayın veya reddedin</li>
        <li>Ret durumunda gerekçenizi belirtin</li>
      </ul>
    `;

    return {
      subject: `📋 Onay bekleyen sözleşme: ${data.contractTitle}`,
      html: this.baseTemplate('Onay Gerekli', content),
      text: `Onay bekleyen sözleşme: ${data.contractTitle}. İncelemek için: ${data.contractUrl}`
    };
  }

  static approvalReceived(data: EmailTemplateData): EmailTemplate {
    const content = `
      <h2>✅ Sözleşme Onaylandı</h2>
      
      <p>Merhaba <strong>${data.userName}</strong>,</p>
      
      <p>Sözleşmeniz <strong>${data.approverName}</strong> tarafından onaylandı:</p>
      
      <div class="success-box">
        <p><strong>📄 Sözleşme:</strong> ${data.contractTitle}</p>
        <p><strong>👤 Onaylayan:</strong> ${data.approverName}</p>
        <p><strong>✅ Durum:</strong> Onaylandı</p>
      </div>
      
      <p>Sözleşmeyi görüntülemek için:</p>
      
      <div class="text-center">
        <a href="${data.contractUrl}" class="button">Sözleşmeyi Görüntüle</a>
      </div>
      
      <p><strong>Sonraki adımlar:</strong></p>
      <ul>
        <li>Sözleşme artık aktif durumda</li>
        <li>Tüm taraflar bilgilendirilecek</li>
        <li>Süreç tamamlandı</li>
      </ul>
    `;

    return {
      subject: `✅ Sözleşme onaylandı: ${data.contractTitle}`,
      html: this.baseTemplate('Sözleşme Onaylandı', content),
      text: `Sözleşme onaylandı: ${data.contractTitle}. Onaylayan: ${data.approverName}. Görüntülemek için: ${data.contractUrl}`
    };
  }

  static emailVerification(data: EmailTemplateData): EmailTemplate {
    const content = `
      <h2>📧 Email Adresinizi Doğrulayın</h2>
      
      <p>Merhaba <strong>${data.userName}</strong>,</p>
      
      <p>Contravo hesabınızı oluşturduğunuz için teşekkür ederiz! Email adresinizi doğrulamak için aşağıdaki butona tıklayın:</p>
      
      <div class="text-center">
        <a href="${data.emailVerificationUrl}" class="button">Email Adresimi Doğrula</a>
      </div>
      
      <p class="text-small">⏰ Bu doğrulama linki 24 saat sonra geçersiz olacaktır.</p>
      
      <hr class="divider">
      
      <p><strong>Contravo'ya Hoş Geldiniz!</strong></p>
      <p>Email adresinizi doğruladıktan sonra şunları yapabilirsiniz:</p>
      <ul>
        <li>Şirket hesabınızı oluşturun</li>
        <li>Ekip üyelerinizi davet edin</li>
        <li>İlk sözleşmenizi oluşturun</li>
        <li>Süreçlerinizi dijitalleştirin</li>
      </ul>
    `;

    return {
      subject: '📧 Email adresinizi doğrulayın - Contravo',
      html: this.baseTemplate('Email Doğrulama', content),
      text: `Email adresinizi doğrulayın: ${data.emailVerificationUrl}`
    };
  }

  static passwordReset(data: EmailTemplateData): EmailTemplate {
    const content = `
      <h2>🔐 Şifre Sıfırlama</h2>
      
      <p>Merhaba <strong>${data.userName}</strong>,</p>
      
      <p>Şifrenizi sıfırlamak için bir talepte bulundunuz. Yeni şifre oluşturmak için aşağıdaki butona tıklayın:</p>
      
      <div class="text-center">
        <a href="${data.passwordResetUrl}" class="button">Şifremi Sıfırla</a>
      </div>
      
      <p class="text-small">⏰ Bu link 1 saat sonra geçersiz olacaktır.</p>
      
      <div class="warning-box">
        <p><strong>⚠️ Güvenlik Uyarısı:</strong></p>
        <p>Eğer bu talebi siz yapmadıysanız, bu emaili yok sayabilirsiniz. Şifreniz değiştirilmeyecektir.</p>
      </div>
      
      <p><strong>Güvenlik önerileri:</strong></p>
      <ul>
        <li>Güçlü bir şifre oluşturun (min. 8 karakter)</li>
        <li>Büyük ve küçük harfler, sayılar kullanın</li>
        <li>Özel karakterler ekleyin</li>
        <li>Diğer hesaplarınızla aynı şifreyi kullanmayın</li>
      </ul>
    `;

    return {
      subject: '🔐 Şifre sıfırlama talebi - Contravo',
      html: this.baseTemplate('Şifre Sıfırlama', content),
      text: `Şifrenizi sıfırlamak için: ${data.passwordResetUrl}`
    };
  }

  static welcome(data: EmailTemplateData): EmailTemplate {
    const content = `
      <h2>🎉 Contravo'ya Hoş Geldiniz!</h2>
      
      <p>Merhaba <strong>${data.userName}</strong>,</p>
      
      <p>Contravo ailesine katıldığınız için çok mutluyuz! Sözleşme yönetimi artık çok daha kolay ve güvenli olacak.</p>
      
      <div class="success-box">
        <p><strong>✅ Hesabınız başarıyla oluşturuldu</strong></p>
        <p>Artık tüm özelliklerimizi kullanabilirsiniz!</p>
      </div>
      
      <div class="text-center">
        <a href="${data.loginUrl}" class="button">Contravo'ya Giriş Yap</a>
      </div>
      
      <p><strong>Başlamak için önerilerimiz:</strong></p>
      <ul>
        <li>🏢 Şirket profilinizi tamamlayın</li>
        <li>👥 Ekip üyelerinizi davet edin</li>
        <li>📄 İlk sözleşme şablonunuzu oluşturun</li>
        <li>🔔 Bildirim tercihlerinizi ayarlayın</li>
        <li>📊 Dashboard'unuzu kişiselleştirin</li>
      </ul>
      
      <hr class="divider">
      
      <p><strong>Yardıma mı ihtiyacınız var?</strong></p>
      <p>Herhangi bir sorunuz olduğunda bize ulaşabilirsiniz:</p>
      <ul>
        <li>📧 Email: destek@contravo.com</li>
        <li>💬 Canlı destek: Platform içinden</li>
        <li>📚 Yardım merkezi: help.contravo.com</li>
      </ul>
    `;

    return {
      subject: '🎉 Contravo\'ya hoş geldiniz!',
      html: this.baseTemplate('Hoş Geldiniz!', content),
      text: `Contravo'ya hoş geldiniz ${data.userName}! Giriş yapmak için: ${data.loginUrl}`
    };
  }

  static systemMaintenance(data: EmailTemplateData): EmailTemplate {
    const content = `
      <h2>🔧 Sistem Bakım Bildirimi</h2>
      
      <p>Merhaba <strong>${data.userName}</strong>,</p>
      
      <p>Contravo platformunda planlı bakım çalışması gerçekleştireceğiz.</p>
      
      <div class="warning-box">
        <p><strong>📅 Bakım Tarihi:</strong> ${data.maintenanceDate}</p>
        <p><strong>⏰ Süre:</strong> ${data.maintenanceDuration} saat</p>
        <p><strong>🔧 Bakım Türü:</strong> ${data.maintenanceType}</p>
      </div>
      
      <p><strong>Bakım sırasında:</strong></p>
      <ul>
        <li>Platform geçici olarak erişilemez olacak</li>
        <li>Verileriniz güvende olacak</li>
        <li>Bakım sonrası tüm özellikler normale dönecek</li>
        <li>Performans iyileştirmeleri yapılacak</li>
      </ul>
      
      <p><strong>Önerilenler:</strong></p>
      <ul>
        <li>Önemli işlemlerinizi bakım öncesi tamamlayın</li>
        <li>Devam eden süreçlerinizi kaydedin</li>
        <li>Bakım sonrası sistemi kontrol edin</li>
      </ul>
      
      <p>Anlayışınız için teşekkür ederiz. Herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz.</p>
    `;

    return {
      subject: '🔧 Sistem bakım bildirimi - Contravo',
      html: this.baseTemplate('Sistem Bakım Bildirimi', content),
      text: `Sistem bakım bildirimi: ${data.maintenanceDate} tarihinde ${data.maintenanceDuration} saat sürecek bakım yapılacak.`
    };
  }

  static custom(
    subject: string,
    title: string,
    content: string,
    data: Partial<EmailTemplateData> = {}
  ): EmailTemplate {
    return {
      subject,
      html: this.baseTemplate(title, content),
      text: content.replace(/<[^>]*>/g, '') // HTML etiketlerini kaldır
    };
  }
} 