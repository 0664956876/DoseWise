import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
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
import * as Location from 'expo-location';

import { colors } from '../theme/colors';

type Coordinates = {
  latitude: number;
  longitude: number;
};

export default function PharmaciesScreen({ navigation }: any) {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState('Finding your location...');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      setLocationError(null);

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocation(null);
        setLocationName('Location permission not granted');
        setLocationError(
          'Allow location access so DoseWise can help you search for pharmacies near you.'
        );

        return;
      }

      const currentPosition =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      const coords = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };

      setLocation(coords);

      try {
        const addresses = await Location.reverseGeocodeAsync(coords);

        if (addresses.length > 0) {
          const address = addresses[0];

          const parts = [
            address.district,
            address.city,
            address.subregion,
            address.region,
          ].filter(
            (value, index, array) =>
              value && array.indexOf(value) === index
          );

          if (parts.length > 0) {
            setLocationName(parts.slice(0, 2).join(', '));
          } else {
            setLocationName('Current location');
          }
        } else {
          setLocationName('Current location');
        }
      } catch (reverseError) {
        console.log('Reverse geocoding error:', reverseError);
        setLocationName('Current location');
      }
    } catch (error) {
      console.error('Location error:', error);

      setLocation(null);
      setLocationName('Location unavailable');
      setLocationError(
        'DoseWise could not determine your location. Check that location services are enabled and try again.'
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const openPharmacySearch = async (query = 'pharmacy') => {
    const cleanQuery = query.trim() || 'pharmacy';

    let url = '';

    if (location) {
      const encodedQuery = encodeURIComponent(cleanQuery);

      if (Platform.OS === 'ios') {
        url =
          `http://maps.apple.com/?q=${encodedQuery}` +
          `&ll=${location.latitude},${location.longitude}`;
      } else {
        url =
          `https://www.google.com/maps/search/?api=1` +
          `&query=${encodedQuery}` +
          `&query_place_id=`;
      }
    } else {
      const encodedQuery = encodeURIComponent(cleanQuery);

      if (Platform.OS === 'ios') {
        url = `http://maps.apple.com/?q=${encodedQuery}`;
      } else {
        url =
          `https://www.google.com/maps/search/?api=1` +
          `&query=${encodedQuery}`;
      }
    }

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          'Maps unavailable',
          'DoseWise could not open a maps application on this device.'
        );
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error('Map opening error:', error);

      Alert.alert(
        'Unable to open maps',
        'Something went wrong while opening the pharmacy search.'
      );
    }
  };

  const searchPharmacy = () => {
    const query = searchText.trim();

    if (!query) {
      openPharmacySearch('pharmacy');
      return;
    }

    openPharmacySearch(`${query} pharmacy`);
  };

  const openDirectionsSearch = () => {
    openPharmacySearch('pharmacy');
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

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Nearby Pharmacies
          </Text>

          <Text style={styles.headerSubtitle}>
            Find medication near you
          </Text>
        </View>

        <Pressable
          onPress={getCurrentLocation}
          disabled={loadingLocation}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          {loadingLocation ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />
          ) : (
            <Ionicons
              name="locate-outline"
              size={22}
              color={colors.primary}
            />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Ionicons
              name="location"
              size={23}
              color={colors.primary}
            />
          </View>

          <View style={styles.locationContent}>
            <Text style={styles.locationLabel}>
              Your location
            </Text>

            {loadingLocation ? (
              <View style={styles.locationLoadingRow}>
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                />

                <Text style={styles.locationLoadingText}>
                  Finding your location...
                </Text>
              </View>
            ) : (
              <Text style={styles.locationName}>
                {locationName}
              </Text>
            )}
          </View>

          {!loadingLocation && (
            <Pressable
              onPress={getCurrentLocation}
              style={({ pressed }) => [
                styles.refreshLocationButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="refresh"
                size={18}
                color={colors.primary}
              />
            </Pressable>
          )}
        </View>

        {locationError && (
          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Ionicons
                name="location-outline"
                size={22}
                color={colors.warning}
              />
            </View>

            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>
                Location access needed
              </Text>

              <Text style={styles.errorText}>
                {locationError}
              </Text>

              <Pressable
                onPress={getCurrentLocation}
                style={({ pressed }) => [
                  styles.tryAgainButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.tryAgainText}>
                  Try Again
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons
                name="medical"
                size={30}
                color={colors.white}
              />
            </View>

            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>
                Find a pharmacy
              </Text>

              <Text style={styles.heroDescription}>
                Search pharmacies around your current area and open the
                results in your maps application.
              </Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color={colors.textSecondary}
            />

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={searchPharmacy}
              returnKeyType="search"
              placeholder="Search pharmacy name"
              placeholderTextColor={colors.textLight}
              style={styles.searchInput}
            />

            {searchText.length > 0 && (
              <Pressable
                onPress={() => setSearchText('')}
                hitSlop={10}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textLight}
                />
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={searchPharmacy}
            style={({ pressed }) => [
              styles.heroButton,
              pressed && styles.heroButtonPressed,
            ]}
          >
            <Ionicons
              name="map-outline"
              size={20}
              color={colors.primary}
            />

            <Text style={styles.heroButtonText}>
              Search Nearby Pharmacies
            </Text>

            <Ionicons
              name="arrow-forward"
              size={19}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>
          Quick Search
        </Text>

        <Text style={styles.sectionDescription}>
          Choose what you need and DoseWise will search around your area.
        </Text>

        <View style={styles.quickGrid}>
          <QuickSearchCard
            icon="medical-outline"
            title="Pharmacies"
            description="Find nearby pharmacies"
            onPress={() => openPharmacySearch('pharmacy')}
          />

          <QuickSearchCard
            icon="time-outline"
            title="Open Now"
            description="Search open pharmacies"
            onPress={() =>
              openPharmacySearch('pharmacy open now')
            }
          />

          <QuickSearchCard
            icon="moon-outline"
            title="24 Hour"
            description="Find 24-hour options"
            onPress={() =>
              openPharmacySearch('24 hour pharmacy')
            }
          />

          <QuickSearchCard
            icon="business-outline"
            title="Clinic Pharmacy"
            description="Search medical centres"
            onPress={() =>
              openPharmacySearch('clinic pharmacy')
            }
          />
        </View>

        <View style={styles.mapPreviewCard}>
          <View style={styles.mapPattern}>
            <View style={styles.roadHorizontalOne} />
            <View style={styles.roadHorizontalTwo} />
            <View style={styles.roadVerticalOne} />
            <View style={styles.roadVerticalTwo} />

            <View style={styles.mapMarkerOne}>
              <Ionicons
                name="medical"
                size={16}
                color={colors.white}
              />
            </View>

            <View style={styles.mapMarkerTwo}>
              <Ionicons
                name="medical"
                size={14}
                color={colors.white}
              />
            </View>

            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationDot} />
            </View>
          </View>

          <View style={styles.mapContent}>
            <View style={styles.mapTextContainer}>
              <Text style={styles.mapTitle}>
                Explore on Maps
              </Text>

              <Text style={styles.mapDescription}>
                View real pharmacy results, directions and available
                business information using your maps app.
              </Text>
            </View>

            <Pressable
              onPress={openDirectionsSearch}
              style={({ pressed }) => [
                styles.mapButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="navigate-outline"
                size={19}
                color={colors.white}
              />

              <Text style={styles.mapButtonText}>
                Open Maps
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={colors.primary}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              About pharmacy information
            </Text>

            <Text style={styles.infoText}>
              Pharmacy availability, opening hours, contact details and
              medicine stock can change. Confirm important information
              directly with the pharmacy before travelling.
            </Text>
          </View>
        </View>

        <View style={styles.futureCard}>
          <View style={styles.futureHeader}>
            <View style={styles.futureIcon}>
              <Ionicons
                name="sparkles-outline"
                size={21}
                color={colors.secondary}
              />
            </View>

            <View style={styles.futureHeadingContainer}>
              <Text style={styles.futureTitle}>
                Coming to DoseWise
              </Text>

              <Text style={styles.futureSubtitle}>
                Integrated pharmacy experience
              </Text>
            </View>
          </View>

          <FeatureRow
            icon="map-outline"
            text="Interactive pharmacy map inside DoseWise"
          />

          <FeatureRow
            icon="call-outline"
            text="Call pharmacies directly from results"
          />

          <FeatureRow
            icon="time-outline"
            text="Live opening hours where available"
          />

          <FeatureRow
            icon="navigate-outline"
            text="Distance and turn-by-turn directions"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickSearchCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: any;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickCard,
        pressed && styles.quickCardPressed,
      ]}
    >
      <View style={styles.quickIcon}>
        <Ionicons
          name={icon}
          size={22}
          color={colors.primary}
        />
      </View>

      <Text style={styles.quickTitle}>
        {title}
      </Text>

      <Text style={styles.quickDescription}>
        {description}
      </Text>

      <View style={styles.quickArrow}>
        <Ionicons
          name="arrow-forward"
          size={16}
          color={colors.primary}
        />
      </View>
    </Pressable>
  );
}

function FeatureRow({
  icon,
  text,
}: {
  icon: any;
  text: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons
          name={icon}
          size={17}
          color={colors.secondary}
        />
      </View>

      <Text style={styles.featureText}>
        {text}
      </Text>

      <Ionicons
        name="checkmark-circle"
        size={18}
        color={colors.success}
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

  headerCenter: {
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
    paddingBottom: 42,
  },

  locationCard: {
    minHeight: 74,
    borderRadius: 20,
    padding: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  locationContent: {
    flex: 1,
  },

  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 3,
  },

  locationName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },

  locationLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationLoadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.textSecondary,
  },

  refreshLocationButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 19,
    backgroundColor: '#FFF7E8',
    marginBottom: 14,
  },

  errorIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  errorText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  tryAgainButton: {
    alignSelf: 'flex-start',
    marginTop: 9,
  },

  tryAgainText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },

  heroCard: {
    borderRadius: 26,
    padding: 20,
    backgroundColor: colors.primary,
    marginBottom: 24,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.17)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  heroTextContainer: {
    flex: 1,
  },

  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },

  heroDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.82)',
  },

  searchContainer: {
    minHeight: 54,
    borderRadius: 17,
    paddingHorizontal: 15,
    marginTop: 18,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    color: colors.text,
  },

  heroButton: {
    minHeight: 52,
    marginTop: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  heroButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },

  heroButtonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
  },

  sectionDescription: {
    marginTop: 4,
    marginBottom: 13,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 24,
  },

  quickCard: {
    width: '48.4%',
    minHeight: 151,
    padding: 15,
    borderRadius: 21,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  quickCardPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },

  quickIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  quickTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },

  quickDescription: {
    marginTop: 3,
    paddingRight: 16,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
  },

  quickArrow: {
    position: 'absolute',
    right: 13,
    bottom: 13,
  },

  mapPreviewCard: {
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 15,
  },

  mapPattern: {
    height: 175,
    backgroundColor: '#EAF3F0',
    overflow: 'hidden',
  },

  roadHorizontalOne: {
    position: 'absolute',
    top: 42,
    left: -30,
    width: '125%',
    height: 15,
    backgroundColor: colors.white,
    transform: [{ rotate: '-7deg' }],
  },

  roadHorizontalTwo: {
    position: 'absolute',
    bottom: 40,
    left: -25,
    width: '125%',
    height: 12,
    backgroundColor: colors.white,
    transform: [{ rotate: '9deg' }],
  },

  roadVerticalOne: {
    position: 'absolute',
    left: '28%',
    top: -30,
    width: 13,
    height: 240,
    backgroundColor: colors.white,
    transform: [{ rotate: '12deg' }],
  },

  roadVerticalTwo: {
    position: 'absolute',
    right: '25%',
    top: -30,
    width: 11,
    height: 240,
    backgroundColor: colors.white,
    transform: [{ rotate: '-15deg' }],
  },

  mapMarkerOne: {
    position: 'absolute',
    top: 31,
    right: 57,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },

  mapMarkerTwo: {
    position: 'absolute',
    bottom: 27,
    left: 49,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },

  currentLocationMarker: {
    position: 'absolute',
    top: 77,
    left: '48%',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(8,102,232,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  currentLocationDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
  },

  mapContent: {
    padding: 17,
  },

  mapTextContainer: {
    marginBottom: 14,
  },

  mapTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  mapDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  mapButton: {
    minHeight: 49,
    borderRadius: 15,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  mapButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },

  infoCard: {
    padding: 15,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  infoText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  futureCard: {
    padding: 17,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  futureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  futureIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  futureHeadingContainer: {
    flex: 1,
  },

  futureTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  futureSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textSecondary,
  },

  featureRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  featureIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  featureText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    paddingRight: 8,
  },
});