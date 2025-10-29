import { Alert, Platform } from "react-native";
import { requestLocation } from './location';


export const getWeatherByLocation = async () => {
    const location = await requestLocation();

    if (!location) return;

    const { latitude, longitude } = location;

    try{
        const reverseGeocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
        const geocodeResponse = await fetch(reverseGeocodeUrl);
        const geocodeData = await geocodeResponse.json();

        console.log('Geocode Data:', geocodeData);

        // Extract city, town, and village fields
        let city = geocodeData.address.city || 
                     geocodeData.address.county || 
                     geocodeData.address.state_district || 
                     "Unknown Location";
        
        let town = geocodeData.address.town || 
                     geocodeData.address.village || 
                     geocodeData.address.hamlet || 
                     "";


        //Manual adjustment 
        if (city.toLowerCase() === "egor" && town.toLowerCase() === "ugbowo"){
            city = "Benin City";
        }

        // Construct displayCity with both town and city
        const displayCity = town && city && town !== city 
            ? `${town}, ${city}`
            : town || city;
         
        const apikey = '1302403fb89a48f6977132043242207';
        const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${apikey}&q=${city}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.error) {
            showAlert(data.error.message || 'Failed to fetch weather data');
            return null;
        }

        const temperatureCelsius = data.current.temp_c;
        const description = data.current.condition.text;

        return { displayCity, temperature: temperatureCelsius, description};

    } catch(error){
        console.error('Error fetching weather data:', error.message);
        showAlert('Failed to fetch weather data. Please try again');
    }
    
};


const showAlert = (message) => {
    if (Platform.OS === 'web') {
        window.alert(message);
    } else {
        Alert.alert('Error', message);
    }
};

export const getWeather = async (city) => {
    try{
        const apikey = '1302403fb89a48f6977132043242207';
        const apiUrl  = `https://api.weatherapi.com/v1/current.json?key=${apikey}&q=${city}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        //Check if the response contains an error message
        if (data.error) {
            if (data.error.code === 1006) {  // 1006 is a common code for "city not found"
                showAlert('City not found. Please enter a valid city name.');
            } else {
                showAlert(data.error.message || 'Failed to fetch weather data.');
            }
            return null;
        }

        //Extract tempertaure and weather descrpition from the API response
        const temperatureCelsius = data.current.temp_c;
        const description = data.current.condition.text;

        return { temperature: temperatureCelsius, description};
    }catch (error){
        console.error('Error fetching weather data:', error.message);
        showAlert('Error', 'Failed to fetch weather data. Please try again.');
    }
};

export const getForecast = async (city, type) => {
    try{
        const apikey = '1302403fb89a48f6977132043242207';
        let apiUrl;

        switch (type) {
            case 'hours':
                apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apikey}&q=${city}&hours=3`;
                break;
            case 'days':
                apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apikey}&q=${city}&days=3`;
                break;
            default:
                throw new Error('Invalid forecast type');
        }

        const response = await fetch(apiUrl);
        const data = await response.json();

        //Check if the response contains an error message
        if (data.error) {
            if (data.error.code === 1006) {  // 1006 is a common code for "city not found"
                showAlert('City not found. Please enter a valid city name.');
            } else {
                showAlert(data.error.message || 'Failed to fetch forecast data.');
            }
            return null;
        }

        //Extract relevant hourly & daily forecast information from the API response
        switch (type) {
            case 'hours':
                return data.forecast.forecastday[0].hour.slice(0, 3);    //Get forecast for the next 3 hours
            case 'days':
                return data.forecast.forecastday;
            default:
                return null;  
        }

    } catch (error){
        console.error('Error fetching forecast data:', error.message);
        showAlert('Error', 'Failed to fetch forecast data. Please try again.');
    }
};