// Debug script to check amenitiesList
const { amenitiesList } = require('./src/config/venueTypes.ts');

console.log('amenitiesList length:', amenitiesList?.length);
console.log('First 5 amenities:', amenitiesList?.slice(0, 5));
console.log('Is amenitiesList defined?', !!amenitiesList);
console.log('Is amenitiesList an array?', Array.isArray(amenitiesList));
