import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/FontAwesome';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GENAI_API_KEY,OPENAI_API_KEY, OPENAI_API_URL} from '@env';

const API_KEY = GENAI_API_KEY; // Replace with your actual Gemini API key
const genAI = new GoogleGenerativeAI(API_KEY);

const ResumeTailoringScreen = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState(null);
  const [score, setScore] = useState(0);
  const [tailoredResume, setTailoredResume] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFullScreenResume, setShowFullScreenResume] = useState(false);

  const handlePickResume = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });
      setResume(result[0]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled the picker');
      } else {
        console.error('Error picking resume:', err);
        Alert.alert('Error', 'Failed to pick resume');
      }
    }
  };

  const handleTailorResume = async () => {
    if (!resume || !jobDescription) {
      Alert.alert('Error', 'Please upload a resume and provide a job description');
      return;
    }
  
    setIsLoading(true);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Placeholder for the resume content
    const resumePlaceholder = "This is a placeholder for the resume content. In a real application, you would extract the text content from the PDF.";

    // Score the resume
    const scorePrompt = `Given the following job description and resume, provide a score out of 100 for how well the resume matches the job description. Only return the numeric score.

Job Description:
${jobDescription}

Resume:
${resumePlaceholder}`;

    const scoreResult = await model.generateContent(scorePrompt);

    if (!scoreResult || !scoreResult.response || typeof scoreResult.response.text !== 'function') {
      throw new Error('Unexpected response structure when scoring the resume.');
    }

    const scoreText = await scoreResult.response.text();  // Calling the text function to get the text content
    const newScore = parseInt(scoreText.trim(), 10);
    if (isNaN(newScore)) {
      throw new Error('Failed to parse the score from the response.');
    }
    setScore(newScore);
  
      // Tailor the resume
      const tailorPrompt = `Given the following job description and resume, provide a tailored version of the resume that better matches the job description. Only return the tailored resume content.
  
  Job Description:
  ${jobDescription}
  
  Resume:
  ${resumePlaceholder}`;
  
      const tailorResult = await model.generateContent(tailorPrompt);
  
      if (!tailorResult || !tailorResult.response || typeof tailorResult.response.text !== 'function') {
        throw new Error('Unexpected response structure when tailoring the resume.');
      }
  
      const newResume = await tailorResult.response.text(); // Calling the text function to get the text content
      setTailoredResume(newResume.trim());
    } catch (error) {
      console.error('Error tailoring resume:', error.message);
      Alert.alert('Error', 'Failed to tailor resume');
    } finally {
      setIsLoading(false);
    }
  };
  
  
  
  const handleDownloadResume = () => {
    if (!tailoredResume) {
      Alert.alert('Error', 'No tailored resume available');
      return;
    }

    // Implement logic to download the tailored resume
    Alert.alert('Success', 'Resume downloaded successfully');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Resume Tailor</Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Upload Resume</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={handlePickResume}>
              <Icon name="upload" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>
                {resume ? resume.name : 'Select PDF'}
              </Text>
            </TouchableOpacity>
            {resume && (
              <TouchableOpacity
                style={styles.viewResumeButton}
                onPress={() => setShowFullScreenResume(true)}
              >
                <Text style={styles.viewResumeButtonText}>View Resume</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Job Description</Text>
            <TextInput
              style={styles.input}
              onChangeText={setJobDescription}
              value={jobDescription}
              multiline
              numberOfLines={4}
              placeholder="Enter job description"
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleTailorResume}>
            <Icon name="magic" size={24} color="#fff" />
            <Text style={styles.buttonText}>Tailor Resume</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Tailoring resume...</Text>
          </View>
        ) : (
          <>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreCard}>
                <Text style={styles.scoreTitle}>Match Score</Text>
                <Text style={styles.scoreValue}>{score}/100</Text>
                {score < 80 && (
                  <View style={styles.lowScoreWarning}>
                    <Icon name="exclamation-triangle" size={24} color="#ff9800" />
                    <Text style={styles.lowScoreText}>Your resume needs improvement</Text>
                  </View>
                )}
              </View>
              <LineChart
                data={{
                  labels: ['Current', 'Target'],
                  datasets: [{ data: [score, 100] }],
                }}
                width={300}
                height={200}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                }}
                bezier
                style={styles.chart}
              />
            </View>

            {tailoredResume && (
              <View style={styles.tailoredResumeContainer}>
                <Text style={styles.cardTitle}>Tailored Resume</Text>
                <TextInput
                  style={[styles.input, styles.tailoredResumeInput]}
                  value={tailoredResume}
                  multiline
                  numberOfLines={10}
                  editable={false}
                />
                <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadResume}>
                  <Icon name="download" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Download</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <Modal
          visible={showFullScreenResume}
          animationType="slide"
          onRequestClose={() => setShowFullScreenResume(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>{resume?.name}</Text>
              <Text style={styles.resumeContent}>
                PDF content cannot be displayed directly. In a real application, you would integrate a PDF viewer library here.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFullScreenResume(false)}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  cardContainer: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    borderColor: '#ddd',
    borderWidth: 1,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#333',
  },
  uploadButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  viewResumeButton: {
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewResumeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007bff',
  },
  lowScoreWarning: {
    marginTop: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  lowScoreText: {
    color: '#ff9800',
    fontSize: 16,
    marginLeft: 5,
  },
  chart: {
    marginVertical: 10,
    borderRadius: 16,
  },
  tailoredResumeContainer: {
    marginBottom: 20,
  },
  tailoredResumeInput: {
    height: 200,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    borderColor: '#ddd',
    borderWidth: 1,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#333',
  },
  downloadButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  resumeContent: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
  },
});


export default ResumeTailoringScreen;