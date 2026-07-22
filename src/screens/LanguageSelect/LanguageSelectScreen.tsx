import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import TopSafeStrap from '../../components/layout/TopSafeStrap';
import PrimaryButton from '../../components/common/PrimaryButton';
import CheckIcon from '../../assets/icons/CheckIcon';
import { RootStackParamList } from '../../navigation/types';
import { LANGUAGES, type LanguageCode } from '../../i18n/languages';
import { changeAppLanguage } from '../../i18n';
import { markLanguageChosen } from '../../utils/language';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'LanguageSelect'>;
type RouteProps = RouteProp<RootStackParamList, 'LanguageSelect'>;

// Shown once, only before the partner has ever explicitly picked a
// language (see utils/language.ts). Deliberately not translated via t() —
// this screen renders before any language has been confirmed, so the
// heading is shown in all three supported languages at once, same as
// most apps handle a first-run language gate.
const HEADING_LINES = [
  'Choose your language',
  'अपनी भाषा चुनें',
  'तुमची भाषा निवडा',
];

const CONTINUE_LABEL: Record<LanguageCode, string> = {
  en: 'Continue',
  hi: 'जारी रखें',
  mr: 'सुरू ठेवा',
};

const LanguageSelectScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<RouteProps>();
  const { i18n } = useTranslation();

  // Pre-select whatever i18next already resolved (device locale if it
  // matched a supported language, else English) so a partner who's happy
  // with the guess can just tap Continue without picking anything.
  const [selected, setSelected] = useState<LanguageCode>(
    (i18n.language as LanguageCode) || 'en',
  );
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    await changeAppLanguage(selected);
    await markLanguageChosen();
    navigation.replace(params.nextRoute);
  };

  return (
    <View style={styles.container}>
      <TopSafeStrap backgroundColor={Colors.bg} />

      <View style={styles.content}>
        <View style={styles.headingBlock}>
          {HEADING_LINES.map(line => (
            <Text key={line} style={styles.headingLine}>
              {line}
            </Text>
          ))}
        </View>

        <View style={styles.list}>
          {LANGUAGES.map(lang => {
            const isSelected = lang.code === selected;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.row, isSelected && styles.rowSelected]}
                activeOpacity={0.75}
                onPress={() => setSelected(lang.code)}
              >
                <View style={styles.textWrap}>
                  <Text style={styles.nativeLabel}>{lang.nativeLabel}</Text>
                  {lang.nativeLabel !== lang.englishLabel && (
                    <Text style={styles.englishLabel}>{lang.englishLabel}</Text>
                  )}
                </View>
                {isSelected && (
                  <View style={styles.checkWrap}>
                    <CheckIcon
                      size={14}
                      color={Colors.surface}
                      strokeWidth={2.4}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={CONTINUE_LABEL[selected]}
          onPress={handleContinue}
          icon="arrowRight"
          disabled={saving}
          style={styles.fullButton}
        />
      </View>
    </View>
  );
};

export default LanguageSelectScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: hscale(20),
    justifyContent: 'center',
  },
  headingBlock: {
    marginBottom: vscale(28),
    gap: vscale(4),
  },
  headingLine: {
    fontSize: fscale(20),
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  list: {
    gap: vscale(10),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vscale(16),
    paddingHorizontal: hscale(18),
    borderRadius: hscale(16),
    borderWidth: 1.5,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
  },
  rowSelected: {
    borderColor: Colors.ink,
    backgroundColor: 'rgba(200,242,96,0.15)',
  },
  textWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: hscale(8),
  },
  nativeLabel: {
    fontSize: fscale(16),
    fontWeight: '700',
    color: Colors.ink,
  },
  englishLabel: {
    fontSize: fscale(12.5),
    color: Colors.mute,
  },
  checkWrap: {
    width: hscale(24),
    height: hscale(24),
    borderRadius: hscale(12),
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: hscale(20),
    paddingBottom: vscale(45),
  },
  fullButton: {
    width: '100%',
  },
});
