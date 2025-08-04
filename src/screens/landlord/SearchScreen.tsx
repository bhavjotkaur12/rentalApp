// src/screens/landlord/SearchScreen.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import PropertyCard from '../../components/PropertyCard';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  features: string[];
  images: string[];
  landlordId: string;
  isListed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SearchScreen = ({ navigation }: { navigation: any }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const { userData } = useAuth();

  const searchProperties = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 3) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, 'properties'),
        where('isListed', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const propertiesList = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as Property))
        .filter(property => 
          property.title.toLowerCase().includes(text.toLowerCase()) ||
          property.address.toLowerCase().includes(text.toLowerCase()) ||
          property.description.toLowerCase().includes(text.toLowerCase())
        );

      setProperties(propertiesList);
    } catch (error) {
      console.error('Error searching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPropertyCard = ({ item }: { item: Property }) => {
    const isOwnProperty = item.landlordId === userData?.uid;

    return (
      <PropertyCard
        property={item}
        onPress={() => navigation.navigate('PropertyDetail', {
          propertyId: item.id,
          isOwner: isOwnProperty
        })}
        onRequestsPress={() => navigation.navigate('Requests', { propertyId: item.id })}
        isLandlord={isOwnProperty}  // Only show landlord controls if they own the property
      />
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search properties by location, title, or description..."
        value={searchQuery}
        onChangeText={searchProperties}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={properties}
          renderItem={renderPropertyCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  searchInput: {
    height: 50,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listContent: {
    paddingBottom: 16,
  },
  cardContainer: {
    marginBottom: 16,
  },
  viewDetailsButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewDetailsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SearchScreen;
