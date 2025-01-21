import net from "net";
import path from "path";

class VideoProcessor {
    constructor() {
        this.socketPath = '/tmp/video-processor.sock';
    }

    async processVideo(inputVideo, outputPath, cardAssets) {
        return new Promise((resolve, reject) => {
            const client = net.createConnection(this.socketPath, () => {
                console.log('Connected to video processor');

                const request = {
                    input_video: inputVideo,
                    output_path: outputPath,
                    card_assets: cardAssets,
                };

                client.write(JSON.stringify(request) + '\n');
            });

            client.on('data', (data) => {
                const responses = data.toString().trim().split('\n');
                for (const response of responses) {
                    const parsed = JSON.parse(response);
                    if (parsed.status === 'completed') {
                        client.end();
                        resolve();
                    } else {
                        // Emit progress event or update status
                        console.log(`Progress: ${parsed.progress}%`);
                    }
                }
            });

            client.on('error', (err) => {
                reject(err);
            });
        });
    }
}

export default VideoProcessor;
