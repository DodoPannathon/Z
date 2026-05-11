import React, {useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
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

  const [showBudgetCutModal, setshowBudgetCutModal] = useState(false);

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

  const Modalradiocard = <T extends string>({
    option,
    title,
    value,
    onrequestclose,
    onchange,
  }: {
    option: { id: T; name: string }[];
    title: string;
    value: T;
    onrequestclose: () => void;
    onchange: (id: T) => void;
  }) => (
    <View style={styles.modalcenterWrapper}>
      <View style={styles.cardmodal}>
        <View style={styles.cardheader}>
          <TouchableOpacity style={styles.closeButton} onPress={onrequestclose}>
            <View style={styles.closeIcon}/>
            <View style={styles.closeButtonArea}/>
          </TouchableOpacity>
          <Text style={[styles.cardtitle, { flex: 1, textAlign: 'center' }]}>{title}</Text>
        </View>
        <View style={[styles.span, { marginBottom: 20, width: '120%' }]}/>
        <View style={styles.cardbody}>
          {option.map((t,i) => (
            <React.Fragment key={t.id}>
              <TouchableOpacity style={styles.cardbodycontainer} onPress={() => onchange?.(t.id)}>
                <View style={[styles.radiobutton, t.id == value ? styles.radiobuttonactive : null]}/>
                <Text style={styles.cardsubtitle}>{t.name}</Text>
              </TouchableOpacity>
              {/* {i !== option.length - 1 && <View style={styles.span}/>} */}
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={{flex: 1}}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
              right={<Text style={styles.chev}>̾›</Text>}
              onPress={undefined}
            />

            <Row
              left={<Text style={styles.title}>สกุลเงิน</Text>}
              right={<Text style={styles.subtitle}>THB (฿) ›</Text>}
            />
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>งบประมาณ & หมวดหมู่</Text>
          <View style={styles.card}>
            <Row left={<Text style={styles.title}>จัดการหมวดหมู่</Text>} right={<Text style={styles.chev}>›</Text>} onPress={onManageCategories} />
            <Row left={<Text style={styles.title}>รอบตัดงบ</Text>} right={<Text style={styles.chev}>›</Text>} onPress={() => setshowBudgetCutModal(true)} />
            <Row left={<Text style={styles.title}>วันเริ่มต้นรอบบิล</Text>} right={<Text style={styles.subtitle}>ทุกวันที่ 1 ›</Text>} />
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>การแสดงผล</Text>
          <View style={styles.card}>
            <Row left={<Text style={styles.title}>ธีม</Text>} right={<Text style={styles.subtitle}>ตามระบบ ›</Text>} />
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

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>ข้อมูล</Text>
          <View style={styles.card}>
            <Row left={<Text style={styles.title}>Export ข้อมูล (CSV)</Text>} right={<Text style={styles.chev}>›</Text>} onPress={onExport} />
            <Row left={<Text style={styles.title}>สำรองข้อมูล</Text>} right={<Text style={styles.chev}>›</Text>} onPress={onBackup} />
            <Row left={<Text style={[styles.title, {color: '#DC2626'}]}>ลบข้อมูลทั้งหมด</Text>} right={<Text style={styles.chev}>›</Text>} onPress={onDeleteAll} />
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <View style={styles.card}>
            <Row left={<Text style={styles.title}>เกี่ยวกับแอป</Text>} right={<Text style={styles.subtitle}>v1.0.0 ›</Text>} />
            <TouchableOpacity style={styles.signOutRow} onPress={onSignOut}>
              <Text style={styles.signOut}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{height: 40}} />
      </ScrollView>
      <Modal animationType='fade' transparent={true} visible={showBudgetCutModal} onRequestClose={() => setshowBudgetCutModal(false)}>
        <Modalradiocard
          option={[
            {id: 'monthly', name: 'รายเดือน'},
            {id: 'weekly', name: 'รายอาทิตย์'},
            {id: 'daily', name: 'รายวัน'},
          ]}
          title='รอบตัดงบ'
          value={period}
          onchange={(newperiod)=>onPeriodChange(newperiod)}
          onrequestclose={()=>setshowBudgetCutModal(false)}
        />
      </Modal>
      {/* <Modal animationType='fade' transparent={true} visible={BudgetCutModal} onRequestClose={() => setBudgetCutModal(false)}>
        <View style={styles.modalcenterWrapper}>
          <View style={styles.cardmodal}>
            <View style={styles.cardheader}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setBudgetCutModal(false)}>
                <View style={styles.closeIcon}/>
                <View style={styles.closeButtonArea}/>
              </TouchableOpacity>
              <Text style={[styles.cardtitle, { flex: 1, textAlign: 'center'}]}>รอบตัดงบประมาณ</Text>
            </View>
            <View style={[styles.span, { marginBottom: 30, width: '120%' }]}/>
            <View style={styles.cardbody}>
              <TouchableOpacity style={styles.cardbodycontainer} onPress={() => onPeriodChange?.('monthly')}> 
                <View style={[styles.radiobutton, 'monthly' == period ? styles.radiobuttonactive : null]}/>
                <Text style={styles.cardsubtitle}>รายเดือน</Text>
              </TouchableOpacity>
              <View style={styles.span}/>
              <TouchableOpacity style={styles.cardbodycontainer} onPress={() => onPeriodChange?.('weekly')}>
                <View style={[styles.radiobutton, 'weekly' == period ? styles.radiobuttonactive : null]}/>
                <Text style={styles.cardsubtitle}>รายอาทิตย์</Text>
              </TouchableOpacity>
              <View style={styles.span}/>
              <TouchableOpacity style={styles.cardbodycontainer} onPress={() => onPeriodChange?.('daily')}>
                <View style={[styles.radiobutton, 'daily' == period ? styles.radiobuttonactive : null]}/>
                <Text style={styles.cardsubtitle}>รายวัน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal> */}
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
  modalcenterWrapper: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardmodal: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 20,
    width: '100%',
    paddingTop: 35,
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  cardtitle: {
    fontSize: 18,
    color: '#3c5b3c',
    fontFamily: 'NotoSansThai-Bold',
  },
  cardsubtitle: {
    fontSize: 16,
    color: '#3c5b3c',
    fontFamily: 'NotoSansThai',
  },
  cardheader: {
    flexDirection: 'row',
    marginVertical: 10,
    // marginBottom: 30,
  },
  closeButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignContent: 'center',
    // left: 5,
    top: '50%',
    transform: [{translateY: '-50%'}],
    zIndex: 1,
    width: '15%',
    height: '100%',
    flexDirection: 'row',
  },
  closeIcon: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    top: '50%',
    transform: [{rotate: '45deg'}, {translateY: '-70%' }],
  },
  closeButtonArea: {
    width: '100%',
    height: '100%',
  },
  span: {
    height: 1,
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#BEBEBE',
    // marginVertical: 10,
  },
  cardbody: {
    width: '100%',
    // borderWidth: 1,
    // borderRadius: 15,
    // borderColor: '#BEBEBE',
    // overflow: 'hidden',
    // padding: 10,
  },
  cardbodycontainer: {
    margin: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 15,
    borderColor: '#BEBEBE',
    padding: 10,
    marginVertical: 5,
  },
  radiobutton: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: '50%',
    borderColor: '#BEBEBE',
    marginRight: 10,
    // top: '50%',
    // transform: [{ translateY: '-50%' }],
  },
  radiobuttonactive: {
    width: 20,
    height: 20,
    borderWidth: 6,
    borderRadius: '50%',
    borderColor: '#BEBEBE',
    marginRight: 10,
  },
});
