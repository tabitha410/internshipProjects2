import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Pressable, TextInput, Alert, TouchableOpacity, Platform, Image } from 'react-native';
import { getForecast, getWeather, getWeatherByLocation } from './api';
import { styles } from './styles';
import { LinearGradient } from 'expo-linear-gradient';


const Index = ({ navigation }) => {
    const [city, setCity] = useState(""); // State to store the city name
    const [showDropdown, setShowDropdown] = useState(false); // State to show or hide dropdown
    const [description, setDescription] = useState(null);
    const [temperature, setTemperature] = useState(null);
    const [currentLocationCity, setCurrentLocationCity] = useState(null);
    const [loading, setLoading] = useState(true);


    const showAlert = (message) => {
        if (Platform.OS === 'web') {
            window.alert(message);
        } else {
            Alert.alert('Error', message);
        }
    };

    const handleGetWeather = async () => {
        if (!city.trim()){
            showAlert('City name is required.');
            return;
        }

        const weatherData = await getWeather(city);
        if (weatherData) {
            navigation.navigate('WeatherDetails', { weatherData });
        }
    };

    const handleForecastOption = async (option) => {
        if (!city.trim()){
            showAlert('City name is required.');
            return;
        }

        let forecastData;
        let forecastType;
        switch (option) {
            case 'nextFewHours':
                forecastData = await getForecast(city, 'hours');
                forecastType = 'hours';
                break;
            case 'nextFewDays':
                forecastData = await getForecast(city, 'days');
                forecastType = 'days';
                break;
            default:
                forecastData = null;
                forecastType = null;
                break;
        }

        setShowDropdown(false); // Hide dropdown after selecting an option

        if (forecastData) {
            navigation.navigate('WeatherDetails', { weatherData: null, forecastData, forecastType });
        }
    };

    const getImage = () => {
        if (description && description.toLowerCase().includes('sunny')) {
            return require('./assets/warm.png');
        }
        if (description && description.toLowerCase().includes('clear')) {
            return require('./assets/clear.png');
        }
        if (description && description.toLowerCase().includes('cloudy')) {
            return require('./assets/cloudy-day.png');
        }
        if (description && (description.toLowerCase().includes('patchy rain') || description.toLowerCase().includes('drizzle'))) {
            return require('./assets/drizzle.png');
        }
        if (description && description.toLowerCase().includes('fog')) {
            return require('./assets/fog.png');
        }
        if (description && description.toLowerCase().includes('mist')) {
            return require('./assets/mist.png');
        }
        if (description && description.toLowerCase().includes('hail')) {
            return require('./assets/hail.png');
        }
        if (description && description.toLowerCase().includes('overcast')) {
            return require('./assets/overcast.png');
        }
        if (description && (description.toLowerCase().includes('rain') || description.toLowerCase().includes('rainy'))) {
            return require('./assets/rainy.png');
        }
        if (description && description.toLowerCase().includes('sleet')) {
            return require('./assets/sleet.png');
        }
        if (description && description.toLowerCase().includes('snow')) {
            return require('./assets/snowfall.png');
        }
        if (description && description.toLowerCase().includes('thunder')) {
            return require('./assets/thunderstorm.png');
        }
        if (description && description.toLowerCase().includes('wind')) {
            return require('./assets/windy.png');
        }
    
        return require('./assets/weather-forecast.png'); // Default image
    };

    //Fetch weather based on current location on component mounts
    useEffect(() => {
        const fetchWeather = async () => {
            const locationData = await getWeatherByLocation();
            if (locationData) {
                setCurrentLocationCity(locationData.displayCity);  //Store location
                setTemperature(locationData.temperature);  //Store weather data
                setDescription(locationData.description);
            }
            setLoading(false);
        };

        fetchWeather();
    }, []);

    if (loading) {
        return (
            <View style={styles.centeredContent}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        )
    }

    return (
        <LinearGradient colors={['#1c98c9', '#000428']} style={styles.gradient}>
            <View style={styles.centeredContent}>
                <Text style={styles.title}>Climora Weather App</Text>
                
                <View style={styles.searchContainer}>
                    <Text style={styles.temp}>Search: </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter city name"
                        value={city}
                        onChangeText={setCity}
                        placeholderTextColor={"#ffffff"}
                    />
                    <Pressable
                        onPress={handleGetWeather}
                        style={({ pressed }) => [
                            styles.button,
                            {
                                backgroundColor: pressed ? '#117da1' : '#1c98c9',
                            },
                        ]}
                    >
                        <Text style={styles.buttonText}>Get Weather</Text>
                    </Pressable>
                    <Text> </Text>

                    <Pressable
                        onPress={() => setShowDropdown(!showDropdown)} // Toggle dropdown visibility
                        style={({ pressed }) => [
                            styles.button,
                            {
                                backgroundColor: pressed ? '#117da1' : '#1c98c9',
                            },
                        ]}
                    >
                        <Text style={styles.buttonText}>Get Forecast</Text>
                    </Pressable>
                </View>

                {showDropdown && (
                    <View style={styles.dropdown}>
                        <TouchableOpacity onPress={() => handleForecastOption('nextFewHours')} style={styles.dropdownItem}>
                            <Text style={styles.dropdownItemText}>Next Few Hours</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleForecastOption('nextFewDays')} style={styles.dropdownItem}>
                            <Text style={styles.dropdownItemText}>Next Few Days</Text>
                        </TouchableOpacity>
                    </View>
                )}
                
                {/* Display current location if available */}
                {currentLocationCity && (
                    <View style={styles.weatherInfo}>
                        <Text style={styles.temp}>Today</Text>
                        {getImage() && (
                            <Image source={getImage()} style={styles.InImage} />
                        )}
                        <Text style={styles.weatherText1}>{description}, {temperature}°C</Text>
                        <Text style={styles.weatherText}>{currentLocationCity}</Text>
                        
                        {/*<Text style={styles.weatherText}> {temperature}°C</Text>*/}
                        
                    </View>
                )}


            </View>
        </LinearGradient>
    );
};

export default Index;