const sharp = require('sharp');
const fsPromises = require('fs').promises;
const path = require('path');

// Define your source and destination directories
const inputDir = path.join(__dirname, 'src', 'assets');
const outputDir = path.join(__dirname, 'src', 'optimized-assets');

// Configuration for image processing
const compressionConfig = {
  jpeg: { quality: 80 }, // Adjust quality as needed (0-100)
  png: { quality: 80 },  // Adjust quality as needed (0-100)
  webp: { quality: 80 }   // Optional: convert to WebP for better compression
};

const imageMaxWidth = 1920; // Set maximum width for images
const imageMaxHeight = 1080; // Set maximum height for images

/**
 * Main function to read, process, and save images.
 */
async function processImages() {
  try {
    // Create the output directory if it doesn't exist
    await fsPromises.mkdir(outputDir, { recursive: true });

    // Read all files from the input directory
    const files = await fsPromises.readdir(inputDir);

    console.log(`Found ${files.length} files in ${inputDir}`);

    // Process each image file
    for (const file of files) {
      const inputFile = path.join(inputDir, file);
      const outputExt = path.extname(file).toLowerCase();
      const outputFileName = path.basename(file, outputExt) + outputExt;
      const outputFile = path.join(outputDir, outputFileName);
      
      // Check if the file is an image we want to process
      if (['.jpg', '.jpeg', '.png'].includes(outputExt)) {
        console.log(`Processing: ${file}`);
        
        // Use sharp to resize and compress the image
        await sharp(inputFile)
          .resize({
            width: imageMaxWidth,
            height: imageMaxHeight,
            fit: 'inside', // Ensures the image fits within the dimensions while maintaining aspect ratio
            withoutEnlargement: true // Prevents upscaling smaller images
          })
          .jpeg(compressionConfig.jpeg) // Apply JPEG compression settings
          .toFile(outputFile);

        console.log(`Successfully compressed and saved: ${outputFile}`);
      } else {
        console.log(`Skipping non-image file: ${file}`);
      }
    }

    console.log('All images processed successfully!');
  } catch (error) {
    console.error('An error occurred during image processing:', error);
  }
}

// Run the function
processImages();
