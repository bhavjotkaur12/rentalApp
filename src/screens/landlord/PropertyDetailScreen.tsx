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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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

const PropertyDetailScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { propertyId, isOwner } = route.params;
  const { userData } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [propertyLocation, setPropertyLocation] = useState<LocationCoords | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Default region (Toronto)
  const defaultRegion = {
    latitude: 43.6532,
    longitude: -79.3832,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

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

  const handleToggleList = async () => {
    if (!property || !userData?.uid) return;

    try {
      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, {
        isListed: !property.isListed,
        updatedAt: new Date()
      });

      // Update local state
      setProperty(prev => prev ? { ...prev, isListed: !prev.isListed } : null);
      Alert.alert(
        'Success', 
        `Property ${property.isListed ? 'delisted' : 'listed'} successfully`
      );
    } catch (error) {
      console.error('Error toggling property listing:', error);
      Alert.alert('Error', 'Failed to update property listing status');
    }
  };

  const renderImageItem = ({ item, index }: { item: string; index: number }) => (
    <Image
      source={{ uri: item }}
      style={styles.image}
      resizeMode="cover"
    />
  );

  const renderImageDots = () => {
    if (!property?.images || property.images.length <= 1) return null;

    return (
      <View style={styles.dotsContainer}>
        {property.images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeImageIndex && styles.activeDot
            ]}
          />
        ))}
      </View>
    );
  };

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
          const property = {
            id: propertyDoc.id,
            ...propertyData,
            createdAt: propertyData.createdAt?.toDate() || new Date(),
            updatedAt: propertyData.updatedAt?.toDate() || new Date(),
          } as Property;
          
          setProperty(property);

          // Get coordinates for the property address
          if (propertyData.address) {
            getPropertyCoordinates(propertyData.address);
          }
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
      {/* Image Gallery */}
      <View style={styles.imageContainer}>
        {property.images && property.images.length > 0 ? (
          <>
            <FlatList
              data={property.images}
              renderItem={renderImageItem}
              keyExtractor={(_, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const contentOffset = event.nativeEvent.contentOffset.x;
                const imageIndex = Math.round(contentOffset / Dimensions.get('window').width);
                setActiveImageIndex(imageIndex);
              }}
              scrollEventThrottle={16}
            />
            {renderImageDots()}
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {`${activeImageIndex + 1}/${property.images.length}`}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.placeholderImage}>
            <Text>No images available</Text>
          </View>
        )}
      </View>

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

        {/* Action Buttons */}
        {isOwner && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, !property.isListed && styles.delistedButton]}
              onPress={handleToggleList}
            >
              <Text style={styles.buttonText}>
                {property.isListed ? 'Delist Property' : 'List Property'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => navigation.navigate('EditProperty', { propertyId: property.id })}
            >
              <Text style={styles.buttonText}>Edit Property</Text>
            </TouchableOpacity>
          </View>
        )}
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
  imageContainer: {
    height: 250,
    position: 'relative',
  },
  image: {
    width: Dimensions.get('window').width,
    height: 250,
  },
  dotsContainer: {
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
  placeholderImage: {
    width: '100%',
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
  delistedButton: {
    backgroundColor: '#FF3B30',
  },
  editButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PropertyDetailScreen;