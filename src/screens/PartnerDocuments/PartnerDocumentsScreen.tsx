import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
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
import { getCookie } from '../../utils/session';
import {
  DocumentKey,
  PickedFile,
  getProcessingDetails,
  uploadPartnerDocument,
  updateVehicleDetails,
  confirmSubmission,
} from '../../services/api/onboardingService';
import ImageCropPicker from 'react-native-image-crop-picker';

// ASSUMED DEPENDENCIES — not confirmed installed in this project yet:
//   npm install react-native-image-picker @react-native-documents/picker react-native-image-crop-picker
import { launchCamera } from 'react-native-image-picker';
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
}

// Titles match the wording OnboardingConfirmSubmission uses in its
// ErrorDetail message ("Please complete the following: Personal Self
// Photo, ...") so a partner who hits that error recognizes the row.
const PERSONAL_DOCS: DocRow[] = [
  { key: 'PersonalSelfPhoto', title: 'Personal Self Photo', sub: 'Clear face photo, taken now' },
  { key: 'PersonalAadhaarCard', title: 'Personal Aadhaar Card', sub: 'Identity proof' },
  { key: 'PersonalPANCard', title: 'Personal PAN Card', sub: 'Identity proof' },
  { key: 'PersonalDrivingLicence', title: 'Personal Driving Licence', sub: 'Front & back, clearly visible' },
];

const VEHICLE_DOCS: DocRow[] = [
  { key: 'VehicleRC', title: 'Vehicle RC', sub: 'Registration certificate' },
  { key: 'VehicleInsurance', title: 'Vehicle Insurance', sub: 'Valid insurance copy' },
  { key: 'VehiclePUC', title: 'Vehicle PUC', sub: 'Pollution certificate' },
  { key: 'VehicleFitness', title: 'Vehicle Fitness', sub: 'Fitness certificate' },
  { key: 'VehiclePermit', title: 'Vehicle Permit', sub: 'Commercial permit' },
  { key: 'VehicleNumberPlatePhoto', title: 'Vehicle Number Plate Photo', sub: 'Clear photo of plate' },
  { key: 'VehicleFrontPhoto', title: 'Vehicle Front Photo', sub: 'Full front view' },
];

const ALL_DOCS = [...PERSONAL_DOCS, ...VEHICLE_DOCS];

// VehicleType enum values aren't documented anywhere beyond the single
// "BIKE" example in the sample response — these are a best guess. If the
// backend uses different values, swap this list (or replace the chips with
// a free-text field) once confirmed.
const VEHICLE_TYPES = ['BIKE', 'AUTO', 'CAR'];

type DocStatus = 'idle' | 'uploading' | 'done' | 'error';

const PartnerDocumentsScreen = () => {
  const navigation = useNavigation<NavProp>();

  const [loadingDetails, setLoadingDetails] = useState(true);
  const [docStatus, setDocStatus] = useState<Record<string, DocStatus>>({});
  const [docUrl, setDocUrl] = useState<Partial<Record<DocumentKey, string>>>({});

  const [vehicleRegistration, setVehicleRegistration] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vehicleSaved, setVehicleSaved] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load whatever's already on file (resuming onboarding, or docs uploaded
  // in a previous session) so the screen never makes a partner re-upload
  // something that already succeeded.
  useEffect(() => {
    (async () => {
      try {
        const cookie = await getCookie();
        if (!cookie) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        const res = await getProcessingDetails(cookie);
        if (res.Result === 'Success') {
          const nextStatus: Record<string, DocStatus> = {};
          const nextUrl: Partial<Record<DocumentKey, string>> = {};
          ALL_DOCS.forEach(({ key }) => {
            const value = res[key];
            if (value) {
              nextStatus[key] = 'done';
              nextUrl[key] = value;
            }
          });
          setDocStatus(nextStatus);
          setDocUrl(nextUrl);
          if (res.VehicleRegistration) setVehicleRegistration(res.VehicleRegistration);
          if (res.VehicleType) setVehicleType(res.VehicleType);
          if (res.VehicleModel) setVehicleModel(res.VehicleModel);
        }
      } catch (err) {
        console.warn('[PartnerDocuments] Failed to load processing details:', err);
      } finally {
        setLoadingDetails(false);
      }
    })();
  }, [navigation]);

  const hasAllRequiredDocs = ALL_DOCS.every(d => docStatus[d.key] === 'done');
  const hasVehicleDetails =
    vehicleRegistration.trim().length >= 4 &&
    vehicleType.trim().length >= 2 &&
    vehicleModel.trim().length >= 2;
  const isValid = hasAllRequiredDocs && hasVehicleDetails;

  const uploadOne = async (row: DocRow, file: PickedFile) => {
    setDocStatus(prev => ({ ...prev, [row.key]: 'uploading' }));
    try {
      const cookie = await getCookie();
      if (!cookie) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      const res = await uploadPartnerDocument(cookie, row.key, file);
      if (res.Result !== 'Success') {
        throw new Error(res.Message || `Could not upload ${row.title}.`);
      }
      setDocStatus(prev => ({ ...prev, [row.key]: 'done' }));
      if (res.ImagePath) {
        setDocUrl(prev => ({ ...prev, [row.key]: res.ImagePath }));
      }
    } catch (err: any) {
      setDocStatus(prev => ({ ...prev, [row.key]: 'error' }));
      setErrorMessage(err?.message || `Could not upload ${row.title}. Please try again.`);
    }
  };

  const handlePick = async (row: DocRow) => {
    if (errorMessage) setErrorMessage(null);
    try {
      if (row.key === 'PersonalSelfPhoto') {
        const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
        const asset = result.assets?.[0];
        if (!asset?.uri) return;

        const cropped = await ImageCropPicker.openCropper({
          path: asset.uri,
          mediaType: 'photo',
        });

        await uploadOne(row, {
          uri: cropped.path,
          name: asset.fileName || 'self_photo.jpg',
          type: cropped.mime || asset.type || 'image/jpeg',
        });
        return;
      }

      // ID/vehicle docs — allow either an image or a PDF. Only images go
      // through the cropper; PDFs are uploaded as-is.
      const [result] = await pick({ type: [DocTypes.images, DocTypes.pdf] });
      const isImage = (result.type || '').startsWith('image/');

      if (isImage) {
        const cropped = await ImageCropPicker.openCropper({
          path: result.uri,
          mediaType: 'photo',
        });
        await uploadOne(row, {
          uri: cropped.path,
          name: result.name || `${row.key}.jpg`,
          type: cropped.mime || result.type || 'image/jpeg',
        });
        return;
      }

      await uploadOne(row, {
        uri: result.uri,
        name: result.name || `${row.key}.pdf`,
        type: result.type || 'application/octet-stream',
      });
    } catch (err: any) {
      // Backing out of the picker or the cropper isn't worth surfacing.
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      if (err?.code === 'E_PICKER_CANCELLED') return;
      setErrorMessage('Could not open the picker. Please try again.');
    }
  };

  const handleSaveVehicleDetails = async () => {
    if (!hasVehicleDetails || savingVehicle) return;
    setSavingVehicle(true);
    setVehicleSaved(false);
    setErrorMessage(null);
    try {
      const cookie = await getCookie();
      if (!cookie) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      const res = await updateVehicleDetails(
        cookie,
        vehicleRegistration.trim(),
        vehicleType.trim(),
        vehicleModel.trim(),
      );
      if (res.Result !== 'Success') {
        throw new Error(res.Message || 'Could not save vehicle details.');
      }
      setVehicleSaved(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not save vehicle details. Please try again.');
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const cookie = await getCookie();
      if (!cookie) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      // Make sure the latest vehicle details are saved even if the partner
      // never tapped "Save" after their last edit.
      if (!vehicleSaved) {
        const vRes = await updateVehicleDetails(
          cookie,
          vehicleRegistration.trim(),
          vehicleType.trim(),
          vehicleModel.trim(),
        );
        if (vRes.Result !== 'Success') {
          throw new Error(vRes.Message || 'Could not save vehicle details.');
        }
      }

      const res = await confirmSubmission(cookie);
      if (res.Result !== 'Success') {
        // The API already returns a friendly, specific message here
        // ("Please complete the following: ...") — show it as-is.
        throw new Error(res.ErrorDetail || res.Error || 'Could not submit your application.');
      }

      navigation.reset({ index: 0, routes: [{ name: 'ApplicationProcessing' }] });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderDocRow = (row: DocRow, isLast: boolean) => {
    const status = docStatus[row.key] || 'idle';
    const done = status === 'done';
    const uploading = status === 'uploading';
    const errored = status === 'error';

    return (
      <TouchableOpacity
        key={row.key}
        onPress={() => handlePick(row)}
        activeOpacity={0.7}
        disabled={uploading}
        style={[styles.docRow, !isLast && styles.docRowDivider]}
      >
        <View style={[styles.docIconWrap, done && styles.docIconWrapDone]}>
          {uploading ? (
            <ActivityIndicator size="small" color={Colors.mute} />
          ) : done ? (
            <CheckIcon size={16} color={Colors.green} strokeWidth={2.2} />
          ) : row.key === 'PersonalSelfPhoto' ? (
            <CameraIcon size={17} color={Colors.mute} />
          ) : (
            <UploadIcon size={17} color={Colors.mute} />
          )}
        </View>
        <View style={styles.docTextWrap}>
          <Text style={styles.docTitle}>{row.title}</Text>
          <Text style={styles.docSub} numberOfLines={1}>
            {errored ? 'Upload failed — tap to retry' : done ? 'Uploaded' : row.sub}
          </Text>
        </View>
        <View
          style={[
            styles.docStatusChip,
            done && styles.docStatusChipDone,
            errored && styles.docStatusChipError,
          ]}
        >
          <Text
            style={[
              styles.docStatusText,
              done && styles.docStatusTextDone,
              errored && styles.docStatusTextError,
            ]}
          >
            {uploading ? 'Uploading' : done ? 'Added' : errored ? 'Retry' : 'Upload'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loadingDetails) {
    return (
      <View style={[styles.container, styles.centerFill]}>
        <ActivityIndicator size="large" color={Colors.ink} />
      </View>
    );
  }

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
          <Text style={styles.sectionLabel}>Personal documents</Text>
          <Card pad={4} style={styles.docCard}>
            {PERSONAL_DOCS.map((row, i) => renderDocRow(row, i === PERSONAL_DOCS.length - 1))}
          </Card>

          <Text style={styles.sectionLabel}>Vehicle details</Text>
          <Card pad={16} style={styles.vehicleCard}>
            <Text style={styles.fieldLabel}>Vehicle registration number</Text>
            <TextInput
              style={styles.input}
              value={vehicleRegistration}
              onChangeText={t => {
                if (errorMessage) setErrorMessage(null);
                setVehicleSaved(false);
                setVehicleRegistration(t.toUpperCase());
              }}
              placeholder="UP16 AB 4821"
              placeholderTextColor={Colors.mute2}
              autoCapitalize="characters"
            />

            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Vehicle type</Text>
            <View style={styles.chipRow}>
              {VEHICLE_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => {
                    setVehicleSaved(false);
                    setVehicleType(t);
                  }}
                  style={[styles.chip, vehicleType === t && styles.chipActive]}
                >
                  <Text style={[styles.chipText, vehicleType === t && styles.chipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Vehicle model</Text>
            <TextInput
              style={styles.input}
              value={vehicleModel}
              onChangeText={t => {
                if (errorMessage) setErrorMessage(null);
                setVehicleSaved(false);
                setVehicleModel(t);
              }}
              placeholder="e.g. Hero Splendor"
              placeholderTextColor={Colors.mute2}
            />

            <PrimaryButton
              label={savingVehicle ? 'Saving…' : vehicleSaved ? 'Saved' : 'Save vehicle details'}
              onPress={handleSaveVehicleDetails}
              icon={vehicleSaved ? 'check' : 'none'}
              variant="ghost"
              disabled={savingVehicle || !hasVehicleDetails}
              style={styles.saveVehicleButton}
            />
          </Card>

          <Text style={styles.sectionLabel}>Vehicle documents</Text>
          <Card pad={4} style={styles.docCard}>
            {VEHICLE_DOCS.map((row, i) => renderDocRow(row, i === VEHICLE_DOCS.length - 1))}
          </Card>

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={submitting ? 'Submitting…' : 'Submit application'}
          onPress={handleSubmit}
          icon="arrowRight"
          disabled={submitting || !isValid}
          style={styles.fullButton}
        />
      </View>
    </View>
  );
};

export default PartnerDocumentsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centerFill: { alignItems: 'center', justifyContent: 'center' },
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
  docStatusChipError: {
    backgroundColor: '#FBE7E7',
  },
  docStatusText: {
    fontSize: fscale(10.5),
    fontWeight: '700',
    color: Colors.mute,
  },
  docStatusTextDone: {
    color: Colors.green,
  },
  docStatusTextError: {
    color: Colors.red,
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
  chipRow: {
    flexDirection: 'row',
    gap: hscale(8),
  },
  chip: {
    paddingVertical: vscale(8),
    paddingHorizontal: hscale(14),
    borderRadius: hscale(10),
    borderWidth: 1,
    borderColor: Colors.line,
  },
  chipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  chipText: {
    fontSize: fscale(12.5),
    fontWeight: '700',
    color: Colors.mute,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  saveVehicleButton: {
    marginTop: vscale(16),
    width: '100%',
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
