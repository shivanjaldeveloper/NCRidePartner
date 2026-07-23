import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import SosIcon from '../../assets/icons/SosIcon';
import ChatIcon from '../../assets/icons/ChatIcon';
import CarIcon from '../../assets/icons/CarIcon';
import CashIcon from '../../assets/icons/CashIcon';
import UserIcon from '../../assets/icons/UserIcon';
import SettingsIcon from '../../assets/icons/SettingsIcon';
import ChevronRightIcon from '../../assets/icons/ChevronRightIcon';
import { PARTNER_SUPPORT_ITEMS, SupportItem } from './mockSupportData';
import { RootStackParamList } from '../../navigation/types';
import { TabParamList } from '../../navigation/tabTypes';

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'SupportTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const ISSUE_ICONS: Record<
  SupportItem['icon'],
  React.FC<{ size: number; color: string; strokeWidth: number }>
> = {
  car: CarIcon,
  cash: CashIcon,
  user: UserIcon,
  settings: SettingsIcon,
};

const SupportScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();
  const openSos = () => navigation.navigate('SOS');
  const openChat = () => console.log('TODO: open live chat');

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('support.title')}</Text>
        </View>

        <View style={styles.body}>
          <Card pad={16} style={styles.sosCard}>
            <View style={styles.sosRow}>
              <View style={styles.sosIconWrap}>
                <SosIcon size={24} color="#FFFFFF" strokeWidth={2.2} />
              </View>
              <View style={styles.sosTextWrap}>
                <Text style={styles.sosTitle}>{t('support.emergencySos')}</Text>
                <Text style={styles.sosSub}>
                  {t('support.emergencySosSub')}
                </Text>
              </View>
              <TouchableOpacity style={styles.sosButton} onPress={openSos}>
                <Text style={styles.sosButtonLabel}>{t('support.open')}</Text>
              </TouchableOpacity>
            </View>
          </Card>

          <TouchableOpacity onPress={openChat} activeOpacity={0.8}>
            <Card pad={14} style={styles.chatCard}>
              <View style={styles.chatRow}>
                <View style={styles.chatIconWrap}>
                  <ChatIcon size={20} color={Colors.blue} strokeWidth={1.8} />
                </View>
                <View style={styles.chatTextWrap}>
                  <Text style={styles.chatTitle}>
                    {t('support.chatWithSupport')}
                  </Text>
                  <Text style={styles.chatSub}>{t('support.chatSub')}</Text>
                </View>
                <ChevronRightIcon
                  size={18}
                  color={Colors.mute2}
                  strokeWidth={2}
                />
              </View>
            </Card>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>{t('support.reportIssue')}</Text>
          <Card pad={4}>
            {PARTNER_SUPPORT_ITEMS.map((item, i) => {
              const IconComponent = ISSUE_ICONS[item.icon];
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={[
                    styles.issueRow,
                    i < PARTNER_SUPPORT_ITEMS.length - 1 &&
                      styles.issueRowDivider,
                  ]}
                >
                  <View style={styles.issueIconWrap}>
                    <IconComponent
                      size={18}
                      color={Colors.ink}
                      strokeWidth={1.8}
                    />
                  </View>
                  <View style={styles.issueTextWrap}>
                    <Text style={styles.issueTitle}>{t(item.titleKey)}</Text>
                    <Text style={styles.issueSub}>{t(item.subKey)}</Text>
                  </View>
                  <ChevronRightIcon
                    size={16}
                    color={Colors.mute2}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              );
            })}
          </Card>

          <View style={styles.helplineBox}>
            <Text style={styles.helplineLabel}>{t('support.helpline')}</Text>
            <Text style={styles.helplineNumber}>1800 200 ALO-P</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SupportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: vscale(30),
  },
  header: {
    paddingTop: vscale(45),
    paddingHorizontal: hscale(18),
  },
  title: {
    fontSize: fscale(28),
    fontWeight: '700',
    letterSpacing: -0.8,
    color: Colors.ink,
  },
  body: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(14),
  },
  sosCard: {
    backgroundColor: Colors.red,
    borderColor: 'transparent',
  },
  sosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
  },
  sosIconWrap: {
    width: hscale(48),
    height: hscale(48),
    borderRadius: hscale(24),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTextWrap: {
    flex: 1,
  },
  sosTitle: {
    fontSize: fscale(16),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sosSub: {
    fontSize: fscale(12),
    color: 'rgba(255,255,255,0.85)',
    marginTop: vscale(2),
  },
  sosButton: {
    paddingVertical: vscale(8),
    paddingHorizontal: hscale(14),
    borderRadius: hscale(12),
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  sosButtonLabel: {
    color: Colors.red,
    fontSize: fscale(13),
    fontWeight: '700',
  },
  chatCard: {
    marginTop: vscale(12),
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
  },
  chatIconWrap: {
    width: hscale(44),
    height: hscale(44),
    borderRadius: hscale(13),
    backgroundColor: 'rgba(46,125,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTextWrap: {
    flex: 1,
  },
  chatTitle: {
    fontSize: fscale(14),
    fontWeight: '700',
    color: Colors.ink,
  },
  chatSub: {
    fontSize: fscale(11.5),
    color: Colors.mute,
  },
  sectionLabel: {
    marginTop: vscale(14),
    marginBottom: vscale(8),
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    paddingVertical: vscale(13),
    paddingHorizontal: hscale(14),
  },
  issueRowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.line2,
  },
  issueIconWrap: {
    width: hscale(40),
    height: hscale(40),
    borderRadius: hscale(12),
    backgroundColor: 'rgba(15,17,21,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  issueTextWrap: {
    flex: 1,
  },
  issueTitle: {
    fontSize: fscale(13.5),
    fontWeight: '600',
    color: Colors.ink,
  },
  issueSub: {
    fontSize: fscale(11.5),
    color: Colors.mute,
  },
  helplineBox: {
    marginTop: vscale(14),
    padding: hscale(14),
    backgroundColor: 'rgba(15,17,21,0.04)',
    borderRadius: hscale(14),
    alignItems: 'center',
  },
  helplineLabel: {
    fontSize: fscale(12),
    color: Colors.mute,
  },
  helplineNumber: {
    fontSize: fscale(18),
    fontWeight: '800',
    color: Colors.ink,
    marginTop: vscale(2),
  },
});
