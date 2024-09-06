import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Dimensions, StatusBar } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { GoogleGenerativeAI } from '@google/generative-ai';
import RNFS from 'react-native-fs';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GENAI_API_KEY,OPENAI_API_KEY, OPENAI_API_URL} from '@env';

const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

const { width } = Dimensions.get('window');

const ObjectIdentificationScreen = () => {
  const [image, setImage] = useState(null);
  const [objectInfo, setObjectInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = (useCamera) => {
    const options = {
      width: 300,
      height: 300,
      cropping: true,
      includeBase64: false,
      compressImageMaxWidth: 300,
      compressImageMaxHeight: 300,
      compressImageQuality: 0.8,
    };

    const method = useCamera ? ImagePicker.openCamera : ImagePicker.openPicker;

    method(options)
      .then(handleImageResult)
      .catch(error => {
        if (error.message.includes('User cancelled image selection')) {
          // Handle the case where the user cancels the image picker
          console.log('User cancelled image selection.');
          setObjectInfo({ error: 'Image selection was cancelled.' });
        } else {
          // Handle other errors
          console.error(`Error ${useCamera ? 'taking' : 'uploading'} photo:`, error);
          setObjectInfo({ error: `Error ${useCamera ? 'taking' : 'uploading'} photo. Please try again.` });
        }
      });
  };

  const handleImageResult = async (response) => {
    if (!response || !response.path) {
      console.error('Invalid image picker response.');
      setObjectInfo({ error: 'Error processing image. Please try again.' });
      return;
    }

    setImage(response.path);
    try {
      const base64 = await RNFS.readFile(response.path, 'base64');
      await identifyObject(base64);
    } catch (error) {
      console.error('Error reading file:', error);
      setObjectInfo({ error: 'Error reading image file. Please try again.' });
    }
  };

  const identifyObject = async (base64Image) => {
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      try {
        const result = await model.generateContent([
          'Identify the object in this image and provide detailed information about it. Format the response as JSON with the following structure: { "objectName": "Name of the object", "description": "Brief description", "details": { "category": "Object category", "features": ["Feature 1", "Feature 2", ...], "uses": ["Use 1", "Use 2", ...] } }',
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        ]);
        
        console.log('Gemini AI response received');
        
        const parsedResult = JSON.parse(result.response.text());
        setObjectInfo(parsedResult);
      } catch (aiError) {
        console.error('Error in Gemini AI processing:', aiError);
        setObjectInfo({ error: 'Error processing image with AI. Please try again.' });
      }
    } catch (error) {
      console.error('Error in identifyObject function:', error);
      setObjectInfo({ error: 'Unexpected error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#5DADE2', '#BBDEFB', '#90CAF9']} style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Icon name="image-search" size={40} color="#fff" />
          <Text style={styles.title}>Object Lens</Text>
        </View>

        <View style={styles.cardContainer}>
          <Text style={styles.cardTitle}>Identify Objects in Images</Text>
          <Text style={styles.cardSubtitle}>Take a photo or upload an image to get started</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => pickImage(true)}>
              <Icon name="camera" size={24} color="#1a2a6c" />
              <Text style={styles.buttonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => pickImage(false)}>
              <Icon name="image" size={24} color="#1a2a6c" />
              <Text style={styles.buttonText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {!image && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>How it works:</Text>
              <View style={styles.instructionItem}>
                <Icon name="numeric-1-circle" size={24} color="#fdbb2d" />
                <Text style={styles.instructionText}>Choose an image</Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="numeric-2-circle" size={24} color="#fdbb2d" />
                <Text style={styles.instructionText}>Wait for AI analysis</Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="numeric-3-circle" size={24} color="#fdbb2d" />
                <Text style={styles.instructionText}>Get detailed object info</Text>
              </View>
            </View>
          )}

          {image && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <Icon name="loading" size={40} color="#fdbb2d" />
              <Text style={styles.loadingText}>Analyzing image...</Text>
            </View>
          )}

          {objectInfo && !objectInfo.error && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>{objectInfo.objectName}</Text>
              <Text style={styles.resultDescription}>{objectInfo.description}</Text>
              <View style={styles.detailsContainer}>
                <DetailItem icon="tag" title="Category" content={objectInfo.details.category} />
                <DetailItem icon="feature-search" title="Features" content={objectInfo.details.features} />
                <DetailItem icon="lightbulb-on" title="Uses" content={objectInfo.details.uses} />
              </View>
            </View>
          )}

          {objectInfo && objectInfo.error && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={24} color="#b21f1f" />
              <Text style={styles.errorText}>{objectInfo.error}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const DetailItem = ({ icon, title, content }) => (
  <View style={styles.detailItem}>
    <Icon name={icon} size={24} color="#1a2a6c" />
    <View style={styles.detailContent}>
      <Text style={styles.detailTitle}>{title}</Text>
      {Array.isArray(content) ? (
        content.map((item, index) => (
          <Text key={index} style={styles.detailText}>• {item}</Text>
        ))
      ) : (
        <Text style={styles.detailText}>{content}</Text>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: StatusBar.currentHeight + 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 20,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a2a6c',
    textAlign: 'center',
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#fdbb2d',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 3,
  },
  buttonText: {
    color: '#1a2a6c',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructionsContainer: {
    marginTop: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a2a6c',
    marginBottom: 10,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  image: {
    width: width - 80,
    height: width - 80,
    borderRadius: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#1a2a6c',
    marginTop: 10,
  },
  resultContainer: {
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a2a6c',
    marginBottom: 10,
  },
  resultDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    lineHeight: 24,
  },
  detailsContainer: {
    backgroundColor: 'rgba(253, 187, 45, 0.1)',
    borderRadius: 15,
    padding: 15,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  detailContent: {
    flex: 1,
    marginLeft: 15,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a2a6c',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: 'rgba(178, 31, 31, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#b21f1f',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default ObjectIdentificationScreen;
