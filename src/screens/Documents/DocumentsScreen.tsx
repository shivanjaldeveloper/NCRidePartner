import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import HeaderBack from '../../components/common/HeaderBack';
import CheckIcon from '../../assets/icons/CheckIcon';
import CarIcon from '../../assets/icons/CarIcon';
import UserIcon from '../../assets/icons/UserIcon';
import ShieldIcon from '../../assets/icons/ShieldIcon';
import InvoiceIcon from '../../assets/icons/InvoiceIcon';
import ChevronRightIcon from '../../assets/icons/ChevronRightIcon';
import {
  PARTNER_DOCUMENTS,
  PartnerDocument,
  docStatusKey,
} from './mockDocumentsData';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const DOC_ICONS: Record<
  PartnerDocument['icon'],
  React.FC<{ size: number; color: string; strokeWidth: number }>
> = {
  car: CarIcon,
  user: UserIcon,
  shield: ShieldIcon,
  invoice: InvoiceIcon,
};

const DocumentsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();
  const allVerified = PARTNER_DOCUMENTS.every(d => d.status === 'Verified');

  return (
    <View style={styles.container}>
      <HeaderBack
        title="Document centre"
        sub="Partner KYC & vehicle docs"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusBanner}>
          <View style={styles.statusIconWrap}>
            <CheckIcon size={18} color="#FFFFFF" strokeWidth={2.4} />
          </View>
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusTitle}>
              {allVerified
                ? t('documents.allVerified')
                : t('documents.somePending')}
            </Text>
            <Text style={styles.statusSub}>
              {t('documents.eligibleToDrive')}
            </Text>
          </View>
        </View>

        <Card pad={4}>
          {PARTNER_DOCUMENTS.map((doc, i) => {
            const IconComponent = DOC_ICONS[doc.icon];
            return (
              <TouchableOpacity
                key={doc.id}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('DocumentDetail', { docId: doc.id })
                }
                style={[
                  styles.docRow,
                  i < PARTNER_DOCUMENTS.length - 1 && styles.docRowDivider,
                ]}
              >
                <View style={styles.docIconWrap}>
                  <IconComponent
                    size={20}
                    color={Colors.green}
                    strokeWidth={1.8}
                  />
                </View>
                <View style={styles.docTextWrap}>
                  <Text style={styles.docTitle}>{t(doc.titleKey)}</Text>
                  <Text style={styles.docSub}>{doc.sub}</Text>
                </View>
                <View style={styles.docRight}>
                  <View
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor:
                          doc.status === 'Verified'
                            ? '#E9F8E4'
                            : 'rgba(242,160,61,0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        {
                          color:
                            doc.status === 'Verified'
                              ? Colors.green
                              : Colors.amber,
                        },
                      ]}
                    >
                      {doc.status}
                    </Text>
                  </View>
                  <ChevronRightIcon
                    size={16}
                    color={Colors.mute2}
                    strokeWidth={2}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </Card>

        <View style={styles.privacyNote}>
          <ShieldIcon size={16} color={Colors.blue} strokeWidth={1.8} />
          <Text style={styles.privacyText}>{t('documents.privacyNote')}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default DocumentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(4),
    paddingBottom: vscale(30),
  },
  statusBanner: {
    padding: hscale(14),
    borderRadius: hscale(18),
    backgroundColor: '#E9F8E4',
    borderWidth: 0.5,
    borderColor: 'rgba(31,157,107,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
    marginBottom: vscale(14),
  },
  statusIconWrap: {
    width: hscale(36),
    height: hscale(36),
    borderRadius: hscale(11),
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: Colors.ink,
  },
  statusSub: {
    fontSize: fscale(11.5),
    color: Colors.mute,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    padding: hscale(14),
  },
  docRowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.line2,
  },
  docIconWrap: {
    width: hscale(42),
    height: hscale(42),
    borderRadius: hscale(13),
    backgroundColor: '#E9F8E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTextWrap: {
    flex: 1,
  },
  docTitle: {
    fontSize: fscale(14),
    fontWeight: '700',
    color: Colors.ink,
  },
  docSub: {
    fontSize: fscale(11.5),
    color: Colors.mute,
    marginTop: vscale(1),
  },
  docRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(8),
  },
  statusChip: {
    paddingVertical: vscale(3),
    paddingHorizontal: hscale(8),
    borderRadius: hscale(6),
  },
  statusChipText: {
    fontSize: fscale(10.5),
    fontWeight: '700',
  },
  privacyNote: {
    marginTop: vscale(14),
    padding: hscale(12),
    paddingHorizontal: hscale(14),
    backgroundColor: 'rgba(46,125,255,0.06)',
    borderRadius: hscale(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
  },
  privacyText: {
    flex: 1,
    fontSize: fscale(12),
    color: Colors.ink2,
    lineHeight: fscale(17),
  },
});
