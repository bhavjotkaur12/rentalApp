import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import LandlordStack from './LandlordStack';
import TenantStack from './TenantStack';
import LoadingScreen from '../screens/loadingScreen';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const { userData, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {!userData ? (
        <AuthStack />
      ) : (
        userData.role === 'landlord' ? <LandlordStack /> : <TenantStack />
      )}
    </NavigationContainer>
  );
};

export default Navigation;