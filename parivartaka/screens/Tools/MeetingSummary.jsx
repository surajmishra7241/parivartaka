// App.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Clipboard,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

// Initialize the Google Generative AI with your API key
import { GENAI_API_KEY,OPENAI_API_KEY, OPENAI_API_URL} from '@env';
const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

const MeetingSummary = () => {
  const [meetingNotes, setMeetingNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    if (meetingNotes.trim() === '') {
      Alert.alert('Error', 'Please enter meeting notes before generating a summary.');
      return;
    }

    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(`Summarize these meeting notes in bullet points: ${meetingNotes}`);
      setSummary(result.response.text());
    } catch (error) {
      console.error('Error generating summary:', error);
      Alert.alert('Error', 'An error occurred while generating the summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(summary);
    Alert.alert('Success', 'Summary copied to clipboard!');
  };

  const shareSummary = async () => {
    try {
      await Share.open({
        message: summary,
        title: 'Meeting Summary',
      });
    } catch (error) {
      console.error('Error sharing summary:', error);
      Alert.alert('Error', 'Failed to share the summary. Please try again.');
    }
  };

  const downloadSummary = async () => {
    try {
      const path = `${RNFS.DocumentDirectoryPath}/meeting_summary_${Date.now()}.txt`;
      await RNFS.writeFile(path, summary, 'utf8');
      Alert.alert('Success', `Summary saved to: ${path}`);
    } catch (error) {
      console.error('Error downloading summary:', error);
      Alert.alert('Error', 'Failed to download the summary. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Icon name="summarize" size={40} color="#FF9800" />
            <Text style={styles.title}>Meeting Summarizer</Text>
          </View>
          
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Enter meeting notes..."
              value={meetingNotes}
              onChangeText={setMeetingNotes}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.button} onPress={generateSummary} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Generate Summary</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {summary !== '' && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Meeting Summary:</Text>
              <Text style={styles.summaryText}>{summary}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.iconButton} onPress={copyToClipboard}>
                  <Icon name="content-copy" size={24} color="#4A90E2" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={shareSummary}>
                  <Icon name="share" size={24} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={downloadSummary}>
                  <Icon name="file-download" size={24} color="#FF9800" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E0',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  input: {
    height: 150,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingTop: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  summaryText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  iconButton: {
    padding: 10,
    marginLeft: 10,
  },
});

export default MeetingSummary;