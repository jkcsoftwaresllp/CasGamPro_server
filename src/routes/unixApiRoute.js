import express from 'express';

const router = express.Router();

router.post('/video', async (req, res) => {
    try {
        const processor = new VideoProcessor();
        await processor.processVideo(
            req.body.inputVideo,
            req.body.outputPath,
            req.body.cardAssets
        );
        res.json({ status: 'success' });
    } catch (error) {
        logger.error('Video processing error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
