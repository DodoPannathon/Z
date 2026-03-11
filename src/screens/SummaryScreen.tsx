import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';

import type { Transaction, Category } from '../db';

interface SummaryScreenProps {
  transactions: Transaction[];
  categories: Category[];
  period?: 'week' | 'month' | 'year';
  onPeriodChange?: (period: 'week' | 'month' | 'year') => void;
}

export default function SummaryScreen({
  transactions,
  categories,
  period = 'month',
  onPeriodChange,
}: SummaryScreenProps) {

  const filteredtransactions = useMemo(() => {
    const date_now = new Date();
    const date_glogle_now = new Date(date_now.getFullYear(), date_now.getMonth(), date_now.getDate());

    return transactions.filter(t => {
      const date_tx = new Date(t.date);

      if (period === 'week') {
        const date_week_tx = new Date(date_tx.getFullYear(), date_tx.getMonth(), date_tx.getDate())
        const seven_day_ago = new Date(date_glogle_now)
        seven_day_ago.setDate(seven_day_ago.getDate() - 7)
        return seven_day_ago <= date_week_tx && date_week_tx <= date_glogle_now
      } else if (period === 'month') {
        return date_now.getFullYear() === date_tx.getFullYear() && date_now.getMonth() === date_tx.getMonth();
      } else if (period === 'year') {
        return date_now.getFullYear() === date_tx.getFullYear()
      }
      return true
    })
  }, [transactions, period])
  
  // คำนวณข้อมูลทั่วไป
  const stats = useMemo(() => {
    const totalIncome = filteredtransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const totalExpense = filteredtransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const net = totalIncome - totalExpense;
    
    return {
      income: totalIncome,
      expense: totalExpense,
      net,
      transactionCount: filteredtransactions.length,
    };
  }, [filteredtransactions]);

  // วิเคราะห์รายจ่ายตามหมวดหมู่
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, { amount: number; category: Category | undefined }> = {};
    
    filteredtransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (!breakdown[t.category]) {
          const cat = categories.find(c => c.id === t.category);
          breakdown[t.category] = { amount: 0, category: cat };
        }
        breakdown[t.category].amount += parseFloat(t.amount.toString());
      });
    
    return Object.entries(breakdown)
      .map(([id, data]) => ({
        id,
        ...data,
        percentage: stats.expense > 0 ? (data.amount / stats.expense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredtransactions, categories, stats.expense]);

  // ข้อมูลตามวัน
  const dailyData = useMemo(() => {
    const dailyMap: Record<string, { income: number; expense: number }> = {};
    
    filteredtransactions.forEach(t => {
      const dateKey = new Date(t.date).toISOString();
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { income: 0, expense: 0 };
      }
      const amount = parseFloat(t.amount.toString());
      if (t.type === 'income') {
        dailyMap[dateKey].income += amount;
      } else {
        dailyMap[dateKey].expense += amount;
      }
    });
    
    return Object.entries(dailyMap)
      .map(([date, data]) => ({
        date,
        ...data,
        net: data.income - data.expense,
      }))
      .slice(-7)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredtransactions]);

  // สถิติเพิ่มเติม
  const additionalStats = useMemo(() => {
    const avgDailyExpense = stats.expense / Math.max(1, filteredtransactions.length);
    const maxTransaction = filteredtransactions.reduce((max, t) => {
      const amount = parseFloat(t.amount.toString());
      return amount > parseFloat(max.amount.toString()) ? t : max;
    }, filteredtransactions[0]);
    
    return {
      avgDailyExpense,
      maxTransaction,
      savingsRate: stats.income > 0 ? (stats.net / stats.income) * 100 : 0,
    };
  }, [filteredtransactions, stats]);

  const formatCurrency = (num: number) => {
    return `฿${num.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>สรุปการเงิน</Text>
        <Text style={styles.headerSubtitle}>
          {period === 'week' && 'สัปดาห์นี้'}
          {period === 'month' && 'เดือนนี้'}
          {period === 'year' && 'ปีนี้'}
        </Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['week', 'month', 'year'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => onPeriodChange?.(p)}
          >
            <Text
              style={[
                styles.periodBtnText,
                period === p && styles.periodBtnTextActive,
              ]}
            >
              {p === 'week' && 'สัปดาห์'}
              {p === 'month' && 'เดือน'}
              {p === 'year' && 'ปี'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Summary Cards */}
      <View style={styles.summaryCards}>
        {/* Income Card */}
        <View style={[styles.card, styles.incomeCard]}>
          <Text style={styles.cardLabel}>รายรับ</Text>
          <Text style={styles.cardAmount}>{formatCurrency(stats.income)}</Text>
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconEmoji}>📈</Text>
          </View>
        </View>

        {/* Expense Card */}
        <View style={[styles.card, styles.expenseCard]}>
          <Text style={styles.cardLabel}>รายจ่าย</Text>
          <Text style={styles.cardAmount}>{formatCurrency(stats.expense)}</Text>
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconEmoji}>📉</Text>
          </View>
        </View>

        {/* Net Card */}
        <View style={[styles.card, styles.netCard]}>
          <Text style={styles.cardLabel}>คงเหลือ</Text>
          <Text style={[styles.cardAmount, { color: stats.net >= 0 ? '#10B981' : '#EF4444' }]}>
            {formatCurrency(stats.net)}
          </Text>
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconEmoji}>{stats.net >= 0 ? '✨' : '⚠️'}</Text>
          </View>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>สถิติสำคัญ</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>อัตราการออม</Text>
            <Text style={[styles.metricValue, { color: additionalStats.savingsRate >= 0 ? '#10B981' : '#EF4444' }]}>
              {additionalStats.savingsRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>จำนวนธุรกรรม</Text>
            <Text style={styles.metricValue}>{stats.transactionCount}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>ค่าเฉลี่ยต่อวัน</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(additionalStats.avgDailyExpense)}
            </Text>
          </View>
        </View>
      </View>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>รายจ่ายตามหมวดหมู่</Text>
          {categoryBreakdown.map((cat, index) => (
            <View key={cat.id} style={styles.categoryRow}>
              <View style={styles.categoryLeft}>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: cat.category?.color || '#D1D5DB' },
                  ]}
                />
                <Text style={styles.categoryName}>{cat.category?.name || 'อื่น ๆ'}</Text>
              </View>
              <View style={styles.categoryRight}>
                <Text style={styles.categoryAmount}>{formatCurrency(cat.amount)}</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.category?.color || '#D1D5DB',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Daily Trend */}
      {dailyData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>แนวโน้ม 7 วันล่าสุด</Text>
          <View style={styles.trendContainer}>
            {dailyData.map((day, index) => {
              const maxAmount = Math.max(
                ...dailyData.map(d => Math.max(d.income, d.expense))
              );
              console.log(day.date);
              console.log(new Date(day.date))
              
              return (
                <View key={index} style={styles.trendItem}>
                  <View style={styles.trendBars}>
                    {day.income > 0 && (
                      <View
                        style={[
                          styles.trendBar,
                          {
                            height: `${(day.income / maxAmount) * 100}%`,
                            backgroundColor: '#10B981',
                          },
                        ]}
                      />
                    )}
                    {day.expense > 0 && (
                      <View
                        style={[
                          styles.trendBar,
                          {
                            height: `${(day.expense / maxAmount) * 100}%`,
                            backgroundColor: '#EF4444',
                          },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={styles.trendDate}>
                    {new Date(day.date).toLocaleDateString('th-TH', {
                      weekday: 'short',
                    })}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Top Transaction */}
      {additionalStats.maxTransaction && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ธุรกรรมที่มากที่สุด</Text>
          <View style={styles.topTransactionCard}>
            <View style={styles.topTxLeft}>
              <View
                style={[
                  styles.topTxIcon,
                  {
                    backgroundColor:
                      additionalStats.maxTransaction.type === 'income'
                        ? '#ECFDF5'
                        : '#FEE2E2',
                  },
                ]}
              >
                <Text style={styles.topTxIconEmoji}>
                  {additionalStats.maxTransaction.type === 'income' ? '📥' : '📤'}
                </Text>
              </View>
              <View>
                <Text style={styles.topTxTitle}>
                  {additionalStats.maxTransaction.title}
                </Text>
                <Text style={styles.topTxDate}>
                  {new Date(additionalStats.maxTransaction.date).toLocaleDateString(
                    'th-TH'
                  )}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.topTxAmount,
                {
                  color:
                    additionalStats.maxTransaction.type === 'income'
                      ? '#10B981'
                      : '#EF4444',
                },
              ]}
            >
              {additionalStats.maxTransaction.type === 'income' ? '+' : '-'}
              {formatCurrency(
                parseFloat(additionalStats.maxTransaction.amount.toString())
              )}
            </Text>
          </View>
        </View>
      )}

      {/* Empty State */}
      {filteredtransactions.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>📊</Text>
          <Text style={styles.emptyStateTitle}>ยังไม่มีข้อมูล</Text>
          <Text style={styles.emptyStateSubtitle}>
            เริ่มเพิ่มธุรกรรมเพื่อดูสรุปการเงินของคุณ
          </Text>
        </View>
      )}

      {/* Bottom Spacing */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'NotoSansThai',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    backgroundColor: '#F3F4F6',
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#10B981',
  },
  periodBtnText: {
    fontSize: 16,
    fontFamily: 'NotoSansThai',
    color: '#6B7280',
  },
  periodBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: 'NotoSansThai-Bold',
  },
  summaryCards: {
    gap: 12,
    marginBottom: 32,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  incomeCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  expenseCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  netCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#E0F2FE',
  },
  cardLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'NotoSansThai',
    marginBottom: 8,
  },
  cardAmount: {
    fontSize: 24,
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
  },
  cardIcon: {
    position: 'absolute',
    top: 12,
    right: 16,
  },
  cardIconEmoji: {
    fontSize: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansThai-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'NotoSansThai',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
  },
  categoryRow: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'NotoSansThai',
  },
  categoryRight: {
    alignItems: 'flex-end',
    width: '40%',
  },
  categoryAmount: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 200,
    alignItems: 'flex-end',
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  trendBars: {
    width: '100%',
    height: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  trendBar: {
    flex: 1,
    borderRadius: 4,
    minHeight: 2,
  },
  trendDate: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'NotoSansThai',
  },
  topTransactionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topTxLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topTxIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTxIconEmoji: {
    fontSize: 24,
  },
  topTxTitle: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'NotoSansThai-SemiBold',
  },
  topTxDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'NotoSansThai',
    marginTop: 4,
  },
  topTxAmount: {
    fontSize: 16,
    fontFamily: 'NotoSansThai-Bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateEmoji: {
    fontSize: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'NotoSansThai',
    textAlign: 'center',
  },
});
