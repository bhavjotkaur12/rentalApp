import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc,
  DocumentData 
} from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { useAuth } from '../../context/AuthContext';
import RequestItem from '../../components/RequestItem';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LandlordStackParamList } from '../../navigation/LandlordStack';

// Add type for route params
type RequestsScreenProps = NativeStackScreenProps<LandlordStackParamList, 'Requests'>;

interface PropertyData {
  title: string;
  address: string;
  [key: string]: any;
}

interface TenantData {
  displayName: string;
  email: string;
  [key: string]: any;
}

interface Request {
  propertyId: string;
  tenantId: string;
  landlordId: string;
  status: 'pending' | 'approved' | 'denied';
  message: string;
  createdAt: Date;
}

interface RequestWithDetails extends Request {
  id: string;
  property: PropertyData;
  tenant: TenantData;
}

const RequestsScreen: React.FC<RequestsScreenProps> = ({ route }) => {
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { userData } = useAuth();
  
  // Get propertyId from route params
  const { propertyId } = route.params;

  useEffect(() => {
    if (!userData || !propertyId) return;

    const q = query(
      collection(db, 'requests'),
      where('landlordId', '==', userData.uid),
      where('propertyId', '==', propertyId)  // Add this filter
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const requestsData = await Promise.all(
          snapshot.docs.map(async (document) => {
            const requestData = document.data() as Request;
            
            // Fetch property details
            const propertyDocRef = doc(db, 'properties', requestData.propertyId);
            const propertyDoc = await getDoc(propertyDocRef);
            const propertyData = propertyDoc.data() as PropertyData | undefined;

            // Fetch tenant details
            const tenantDocRef = doc(db, 'users', requestData.tenantId);
            const tenantDoc = await getDoc(tenantDocRef);
            const tenantData = tenantDoc.data() as TenantData | undefined;
            
            return {
              ...requestData,
              id: document.id,
              property: {
                title: propertyData?.title || 'Untitled Property',
                address: propertyData?.address || 'No address provided',
                ...(propertyData || {})
              },
              tenant: {
                displayName: tenantData?.displayName || 'Unknown User',
                email: tenantData?.email || 'No email provided',
                ...(tenantData || {})
              }
            };
          })
        );
        
        setRequests(requestsData);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userData, propertyId]);  // Add propertyId to dependencies

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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
        data={requests}
        renderItem={({ item }) => (
          <RequestItem
            request={item}
            isLandlord={true}
          />
        )}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
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
});

export default RequestsScreen;