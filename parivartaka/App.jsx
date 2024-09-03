import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from './screens/Dashboard';
import Base64Converter from './screens/Base64Converter';
import ObjectIdentificationScreen from './screens/ObjectIdentifier';
import ResumeTailorScreen from './screens/Tools/ResumeTailoring';
import EassyWriting from './screens/Tools/EassyWriting';
// Import other converters

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Dashboard">
        <Stack.Screen 
        options={{
        headerShown: false,
      }} name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Base64Converter" component={Base64Converter} />
        <Stack.Screen name="ObjectIdentifier" component={ObjectIdentificationScreen} />
        <Stack.Screen name="ResumeTailoringScreen" component={ResumeTailorScreen} />
        <Stack.Screen name="EassyWriting" component={EassyWriting} />
        {/* Add other converters here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
