import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import HeaderBack from '../../components/common/HeaderBack';
import PrimaryButton from '../../components/common/PrimaryButton';
import CarIcon from '../../assets/icons/CarIcon';
import UserIcon from '../../assets/icons/UserIcon';
import ShieldIcon from '../../assets/icons/ShieldIcon';
import InvoiceIcon from '../../assets/icons/InvoiceIcon';
import EditIcon from '../../assets/icons/EditIcon';
import { PARTNER_PROFILE } from '../Home/mockHomeData';
import {
  PARTNER_DOCUMENTS,
  PartnerDocument,
  docStatusKey,
} from './mockDocumentsData';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'DocumentDetail'>;
type RouteProps = RouteProp<RootStackParamList, 'DocumentDetail'>;

const DOC_ICONS: Record<
  PartnerDocument['icon'],
  React.FC<{ size: number; color: string; strokeWidth: number }>
> = {
  car: CarIcon,
  user: UserIcon,
  shield: ShieldIcon,
  invoice: InvoiceIcon,
};

const DocumentDetailScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();
  const { docId } = useRoute<RouteProps>().params;

  const doc =
    PARTNER_DOCUMENTS.find(d => d.id === docId) || PARTNER_DOCUMENTS[0];
  const IconComponent = DOC_ICONS[doc.icon];
  const docTitle = t(doc.titleKey);
  const docStatus = t(docStatusKey(doc.status));

  // TODO: real re-upload / edit flow (picking a new file and resubmitting
  // for verification) isn't wired yet — this just logs for now. When ready,
  // this likely reuses the same picker approach as PartnerDocumentsScreen.
  const handleUpdateDocument = () =>
    console.log('TODO: launch document re-upload flow', doc.id);

  const details: [string, string][] = [
    [t('documents.detail.status'), docStatus],
    [t('documents.detail.docNumber'), doc.sub],
    [t('documents.detail.verifiedOn'), doc.verifiedOn],
    [t('documents.detail.validTill'), doc.validTill],
    [
      t('documents.detail.linkedTo'),
      `${PARTNER_PROFILE.name} · ${PARTNER_PROFILE.phone}`,
    ],
  ];

  return (
    <View style={styles.container}>
      <HeaderBack
        title={docTitle}
        sub={doc.sub}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card pad={16}>
          <View style={styles.headerRow}>
            <View style={styles.docIconWrap}>
              <IconComponent size={28} color={Colors.green} strokeWidth={1.8} />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.docTitle}>{docTitle}</Text>
              <Text style={styles.docSub}>{doc.sub}</Text>
            </View>
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
                      doc.status === 'Verified' ? Colors.green : Colors.amber,
                  },
                ]}
              >
                {docStatus}
              </Text>
            </View>
          </View>

          <View style={styles.previewBox}>
            <IconComponent size={36} color={Colors.mute2} strokeWidth={1.6} />
            <Text style={styles.previewLabel}>{t('documents.preview')}</Text>
          </View>
        </Card>

        <Card style={styles.detailsCard} pad={0}>
          <Text style={styles.detailsLabel}>{t('documents.detailsLabel')}</Text>
          {details.map(([k, v], i) => (
            <View
              key={k}
              style={[styles.detailRow, i > 0 && styles.detailRowBorder]}
            >
              <Text style={styles.detailKey}>{k}</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {v}
              </Text>
            </View>
          ))}
        </Card>

        <PrimaryButton
          label={t('documents.updateDocument')}
          onPress={handleUpdateDocument}
          icon="edit"
          variant="ghost"
          style={styles.updateButton}
        />
      </ScrollView>
    </View>
  );
};

export default DocumentDetailScreen;

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(14),
    marginBottom: vscale(16),
  },
  docIconWrap: {
    width: hscale(56),
    height: hscale(56),
    borderRadius: hscale(18),
    backgroundColor: '#E9F8E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  docTitle: {
    fontSize: fscale(17),
    fontWeight: '700',
    color: Colors.ink,
  },
  docSub: {
    fontSize: fscale(12.5),
    color: Colors.mute,
  },
  statusChip: {
    paddingVertical: vscale(5),
    paddingHorizontal: hscale(10),
    borderRadius: hscale(8),
  },
  statusChipText: {
    fontSize: fscale(11),
    fontWeight: '700',
  },
  previewBox: {
    height: vscale(120),
    borderRadius: hscale(16),
    backgroundColor: Colors.bg2,
    borderWidth: 0.5,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabel: {
    fontSize: fscale(11.5),
    color: Colors.mute,
    marginTop: vscale(8),
  },
  detailsCard: {
    marginTop: vscale(12),
  },
  detailsLabel: {
    padding: hscale(14),
    paddingBottom: vscale(4),
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: vscale(9),
    paddingHorizontal: hscale(14),
  },
  detailRowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.line2,
  },
  detailKey: {
    fontSize: fscale(13),
    color: Colors.mute,
  },
  detailValue: {
    flex: 1,
    marginLeft: hscale(12),
    fontSize: fscale(13),
    fontWeight: '600',
    color: Colors.ink,
    textAlign: 'right',
  },
  updateButton: {
    marginTop: vscale(12),
    width: '100%',
  },
});
