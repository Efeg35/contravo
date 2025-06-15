import bcrypt from 'bcryptjs';
import prisma from './prisma';
// Password policy configuration
export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minSpecialChars: number;
  preventCommonPasswords: boolean;
  preventPersonalInfo: boolean;
  historyLimit: number; // How many previous passwords to check
  expirationDays?: number; // Password expiration (optional)
  maxAttempts: number; // Max failed attempts before lockout
  lockoutDuration: number; // Lockout duration in minutes
}

// Default password policy for Turkish context
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minSpecialChars: 1,
  preventCommonPasswords: true,
  preventPersonalInfo: true,
  historyLimit: 5,
  expirationDays: 90,
  maxAttempts: 5,
  lockoutDuration: 15,
};

// Common Turkish passwords to prevent
const COMMON_TURKISH_PASSWORDS = [
  '123456', '123456789', 'qwerty', 'password', 'admin', 'user',
  'ankara', 'istanbul', 'izmir', 'türkiye', 'turkey', 'turkiye',
  'merhabadunya', 'sifre', 'parola', 'kullanici', 'yonetici',
  'qwerty123', 'password123', '12345678', '1234567890',
  'abcdef', 'abcd1234', '123abc', 'abc123',
  'galatasaray', 'fenerbahce', 'besiktas', 'trabzonspor',
  'mustafa', 'mehmet', 'ahmet', 'fatma', 'ayse', 'zeynep',
  'bursa', 'antalya', 'eskisehir', 'denizli', 'kocaeli',
];

// Special characters for validation
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?~`';

export interface PasswordStrength {
  score: number; // 0-4
  level: 'Çok Zayıf' | 'Zayıf' | 'Orta' | 'Güçlü' | 'Çok Güçlü';
  feedback: string[];
  estimatedCrackTime: string;
  passed: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  strength: PasswordStrength;
}

export class PasswordManager {
  private policy: PasswordPolicy;

  constructor(customPolicy?: Partial<PasswordPolicy>) {
    this.policy = { ...DEFAULT_PASSWORD_POLICY, ...customPolicy };
  }

  /**
   * Validate password against policy
   */
  async validatePassword(
    password: string, 
    userInfo?: { email?: string; name?: string; id?: string }
  ): Promise<PasswordValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Length validation
    if (password.length < this.policy.minLength) {
      errors.push(`Şifre en az ${this.policy.minLength} karakter olmalıdır`);
    }
    if (password.length > this.policy.maxLength) {
      errors.push(`Şifre en fazla ${this.policy.maxLength} karakter olmalıdır`);
    }

    // Character type validation
    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Şifre en az bir büyük harf içermelidir (A-Z)');
    }
    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Şifre en az bir küçük harf içermelidir (a-z)');
    }
    if (this.policy.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Şifre en az bir rakam içermelidir (0-9)');
    }
    
    if (this.policy.requireSpecialChars) {
      const specialCharCount = (password.match(new RegExp(`[${SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g')) || []).length;
      if (specialCharCount < this.policy.minSpecialChars) {
        errors.push(`Şifre en az ${this.policy.minSpecialChars} özel karakter içermelidir (!@#$%^&* vb.)`);
      }
    }

    // Common password check
    if (this.policy.preventCommonPasswords) {
      const lowerPassword = password.toLowerCase();
      if (COMMON_TURKISH_PASSWORDS.includes(lowerPassword)) {
        errors.push('Bu şifre çok yaygın kullanılmaktadır. Daha güvenli bir şifre seçiniz');
      }
    }

    // Personal information check
    if (this.policy.preventPersonalInfo && userInfo) {
      if (userInfo.email) {
        const emailLocal = userInfo.email.split('@')[0].toLowerCase();
        if (password.toLowerCase().includes(emailLocal)) {
          errors.push('Şifre email adresinizi içeremez');
        }
      }
      if (userInfo.name) {
        const nameParts = userInfo.name.toLowerCase().split(' ');
        for (const part of nameParts) {
          if (part.length > 2 && password.toLowerCase().includes(part)) {
            errors.push('Şifre isminizi içeremez');
          }
        }
      }
    }

    // Check password history if user ID provided
    if (userInfo?.id && this.policy.historyLimit > 0) {
      const recentPasswords = await this.getPasswordHistory(userInfo.id);
      for (const oldHash of recentPasswords) {
        if (await bcrypt.compare(password, oldHash)) {
          errors.push(`Son ${this.policy.historyLimit} şifrenizden birini kullanamazsınız`);
          break;
        }
      }
    }

    // Calculate strength
    const strength = this.calculatePasswordStrength(password);

    // Add warnings based on strength
    if (strength.score < 3) {
      warnings.push('Şifreniz güvenlik açısından güçlendirilmelidir');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      strength,
    };
  }

  /**
   * Calculate password strength with detailed feedback
   */
  calculatePasswordStrength(password: string): PasswordStrength {
    let score = 0;
    const feedback: string[] = [];
    
    // Length scoring
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Character variety scoring
    if (/[a-z]/.test(password)) score += 0.5;
    if (/[A-Z]/.test(password)) score += 0.5;
    if (/[0-9]/.test(password)) score += 0.5;
    if (new RegExp(`[${SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) score += 0.5;
    
    // Pattern analysis
    if (!/(.)\1{2,}/.test(password)) score += 0.5; // No repeated characters
    if (!/012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/.test(password.toLowerCase())) {
      score += 0.5; // No sequential characters
    }
    
    // Common pattern penalties
    if (/^[a-z]+$/i.test(password)) score -= 1; // Only letters
    if (/^\d+$/.test(password)) score -= 1; // Only numbers
    if (password.toLowerCase() === password) score -= 0.5; // No uppercase
    if (password.toUpperCase() === password) score -= 0.5; // No lowercase

    // Normalize score to 0-4 range
    score = Math.max(0, Math.min(4, Math.round(score)));

    // Generate feedback
    if (password.length < 8) feedback.push('En az 8 karakter kullanın');
    if (!/[a-z]/.test(password)) feedback.push('Küçük harf ekleyin');
    if (!/[A-Z]/.test(password)) feedback.push('Büyük harf ekleyin');
    if (!/[0-9]/.test(password)) feedback.push('Rakam ekleyin');
    if (!new RegExp(`[${SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) {
      feedback.push('Özel karakter ekleyin (!@#$% vb.)');
    }
    if (password.length < 12) feedback.push('Daha uzun şifre daha güvenlidir');

    // Determine level and crack time
    let level: PasswordStrength['level'];
    let estimatedCrackTime: string;

    switch (score) {
      case 0:
      case 1:
        level = 'Çok Zayıf';
        estimatedCrackTime = 'Anında';
        break;
      case 2:
        level = 'Zayıf';
        estimatedCrackTime = 'Dakikalar';
        break;
      case 3:
        level = 'Orta';
        estimatedCrackTime = 'Günler';
        break;
      case 4:
        level = 'Güçlü';
        estimatedCrackTime = 'Yüzyıllar';
        break;
      default:
        level = 'Çok Güçlü';
        estimatedCrackTime = 'Milyonlarca yıl';
    }

    return {
      score,
      level,
      feedback: feedback.length > 0 ? feedback : ['Mükemmel şifre!'],
      estimatedCrackTime,
      passed: score >= 3,
    };
  }

  /**
   * Hash password securely
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Get password history for user
   */
  private async getPasswordHistory(userId: string): Promise<string[]> {
    try {
      const history = await prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: this.policy.historyLimit,
        select: { passwordHash: true },
      });
      return history.map(h => h.passwordHash);
    } catch (error) {
      return []; // If password history doesn't exist yet
    }
  }

  /**
   * Save password to history
   */
  async savePasswordHistory(userId: string, passwordHash: string): Promise<void> {
    try {
      await prisma.passwordHistory.create({
        data: {
          userId,
          passwordHash,
        },
      });

      // Clean up old history beyond limit
      const oldEntries = await prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: this.policy.historyLimit,
        select: { id: true },
      });

      if (oldEntries.length > 0) {
        await prisma.passwordHistory.deleteMany({
          where: {
            id: { in: oldEntries.map(e => e.id) },
          },
        });
      }
    } catch (error) {
      console.error('Error saving password history:');
    }
  }

  /**
   * Check if password is expired
   */
  async isPasswordExpired(userId: string): Promise<boolean> {
    if (!this.policy.expirationDays) return false;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordChangedAt: true },
      });

      if (!user?.passwordChangedAt) return false;

      const expirationDate = new Date(user.passwordChangedAt);
      expirationDate.setDate(expirationDate.getDate() + this.policy.expirationDays);

      return new Date() > expirationDate;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check login attempts and handle lockout
   */
  async checkLoginAttempts(identifier: string): Promise<{
    allowed: boolean;
    attemptsLeft: number;
    lockoutEndsAt?: Date;
  }> {
    try {
      const attempts = await prisma.loginAttempt.findUnique({
        where: { identifier },
      });

      if (!attempts) {
        return { allowed: true, attemptsLeft: this.policy.maxAttempts };
      }

      // Check if lockout period has expired
      if (attempts.lockedUntil && new Date() > attempts.lockedUntil) {
        await prisma.loginAttempt.delete({
          where: { identifier },
        });
        return { allowed: true, attemptsLeft: this.policy.maxAttempts };
      }

      // If locked
      if (attempts.lockedUntil) {
        return { 
          allowed: false, 
          attemptsLeft: 0,
          lockoutEndsAt: attempts.lockedUntil 
        };
      }

      // Check attempts
      const attemptsLeft = this.policy.maxAttempts - attempts.failedAttempts;
      return { 
        allowed: attemptsLeft > 0, 
        attemptsLeft,
      };
    } catch (error) {
      return { allowed: true, attemptsLeft: this.policy.maxAttempts };
    }
  }

  /**
   * Record failed login attempt
   */
  async recordFailedAttempt(identifier: string, ip?: string): Promise<void> {
    try {
      const existing = await prisma.loginAttempt.findUnique({
        where: { identifier },
      });

      if (existing) {
        const newFailedAttempts = existing.failedAttempts + 1;
        
        if (newFailedAttempts >= this.policy.maxAttempts) {
          // Lock the account
          await prisma.loginAttempt.update({
            where: { identifier },
            data: {
              failedAttempts: newFailedAttempts,
              lockedUntil: new Date(Date.now() + this.policy.lockoutDuration * 60 * 1000),
              lastAttemptIp: ip,
              updatedAt: new Date(),
            },
          });
        } else {
          await prisma.loginAttempt.update({
            where: { identifier },
            data: {
              failedAttempts: newFailedAttempts,
              lastAttemptIp: ip,
              updatedAt: new Date(),
            },
          });
        }
      } else {
        await prisma.loginAttempt.create({
          data: {
            identifier,
            failedAttempts: 1,
            lastAttemptIp: ip,
          },
        });
      }
    } catch (error) {
      console.error('Error recording failed attempt:');
    }
  }

  /**
   * Clear failed attempts after successful login
   */
  async clearFailedAttempts(identifier: string): Promise<void> {
    try {
      await prisma.loginAttempt.delete({
        where: { identifier },
      });
    } catch (error) {
      // Ignore errors, maybe no attempts recorded
    }
  }

  /**
   * Generate secure password suggestion
   */
  generateSecurePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    let allChars = '';
    
    // Ensure at least one character from each required type
    if (this.policy.requireLowercase) {
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      allChars += lowercase;
    }
    if (this.policy.requireUppercase) {
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      allChars += uppercase;
    }
    if (this.policy.requireNumbers) {
      password += numbers[Math.floor(Math.random() * numbers.length)];
      allChars += numbers;
    }
    if (this.policy.requireSpecialChars) {
      password += special[Math.floor(Math.random() * special.length)];
      allChars += special;
    }
    
    // Fill remaining length
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Get password expiration info
   */
  async getPasswordExpirationInfo(userId: string): Promise<{
    isExpired: boolean;
    daysUntilExpiration?: number;
    lastChanged?: Date;
  }> {
    if (!this.policy.expirationDays) {
      return { isExpired: false };
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordChangedAt: true },
      });

      if (!user?.passwordChangedAt) {
        return { isExpired: false };
      }

      const expirationDate = new Date(user.passwordChangedAt);
      expirationDate.setDate(expirationDate.getDate() + this.policy.expirationDays);
      
      const now = new Date();
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        isExpired: daysUntilExpiration <= 0,
        daysUntilExpiration: Math.max(0, daysUntilExpiration),
        lastChanged: user.passwordChangedAt,
      };
    } catch (error) {
      return { isExpired: false };
    }
  }

  /**
   * Get current policy configuration
   */
  getPolicy(): PasswordPolicy {
    return { ...this.policy };
  }

  /**
   * Update policy configuration
   */
  updatePolicy(newPolicy: Partial<PasswordPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };
  }
}

// Export default instance
export const passwordManager = new PasswordManager();

// Helper function for quick validation
export async function validatePasswordQuick(
  password: string, 
  userInfo?: { email?: string; name?: string; id?: string }
): Promise<PasswordValidationResult> {
  return passwordManager.validatePassword(password, userInfo);
}

// Helper function for password strength check
export function checkPasswordStrength(password: string): PasswordStrength {
  return passwordManager.calculatePasswordStrength(password);
} 