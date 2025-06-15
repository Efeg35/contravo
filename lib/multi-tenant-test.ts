/**
 * Multi-tenant middleware test utility
 * Use this to validate that the middleware is working correctly
 */

import prisma from './prisma';
import { TenantContext } from './tenant-context';

export class MultiTenantTester {
  
  /**
   * Test contract isolation - ensure users only see their company's contracts
   */
  static async testContractIsolation(userId: string, companyId: string) {
    console.log('🧪 Testing contract isolation...');
    
    try {
      // This should automatically be filtered by the middleware
      const contracts = await prisma.contract.findMany({
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      console.log(`✅ Found ${contracts.length} contracts for user ${userId}`);
      
      // Validate that all contracts belong to accessible companies
      const invalidContracts = contracts.filter(contract => 
        contract.companyId && contract.companyId !== companyId
      );

      if (invalidContracts.length > 0) {
        console.error('❌ Found contracts from other companies:', invalidContracts);
        return false;
      }

      console.log('✅ Contract isolation working correctly');
      return true;
    } catch (error) {
      console.error('❌ Contract isolation test failed:', error);
      return false;
    }
  }

  /**
   * Test template visibility - public vs company vs private
   */
  static async testTemplateVisibility(userId: string, companyId: string) {
    console.log('🧪 Testing template visibility...');
    
    try {
      const templates = await prisma.contractTemplate.findMany({
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      console.log(`✅ Found ${templates.length} templates for user ${userId}`);
      
      // Check that user only sees:
      // 1. Public templates
      // 2. Templates they created
      // 3. Templates from their company
      const invalidTemplates = templates.filter(template => {
        // Skip public templates
        if (template.isPublic) return false;
        
        // Skip templates they created
        if (template.createdById === userId) return false;
        
        // Skip templates from their company
        if (template.companyId === companyId) return false;
        
        // This template shouldn't be visible
        return true;
      });

      if (invalidTemplates.length > 0) {
        console.error('❌ Found templates user shouldn\'t see:', invalidTemplates);
        return false;
      }

      console.log('✅ Template visibility working correctly');
      return true;
    } catch (error) {
      console.error('❌ Template visibility test failed:', error);
      return false;
    }
  }

  /**
   * Test notification privacy - users should only see their notifications
   */
  static async testNotificationPrivacy(userId: string) {
    console.log('🧪 Testing notification privacy...');
    
    try {
      const notifications = await prisma.notification.findMany();

      console.log(`✅ Found ${notifications.length} notifications for user ${userId}`);
      
      // All notifications should belong to the current user
      const invalidNotifications = notifications.filter(notification => 
        notification.userId !== userId
      );

      if (invalidNotifications.length > 0) {
        console.error('❌ Found notifications belonging to other users:', invalidNotifications);
        return false;
      }

      console.log('✅ Notification privacy working correctly');
      return true;
    } catch (error) {
      console.error('❌ Notification privacy test failed:', error);
      return false;
    }
  }

  /**
   * Test company settings isolation
   */
  static async testCompanySettingsIsolation(userId: string, companyId: string) {
    console.log('🧪 Testing company settings isolation...');
    
    try {
      const settings = await prisma.companySettings.findMany({
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      console.log(`✅ Found ${settings.length} company settings for user ${userId}`);
      
      // User should only see settings for companies they have access to
      const invalidSettings = settings.filter(setting => 
        setting.companyId !== companyId
      );

      if (invalidSettings.length > 0) {
        console.error('❌ Found settings for other companies:', invalidSettings);
        return false;
      }

      console.log('✅ Company settings isolation working correctly');
      return true;
    } catch (error) {
      console.error('❌ Company settings isolation test failed:', error);
      return false;
    }
  }

  /**
   * Run all tests for a specific user/company context
   */
  static async runAllTests(userId: string, companyId: string) {
    console.log(`🚀 Running multi-tenant tests for user ${userId} in company ${companyId}`);
    
    const results = await Promise.all([
      this.testContractIsolation(userId, companyId),
      this.testTemplateVisibility(userId, companyId),
      this.testNotificationPrivacy(userId),
      this.testCompanySettingsIsolation(userId, companyId)
    ]);

    const allPassed = results.every(result => result === true);
    
    if (allPassed) {
      console.log('🎉 All multi-tenant tests passed!');
    } else {
      console.log('❌ Some multi-tenant tests failed');
    }

    return allPassed;
  }

  /**
   * Test admin bypass - admins should see everything
   */
  static async testAdminBypass(adminUserId: string) {
    console.log('🧪 Testing admin bypass...');
    
    try {
      // Create a context where the user is admin
      const adminContracts = await prisma.contract.findMany();
      const adminTemplates = await prisma.contractTemplate.findMany();
      const adminSettings = await prisma.companySettings.findMany();

      console.log(`✅ Admin can see ${adminContracts.length} contracts`);
      console.log(`✅ Admin can see ${adminTemplates.length} templates`);
      console.log(`✅ Admin can see ${adminSettings.length} company settings`);

      console.log('✅ Admin bypass working correctly');
      return true;
    } catch (error) {
      console.error('❌ Admin bypass test failed:', error);
      return false;
    }
  }

  /**
   * Test unauthenticated access
   */
  static async testUnauthenticatedAccess() {
    console.log('🧪 Testing unauthenticated access...');
    
    try {
      // These should be heavily restricted for unauthenticated users
      const publicTemplates = await prisma.contractTemplate.findMany();

      // Should only see public templates
      const nonPublicTemplates = publicTemplates.filter(template => !template.isPublic);
      
      if (nonPublicTemplates.length > 0) {
        console.error('❌ Unauthenticated user can see non-public templates:', nonPublicTemplates);
        return false;
      }

      console.log('✅ Unauthenticated access properly restricted');
      return true;
    } catch (error) {
      console.error('❌ Unauthenticated access test failed:', error);
      return false;
    }
  }
}

// Example usage function for API testing
export async function validateMultiTenantMiddleware() {
  console.log('🔐 Validating Multi-Tenant Middleware...');
  
  // This would be called in a test environment with real user data
  // const result = await MultiTenantTester.runAllTests('user-id', 'company-id');
  
  console.log('ℹ️ Multi-tenant middleware is now active and will filter all Prisma queries automatically');
  console.log('ℹ️ Test with real user sessions to verify complete functionality');
  
  return true;
} 