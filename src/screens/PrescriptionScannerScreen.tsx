import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { colors } from '../theme/colors';

type ReviewData = {
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions: string;
};

export default function PrescriptionScannerScreen({ navigation }: any) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const [reviewData, setReviewData] = useState<ReviewData>({
    medicationName: '',
    dosage: '',
    frequency: '',
    instructions: '',
  });

  const requestCameraPermission = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Camera permission needed',
        'DoseWise needs camera access so you can photograph a prescription.'
      );

      return false;
    }

    return true;
  };

  const requestLibraryPermission = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Photo permission needed',
        'DoseWise needs access to your photos so you can choose a prescription image.'
      );

      return false;
    }

    return true;
  };

  const takePhoto = async () => {
    const allowed = await requestCameraPermission();

    if (!allowed) {
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
        setShowReview(false);
      }
    } catch (error) {
      console.error('Camera error:', error);

      Alert.alert(
        'Camera error',
        'DoseWise could not open the camera. Please try again.'
      );
    }
  };

  const chooseFromGallery = async () => {
    const allowed = await requestLibraryPermission();

    if (!allowed) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
        setShowReview(false);
      }
    } catch (error) {
      console.error('Gallery error:', error);

      Alert.alert(
        'Gallery error',
        'DoseWise could not open your photo library. Please try again.'
      );
    }
  };

  const removeImage = () => {
    setImageUri(null);
    setShowReview(false);
    setReviewData({
      medicationName: '',
      dosage: '',
      frequency: '',
      instructions: '',
    });
  };

  const analysePrescription = async () => {
    if (!imageUri) {
      Alert.alert(
        'No prescription',
        'Take a photo or choose a prescription image first.'
      );

      return;
    }

    setIsProcessing(true);

    /*
      IMPORTANT:
      Real prescription OCR will be connected here later.

      We deliberately do NOT generate fake medication details.

      When OCR is connected, it will extract possible values from the
      prescription and place them into reviewData. The user will always
      review and confirm the information before saving anything.
    */

    setTimeout(() => {
      setIsProcessing(false);
      setShowReview(true);
    }, 700);
  };

  const continueToMedication = () => {
    const hasAnyInformation =
      reviewData.medicationName.trim() ||
      reviewData.dosage.trim() ||
      reviewData.frequency.trim() ||
      reviewData.instructions.trim();

    if (!hasAnyInformation) {
      Alert.alert(
        'Enter prescription details',
        'Automatic prescription reading is not connected yet. Enter the medication details you can read from the prescription, or continue by adding the medication manually.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Add manually',
            onPress: () => navigation.navigate('AddMedication'),
          },
        ]
      );

      return;
    }

    Alert.alert(
      'Review before saving',
      'Prescription scanning will eventually transfer these confirmed details directly into the medication form. For now, continue to Add Medication and enter the verified information there.',
      [
        {
          text: 'Stay here',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: () => navigation.navigate('AddMedication'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.text}
          />
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Scan Prescription
          </Text>

          <Text style={styles.headerSubtitle}>
            Capture and review medication details
          </Text>
        </View>

        <View style={styles.headerButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons
              name="document-text-outline"
              size={28}
              color={colors.primary}
            />
          </View>

          <View style={styles.introTextContainer}>
            <Text style={styles.introTitle}>
              Prescription Scanner
            </Text>

            <Text style={styles.introDescription}>
              Photograph a prescription or choose an existing image.
              DoseWise will let you review the information before anything
              is added to your medication list.
            </Text>
          </View>
        </View>

        {!imageUri ? (
          <>
            <View style={styles.scannerCard}>
              <View style={styles.scanGraphic}>
                <View style={styles.scanDocument}>
                  <View style={styles.scanDocumentHeader}>
                    <View style={styles.miniCross}>
                      <Ionicons
                        name="medical"
                        size={17}
                        color={colors.white}
                      />
                    </View>

                    <View style={styles.documentHeadingLines}>
                      <View style={styles.documentLineLong} />
                      <View style={styles.documentLineShort} />
                    </View>
                  </View>

                  <View style={styles.documentBody}>
                    <View style={styles.bodyLineLarge} />
                    <View style={styles.bodyLineMedium} />
                    <View style={styles.bodyLineSmall} />

                    <View style={styles.pillRow}>
                      <Ionicons
                        name="medical-outline"
                        size={20}
                        color={colors.secondary}
                      />

                      <View style={styles.pillLines}>
                        <View style={styles.pillLineOne} />
                        <View style={styles.pillLineTwo} />
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.scanCornerTopLeft} />
                <View style={styles.scanCornerTopRight} />
                <View style={styles.scanCornerBottomLeft} />
                <View style={styles.scanCornerBottomRight} />
              </View>

              <Text style={styles.scannerTitle}>
                Add your prescription
              </Text>

              <Text style={styles.scannerDescription}>
                Make sure the medication name, dosage and instructions are
                clearly visible.
              </Text>

              <Pressable
                onPress={takePhoto}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                <Ionicons
                  name="camera-outline"
                  size={21}
                  color={colors.white}
                />

                <Text style={styles.primaryButtonText}>
                  Take a Photo
                </Text>
              </Pressable>

              <Pressable
                onPress={chooseFromGallery}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Ionicons
                  name="images-outline"
                  size={20}
                  color={colors.primary}
                />

                <Text style={styles.secondaryButtonText}>
                  Choose from Gallery
                </Text>
              </Pressable>
            </View>

            <View style={styles.tipsCard}>
              <View style={styles.sectionHeadingRow}>
                <View style={styles.smallSectionIcon}>
                  <Ionicons
                    name="bulb-outline"
                    size={19}
                    color={colors.warning}
                  />
                </View>

                <Text style={styles.sectionHeading}>
                  For a better scan
                </Text>
              </View>

              <TipRow
                icon="sunny-outline"
                title="Use good lighting"
                description="Avoid dark areas and strong shadows."
              />

              <TipRow
                icon="scan-outline"
                title="Keep the prescription flat"
                description="Capture the full page without cutting off text."
              />

              <TipRow
                icon="eye-outline"
                title="Check readability"
                description="Make sure medication names and instructions are in focus."
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <View>
                  <Text style={styles.previewTitle}>
                    Prescription Preview
                  </Text>

                  <Text style={styles.previewSubtitle}>
                    Check that the text is readable
                  </Text>
                </View>

                <View style={styles.readyBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.success}
                  />

                  <Text style={styles.readyBadgeText}>
                    Ready
                  </Text>
                </View>
              </View>

              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.prescriptionImage}
                  resizeMode="contain"
                />

                <View style={styles.imageOverlayTop}>
                  <View style={styles.imageStatus}>
                    <Ionicons
                      name="document-text-outline"
                      size={15}
                      color={colors.white}
                    />

                    <Text style={styles.imageStatusText}>
                      Prescription
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.previewActions}>
                <Pressable
                  onPress={takePhoto}
                  style={({ pressed }) => [
                    styles.previewActionButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="camera-reverse-outline"
                    size={20}
                    color={colors.primary}
                  />

                  <Text style={styles.previewActionText}>
                    Retake
                  </Text>
                </Pressable>

                <Pressable
                  onPress={chooseFromGallery}
                  style={({ pressed }) => [
                    styles.previewActionButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="images-outline"
                    size={20}
                    color={colors.primary}
                  />

                  <Text style={styles.previewActionText}>
                    Replace
                  </Text>
                </Pressable>

                <Pressable
                  onPress={removeImage}
                  style={({ pressed }) => [
                    styles.previewActionButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.danger}
                  />

                  <Text
                    style={[
                      styles.previewActionText,
                      styles.deleteActionText,
                    ]}
                  >
                    Remove
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.privacyCard}>
              <View style={styles.privacyIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color={colors.secondary}
                />
              </View>

              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>
                  You stay in control
                </Text>

                <Text style={styles.privacyText}>
                  DoseWise will never save detected prescription details as
                  medication records until you review and confirm them.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={analysePrescription}
              disabled={isProcessing}
              style={({ pressed }) => [
                styles.scanButton,
                pressed &&
                  !isProcessing &&
                  styles.primaryButtonPressed,
                isProcessing && styles.disabledButton,
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator
                  size="small"
                  color={colors.white}
                />
              ) : (
                <Ionicons
                  name="scan-outline"
                  size={22}
                  color={colors.white}
                />
              )}

              <Text style={styles.scanButtonText}>
                {isProcessing
                  ? 'Preparing Review...'
                  : 'Review Prescription'}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showReview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReview(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => setShowReview(false)}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="close"
                size={24}
                color={colors.text}
              />
            </Pressable>

            <View style={styles.modalHeaderText}>
              <Text style={styles.modalTitle}>
                Review Details
              </Text>

              <Text style={styles.modalSubtitle}>
                Confirm what you can read
              </Text>
            </View>

            <View style={styles.headerButtonPlaceholder} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.reviewNotice}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={colors.primary}
              />

              <Text style={styles.reviewNoticeText}>
                Automatic text extraction is not connected yet. You can
                review the image and enter the visible details manually.
                Later, DoseWise will fill these fields automatically for
                you to confirm.
              </Text>
            </View>

            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.reviewImage}
                resizeMode="contain"
              />
            )}

            <FormField
              label="Medication name"
              placeholder="e.g. Amoxicillin"
              value={reviewData.medicationName}
              onChangeText={(value) =>
                setReviewData((current) => ({
                  ...current,
                  medicationName: value,
                }))
              }
            />

            <FormField
              label="Dosage"
              placeholder="e.g. 500 mg"
              value={reviewData.dosage}
              onChangeText={(value) =>
                setReviewData((current) => ({
                  ...current,
                  dosage: value,
                }))
              }
            />

            <FormField
              label="Frequency"
              placeholder="e.g. Twice daily"
              value={reviewData.frequency}
              onChangeText={(value) =>
                setReviewData((current) => ({
                  ...current,
                  frequency: value,
                }))
              }
            />

            <Text style={styles.inputLabel}>
              Instructions
            </Text>

            <TextInput
              value={reviewData.instructions}
              onChangeText={(value) =>
                setReviewData((current) => ({
                  ...current,
                  instructions: value,
                }))
              }
              placeholder="e.g. Take after food"
              placeholderTextColor={colors.textLight}
              multiline
              textAlignVertical="top"
              style={[
                styles.input,
                styles.instructionsInput,
              ]}
            />

            <View style={styles.warningCard}>
              <Ionicons
                name="warning-outline"
                size={21}
                color={colors.warning}
              />

              <Text style={styles.warningText}>
                Always compare medication details with the original
                prescription before saving them.
              </Text>
            </View>

            <Pressable
              onPress={continueToMedication}
              style={({ pressed }) => [
                styles.primaryButton,
                styles.reviewContinueButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                Continue to Medication
              </Text>

              <Ionicons
                name="arrow-forward"
                size={20}
                color={colors.white}
              />
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function TipRow({
  icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipIcon}>
        <Ionicons
          name={icon}
          size={19}
          color={colors.primary}
        />
      </View>

      <View style={styles.tipContent}>
        <Text style={styles.tipTitle}>
          {title}
        </Text>

        <Text style={styles.tipDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function FormField({
  label,
  placeholder,
  value,
  onChangeText,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    minHeight: 72,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerButtonPlaceholder: {
    width: 42,
    height: 42,
  },

  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  pressed: {
    opacity: 0.65,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },

  introCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  introTextContainer: {
    flex: 1,
  },

  introTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 5,
  },

  introDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  scannerCard: {
    backgroundColor: colors.white,
    borderRadius: 26,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  scanGraphic: {
    width: 185,
    height: 185,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  scanDocument: {
    width: 128,
    height: 154,
    borderRadius: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },

  scanDocumentHeader: {
    padding: 11,
    backgroundColor: colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
  },

  miniCross: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  documentHeadingLines: {
    flex: 1,
  },

  documentLineLong: {
    height: 6,
    borderRadius: 4,
    backgroundColor: '#B8D3F6',
    marginBottom: 5,
  },

  documentLineShort: {
    width: '65%',
    height: 5,
    borderRadius: 4,
    backgroundColor: '#D0E1F7',
  },

  documentBody: {
    padding: 12,
  },

  bodyLineLarge: {
    width: '90%',
    height: 6,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginBottom: 8,
  },

  bodyLineMedium: {
    width: '74%',
    height: 6,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginBottom: 8,
  },

  bodyLineSmall: {
    width: '55%',
    height: 6,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginBottom: 17,
  },

  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  pillLines: {
    flex: 1,
    marginLeft: 8,
  },

  pillLineOne: {
    height: 5,
    borderRadius: 4,
    backgroundColor: '#BCECE3',
    marginBottom: 6,
  },

  pillLineTwo: {
    width: '62%',
    height: 5,
    borderRadius: 4,
    backgroundColor: '#D9F4EF',
  },

  scanCornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 34,
    height: 34,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary,
    borderTopLeftRadius: 12,
  },

  scanCornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 34,
    height: 34,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary,
    borderTopRightRadius: 12,
  },

  scanCornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 34,
    height: 34,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary,
    borderBottomLeftRadius: 12,
  },

  scanCornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary,
    borderBottomRightRadius: 12,
  },

  scannerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },

  scannerDescription: {
    marginTop: 7,
    marginBottom: 20,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  primaryButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  primaryButtonPressed: {
    opacity: 0.88,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },

  secondaryButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 11,
  },

  secondaryButtonPressed: {
    opacity: 0.7,
  },

  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },

  tipsCard: {
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  smallSectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#FFF7E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },

  tipIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  tipContent: {
    flex: 1,
  },

  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  tipDescription: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  previewCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  previewTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },

  previewSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textSecondary,
  },

  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.secondaryLight,
  },

  readyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.success,
  },

  imageContainer: {
    height: 390,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSoft,
  },

  prescriptionImage: {
    width: '100%',
    height: '100%',
  },

  imageOverlayTop: {
    position: 'absolute',
    top: 10,
    left: 10,
  },

  imageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 27, 58, 0.78)',
  },

  imageStatusText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },

  previewActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  previewActionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewActionText: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },

  deleteActionText: {
    color: colors.danger,
  },

  privacyCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 18,
    backgroundColor: colors.secondaryLight,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  privacyIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  privacyContent: {
    flex: 1,
  },

  privacyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  privacyText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  scanButton: {
    minHeight: 56,
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  scanButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },

  disabledButton: {
    opacity: 0.65,
  },

  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  modalHeader: {
    minHeight: 70,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  modalHeaderText: {
    flex: 1,
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },

  modalSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textSecondary,
  },

  modalContent: {
    padding: 18,
    paddingBottom: 40,
  },

  reviewNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    marginBottom: 16,
  },

  reviewNoticeText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  reviewImage: {
    width: '100%',
    height: 210,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    marginBottom: 20,
  },

  formField: {
    marginBottom: 15,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 7,
  },

  input: {
    minHeight: 52,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    fontSize: 14,
    color: colors.text,
  },

  instructionsInput: {
    minHeight: 105,
    paddingTop: 14,
    paddingBottom: 14,
  },

  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 14,
    borderRadius: 17,
    backgroundColor: '#FFF7E8',
  },

  warningText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  reviewContinueButton: {
    marginTop: 20,
  },
});