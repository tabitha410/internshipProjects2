import { StyleSheet } from "react-native";


export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centeredContent: {
        // flex: 1,
       alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 30,
    },
    input: {
        height: 40,
        flex: 1,
        width: '250px',
        borderColor: '#ffffff',
        borderWidth: 1.5,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginTop: 10,
        // marginBottom: 20,
        color: '#ffffff',
    },
    button: {
        // flexDirection: 'row',
        // alignItems: 'center',
        backgroundColor: '#1c98c9',
        paddingVertical: 10,
        paddingHorizontal: 5,
        marginLeft: 10,
        marginTop: 10,
        // padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'medium',
    },
    weatherInfo: {
        marginTop: 20,
        alignItems: 'center',
    },
    heading: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        marginTop: 10,
    },
    subheading: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        marginTop: 10,
    },
    weatherText: {
        color: '#ffffff',
        fontSize: 16,
        marginBottom: 8,
    },
    weatherText1: {
        color: '#ffffff',
        fontSize: 16,
       // marginBottom: 20,
    },
    temp: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        marginTop: 10,
    },
    weatherImage: {
        width: 100,
        height: 100,
        marginTop: 20,
    },
    InImage: {
        width: 100,
        height: 100,
        // marginBottom: 50,
    },
    backButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 5,
    },
    bbText: {
        color: 'black',
        fontWeight: 'bold',
    },
    dropdown: {
        backgroundColor: '#1c98c9',
        borderRadius: 5,
        padding: 10,
        marginTop: 10,
        width: '100%',
    },
    dropdownItem: {
        paddingVertical: 10,
    },
    dropdownItemText: {
        color: '#ffffff',
        fontSize: 16,
        textAlign: 'center',
    },   
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '90%', 
        marginBottom: 20,
    } ,
});