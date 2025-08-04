import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    price: number;
    address: string;
    description: string;
    features: string[];
    images: string[];  // Add this to the interface
    landlordId: string;
    isListed: boolean;
  };
  onPress: () => void;
  onRequestsPress: () => void;
  isLandlord: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onPress,
  onRequestsPress,
  isLandlord
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Add Image Display */}
      {property.images && property.images.length > 0 && (
        <Image
          source={{ uri: property.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{property.title}</Text>
        <Text style={styles.price}>${property.price}/month</Text>
        <Text style={styles.address}>{property.address}</Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {property.description}
        </Text>

        {property.features?.map((feature, index) => (
          <Text key={index} style={styles.feature}>• {feature}</Text>
        ))}

        <View style={styles.buttonContainer}>
          {isLandlord && (
            <TouchableOpacity
              style={[styles.button, !property.isListed && styles.delistedButton]}
              onPress={onPress}
            >
              <Text style={styles.buttonText}>
                {property.isListed ? 'Delist Property' : 'List Property'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.requestsButton]}
            onPress={onRequestsPress}
          >
            <Text style={styles.buttonText}>View Requests</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',  // Add this for image corners
  },
  image: {
    width: '100%',
    height: 200,  // Set appropriate height
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  feature: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  delistedButton: {
    backgroundColor: '#FF3B30',
  },
  requestsButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PropertyCard;