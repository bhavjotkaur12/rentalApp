import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { useAuth } from '../../context/AuthContext';
import ImagePicker from '../../components/ImagePicker';

const AddPropertyScreen = ({ navigation }: { navigation: any }) => {
  const { userData } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState('');

  const handleAddProperty = async () => {
    if (!userData?.uid) {
      Alert.alert('Error', 'You must be logged in to add a property');
      return;
    }

    try {
        const propertyData = {
            title,
            description,
            price: parseFloat(price),
            address,
            images,
            features: features.split(',').map(feature => feature.trim()).filter(Boolean),
            landlordId: userData.uid,
            isListed: true,  // Default to listed when creating
            createdAt: new Date(),
            updatedAt: new Date(),
          };

      await addDoc(collection(db, 'properties'), propertyData);
      Alert.alert('Success', 'Property added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding property:', error);
      Alert.alert('Error', 'Failed to add property');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Property</Text>

      <TextInput
        style={styles.input}
        placeholder="Property Title"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <TextInput
        style={styles.input}
        placeholder="Monthly Rent ($)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Features (comma-separated)"
        value={features}
        onChangeText={setFeatures}
        multiline
        numberOfLines={3}
      />

      <ImagePicker
        images={images}
        onImagesChanged={setImages}
      />

      <TouchableOpacity 
        style={styles.button}
        onPress={handleAddProperty}
      >
        <Text style={styles.buttonText}>Add Property</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddPropertyScreen;