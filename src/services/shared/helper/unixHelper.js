async function processGameStateVideo() {
    if (this.videoState.processing) {
      return;
    }

    try {
      this.videoState.processing = true;

      const gameState = {
        gameType: this.constructor.name,
        gameId: this.gameId,
        status: this.status,
        cards: {
          jokerCard: this.jokerCard || null,
          blindCard: this.blindCard || null,
          playerA: this.collectCards("A") || [],
          playerB: this.collectCards("B") || [],
          playerC: this.collectCards("C") || [],
        },
        winner: this.winner,
        startTime: this.startTime,
      };

      const outputPath = `/tmp/game_videos/${this.gameId}.mp4`;

      await this.videoProcessor.processVideo({
        gameState,
        outputPath,
        onProgress: (progress) => {
          this.videoState.progress = progress;
          this.broadcastVideoProgress();
        }
      });

      this.videoState.outputPath = outputPath;
      this.videoState.processing = false;
      this.broadcastVideoComplete();

    } catch (error) {
      logger.error(`Video processing error for game ${this.gameId}:`, error);
      this.videoState.processing = false;
      throw error;
    }

};
