import * as Location from 'expo-location';
import { Alert, Platform } from "react-native";

const showAlert = (message) => {
    if (Platform.OS === 'web') {
        window.alert(message);
    } else {
        Alert.alert('Error', message);
    }
};

export const requestLocation = async () => {
    try {
        // Request permissions
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permission to access location was denied');
            return;
        }

        // Get the current location
        let location = await Location.getCurrentPositionAsync({ 
            accuracy: Location.Accuracy.High, 
            timeout: 60000 
        });

        console.log('Location:', location.coords);
        return location.coords;
    } catch (error) {
        console.error('Error fetching location:', error.message);
        showAlert('Failed to fetch location. Please try again.');
    }
};
