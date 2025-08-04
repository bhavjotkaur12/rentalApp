import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text,
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { useAuth } from '../../context/AuthContext';
import PropertyCard from '../../components/PropertyCard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LandlordStackParamList } from '../../navigation/LandlordStack';

type Props = NativeStackScreenProps<LandlordStackParamList, 'PropertyList'>;

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

const PropertyListScreen: React.FC<Props> = ({ navigation }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { userData } = useAuth();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupPropertiesListener = async () => {
      if (!userData?.uid) {
        setProperties([]);
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'properties'),
          where('landlordId', '==', userData.uid)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const propertyList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as Property[];
          
          setProperties(propertyList);
          setLoading(false);
        }, (error) => {
          console.log('Properties listener error:', error);
          setProperties([]);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up properties listener:', error);
        setLoading(false);
      }
    };

    setupPropertiesListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userData]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleToggleList = async (propertyId: string) => {
    try {
      const property = properties.find(p => p.id === propertyId);
      if (!property) return;

      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, {
        isListed: !property.isListed,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling property listing:', error);
      Alert.alert('Error', 'Failed to update property listing status');
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
    <View style={styles.container}>
      <FlatList
        data={properties}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => navigation.navigate('PropertyDetail', { 
              propertyId: item.id,
              isOwner: true
            })}
            onRequestsPress={() => navigation.navigate('Requests', { propertyId: item.id })}
            onToggleList={handleToggleList}  // Add this prop
            isLandlord={true}
          />
        )}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.listContent,
          properties.length === 0 && styles.emptyList
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No properties listed yet
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddProperty')}
            >
              <Text style={styles.addButtonText}>Add Property</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PropertyListScreen;