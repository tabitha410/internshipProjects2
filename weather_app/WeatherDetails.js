import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './styles';

const WeatherDetails = ({ route, navigation }) =>{
    const { weatherData, forecastData, forecastType } = route.params;
    const { temperature, description } = weatherData || {};

    const getBackgroundColors = () => {
        if(description && description.toLowerCase().includes('sunny')) {
            return ['#f7b733', '#fc4a1a'];
        }
        if(description && description.toLowerCase().includes('clear')) {
            return ['#f7b733', '#87CEEB'];
        }
        if(description && description.toLowerCase().includes('cloudy')) {
            return ['#D3D3D3', '#B0C4DE'];
        }
        if(description && description.toLowerCase().includes('rain')) {
            return ['#4682B4', '#B0C4DE'];
        }
        if(description && description.toLowerCase().includes('snow')) {
            return ['#ADD8E6', '#FFFFFF'];
        }
        if(description && description.toLowerCase().includes('thunder')) {
            return ['#2F4F4F', '#00008B'];
        }
        if(description && description.toLowerCase().includes('fog')) {
            return ['#A9A9A9', '#252829'];
        }
        if(description && description.toLowerCase().includes('mist')) {
            return ['#252829', '#f0f4f8'];
        }
        
    
        return ['#1c98c9', '#000428']; // Default
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
    

    const renderForecast = () => {
        switch (forecastType) {
            case 'hours':
                return (
                    <View style = {styles.weatherInfo}>
                        <Text style={styles.heading}>
                            Forecast for the next few hours: {'\n'}
                        </Text>
                        {forecastData.map((forecastItem, index) => (
                            <Text key={index} style={styles.weatherText}>
                                <Text style={styles.subheading}>Time: </Text>{' '}
                                {new Date(forecastItem.time_epoch * 1000).toLocaleTimeString()},{' '}
                                <Text style={styles.subheading}>Temperature:</Text>{' '} {forecastItem.temp_c} °C, {' '}
                                <Text style={styles.subheading}>Description:</Text>{' '} {forecastItem.condition.text}
                            </Text>
                        ))}
                    </View>
                );
            case 'days':
                return (
                    <View style={styles.weatherInfo}>
                        <Text style={styles.heading}>
                            Forecast for the next few days: {'\n'}
                        </Text>
                        {forecastData.map((forecastItem, index) => (
                            <Text key={index} style={styles.weatherText}>
                                <Text style={styles.subheading}>Date: </Text>{' '}
                                {new Date(forecastItem.date).toLocaleDateString()},{' '}
                                <Text style={styles.subheading}>Max Temp:</Text>{' '} {forecastItem.day.maxtemp_c} °C, {' '}
                                <Text style={styles.subheading}>Min Temp:</Text>{' '} {forecastItem.day.mintemp_c} °C, {' '}
                                <Text style={styles.subheading}>Description: </Text>{' '} {forecastItem.day.condition.text}
                            </Text>
                        ))}
                    </View>
                );
            default:
                return null;
        }
    }

    return (
        <LinearGradient colors={getBackgroundColors()} style={styles.gradient}>
            <View style={styles.centeredContent}>
                <Text style={styles.heading}>Weather Details</Text>
                {weatherData && (
                    <>
                        <Text style={styles.weatherText}>Temperature: {temperature} °C</Text>
                        <Text style={styles.weatherText}>Description: {description}</Text>
                        {getImage() && (
                            <Image source={getImage()} style={styles.weatherImage} />
                        )}
                    </>
                )}
                {forecastData && renderForecast()}
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Text style={styles.bbText}>Back</Text>
                </Pressable>
            </View>
        </LinearGradient>
    );
};

export default WeatherDetails;