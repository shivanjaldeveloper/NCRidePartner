import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale, safeLineHeight } from '../../theme/scale';
import BottomSheetPanel from '../common/BottomSheetPanel';
import CheckIcon from '../../assets/icons/CheckIcon';
import { LANGUAGES, type LanguageCode } from '../../i18n/languages';
import { changeAppLanguage } from '../../i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Bottom-sheet language picker. Selecting a language persists it
// (via changeAppLanguage -> i18next's cacheUserLanguage) and re-renders
// every screen using useTranslation immediately — no restart needed.
const LanguageSheet: React.FC<Props> = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const activeCode = i18n.language as LanguageCode;

  const handleSelect = (code: LanguageCode) => {
    if (code !== activeCode) changeAppLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheetWrap}>
        <BottomSheetPanel>
          <Text style={styles.title}>{t('settings.languageSheet.title')}</Text>
          <Text style={styles.subtitle}>
            {t('settings.languageSheet.subtitle')}
          </Text>

          <View style={styles.list}>
            {LANGUAGES.map(lang => {
              const selected = lang.code === activeCode;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.row, selected && styles.rowSelected]}
                  activeOpacity={0.75}
                  onPress={() => handleSelect(lang.code)}
                >
                  <View style={styles.textWrap}>
                    <Text style={styles.nativeLabel}>{lang.nativeLabel}</Text>
                    {lang.nativeLabel !== lang.englishLabel && (
                      <Text style={styles.englishLabel}>
                        {lang.englishLabel}
                      </Text>
                    )}
                  </View>
                  {selected && (
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

          <TouchableOpacity
            style={styles.doneButton}
            activeOpacity={0.85}
            onPress={onClose}
          >
            <Text style={styles.doneText}>
              {t('settings.languageSheet.done')}
            </Text>
          </TouchableOpacity>
        </BottomSheetPanel>
      </View>
    </Modal>
  );
};

export default LanguageSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,17,21,0.4)',
  },
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  title: {
    fontSize: fscale(18),
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: vscale(4),
    fontSize: fscale(12.5),
    color: Colors.mute,
    lineHeight: safeLineHeight(fscale(12.5)),
  },
  list: {
    marginTop: vscale(16),
    gap: vscale(8),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vscale(14),
    paddingHorizontal: hscale(16),
    borderRadius: hscale(16),
    borderWidth: 1.5,
    borderColor: Colors.line,
    backgroundColor: Colors.bg,
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
    fontSize: fscale(15),
    fontWeight: '700',
    color: Colors.ink,
  },
  englishLabel: {
    fontSize: fscale(12),
    color: Colors.mute,
  },
  checkWrap: {
    width: hscale(22),
    height: hscale(22),
    borderRadius: hscale(11),
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    marginTop: vscale(18),
    paddingVertical: vscale(14),
    borderRadius: hscale(16),
    alignItems: 'center',
    backgroundColor: Colors.ink,
  },
  doneText: {
    fontSize: fscale(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
