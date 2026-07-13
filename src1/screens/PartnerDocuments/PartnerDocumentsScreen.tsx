import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import TopSafeStrap from '../../components/layout/TopSafeStrap';
import PrimaryButton from '../../components/common/PrimaryButton';
import Card from '../../components/common/Card';
import CheckIcon from '../../assets/icons/CheckIcon';
import CameraIcon from '../../assets/icons/CameraIcon';
import UploadIcon from '../../assets/icons/UploadIcon';
import { RootStackParamList } from '../../navigation/types';
import { DocumentKey, PickedFile } from '../../services/api/documentsService';
import ImageCropPicker from 'react-native-image-crop-picker';

// ASSUMED DEPENDENCIES — not confirmed installed in this project yet:
//   npm install react-native-image-picker @react-native-documents/picker
// react-native-image-picker -> Self Photo (camera/gallery)
// @react-native-documents/picker -> ID/vehicle documents (image or PDF).
// NOTE: the older `react-native-document-picker` package is deprecated and
// breaks compileDebugJavaWithJavac on newer React Native (it references
// bridge classes like BaseActivityEventListener/GuardedResultAsyncTask that
// no longer exist) — this is the maintained successor, same maintainers,
// renamed package.
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import {
  pick,
  types as DocTypes,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';

type NavProp = NativeStackNavigationProp<
  RootStackParamList,
  'PartnerDocuments'
>;

interface DocRow {
  key: DocumentKey;
  title: string;
  sub: string;
  required: boolean;
}

const DOC_ROWS: DocRow[] = [
  {
    key: 'selfPhoto',
    title: 'Self Photo',
    sub: 'Clear face photo, taken now',
    required: true,
  },
  {
    key: 'drivingLicence',
    title: 'Driving Licence',
    sub: 'Front & back, clearly visible',
    required: true,
  },
  {
    key: 'vehicleRc',
    title: 'Vehicle RC',
    sub: 'Registration certificate',
    required: true,
  },
  {
    key: 'aadhaarCard',
    title: 'Aadhaar Card',
    sub: 'Identity proof',
    required: true,
  },
  {
    key: 'otherDocument',
    title: 'Other Required Documents',
    sub: 'Insurance, permit, etc. (optional)',
    required: false,
  },
];

const PartnerDocumentsScreen = () => {
  const navigation = useNavigation<NavProp>();

  const [files, setFiles] = useState<Partial<Record<DocumentKey, PickedFile>>>(
    {},
  );
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requiredKeys = DOC_ROWS.filter(d => d.required).map(d => d.key);
  const hasAllRequiredDocs = requiredKeys.every(k => !!files[k]);
  const hasVehicleDetails =
    vehicleNumber.trim().length >= 4 && vehicleModel.trim().length >= 2;
  const isValid = hasAllRequiredDocs && hasVehicleDetails;

  const handlePick = async (row: DocRow) => {
    if (errorMessage) setErrorMessage(null);
    try {
      if (row.key === 'selfPhoto') {
        const result = await launchCamera({
          mediaType: 'photo',
          quality: 0.8,
        });
        const asset = result.assets?.[0];
        if (!asset?.uri) return;

        const cropped = await ImageCropPicker.openCropper({
          path: asset.uri,
          mediaType: 'photo',
        });

        setFiles(prev => ({
          ...prev,
          selfPhoto: {
            uri: cropped.path,
            name: asset.fileName || 'self_photo.jpg',
            type: cropped.mime || asset.type || 'image/jpeg',
          },
        }));
        return;
      }

      // ID/vehicle docs — allow either an image or a PDF. Only images go
      // through the cropper; PDFs are stored as-is.
      const [result] = await pick({
        type: [DocTypes.images, DocTypes.pdf],
      });

      const isImage = (result.type || '').startsWith('image/');

      if (isImage) {
        const cropped = await ImageCropPicker.openCropper({
          path: result.uri,
          mediaType: 'photo',
        });
        setFiles(prev => ({
          ...prev,
          [row.key]: {
            uri: cropped.path,
            name: result.name || `${row.key}.jpg`,
            type: cropped.mime || result.type || 'image/jpeg',
          },
        }));
        return;
      }

      setFiles(prev => ({
        ...prev,
        [row.key]: {
          uri: result.uri,
          name: result.name || `${row.key}.jpg`,
          type: result.type || 'application/octet-stream',
        },
      }));
    } catch (err: any) {
      // Backing out of the picker or the cropper isn't worth surfacing.
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      if (err?.code === 'E_PICKER_CANCELLED') {
        return;
      }
      setErrorMessage('Could not open the picker. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setErrorMessage(null);

    // FLOW-ONLY FOR NOW — UploadPartnerDocuments and SubmitPartnerApplication
    // aren't confirmed APIs yet (no curl/response given for them), so this
    // just walks the screens/navigation so the flow can be demoed. Once you
    // share the real endpoints, swap this block for the two real calls:
    //
    //   const cookie = await getCookie();
    //   const uploadRes = await uploadPartnerDocuments(cookie, files, {
    //     vehicleNumber: vehicleNumber.trim(),
    //     vehicleModel: vehicleModel.trim(),
    //   });
    //   if (uploadRes.Result !== 'Success') throw new Error(uploadRes.Message);
    //   const submitRes = await submitPartnerApplication(cookie);
    //   if (submitRes.Result !== 'Success') throw new Error(submitRes.Message);
    //
    // (imports for those two live in services/api/documentsService.ts)
    setTimeout(() => {
      setLoading(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'ApplicationProcessing' }],
      });
    }, 400);
  };

  return (
    <View style={styles.container}>
      <TopSafeStrap backgroundColor={Colors.bg} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Step 2 of 2 · Onboarding</Text>
          <Text style={styles.title}>Partner documents</Text>
          <Text style={styles.subtitle}>
            Upload these so we can verify your account.
          </Text>
        </View>

        <View style={styles.body}>
          <Card pad={4} style={styles.docCard}>
            {DOC_ROWS.map((row, i) => {
              const picked = files[row.key];
              return (
                <TouchableOpacity
                  key={row.key}
                  onPress={() => handlePick(row)}
                  activeOpacity={0.7}
                  style={[
                    styles.docRow,
                    i < DOC_ROWS.length - 1 && styles.docRowDivider,
                  ]}
                >
                  <View
                    style={[
                      styles.docIconWrap,
                      picked && styles.docIconWrapDone,
                    ]}
                  >
                    {picked ? (
                      <CheckIcon
                        size={16}
                        color={Colors.green}
                        strokeWidth={2.2}
                      />
                    ) : row.key === 'selfPhoto' ? (
                      <CameraIcon size={17} color={Colors.mute} />
                    ) : (
                      <UploadIcon size={17} color={Colors.mute} />
                    )}
                  </View>
                  <View style={styles.docTextWrap}>
                    <Text style={styles.docTitle}>
                      {row.title}
                      {!row.required && (
                        <Text style={styles.optionalTag}> Optional</Text>
                      )}
                    </Text>
                    <Text style={styles.docSub} numberOfLines={1}>
                      {picked ? picked.name : row.sub}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.docStatusChip,
                      picked && styles.docStatusChipDone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.docStatusText,
                        picked && styles.docStatusTextDone,
                      ]}
                    >
                      {picked ? 'Added' : 'Upload'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Card>

          <Text style={styles.sectionLabel}>Vehicle details</Text>
          <Card pad={16} style={styles.vehicleCard}>
            <Text style={styles.fieldLabel}>Vehicle registration number</Text>
            <TextInput
              style={styles.input}
              value={vehicleNumber}
              onChangeText={t => {
                if (errorMessage) setErrorMessage(null);
                setVehicleNumber(t.toUpperCase());
              }}
              placeholder="UP16 AB 4821"
              placeholderTextColor={Colors.mute2}
              autoCapitalize="characters"
            />
            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>
              Vehicle model
            </Text>
            <TextInput
              style={styles.input}
              value={vehicleModel}
              onChangeText={t => {
                if (errorMessage) setErrorMessage(null);
                setVehicleModel(t);
              }}
              placeholder="e.g. Maruti Swift Dzire"
              placeholderTextColor={Colors.mute2}
            />
          </Card>

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={loading ? 'Submitting…' : 'Submit application'}
          onPress={handleSubmit}
          icon="arrowRight"
          disabled={loading || !isValid}
          style={styles.fullButton}
        />
      </View>
    </View>
  );
};

export default PartnerDocumentsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: vscale(20) },
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
    fontSize: fscale(26),
    fontWeight: '700',
    letterSpacing: -0.8,
    color: Colors.ink,
    marginTop: vscale(4),
  },
  subtitle: {
    marginTop: vscale(4),
    fontSize: fscale(13),
    color: Colors.mute,
  },
  body: {
    paddingTop: vscale(18),
    paddingHorizontal: hscale(18),
  },
  docCard: {},
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
    backgroundColor: Colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIconWrapDone: {
    backgroundColor: '#E9F8E4',
  },
  docTextWrap: { flex: 1 },
  docTitle: {
    fontSize: fscale(13.5),
    fontWeight: '600',
    color: Colors.ink,
  },
  optionalTag: {
    fontSize: fscale(10.5),
    fontWeight: '600',
    color: Colors.mute2,
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
    backgroundColor: Colors.bg2,
  },
  docStatusChipDone: {
    backgroundColor: '#E9F8E4',
  },
  docStatusText: {
    fontSize: fscale(10.5),
    fontWeight: '700',
    color: Colors.mute,
  },
  docStatusTextDone: {
    color: Colors.green,
  },
  sectionLabel: {
    fontSize: fscale(11),
    fontWeight: '700',
    color: Colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: vscale(20),
    marginBottom: vscale(10),
  },
  vehicleCard: {},
  fieldLabel: {
    fontSize: fscale(11),
    fontWeight: '700',
    color: Colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: vscale(8),
  },
  fieldLabelSpaced: { marginTop: vscale(14) },
  input: {
    fontSize: fscale(14.5),
    fontWeight: '600',
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: hscale(12),
    paddingVertical: vscale(10),
    paddingHorizontal: hscale(12),
  },
  errorText: {
    marginTop: vscale(14),
    fontSize: fscale(12.5),
    color: Colors.red,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(12),
    paddingBottom: vscale(45),
    backgroundColor: Colors.bg,
    borderTopWidth: 0.5,
    borderTopColor: Colors.line,
  },
  fullButton: { width: '100%' },
});
