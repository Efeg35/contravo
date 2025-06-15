// Quick test to verify multi-tenant system
import { setGlobalTenantContext, getGlobalTenantContext } from './tenant-context';

export async function testMultiTenant() {
  console.log('🧪 Testing Multi-Tenant System...');
  
  // Test 1: Context setting
  setGlobalTenantContext({
    userId: 'test-user-123',
    companyId: 'test-company-456',
    isAdmin: false
  });
  
  const context = getGlobalTenantContext();
  console.log('✅ Context set/get test:', context);
  
  // Test 2: Clear context
  setGlobalTenantContext(null);
  const clearedContext = getGlobalTenantContext();
  console.log('✅ Context clear test:', clearedContext);
  
  console.log('🎉 Multi-tenant system tests completed!');
  
  return {
    contextTest: !!context?.userId,
    clearTest: !clearedContext,
    companyIdPresent: !!context?.companyId
  };
} 