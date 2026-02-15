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
    const allData = JSON.parse(this.responseText).message; // JSON object that contains all the breeds and sub-breeds retrieved from the API

    let mainBreeds = []; // Empty array to store the main breeds

    for (const mainbreed in allData) {
        mainBreeds.push(mainbreed); // Add the main breed to the array
    }

    console.log("Here are the main breeds of dogs:"); // Print a message before listing the breeds
    mainBreeds.forEach(breed => console.log(breed)); // Print each main breed with the forEach method

    promptUserforBreed(mainBreeds, allData, prepareUrlParameters); // Call the function to prompt the user for a breed and display all breeds. 
};

/**
 * promptUserforBreed is a function that prompts the user to enter a breed and checks if the entered breed is in the list of main breeds. 
 * If it is, it retrieves the sub-breeds for that breed and displays them to the user. 
 * If there are no sub-breeds, it informs the user and proceeds 
 * If the entered breed is not in the list, it informs the user and prompts them again.
 * @param {Array} mainBreeds contains the list of main breeds retrieved from the API, used to check if the entered breed is valid and to display the list of main breeds to the user.
 * @param {Object} allData contains all the breeds and sub-breeds retrieved from the API, used to get the sub-breeds for the entered breed and to fetch the image URL for the breed or sub-breed.
 * @param {callback} callback The callback function to be called with the breed, sub-breed, and the function to get the image URLs.
 */
const promptUserforBreed = (mainBreeds, allData, callback) => {
    // Prompt the user to enter a breed to see its sub-breeds. The answer is processed in a callback function.
    rl.question("Please enter a breed to see its sub-breeds: ", (answer) => {
        let answerClean = answer.toLowerCase().trim(); // Convert the user's input to lowercase to ensure case-insensitive matching
        if (mainBreeds.includes(answerClean)) { // Check if the entered breed is in the list of main breeds
            const subBreeds = allData[answerClean]; // Get the sub-breeds for the entered breed
            if (subBreeds.length > 0) { // Check if there are any sub-breeds
                console.log(`The sub-breeds of ${answerClean} are: ${subBreeds.join(', ')}. A web page will be created containing images of these sub-breeds.`); // Print the sub-breeds
                try {
                    callback(answerClean, subBreeds, getImageUrls); // Call the callback function to start fetching the image URLs for the breed and its sub-breeds. 
                } catch (error) {
                    console.log(`Error}: ${error.message}`); // Log an error message if there was an issue fetching the image or the callback function
                }
            } else {
                console.log(`${answerClean} has no sub-breeds, but a webpage will be created for ${answerClean}`); // Inform the user if there are no sub-breeds
                try {
                    callback(answerClean, null, getImageUrls); // Call the callback function to start fetching the image URLs for the breed without a sub-breed. 
                } catch (error) {
                    console.log(`Error}: ${error.message}`); // Log an error message if there was an issue fetching the image or the callback function
                }
            }
        } else {
            console.log("Sorry, that breed is not in the list, please try again."); // Inform the user if the breed is not found
            promptUserforBreed(mainBreeds, allData); // reprompt the user if the breed is not found
        }
    });
}

/**
 * prepareUrlParameters is a function that takes a breed and an optional sub-breed, constructs the appropriate URL parameters for the Dog API to fetch a list of
 * random images of the specified breed or sub-breed, and then calls a callback function to generate a web page with the images.
 * @param {string} breed 
 * @param {string} subBreed 
 * @param {callback} callback The callback function to be called to retrieve individual image URLs.
 */
const prepareUrlParameters = (breed, subBreed, callback) => {
    let urlParameters = []; // Initialize an empty string to hold the URL parameter for the API request
    let fileName = ''; // Initialize an empty string to hold the file name for the saved image
    let imageUrls = []; // Initialize an empty array to hold the retrieved image URLs
    if (breed && !subBreed) {
        urlParameters.push(breed); // If a breed is provided, use it as the URL parameter
        fileName = `${breed}.html`; // Set the file name to the breed name with .html extension
        imageUrls = callback(urlParameters, generateHtml);
    } else if (breed && subBreed) {
        for (let i = 0; i < subBreed.length; i++) {
            urlParameters.push(`${breed}/${subBreed[i]}`); // If a sub-breed is provided, format the breed string accordingly
        }
        fileName = `${breed}.html`; // Set the file name to the breed name with .html extension
        imageUrls = callback(urlParameters, generateHtml);
    } else {
        throw new Error("No breed or sub-breed provided"); // Throw an error if neither breed nor sub-breed is provided
    }
}


/**
 * getImageUrls is a function that takes a urlParameter and retrieves an image URL from the Dog API and returns it.
 * @param {string[]} urlParameters // The URL parameter for the API request, which specifies the breed and optional sub-breed for which to fetch the image.
 * @param {callback} callback The callback function to be called with the retrieved image URLs to generate the HTML file with the images. 
 */
const getImageUrls = (urlParameters, callback) => {

    let imageUrls = []; // Initialize an empty array to hold the retrieved image URLs

    for (let i = 0; i < urlParameters.length; i++) {
        let url = `https://dog.ceo/api/breed/${urlParameters[i]}/images/random`;

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
                    imageUrls.push(parsedData.message); // Add the retrieved image URL to the array of image URLs

                    // return parsedData.message;
                } catch (e) {
                    console.error(e.message);
                }
            });
        });
    }
    // Set a timeout to ensure that all asynchronous requests have completed before calling the callback function to generate the HTML file.
    setTimeout(() => {
        let breed = urlParameters[0].split('/')[0]; // Extract the main breed from the URL parameter for use in the file name
        let subBreeds = urlParameters.map(param => param.split('/')[1]); // Extract all sub-breeds from the URL parameters for use in the file name
        if (imageUrls.length === urlParameters.length) { // Check if all image URLs have been retrieved
            callback(imageUrls, breed, subBreeds, breed + '.html'); // Call the callback function with the retrieved image URLs to generate the HTML file with the images
        }
    }, 1500);
}

/**
 * generateHtml is a function that takes an array of image URLs, the breed, sub-breeds, and file name to generate an HTML file that displays the images of the specified breed and sub-breeds.
 * @param {string[]} imageUrls // An array of image URLs to be included in the HTML file.
 * @param {string} breed // The main breed of the dogs, used for the title and file name of the HTML file.
 * @param {string[]} subBreeds // An array of sub-breeds for the specified breed, used to create subtitles for each image in the HTML file.
 * @param {string} fileName // The name of the HTML file to be created, typically based on the breed name.
 */
const generateHtml = (imageUrls, breed, subBreeds, fileName) => {
    const title = subBreeds && subBreeds[0] ? `<h1 style="color:blue;">Enkele afbeeldingen van ${breed} honden met zijn sub rassen:</h1>` : `<h1 style="color:blue;">Een afbeelding van een ${breed} hond, deze heeft geen sub rassen:</h1>`
    let mainContent = ''; // Initialize an empty string to hold the main content of the HTML file, which will include the images and their links
    let subTitles = []; // Initialize an empty array to hold the subtitles for the images, which will indicate the breed and sub-breed of each image

    if (subBreeds && subBreeds[0]) {
        for (let i = 0; i < imageUrls.length; i++) {
            subTitles.push(imageUrls[i].split('/')[4].split('-')[1]); // Extract the sub-breed from each image URL and add it to the subTitles array
        }
        mainContent = imageUrls.map((url, index) => `<h2 style="color:green;">Sub ras: ${subTitles[index]}</h2> <img src="${url}" alt="Dog Image" style="width:300px;height:auto;margin:10px;">`).join('');
    } else {
        mainContent = imageUrls.map(url => `<img src="${url}" alt="Dog Image" style="width:300px;height:auto;margin:10px;">`).join('');
    }

    const htmlContent = `
    <!DOCTYPE html> 
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dog Images</title>
    </head>
    <body>
       ${title}
       ${mainContent}
    </body>
    </html>
    
    `;
    fs.writeFile(fileName, htmlContent, (err) => {

        if (err) {
            console.error(`Error writing HTML file: ${err.message}`);
        } else {
            console.log(`HTML file saved as ${fileName}`);
                openFile(fileName); // Call the function to open the generated HTML file in the default web browser
        }
    });

}

/**
 * openFile is a function that takes a file name as an argument and uses the child_process module to execute a command that opens the specified file in the default web browser.
 * @param {*} fileName 
 */
const openFile = (fileName) => {
    const { exec } = require('child_process');  
    exec(`start ${fileName}`, (err) => {
        if (err) {
            console.error(`Error opening file: ${err.message}`);    
        } else {
            console.log(`File ${fileName} opened successfully.`);
        }
    });
}