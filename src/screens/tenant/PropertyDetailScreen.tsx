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
  FlatList,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
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

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const PropertyDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { propertyId } = route.params;
  const { userData } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [propertyLocation, setPropertyLocation] = useState<LocationCoords | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Default region (Toronto)
  const defaultRegion = {
    latitude: 43.6532,
    longitude: -79.3832,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Function to get coordinates from address
  const getPropertyCoordinates = async (address: string) => {
    try {
      setLocationLoading(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show the map.');
        return;
      }

      const geocodeResult = await Location.geocodeAsync(address);

      if (geocodeResult && geocodeResult.length > 0) {
        const { latitude, longitude } = geocodeResult[0];
        setPropertyLocation({ latitude, longitude });
      } else {
        console.log('No location found for the address');
      }
    } catch (error) {
      console.error('Error getting property coordinates:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!propertyId || !userData?.uid) {
        console.log('Missing propertyId or userData:', { propertyId, userUid: userData?.uid });
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching property:', propertyId);
        console.log('Current user:', userData);
        
        const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
        console.log('Property exists:', propertyDoc.exists());
        
        if (propertyDoc.exists()) {
          const propertyData = propertyDoc.data();
          console.log('Property data:', propertyData);
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

          // Get coordinates for the property address
          if (propertyData.address) {
            getPropertyCoordinates(propertyData.address);
          }
        }
      } catch (error) {
        console.error('Error fetching property details:', error);
        // Log the full error object
        if (error instanceof Error) {
          console.log('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          });
        }
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

  const renderImageItem = ({ item }: { item: string }) => (
    <Image
      source={{ uri: item }}
      style={styles.image}
      resizeMode="cover"
    />
  );

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
        <View>
          <FlatList
            data={property.images}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageContainer}
            onScroll={(event) => {
              const contentOffset = event.nativeEvent.contentOffset.x;
              const imageIndex = Math.round(contentOffset / Dimensions.get('window').width);
              setActiveImageIndex(imageIndex);
            }}
            scrollEventThrottle={16}
          />
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {`${property.images.length} Photos`}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.placeholderImage}>
          <Text>No images available</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{property.title}</Text>
        <Text style={styles.price}>${property.price}/month</Text>
        <Text style={styles.address}>{property.address}</Text>

        {/* Map Section */}
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.mapContainer}>
          {locationLoading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <MapView
              style={styles.map}
              initialRegion={
                propertyLocation
                  ? {
                      latitude: propertyLocation.latitude,
                      longitude: propertyLocation.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }
                  : defaultRegion
              }
            >
              {propertyLocation && (
                <Marker
                  coordinate={{
                    latitude: propertyLocation.latitude,
                    longitude: propertyLocation.longitude,
                  }}
                  title={property.title}
                  description={property.address}
                />
              )}
            </MapView>
          )}
        </View>

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
  imageContainer: {
    height: 250, // or whatever height you prefer
  },
  imageCounter: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dotContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeDot: {
    backgroundColor: '#fff',
  },
  mapContainer: {
    height: 200,
    marginVertical: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default PropertyDetailScreen;