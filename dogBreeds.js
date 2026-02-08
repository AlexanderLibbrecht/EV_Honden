const readline = require('readline');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const https = require('https');
const fs = require('fs');

const xhttp = new XMLHttpRequest();
// Open a GET request to the Dog API to retrieve the list of all breeds, this is done asynchronously so that the program can continue 
// running while waiting for the response

xhttp.open("GET", "https://dog.ceo/api/breeds/list/all", true);
xhttp.send();

// Create a readline interface to read user input from the console
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// The onload function is called when the HTTP request is completed and the response is received
xhttp.onload = function () {

    console.clear(); // Clear the console before printing the response
    console.log("Welcome to the Dog breed exercise!");  // Print a welcome message

    const allData = JSON.parse(this.responseText).message; // JSON object that contains all the breeds and sub-breeds retrieved from the API

    let mainBreeds = []; // Empty array to store the main breeds

    for (const mainbreed in allData) {
        mainBreeds.push(mainbreed); // Add the main breed to the array
    }

    console.log("Here are the main breeds of dogs:"); // Print a message before listing the breeds
    mainBreeds.forEach(breed => console.log(breed)); // Print each main breed with the forEach method

    promptUserforBreed(mainBreeds, allData); // Call the function to prompt the user for a breed and display
};

/**
 * promptUserforBreed is a function that prompts the user to enter a breed and checks if the entered breed is in the list of main breeds. 
 * If it is, it retrieves the sub-breeds for that breed and displays them to the user. creates a file with a picture of the first sub-breed.
 * If there are no sub-breeds, it informs the user and proceeds to get an image of the breed. creates a file with a picture of the breed.
 * If the entered breed is not in the list, it informs the user and prompts them again.
 * @param {Array} mainBreeds contains the list of main breeds retrieved from the API, used to check if the entered breed is valid and to display the list of main breeds to the user.
 * @param {Object} allData contains all the breeds and sub-breeds retrieved from the API, used to get the sub-breeds for the entered breed and to fetch the image URL for the breed or sub-breed.
 */
const promptUserforBreed = (mainBreeds, allData) => {
    // Prompt the user to enter a breed to see its sub-breeds. The answer is processed in a callback function.
    rl.question("Please enter a breed to see its sub-breeds: ", (answer) => {
        if (mainBreeds.includes(answer)) { // Check if the entered breed is in the list of main breeds
            const subBreeds = allData[answer]; // Get the sub-breeds for the entered breed
            if (subBreeds.length > 0) { // Check if there are any sub-breeds
                console.log(`The sub-breeds of ${answer} are: ${subBreeds.join(', ')}, a file will be created with a picture of the first sub-breed`); // Print the sub-breeds
                try {
                    getImageUrl(answer, subBreeds[0], getAndSaveImage); // Call the function to get and save an image of the first sub-breed. The callback function is passed as an argument to handle the image retrieval and saving process
                } catch (error) {
                    console.log(`Error}: ${error.message}`); // Log an error message if there was an issue fetching the image or the callback function
                }

            } else {
                console.log(`${answer} has no sub-breeds, but a file will be created with a picture of ${answer}`); // Inform the user if there are no sub-breeds
                try {
                    getImageUrl(answer, null, getAndSaveImage); // Call the function to get and save an image of the breed without a sub-breed. The callback function is passed as an argument to handle the image retrieval and saving process
                } catch (error) {
                    console.log(`Error}: ${error.message}`); // Log an error message if there was an issue fetching the image or the callback function
                }

            }
        } else {
            console.log("Sorry, that breed is not in the list."); // Inform the user if the breed is not found
            promptUserforBreed(mainBreeds, allData); // reprompt the user if the breed is not found
        }
    });
}

/**
 * getImageUrl is a function that takes a breed and an optional sub-breed, constructs the appropriate URL for the Dog API to fetch a random image of the
 * specified breed or sub-breed, and then calls a callback function with the retrieved image URL and a file name for saving the image.
 * @param {string} breed 
 * @param {string} subBreed 
 * @param {callback} callback The callback function to be called with the image URL and file name after 
 * fetching the image URL from the API. The callback function is responsible for handling the image retrieval and saving process, 
 * allowing for separation of concerns and modularity in the code.
    
 }} callback 
 */
const getImageUrl = (breed, subBreed, callback) => {
    let urlParameter = ''; // Initialize an empty string to hold the URL parameter for the API request
    let fileName = ''; // Initialize an empty string to hold the file name for the saved image

    if (breed && !subBreed) {
        urlParameter = breed; // If a breed is provided, use it as the URL parameter
        fileName = `${breed}.jpg`; // Set the file name to the breed name with .jpg extension
    } else if (breed && subBreed) {
        urlParameter = `${breed}/${subBreed}`; // If a sub-breed is provided, format the breed string accordingly
        fileName = `${breed}-${subBreed}.jpg`; // Set the file name to include both breed and sub-breed
    } else {
        throw new Error("No breed or sub-breed provided"); // Throw an error if neither breed nor sub-breed is provided
    }

    const url = `https://dog.ceo/api/breed/${urlParameter}/images/random`;

    const request = https.get(url, (response) => {
        let rawData = '';

        // Check for 200 OK
        if (response.statusCode !== 200) {
            console.error(`Request Failed. Status Code: ${response.statusCode}`);
            return;
        }

        // Collect the data chunks as they come in
        response.on('data', (chunk) => { rawData += chunk; });

        // The whole response has been received
        response.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                // console.log(parsedData.message); // debug only
                callback(parsedData.message, fileName); // Call the callback function with the image URL and file name for image retrieval and saving
            } catch (e) {
                console.error(e.message);
            }
        });

    });

}

/**
 * getAndSaveImage is a function that takes an image URL and a file name, downloads the image from the URL, and saves it to the local file system with the specified file name. 
 * It uses the https module to make a GET request to the image URL and the fs module to create a writable stream for saving the image.
 * @param {string} imageUrl 
 * @param {string} fileName 
 */
const getAndSaveImage = (imageUrl, fileName) => {
    const file = fs.createWriteStream(fileName);
    https.get(imageUrl, (response) => {
        response.pipe(file); // Pipe the response data directly to the file stream
        file.on('finish', () => {
            file.close(); // Close the file stream after writing is complete
            console.log(`Image saved as ${fileName}`); // Log a message indicating the image has been saved
        });

        response.on('error', (err) => {
            fs.unlink(fileName, () => { }); // Delete the file if there was an error during the download
            console.error(`Error downloading the image: ${err.message}`); // Log the error message
        });
    })
}
