import React from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import MainTabs from './MainTabs';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

import AddMedicationScreen from '../screens/AddMedicationScreen';
import MedicationDetailsScreen from '../screens/MedicationDetailsScreen';
import EditMedicationScreen from '../screens/EditMedicationScreen';

import SettingsScreen from '../screens/SettingsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import PrescriptionScannerScreen from '../screens/PrescriptionScannerScreen';
import PharmaciesScreen from '../screens/PharmaciesScreen';

import CaregiverScreen from '../screens/CaregiverScreen';
import CaregiverPatientScreen from '../screens/CaregiverPatientScreen';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

const Stack =
  createNativeStackNavigator();

export default function AppNavigator() {
  const {
    session,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,

          contentStyle: {
            backgroundColor:
              colors.background,
          },
        }}
      >
        {session ? (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
            />

            <Stack.Screen
              name="AddMedication"
              component={
                AddMedicationScreen
              }
              options={{
                animation:
                  'slide_from_bottom',
              }}
            />

            <Stack.Screen
              name="MedicationDetails"
              component={
                MedicationDetailsScreen
              }
              options={{
                animation:
                  'slide_from_right',
              }}
            />

            <Stack.Screen
              name="EditMedication"
              component={
                EditMedicationScreen
              }
              options={{
                animation:
                  'slide_from_right',
              }}
            />

            <Stack.Screen
              name="Settings"
              component={
                SettingsScreen
              }
              options={{
                animation:
                  'slide_from_right',
              }}
            />

            <Stack.Screen
              name="Reports"
              component={
                ReportsScreen
              }
              options={{
                animation:
                  'slide_from_right',
              }}
            />

            <Stack.Screen
              name="Emergency"
              component={
                EmergencyScreen
              }
              options={{
                animation:
                  'slide_from_right',
              }}
            />

            <Stack.Screen
              name="Caregiver"
              component={
                CaregiverScreen
              }
              options={{
                animation:
                  'slide_from_right',
              }}
            />

            <Stack.Screen
              name="CaregiverPatient"
              component={
                CaregiverPatientScreen
              }
              options={{
                animation:
                  'slide_from_right',
              }}
            />

            <Stack.Screen
              name="AIAssistant"
              component={
                AIAssistantScreen
              }
              options={{
                animation:
                  'slide_from_bottom',
              }}
            />

            <Stack.Screen
              name="PrescriptionScanner"
              component={
                PrescriptionScannerScreen
              }
              options={{
                animation:
                  'slide_from_bottom',
              }}
            />

            <Stack.Screen
              name="Pharmacies"
              component={
                PharmaciesScreen
              }
              options={{
                animation:
                  'slide_from_right',
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={
                LoginScreen
              }
            />

            <Stack.Screen
              name="Signup"
              component={
                SignupScreen
              }
            />

            <Stack.Screen
              name="ForgotPassword"
              component={
                ForgotPasswordScreen
              }
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles =
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        colors.background,
    },
  });