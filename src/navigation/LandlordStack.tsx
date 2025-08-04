import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import PropertyListScreen from '../screens/landlord/PropertyListScreen';
import AddPropertyScreen from '../screens/landlord/AddPropertyScreen';
import EditPropertyScreen from '../screens/landlord/EditPropertyScreen';
import PropertyDetailScreen from '../screens/landlord/PropertyDetailScreen';
import RequestsScreen from '../screens/landlord/RequestsScreen';

// Define the param list types for the stack navigator
export type LandlordStackParamList = {
  PropertyList: undefined;
  AddProperty: undefined;
  EditProperty: { propertyId: string };
  PropertyDetail: { propertyId: string; isOwner: boolean };
  Requests: undefined;
};

const Stack = createNativeStackNavigator<LandlordStackParamList>();

const LandlordStack = () => {
  const { signOut } = useAuth();

  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PropertyList" 
        component={PropertyListScreen}
        options={({ navigation }) => ({
          title: 'My Properties',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <TouchableOpacity onPress={() => navigation.navigate('AddProperty')}>
                <Text style={{ color: '#007AFF', fontSize: 16 }}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={signOut}>
                <Text style={{ color: '#FF3B30', fontSize: 16 }}>Logout</Text>
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen 
        name="AddProperty" 
        component={AddPropertyScreen}
        options={{ title: 'Add New Property' }}
      />
      <Stack.Screen 
        name="EditProperty" 
        component={EditPropertyScreen}
        options={{ title: 'Edit Property' }}
      />
      <Stack.Screen 
        name="PropertyDetail" 
        component={PropertyDetailScreen}
        options={{ title: 'Property Details' }}
      />
      <Stack.Screen 
        name="Requests" 
        component={RequestsScreen}
        options={{ title: 'Rental Requests' }}
      />
    </Stack.Navigator>
  );
};

export default LandlordStack;