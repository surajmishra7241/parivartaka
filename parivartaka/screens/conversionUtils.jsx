import axios from 'axios'; // Ensure axios is installed and imported
import mime from 'mime'; // Ensure mime is installed

export const convertFile = async (fileUri, conversionType) => {
  try {
    console.log(`Initiating conversion: ${conversionType} for file ${fileUri}`);

    // Decode URI if necessary
    const filePath = decodeURIComponent(fileUri);
    const fileExtension = getFileExtension(filePath).toLowerCase();
    const fileType = getFileMimeType(fileExtension);

    console.log(`Converting file: ${filePath}, Conversion Type: ${conversionType}`);
    console.log(`File Type: ${fileType}, File Extension: ${fileExtension}`);

    // Define conversion endpoints
    const conversionEndpoints = {
      'jpeg-to-png': '/convert/jpeg-to-png',
      'jpeg-to-pdf': '/convert/jpeg-to-pdf',
      'png-to-jpeg': '/convert/png-to-jpeg',
      'pdf-to-jpeg': '/convert/pdf-to-jpeg',
      'pdf-to-png': '/convert/pdf-to-png',
      'word-to-pdf': '/convert/word-to-pdf',
      'text-to-pdf': '/convert/text-to-pdf',
    };

    // Check if the conversionType is valid
    if (!conversionEndpoints[conversionType]) {
      throw new Error('Invalid conversion type');
    }

    // Prepare the file for upload
    const formData = new FormData();
    formData.append('file', {
      uri: filePath,
      type: fileType,
      name: filePath.split('/').pop(), // Extract filename from URI
    });

    // Make API request for conversion
    const response = await axios.post(conversionEndpoints[conversionType], formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Handle response
    if (response.status === 200) {
      console.log('File conversion successful:', response.data);
      return response.data.convertedFileUri; // Adjust based on actual response structure
    } else {
      throw new Error('File conversion failed');
    }
  } catch (error) {
    console.error('Error during file conversion:', error.message);
    if (error.response) {
      console.error('Response error data:', error.response.data);
    }
    throw error;
  }
};

// Helper function to get MIME type from a file extension
const getFileMimeType = (fileExtension) => {
  return mime.getType(fileExtension) || 'application/octet-stream'; // Default MIME type
};

// Helper function to get file extension from a file path
const getFileExtension = (filePath) => {
  const match = filePath.match(/\.(\w+)$/);
  return match ? match[1].toLowerCase() : '';
};
