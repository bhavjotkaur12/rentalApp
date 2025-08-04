import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';
import { RequestWithTenant, RequestWithLandlord, RequestItemData } from '../types/request';

interface RequestItemProps {
  request: RequestItemData;
  isLandlord: boolean;
  onWithdraw?: () => void;
}

const RequestItem: React.FC<RequestItemProps> = ({ request, isLandlord, onWithdraw }) => {
  const handleStatusUpdate = async (newStatus: 'approved' | 'denied') => {
    try {
      await updateDoc(doc(db, 'requests', request.id), {
        status: newStatus,
      });
      Alert.alert(
        'Success',
        `Request ${newStatus === 'approved' ? 'approved' : 'denied'} successfully`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update request status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#34C759';
      case 'denied':
        return '#FF3B30';
      default:
        return '#007AFF';
    }
  };

  // Get the correct user info based on whether we're showing landlord or tenant view
  const getUserInfo = () => {
    if (isLandlord) {
      return (request as RequestWithTenant).tenant;
    } else {
      return (request as RequestWithLandlord).landlord;
    }
  };

  const userInfo = getUserInfo();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.propertyTitle}>{request.property.title}</Text>
        <Text
          style={[
            styles.status,
            { color: getStatusColor(request.status) }
          ]}
        >
          {request.status.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.address}>{request.property.address}</Text>
      
      <View style={styles.userInfo}>
        <Text style={styles.label}>
          {isLandlord ? 'Tenant' : 'Landlord'}:
        </Text>
        <Text style={styles.value}>{userInfo.displayName}</Text>
      </View>

      <Text style={styles.message}>{request.message}</Text>

      {isLandlord && request.status === 'pending' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={() => handleStatusUpdate('approved')}
          >
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.denyButton]}
            onPress={() => handleStatusUpdate('denied')}
          >
            <Text style={styles.buttonText}>Deny</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLandlord && request.status === 'pending' && onWithdraw && (
        <TouchableOpacity
          style={[styles.button, styles.withdrawButton]}
          onPress={onWithdraw}
        >
          <Text style={styles.buttonText}>Withdraw Request</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  value: {
    fontSize: 14,
    color: '#444',
  },
  message: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  denyButton: {
    backgroundColor: '#FF3B30',
  },
  withdrawButton: {
    backgroundColor: '#FF9500',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RequestItem;