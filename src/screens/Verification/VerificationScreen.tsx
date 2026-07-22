import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import TopSafeStrap from '../../components/layout/TopSafeStrap';
import PrimaryButton from '../../components/common/PrimaryButton';
import Card from '../../components/common/Card';
import CheckIcon from '../../assets/icons/CheckIcon';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Verification'>;

// Static in place of window.PARTNER_DOCUMENTS from the design source —
// swap this out once the real document-status API response shape is known.
// titleKey/subKey point at translation strings; id/status stay as data.
const DOCUMENTS = [
  {
    id: 'dl',
    titleKey: 'verification.documents.dl.title',
    subKey: 'verification.documents.dl.sub',
  },
  {
    id: 'rc',
    titleKey: 'verification.documents.rc.title',
    subKey: 'verification.documents.rc.sub',
  },
  {
    id: 'aadhaar',
    titleKey: 'verification.documents.aadhaar.title',
    subKey: 'verification.documents.aadhaar.sub',
  },
  {
    id: 'insurance',
    titleKey: 'verification.documents.insurance.title',
    subKey: 'verification.documents.insurance.sub',
  },
  {
    id: 'photo',
    titleKey: 'verification.documents.photo.title',
    subKey: 'verification.documents.photo.sub',
  },
];

const VerificationScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();

  const handleStartEarning = () => navigation.navigate('MainTabs');

  return (
    <View style={styles.container}>
      <TopSafeStrap backgroundColor={Colors.bg} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{t('verification.eyebrow')}</Text>
          <Text style={styles.title}>{t('verification.title')}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.statusBanner}>
            <View style={styles.bannerDecoration} />
            <Text style={styles.bannerEyebrow}>
              {t('verification.bannerEyebrow')}
            </Text>
            <Text style={styles.bannerTitle}>
              {t('verification.bannerTitle')}
            </Text>
            <Text style={styles.bannerSub}>{t('verification.bannerSub')}</Text>
          </View>

          <Card pad={4} style={styles.docCard}>
            {DOCUMENTS.map((doc, i) => (
              <View
                key={doc.id}
                style={[
                  styles.docRow,
                  i < DOCUMENTS.length - 1 && styles.docRowDivider,
                ]}
              >
                <View style={styles.docIconWrap}>
                  <CheckIcon size={17} color={Colors.green} strokeWidth={2.2} />
                </View>
                <View style={styles.docTextWrap}>
                  <Text style={styles.docTitle}>{t(doc.titleKey)}</Text>
                  <Text style={styles.docSub}>{t(doc.subKey)}</Text>
                </View>
                <View style={styles.docStatusChip}>
                  <Text style={styles.docStatusText}>
                    {t('verification.statusVerified')}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={t('verification.startEarning')}
          onPress={handleStartEarning}
          icon="arrowRight"
          style={styles.fullButton}
        />
      </View>
    </View>
  );
};

export default VerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: vscale(20),
  },
  header: {
    paddingTop: vscale(24),
    paddingHorizontal: hscale(18),
  },
  eyebrow: {
    fontSize: fscale(11),
    fontWeight: '700',
    color: Colors.mute,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: fscale(28),
    fontWeight: '700',
    letterSpacing: -0.8,
    color: Colors.ink,
    marginTop: vscale(4),
  },
  body: {
    paddingTop: vscale(16),
    paddingHorizontal: hscale(18),
  },
  statusBanner: {
    borderRadius: hscale(22),
    padding: hscale(18),
    backgroundColor: Colors.lime,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: Colors.lime,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
  },
  bannerDecoration: {
    position: 'absolute',
    top: hscale(-30),
    right: hscale(-30),
    width: hscale(120),
    height: hscale(120),
    borderRadius: hscale(60),
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  bannerEyebrow: {
    fontSize: fscale(11),
    fontWeight: '700',
    color: Colors.ink,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: fscale(22),
    fontWeight: '800',
    color: Colors.ink,
    marginTop: vscale(4),
    letterSpacing: -0.4,
  },
  bannerSub: {
    fontSize: fscale(12.5),
    color: Colors.ink,
    opacity: 0.7,
    marginTop: vscale(4),
  },
  docCard: {
    marginTop: vscale(14),
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    padding: hscale(12),
  },
  docRowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.line2,
  },
  docIconWrap: {
    width: hscale(36),
    height: hscale(36),
    borderRadius: hscale(12),
    backgroundColor: '#E9F8E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTextWrap: {
    flex: 1,
  },
  docTitle: {
    fontSize: fscale(13.5),
    fontWeight: '600',
    color: Colors.ink,
  },
  docSub: {
    fontSize: fscale(11.5),
    color: Colors.mute,
    marginTop: vscale(1),
  },
  docStatusChip: {
    paddingVertical: vscale(3),
    paddingHorizontal: hscale(8),
    borderRadius: hscale(6),
    backgroundColor: '#E9F8E4',
  },
  docStatusText: {
    fontSize: fscale(10.5),
    fontWeight: '700',
    color: Colors.green,
  },
  footer: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(12),
    paddingBottom: vscale(45),
    backgroundColor: Colors.bg,
    borderTopWidth: 0.5,
    borderTopColor: Colors.line,
  },
  fullButton: {
    width: '100%',
  },
});
