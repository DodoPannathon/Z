import { Text, View, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions, TextInput, Modal, KeyboardAvoidingView, Alert, StatusBar, Animated, PanResponder, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import Svg, { Circle, G } from 'react-native-svg';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { initDatabase, getTransactions, addTransaction, updateTransaction, deleteTransaction, Transaction, getCategories, addCategory, updateCategory, deleteCategory, Category, DEFAULT_CATEGORIES } from './src/db';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

const { width, height: screenHeight } = Dimensions.get('window');

SplashScreen.preventAutoHideAsync();

export default function App() {

  const [fontsLoaded] = useFonts({
    'NotoSansThai': require('./assets/fonts/static/NotoSansThai-Medium.ttf'),
    'NotoSansThai-Bold': require('./assets/fonts/static/NotoSansThai-Bold.ttf'),
    'NotoSansThai-SemiBold': require('./assets/fonts/static/NotoSansThai-SemiBold.ttf'),
  });

  const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'daily'>('daily');
  const [activeTab, setActiveTab] = useState('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDateTimePicker, setshowDateTimePicker] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('other');
  const [date, setdate] = useState(new Date());

  // Create PanResponder for Swipeable Modal
  const initialModalHeight = screenHeight * 0.8;
  // Don't allow the modal to expand all the way to the very top — leave a gap
  const modalMaxHeight = screenHeight - (Platform.OS === 'ios' ? 80 : 15);
  const modalHeight = useRef(new Animated.Value(initialModalHeight)).current;
  const dragStartHeight = useRef(initialModalHeight);

  // Category modal swipeable controls (separate from transaction modal)
  const initialCatModalHeight = screenHeight * 0.6;
  const catModalMaxHeight = screenHeight - (Platform.OS === 'ios' ? 80 : 15);
  const catModalHeight = useRef(new Animated.Value(initialCatModalHeight)).current;
  const catDragStartHeight = useRef(initialCatModalHeight);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        console.log('onStartShouldSetPanResponder');
        return true;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        console.log('onMoveShouldSetPanResponder', gestureState.dy);
        // Only respond to vertical movements
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        console.log('onPanResponderGrant - Gesture started');
        // @ts-ignore
        dragStartHeight.current = modalHeight._value;
        console.log('Starting height:', dragStartHeight.current);
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate new height: start height minus drag distance (negative dy = up = increase height)
        const newHeight = dragStartHeight.current - gestureState.dy;
        // Clamp between min and max (don't let it go all the way to the top)
        const clampedHeight = Math.max(screenHeight * 0.3, Math.min(modalMaxHeight, newHeight));
        console.log('Moving - dy:', gestureState.dy, 'newHeight:', clampedHeight);
        modalHeight.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        console.log('Released');
        // @ts-ignore
        const currentHeight = modalHeight._value;
        console.log('Final height:', currentHeight);

        if (currentHeight > screenHeight * 0.9) {
          // Snap to a slightly-reduced max so the modal doesn't cover the status/nav area fully
          Animated.spring(modalHeight, {
            toValue: modalMaxHeight,
            useNativeDriver: false,
            bounciness: 0
          }).start();
        } else if (currentHeight < screenHeight * 0.75) {
          setModalVisible(false);
        } else {
          Animated.spring(modalHeight, {
            toValue: initialModalHeight,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const panResponderCat = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        // @ts-ignore
        catDragStartHeight.current = catModalHeight._value;
      },
      onPanResponderMove: (_, gestureState) => {
        const newHeight = catDragStartHeight.current - gestureState.dy;
        const clampedHeight = Math.max(screenHeight * 0.25, Math.min(catModalMaxHeight, newHeight));
        catModalHeight.setValue(clampedHeight);
      },
      onPanResponderRelease: () => {
        // @ts-ignore
        const currentHeight = catModalHeight._value;
        if (currentHeight > screenHeight * 0.9) {
          Animated.spring(catModalHeight, { toValue: catModalMaxHeight, useNativeDriver: false, bounciness: 0 }).start();
        } else if (currentHeight < screenHeight * 0.59) {
          setCatModalVisible(false);
        } else {
          Animated.spring(catModalHeight, { toValue: initialCatModalHeight, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  useEffect(() => {
    if (modalVisible) {
      modalHeight.setValue(initialModalHeight);
    }
  }, [modalVisible]);

  const [catModalVisible, setCatModalVisible] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('');
  const [catColor, setCatColor] = useState('#F3F4F6');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');

  useEffect(() => {
    if (catModalVisible) {
      catModalHeight.setValue(initialCatModalHeight);
    }
  }, [catModalVisible]);

  useEffect(() => {
    const setup = async () => {
      await initDatabase();
      loadData();
      loadCategories();
    };
    setup();
  }, []);

  // useEffect(() => {
  //   if (fontsLoaded) {
  //     console.log('Fonts loaded:', fontsLoaded);
  //     SplashScreen.hideAsync();
  //   }
  // }, [fontsLoaded]);

  // if (!fontsLoaded) {
  //   return null;
  // }

  // useEffect(() => {
  //   async function loadFonts() {
  //     try {
  //       await Font.loadAsync({
  //         'NotoSansThai': require('./assets/fonts/static/NotoSansThai-Medium.ttf'),
  //         'NotoSansThai-Bold': require('./assets/fonts/static/NotoSansThai-Bold.ttf'),
  //       });
  //       console.log('✅ Font loaded successfully');
  //       setFontsLoaded(true);
        
  //       (Text as any).defaultProps = (Text as any).defaultProps || {};
  //       (Text as any).defaultProps.style = { fontFamily: 'NotoSansThai' };
  //       console.log('✅ Default font set');
  //     } catch (error) {
  //       console.log('❌ Font loading error:', error);
  //     }
  //   }
  //   loadFonts();
  // }, []);

  // if (!fontsLoaded) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <ActivityIndicator size="large" />
  //     </View>
  //   );
  // }

  const loadData = async () => {
    const data = await getTransactions();
    setTransactions(data);
  };

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setAmount('');
    setType('expense');
    setCategory('other');
    setdate(new Date())
    setModalVisible(true);
  };

  const openEditModal = (item: Transaction) => {
    setEditingId(item.id);
    setTitle(item.title);
    setAmount(item.amount.toString());
    setType(item.type);
    setCategory(item.category || 'other');
    setdate(new Date(item.date) || new Date());
    setModalVisible(true);
    console.log(item.date)
    console.log(new Date().toLocaleString('th-TH'))
    console.log(new Date(item.date))
    console.log(new Date())
  };

  const handleSave = async () => {
    if (!title || !amount) return;

    if (editingId) {
      await updateTransaction({
        id: editingId,
        title,
        amount: parseFloat(amount),
        type,
        category,
        date: date.toISOString()
      });
    } else {
      await addTransaction(title, parseFloat(amount), type, category, date.toISOString());
    }

    setModalVisible(false);
    loadData();
  };

  const handleDelete = async () => {
    if (editingId) {
      if (Platform.OS === 'web') {
        if (confirm('ยืนยันการลบรายการนี้?')) {
          await deleteTransaction(editingId);
          setModalVisible(false);
          loadData();
        }
      } else {
        Alert.alert('ยืนยันการลบ', 'คุณต้องการลบรายการนี้ใช่ไหม?', [
          { text: 'ยกเลิก', style: 'cancel' },
          {
            text: 'ลบ',
            style: 'destructive',
            onPress: async () => {
              await deleteTransaction(editingId);
              setModalVisible(false);
              loadData();
            }
          }
        ]);
      }
    }
  };

  // --- Category Management ---
  const openCatModal = (cat?: Category) => {
    if (cat) {
      setEditingCatId(cat.id);
      setCatName(cat.name);
      setCatIcon(cat.icon);
      setCatColor(cat.color);
      setCatType(cat.type);
    } else {
      setEditingCatId(null);
      setCatName('');
      setCatIcon('');
      setCatColor('#F3F4F6');
      setCatType('expense');
    }
    setCatModalVisible(true);
  };

  const handleSaveCategory = async () => {
    if (!catName) return;
    const newCat: Category = {
      id: editingCatId || Date.now().toString(),
      name: catName,
      icon: catIcon,
      color: catColor,
      type: catType as any,      
    };

    if (editingCatId) {
      await updateCategory(newCat);
    } else {
      await addCategory(newCat);
    }
    setCatModalVisible(false);
    loadCategories();
  };

  const handleDeleteCategory = async () => {
    if (editingCatId) {
      await deleteCategory(editingCatId);
      setCatModalVisible(false);
      loadCategories();
    }
  };

  // Calculations
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const renderSimpleSummary = () => (
    <>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>ยอดคงเหลือสุทธิ</Text>
        <Text style={styles.balanceAmount}>฿ {balance.toLocaleString()}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, styles.statBoxIncome]}>
          <Text style={styles.statLabel}>รายรับ</Text>
          <Text style={styles.statValue}>+{totalIncome.toLocaleString()}</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxExpense]}>
          <Text style={styles.statLabel}>รายจ่าย</Text>
          <Text style={styles.statValue}>-{totalExpense.toLocaleString()}</Text>
        </View>
      </View>
    </>
  );

  const renderDailyProgress = () => {
    const dailyBudget = 800;
    const todayExpense = transactions.filter(t => t.type === 'expense' && t.date.startsWith(new Date().toLocaleDateString('th-TH'))).reduce((acc, c) => acc + c.amount, 0);
    const remaining = dailyBudget - todayExpense;
    const progress = (remaining / dailyBudget);
    const size = 180;
    const strokeWidth = 15;
    const center = size / 2;
    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;

    return (
      <View style={styles.dailyContainer}>
        <View style={styles.circleWrapper}>
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${center}, ${center}`}>
              <Circle stroke="rgba(255,255,255,0.2)" cx={center} cy={center} r={radius} strokeWidth={strokeWidth} />
              <Circle
                stroke="white"
                cx={center}
                cy={center}
                r={radius}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
              />
            </G>
          </Svg>
          <View style={styles.circleTextContainer}>
            <Text style={styles.circleLabel}>เหลือใช้ได้</Text>
            <Text style={styles.circleAmount}>฿ {remaining.toLocaleString()}</Text>
          </View>
        </View>
        <Text style={styles.dailyBudgetLabel}>งบรายวัน: ฿ {dailyBudget}</Text>
      </View>
    );
  };

  const getCategoryIcon = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? { icon: cat.icon, color: cat.color, name: cat.name } : { icon: '📝', color: '#F3F4F6', name: 'อื่นๆ' };
  };

  return (
    <SafeAreaProvider>
      <View style={styles.webContainer}>
        <SafeAreaView style={[styles.container, { backgroundColor: '#10B981' }]} edges={[]}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
          <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            {activeTab === 'home' && (
              <View style={{ flex: 1 }}>
                <View style={styles.headerCard}>
                  <View style={styles.headerShadow} />
                  <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>รายรับ-รายจ่าย</Text>
                    <View style={styles.viewSwitcher}>
                      {([
                        { id: 'monthly', label: 'เดือน' },
                        { id: 'weekly', label: 'สัปดาห์' },
                        { id: 'daily', label: 'วัน' },
                      ] as const).map((m) => (
                        <TouchableOpacity
                          key={m.id}
                          style={[styles.switchBtn, viewMode === m.id && styles.switchBtnActive]}
                          onPress={() => setViewMode(m.id)}
                        >
                          <Text style={[styles.switchText, viewMode === m.id && styles.switchTextActive]}>
                            {m.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  {viewMode === 'daily' ? renderDailyProgress() : renderSimpleSummary()}
                </View>

                <View style={styles.listContainer}>
                  <View style={styles.listHeader}>
                    <Text style={styles.listTitle}>รายการล่าสุด</Text>
                    <TouchableOpacity onPress={loadData}>
                      <Text style={styles.viewAllText}>รีเฟรช</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
                    {transactions.length === 0 ? (
                      <Text style={{ textAlign: 'center', marginTop: 20, color: '#9CA3AF', fontFamily: 'NotoSansThai' }}>ยังไม่มีรายการ</Text>
                    ) : transactions.map((item) => {
                      const catInfo = getCategoryIcon(item.category || 'other');
                      const date_type = new Date(item.date);
                      const localdate = date_type.toLocaleString();
                      return (
                        <TouchableOpacity key={item.id} style={styles.transactionItem} onPress={() => openEditModal(item)}>
                          <View style={styles.transactionLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: catInfo.color }]}>
                              <Text style={{ fontSize: 16 }}>{catInfo.icon}</Text>
                            </View>
                            <View>
                              <Text style={styles.transactionTitle}>{item.title}</Text>
                              <Text style={styles.transactionDate}>{localdate}</Text>
                            </View>
                          </View>
                          <Text style={[
                            styles.transactionAmount,
                            { color: item.type === 'income' ? '#16A34A' : '#EF4444' }
                          ]}>
                            {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>
              </View>
            )}

            {activeTab === 'budget' && (
              <View style={styles.listContainer}>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>จัดการหมวดหมู่</Text>
                  <TouchableOpacity onPress={() => openCatModal()}>
                    <Text style={styles.viewAllText}>+ เพิ่ม</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                  {categories.map((c) => (
                    <TouchableOpacity key={c.id} style={styles.transactionItem} onPress={() => openCatModal(c)}>
                      <View style={styles.transactionLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: c.color }]}>
                            <Text style={{ fontSize: 16 }}>{c.icon}</Text>
                        </View>
                        <Text style={styles.transactionTitle}>{c.name}</Text>
                      </View>
                      <Text style={{ color: '#9CA3AF', fontFamily: 'NotoSansThai' }}>{c.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</Text>
                    </TouchableOpacity>
                  ))}
                  <View style={{ height: 100 }} />
                </ScrollView>
              </View>
            )}

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
              {['home', 'summary'].map(t => (
                <TouchableOpacity key={t} style={styles.navItem} onPress={() => setActiveTab(t)}>
                  <View style={[styles.navIcon, activeTab === t && styles.navIconActive]} />
                  <Text style={[styles.navText, activeTab === t && styles.navTextActive]}>
                    {t === 'home' ? 'หน้าหลัก' : 'สรุป'}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.navFabContainer} onPress={openAddModal}>
                <View style={styles.navFab}>
                  <Text style={styles.navFabText}>+</Text>
                </View>
              </TouchableOpacity>

              {['budget', 'settings'].map(t => (
                <TouchableOpacity key={t} style={styles.navItem} onPress={() => setActiveTab(t)}>
                  <View style={[styles.navIcon, activeTab === t && styles.navIconActive]} />
                  <Text style={[styles.navText, activeTab === t && styles.navTextActive]}>
                    {t === 'budget' ? 'หมวดหมู่' : 'ตั้งค่า'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Add/Edit Transaction Modal */}
            <Modal animationType="fade" transparent={true} visible={modalVisible}>
              <View style={styles.modalCenterWrapper}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                  <Animated.View style={[styles.modalContent, { height: modalHeight }]}>

                    {/* Drag Handle */}
                    <View {...panResponder.panHandlers} style={{ width: '100%', height: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                      <View style={{ width: 40, height: 5, backgroundColor: '#9CA3AF', borderRadius: 10 }} />
                    </View>

                    {/* Fixed Top Section */}
                    <View>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{editingId ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</Text>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                          <Text style={styles.cancelText}>X</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                      <View style={styles.typeSelector}>
                        <TouchableOpacity
                          style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]}
                          onPress={() => { setType('income'); setCategory('income'); }}
                        >
                          <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>รายรับ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]}
                          onPress={() => setType('expense')}
                        >
                          <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>รายจ่าย</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.amountContainerOval}>
                        <TextInput
                          style={styles.amountInputOval}
                          placeholder="0"
                          placeholderTextColor="#1F2937"
                          value={amount}
                          onChangeText={setAmount}
                          keyboardType="numeric"
                          autoFocus={!editingId}
                        />
                        <Text style={styles.currencySuffix}>฿</Text>
                      </View>

                      <View style={styles.inputcontainer}>
                        <TextInput
                          style={styles.input}
                          placeholder="ตั้งชื่อ เช่น ค่าอาหาร, ค่ารถ"
                          placeholderTextColor="#c6c6c6"
                          value={title}
                          onChangeText={setTitle}
                        />
                      </View>
                      <View style={styles.inputcontainer}>
                        <TouchableOpacity
                          style={styles.input}
                          onPress={() => setshowDateTimePicker(true)}>
                          <Text style={{fontFamily: 'NotoSansThai'}}>{date.toLocaleDateString('th-TH')}</Text>
                        </TouchableOpacity>
                        {showDateTimePicker && (
                          <DateTimePicker
                            value={date}
                            mode='date'
                            onChange={(_event: DateTimePickerEvent, selectedDate?: Date) => {
                              setshowDateTimePicker(false)
                              if (selectedDate) setdate(selectedDate)
                            }}
                          />
                        )}
                      </View>
                      
                      <View style={{ height: 1,width: '100%', backgroundColor: '#E5E7EB', marginBottom: 16 }}/>

                      <Text style={styles.label}>เลือกหมวดหมู่</Text>
                      {
                        (() => {
                          const filtered = categories.filter(c => type === 'income' ? c.type === 'income' : c.type === 'expense');
                          const compact = filtered.length <= 2;
                          return (
                            <View style={styles.categoryGrid}>
                              {filtered.map(c => (
                                <TouchableOpacity
                                  key={c.id}
                                  style={[styles.catItem, category === c.id && styles.catItemActive, { backgroundColor: c.color }]}
                                  onPress={() => { setCategory(c.id)}}
                                >
                                  <Text style={{ fontSize: 24 }}>{c.icon}</Text>
                                  <Text style={styles.catName}>{c.name}</Text>
                                </TouchableOpacity>
                              ))}
                              {compact && (
                                <View style={[styles.catItem, { backgroundColor: 'transparent'}]}></View>
                              )}
                            </View>
                          );
                        })()
                      }
                    </ScrollView>

                    {/* Fixed Bottom Section */}
                    <View style={{ paddingTop: 10, paddingBottom: 20 }}>
                      <View style={styles.modalActions}>
                        {editingId && (
                          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                            <Text style={styles.deleteText}>ลบ</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                          <Text style={styles.saveText}>บันทึก</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Animated.View>
                </KeyboardAvoidingView>
              </View>
            </Modal>

            {/* Add/Edit Category Modal */}
            <Modal animationType="slide" transparent={true} visible={catModalVisible}>
              <View style={styles.modalCenterWrapper}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                  <Animated.View style={[styles.modalContent, { height: catModalHeight }]}> 
                    
                    <View {...panResponderCat.panHandlers} style={{ width: '100%', height: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                      <View style={{ width: 40, height: 5, backgroundColor: '#9CA3AF', borderRadius: 10 }} />
                    </View>

                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>{editingCatId ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</Text>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => setCatModalVisible(false)}>
                        <Text style={styles.cancelText}>X</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.catItemcontainer}>                    
                      <View
                        style={[styles.catItem,{ backgroundColor: catColor }]}
                      >
                        <Text style={{ fontSize: 24 }}>{catIcon}</Text>
                        <Text style={styles.catName}>{catName}</Text>
                      </View>
                    </View>

                    <View style={styles.inputcontainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="ชื่อหมวดหมู่"
                        placeholderTextColor="#c6c6c6"
                        value={catName}
                        onChangeText={setCatName}
                      />
                    </View>
                    <View style={styles.inputcontainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="ไอคอน (Emoji)"
                        placeholderTextColor="#c6c6c6"
                        value={catIcon}
                        onChangeText={setCatIcon}
                      />
                    </View>

                    <View style={styles.modalActions}>
                      {editingCatId && (
                        <TouchableOpacity onPress={handleDeleteCategory} style={styles.deleteBtn}>
                          <Text style={styles.deleteText}>ลบ</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCategory}>
                        <Text style={styles.saveText}>บันทึก</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </KeyboardAvoidingView>
              </View>
            </Modal>

          </View>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1, backgroundColor: Platform.OS === 'web' ? '#e5e5e5' : '#F9FAFB',
    alignItems: 'center', justifyContent: 'center', fontFamily: 'NotoSansThai'
  },
  container: {
    flex: 1, backgroundColor: '#F9FAFB',
    width: '100%', maxWidth: Platform.OS === 'web' ? 480 : '100%', fontFamily: 'NotoSansThai',
    ...Platform.select({
      android: { paddingTop: 30 },
      web: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, minHeight: '100%', overflow: 'hidden' }
    })
  },
  headerCard: { backgroundColor: '#10B981', paddingBottom: 32, paddingHorizontal: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, minHeight: 280, overflow: 'visible' },
  headerShadow: {
    position: 'absolute', left: 0, right: 0, bottom: 0, top: -100,
    backgroundColor: '#10B981',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 15,
    zIndex: -1
  },
  headerTop: { marginBottom: 24, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontFamily: 'NotoSansThai-SemiBold', marginBottom: 16 },
  viewSwitcher: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 4 },
  switchBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 16 },
  switchBtnActive: { paddingRight: 15, backgroundColor: 'white' },
  switchText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: 'NotoSansThai' },
  switchTextActive: { color: '#059669', fontFamily: 'NotoSansThai-Bold' },
  balanceContainer: { alignItems: 'center', marginTop: 10 },
  balanceLabel: { color: '#ECFDF5', fontSize: 14, marginBottom: 4 },
  balanceAmount: { color: 'white', fontSize: 48, fontFamily: 'NotoSansThai-Bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 },
  statBox: { backgroundColor: 'rgba(5, 150, 105, 0.5)', padding: 12, borderRadius: 16, flex: 1, alignItems: 'center' },
  statBoxIncome: { marginRight: 8 },
  statBoxExpense: { marginLeft: 8 },
  statLabel: { color: '#D1FAE5', fontSize: 12, marginBottom: 4 },
  statValue: { color: 'white', fontFamily: 'NotoSansThai-Bold', fontSize: 18 },
  dailyContainer: { alignItems: 'center', justifyContent: 'center' },
  circleWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  circleTextContainer: { position: 'absolute', alignItems: 'center' },
  circleLabel: { color: '#D1FAE5', fontSize: 14, marginBottom: 4, fontFamily: 'NotoSansThai' },
  circleAmount: { width: 82, color: 'white', fontSize: 32, fontFamily: 'NotoSansThai-Bold' },
  dailyBudgetLabel: { width: 115, color: '#ECFDF5', marginTop: 16, fontSize: 14, opacity: 0.9, fontFamily: 'NotoSansThai' },
  listContainer: { flex: 1, paddingHorizontal: 20, marginTop: 24 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listTitle: { fontSize: 18, fontFamily: 'NotoSansThai-Bold', color: '#1F2937' },
  viewAllText: { color: '#059669', fontSize: 14, fontFamily: 'NotoSansThai' },
  scrollView: { flex: 1 },
  scrollViewContent: { paddingBottom: 100 },
  transactionItem: { backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { padding: 8, borderRadius: 12, marginRight: 12, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  transactionTitle: { color: '#1F2937', fontFamily: 'NotoSansThai-Bold', fontSize: 16 },
  transactionDate: { color: '#9CA3AF', fontSize: 12, fontFamily: 'NotoSansThai' },
  transactionAmount: { fontWeight: 'bold', fontSize: 18 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', elevation: 20 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  navIcon: { width: 24, height: 24, backgroundColor: '#E5E7EB', borderRadius: 6, marginBottom: 4 },
  navIconActive: { backgroundColor: '#10B981' },
  navText: { fontSize: 10, color: '#9CA3AF', fontFamily: 'NotoSansThai' },
  navTextActive: { color: '#10B981', fontFamily: 'NotoSansThai-Bold' },
  navFabContainer: { marginTop: -40 },
  navFab: { width: 56, height: 56, backgroundColor: '#10B981', borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#059669', shadowOpacity: 0.3, elevation: 8 },
  navFabText: { color: 'white', fontSize: 32, marginTop: -4 },

  // New Modal Styles
  modalCenterWrapper: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, alignItems: 'center' },
  modalOverlay: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'NotoSansThai-Bold' },
  cancelBtn: { width: 35, height: 35, backgroundColor: '#eaeaeaff', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#1f242a', fontSize: 18, fontFamily: 'NotoSansThai' },
  typeSelector: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#f3f4f6', padding: 4, borderRadius: 14 },
  typeBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#F3F4F6' },
  typeBtnIncome: { backgroundColor: '#DCFCE7' },
  typeBtnExpense: { backgroundColor: '#FEE2E2' },
  typeText: { fontSize: 16, color: '#6B7280', fontFamily: 'NotoSansThai' },
  typeTextActive: { fontFamily: 'NotoSansThai-Bold', color: 'black' },

  // Refined Amount Input
  amountContainerOval: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f0f2f5', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 18,
    marginBottom: 20, borderWidth: 2, borderColor: '#dde1e7', gap: 8
  },
  amountInputOval: {
    fontSize: 32, fontFamily: 'NotoSansThai-Bold', color: '#1F2937', textAlign: 'right', minWidth: 100, borderWidth: 0, outline: 'none'
  }as any,
  currencySuffix: { fontSize: 24, fontFamily: 'NotoSansThai-Bold', color: '#6B7280', marginLeft: 8 },

  label: { fontSize: 14, color: '#4B5563', marginBottom: 8, fontFamily: 'NotoSansThai-SemiBold' },

  inputcontainer: {height: 52, backgroundColor: '#F9FAFB', borderWidth: 1, borderRadius: 12, borderColor: '#E5E7EB', marginBottom: 18, borderStyle: 'solid' },
  input: { color: '#1F2937', backgroundColor: '#F9FAFB', fontSize: 15, width: '100%', height: '100%', borderRadius: 12, padding: 13, fontFamily: 'NotoSansThai' },  

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24, marginTop: 10 },
  catItem: { width: '30%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'transparent', backgroundColor: '#F3F4F6' },
  catItemActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  catName: { fontSize: 12, color: '#4B5563', marginTop: 4, fontFamily: 'NotoSansThai' },

  catItemcontainer: { width: '100%', alignItems: 'center', padding: 5 },

  modalActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 },
  deleteBtn: { flex: 1, padding: 16, alignItems: 'center', marginRight: 12, backgroundColor: '#EF4444', borderRadius: 12 },
  deleteText: { color: '#F3F4F6', fontFamily: 'NotoSansThai-Bold', fontSize: 16 },
  saveBtn: { flex: 1, backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveText: { color: 'white', fontFamily: 'NotoSansThai-Bold', fontSize: 16 },
});
