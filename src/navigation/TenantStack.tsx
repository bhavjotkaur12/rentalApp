import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import SearchScreen from '../screens/tenant/SearchScreen';
import ShortlistScreen from '../screens/tenant/ShortlistScreen';
import RequestsScreen from '../screens/tenant/RequestsScreen';
import PropertyDetailScreen from '../screens/tenant/PropertyDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const SearchStack = () => {
  const { signOut } = useAuth();

  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          title: 'Search Properties',
          headerRight: () => (
            <TouchableOpacity onPress={signOut}>
              <Text style={{ color: '#FF3B30', fontSize: 16, marginRight: 15 }}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen 
        name="PropertyDetail" 
        component={PropertyDetailScreen}
        options={{ title: 'Property Details' }}
      />
    </Stack.Navigator>
  );
};

const TenantStack = () => {
  const { signOut } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'list';

          if (route.name === 'SearchStack') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Shortlist') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Requests') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="SearchStack" 
        component={SearchStack}
        options={{ headerShown: false, title: 'Search' }}
      />
      <Tab.Screen 
        name="Shortlist" 
        component={ShortlistScreen}
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={signOut}>
              <Text style={{ color: '#FF3B30', fontSize: 16, marginRight: 15 }}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen 
        name="Requests" 
        component={RequestsScreen}
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={signOut}>
              <Text style={{ color: '#FF3B30', fontSize: 16, marginRight: 15 }}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TenantStack;