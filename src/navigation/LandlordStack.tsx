import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import PropertyListScreen from '../screens/landlord/PropertyListScreen';
import AddPropertyScreen from '../screens/landlord/AddPropertyScreen';
import EditPropertyScreen from '../screens/landlord/EditPropertyScreen';
import PropertyDetailScreen from '../screens/landlord/PropertyDetailScreen';
import RequestsScreen from '../screens/landlord/RequestsScreen';
import SearchScreen from '../screens/landlord/SearchScreen';

// Define the param list types for the stack navigator
export type LandlordStackParamList = {
  PropertyList: undefined;
  PropertyDetail: { propertyId: string; isOwner: boolean };
  AddProperty: undefined;
  EditProperty: { propertyId: string };
  Requests: { propertyId: string };
  Search: undefined;  // Add this
};

const Stack = createNativeStackNavigator<LandlordStackParamList>();
const Tab = createBottomTabNavigator();

const MyPropertiesStack = () => {
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

const SearchStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ title: 'Search Properties' }}
      />
      <Stack.Screen 
        name="PropertyDetail" 
        component={PropertyDetailScreen}
        options={{ title: 'Property Details' }}
      />
    </Stack.Navigator>
  );
};

const LandlordStack = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';  // Set default

          if (route.name === 'MyProperties') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'SearchProperties') {
            iconName = focused ? 'search' : 'search-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="MyProperties" 
        component={MyPropertiesStack}
        options={{ headerShown: false, title: 'My Properties' }}
      />
      <Tab.Screen 
        name="SearchProperties" 
        component={SearchStack}
        options={{ headerShown: false, title: 'Search' }}
      />
    </Tab.Navigator>
  );
};

export default LandlordStack;