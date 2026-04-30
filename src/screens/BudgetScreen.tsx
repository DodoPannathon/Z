import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import type { Transaction, Category } from '../db';

interface BudgetScreenProps {
  transactions: Transaction[];
  categories: Category[];
  budgetcutperiod?: 'monthly' | 'weekly' | 'daily';
  onSummaryClick?: () => void;
}

export default function BudgetScreen({
  transactions = [],
  categories = [],
  budgetcutperiod = 'monthly',
  onSummaryClick,
}: BudgetScreenProps) {
  const [filterType, setFilterType] = useState<'all' | 'warning' | 'exceeded'>('all');

  // คำนวณการใช้จ่ายตามหมวดและเดือนปัจจุบัน
  // const getFilteredSpent = (categoryId: string) => {
  //   const now = new Date();
  //   return transactions
  //     .filter((t) => {
  //       const txDate = new Date(t.date);
  //       return (
  //         t.type === 'expense' &&
  //         t.category === categoryId &&
  //         txDate.getFullYear() === now.getFullYear() &&
  //         txDate.getMonth() === now.getMonth()
  //       );
  //     })
  //     .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  // };
    // Filter categories with budget
  const categoriesWithBudget = useMemo(() => {
    return categories.filter((c) => c.monthlyLimit);
  }, [categories]);

  const categoriesWithspent = useMemo(() => {
    const categoriesWithspent: Record<string, {spent:number}> = {};

    const date_now = new Date()
    const date_first_week = new Date(date_now);
    const day = date_first_week.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date_first_week.setDate(date_first_week.getDate() + diff);
    const date_end_week = new Date(date_first_week)
    date_end_week.setDate(date_end_week.getDate() + 6)

    categoriesWithBudget.forEach((c) => {
      const Spent = transactions.filter((t) => {
        const date_tx = new Date(t.date)

        if (budgetcutperiod === 'monthly') {
          return (
            t.type === 'expense' &&
            t.category === c.id &&
            date_tx.getFullYear() === date_now.getFullYear() &&
            date_tx.getMonth() === date_now.getMonth()
          )
        } else if (budgetcutperiod === 'weekly') {
          return (
            t.type === 'expense' &&
            t.category === c.id &&
            date_tx >= date_first_week && date_tx <= date_end_week
          )
        } else if (budgetcutperiod === 'daily') {
          return (
            t.type === 'expense' &&
            t.category === c.id &&
            date_tx.getFullYear() === date_now.getFullYear() &&
            date_tx.getMonth() === date_now.getMonth() &&
            date_tx.getDate() === date_now.getDate()
          )
        } else return false;
      }).reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)

      categoriesWithspent[c.id] = {spent: Spent}
    })

    return categoriesWithspent;
  }, [transactions, categoriesWithBudget])

  // คำนวณสรุปรวม
  const budgetSummary = useMemo(() => {

    const totalLimit = categoriesWithBudget.reduce(
      (sum, c) => sum + (c.monthlyLimit || 0),
    0);

    const totalSpent = categoriesWithBudget.reduce((sum, c) => {
      return sum + categoriesWithspent[c.id].spent;
    }, 0);

    const warningCount = categoriesWithBudget.filter((c) => {
      const spent = categoriesWithspent[c.id].spent;
      const percentage = (spent / (c.monthlyLimit || 1)) * 100;
      return percentage >= 80 && percentage < 100;
    }).length;

    const exceededCount = categoriesWithBudget.filter((c) => {
      const spent = categoriesWithspent[c.id].spent;
      const percentage = (spent / (c.monthlyLimit || 1)) * 100;
      return percentage >= 100;
    }).length;

    const health =
      exceededCount > 0 ? 'danger' : warningCount > 0 ? 'warning' : 'healthy';

    return {
      totalLimit,
      totalSpent,
      percentage: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
      remaining: totalLimit - totalSpent,
      warningCount,
      exceededCount,
      health,
    };
  }, [categoriesWithBudget, categoriesWithspent]);

  // Get Budget Status
  const getBudgetStatus = (category: Category) => {
    const spent = categoriesWithspent[category.id].spent;
    const limit = category.monthlyLimit || 1;
    const percentage = (spent / limit) * 100;

    if (percentage >= 100) {
      return { status: 'exceeded', color: '#EF4444', label: 'เกินงบ', emoji: '⛔' };
    }
    if (percentage >= 80) {
      return { status: 'warning', color: '#F59E0B', label: 'เกือบเต็ม', emoji: '⚠️' };
    }
    return { status: 'normal', color: '#10B981', label: 'ปกติ', emoji: '✅' };
  };

  // Filter budgets based on filter type
  const filteredBudgets = useMemo(() => {
    return categoriesWithBudget.filter((c) => {
      const percentage = ((categoriesWithspent[c.id].spent) / (c.monthlyLimit || 1)) * 100;

      if (filterType === 'all') return true;
      if (filterType === 'warning') return percentage >= 80 && percentage < 100;
      if (filterType === 'exceeded') return percentage >= 100;
      return true;
    });
  }, [categoriesWithBudget, filterType, categoriesWithspent]);

  const formatCurrency = (num: number) => {
    return `฿${num.toLocaleString('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <ScrollView style={[styles.container, {marginBottom: 40}]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>จัดการงบประมาณ</Text>
        <Text style={styles.headerSubtitle}>ติดตามการใช้จ่ายแต่ละหมวด</Text>
      </View>

      {/* Health Status Card */}
      <View
        style={[
          styles.healthCard,
          budgetSummary.health === 'danger'
            ? styles.healthCardDanger
            : budgetSummary.health === 'warning'
            ? styles.healthCardWarning
            : styles.healthCardHealthy,
        ]}
      >
        <View style={styles.healthHeader}>
          <Text style={styles.healthEmoji}>
            {budgetSummary.health === 'danger'
              ? '🚨'
              : budgetSummary.health === 'warning'
              ? '⚠️'
              : '💚'}
          </Text>
          <View>
            <Text style={styles.healthStatus}>
              {budgetSummary.health === 'danger'
                ? 'เกินงบประมาณแล้ว!'
                : budgetSummary.health === 'warning'
                ? 'ใกล้เกินงบประมาณแล้ว'
                : 'สถานะปกติ'}
            </Text>
            <Text style={styles.healthSubtitle}>
              {budgetSummary.exceededCount > 0
                ? `${budgetSummary.exceededCount} หมวดเกินงบ`
                : budgetSummary.warningCount > 0
                ? `${budgetSummary.warningCount} หมวดเกือบเต็ม`
                : 'ใช้จ่ายสมเหมาะ'}
            </Text>
          </View>
        </View>

        <View style={styles.healthProgress}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(budgetSummary.percentage, 100)}%`,
                  backgroundColor:
                    budgetSummary.health === 'danger'
                      ? '#EF4444'
                      : budgetSummary.health === 'warning'
                      ? '#F59E0B'
                      : '#10B981',
                },
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {budgetSummary.percentage.toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* Budget Summary Cards */}
      <View style={styles.summaryCardsRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>งบประมาณรวม</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(budgetSummary.totalLimit)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>ใช้ไปแล้ว</Text>
          <Text style={[styles.summaryAmount, { color: '#EF4444' }]}>
            {formatCurrency(budgetSummary.totalSpent)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>เหลือ</Text>
          <Text
            style={[
              styles.summaryAmount,
              { color: budgetSummary.remaining >= 0 ? '#10B981' : '#EF4444' },
            ]}
          >
            {formatCurrency(budgetSummary.remaining)}
          </Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={[styles.filterBtn, filterType === 'all' && styles.filterBtnActive]}
          onPress={() => setFilterType('all')}
        >
          <Text
            style={[
              styles.filterBtnText,
              filterType === 'all' && styles.filterBtnTextActive,
            ]}
          >
            ทั้งหมด ({categoriesWithBudget.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filterType === 'warning' && styles.filterBtnActive]}
          onPress={() => setFilterType('warning')}
        >
          <Text
            style={[
              styles.filterBtnText,
              filterType === 'warning' && styles.filterBtnTextActive,
            ]}
          >
            ⚠️ ({budgetSummary.warningCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filterType === 'exceeded' && styles.filterBtnActive]}
          onPress={() => setFilterType('exceeded')}
        >
          <Text
            style={[
              styles.filterBtnText,
              filterType === 'exceeded' && styles.filterBtnTextActive,
            ]}
          >
            ⛔ ({budgetSummary.exceededCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Budget List */}
      <View style={styles.budgetListSection}>
        <Text style={styles.budgetListTitle}>รายละเอียดงบประมาณ</Text>

        {filteredBudgets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>
              {filterType === 'all' ? '📭' : '✨'}
            </Text>
            <Text style={styles.emptyStateText}>
              {filterType === 'all'
                ? 'ยังไม่มีงบประมาณ'
                : 'ไม่มีในหมวดนี้'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {filterType === 'all'
                ? 'ไปจัดการหมวดหมู่เพื่อตั้งงบประมาณ'
                : 'ตัวกรองแสดงผลว่างเปล่า'}
            </Text>
          </View>
        ) : (
          filteredBudgets.map((budget) => {
            const spent = categoriesWithspent[budget.id].spent;
            const percentage = (spent / (budget.monthlyLimit || 1)) * 100;
            const status = getBudgetStatus(budget);

            return (
              <View key={budget.id} style={styles.budgetItemContainer}>
                <View style={styles.budgetItem}>
                  {/* Left: Icon & Info */}
                  <View style={styles.budgetLeft}>
                    <View
                      style={[
                        styles.budgetIcon,
                        { backgroundColor: budget.color + '20' },
                      ]}
                    >
                      <Text style={styles.budgetIconText}>
                        {budget.icon || '📌'}
                      </Text>
                    </View>
                    <View style={styles.budgetInfo}>
                      <Text style={styles.budgetCategory}>{budget.name}</Text>
                      <Text style={styles.budgetLimit}>
                        {formatCurrency(budget.monthlyLimit || 0)}
                      </Text>
                    </View>
                  </View>

                  {/* Right: Status */}
                  <View style={styles.budgetRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: status.color + '20',
                          borderColor: status.color,
                        },
                      ]}
                    >
                      <Text style={styles.statusBadgeEmoji}>{status.emoji}</Text>
                      <Text
                        style={[styles.statusBadgeText, { color: status.color }]}
                      >
                        {status.label}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar2}>
                      <View
                        style={[
                          styles.progressFill2,
                          {
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: status.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.percentageText}>
                      {percentage.toFixed(0)}%
                    </Text>
                  </View>

                  {/* Spent Info */}
                  <View style={styles.spentInfo}>
                    <Text style={styles.spentLabel}>ใช้ไปแล้ว</Text>
                    <Text style={[styles.spentAmount, { color: status.color }]}>
                      {formatCurrency(spent)} / {formatCurrency(budget.monthlyLimit || 0)}
                    </Text>
                    <Text style={styles.remainingAmount}>
                      เหลือ:{' '}
                      {formatCurrency(Math.max(0, (budget.monthlyLimit || 0) - spent))}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Summary Button */}
      <View style={styles.summaryButtonSection}>
        <TouchableOpacity
          style={styles.summaryButton}
          onPress={onSummaryClick}
        >
          <Text style={styles.summaryButtonText}>⬇️ ดูสรุปการเงิน</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'NotoSansThai',
  },

  // Health Card
  healthCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  healthCardHealthy: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  healthCardWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  healthCardDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  healthEmoji: {
    fontSize: 28,
  },
  healthStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
    marginBottom: 2,
  },
  healthSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'NotoSansThai',
  },
  healthProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
    minWidth: 35,
    textAlign: 'right',
  },

  // Summary Cards
  summaryCardsRow: {
    marginHorizontal: 16,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'NotoSansThai',
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    fontFamily: 'NotoSansThai-Bold',
  },

  // Filter Section
  filterSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterBtnText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'NotoSansThai',
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: 'white',
    fontFamily: 'NotoSansThai-Bold',
  },

  // Budget List
  budgetListSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  budgetListTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
    marginBottom: 16,
  },

  // Budget Item
  budgetItemContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  budgetIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetIconText: {
    fontSize: 22,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
    marginBottom: 2,
  },
  budgetLimit: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'NotoSansThai',
  },
  budgetRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeEmoji: {
    fontSize: 14,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'NotoSansThai-Bold',
  },

  // Progress Section
  progressSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar2: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill2: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: 'NotoSansThai-Bold',
    minWidth: 30,
    textAlign: 'right',
  },
  spentInfo: {
    gap: 4,
  },
  spentLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'NotoSansThai',
  },
  spentAmount: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'NotoSansThai-Bold',
  },
  remainingAmount: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'NotoSansThai',
  },

  // Empty State
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'NotoSansThai',
    textAlign: 'center',
  },

  // Summary Button Section
  summaryButtonSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  summaryButton: {
    paddingVertical: 14,
    backgroundColor: '#10B981',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  summaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'NotoSansThai-Bold',
  },
});
