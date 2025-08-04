import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { storage } from '../config/FirebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';

interface ImagePickerProps {
  images: string[];
  onImagesChanged: (urls: string[]) => void;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ images, onImagesChanged }) => {
  const [uploading, setUploading] = useState(false);

  const requestPermission = async () => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return false;
    }
    return true;
  };

  const uploadImage = async (uri: string): Promise<string> => {
    try {
      // Convert URI to Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create unique filename
      const filename = `property_images/${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const storageRef = ref(storage, filename);

      // Upload the blob
      const snapshot = await uploadBytes(storageRef, blob);
      console.log('Uploaded image blob');

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Got download URL:', downloadURL);

      return downloadURL;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;
  
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,  // Changed from MediaType to MediaTypeOptions
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
  
      if (!result.canceled && result.assets && result.assets[0]) {
        setUploading(true);
        try {
          const downloadURL = await uploadImage(result.assets[0].uri);
          onImagesChanged([...images, downloadURL]);
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChanged(newImages);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Property Images</Text>
      <ScrollView 
        horizontal 
        style={styles.imageScroll}
        contentContainerStyle={styles.imageScrollContent}
      >
        {images.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={24} color="red" />
            </TouchableOpacity>
          </View>
        ))}
        
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={pickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#007AFF" />
          ) : (
            <Ionicons name="add" size={32} color="#007AFF" />
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  imageScroll: {
    flexGrow: 0,
  },
  imageScrollContent: {
    gap: 10,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 150,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  addButton: {
    width: 150,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
});

export default ImagePicker;