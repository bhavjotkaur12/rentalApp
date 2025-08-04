import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { doc, getDoc, addDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  images: string[];
  features: string[];
  landlordId: string;
  isListed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PropertyDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { propertyId } = route.params;
  const { userData } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!propertyId || !userData?.uid) {
        setLoading(false);
        return;
      }

      try {
        const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
        if (propertyDoc.exists()) {
          const propertyData = propertyDoc.data();
          setProperty({
            id: propertyDoc.id,
            ...propertyData,
            createdAt: propertyData.createdAt?.toDate() || new Date(),
            updatedAt: propertyData.updatedAt?.toDate() || new Date(),
          } as Property);
          
          // Check if property is shortlisted
          const shortlistQuery = query(
            collection(db, 'shortlists'),
            where('propertyId', '==', propertyId),
            where('tenantId', '==', userData.uid)
          );
          const shortlistDocs = await getDocs(shortlistQuery);
          setIsShortlisted(!shortlistDocs.empty);

          // Check if property is already requested
          const requestQuery = query(
            collection(db, 'requests'),
            where('propertyId', '==', propertyId),
            where('tenantId', '==', userData.uid)
          );
          const requestDocs = await getDocs(requestQuery);
          setHasRequested(!requestDocs.empty);
        }
      } catch (error) {
        console.error('Error fetching property details:', error);
        Alert.alert('Error', 'Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [propertyId, userData]);

  const handleRequest = async () => {
    if (!property || !userData?.uid) return;

    try {
      await addDoc(collection(db, 'requests'), {
        propertyId,
        tenantId: userData.uid,
        landlordId: property.landlordId,
        status: 'pending',
        message: 'Interested in viewing this property',
        createdAt: new Date(),
      });
      
      Alert.alert('Success', 'Request sent successfully');
      setHasRequested(true);
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('Error', 'Failed to send request');
    }
  };

  const toggleShortlist = async () => {
    if (!userData?.uid) return;

    try {
      if (isShortlisted) {
        // Remove from shortlist
        const shortlistQuery = query(
          collection(db, 'shortlists'),
          where('propertyId', '==', propertyId),
          where('tenantId', '==', userData.uid)
        );
        const shortlistDocs = await getDocs(shortlistQuery);
        const shortlistDoc = shortlistDocs.docs[0];
        if (shortlistDoc) {
          await deleteDoc(doc(db, 'shortlists', shortlistDoc.id));
        }
      } else {
        // Add to shortlist
        await addDoc(collection(db, 'shortlists'), {
          propertyId,
          tenantId: userData.uid,
          createdAt: new Date(),
        });
      }
      setIsShortlisted(!isShortlisted);
      Alert.alert(
        'Success', 
        isShortlisted ? 'Removed from shortlist' : 'Added to shortlist'
      );
    } catch (error) {
      console.error('Error updating shortlist:', error);
      Alert.alert('Error', 'Failed to update shortlist');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Property not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {property.images && property.images.length > 0 ? (
        <Image
          source={{ uri: property.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text>No image available</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{property.title}</Text>
        <Text style={styles.price}>${property.price}/month</Text>
        <Text style={styles.address}>{property.address}</Text>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{property.description}</Text>

        {property.features && property.features.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresList}>
              {property.features.map((feature, index) => (
                <Text key={index} style={styles.feature}>• {feature}</Text>
              ))}
            </View>
          </>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isShortlisted && styles.shortlistedButton]}
            onPress={toggleShortlist}
          >
            <Text style={styles.buttonText}>
              {isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
            </Text>
          </TouchableOpacity>

          {!hasRequested && (
            <TouchableOpacity
              style={[styles.button, styles.requestButton]}
              onPress={handleRequest}
            >
              <Text style={styles.buttonText}>Request Viewing</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  image: {
    width: Dimensions.get('window').width,
    height: 250,
  },
  placeholderImage: {
    width: Dimensions.get('window').width,
    height: 250,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    color: '#007AFF',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  featuresList: {
    marginTop: 8,
  },
  feature: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  shortlistedButton: {
    backgroundColor: '#FF3B30',
  },
  requestButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PropertyDetailScreen;