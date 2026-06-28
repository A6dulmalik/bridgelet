import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLanguageDetection } from '../hooks/useLanguageDetection';

/**
 * Props for LanguageInput component
 */
export interface LanguageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onLanguageChange?: (language: string, confidence: number) => void;
  placeholder?: string;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: any;
  showLanguageInfo?: boolean;
  allowManualOverride?: boolean;
}

/**
 * LanguageInput Component
 * Provides real-time language detection of input text
 * Features:
 * - Automatic language detection while typing
 * - Debounced API calls to avoid excessive requests
 * - Manual override capability
 * - Fallback detection when API is unavailable
 * - Display of detection confidence
 */
export const LanguageInput = React.forwardRef<TextInput, LanguageInputProps>(
  (
    {
      value,
      onChangeText,
      onLanguageChange,
      placeholder = 'Enter text...',
      editable = true,
      multiline = false,
      numberOfLines = 1,
      style,
      showLanguageInfo = true,
      allowManualOverride = true,
    },
    ref
  ) => {
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

    const {
      detectedLanguage,
      confidence,
      isDetecting,
      alternatives,
      overrideLanguage,
      reset,
    } = useLanguageDetection(value, onLanguageChange);

    // Handle text change
    const handleTextChange = useCallback(
      (text: string) => {
        onChangeText(text);
      },
      [onChangeText]
    );

    // Handle language selection from dropdown
    const handleLanguageSelect = useCallback(
      (language: string) => {
        setSelectedLanguage(language);
        overrideLanguage(language);
        setShowLanguageDropdown(false);
      },
      [overrideLanguage]
    );

    // Get display language - use manually selected or detected
    const displayLanguage = selectedLanguage || detectedLanguage;
    const displayConfidence = selectedLanguage ? 100 : Math.round(confidence * 100);

    // Common language codes and names
    const SUPPORTED_LANGUAGES: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      ar: 'Arabic',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      hi: 'Hindi',
    };

    return (
      <View style={styles.container}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={ref}
            value={value}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            editable={editable}
            multiline={multiline}
            numberOfLines={numberOfLines}
            style={[styles.input, style]}
            placeholderTextColor="#999"
          />
          
          {showLanguageInfo && displayLanguage && (
            <View style={styles.detectionBadge}>
              {isDetecting && <ActivityIndicator size="small" color="#0066cc" />}
              <Text style={styles.detectionText}>
                {SUPPORTED_LANGUAGES[displayLanguage] || displayLanguage.toUpperCase()}
                {displayConfidence > 0 && !isDetecting && (
                  <Text style={styles.confidenceText}> {displayConfidence}%</Text>
                )}
              </Text>
            </View>
          )}
        </View>

        {/* Language Override Section */}
        {allowManualOverride && displayLanguage && (
          <View style={styles.overrideSection}>
            <TouchableOpacity
              style={styles.overrideButton}
              onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
            >
              <Text style={styles.overrideButtonText}>
                {selectedLanguage ? 'Change' : 'Override'} Language
              </Text>
            </TouchableOpacity>

            {showLanguageDropdown && (
              <View style={styles.dropdown}>
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                  <TouchableOpacity
                    key={code}
                    style={[
                      styles.dropdownItem,
                      selectedLanguage === code && styles.dropdownItemSelected,
                    ]}
                    onPress={() => handleLanguageSelect(code)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedLanguage === code && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Alternative Languages */}
        {alternatives && alternatives.length > 0 && !selectedLanguage && (
          <View style={styles.alternativesSection}>
            <Text style={styles.alternativesLabel}>Alternative detections:</Text>
            <View style={styles.alternativesList}>
              {alternatives.map((alt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.alternativeItem}
                  onPress={() => handleLanguageSelect(alt.language)}
                >
                  <Text style={styles.alternativeText}>
                    {SUPPORTED_LANGUAGES[alt.language] || alt.language.toUpperCase()} 
                    <Text style={styles.alternativeConfidence}>
                      {' '}({Math.round(alt.confidence * 100)}%)
                    </Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  }
);

LanguageInput.displayName = 'LanguageInput';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputWrapper: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  input: {
    padding: 12,
    fontSize: 16,
    fontFamily: 'System',
    minHeight: 44,
  },
  detectionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#e8f0ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detectionText: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '500',
  },
  confidenceText: {
    fontSize: 11,
    color: '#0066cc',
    opacity: 0.7,
  },
  overrideSection: {
    marginTop: 8,
  },
  overrideButton: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  overrideButtonText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#e8f0ff',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#0066cc',
    fontWeight: '600',
  },
  alternativesSection: {
    marginTop: 8,
  },
  alternativesLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  alternativesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  alternativeItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  alternativeText: {
    fontSize: 12,
    color: '#333',
  },
  alternativeConfidence: {
    color: '#999',
    fontSize: 11,
  },
});
