// Merkezi Koşul Değerlendirme Motoru
// Bu fonksiyon, verilen koşulların tamamının contractData'ya göre sağlanıp sağlanmadığını kontrol eder.

export type Operator = 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS';

export interface Condition {
  field: string; // contractData içindeki alan adı
  operator: Operator;
  value: any;
}

export type Contract = Record<string, any>;

export async function evaluateConditions(
  conditions: Condition[],
  contractData: Contract
): Promise<boolean> {
  for (const condition of conditions) {
    const contractValue = contractData[condition.field];
    switch (condition.operator) {
      case 'EQUALS':
        if (contractValue != condition.value) return false;
        break;
      case 'NOT_EQUALS':
        if (contractValue == condition.value) return false;
        break;
      case 'GREATER_THAN':
        if (Number(contractValue) <= Number(condition.value)) return false;
        break;
      case 'LESS_THAN':
        if (Number(contractValue) >= Number(condition.value)) return false;
        break;
      case 'CONTAINS':
        if (
          typeof contractValue === 'string' &&
          !contractValue.includes(condition.value)
        ) return false;
        if (
          Array.isArray(contractValue) &&
          !contractValue.includes(condition.value)
        ) return false;
        break;
      default:
        // Bilinmeyen operatör varsa false döndür
        return false;
    }
  }
  return true;
} 