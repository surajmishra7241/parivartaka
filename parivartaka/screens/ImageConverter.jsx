import React, { useState } from 'react';
import { View, Text, Image, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { convertFile } from './conversionUtils'; // Ensure the path to conversionUtils is correct

const ImageConverter = () => {
  const [fileUri, setFileUri] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [convertedFileUri, setConvertedFileUri] = useState(null);
  const [conversionType, setConversionType] = useState(null);

  const pickFile = async () => {
    try {
      console.log('Attempting to pick a file...');
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf, DocumentPicker.types.docx, DocumentPicker.types.plainText],
      });

      const mimeType = result.type;
      console.log(`File picked: ${result.name}, MIME type: ${mimeType}`);

      const isImage = mimeType ? mimeType.startsWith('image/') : false;
      setFileUri(result.uri);
      setFileName(result.name);
      setFileType(mimeType);
      setConversionType(isImage ? 'image' : 'document');
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('File picking was cancelled.');
        Alert.alert('Cancelled', 'File picking was cancelled.');
      } else {
        console.error('Error picking file:', err.message);
        Alert.alert('Error', 'An error occurred while picking the file.');
      }
    }
  };

  const getFileNameFromUri = (uri) => {
    // Extract the file name from the URI
    return uri.split('/').pop();
  };

  const getFileExtension = (fileName) => {
    // Extract the file extension from the file name
    const match = fileName.match(/\.(\w+)$/);
    return match ? match[1].toLowerCase() : '';
  };

  const validateFileType = (fileExtension, expectedExtension, context) => {
    const normalizedFileExtension = fileExtension.toLowerCase();
    const normalizedExpectedExtension = expectedExtension.toLowerCase();

    console.log(`[${context}] Normalized File Extension: ${normalizedFileExtension}, Normalized Expected Extension: ${normalizedExpectedExtension}`);

    return normalizedFileExtension === normalizedExpectedExtension;
  };

  const handleConversion = async (conversionType) => {
    try {
      console.log(`Initiating conversion: ${conversionType} for file ${fileName}`);
      const convertedUri = await convertFile(fileUri, conversionType);
      console.log(`Conversion successful: ${convertedUri}`);
      setConvertedFileUri(convertedUri);
    } catch (error) {
      console.error('Error during file conversion:', error.message);
      Alert.alert('Error', 'An error occurred during file conversion.');
    }
  };

  const renderConversionButtons = () => {
    if (!fileType) return null;

    const mimeType = fileType.split('/')[0];
    const fileExtension = getFileExtension(fileName);

    console.log(`File type for conversion: ${mimeType}, Extension: ${fileExtension}`);

    switch (mimeType) {
      case 'image':
        return (
          <View style={styles.buttonsContainer}>
            {(validateFileType(fileExtension, 'jpg', 'JPEG to PNG or PDF Check') || validateFileType(fileExtension, 'jpeg', 'JPEG to PNG or PDF Check')) && (
              <>
                <Button title="Convert JPEG to PNG" onPress={() => handleConversion('jpeg-to-png')} />
                <Button title="Convert JPEG to PDF" onPress={() => handleConversion('jpeg-to-pdf')} />
              </>
            )}
            {validateFileType(fileExtension, 'png', 'PNG to JPEG Check') && (
              <Button title="Convert PNG to JPEG" onPress={() => handleConversion('png-to-jpeg')} />
            )}
          </View>
        );
      case 'application':
        if (fileExtension === 'pdf') {
          return (
            <View style={styles.buttonsContainer}>
              <Button title="Convert PDF to JPEG" onPress={() => handleConversion('pdf-to-jpeg')} />
              <Button title="Convert PDF to PNG" onPress={() => handleConversion('pdf-to-png')} />
            </View>
          );
        } else if (fileExtension === 'docx') {
          return (
            <View style={styles.buttonsContainer}>
              <Button title="Convert Word to PDF" onPress={() => handleConversion('word-to-pdf')} />
            </View>
          );
        }
        break;
      case 'text':
        return (
          <View style={styles.buttonsContainer}>
            <Button title="Convert Text to PDF" onPress={() => handleConversion('text-to-pdf')} />
          </View>
        );
      default:
        return <Text style={styles.noConversion}>No conversion options available for this file type.</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Image Converter Dashboard</Text>

      <TouchableOpacity style={styles.frame} onPress={pickFile}>
        {fileUri ? (
          fileType && fileType.startsWith('image/') ? (
            <Image source={{ uri: fileUri }} style={styles.image} />
          ) : (
            <View style={styles.fileInfoContainer}>
              <Icon name="insert-drive-file" size={50} color="#4A90E2" />
              <Text style={styles.fileName}>{fileName}</Text>
              <Text style={styles.fileType}>{fileType}</Text>
            </View>
          )
        ) : (
          <View style={styles.placeholderContainer}>
            <Icon name="cloud-upload" size={60} color="#4A90E2" />
            <Text style={styles.placeholderText}>Tap to select a file</Text>
          </View>
        )}
      </TouchableOpacity>

      {renderConversionButtons()}

      {convertedFileUri && (
        <View style={styles.frame}>
          <Text style={styles.convertedFileText}>Converted File</Text>
          <TouchableOpacity onPress={() => { console.log('Opening converted file'); /* Implement file opening logic */ }}>
            <Text style={styles.fileName}>{convertedFileUri}</Text>
            <Text style={styles.fileType}>MIME Type: {fileType}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
    marginBottom: 30,
  },
  frame: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10, // Android
    shadowColor: '#000', // iOS
    shadowOffset: { width: 0, height: 5 }, // iOS
    shadowOpacity: 0.3, // iOS
    shadowRadius: 10, // iOS
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  fileInfoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginTop: 10,
  },
  fileType: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
  buttonsContainer: {
    marginTop: 20,
    width: '100%',
    justifyContent: 'space-around',
  },
  noConversion: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
  convertedFileText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
});

export default ImageConverter;
