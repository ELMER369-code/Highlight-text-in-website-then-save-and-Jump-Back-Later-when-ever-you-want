// Resize icons to all required sizes
const sharp = require('sharp');
const path = require('path');

const sizes = [16, 32, 48, 128];
const inputFile = path.join(__dirname, 'icons', 'icon-128.png');

async function resizeIcons() {
    for (const size of sizes) {
        const outputFile = path.join(__dirname, 'icons', `icon-${size}.png`);

        await sharp(inputFile)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(outputFile);

        console.log(`Created: icon-${size}.png`);
    }

    console.log('\nAll icons resized successfully!');
}

resizeIcons().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
