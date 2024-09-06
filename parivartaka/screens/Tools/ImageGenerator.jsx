import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView,
  Dimensions,
  PermissionsAndroid,
  Platform,
  Alert
} from 'react-native';
import { OPENAI_API_KEY, OPENAI_API_URL } from '@env';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import RNFS from 'react-native-fs';

const { width } = Dimensions.get('window');


const ImageGeneratorDashboard = () => {
    const [prompt, setPrompt] = useState('');
    const [size, setSize] = useState('1024x1024');
    const [generatedImages, setGeneratedImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);

  useEffect(() => {
    requestStoragePermission();
  }, []);

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "App needs access to your storage to download images.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log("Storage permission denied");
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const generateImages = async () => {
    if (!prompt.trim()) {
      Alert.alert("Error", "Please enter a prompt before generating images.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(OPENAI_API_URL, {
        prompt: prompt.trim(),
        n: 1,
        size: size,
        model: "dall-e-3", // Specify the model explicitly
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      });

      if (response.data && response.data.data) {
        setGeneratedImages(response.data.data.map((item, index) => ({
          id: index.toString(),
          url: item.url,
        })));
      } else {
        throw new Error("Unexpected response structure");
      }
    } catch (error) {
      console.error('Error generating images:', error);
      let errorMessage = 'Failed to generate images. Please try again.';
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        errorMessage = `Error ${error.response.status}: ${error.response.data.error?.message || 'Unknown error'}`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        errorMessage = 'No response received from server. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleImageSelection = (id) => {
    setSelectedImages(prevSelected => 
      prevSelected.includes(id)
        ? prevSelected.filter(itemId => itemId !== id)
        : [...prevSelected, id]
    );
  };

  const downloadSelectedImages = async () => {
    setLoading(true);
    try {
      for (const id of selectedImages) {
        const image = generatedImages.find(img => img.id === id);
        if (image) {
          const date = new Date();
          const fileName = `DALL-E_${date.getTime()}.png`;
          let path = RNFS.PicturesDirectoryPath + `/${fileName}`;

          // For Android, we need to use a different path
          if (Platform.OS === 'android') {
            path = `${RNFS.PicturesDirectoryPath}/DALL-E/${fileName}`;
            await RNFS.mkdir(`${RNFS.PicturesDirectoryPath}/DALL-E`);
          }

          const response = await RNFS.downloadFile({
            fromUrl: image.url,
            toFile: path,
          }).promise;

          if (response.statusCode === 200) {
            console.log('Image downloaded successfully');
            // For Android, we need to manually add the file to the media store
            if (Platform.OS === 'android') {
              await RNFS.scanFile(path);
            }
          }
        }
      }
      alert('Selected images downloaded successfully!');
      setSelectedImages([]);
    } catch (error) {
      console.error('Error downloading images:', error);
      alert('Failed to download images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderImageItem = ({ item }) => (
    <TouchableOpacity onPress={() => toggleImageSelection(item.id)} style={styles.imageContainer}>
      <Image source={{ uri: item.url }} style={styles.image} />
      {selectedImages.includes(item.id) && (
        <View style={styles.selectedOverlay}>
          <Icon name="check-circle" size={30} color="#4CAF50" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.gradient}
      >
        <Text style={styles.title}>DALL-E Image Generator</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your image prompt"
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />
        <View style={styles.sizeContainer}>
          {['256x256', '512x512', '1024x1024'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.sizeButton, size === option && styles.selectedSize]}
              onPress={() => setSize(option)}
            >
              <Text style={[styles.sizeButtonText, size === option && styles.selectedSizeText]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.generateButton} onPress={generateImages} disabled={loading}>
          <Text style={styles.generateButtonText}>Generate Images</Text>
        </TouchableOpacity>
        {loading && <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />}
        <FlatList
          data={generatedImages}
          renderItem={renderImageItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.imageList}
        />
        {generatedImages.length > 0 && (
          <TouchableOpacity
            style={[styles.downloadButton, selectedImages.length === 0 && styles.disabledButton]}
            onPress={downloadSelectedImages}
            disabled={selectedImages.length === 0 || loading}
          >
            <Text style={styles.downloadButtonText}>
              Download Selected ({selectedImages.length})
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
      padding: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 20,
    },
    input: {
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      padding: 15,
      fontSize: 16,
      marginBottom: 20,
    },
    sizeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    sizeButton: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    selectedSize: {
      backgroundColor: '#FFFFFF',
    },
    sizeButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
    },
    selectedSizeText: {
      color: '#4c669f',
    },
    generateButton: {
      backgroundColor: '#4CAF50',
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
    },
    generateButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    loader: {
      marginTop: 20,
    },
    imageList: {
      marginTop: 20,
    },
    imageContainer: {
      width: (width - 60) / 2,
      height: (width - 60) / 2,
      margin: 10,
      borderRadius: 10,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    selectedOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    downloadButton: {
      backgroundColor: '#2196F3',
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 20,
    },
    downloadButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    disabledButton: {
      backgroundColor: 'rgba(33, 150, 243, 0.5)',
    },
  });

export default ImageGeneratorDashboard;