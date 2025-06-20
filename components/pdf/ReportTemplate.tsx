import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';

// Basit stil tanımları
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 3,
  },
  tableContainer: {
    marginTop: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingVertical: 5,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    paddingRight: 5,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 10,
    paddingRight: 5,
  },
  emptyState: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 12,
  },
});

export interface ReportData {
  id: string;
  title: string;
  status: string;
  company?: {
    name: string;
  };
  createdAt: string;
  value?: number;
  expirationDate?: string;
}

export interface ReportTemplateProps {
  title: string;
  data: ReportData[];
  selectedFields?: string[];
  filters?: {
    dateRange?: string;
    status?: string;
    company?: string;
  };
  generatedAt?: string;
  userInfo?: {
    name: string;
    email: string;
    company: string;
  };
}

export const ReportTemplate: React.FC<ReportTemplateProps> = ({
  title,
  data,
  selectedFields = [],
  filters,
  generatedAt,
  userInfo,
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('tr-TR');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return amount.toLocaleString('tr-TR') + ' TL';
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      DRAFT: 'Taslak',
      ACTIVE: 'Aktif',
      EXPIRED: 'Suresi Dolmus',
      CANCELLED: 'Iptal Edilmis',
      PENDING: 'Beklemede',
      APPROVED: 'Onaylandi',
      REJECTED: 'Reddedildi',
    };
    return statusMap[status] || status;
  };

  // Alan adlarını Türkçe'ye çevir
  const getFieldLabel = (field: string) => {
    const fieldMap: { [key: string]: string } = {
      title: 'Başlık',
      status: 'Durum',
      createdAt: 'Oluşturulma Tarihi',
      expirationDate: 'Son Tarih',
      value: 'Değer',
      company: 'Şirket',
      description: 'Açıklama',
      type: 'Tür',
    };
    return fieldMap[field] || field;
  };

  // Alan değerini formatla
  const getFieldValue = (item: ReportData, field: string) => {
    switch (field) {
      case 'title':
        return item.title || 'Başlık Yok';
      case 'status':
        return getStatusText(item.status || 'UNKNOWN');
      case 'createdAt':
        return item.createdAt ? formatDate(item.createdAt) : 'Tarih Yok';
      case 'expirationDate':
        return item.expirationDate ? formatDate(item.expirationDate) : '-';
      case 'value':
        return item.value ? formatCurrency(item.value) : '0 TL';
      case 'company':
        return item.company?.name || '-';
      default:
        return '-';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Contravo - Sozlesme Yonetim Sistemi</Text>
          <Text style={styles.subtitle}>
            Olusturulma Tarihi: {generatedAt || formatDate(new Date().toISOString())}
          </Text>
          {userInfo && (
            <Text style={styles.subtitle}>
              Olusturan: {userInfo.name} ({userInfo.email})
            </Text>
          )}
        </View>

        {/* Filters Info */}
        {filters && (
          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 11, marginBottom: 5 }}>Filtreler:</Text>
            {filters.dateRange && (
              <Text style={{ fontSize: 9 }}>• Tarih Araligi: {filters.dateRange}</Text>
            )}
            {filters.status && (
              <Text style={{ fontSize: 9 }}>• Durum: {getStatusText(filters.status)}</Text>
            )}
            {filters.company && (
              <Text style={{ fontSize: 9 }}>• Sirket: {filters.company}</Text>
            )}
          </View>
        )}

        {/* Seçilen Alanlar */}
        {selectedFields.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 10, marginBottom: 3 }}>Seçilen Alanlar:</Text>
            <Text style={{ fontSize: 8 }}>{selectedFields.map(getFieldLabel).join(', ')}</Text>
          </View>
        )}

        {/* Table */}
        {data && data.length > 0 ? (
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              {selectedFields.length > 0 ? (
                selectedFields.map((field, index) => (
                  <Text key={`header-${index}`} style={styles.tableHeaderCell}>
                    {getFieldLabel(field)}
                  </Text>
                ))
              ) : (
                <>
                  <Text style={styles.tableHeaderCell}>Başlık</Text>
                  <Text style={styles.tableHeaderCell}>Durum</Text>
                  <Text style={styles.tableHeaderCell}>Tarih</Text>
                  <Text style={styles.tableHeaderCell}>Değer</Text>
                </>
              )}
            </View>

            {/* Table Rows */}
            {data.map((item, index) => (
              <View key={`row-${index}`} style={styles.tableRow}>
                {selectedFields.length > 0 ? (
                  selectedFields.map((field, fieldIndex) => (
                    <Text key={`cell-${index}-${fieldIndex}`} style={styles.tableCell}>
                      {getFieldValue(item, field)}
                    </Text>
                  ))
                ) : (
                  <>
                    <Text style={styles.tableCell}>{item.title || 'Başlık Yok'}</Text>
                    <Text style={styles.tableCell}>{getStatusText(item.status || 'UNKNOWN')}</Text>
                    <Text style={styles.tableCell}>{item.createdAt ? formatDate(item.createdAt) : 'Tarih Yok'}</Text>
                    <Text style={styles.tableCell}>{item.value ? formatCurrency(item.value) : '0 TL'}</Text>
                  </>
                )}
              </View>
            ))}

            {/* Summary */}
            <View style={{ marginTop: 15, padding: 8, backgroundColor: '#f9f9f9' }}>
              <Text style={{ fontSize: 10 }}>Toplam: {data.length} kayıt</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text>Gösterilecek veri bulunamadı.</Text>
            <Text style={{ fontSize: 8, marginTop: 5 }}>
              Seçilen alanlar: {selectedFields.length ? selectedFields.join(', ') : 'Yok'}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={{ position: 'absolute', bottom: 30, left: 30, right: 30 }}>
          <Text style={{ fontSize: 8, textAlign: 'center' }}>
            Bu rapor Contravo sistemi tarafindan otomatik olarak olusturulmustur.
          </Text>
        </View>
      </Page>
    </Document>
  );
}; 