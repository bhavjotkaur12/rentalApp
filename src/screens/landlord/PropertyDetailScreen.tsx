import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';

const { width } = Dimensions.get('window');

// Define the Property interface
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

// Define route params interface
interface RouteParams {
  propertyId: string;
  isOwner: boolean;
}

// Define component props interface
interface PropertyDetailScreenProps {
  route: { params: RouteParams };
  navigation: any;
}

const PropertyDetailScreen: React.FC<PropertyDetailScreenProps> = ({ route, navigation }) => {
  const { propertyId, isOwner } = route.params;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
        if (propertyDoc.exists()) {
          const data = propertyDoc.data();
          setProperty({
            id: propertyDoc.id,
            title: data.title,
            description: data.description,
            price: data.price,
            address: data.address,
            images: data.images || [],
            features: data.features || [],
            landlordId: data.landlordId,
            isListed: data.isListed,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        }
      } catch (error) {
        console.error('Error fetching property details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [propertyId]);


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
        <Text>Property not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Image Gallery */}
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(newIndex);
          }}
        >
          {property.images && property.images.length > 0 ? (
            property.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.propertyImage}
                resizeMode="cover"
              />
            ))
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>No images available</Text>
            </View>
          )}
        </ScrollView>
        
        {/* Image Pagination Dots */}
        {property.images && property.images.length > 1 && (
          <View style={styles.paginationContainer}>
            {property.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentImageIndex && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>{property.title}</Text>
        <Text style={styles.price}>${property.price}/month</Text>
        <Text style={styles.address}>{property.address}</Text>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{property.description}</Text>

        {property.features && property.features.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Features</Text>
            {property.features.map((feature, index) => (
              <Text key={index} style={styles.feature}>• {feature}</Text>
            ))}
          </>
        )}

        {isOwner && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProperty', { propertyId: property.id })}
          >
            <Text style={styles.editButtonText}>Edit Property</Text>
          </TouchableOpacity>
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
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  propertyImage: {
    width: width,
    height: 300,
  },
  noImageContainer: {
    width: width,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  noImageText: {
    color: '#666',
    fontSize: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
  },
  contentContainer: {
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
    color: '#444',
  },
  feature: {
    fontSize: 16,
    marginBottom: 4,
    color: '#444',
  },
  editButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PropertyDetailScreen;