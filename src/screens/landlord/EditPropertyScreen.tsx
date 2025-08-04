import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { useAuth } from '../../context/AuthContext';
import ImagePicker from '../../components/ImagePicker';

const EditPropertyScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { propertyId } = route.params;
  const { userData } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
        if (propertyDoc.exists()) {
          const data = propertyDoc.data();
          setTitle(data.title);
          setDescription(data.description);
          setPrice(data.price.toString());
          setAddress(data.address);
          setImages(data.images || []);
          setFeatures(data.features?.join(', ') || '');
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        Alert.alert('Error', 'Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  const handleUpdateProperty = async () => {
    try {
      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, {
        title,
        description,
        price: parseFloat(price),
        address,
        images,
        features: features.split(',').map(feature => feature.trim()).filter(Boolean),
        updatedAt: new Date(),
      });

      Alert.alert('Success', 'Property updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating property:', error);
      Alert.alert('Error', 'Failed to update property');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Property</Text>

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
        onPress={handleUpdateProperty}
      >
        <Text style={styles.buttonText}>Update Property</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

export default EditPropertyScreen;