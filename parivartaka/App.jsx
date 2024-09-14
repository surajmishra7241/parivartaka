import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from './screens/Dashboard';
import Base64Converter from './screens/Base64Converter';
import ObjectIdentificationScreen from './screens/ObjectIdentifier';
import ResumeTailorScreen from './screens/Tools/ResumeTailoring';
import EassyWriting from './screens/Tools/EassyWriting';
import ParagraphWriting from './screens/Tools/ParagraphWriting';
import ContentImprover from './screens/Tools/ContentImprover';
import ImageGeneratorDashboard from './screens/Tools/ImageGenerator';
import AiTranslator from './screens/Tools/AiTranslator';
import QRGenerator from './screens/Tools/QRGenerator';
import YouTubeTranscriptGenerator from './screens/Tools/YouTubeTranscript';
import TextSummarizer from './screens/Tools/TextSummarizer';
import InterviewAssistant from './screens/Tools/InterviewAssistent';
import MeetingSummary from './screens/Tools/MeetingSummary';
import EmailAssistant from './screens/Tools/EmailAssistant';
import NoteTaking from './screens/Tools/NoteTaking';
import Chatbot from './screens/Tools/ChatBot';
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
        <Stack.Screen name="ParagraphWriting" component={ParagraphWriting} />
        <Stack.Screen name="ContentImprover" component={ContentImprover} />
        <Stack.Screen name="ImageGeneratorDashboard" component={ImageGeneratorDashboard} />
        <Stack.Screen name="AiTranslator"  options={{ headerShown: false }} component={AiTranslator} />
        <Stack.Screen name="QRGenerator" component={QRGenerator} />
        <Stack.Screen name="YouTubeTranscriptGenerator" component={YouTubeTranscriptGenerator} />
        <Stack.Screen name="TextSummarizer" component={TextSummarizer} />
        <Stack.Screen name="InterviewAssistant" component={InterviewAssistant} />
        <Stack.Screen name="MeetingSummary" component={MeetingSummary} />
        <Stack.Screen name="EmailAssistant" component={EmailAssistant} />
        <Stack.Screen name="NoteTaking" component={NoteTaking} />
        <Stack.Screen name="Chatbot" component={Chatbot} />
        {/* Add other converters here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
