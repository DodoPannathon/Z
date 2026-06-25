import React, {useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';

interface SettingsScreenProps {
  period: 'daily' | 'weekly' | 'monthly';
  onManageCategories: () => void;
  onPeriodChange: (Period: 'monthly' | 'weekly' | 'daily') => void;
  onExport?: () => void;
  onBackup?: () => void;
  onDeleteAll?: () => void;
  onSignOut?: () => void;
}

export default function SettingsScreen({
  period,
  onManageCategories,
  onPeriodChange,
  onExport,
  onBackup,
  onDeleteAll,
  onSignOut,
}: SettingsScreenProps) {
  const [showDecimal, setShowDecimal] = useState(true);
  const [notifyBudget, setNotifyBudget] = useState(true);
  const [remindDaily, setRemindDaily] = useState(false);

  const [showBudgetCutModal, setShowBudgetCutModal] = useState(false);
  const [showBillingCycleModal, setShowBillingCycleModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const [theme, setTheme] = useState<'dark' | 'bright' | 'ondevice'>('bright');
  const [billingDay, setBillingDay] = useState(1);

  const Toggle = ({value, onPress}: {value: boolean; onPress: () => void}) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff]}
    >
      <View
        style={[
          styles.toggleDot,
          value ? styles.toggleDotRight : styles.toggleDotLeft,
        ]}
      />
    </TouchableOpacity>
  );

  const Row = ({left, right, onPress}: {left: React.ReactNode; right?: React.ReactNode; onPress?: () => void}) => (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress} style={styles.row}>
      <View style={styles.rowLeft}>{left}</View>
      {right ? <View style={styles.rowRight}>{right}</View> : null}
    </TouchableOpacity>
  );

  const ModalRadioCard = <T extends string>({
    option,
    title,
    value,
    onrequestclose,
    onchange,
    onSave,
  }: {
    option: { id: T; name: string }[];
    title: string;
    value: T;
    onrequestclose: () => void;
    onchange: (id: T) => void;
    onSave?: () => void;
  }) => (
    <View style={styles.modalcenterWrapper}>
      <View style={styles.cardmodal}>
        <View style={styles.cardheader}>
          <TouchableOpacity style={styles.closeButton} onPress={onrequestclose}>
            <View style={styles.closeIcon}>
              <View style={styles.closeIconInner}/>
            </View>
          </TouchableOpacity>
          <Text style={[styles.cardtitle, { flex: 1, textAlign: 'center', color: 'white' }]}>{title}</Text>
        </View>
        <View style={styles.cardbody}>
          {option.map((t, i) => (
            <React.Fragment key={t.id}>
              <TouchableOpacity style={styles.cardbodycontainer} onPress={() => onchange(t.id)}>
                <View style={[styles.radiobutton, t.id === value && styles.radiobuttonactive]}/>
                <Text style={[styles.cardtitle, { fontFamily: 'NotoSansThai' }]}>{t.name}</Text>
              </TouchableOpacity>
              {i !== option.length - 1 && <View style={styles.span}/>}
            </React.Fragment>
          ))}
        </View>
        {onSave && (
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveButtonText}>บันทึก</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const formatThemeLabel = (t: string) => {
    if (t === 'bright') return 'สว่าง';
    if (t === 'dark') return 'มืด';
    return 'ตามระบบ';
  };

  return (
    <View style={{flex: 1}}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Profile */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>บัญชีผู้ใช้</Text>
          <View style={styles.card}>
            <Row
              left={
                <>
                  <View style={styles.avatar}></View>
                  <View style={{marginLeft: 12}}>
                    <Text style={styles.title}>Pannathon</Text>
                    <Text style={styles.subtitle}>แก้ไขโปรไฟล์</Text>
                  </View>
                </>
              }
              right={<Text style={styles.chev}>›</Text>}
              onPress={undefined}
            />

            <Row
              left={<Text style={styles.title}>สกุลเงิน</Text>}
              right={<Text style={styles.subtitle}>THB (฿) ›</Text>}
            />
          </View>
        </View>

        {/* Budget & Categories */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>งบประมาณ & หมวดหมู่</Text>
          <View style={styles.card}>
            <Row left={<Text style={styles.title}>จัดการหมวดหมู่</Text>} right={<Text style={styles.chev}>›</Text>} onPress={onManageCategories} />
            <Row left={<Text style={styles.title}>รอบตัดงบ</Text>} right={<Text style={styles.chev}>›</Text>} onPress={() => setShowBudgetCutModal(true)} />
            <Row left={<Text style={styles.title}>วันเริ่มต้นรอบบิล</Text>} right={<Text style={styles.subtitle}>วันที่ {billingDay} ›</Text>} onPress={() => setShowBillingCycleModal(true)}/>
          </View>
        </View>

        {/* Display */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>การแสดงผล</Text>
          <View style={styles.card}>
            <Row left={<Text style={styles.title}>ธีม</Text>} right={<Text style={styles.subtitle}>{formatThemeLabel(theme)} ›</Text>} onPress={() => setShowThemeModal(true)}/>
            <Row
              left={
                <View>
                  <Text style={styles.title}>แสดงทศนิยม</Text>
                  <Text style={styles.subtitle}>เช่น ฿100.00</Text>
                </View>
              }
              right={<Toggle value={showDecimal} onPress={() => setShowDecimal(v => !v)} />}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>การแจ้งเตือน</Text>
          <View style={styles.card}>
            <Row
              left={
                <View>
                  <Text style={styles.title}>แจ้งเตือนงบเกิน</Text>
                  <Text style={styles.subtitle}>เมื่อใช้เกิน 80%</Text>
                </View>
              }
              right={<Toggle value={notifyBudget} onPress={() => setNotifyBudget(v => !v)} />}
            />

            <Row
              left={
                <View>
                  <Text style={styles.title}>เตือนบันทึกรายจ่าย</Text>
                  <Text style={styles.subtitle}>ทุกวัน 20:00 น.</Text>
                </View>
              }
              right={<Toggle value={remindDaily} onPress={() => setRemindDaily(v => !v)} />}
            />
          </View>
        </View>

        {/* Data */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>ข้อมูล</Text>
          <View style={styles.card}>
            <Row left={<Text style={styles.title}>Export ข้อมูล (CSV)</Text>} right={<Text style={styles.chev}>›</Text>} onPress={onExport} />
            <Row left={<Text style={styles.title}>สำรองข้อมูล</Text>} right={<Text style={styles.chev}>›</Text>} onPress={onBackup} />
            <Row left={<Text style={[styles.title, {color: '#DC2626'}]}>ลบข้อมูลทั้งหมด</Text>} right={<Text style={styles.chev}>›</Text>} onPress={onDeleteAll} />
          </View>
        </View>

        {/* About */}
        <View style={styles.sectionWrap}>
          <View style={styles.card}>
            <Row left={<Text style={styles.title}>เกี่ຍวกับแอป</Text>} right={<Text style={styles.subtitle}>v1.0.0 ›</Text>} />
            <TouchableOpacity style={styles.signOutRow} onPress={onSignOut}>
              <Text style={styles.signOut}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{height: 40}} />
      </ScrollView>

      {/* Budget Cut Period Modal */}
      <Modal animationType='fade' transparent={true} visible={showBudgetCutModal} onRequestClose={() => setShowBudgetCutModal(false)}>
        <ModalRadioCard
          option={[
            {id: 'monthly', name: 'รายเดือน'},
            {id: 'weekly', name: 'รายอาทิตย์'},
            {id: 'daily', name: 'รายวัน'},
          ]}
          title='รอบตัดงบ'
          value={period}
          onchange={(newperiod) => onPeriodChange(newperiod)}
          onrequestclose={() => setShowBudgetCutModal(false)}
          onSave={() => setShowBudgetCutModal(false)}
        />
      </Modal>

      {/* Billing Cycle Picker Modal */}
      <Modal animationType='fade' transparent={true} visible={showBillingCycleModal} onRequestClose={() => setShowBillingCycleModal(false)}>
        <View style={styles.modalcenterWrapper}>
          <View style={styles.cardmodal}>
            <View style={styles.cardheader}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowBillingCycleModal(false)}>
                <View style={styles.closeIcon}>
                  <View style={styles.closeIconInner}/>
                </View>
              </TouchableOpacity>
              <Text style={[styles.cardtitle, { flex: 1, textAlign: 'center', color: 'white' }]}>วันเริ่มต้นรอบบิล</Text>
            </View>
            <View style={styles.billingCycleBody}>
              <Text style={styles.billingCycleLabel}>เลือกวันตัดงบ</Text>
              <View style={styles.billingCyclePicker}>
                <TouchableOpacity
                  style={styles.cycleButton}
                  onPress={() => setBillingDay(d => Math.max(1, d - 1))}
                >
                  <Text style={styles.cycleButtonText}>−</Text>
                </TouchableOpacity>
                <View style={styles.cycleValueContainer}>
                  <Text style={styles.cycleValue}>{billingDay}</Text>
                  <Text style={styles.cycleValueSub}>วัน</Text>
                </View>
                <TouchableOpacity
                  style={styles.cycleButton}
                  onPress={() => setBillingDay(d => Math.min(31, d + 1))}
                >
                  <Text style={styles.cycleButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={() => setShowBillingCycleModal(false)}>
              <Text style={styles.saveButtonText}>บันทึก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Theme Modal */}
      <Modal animationType='fade' transparent={true} visible={showThemeModal} onRequestClose={() => setShowThemeModal(false)}>
        <ModalRadioCard
          option={[
            {id: 'dark', name: 'มืด'},
            {id: 'bright', name: 'สว่าง'},
            {id: 'ondevice', name: 'ตามระบบ'},
          ]}
          title='ธีม'
          value={theme}
          onchange={(newtheme) => setTheme(newtheme)}
          onrequestclose={() => setShowThemeModal(false)}
          onSave={() => setShowThemeModal(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  sectionWrap: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: 'NotoSansThai',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowRight: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E6F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'NotoSansThai-Bold',
  },
  title: {
    fontSize: 15,
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'NotoSansThai',
  },
  chev: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toggleOn: {
    backgroundColor: '#10B981'
  },
  toggleOff: {
    backgroundColor: '#5F5E5A',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    position: 'absolute',
  },
  toggleDotLeft: {
    left: 3,
  },
  toggleDotRight: {
    right: 3,
  },
  signOutRow: {
    padding: 14,
    alignItems: 'center',
  },
  signOut: {
    color: '#DC2626',
    fontSize: 15,
    fontFamily: 'NotoSansThai-Bold',
  },

  // Modal styles
  modalcenterWrapper: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardmodal: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardtitle: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
  },
  cardsubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'NotoSansThai',
  },
  cardheader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingTop: 24,
    backgroundColor: '#10B981',
  },
  closeButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    left: 12,
    top: 0,
    bottom: 0,
    width: 36,
    height: 36,
  },
  closeIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconInner: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'white',
    transform: [{rotate: '45deg'}, {translateY: 2}],
  },
  span: {
    height: 1,
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardbody: {
    paddingVertical: 8,
  },
  cardbodycontainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    backgroundColor: 'white',
  },
  radiobutton: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: '#D1D5DB',
    marginRight: 12,
  },
  radiobuttonactive: {
    borderWidth: 6,
    borderColor: '#10B981',
  },

  // Save button
  saveButton: {
    margin: 16,
    paddingVertical: 12,
    backgroundColor: '#10B981',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'NotoSansThai-Bold',
  },

  // Billing cycle picker
  billingCycleBody: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  billingCycleLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'NotoSansThai',
    marginBottom: 20,
  },
  billingCyclePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cycleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cycleButtonText: {
    fontSize: 28,
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
    lineHeight: 32,
  },
  cycleValueContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  cycleValue: {
    fontSize: 48,
    color: '#1F2937',
    fontFamily: 'NotoSansThai-Bold',
    lineHeight: 52,
  },
  cycleValueSub: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'NotoSansThai',
  },
});
