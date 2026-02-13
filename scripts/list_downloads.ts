import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const targetDir = '/home/enio/Downloads/compiladochats/stitch_premium_instructor_card_v2/';

try {
    console.log(`Listing files in ${targetDir}:`);
    const files = readdirSync(targetDir);
    files.forEach(file => {
        const fullPath = join(targetDir, file);
        const stats = statSync(fullPath);
        console.log(`${stats.isDirectory() ? '[DIR]' : '[FILE]'} ${file} (${stats.size} bytes)`);
    });
} catch (error) {
    console.error('Error accessing directory:', error.message);
}
